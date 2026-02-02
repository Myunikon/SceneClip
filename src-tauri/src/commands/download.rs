// Tauri Channels for typed event streaming
// Enables frontend to receive progress events from Rust backend

use crate::ytdlp::{self, AppSettings, YtDlpOptions};
use serde::Serialize;
use std::collections::VecDeque;
use std::process::Stdio;
use std::sync::Arc;
use tauri::{ipc::Channel, AppHandle};
use tokio::io::{AsyncBufReadExt, BufReader as AsyncBufReader};
use tokio::process::Command;
use tokio::sync::mpsc;

// SCENECLIP_PROGRESS Format:
// SCENECLIP_PROGRESS;<timestamp>;<downloaded_bytes>;<total_bytes>;<total_estimated>;<speed_bps>;<eta_seconds>
const SCENECLIP_IDX_DOWNLOADED: usize = 2;
const SCENECLIP_IDX_TOTAL: usize = 3;
const SCENECLIP_IDX_TOTAL_EST: usize = 4;
const SCENECLIP_IDX_SPEED: usize = 5;
const SCENECLIP_IDX_ETA: usize = 6;

/// Download event types for channel streaming
#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum DownloadEvent {
    /// Download started with initial metadata
    #[serde(rename_all = "camelCase")]
    Started {
        id: String,
        url: String,
        title: Option<String>,
        // NEW: Send generated command to frontend
        ytdlp_command: Option<String>,
        file_path: Option<String>,
    },
    /// Process spawned with PID
    #[serde(rename_all = "camelCase")]
    ProcessStarted { id: String, pid: u32 },
    /// Progress update during download
    #[serde(rename_all = "camelCase")]
    Progress {
        id: String,
        percent: f64,
        speed: String, // pre-formatted string
        eta: String,
        total_size: String,
        status: String,
        // Raw values for calculations
        speed_raw: Option<f64>,
        eta_raw: Option<u64>,
    },
    /// Log message
    #[serde(rename_all = "camelCase")]
    Log {
        id: String,
        message: String,
        level: String, // 'info', 'warning', 'error'
    },
    /// Download completed successfully
    #[serde(rename_all = "camelCase")]
    Completed { id: String, file_path: String },
    /// Download failed with error
    #[serde(rename_all = "camelCase")]
    Error { id: String, message: String },
    /// Download was cancelled
    #[serde(rename_all = "camelCase")]
    #[allow(dead_code)]
    Cancelled { id: String },
}

