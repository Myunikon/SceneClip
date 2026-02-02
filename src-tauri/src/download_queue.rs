use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::fs;
use std::path::PathBuf;
use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex,
};
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
    pub ytdlp_command: Option<String>,
    pub file_size: Option<String>,
    pub completed_at: Option<u64>,
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
    pub abort_handles: Arc<Mutex<HashMap<String, tokio::task::AbortHandle>>>,
    pub notify: Arc<Notify>,
    pub app_handle: Option<AppHandle>, // Needed to resolve paths for auto-save
    pub cached_prevent_suspend: Arc<Mutex<bool>>, // Caching settings to avoid I/O bombardment
    pub dirty: Arc<AtomicBool>,        // Flag to indicate pending changes
}

impl QueueState {
    pub fn new(app_handle: Option<AppHandle>) -> Self {
        let state = Self {
            tasks: Arc::new(Mutex::new(HashMap::new())),
            queue_order: Arc::new(Mutex::new(Vec::new())),
            abort_handles: Arc::new(Mutex::new(HashMap::new())),
            notify: Arc::new(Notify::new()),
            app_handle,
            cached_prevent_suspend: Arc::new(Mutex::new(true)), // Default to true
            dirty: Arc::new(AtomicBool::new(false)),
        };
        // Attempt to load existing queue and settings cache
        state.load();
        state.refresh_settings_cache();

        // Background saver is handled by start_queue_processor
        state
    }

    fn get_persistence_path(&self) -> Option<PathBuf> {
        self.app_handle
            .as_ref()
            .and_then(|app| app.path().app_data_dir().ok())
            .map(|dir| dir.join("queue.json"))
    }

    pub fn save(&self) {
        // Set dirty flag and notify background saver
        self.dirty.store(true, Ordering::SeqCst);
        self.notify.notify_one();
    }

    /// Force immediate save (for critical events like adding/removing tasks)
    pub fn save_now(&self) {
        if let Some(path) = self.get_persistence_path() {
            let tasks = self.tasks.lock().unwrap_or_else(|e| e.into_inner());
            let order = self.queue_order.lock().unwrap_or_else(|e| e.into_inner());

            let data = PersistedQueue {
                tasks: tasks.clone(),
                queue_order: order.clone(),
            };

            if let Ok(json) = serde_json::to_string_pretty(&data) {
                if let Some(parent) = path.parent() {
                    let _ = fs::create_dir_all(parent);
                }
                if let Ok(_) = fs::write(path, json) {
                    self.dirty.store(false, Ordering::SeqCst);
                }
            }
        }
    }

    pub fn refresh_settings_cache(&self) {
        if let Some(app) = &self.app_handle {
            let mut prevent_suspend = true;
            if let Ok(store) = app.store("settings.json") {
                if let Some(val) = store.get("preventSuspendDuringDownload") {
                    prevent_suspend = val.as_bool().unwrap_or(true);
                }
            }
            let mut cache = self
                .cached_prevent_suspend
                .lock()
                .unwrap_or_else(|e| e.into_inner());
            *cache = prevent_suspend;
        }
    }

