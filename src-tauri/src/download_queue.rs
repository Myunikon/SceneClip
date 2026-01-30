use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Emitter, Manager};
use tauri_plugin_notification::NotificationExt;
use tauri_plugin_store::StoreExt; // Import Store trait
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
    pub options: crate::ytdlp::YtDlpOptions,
}

#[derive(Serialize, Deserialize)]
struct PersistedQueue {
    tasks: HashMap<String, DownloadTask>,
    queue_order: Vec<String>,
}

pub struct QueueState {
    pub tasks: Arc<Mutex<HashMap<String, DownloadTask>>>,
    pub queue_order: Arc<Mutex<Vec<String>>>,
    pub notify: Arc<Notify>,
    pub app_handle: Option<AppHandle>, // Needed to resolve paths for auto-save
}

impl QueueState {
    pub fn new(app_handle: Option<AppHandle>) -> Self {
        let state = Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
            queue_order: Arc::new(Mutex::new(Vec::new())),
            notify: Arc::new(Notify::new()),
            app_handle,
        };
        // Attempt to load existing queue
        state.load();
        state
    }

    fn get_persistence_path(&self) -> Option<PathBuf> {
        self.app_handle
            .as_ref()
            .and_then(|app| app.path().app_data_dir().ok())
            .map(|dir| dir.join("queue.json"))
    }

    pub fn save(&self) {
        if let Some(path) = self.get_persistence_path() {
            let tasks = self.tasks.lock().unwrap();
            let order = self.queue_order.lock().unwrap();

            let data = PersistedQueue {
                tasks: tasks.clone(),
                queue_order: order.clone(),
            };

            if let Ok(json) = serde_json::to_string_pretty(&data) {
                // Ensure dir exists
                if let Some(parent) = path.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                let _ = fs::write(path, json);
            }
        }
    }

    pub fn load(&self) {
        if let Some(path) = self.get_persistence_path() {
            if path.exists() {
                if let Ok(content) = fs::read_to_string(path) {
                    if let Ok(data) = serde_json::from_str::<PersistedQueue>(&content) {
                        let mut tasks = self.tasks.lock().unwrap();
                        let mut order = self.queue_order.lock().unwrap();
                        *tasks = data.tasks;
                        *order = data.queue_order;

                        // Reset 'Downloading' tasks to 'Pending' or 'Stopped' on startup/reload
                        for task in tasks.values_mut() {
                            if matches!(
                                task.status,
                                TaskStatus::Downloading
                                    | TaskStatus::FetchingInfo
                                    | TaskStatus::Processing
                                    | TaskStatus::Queued
                            ) {
                                task.status = TaskStatus::Stopped;
                                task.status_detail = Some("Interrupted by Restart".to_string());
                            }
                        }
                    }
                }
            }
        }
    }

    pub fn add_task(&self, task: DownloadTask) {
        {
            let mut tasks = self.tasks.lock().unwrap();
            let mut order = self.queue_order.lock().unwrap();

            if !tasks.contains_key(&task.id) {
                order.push(task.id.clone());
            }
            tasks.insert(task.id.clone(), task);
        }
        self.save();
        self.notify.notify_one();
    }

    pub fn update_task_status(&self, id: &str, status: TaskStatus, msg: Option<String>) {
        {
            if let Some(task) = self.tasks.lock().unwrap().get_mut(id) {
                task.status = status;
                if let Some(m) = msg {
                    task.error_message = Some(m);
                }
            }
        }
        self.save();
        self.notify.notify_one();
    }

    // Helper to update arbitrary fields
    pub fn update_task<F>(&self, id: &str, f: F)
    where
        F: FnOnce(&mut DownloadTask),
    {
        {
            if let Some(task) = self.tasks.lock().unwrap().get_mut(id) {
                f(task);
            }
        }
        self.save();
        self.notify.notify_one();
    }

    pub fn remove_task(&self, id: &str) -> bool {
        let mut removed = false;
        {
            let mut tasks = self.tasks.lock().unwrap();
            let mut order = self.queue_order.lock().unwrap();

            if tasks.remove(id).is_some() {
                if let Some(pos) = order.iter().position(|x| *x == id) {
                    order.remove(pos);
                }
                removed = true;
            }
        }
        if removed {
            self.save();
            // We don't necessarily need to notify processor for removal, but consistency is good
            self.notify.notify_one();
        }
        removed
    }

    pub fn pause_task(&self, id: &str) -> Result<(), String> {
        let res = {
            let mut tasks = self.tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(id) {
                if let Some(pid) = task.pid {
                    // Call suspend from process commands
                    match crate::commands::process::suspend_process(pid) {
                        Ok(_) => {
                            task.status = TaskStatus::Paused;
                            task.status_detail = Some("Paused".to_string());
                            task.speed = "-".to_string(); // Clear speed
                            Ok(())
                        }
                        Err(e) => Err(format!("Failed to suspend process: {}", e)),
                    }
                } else {
                    Err("Task has no active process".to_string())
                }
            } else {
                Err("Task not found".to_string())
            }
        };

        if res.is_ok() {
            self.save();
            // Emit update immediately
            if let Some(app) = &self.app_handle {
                let tasks = self.tasks.lock().unwrap();
                let order = self.queue_order.lock().unwrap();
                let mut ordered_tasks = Vec::new();
                for id in order.iter() {
                    if let Some(t) = tasks.get(id) {
                        ordered_tasks.push(t.clone());
                    }
                }
                let _ = app.emit("queue_update", ordered_tasks);
            }
        }
        res
    }

    pub fn resume_task(&self, id: &str) -> Result<(), String> {
        let res = {
            let mut tasks = self.tasks.lock().unwrap();
            if let Some(task) = tasks.get_mut(id) {
                if let Some(pid) = task.pid {
                    match crate::commands::process::resume_process(pid) {
                        Ok(_) => {
                            task.status = TaskStatus::Downloading;
                            task.status_detail = Some("Resumed".to_string());
                            Ok(())
                        }
                        Err(e) => Err(format!("Failed to resume process: {}", e)),
                    }
                } else {
                    Err("Task has no active process".to_string())
                }
            } else {
                Err("Task not found".to_string())
            }
        };

        if res.is_ok() {
            self.save();
            // Emit update immediately
            if let Some(app) = &self.app_handle {
                let tasks = self.tasks.lock().unwrap();
                let order = self.queue_order.lock().unwrap();
                let mut ordered_tasks = Vec::new();
                for id in order.iter() {
                    if let Some(t) = tasks.get(id) {
                        ordered_tasks.push(t.clone());
                    }
                }
                let _ = app.emit("queue_update", ordered_tasks);
            }
        }
        res
    }
}

