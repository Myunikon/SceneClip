use crate::download_queue::{DownloadTask, QueueState, TaskStatus};
use crate::ytdlp::YtDlpOptions;
use std::sync::Arc;
use tauri::State;

#[tauri::command]
pub async fn add_to_queue(
    state: State<'_, Arc<QueueState>>,
    url: String,
    options: YtDlpOptions,
) -> Result<String, String> {
    let id = uuid::Uuid::new_v4().to_string();

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
            .unwrap()
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
        scheduled_time: None,
        retry_count: Some(0),
        ytdlp_command: None,
        file_size: None,
        completed_at: None,
        options,
    };

    state.add_task(task);
    Ok(id)
}

#[tauri::command]
pub async fn remove_from_queue(
    state: State<'_, Arc<QueueState>>,
    id: String,
) -> Result<(), String> {
    // Scope the lock to ensure it is dropped before awaiting
    // Now returns Option<DownloadTask> so we can cleanup files
    let removed_task_opt = state.remove_task(&id);

    if let Some(task) = removed_task_opt {
        // 1. Process Cancellation (Force Kill)
        let _ =
            crate::commands::download::cancel_download_internal(id, state.inner().clone()).await;

        // 2. File Cleanup (Absolute "Sisa Download" Removal)
        // We try to delete known artifacts: .part, .ytdl, or the file itself IF NOT COMPLETED
        if let Some(path_str) = task.file_path {
            let path = std::path::Path::new(&path_str);

            let mut candidates = Vec::new();

            // ONLY remove the main file if it's NOT completed or stopped (which might contain a finished file)
            if !matches!(task.status, TaskStatus::Completed | TaskStatus::Stopped) {
                candidates.push(path.to_path_buf());
            }

            // Always try to remove partial files
            candidates.push(path.with_extension(format!(
                "{}.part",
                path.extension().unwrap_or_default().to_str().unwrap_or("")
            )));
            candidates.push(path.with_extension(format!(
                "{}.ytdl",
                path.extension().unwrap_or_default().to_str().unwrap_or("")
            )));

            // Common yt-dlp pattern: "filename.mp4.part"
            if let Some(file_name) = path.file_name() {
                if let Some(parent) = path.parent() {
                    candidates.push(parent.join(format!("{}.part", file_name.to_string_lossy())));
                    candidates.push(parent.join(format!("{}.ytdl", file_name.to_string_lossy())));
                }
            }

            for p in candidates {
                if p.exists() && p.is_file() {
                    let _ = std::fs::remove_file(p);
                }
            }
        }
    }
    Ok(())
}

#[tauri::command]
pub async fn pause_task(state: State<'_, Arc<QueueState>>, id: String) -> Result<(), String> {
    state.pause_task(&id)
}

#[tauri::command]
pub async fn resume_task(state: State<'_, Arc<QueueState>>, id: String) -> Result<(), String> {
    state.resume_task(&id)
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
    let tasks = state.tasks.lock().unwrap();
    let order = state.queue_order.lock().unwrap();

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
    let mut tasks = state.tasks.lock().unwrap();
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