    pub fn load(&self) {
        if let Some(path) = self.get_persistence_path() {
            if path.exists() {
                if let Ok(content) = fs::read_to_string(path) {
                    if let Ok(data) = serde_json::from_str::<PersistedQueue>(&content) {
                        let mut tasks = self.tasks.lock().unwrap_or_else(|e| e.into_inner());
                        let mut order = self.queue_order.lock().unwrap_or_else(|e| e.into_inner());
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
            let mut tasks = self.tasks.lock().unwrap_or_else(|e| e.into_inner());
            let mut order = self.queue_order.lock().unwrap_or_else(|e| e.into_inner());

            if !tasks.contains_key(&task.id) {
                order.push(task.id.clone());
            }
            tasks.insert(task.id.clone(), task);
        }
        self.save_now(); // Critical event: additive
                         // Instant UI Update
        if let Some(app) = &self.app_handle {
            emit_queue_update(app, self);
        }
        self.notify.notify_one();
    }

    pub fn update_task_status(&self, id: &str, status: TaskStatus, msg: Option<String>) {
        {
            if let Some(task) = self
                .tasks
                .lock()
                .unwrap_or_else(|e| e.into_inner())
                .get_mut(id)
            {
                task.status = status.clone();
                if let Some(m) = msg {
                    task.error_message = Some(m);
                }

                // Set completed_at for terminal states if not already set
                if matches!(
                    status,
                    TaskStatus::Completed | TaskStatus::Stopped | TaskStatus::Error
                ) {
                    if task.completed_at.is_none() {
                        task.completed_at = Some(
                            std::time::SystemTime::now()
                                .duration_since(std::time::UNIX_EPOCH)
                                .unwrap_or_default()
                                .as_millis() as u64,
                        );
                    }
                }
            }
        }
        // Status updates use regular save (debounced)
        self.save();
        if let Some(app) = &self.app_handle {
            emit_queue_update(app, self);
        }
        self.notify.notify_one();
    }

    // Helper to update arbitrary fields
    pub fn update_task<F>(&self, id: &str, f: F)
    where
        F: FnOnce(&mut DownloadTask),
    {
        {
            if let Some(task) = self
                .tasks
                .lock()
                .unwrap_or_else(|e| e.into_inner())
                .get_mut(id)
            {
                f(task);
            }
        }
        // Partial updates (like progress) use regular save (debounced)
        self.save();
        self.notify.notify_one();
    }

    pub fn remove_task(&self, id: &str) -> Option<DownloadTask> {
        let mut removed_task: Option<DownloadTask> = None;
        let mut removed = false;
        {
            let mut tasks = self.tasks.lock().unwrap_or_else(|e| e.into_inner());
            let mut order = self.queue_order.lock().unwrap_or_else(|e| e.into_inner());

            if let Some(task) = tasks.remove(id) {
                removed_task = Some(task);
                if let Some(pos) = order.iter().position(|x| *x == id) {
                    order.remove(pos);
                }
                removed = true;
            }
        }

        // Abort if running
        if removed {
            let mut handles = self.abort_handles.lock().unwrap_or_else(|e| e.into_inner());
            if let Some(handle) = handles.remove(id) {
                handle.abort();
            }
        }

        if removed {
            self.save_now(); // Critical event: destructive
                             // Emit update explicitly to ensure UI reflects removal immediately
            if let Some(app) = &self.app_handle {
                emit_queue_update(app, self);
            }
            self.notify.notify_one();
        }
        removed_task
    }

    pub fn pause_task(&self, id: &str) -> Result<(), String> {
        let res = {
            let mut tasks = self.tasks.lock().unwrap_or_else(|e| e.into_inner());
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
                let tasks = self.tasks.lock().unwrap_or_else(|e| e.into_inner());
                let order = self.queue_order.lock().unwrap_or_else(|e| e.into_inner());
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
            let mut tasks = self.tasks.lock().unwrap_or_else(|e| e.into_inner());
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
                let tasks = self.tasks.lock().unwrap_or_else(|e| e.into_inner());
                let order = self.queue_order.lock().unwrap_or_else(|e| e.into_inner());
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

    pub fn cleanup_old_tasks(&self, retention_days: u32, max_items: i32) {
        let now = std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap_or_default()
            .as_secs();

        let mut removed = false;
        {
            let mut tasks = self.tasks.lock().unwrap_or_else(|e| e.into_inner());
            let mut order = self.queue_order.lock().unwrap_or_else(|e| e.into_inner());

            // 1. Retention Days Cleanup
            if retention_days > 0 {
                let cutoff = now - (retention_days as u64 * 86400);
                let to_remove: Vec<String> = tasks
                    .iter()
                    .filter(|(_, t)| {
                        matches!(
                            t.status,
                            TaskStatus::Completed | TaskStatus::Error | TaskStatus::Stopped
                        ) && t.added_at < cutoff
                    })
                    .map(|(id, _)| id.clone())
                    .collect();

                for id in to_remove {
                    tasks.remove(&id);
                    if let Some(pos) = order.iter().position(|x| *x == id) {
                        order.remove(pos);
                    }
                    removed = true;
                }
            }

            // 2. Max Items Cleanup
            if max_items > 0 {
                // Remove terminal tasks from the front if limit exceeded
                while order.len() > max_items as usize {
                    let mut terminal_idx = None;
                    for (i, id) in order.iter().enumerate() {
                        if let Some(task) = tasks.get(id) {
                            if matches!(
                                task.status,
                                TaskStatus::Completed | TaskStatus::Error | TaskStatus::Stopped
                            ) {
                                terminal_idx = Some(i);
                                break;
                            }
                        }
                    }

                    if let Some(idx) = terminal_idx {
                        let id = order.remove(idx);
                        tasks.remove(&id);
                        removed = true;
                    } else {
                        // No more terminal tasks to remove to satisfy limit
                        break;
                    }
                }
            }
        }

        if removed {
            self.save_now(); // Critical: bulk cleanup
            if let Some(app) = &self.app_handle {
                emit_queue_update(app, self);
            }
        }
    }
}

// Background Processor
pub async fn start_queue_processor(app: AppHandle, state: Arc<QueueState>) {
    loop {
        // 1. Wait for notification or timeout
        let _ =
            tokio::time::timeout(std::time::Duration::from_secs(2), state.notify.notified()).await;

        // Sync settings cache periodically
        state.refresh_settings_cache();

        // 2. Fetch Concurrency & History Settings from Store
        let (limit, retention_days, max_items) = {
            let mut conc = 3;
            let mut days = 30;
            let mut max = 100;

            if let Ok(store) = app.store("settings.json") {
                if let Some(val) = store.get("concurrentDownloads") {
                    if let Some(v) = val.as_u64() {
                        conc = v as usize;
                    }
                }
                if let Some(val) = store.get("historyRetentionDays") {
                    if let Some(v) = val.as_u64() {
                        days = v as u32;
                    }
                }
                if let Some(val) = store.get("maxHistoryItems") {
                    if let Some(v) = val.as_i64() {
                        max = v as i32;
                    }
                }
            }
            (if conc == 0 { 3 } else { conc }, days, max)
        };

        // 3. Perform Auto-Cleanup
        state.cleanup_old_tasks(retention_days, max_items);

        // EXTRA: DEBOUNCED SAVER LOGIC
        // If dirty, we save every loop iteration (2s)
        if state.dirty.load(Ordering::SeqCst) {
            log::debug!("Queue is dirty, performing debounced save");
            state.save_now();
        }

        // 4. Check for eligible tasks
        let next_task_id = {
            let tasks = state.tasks.lock().unwrap_or_else(|e| e.into_inner());
            let order = state.queue_order.lock().unwrap_or_else(|e| e.into_inner());

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

            let now = std::time::SystemTime::now()
                .duration_since(std::time::UNIX_EPOCH)
                .unwrap_or_default()
                .as_secs();

            // Pick next task: Either 'Pending' or 'Scheduled' (if time hit)
            let next = if active_count < limit {
                order
                    .iter()
                    .find(|id| {
                        if let Some(t) = tasks.get(*id) {
                            // Case 1: Regular Pending task
                            let is_pending =
                                t.status == TaskStatus::Pending && t.scheduled_time.is_none();
                            // Case 2: Scheduled task that hit its time
                            let is_scheduled_hit = t.status == TaskStatus::Pending
                                && t.scheduled_time.is_some()
                                && t.scheduled_time.unwrap() <= now;

                            is_pending || is_scheduled_hit
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
                let tasks = state.tasks.lock().unwrap_or_else(|e| e.into_inner());
                tasks.get(&id).cloned()
            };

            if let Some(task) = task_data {
                let join_handle = tokio::spawn(async move {
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
                                    title,
                                    ytdlp_command,
                                    file_path,
                                    ..
                                } => {
                                    state_monitor.update_task(&task_id, |t| {
                                        if let Some(ti) = title {
                                            t.title = ti;
                                        }
                                        if let Some(cmd) = ytdlp_command {
                                            t.ytdlp_command = Some(cmd);
                                        }
                                        if let Some(fp) = file_path {
                                            t.file_path = Some(fp);
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
                                        t.completed_at = Some(
                                            std::time::SystemTime::now()
                                                .duration_since(std::time::UNIX_EPOCH)
                                                .unwrap_or_default()
                                                .as_millis()
                                                as u64,
                                        );
                                        t.scheduled_time = None; // ensure no retry

                                        // Try to get real file size from disk
                                        if let Ok(metadata) = std::fs::metadata(&file_path) {
                                            let size_bytes = metadata.len();
                                            // Format to MiB for consistency with progress
                                            t.file_size = Some(format!(
                                                "{:.2} MiB",
                                                size_bytes as f64 / 1024.0 / 1024.0
                                            ));
                                        } else if t.file_size.is_none() {
                                            t.file_size = t.total_size.clone(); // Fallback to last known progress size
                                        }
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

                    // Cleanup handle on finish
                    state_cloned
                        .abort_handles
                        .lock()
                        .unwrap_or_else(|e| e.into_inner())
                        .remove(&task.id);
                });

                // Store AbortHandle
                state
                    .abort_handles
                    .lock()
                    .unwrap_or_else(|e| e.into_inner())
                    .insert(id, join_handle.abort_handle());
            }
        }
    }
}

fn emit_queue_update(app: &AppHandle, state: &QueueState) {
    // SINGLE ATOMIC LOCK SCOPE to prevent TOCTOU race conditions
    let tasks_guard = state.tasks.lock().unwrap_or_else(|e| e.into_inner());
    let order_guard = state.queue_order.lock().unwrap_or_else(|e| e.into_inner());

    // 1. Power Lock Check (Internal Logic)
    let prevent_setting = *state
        .cached_prevent_suspend
        .lock()
        .unwrap_or_else(|e| e.into_inner());

    if !prevent_setting {
        let _ = crate::commands::power::set_inhibit(false);
    } else {
        let has_active = tasks_guard.values().any(|t| {
            matches!(
                t.status,
                TaskStatus::Downloading
                    | TaskStatus::FetchingInfo
                    | TaskStatus::Processing
                    | TaskStatus::Queued
                    | TaskStatus::Pending
                    | TaskStatus::Paused // FIX: Paused tasks should keep PC awake
            )
        });
        let _ = crate::commands::power::set_inhibit(has_active);
    }

    // 2. Emit ordered tasks
    let mut ordered_tasks = Vec::new();
    for id in order_guard.iter() {
        if let Some(t) = tasks_guard.get(id) {
            ordered_tasks.push(t.clone());
        }
    }
    let _ = app.emit("queue_update", ordered_tasks);
}
