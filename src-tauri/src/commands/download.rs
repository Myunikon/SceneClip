// Tauri Channels for typed event streaming
// Enables frontend to receive progress events from Rust backend

use crate::ytdlp::{self, AppSettings, YtDlpOptions};
use serde::Serialize;
use std::collections::HashMap;
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use std::sync::{Arc, Mutex};
use tauri::{ipc::Channel, AppHandle};
use tokio::sync::mpsc;

// Global Map to store child processes for cancellation
// Using u32 for PID
lazy_static::lazy_static! {
    static ref ACTIVE_DOWNLOADS: Arc<Mutex<HashMap<String, u32>>> = Arc::new(Mutex::new(HashMap::new()));
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
    });

    let ytdlp_path = if settings.binary_path_yt_dlp.is_empty() {
        "yt-dlp"
    } else {
        &settings.binary_path_yt_dlp
    };

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

    // We spawn blocking for synchronous metadata check
    let meta_res = tauri::async_runtime::spawn_blocking(move || {
        // Use std::process::Command
        let output = Command::new(&ytdlp_path_clone)
            .args(&["--dump-json", "--no-playlist", &url_clone])
            .output();
        output
    })
    .await
    .map_err(|e| e.to_string())?;

    match meta_res {
        Ok(output) => {
            if output.status.success() {
                if let Ok(json) = serde_json::from_slice::<serde_json::Value>(&output.stdout) {
                    meta = json;
                    if let Some(title) = meta.get("title").and_then(|t| t.as_str()) {
                        let _ = sender.send(DownloadEvent::Started {
                            id: id.clone(),
                            url: url.clone(),
                            title: Some(title.to_string()),
                        });
                    }
                }
            } else {
                let _ = sender.send(DownloadEvent::Log {
                    id: id.clone(),
                    message: "Metadata fetch failed, proceeding with defaults.".to_string(),
                    level: "warning".to_string(),
                });
            }
        }
        Err(e) => {
            let _ = sender.send(DownloadEvent::Log {
                id: id.clone(),
                message: format!("Metadata fetch execution error: {}", e),
                level: "warning".to_string(),
            });
        }
    }

    // 4. Filename Generation
    let template = if settings.filename_template.is_empty() {
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

    let _ = sender.send(DownloadEvent::Log {
        id: id.clone(),
        message: format!("Executing yt-dlp with {} args", args.len()),
        level: "info".to_string(),
    });

    // 6. Spawn Process
    let mut command = Command::new(&ytdlp_path);

    // Hide window on Windows
    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        command.creation_flags(CREATE_NO_WINDOW);
    }

    command.args(&args);
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    let mut child = command
        .spawn()
        .map_err(|e| format!("Failed to spawn yt-dlp: {}", e))?;
    let pid = child.id();

    // Store PID
    {
        let mut map = ACTIVE_DOWNLOADS.lock().unwrap();
        map.insert(id.clone(), pid);
    }

    let _ = sender.send(DownloadEvent::Log {
        id: id.clone(),
        message: format!("Process started with PID {}", pid),
        level: "info".to_string(),
    });

    let _ = sender.send(DownloadEvent::ProcessStarted {
        id: id.clone(),
        pid,
    });

    // Stream Output
    let stdout = child.stdout.take().ok_or("Failed to open stdout")?;

    let reader = BufReader::new(stdout);
    let id_clone = id.clone();
    let on_event_clone = sender.clone();

    // Spawn thread for stdout
    tauri::async_runtime::spawn_blocking(move || {
        for line in reader.lines() {
            if let Ok(l) = line {
                // PARSING LOGIC
                // SCENECLIP_PROGRESS;status;downloaded;total;total_estimate;speed;eta
                if l.starts_with("SCENECLIP_PROGRESS;") {
                    let parts: Vec<&str> = l.split(';').collect();
                    if parts.len() >= 7 {
                        let downloaded: f64 = parts[2].parse().unwrap_or(0.0);
                        let total: f64 = parts[3].parse().unwrap_or(0.0); // "NA" -> 0
                        let total_est: f64 = parts[4].parse().unwrap_or(0.0);
                        let speed_val: f64 = parts[5].parse().unwrap_or(0.0);
                        let eta_val: u64 = parts[6].parse().unwrap_or(0); // seconds

                        let final_total = if total > 0.0 { total } else { total_est };
                        let percent = if final_total > 0.0 {
                            (downloaded / final_total) * 100.0
                        } else {
                            0.0
                        };

                        // Send Progress
                        let _ = on_event_clone.send(DownloadEvent::Progress {
                            id: id_clone.clone(),
                            percent,
                            speed: format!("{:.2} MiB/s", speed_val / 1024.0 / 1024.0), // Simple format
                            eta: format!("{}s", eta_val),
                            total_size: format!("{:.2} MiB", final_total / 1024.0 / 1024.0),
                            status: "downloading".to_string(),
                            speed_raw: Some(speed_val),
                            eta_raw: Some(eta_val),
                        });
                    }
                } else if l.contains("[download] Destination:") {
                    // Capture path if needed, but we already calculated it?
                    // Yt-dlp might change extension (webm -> mkv merge)
                    // Implementation Detail: We are not capturing "merged" filename back to Rust yet.
                    // But we have full_path_str as target.
                } else if l.contains("ERROR:") {
                    let _ = on_event_clone.send(DownloadEvent::Log {
                        id: id_clone.clone(),
                        message: l,
                        level: "error".to_string(),
                    });
                }
            }
        }
    });

    // We wait for child to finish here (async)
    // but spawn_blocking takes closure

    let res = tauri::async_runtime::spawn_blocking(move || child.wait())
        .await
        .map_err(|e| e.to_string())?;

    // Cleanup PID
    {
        let mut map = ACTIVE_DOWNLOADS.lock().unwrap();
        map.remove(&id);
    }

    match res {
        Ok(status) => {
            if status.success() {
                let _ = sender.send(DownloadEvent::Completed {
                    id: id.clone(),
                    file_path: full_path_str,
                });
            } else {
                let _ = sender.send(DownloadEvent::Error {
                    id: id.clone(),
                    message: format!("Process exited with code {:?}", status.code()),
                });
            }
        }
        Err(e) => {
            let _ = sender.send(DownloadEvent::Error {
                id: id.clone(),
                message: format!("Process execution error: {}", e),
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

#[tauri::command]
pub async fn cancel_download(id: String) -> Result<(), String> {
    let pid = {
        let map = ACTIVE_DOWNLOADS.lock().unwrap();
        map.get(&id).cloned()
    };

    if let Some(p) = pid {
        #[cfg(target_os = "windows")]
        {
            // Kill process tree on Windows
            let _ = Command::new("taskkill")
                .args(&["/F", "/PID", &p.to_string(), "/T"])
                .output();
        }
        #[cfg(not(target_os = "windows"))]
        {
            let _ = Command::new("kill").args(&["-9", &p.to_string()]).output();
        }
    }

    Ok(())
}
