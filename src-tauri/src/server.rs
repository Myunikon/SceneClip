use axum::{
    extract::State,
    http::{Method, StatusCode},
    response::{IntoResponse, Response},
    routing::{post, get},
    Json, Router,
};
use serde::{Deserialize, Serialize};
use std::net::SocketAddr;
use tauri::{AppHandle, Emitter, Manager};
use tower_http::cors::{Any, CorsLayer};

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
    println!("Server listening on {}", addr);

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
    println!("Received download request: {}", payload.url);

    // Emit event to frontend
    if let Err(e) = state.app_handle.emit("server-v1-download", &payload) {
        eprintln!("Failed to emit event: {}", e);
        return (StatusCode::INTERNAL_SERVER_ERROR, "Failed to emit event").into_response();
    }

    // Bring window to front
    if let Some(window) = state.app_handle.get_webview_window("main") {
        let _ = window.show();
        let _ = window.set_focus();
    }

    (StatusCode::OK, "Request received").into_response()
}
