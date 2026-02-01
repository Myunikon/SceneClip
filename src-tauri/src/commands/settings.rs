use crate::ytdlp::SupportedSites;
use std::path::Path;
use std::sync::Arc;
use url::Url;

#[tauri::command]
pub fn validate_path(path: String) -> bool {
    if path.trim().is_empty() {
        return false;
    }
    Path::new(&path).exists()
}

#[tauri::command]
pub fn validate_url(url: String, sites: tauri::State<Arc<SupportedSites>>) -> bool {
    if url.len() > 2000 {
        return false;
    }

    match Url::parse(&url) {
        Ok(parsed) => {
            if parsed.scheme() != "http" && parsed.scheme() != "https" {
                return false;
            }
            if let Some(host) = parsed.host_str() {
                if !host.contains('.') {
                    return false;
                }

                // Check against the dynamic whitelist
                return sites.matches(&url);
            }
            false
        }
        Err(_) => false,
    }
}

#[tauri::command]
pub fn is_youtube_url(url: String) -> bool {
    crate::ytdlp::is_youtube_url(&url)
}