// Internal function callable by Queue
pub async fn download_media_internal(
    app: AppHandle,
    url: String,
    id: String,
    options: YtDlpOptions,
    settings: AppSettings,
    gpu_type: String,
    sender: mpsc::UnboundedSender<DownloadEvent>,
) -> Result<(), String> {
    // 1. Initial Event
    let _ = sender.send(DownloadEvent::Started {
        id: id.clone(),
        url: url.clone(),
        title: None,
        ytdlp_command: None,
        file_path: None,
    });

    let ytdlp_path = ytdlp::resolve_ytdlp_path(&app, &settings.binary_path_yt_dlp);

    let _ = sender.send(DownloadEvent::Log {
        id: id.clone(),
        message: "Fetching metadata...".to_string(),
        level: "info".to_string(),
    });

    // Quick Metadata Fetch
    let mut meta = serde_json::json!({
        "title": "Unknown Video",
        "ext": "mp4" // valid default
    });

    let url_clone = url.clone();
    let ytdlp_path_clone = ytdlp_path.to_string();

    // Async Metadata Fetch
    let meta_res = async {
        let mut std_cmd = std::process::Command::new(&ytdlp_path_clone);
        std_cmd.args(&["--dump-json", "--no-playlist", &url_clone]);

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            std_cmd.creation_flags(0x08000000);
        }

        let mut cmd = Command::from(std_cmd);

        // IMPORTANT: Ensure it dies if we drop this future (cancellation)
        cmd.kill_on_drop(true);

        cmd.output().await
    }
    .await
    .map_err(|e| e.to_string())?;

    match meta_res {
        output => {
            if output.status.success() {
                if let Ok(json) = serde_json::from_slice::<serde_json::Value>(&output.stdout) {
                    meta = json;
                    if let Some(_title) = meta.get("title").and_then(|t| t.as_str()) {
                        // We check title, but we don't send Started again just yet
                        // We will send Started with command later
                    }
                }
            } else {
                let _ = sender.send(DownloadEvent::Log {
                    id: id.clone(),
                    message: "Metadata fetch failed, proceeding with default values.".to_string(),
                    level: "warning".to_string(),
                });
            }
        }
    }

    // 4. Filename Generation
    let template = if let Some(ref custom) = options.custom_filename {
        // PRIORITASKAN custom_filename dari options
        custom.as_str()
    } else if settings.filename_template.is_empty() {
        "{title}"
    } else {
        &settings.filename_template
    };
    let final_name = ytdlp::sanitize_filename(template, &meta, &options);

    // Check Download Path
    let base_dir = if let Some(p) = &options.path {
        p.clone()
    } else {
        settings.download_path.clone()
    };
    if base_dir.is_empty() {
        return Err("Download path not set".to_string());
    }

    // Combine path
    let full_path = std::path::Path::new(&base_dir).join(&final_name);
    let full_path_str = full_path.to_string_lossy().to_string();

    // 5. Build Args
    let args =
        ytdlp::build_ytdlp_args(&url, &options, &settings, &full_path_str, &gpu_type, &app).await;

    // Construct full command string for UI
    let full_command_string = format!("{} {}", ytdlp_path, args.join(" "));
    log::info!("[Download] Spawning yt-dlp: {}", full_command_string);

    // Send updated Started event with command
    let _ = sender.send(DownloadEvent::Started {
        id: id.clone(),
        url: url.clone(),
        title: meta
            .get("title")
            .and_then(|t| t.as_str())
            .map(|t| t.to_string()),
        ytdlp_command: Some(full_command_string),
        file_path: Some(full_path_str.clone()),
    });

    let _ = sender.send(DownloadEvent::Log {
        id: id.clone(),
        message: format!("Executing yt-dlp with {} args", args.len()),
        level: "info".to_string(),
    });

    // 6. Spawn Process (Async)
    let mut std_command = std::process::Command::new(&ytdlp_path);

    // Hide window on Windows
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        std_command.creation_flags(CREATE_NO_WINDOW);
    }

    let mut command = Command::from(std_command);

    command.args(&args);
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    // CRITICAL: This ensures that if the tokio task is aborted (cancelled),
    // the child process is automatically killed.
    command.kill_on_drop(true);

    let mut child = command
        .spawn()
        .map_err(|e| format!("Failed to spawn yt-dlp: {}", e))?;

    let pid = child.id().unwrap_or(0);

    let _ = sender.send(DownloadEvent::ProcessStarted {
        id: id.clone(),
        pid,
    });

    // Stream Output (Concurrent stdout/stderr)
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;

    let id_clone = id.clone();
    let sender_stdout = sender.clone();

    // Smart Capping: Expect post-processing for merges, audio extraction, or specific enhancements
    let is_audio_mode = options.format.as_deref() == Some("audio")
        || (options.format.is_none() && options.audio_format.is_some());
    let expect_pp = is_audio_mode
        || options.format.as_deref() == Some("gif")
        || options.container.is_some()
        || settings.embed_metadata
        || settings.embed_thumbnail
        || settings.embed_chapters
        || options.subtitles.unwrap_or(false)
        || options.audio_normalization.unwrap_or(false)
        || options.format.is_none() // Default: bestvideo+bestaudio -> merge
        || options.format.as_deref() == Some("best");

    // Spawn stdout handler
    let stdout_handle = tokio::spawn(async move {
        let reader = AsyncBufReader::new(stdout);
        let mut lines = reader.lines();
        let mut is_post_processing = false;

        while let Ok(Some(line)) = lines.next_line().await {
            if line.contains("SCENECLIP_DL;") {
                let parts: Vec<&str> = line.split(';').collect();
                if parts.len() >= 7 {
                    let downloaded: f64 = parts[SCENECLIP_IDX_DOWNLOADED].parse().unwrap_or(0.0);
                    let total: f64 = parts[SCENECLIP_IDX_TOTAL].parse().unwrap_or(0.0);
                    let total_est: f64 = parts[SCENECLIP_IDX_TOTAL_EST].parse().unwrap_or(0.0);
                    let speed_val: f64 = parts[SCENECLIP_IDX_SPEED].parse().unwrap_or(0.0);
                    let eta_val: u64 = parts[SCENECLIP_IDX_ETA].parse().unwrap_or(0);

                    let final_total = if total > 0.0 { total } else { total_est };
                    let mut percent = if final_total > 0.0 {
                        (downloaded / final_total) * 100.0
                    } else {
                        0.0
                    };

                    // ETA Lying Protection: If we expect a merge, add 30% buffer during download phase
                    let mut total_eta = eta_val as f64;
                    if expect_pp && !is_post_processing {
                        total_eta *= 1.3;
                    }

                    // Cap at 90% during download if post-processing is expected
                    if expect_pp && !is_post_processing && percent > 90.0 {
                        percent = 90.0;
                    }

                    let _ = sender_stdout.send(DownloadEvent::Progress {
                        id: id_clone.clone(),
                        percent,
                        speed: format!("{:.2} MiB/s", speed_val / 1024.0 / 1024.0),
                        eta: format!("{}s", total_eta as u64),
                        total_size: format!("{:.2} MiB", final_total / 1024.0 / 1024.0),
                        status: "downloading".to_string(),
                        speed_raw: Some(speed_val),
                        eta_raw: Some(total_eta as u64),
                    });
                }
            } else if line.contains("SCENECLIP_PP;") {
                is_post_processing = true;
                let parts: Vec<&str> = line.split(';').collect();
                if parts.len() >= 3 {
                    let status_detail = parts[2].to_string();
                    let display_status = match status_detail.as_str() {
                        "FFmpegMerger" => "Merging streams...",
                        "FFmpegExtractAudio" => "Extracting audio...",
                        "FFmpegEmbedSubtitle" => "Embedding subtitles...",
                        "FFmpegVideoConvertor" => "Converting video...",
                        "FFmpegMetadata" => "Adding metadata...",
                        _ => "Post-processing...",
                    };

                    let _ = sender_stdout.send(DownloadEvent::Progress {
                        id: id_clone.clone(),
                        percent: 95.0,
                        speed: "N/A".to_string(),
                        eta: "Calculating...".to_string(),
                        total_size: "N/A".to_string(),
                        status: display_status.to_string(),
                        speed_raw: None,
                        eta_raw: None,
                    });
                }
            } else {
                // Stream other messages (Extractor logs, warnings, etc) to UI
                let _ = sender_stdout.send(DownloadEvent::Log {
                    id: id_clone.clone(),
                    message: line,
                    level: "info".to_string(),
                });
            }
        }
    });

    // Spawn stderr handler (Capture last lines)
    let stderr_handle = tokio::spawn(async move {
        let reader = AsyncBufReader::new(stderr);
        let mut lines = reader.lines();
        let mut error_buffer: VecDeque<String> = VecDeque::new();

        while let Ok(Some(line)) = lines.next_line().await {
            // Keep last 20 lines
            if error_buffer.len() >= 20 {
                error_buffer.pop_front();
            }
            error_buffer.push_back(line.clone());
        }
        error_buffer
    });

    // Wait for process to exit
    let status_res = child.wait().await;

    // Wait for streams (ignore errors from them closing)
    let _ = stdout_handle.await;
    let error_buffer = stderr_handle.await.unwrap_or_default();

    // Status updates handle the rest

    match status_res {
        Ok(status) => {
            if status.success() {
                let _ = sender.send(DownloadEvent::Completed {
                    id: id.clone(),
                    file_path: full_path_str,
                });
            } else {
                // Construct error message from stderr
                let error_msg = if error_buffer.is_empty() {
                    format!("Process exited with code {:?}", status.code())
                } else {
                    error_buffer
                        .iter()
                        .cloned()
                        .collect::<Vec<String>>()
                        .join("\n")
                };

                let _ = sender.send(DownloadEvent::Error {
                    id: id.clone(),
                    message: error_msg,
                });
            }
        }
        Err(e) => {
            // In case of kill or error
            let _ = sender.send(DownloadEvent::Error {
                id: id.clone(),
                message: format!("Process execution error or cancelled: {}", e),
            });
        }
    }

    Ok(())
}

