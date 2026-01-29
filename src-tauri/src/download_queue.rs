use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;
use tokio::sync::Notify;

#[derive(Debug, Clone, Serialize, Deserialize, PartialEq)]
#[serde(rename_all = "snake_case")]
pub enum TaskStatus {
    Pending,
    Queued,
    FetchingInfo,
    Downloading,
    Processing,
    Completed,
    Error,
    Paused,
    Stopped,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadTask {
    pub id: String,
    pub url: String,
    pub title: String,
    pub status: TaskStatus,
    pub progress: f64,
    pub speed: String,
    pub eta: String,
    pub path: String,
    pub error_message: Option<String>,
    pub added_at: u64,
    // Expanded fields to match TypeScript
    pub pid: Option<u32>,
    pub status_detail: Option<String>,
    pub eta_raw: Option<u64>,
    pub speed_raw: Option<f64>,
    pub total_size: Option<String>,
    pub range: Option<String>,
    pub format: Option<String>,
    pub file_path: Option<String>,
    pub scheduled_time: Option<u64>,
    pub retry_count: Option<u32>,
    // Store raw options to pass to download command
    pub options: crate::ytdlp::YtDlpOptions,
}

pub struct QueueState {
    pub tasks: Arc<Mutex<HashMap<String, DownloadTask>>>,
    pub queue_order: Arc<Mutex<Vec<String>>>, // List of IDs in order
    pub notify: Arc<Notify>,                  // To wake up the processor
}

impl QueueState {
    pub fn new() -> Self {
        Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
            queue_order: Arc::new(Mutex::new(Vec::new())),
            notify: Arc::new(Notify::new()),
        }
    }

    pub fn add_task(&self, task: DownloadTask) {
        let mut tasks = self.tasks.lock().unwrap();
        let mut order = self.queue_order.lock().unwrap();

        if !tasks.contains_key(&task.id) {
            order.push(task.id.clone());
        }
        tasks.insert(task.id.clone(), task);
        self.notify.notify_one();
    }

    pub fn update_task_status(&self, id: &str, status: TaskStatus, msg: Option<String>) {
        if let Some(task) = self.tasks.lock().unwrap().get_mut(id) {
            task.status = status;
            if let Some(m) = msg {
                task.error_message = Some(m);
            }
        }
        // Notification might be needed if something is waiting on specific task,
        // but usually loop handles "completed" checks.
        self.notify.notify_one();
    }
}

