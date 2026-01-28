// Tauri Channels for typed event streaming
// Enables frontend to receive progress events from Rust backend

use serde::Serialize;
use tauri::ipc::Channel;

/// Download event types for channel streaming
#[derive(Clone, Serialize)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
#[allow(dead_code)] // Variants are scaffolded for future yt-dlp integration
pub enum DownloadEvent {
    /// Download started with initial metadata
    #[serde(rename_all = "camelCase")]
    Started {
        id: String,
        url: String,
        title: Option<String>,
    },
    /// Progress update during download
    #[serde(rename_all = "camelCase")]
    Progress {
        id: String,
        percent: f64,
        speed: f64,         // bytes per second
        eta: i64,           // seconds remaining
        downloaded: u64,    // bytes downloaded
        total: Option<u64>, // total bytes (if known)
    },
    /// Post-processing phase (merging, encoding, etc.)
    #[serde(rename_all = "camelCase")]
    Processing {
        id: String,
        status: String, // e.g., "Merging...", "Encoding..."
    },
    /// Download completed successfully
    #[serde(rename_all = "camelCase")]
    Completed {
        id: String,
        file_path: String,
        file_size: u64,
    },
    /// Download failed with error
    #[serde(rename_all = "camelCase")]
    Error { id: String, message: String },
    /// Download was cancelled
    #[serde(rename_all = "camelCase")]
    Cancelled { id: String },
}

/// Initialize a download with channel-based progress streaming
///
/// This command demonstrates the Tauri Channel pattern:
/// 1. Frontend creates a Channel<DownloadEvent>
/// 2. Frontend passes channel via invoke
/// 3. Backend sends typed events via channel.send()
///
/// Example TypeScript usage:
/// ```typescript
/// const channel = new Channel<DownloadEvent>();
/// channel.onmessage = (msg) => {
///   if (msg.event === 'progress') {
///     updateTask(msg.data.id, { progress: msg.data.percent });
///   }
/// };
/// await invoke('download_with_channel', { url, options, onEvent: channel });
/// ```
#[tauri::command]
pub async fn download_with_channel(
    url: String,
    id: String,
    on_event: Channel<DownloadEvent>,
) -> Result<(), String> {
    // Send started event
    on_event
        .send(DownloadEvent::Started {
            id: id.clone(),
            url: url.clone(),
            title: None,
        })
        .map_err(|e| e.to_string())?;

    // NOTE: In production, this would spawn the yt-dlp process and parse stdout
    // For now, this is a demonstration of the channel pattern
    //
    // Example integration with yt-dlp subprocess:
    // ```rust
    // let mut child = Command::new("yt-dlp")
    //     .args(&["--progress-template", "SCENECLIP_PROGRESS;..."])
    //     .spawn()?;
    //
    // for line in child.stdout.lines() {
    //     if line.starts_with("SCENECLIP_PROGRESS;") {
    //         let event = parse_progress_line(&line, &id);
    //         on_event.send(event)?;
    //     }
    // }
    // ```

    // Simulate completion for demonstration
    on_event
        .send(DownloadEvent::Completed {
            id: id.clone(),
            file_path: "example.mp4".to_string(),
            file_size: 0,
        })
        .map_err(|e| e.to_string())?;

    Ok(())
}

/// Helper command to cancel a download by ID
/// In production, this would terminate the subprocess
#[tauri::command]
pub async fn cancel_download(id: String) -> Result<(), String> {
    // TODO: Implement process termination
    // This would look up the child process by ID and terminate it
    println!("Cancel download requested for: {}", id);
    Ok(())
}
