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
        log::debug!("[Settings] URL too long (>2000 chars), rejected");
        return false;
    }

    match Url::parse(&url) {
        Ok(parsed) => {
            if parsed.scheme() != "http" && parsed.scheme() != "https" {
                log::debug!("[Settings] Invalid URL scheme: {}", parsed.scheme());
                return false;
            }
            if let Some(host) = parsed.host_str() {
                if !host.contains('.') {
                    log::debug!("[Settings] Invalid host (no domain): {}", host);
                    return false;
                }

                // Check against the dynamic whitelist
                let matched = sites.matches(&url);
                if !matched {
                    log::debug!("[Settings] URL not in supported sites: {}", host);
                }
                return matched;
            }
            log::debug!("[Settings] URL has no host");
            false
        }
        Err(e) => {
            log::debug!("[Settings] URL parse error: {}", e);
            false
        }
    }
}

#[tauri::command]
pub fn is_youtube_url(url: String) -> bool {
    crate::ytdlp::is_youtube_url(&url)
}