// Background Processor
pub async fn start_queue_processor(app: AppHandle, state: Arc<QueueState>) {
    loop {
        // 1. Wait for notification or timeout (to retry)
        // We use a timeout so we can periodically check for retry-able tasks
        let _ =
            tokio::time::timeout(std::time::Duration::from_secs(2), state.notify.notified()).await;

        // 2. Check for eligible tasks
        let next_task_id = {
            let tasks = state.tasks.lock().unwrap();
            let order = state.queue_order.lock().unwrap();

            let active = tasks
                .values()
                .filter(|t| {
                    matches!(
                        t.status,
                        TaskStatus::Downloading | TaskStatus::FetchingInfo | TaskStatus::Processing
                    )
                })
                .count();

            // Simple FIFO picking of 'Pending' tasks
            // TODO: In future, respect "concurrent_downloads" setting from AppState
            // For now, let's hardcode a limit or just pick one if we are under limit
            let limit = 3;

            let next = if active < limit {
                order
                    .iter()
                    .find(|id| {
                        if let Some(t) = tasks.get(*id) {
                            t.status == TaskStatus::Pending
                        } else {
                            false
                        }
                    })
                    .cloned()
            } else {
                None
            };

            next
        };

        // 3. Start Task
        if let Some(id) = next_task_id {
            // Mark as queued/starting to prevent double-pick
            state.update_task_status(&id, TaskStatus::Queued, None);

            // Emit update to frontend
            emit_queue_update(&app, &state);

            // Clone things needed for the async move
            let app_handle = app.clone();
            let state_cloned = state.clone();
            let task_data = {
                let tasks = state.tasks.lock().unwrap();
                tasks.get(&id).cloned()
            };

            if let Some(task) = task_data {
                tokio::spawn(async move {
                    // Start download logic here
                    // For now, we simulate calling the existing download logic
                    // In a full migration, we'd call the internal rust function directly, not the command

                    // Update to downloading
                    state_cloned.update_task_status(&task.id, TaskStatus::Downloading, None);
                    emit_queue_update(&app_handle, &state_cloned);

                    // Call the heavy lifter
                    // Note: We need to refactor `download_with_channel` to be callable from Rust
                    // OR we just use it via the Command wrapper if we want to be lazy,
                    // but better to expose the logic in ytdlp.rs

                    // Placeholder for actual download start
                    // We will implement the actual call in the next step when we refactor ytdlp.rs
                    log::info!("Starting headless download for {}", task.url);

                    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();

                    // Default settings (can be fetched from store but for now minimal)
                    // TODO: In full implementation, we fetch real settings from AppState/Store
                    let settings = crate::ytdlp::AppSettings {
                        download_path: task.path.clone(),
                        ..Default::default()
                    };

                    let task_id = task.id.clone();

                    // Listener Loop
                    let state_monitor = state_cloned.clone();
                    let app_monitor = app_handle.clone();

                    let monitor_handle = tokio::spawn(async move {
                        while let Some(event) = rx.recv().await {
                            match event {
                                crate::commands::download::DownloadEvent::ProcessStarted {
                                    pid,
                                    ..
                                } => {
                                    if let Some(t) =
                                        state_monitor.tasks.lock().unwrap().get_mut(&task_id)
                                    {
                                        t.pid = Some(pid);
                                        t.status_detail = Some("Downloading...".to_string());
                                    }
                                    emit_queue_update(&app_monitor, &state_monitor);
                                }
                                crate::commands::download::DownloadEvent::Started {
                                    title, ..
                                } => {
                                    if let Some(t) =
                                        state_monitor.tasks.lock().unwrap().get_mut(&task_id)
                                    {
                                        if let Some(title_str) = title {
                                            t.title = title_str;
                                        }
                                        t.status = TaskStatus::Downloading;
                                    }
                                    emit_queue_update(&app_monitor, &state_monitor);
                                }
                                crate::commands::download::DownloadEvent::Progress {
                                    percent,
                                    speed,
                                    eta,
                                    speed_raw,
                                    eta_raw,
                                    total_size,
                                    ..
                                } => {
                                    if let Some(t) =
                                        state_monitor.tasks.lock().unwrap().get_mut(&task_id)
                                    {
                                        t.progress = percent;
                                        t.speed = speed;
                                        t.eta = eta;
                                        t.speed_raw = speed_raw;
                                        t.eta_raw = eta_raw;
                                        t.total_size = Some(total_size);
                                        t.status = TaskStatus::Downloading;
                                    }
                                    emit_queue_update(&app_monitor, &state_monitor);
                                }
                                crate::commands::download::DownloadEvent::Completed {
                                    file_path,
                                    ..
                                } => {
                                    state_monitor.update_task_status(
                                        &task_id,
                                        TaskStatus::Completed,
                                        None,
                                    );
                                    // Update file path
                                    if let Some(t) =
                                        state_monitor.tasks.lock().unwrap().get_mut(&task_id)
                                    {
                                        t.file_path = Some(file_path.clone());
                                        t.progress = 100.0;
                                    }
                                    emit_queue_update(&app_monitor, &state_monitor);

                                    // Smart Notification
                                    let is_focused = app_monitor
                                        .get_webview_window("main")
                                        .map(|w| w.is_focused().unwrap_or(false))
                                        .unwrap_or(false);

                                    if !is_focused {
                                        let _ = app_monitor
                                            .notification()
                                            .builder()
                                            .title("Download Complete")
                                            .body(format!("Saved to: {}", file_path))
                                            .show();
                                    }
                                }
                                crate::commands::download::DownloadEvent::Error {
                                    message, ..
                                } => {
                                    state_monitor.update_task_status(
                                        &task_id,
                                        TaskStatus::Error,
                                        Some(message),
                                    );
                                    emit_queue_update(&app_monitor, &state_monitor);
                                }
                                _ => {}
                            }
                        }
                    });

                    // Start Download
                    let _ = crate::commands::download::download_media_internal(
                        app_handle.clone(),
                        task.url.clone(),
                        task.id.clone(),
                        task.options.clone(),
                        settings,           // We really should get real settings
                        "auto".to_string(), // GPU Auto
                        tx,
                    )
                    .await;

                    // Ensure monitor finishes
                    let _ = monitor_handle.await;
                });
            }
        }
    }
}

fn emit_queue_update(app: &AppHandle, state: &QueueState) {
    let tasks = state.tasks.lock().unwrap();
    let order = state.queue_order.lock().unwrap();

    // Convert to Vec in order
    let mut ordered_tasks = Vec::new();
    for id in order.iter() {
        if let Some(t) = tasks.get(id) {
            ordered_tasks.push(t.clone());
        }
    }

    let _ = app.emit("queue_update", ordered_tasks);
}
