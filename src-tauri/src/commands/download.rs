// Tauri Channels for typed event streaming
// Enables frontend to receive progress events from Rust backend

use crate::ytdlp::{self, AppSettings, YtDlpOptions};
use serde::Serialize;
use std::collections::VecDeque;
use std::process::Stdio;
use std::sync::atomic::{AtomicBool, Ordering};
use std::sync::Arc;
use std::time::{Duration, Instant};
use tauri::{ipc::Channel, AppHandle};
use tokio::io::{AsyncBufReadExt, BufReader as AsyncBufReader};
use tokio::process::Command;
use tokio::sync::mpsc;

// SCENECLIP_PROGRESS Format:
const SCENECLIP_IDX_DOWNLOADED: usize = 2;
const SCENECLIP_IDX_TOTAL: usize = 3;
const SCENECLIP_IDX_TOTAL_EST: usize = 4;
const SCENECLIP_IDX_SPEED: usize = 5;
const SCENECLIP_IDX_ETA: usize = 6;

/// Parse time string (HH:MM:SS, MM:SS, or SS) to seconds
fn parse_time_to_seconds(time_str: Option<&str>) -> f64 {
    let s = match time_str {
        Some(t) => t.trim(),
        None => return 0.0,
    };

    if s.is_empty() || s == "inf" {
        return 0.0;
    }

    let parts: Vec<&str> = s.split(':').collect();
    match parts.len() {
        1 => parts[0].parse::<f64>().unwrap_or(0.0),
        2 => {
            let mins: f64 = parts[0].parse().unwrap_or(0.0);
            let secs: f64 = parts[1].parse().unwrap_or(0.0);
            mins * 60.0 + secs
        }
        3 => {
            let hrs: f64 = parts[0].parse().unwrap_or(0.0);
            let mins: f64 = parts[1].parse().unwrap_or(0.0);
            let secs: f64 = parts[2].parse().unwrap_or(0.0);
            hrs * 3600.0 + mins * 60.0 + secs
        }
        _ => 0.0,
    }
}

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
    log::info!("Starting download for ID: {} (URL: {})", id, url);
    log::debug!("Download Options: {:?}", options);

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
                log::warn!(
                    "[Download] Metadata fetch failed for URL: {}, using defaults",
                    url
                );
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
    // Prioritize custom_filename for display title, fallback to metadata title
    let display_title = options
        .custom_filename
        .as_ref()
        .filter(|s| !s.is_empty())
        .cloned()
        .or_else(|| {
            meta.get("title")
                .and_then(|t| t.as_str())
                .map(|t| t.to_string())
        });

    let _ = sender.send(DownloadEvent::Started {
        id: id.clone(),
        url: url.clone(),
        title: display_title,
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

    let mut child = command.spawn().map_err(|e| {
        let err_msg = format!("Failed to spawn yt-dlp: {}", e);
        log::error!("{}", err_msg);
        err_msg
    })?;

    log::info!("yt-dlp process spawned successfully for task {}", id);

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
    let is_clipping = options.range_start.is_some() || options.range_end.is_some();
    let is_gif = options.format.as_deref() == Some("gif");
    let expect_pp = is_audio_mode
        || is_gif
        || is_clipping  // FFmpeg trim also counts as post-processing
        || options.container.is_some()
        || settings.embed_metadata
        || settings.embed_thumbnail
        || settings.embed_chapters
        || options.subtitles.unwrap_or(false)
        || options.audio_normalization.unwrap_or(false)
        || options.format.is_none() // Default: bestvideo+bestaudio -> merge
        || options.format.as_deref() == Some("best");

    // Calculate clip duration for accurate progress estimation
    let clip_duration_secs = if is_clipping {
        let start_secs = parse_time_to_seconds(options.range_start.as_deref());
        let end_secs = parse_time_to_seconds(options.range_end.as_deref());
        // If end is 0 (inf or not set), estimate 60s default
        let actual_end = if end_secs > 0.0 {
            end_secs
        } else {
            start_secs + 60.0
        };
        (actual_end - start_secs).max(1.0)
    } else {
        0.0
    };

    // GPU-aware encoding speed multiplier (realtime multiplier)
    // GPU: ~3x realtime, CPU: ~1x realtime, Copy codec: ~10x realtime
    let encode_speed_multiplier = match gpu_type.as_str() {
        "nvidia" | "amd" | "intel" | "apple" => 3.0,
        _ => 1.0,
    };
    // If video copy (not transcoding), it's much faster
    let final_encode_speed = if !options.force_transcode.unwrap_or(false)
        && !options.audio_normalization.unwrap_or(false)
        && !is_gif
    {
        encode_speed_multiplier * 5.0 // Copy is ~5x faster than encode
    } else {
        encode_speed_multiplier
    };
    let estimated_encode_time = if clip_duration_secs > 0.0 {
        (clip_duration_secs / final_encode_speed).max(2.0) // Minimum 2 seconds
    } else {
        10.0 // Default 10s for non-clipping post-processing
    };

    // Shared cancellation flag for timer task - stops timer when process completes
    let timer_cancel = Arc::new(AtomicBool::new(false));
    let timer_cancel_clone = timer_cancel.clone();

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

                    // Cap at 80% during download if post-processing is expected
                    // This leaves 20% (80-100%) for post-processing phase
                    if expect_pp && !is_post_processing && percent > 80.0 {
                        percent = 80.0;
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

                // Handle download finished - start timer-based progress for clipping/trimming
                // yt-dlp emits "finished" status when download completes, before FFmpeg trim
                if parts.len() >= 2 && parts[1] == "finished" && is_clipping && !is_post_processing
                {
                    is_post_processing = true; // Prevent duplicate progress events
                    let trim_status = if is_gif {
                        "Creating GIF..."
                    } else if is_audio_mode {
                        "Processing audio..."
                    } else {
                        "Trimming video..."
                    };

                    // Start timer-based progress updates (80% -> 99%)
                    let start_time = Instant::now();
                    let sender_timer = sender_stdout.clone();
                    let id_timer = id_clone.clone();
                    let status_timer = trim_status.to_string();
                    let cancel_flag = timer_cancel_clone.clone();

                    // Spawn timer task for smooth progress updates
                    tokio::spawn(async move {
                        loop {
                            // Check if cancelled (process completed)
                            if cancel_flag.load(Ordering::Relaxed) {
                                break;
                            }

                            let elapsed = start_time.elapsed().as_secs_f64();
                            // Progress from 80% to 99% based on elapsed time
                            let progress_ratio = (elapsed / estimated_encode_time).min(1.0);
                            let current_percent = 80.0 + (progress_ratio * 19.0); // 80% + up to 19%

                            let remaining_secs = (estimated_encode_time - elapsed).max(0.0) as u64;

                            let _ = sender_timer.send(DownloadEvent::Progress {
                                id: id_timer.clone(),
                                percent: current_percent,
                                speed: "N/A".to_string(),
                                eta: if remaining_secs > 0 {
                                    format!("~{}s", remaining_secs)
                                } else {
                                    "Finishing...".to_string()
                                },
                                total_size: "N/A".to_string(),
                                status: status_timer.clone(),
                                speed_raw: None,
                                eta_raw: Some(remaining_secs),
                            });

                            if progress_ratio >= 1.0 {
                                break; // Stop when estimated time reached
                            }

                            tokio::time::sleep(Duration::from_millis(500)).await;
                        }
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

    // Cancel any running timer task
    timer_cancel.store(true, Ordering::Relaxed);

    // Wait for streams (ignore errors from them closing)
    let _ = stdout_handle.await;
    let error_buffer = stderr_handle.await.unwrap_or_default();

    // Status updates handle the rest

    match status_res {
        Ok(status) => {
            if status.success() {
                log::info!("Download process completed for task {}", id);
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

                log::error!("[Download] Failed (ID: {}): {}", id, error_msg);
                let _ = sender.send(DownloadEvent::Error {
                    id: id.clone(),
                    message: error_msg,
                });
            }
        }
        Err(e) => {
            // In case of kill or error
            log::warn!("[Download] Process cancelled or killed (ID: {}): {}", id, e);
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