// Background Processor
pub async fn start_queue_processor(app: AppHandle, state: Arc<QueueState>) {
    loop {
        // 1. Wait for notification or timeout
        let _ =
            tokio::time::timeout(std::time::Duration::from_secs(2), state.notify.notified()).await;

        // 2. Fetch Concurrency Limit from Store
        let limit = {
            let mut conc = 3;
            // Attempt to read settings.json
            if let Ok(store) = app.store("settings.json") {
                // Keys are usually camelCase in JS store
                if let Some(val) = store.get("concurrentDownloads") {
                    if let Some(v) = val.as_u64() {
                        conc = v as usize;
                    }
                }
            }
            if conc == 0 {
                3
            } else {
                conc
            }
        };

        // 3. Check for eligible tasks
        let next_task_id = {
            let tasks = state.tasks.lock().unwrap();
            let order = state.queue_order.lock().unwrap();

            let active_count = tasks
                .values()
                .filter(|t| {
                    matches!(
                        t.status,
                        TaskStatus::Downloading
                            | TaskStatus::FetchingInfo
                            | TaskStatus::Processing
                            | TaskStatus::Queued
                    )
                })
                .count();

            // Simple FIFO picking of 'Pending' tasks
            // The `limit` variable is already defined above.

            let next = if active_count < limit {
                order
                    .iter()
                    .find(|id| {
                        if let Some(t) = tasks.get(*id) {
                            t.status == TaskStatus::Pending && t.scheduled_time.is_none()
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

        // 4. Start Task
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
                    // ... (existing logs) ...

                    // Update to downloading
                    state_cloned.update_task_status(&task.id, TaskStatus::Downloading, None);
                    emit_queue_update(&app_handle, &state_cloned);

                    log::info!("Starting headless download for {}", task.url);

                    let (tx, mut rx) = tokio::sync::mpsc::unbounded_channel();

                    let settings = crate::ytdlp::AppSettings {
                        download_path: task.path.clone(),
                        // We should populate other fields from store if possible,
                        // but for YtDlpOptions usually overrides most things.
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
                                    state_monitor.update_task(&task_id, |t| {
                                        t.pid = Some(pid);
                                        t.status_detail = Some("Downloading...".to_string());
                                    });
                                    emit_queue_update(&app_monitor, &state_monitor);
                                }
                                crate::commands::download::DownloadEvent::Started {
                                    title, ..
                                } => {
                                    state_monitor.update_task(&task_id, |t| {
                                        if let Some(ti) = title {
                                            t.title = ti;
                                        }
                                        t.status = TaskStatus::Downloading;
                                    });
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
                                    state_monitor.update_task(&task_id, |t| {
                                        t.progress = percent;
                                        t.speed = speed;
                                        t.eta = eta;
                                        t.speed_raw = speed_raw;
                                        t.eta_raw = eta_raw;
                                        t.total_size = Some(total_size);
                                        t.status = TaskStatus::Downloading;
                                    });
                                    emit_queue_update(&app_monitor, &state_monitor);
                                }
                                crate::commands::download::DownloadEvent::Completed {
                                    file_path,
                                    ..
                                } => {
                                    state_monitor.update_task(&task_id, |t| {
                                        t.status = TaskStatus::Completed;
                                        t.progress = 100.0;
                                        t.file_path = Some(file_path.clone());
                                        t.status_detail = Some("Done".to_string());
                                        t.scheduled_time = None; // ensure no retry
                                    });
                                    emit_queue_update(&app_monitor, &state_monitor);

                                    // Notification
                                    let focus = app_monitor
                                        .get_webview_window("main")
                                        .map(|w| w.is_focused().unwrap_or(false))
                                        .unwrap_or(false);

                                    if !focus {
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
                                    // AUTO-RETRY LOGIC
                                    let mut should_retry = false;
                                    let mut delay = 0;
                                    let mut retry_num = 0;

                                    state_monitor.update_task(&task_id, |t| {
                                        let max_retries = 3;
                                        let current = t.retry_count.unwrap_or(0);

                                        // Transient error detection (simple)
                                        let msg_lower = message.to_lowercase();
                                        let is_transient = msg_lower.contains("timeout")
                                            || msg_lower.contains("network")
                                            || msg_lower.contains("socket")
                                            || msg_lower.contains("5"); // 5xx errors often contain 500, 503 etc

                                        if is_transient && current < max_retries {
                                            retry_num = current + 1;
                                            t.retry_count = Some(retry_num);
                                            delay = u64::pow(2, retry_num) * 1; // Seconds: 2, 4, 8

                                            should_retry = true;
                                            t.status = TaskStatus::Stopped; // Park it
                                            t.status_detail = Some(format!(
                                                "Auto-retry {}/{} in {}s",
                                                retry_num, max_retries, delay
                                            ));

                                            // Schedule it
                                            let now = std::time::SystemTime::now()
                                                .duration_since(std::time::UNIX_EPOCH)
                                                .unwrap()
                                                .as_secs();
                                            t.scheduled_time = Some(now + delay);
                                        } else {
                                            t.status = TaskStatus::Error;
                                            t.error_message = Some(message);
                                        }
                                    });

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

    let mut ordered_tasks = Vec::new();
    for id in order.iter() {
        if let Some(t) = tasks.get(id) {
            ordered_tasks.push(t.clone());
        }
    }
    let _ = app.emit("queue_update", ordered_tasks);
}
