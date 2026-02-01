use axum::{
    extract::State,
    http::{Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{get, post},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use std::sync::Arc;
use tauri::{AppHandle, Emitter, Manager};
use tower_http::cors::{Any, CorsLayer};

use crate::download_queue::{DownloadTask, QueueState, TaskStatus};
use crate::ytdlp::YtDlpOptions;

#[derive(Debug, Deserialize, Serialize, Clone)]
struct DownloadRequest {
    url: String,
    cookies: Option<String>,
    user_agent: Option<String>,
    start_time: Option<f64>,
    end_time: Option<f64>,
}

#[derive(Clone)]
struct AppState {
    app_handle: AppHandle,
}

pub fn init(app_handle: AppHandle) {
    tauri::async_runtime::spawn(async move {
        start_server(app_handle).await;
    });
}

async fn start_server(app_handle: AppHandle) {
    // CORS is required because the request comes from chrome-extension://...
    let cors = CorsLayer::new()
        .allow_methods([Method::GET, Method::POST])
        .allow_origin(Any)
        .allow_headers(Any);

    let state = AppState { app_handle };

    let app = Router::new()
        .route("/health", get(health_check))
        .route("/download", post(handle_download))
        .layer(cors)
        .with_state(state);

    let addr = SocketAddr::from(([127, 0, 0, 1], 19575));
    log::info!("Server listening on {}", addr);

    let listener = tokio::net::TcpListener::bind(addr).await.unwrap();
    axum::serve(listener, app).await.unwrap();
}

async fn health_check() -> impl IntoResponse {
    (StatusCode::OK, "OK")
}

async fn handle_download(
    State(state): State<AppState>,
    Json(payload): Json<DownloadRequest>,
) -> Response {
    log::info!("Received download request from extension: {}", payload.url);

    // === DIRECT QUEUE ADDITION (No Frontend Dependency) ===
    let queue_state = match state.app_handle.try_state::<Arc<QueueState>>() {
        Some(qs) => qs,
        None => {
            log::error!("QueueState not available");
            return (StatusCode::INTERNAL_SERVER_ERROR, "Queue not initialized").into_response();
        }
    };

    // Build options from extension payload
    let options = YtDlpOptions {
        cookies: payload.cookies.clone(),
        range_start: payload.start_time.map(|t| format!("{:.2}", t)),
        range_end: payload.end_time.map(|t| format!("{:.2}", t)),
        ..Default::default()
    };

    // Build range string for display
    let range_display = if payload.start_time.is_some() || payload.end_time.is_some() {
        Some(format!(
            "{}-{}",
            payload
                .start_time
                .map(|t| format!("{:.2}", t))
                .unwrap_or_default(),
            payload
                .end_time
                .map(|t| format!("{:.2}", t))
                .unwrap_or_default()
        ))
    } else {
        None
    };

    let id = uuid::Uuid::new_v4().to_string();
    let task = DownloadTask {
        id: id.clone(),
        url: payload.url.clone(),
        title: "From Extension...".to_string(),
        status: TaskStatus::Pending,
        progress: 0.0,
        speed: "-".to_string(),
        eta: "-".to_string(),
        path: String::new(), // Will be resolved by queue processor using settings
        error_message: None,
        added_at: std::time::SystemTime::now()
            .duration_since(std::time::UNIX_EPOCH)
            .unwrap()
            .as_secs(),
        pid: None,
        status_detail: Some("Queued via Browser Extension".to_string()),
        eta_raw: None,
        speed_raw: None,
        total_size: None,
        range: range_display,
        format: options.format.clone(),
        file_path: None,
        scheduled_time: None,
        retry_count: Some(0),
        ytdlp_command: None,
        file_size: None,
        completed_at: None,
        options,
    };

    queue_state.add_task(task);
    log::info!("Download added to queue: {} (id: {})", payload.url, id);

    // Notify UI that a new task was added (for visual feedback only)
    let _ = state.app_handle.emit("extension-download-added", &id);

    // Bring window to front
    if let Some(window) = state.app_handle.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }

    (StatusCode::OK, "Download queued").into_response()
}
