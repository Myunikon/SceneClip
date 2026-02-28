use crate::download_queue::{DownloadTask, QueueState, TaskStatus};
use crate::ytdlp::{SupportedSites, YtDlpOptions};
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn add_to_queue(
    state: State<'_, Arc<QueueState>>,
    app: tauri::AppHandle,
    url: String,
    options: YtDlpOptions,
    sites: State<'_, Arc<SupportedSites>>,
) -> Result<String, String> {
    // VALIDATE URL against supported sites FIRST
    if !sites.matches(&url) {
        log::warn!("[Queue] Rejected unsupported URL: {}", url);
        return Err(format!(
            "URL not supported. This site is not in the yt-dlp supported sites list."
        ));
    }

    let id = uuid::Uuid::new_v4().to_string();

    log::info!("User added new task to queue: {} (ID: {})", url, id);

    // We construct the task
    // Note: 'title', 'speed', etc. are just placeholders initially
    let task = DownloadTask {
        id: id.clone(),
        url,
        title: "Queued...".to_string(),
        status: TaskStatus::Pending,
        progress: 0.0,
        speed: Some("-".to_string()),
        eta: Some("-".to_string()),
        path: options.path.clone().unwrap_or_default(),
        error_message: None,
        added_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        // New fields initialized to None
        pid: None,
        status_detail: None,
        eta_raw: None,
        speed_raw: None,
        total_size: None,
        range: None,
        format: options.format.clone(),
        file_path: None,
        // Frontend sends scheduledTime in milliseconds (JS Date.getTime()),
        // but queue processor compares against seconds (.as_secs()), so convert ms -> s
        scheduled_time: options.scheduled_time.map(|ms| ms / 1000),
        retry_count: Some(0),
        ytdlp_command: None,
        file_size: None,
        completed_at: None,
        options,
    };

    state.add_task(task, &app);
    Ok(id)
}

#[tauri::command]
pub async fn remove_from_queue(
    state: State<'_, Arc<QueueState>>,
    app: tauri::AppHandle,
    id: String,
) -> Result<(), String> {
    // Scope the lock to ensure it is dropped before awaiting
    // Now returns Option<DownloadTask> so we can cleanup files
    let removed_task_opt = state.remove_task(&id, &app);

    if let Some(task) = removed_task_opt {
        log::info!("User removed task: {} (URL: {})", id, task.url);
        // 1. Process Cancellation (Force Kill)
        let _ =
            crate::commands::download::cancel_download_internal(id, state.inner().clone()).await;

        // 2. File Cleanup
        if let Some(path_str) = task.file_path {
            let path = std::path::Path::new(&path_str);
            let mut candidates = Vec::new();

            // ONLY remove the main file if it's NOT completed or stopped.
            // If it IS completed, the user might want to keep it even if removing from history.
            if !matches!(task.status, TaskStatus::Completed | TaskStatus::Stopped) {
                candidates.push(path.to_path_buf());
            }

            // Always try to remove partial/temp files associated with this download
            // Pattern 1: .part appended to full name (yt-dlp default)
            // e.g. "video.mp4.part"
            if let Some(file_name) = path.file_name() {
                if let Some(parent) = path.parent() {
                    // specific yt-dlp part file: video.mp4.part
                    candidates.push(parent.join(format!("{}.part", file_name.to_string_lossy())));
                    // specific yt-dlp meta file: video.mp4.ytdl
                    candidates.push(parent.join(format!("{}.ytdl", file_name.to_string_lossy())));

                    // Also try replacing extension (rare but possible depending on config)
                    // e.g. video.part instead of video.mp4 (if temp-filename configured differently)
                    if let Some(stem) = path.file_stem() {
                        candidates.push(parent.join(format!("{}.part", stem.to_string_lossy())));
                    }
                }
            }

            for p in candidates {
                // remove_file returns error if file doesn't exist, which we can safely ignore
                // This atomic attempt is safer than checking exists() first (TOCTOU)
                let _ = std::fs::remove_file(p);
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn pause_task(
    state: State<'_, Arc<QueueState>>,
    app: tauri::AppHandle,
    id: String,
) -> Result<(), String> {
    log::info!("User paused task: {}", id);
    state.pause_task(&id, &app)
}

#[tauri::command]
pub async fn resume_task(
    state: State<'_, Arc<QueueState>>,
    app: tauri::AppHandle,
    id: String,
) -> Result<(), String> {
    log::info!("User resumed task: {}", id);
    state.resume_task(&id, &app)
}

#[tauri::command]
pub async fn pause_queue(_state: State<'_, Arc<QueueState>>) -> Result<(), String> {
    // TODO: implement global pause
    Ok(())
}

#[tauri::command]
pub async fn resume_queue(state: State<'_, Arc<QueueState>>) -> Result<(), String> {
    // TODO: implement global resume
    state.notify.notify_one();
    Ok(())
}

#[tauri::command]
pub async fn get_queue_state(
    state: State<'_, Arc<QueueState>>,
) -> Result<Vec<DownloadTask>, String> {
    let tasks = state.tasks.lock().unwrap_or_else(|e| e.into_inner());
    let order = state.queue_order.lock().unwrap_or_else(|e| e.into_inner());

    let mut result = Vec::new();
    for id in order.iter() {
        if let Some(t) = tasks.get(id) {
            result.push(t.clone());
        }
    }
    Ok(result)
}

#[tauri::command]
pub async fn verify_file_sizes(state: tauri::State<'_, Arc<QueueState>>) -> Result<(), String> {
    let mut tasks = state.tasks.lock().unwrap_or_else(|e| e.into_inner());
    let mut changed = false;

    for task in tasks.values_mut() {
        if task.status == TaskStatus::Completed
            && (task.file_size.is_none()
                || task.file_size == Some("Unknown size".to_string())
                || task.file_size == Some("N/A".to_string()))
        {
            if let Some(path) = &task.file_path {
                if let Ok(metadata) = std::fs::metadata(path) {
                    let size_bytes = metadata.len();
                    task.file_size =
                        Some(format!("{:.2} MiB", size_bytes as f64 / 1024.0 / 1024.0));
                    changed = true;
                }
            }
        }
    }

    if changed {
        state.save_now();
    }
    Ok(())
}

#[tauri::command]
pub async fn add_history_item(
    state: State<'_, Arc<QueueState>>,
    app: tauri::AppHandle,
    title: String,
    url: String,
    file_path: String,
    file_size: Option<String>,
) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();

    log::info!(
        "Adding history item: {} (ID: {}, Path: {})",
        title,
        id,
        file_path
    );

    // Create a completed task for history
    let task = DownloadTask {
        id: id.clone(),
        url,
        title,
        status: TaskStatus::Completed,
        progress: 100.0,
        speed: None,
        eta: None,
        path: std::path::Path::new(&file_path)
            .parent()
            .map(|p| p.to_string_lossy().to_string())
            .unwrap_or_default(),
        error_message: None,
        added_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs(),
        pid: None,
        status_detail: Some("Exported".to_string()),
        eta_raw: None,
        speed_raw: None,
        total_size: file_size.clone(),
        range: None,
        format: None,
        file_path: Some(file_path),
        scheduled_time: None,
        retry_count: None,
        ytdlp_command: None,
        file_size, // Use same string for display
        completed_at: Some(
            std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_millis() as u64,
        ),
        options: Default::default(),
    };

    state.add_task(task, &app);
    Ok(id)
}
