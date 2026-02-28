// Tauri Channels for typed event streaming
// Enables frontend to receive progress events from Rust backend

use crate::ytdlp::{self, AppSettings, YtDlpOptions};
use regex::Regex;
use serde::Serialize;
use std::collections::VecDeque;
use std::process::Stdio;
use std::sync::Arc;
use tauri::{ipc::Channel, AppHandle};
use tokio::io::{AsyncBufReadExt, BufReader as AsyncBufReader};
use tokio::process::Command;
use tokio::sync::mpsc;

// FFmpeg time= regex for realtime progress parsing during trim/clip
lazy_static::lazy_static! {
    static ref FFMPEG_TIME_RE: Regex = Regex::new(r"time=(\d+:\d+:\d+\.\d+)").unwrap();
    static ref FFMPEG_SPEED_RE: Regex = Regex::new(r"speed=\s*(\S+)x").unwrap();
}

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
// Now wrapped by retry logic
async fn perform_download_attempt(
    app: AppHandle,
    url: String,
    id: String,
    options: YtDlpOptions,
    settings: AppSettings,
    gpu_type: String,
    sender: mpsc::UnboundedSender<DownloadEvent>,
    suppress_error: bool,
) -> Result<(), String> {
    log::info!("Starting download attempt for ID: {} (URL: {})", id, url);
    log::debug!("Download Options: {:?}", options);

    // 1. Initial Event (Only send on first attempt if we tracked it, but here we just send it)
    // Actually, sending Started multiple times might reset UI, which is acceptable for a retry.
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

                // Handle download finished - transition to post-processing phase
                // FFmpeg progress is now parsed from stderr in realtime
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

                    // Send initial 80% progress to indicate trim phase started
                    // Realtime progress (80-99%) now comes from stderr FFmpeg time= parsing
                    let _ = sender_stdout.send(DownloadEvent::Progress {
                        id: id_clone.clone(),
                        percent: 80.0,
                        speed: "N/A".to_string(),
                        eta: "Processing...".to_string(),
                        total_size: "N/A".to_string(),
                        status: trim_status.to_string(),
                        speed_raw: None,
                        eta_raw: None,
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

    // Clone values for stderr handler that needs to parse FFmpeg progress
    let id_stderr = id.clone();
    let sender_stderr = sender.clone();
    let stderr_is_clipping = is_clipping;
    let stderr_clip_duration = clip_duration_secs;
    let stderr_is_audio = is_audio_mode;
    let stderr_is_gif = is_gif;

    // Spawn stderr handler (Parse FFmpeg progress for realtime trim updates)
    let stderr_handle = tokio::spawn(async move {
        let reader = AsyncBufReader::new(stderr);
        let mut lines = reader.lines();
        let mut error_buffer: VecDeque<String> = VecDeque::new();
        let mut last_percent: f64 = 0.0;

        while let Ok(Some(line)) = lines.next_line().await {
            // Parse FFmpeg time= for realtime trim progress
            if stderr_is_clipping && stderr_clip_duration > 0.0 {
                if let Some(caps) = FFMPEG_TIME_RE.captures(&line) {
                    if let Some(time_match) = caps.get(1) {
                        let time_str = time_match.as_str();
                        let current_secs = parse_time_to_seconds(Some(time_str));

                        // FFmpeg downloader does download+trim in one pass
                        // Map time= to 0-99% of total clip duration
                        let trim_progress = (current_secs / stderr_clip_duration).min(1.0);
                        let percent = (trim_progress * 99.0).min(99.0);

                        let status_text = if stderr_is_gif {
                            "Creating GIF..."
                        } else if stderr_is_audio {
                            "Processing audio..."
                        } else {
                            "Downloading & Trimming..."
                        };

                        // Throttle: only send if changed by at least 1%
                        if (percent - last_percent).abs() > 1.0 {
                            // Parse speed from same line if available
                            let speed_str = FFMPEG_SPEED_RE
                                .captures(&line)
                                .and_then(|c| c.get(1))
                                .map(|m| format!("{}x", m.as_str()))
                                .unwrap_or_else(|| "N/A".to_string());

                            let remaining_secs =
                                ((1.0 - trim_progress) * stderr_clip_duration) as u64;

                            let _ = sender_stderr.send(DownloadEvent::Progress {
                                id: id_stderr.clone(),
                                percent,
                                speed: speed_str,
                                eta: if remaining_secs > 0 {
                                    format!("~{}s", remaining_secs)
                                } else {
                                    "Finishing...".to_string()
                                },
                                total_size: "N/A".to_string(),
                                status: status_text.to_string(),
                                speed_raw: None,
                                eta_raw: Some(remaining_secs),
                            });
                            last_percent = percent;
                        }
                    }
                }
            }

            // Keep last 20 lines for error reporting
            if error_buffer.len() >= 20 {
                error_buffer.pop_front();
            }
            error_buffer.push_back(line);
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
                log::info!("Download process completed for task {}", id);
                let _ = sender.send(DownloadEvent::Completed {
                    id: id.clone(),
                    file_path: full_path_str,
                });
                Ok(())
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

                if !suppress_error {
                    let _ = sender.send(DownloadEvent::Error {
                        id: id.clone(),
                        message: error_msg.clone(),
                    });
                }
                Err(error_msg)
            }
        }
        Err(e) => {
            // In case of kill or error
            log::warn!("[Download] Process cancelled or killed (ID: {}): {}", id, e);
            let msg = format!("Process execution error or cancelled: {}", e);
            if !suppress_error {
                let _ = sender.send(DownloadEvent::Error {
                    id: id.clone(),
                    message: msg.clone(),
                });
            }
            Err(msg)
        }
    }
}

pub async fn download_media_internal(
    app: AppHandle,
    url: String,
    id: String,
    options: YtDlpOptions,
    settings: AppSettings,
    gpu_type: String,
    sender: mpsc::UnboundedSender<DownloadEvent>,
) -> Result<(), String> {
    let mut current_options = options.clone();
    let mut attempt = 0;
    const MAX_ATTEMPTS: i32 = 3;

    loop {
        attempt += 1;
        let is_last_attempt = attempt >= MAX_ATTEMPTS;

        let result = perform_download_attempt(
            app.clone(),
            url.clone(),
            id.clone(),
            current_options.clone(),
            settings.clone(),
            gpu_type.clone(),
            sender.clone(),
            !is_last_attempt, // Suppress error if we might retry
        )
        .await;

        match result {
            Ok(_) => return Ok(()),
            Err(e) => {
                if is_last_attempt {
                    return Err(e);
                }

                // Analyze Error
                let error_lower = e.to_lowercase();
                if error_lower.contains("challenge")
                    || error_lower.contains("sig function")
                    || error_lower.contains("javascript")
                {
                    let _ = sender.send(DownloadEvent::Log {
                        id: id.clone(),
                        message:
                            "JavaScript Challenge failed. Retrying without external JS runtime..."
                                .to_string(),
                        level: "warning".to_string(),
                    });
                    // Disable JS Runtime for next attempt
                    current_options.disable_js_runtime = Some(true);
                } else if error_lower.contains("error number -138")
                    || error_lower.contains("timed out")
                    || error_lower.contains("timeout")
                {
                    let _ = sender.send(DownloadEvent::Log {
                        id: id.clone(),
                        message: "Connection timed out. Retrying...".to_string(),
                        level: "warning".to_string(),
                    });
                    // Could increase timeout here if we tracked it in options
                } else {
                    // Unknown error, break and fail
                    // We suppressed the error event, so we must send it now
                    let _ = sender.send(DownloadEvent::Error {
                        id: id.clone(),
                        message: e.clone(),
                    });
                    return Err(e);
                }

                // Wait a bit before retry?
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;
            }
        }
    }
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

/// Extracted Metadata for Frontend
#[derive(Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedMetadata {
    pub id: Option<String>,
    pub title: String,
    pub duration: Option<f64>,
    pub thumbnail: Option<String>,
    pub resolutions: Vec<u32>,
    pub video_codecs: Vec<String>,
    pub audio_codecs: Vec<String>,
    pub audio_bitrates: Vec<u32>,
    pub is_generic: bool,
    pub filesize: Option<f64>,
    pub filesize_approx: Option<f64>,
    pub view_count: Option<u64>,
    pub upload_date: Option<String>,
    pub uploader: Option<String>,
    pub description: Option<String>,
    pub formats: Vec<serde_json::Value>,
    pub subtitles: Option<serde_json::Value>,
    pub automatic_captions: Option<serde_json::Value>,
}

/// Fetch video metadata (JSON)
#[tauri::command]
pub async fn get_video_metadata(
    app: AppHandle,
    url: String,
    settings: AppSettings,
    sites: tauri::State<'_, Arc<crate::ytdlp::SupportedSites>>,
) -> Result<ParsedMetadata, String> {
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

        // Extract summary data
        let mut resolutions = std::collections::HashSet::new();
        let mut video_codecs = std::collections::HashSet::new();
        let mut audio_codecs = std::collections::HashSet::new();
        let mut audio_bitrates = std::collections::HashSet::new();
        let mut is_generic = false;

        if let Some(extractor) = json.get("extractor").and_then(|v| v.as_str()) {
            if extractor == "generic" {
                is_generic = true;
            }
        }

        if let Some(formats) = json.get("formats").and_then(|f| f.as_array()) {
            for fmt in formats {
                // Resolution
                if let Some(h) = fmt.get("height").and_then(|v| v.as_u64()) {
                    if h > 0 {
                        resolutions.insert(h as u32);
                    }
                }
                // Video Codec
                if let Some(vc) = fmt.get("vcodec").and_then(|v| v.as_str()) {
                    if vc != "none" {
                        let v = vc.to_lowercase();
                        if v.starts_with("avc1") || v.starts_with("h264") {
                            video_codecs.insert("h264".to_string());
                        } else if v.starts_with("vp9") {
                            video_codecs.insert("vp9".to_string());
                        } else if v.starts_with("av01") {
                            video_codecs.insert("av1".to_string());
                        } else if v.starts_with("hev1")
                            || v.starts_with("hvc1")
                            || v.starts_with("hevc")
                        {
                            video_codecs.insert("hevc".to_string());
                        }
                    }
                }
                // Audio Codec
                if let Some(ac) = fmt.get("acodec").and_then(|v| v.as_str()) {
                    if ac != "none" {
                        let a = ac.to_lowercase();
                        if a.starts_with("mp4a") {
                            audio_codecs.insert("m4a".to_string());
                        } else if a.contains("opus") {
                            audio_codecs.insert("opus".to_string());
                        } else if a.contains("vorbis") {
                            audio_codecs.insert("ogg".to_string());
                        } else if a.contains("flac") {
                            audio_codecs.insert("flac".to_string());
                        } else if a.contains("wav") {
                            audio_codecs.insert("wav".to_string());
                        }
                    }
                }
                // Audio Bitrate
                if let Some(abr) = fmt.get("abr").and_then(|v| v.as_f64()) {
                    if abr > 0.0 {
                        // Bucket bitrates roughly
                        let abr_int = abr as u32;
                        let buckets = [64, 128, 192, 256, 320];
                        let mut closest = 128;
                        let mut min_diff = i32::MAX;
                        for &b in &buckets {
                            let diff = (b as i32 - abr_int as i32).abs();
                            if diff < min_diff {
                                min_diff = diff;
                                closest = b;
                            }
                        }
                        audio_bitrates.insert(closest);
                    }
                }
            }
        }

        // Sort results
        let mut sorted_res: Vec<u32> = resolutions.into_iter().collect();
        sorted_res.sort_by(|a, b| b.cmp(a)); // Descending

        // Construct response
        Ok(ParsedMetadata {
            id: json.get("id").and_then(|v| v.as_str()).map(String::from),
            title: json
                .get("title")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown")
                .to_string(),
            duration: json.get("duration").and_then(|v| v.as_f64()),
            thumbnail: json
                .get("thumbnail")
                .and_then(|v| v.as_str())
                .map(String::from),
            resolutions: sorted_res,
            video_codecs: video_codecs.into_iter().collect(),
            audio_codecs: audio_codecs.into_iter().collect(),
            audio_bitrates: audio_bitrates.into_iter().collect(),
            is_generic,

            filesize: json.get("filesize").and_then(|v| v.as_f64()),
            filesize_approx: json.get("filesize_approx").and_then(|v| v.as_f64()),
            view_count: json.get("view_count").and_then(|v| v.as_u64()),
            upload_date: json
                .get("upload_date")
                .and_then(|v| v.as_str())
                .map(String::from),
            uploader: json
                .get("uploader")
                .and_then(|v| v.as_str())
                .map(String::from),
            description: json
                .get("description")
                .and_then(|v| v.as_str())
                .map(String::from),

            formats: json
                .get("formats")
                .and_then(|f| f.as_array())
                .cloned()
                .unwrap_or_default(),
            subtitles: json.get("subtitles").cloned(),
            automatic_captions: json.get("automatic_captions").cloned(),
        })
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        Err(stderr.to_string())
    }
}