#[tauri::command]
pub async fn download_with_channel(
    app: AppHandle,
    url: String,
    id: String,
    options: YtDlpOptions,
    settings: AppSettings,
    gpu_type: String, // Added argument
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    let (tx, mut rx) = mpsc::unbounded_channel::<DownloadEvent>();

    // Bridge: Forward mpsc events to Tauri Channel
    tokio::spawn(async move {
        while let Some(event) = rx.recv().await {
            let _ = on_event.send(event);
        }
    });

    download_media_internal(app, url, id, options, settings, gpu_type, tx).await
}

pub async fn cancel_download_internal(
    id: String,
    state: Arc<crate::download_queue::QueueState>,
) -> Result<(), String> {
    let mut handles = state
        .abort_handles
        .lock()
        .unwrap_or_else(|e| e.into_inner());
    if let Some(handle) = handles.remove(&id) {
        handle.abort();
    }
    Ok(())
}

#[tauri::command]
pub async fn cancel_download(
    id: String,
    state: tauri::State<'_, Arc<crate::download_queue::QueueState>>,
) -> Result<(), String> {
    cancel_download_internal(id, state.inner().clone()).await
}

/// Debug Support: Get the generated args for verification
#[tauri::command]
pub async fn get_download_args(
    app: AppHandle,
    url: String,
    options: YtDlpOptions,
    settings: AppSettings,
    final_filename: String,
    gpu_type: String,
) -> Result<Vec<String>, String> {
    let args =
        ytdlp::build_ytdlp_args(&url, &options, &settings, &final_filename, &gpu_type, &app).await;
    Ok(args)
}

/// Fetch video metadata (JSON)
#[tauri::command]
pub async fn get_video_metadata(
    app: AppHandle,
    url: String,
    settings: AppSettings,
    sites: tauri::State<'_, Arc<crate::ytdlp::SupportedSites>>,
) -> Result<serde_json::Value, String> {
    // Whitelist check
    if !sites.matches(&url) {
        return Err("URL not in supported sites list".to_string());
    }
    let ytdlp_path = ytdlp::resolve_ytdlp_path(&app, &settings.binary_path_yt_dlp);

    let mut cmd = std::process::Command::new(ytdlp_path);
    cmd.args(&["--dump-json", "--no-playlist", "--no-warnings", &url]);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000);
    }

    let output = cmd
        .output()
        .map_err(|e| format!("Failed to execute yt-dlp: {}", e))?;

    if output.status.success() {
        let json: serde_json::Value = serde_json::from_slice(&output.stdout)
            .map_err(|e| format!("Failed to parse JSON: {}", e))?;
        Ok(json)
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(stderr.to_string())
    }
}
