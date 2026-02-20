use serde::{Deserialize, Serialize};
use std::collections::HashSet;
use std::fs;
use std::io::{BufRead, BufReader};
use std::path::PathBuf;
use tauri::{AppHandle, Manager};
use url::Url;

// --- Constants ---
const DEFAULTS_SOCKET_TIMEOUT: &str = "60";

// --- Structs ---

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct YtDlpOptions {
    pub path: Option<String>,
    pub range_start: Option<String>,
    pub range_end: Option<String>,
    pub format: Option<String>,
    pub container: Option<String>,
    // Audio options
    pub audio_bitrate: Option<String>,
    pub audio_format: Option<String>, // 'mp3' | 'm4a' | 'flac' | 'wav' | 'opus' | 'aac'
    // Video codec preference
    pub video_codec: Option<String>, // 'auto' | 'av1' | 'h264' | 'vp9' | 'hevc'
    // Subtitle options
    pub subtitles: Option<bool>,
    pub subtitle_format: Option<String>,
    pub subtitle_lang: Option<String>,
    pub embed_subtitles: Option<bool>,
    // SponsorBlock
    pub remove_sponsors: Option<bool>,
    // Livestream support
    pub live_from_start: Option<bool>,
    // Chapters
    pub split_chapters: Option<bool>,
    // Audio Enhancements
    pub audio_normalization: Option<bool>,
    // GIF Options
    pub gif_fps: Option<u32>,
    pub gif_scale: Option<u32>,
    pub gif_quality: Option<String>, // 'high' | 'fast'
    pub force_transcode: Option<bool>,
    pub cookies: Option<String>,
    pub user_agent: Option<String>,
    pub proxy: Option<String>,
    pub username: Option<String>,
    pub password: Option<String>,
    pub custom_filename: Option<String>,
    pub post_processor_args: Option<String>,
    // JS Runtime override
    pub js_runtime_path: Option<String>,
    pub disable_js_runtime: Option<bool>,
}

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum PresetType {
    Audio,
    Video,
    Metadata,
    Subtitles,
    General,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct PostProcessorPreset {
    #[serde(default)]
    pub id: String,
    #[serde(default)]
    pub name: String,
    #[serde(default)]
    pub description: String,
    pub r#type: PresetType,
    #[serde(default)]
    pub args: String,
    #[serde(default)]
    pub is_default: bool,
}

#[derive(Clone, Serialize, Deserialize, Debug, Default)]
#[serde(rename_all = "camelCase")]
pub struct AppSettings {
    pub theme: String,
    pub language: String,
    pub launch_at_startup: bool,
    pub start_minimized: bool,
    pub close_action: String,
    // Downloads
    pub download_path: String,
    pub always_ask_path: bool,
    pub filename_template: String,
    pub resolution: String,
    pub container: String,
    pub hardware_decoding: bool,
    // Network
    pub concurrent_downloads: u32,
    pub speed_limit: String,
    pub use_aria2c: bool,
    pub proxy: String,
    pub user_agent: String,
    pub frontend_font_size: String,
    // Advanced
    pub cookie_source: String,
    pub browser_type: Option<String>,
    pub cookie_path: Option<String>,
    pub use_sponsor_block: bool,
    pub sponsor_segments: Vec<String>,
    pub binary_path_yt_dlp: String,
    pub binary_path_ffmpeg: String,
    pub binary_path_ffprobe: String,
    pub binary_path_node: String,
    pub embed_metadata: bool,
    pub embed_thumbnail: bool,
    pub embed_chapters: bool,
    pub use_metadata_enhancer: bool,
    pub use_smart_proxy: bool,
    pub use_replay_gain: bool,
    pub use_po_token: bool,
    pub po_token: String,
    pub visitor_data: String,
    pub use_chrome_cookie_unlock: bool,

    pub enable_desktop_notifications: bool,
    pub prevent_suspend_during_download: bool,

    // Privacy & History
    pub remove_source_metadata: bool,
    pub history_retention_days: u32,
    pub max_history_items: i32, // -1 for unlimited

    // Performance & Quality (Advanced)
    pub post_processor_presets: Vec<PostProcessorPreset>,
    pub enabled_preset_ids: Vec<String>,
}

use std::process::Command;
use std::sync::RwLock;

pub struct SupportedSites {
    pub domains: RwLock<HashSet<String>>,
    pub keywords: RwLock<HashSet<String>>,
}

impl SupportedSites {
    pub fn new() -> Self {
        Self {
            domains: RwLock::new(HashSet::new()),
            keywords: RwLock::new(HashSet::new()),
        }
    }

    pub fn load_from_file(&self, path: PathBuf) -> Result<(), Box<dyn std::error::Error>> {
        if !path.exists() {
            return Err("File not found".into());
        }

        let file = fs::File::open(path)?;
        let reader = BufReader::new(file);

        let mut domains = self.domains.write().unwrap();
        let mut keywords = self.keywords.write().unwrap();

        domains.clear();
        keywords.clear();

        for line in reader.lines() {
            let line = line?;
            if !line.starts_with(" - **") {
                continue;
            }

            // Extract parts between ** and **
            if let Some(start) = line.find("**") {
                if let Some(end) = line[start + 2..].find("**") {
                    let name = &line[start + 2..start + 2 + end];
                    self.process_token(name, &mut domains, &mut keywords);
                }
            }

            // Extract parts between [* and *]
            if let Some(start) = line.find("[*") {
                if let Some(end) = line[start + 2..].find("*]") {
                    let name = &line[start + 2..start + 2 + end];
                    self.process_token(name, &mut domains, &mut keywords);
                }
            }
        }

        log::info!(
            "Loaded {} supported domains/keywords from file. Domains: {}, Keywords: {}",
            domains.len() + keywords.len(),
            domains.len(),
            keywords.len()
        );
        Ok(())
    }

    /// Tier 2: Dynamic loading from `yt-dlp --list-extractors`
    pub fn load_from_ytdlp(&self, ytdlp_path: &str) -> Result<(), Box<dyn std::error::Error>> {
        log::info!("Starting dynamic extractor loading from: {}", ytdlp_path);

        // Run yt-dlp --list-extractors
        // Use standard Command here since we are in a background thread context usually
        // and we want simple blocking output capture for parsing.
        #[cfg(target_os = "windows")]
        use std::os::windows::process::CommandExt;

        let mut cmd = Command::new(ytdlp_path);
        cmd.arg("--list-extractors");

        #[cfg(target_os = "windows")]
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

        let output = cmd.output()?;

        if !output.status.success() {
            return Err(format!("yt-dlp failed with status: {}", output.status).into());
        }

        let stdout = String::from_utf8_lossy(&output.stdout);

        let mut domains = self.domains.write().unwrap();
        let mut keywords = self.keywords.write().unwrap();

        let initial_count = domains.len() + keywords.len();

        for line in stdout.lines() {
            let token = line.trim();
            if !token.is_empty() {
                self.process_token(token, &mut domains, &mut keywords);
            }
        }

        let new_count = domains.len() + keywords.len();

        log::info!(
            "Dynamic loading complete. Total sites: {} (Added: {})",
            new_count,
            new_count.saturating_sub(initial_count)
        );

        Ok(())
    }

    fn process_token(
        &self,
        token: &str,
        domains: &mut HashSet<String>,
        keywords: &mut HashSet<String>,
    ) {
        let token = token.to_lowercase();
        if token.is_empty() {
            return;
        }

        if token.contains('.') {
            // Likely a domain
            domains.insert(token);
        } else {
            // Split by colon to handle things like "youtube:clip" -> "youtube"
            for part in token.split(':') {
                // Skip generic words to avoid false positives
                let part = part.trim();
                if part.len() >= 3
                    // Content Types
                    && part != "video"
                    && part != "videos"
                    && part != "audio"
                    && part != "embed"
                    && part != "clip"
                    && part != "clips"
                    && part != "live"
                    && part != "livestream"
                    && part != "stream"
                    && part != "playlist"
                    && part != "playlists"
                    && part != "list"
                    && part != "channel"
                    && part != "channels"
                    && part != "user"
                    && part != "users"
                    && part != "group"
                    && part != "groups"
                    && part != "story"
                    && part != "stories"
                    && part != "topic"
                    && part != "topics"
                    && part != "search"
                    && part != "album"
                    && part != "albums"
                    && part != "track"
                    && part != "tracks"
                    && part != "episode"
                    && part != "episodes"
                    && part != "series"
                    && part != "season"
                    && part != "seasons"
                    && part != "movie"
                    && part != "movies"
                    && part != "show"
                    && part != "shows"
                    && part != "article"
                    && part != "articles"
                    && part != "page"
                    && part != "pages"
                    && part != "post"
                    && part != "posts"
                    && part != "feed"
                    && part != "feeds"
                    && part != "tab"
                    && part != "recommended"
                    // News / Media
                    && part != "news"
                    && part != "music"
                    && part != "radio"
                    && part != "player"
                    && part != "media"
                    && part != "tv" // len 2 but consistent
                    // Misc
                    && part != "generic"
                    && part != "unknown"
                    && part != "watch"
                    && part != "link"
                    && part != "share"
                {
                    keywords.insert(part.to_string());
                }
            }
        }
    }

    /// Tier 1: Instant VIP Check
    pub fn is_vip(&self, domain: &str) -> bool {
        let vips = [
            "youtube.com",
            "youtu.be",
            "music.youtube.com",
            "instagram.com",
            "tiktok.com",
            "facebook.com",
            "twitter.com",
            "x.com",
            "twitch.tv",
            "vimeo.com",
            "soundcloud.com",
            "dailymotion.com",
            "reddit.com",
            "threads.net",
        ];

        vips.iter()
            .any(|vip| domain == *vip || domain.ends_with(&format!(".{}", vip)))
    }

    pub fn matches(&self, url: &str) -> bool {
        let domain = match Url::parse(url) {
            Ok(u) => u.host_str().unwrap_or("").to_lowercase(),
            Err(_) => return false,
        };

        // Tier 1: Check VIP first (0ms lock-free-ish path if we used constants, but here simple array iter)
        if self.is_vip(&domain) {
            return true;
        }

        // Tier 2 & 3: Check dynamic Lists
        let domains = self.domains.read().unwrap();
        for d in domains.iter() {
            // Check if domain exactly matches OR if it is a subdomain (ends with .domain)
            // e.g. music.youtube.com ends with .youtube.com
            if domain == *d || domain.ends_with(&format!(".{}", d)) {
                return true;
            }
        }
        drop(domains); // Release read lock

        let keywords = self.keywords.read().unwrap();
        for keyword in keywords.iter() {
            if domain.contains(keyword) {
                return true;
            }
        }

        false
    }
}

pub fn load_settings(app: &AppHandle) -> AppSettings {
    use tauri_plugin_store::StoreExt;
    let store = match app.store("settings.json") {
        Ok(s) => s,
        Err(_) => return AppSettings::default(),
    };

    let key = "app-storage-v5-clean";
    if let Some(v) = store.get(key) {
        if let Some(state) = v.get("state") {
            if let Some(settings_val) = state.get("settings") {
                if let Ok(settings) = serde_json::from_value::<AppSettings>(settings_val.clone()) {
                    return settings;
                }
            }
        }
    }

    AppSettings::default()
}

pub fn load_gpu_type(app: &AppHandle) -> String {
    use tauri_plugin_store::StoreExt;
    let store = match app.store("settings.json") {
        Ok(s) => s,
        Err(_) => return "auto".to_string(),
    };

    let key = "app-storage-v5-clean";
    if let Some(v) = store.get(key) {
        if let Some(state) = v.get("state") {
            if let Some(gpu_val) = state.get("gpuType") {
                if let Some(gpu) = gpu_val.as_str() {
                    return gpu.to_string();
                }
            }
        }
    }

    "auto".to_string()
}

// --- Logic ---

pub fn resolve_binary_path(app: &AppHandle, binary_name: &str) -> String {
    // 1. Check AppLocalData (Writable Update Storage) - PRIORITY
    if let Ok(local_dir) = app.path().app_local_data_dir() {
        #[cfg(target_os = "windows")]
        let exe_name = if binary_name.ends_with(".exe") {
            binary_name.to_string()
        } else {
            format!("{}.exe", binary_name)
        };
        #[cfg(not(target_os = "windows"))]
        let exe_name = binary_name.to_string();

        let local_path = local_dir.join(&exe_name);
        if local_path.exists() {
            return local_path.to_string_lossy().to_string();
        }
    }

    // 2. Attempt to find bundled sidecar
    if let Ok(mut exe_path) = std::env::current_exe() {
        exe_path.pop(); // Parent dir

        #[cfg(target_os = "windows")]
        let exe_name = if binary_name.ends_with(".exe") {
            binary_name.to_string()
        } else {
            format!("{}.exe", binary_name)
        };
        #[cfg(not(target_os = "windows"))]
        let exe_name = binary_name.to_string();

        // Check flat in root (tauri dev/prod)
        let flat_path = exe_path.join(&exe_name);
        if flat_path.exists() {
            return flat_path.to_string_lossy().to_string();
        }

        // Check bin/ subdir
        let bin_path = exe_path.join("bin").join(&exe_name);
        if bin_path.exists() {
            return bin_path.to_string_lossy().to_string();
        }

        // Sidecar scan (for names like binary-triple.exe)
        let binary_name_lower = binary_name.to_lowercase();
        let scan_dirs = vec![exe_path.clone(), exe_path.join("bin")];

        for dir in scan_dirs {
            if let Ok(entries) = std::fs::read_dir(dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                        let stem_lower = stem.to_lowercase();
                        if stem_lower.starts_with(&binary_name_lower) {
                            #[cfg(target_os = "windows")]
                            let is_exe = path
                                .extension()
                                .map_or(false, |e| e.to_ascii_lowercase() == "exe");
                            #[cfg(not(target_os = "windows"))]
                            let is_exe = true;

                            if is_exe {
                                return path.to_string_lossy().to_string();
                            }
                        }
                    }
                }
            }
        }
    }

    // Fallback to system PATH
    binary_name.to_string()
}

pub fn resolve_ytdlp_path(app: &AppHandle, configured_path: &str) -> String {
    if !configured_path.is_empty() {
        return configured_path.to_string();
    }
    resolve_binary_path(app, "yt-dlp")
}

pub fn resolve_ffmpeg_path(app: &AppHandle, configured_path: &str) -> String {
    if !configured_path.is_empty() {
        return configured_path.to_string();
    }
    resolve_binary_path(app, "ffmpeg")
}

pub fn is_youtube_url(url: &str) -> bool {
    url.contains("youtube.com") || url.contains("youtu.be")
}

pub fn sanitize_filename(
    template: &str,
    meta: &serde_json::Value,
    options: &YtDlpOptions,
) -> String {
    let sanitize_segment = |s: &str| -> String {
        s.replace(|c: char| "\\/:*?\"<>|%".contains(c), "_")
            .replace("..", "")
            .trim()
            .to_string()
    };

    let mut final_name = template.to_string();

    // Determine Variable Values
    let title_value = options
        .custom_filename
        .as_deref()
        .filter(|s| !s.is_empty())
        .or_else(|| meta.get("title").and_then(|v| v.as_str()))
        .unwrap_or("Untitled");

    let mut resolution = "NA".to_string();
    if options.format.as_deref() == Some("audio") {
        resolution = "Audio".to_string();
    } else {
        if let Some(h) = meta.get("height").and_then(|v| v.as_u64()) {
            resolution = format!("{}p", h);
        } else if let Some(fmt) = &options.format {
            if fmt != "best" && fmt != "Best" {
                resolution = fmt.clone();
            }
        }
    }

    let source = meta
        .get("extractor_key")
        .or_else(|| meta.get("extractor"))
        .and_then(|v| v.as_str())
        .unwrap_or("Web");

    let mut date = "00-00-0000".to_string();
    if let Some(ud) = meta.get("upload_date").and_then(|v| v.as_str()) {
        if ud.len() == 8 {
            date = format!("{}-{}-{}", &ud[6..8], &ud[4..6], &ud[0..4]);
        }
    }

    // Case-Insensitive Replacement for standard tokens
    let standard_vars = vec![
        ("title", title_value),
        ("res", &resolution),
        ("source", source),
        ("date", &date),
        ("id", meta.get("id").and_then(|v| v.as_str()).unwrap_or("")),
        (
            "author",
            meta.get("uploader")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown"),
        ),
    ];

    for (k, v) in standard_vars {
        // Given we want to be thorough:
        final_name = final_name.replace(&format!("{{{}}}", k.to_lowercase()), v);
        final_name = final_name.replace(&format!("{{{}}}", k.to_uppercase()), v);

        // Capitalized (e.g. {Title})
        let capitalized = k
            .chars()
            .next()
            .map(|c| c.to_uppercase().collect::<String>() + &k[1..])
            .unwrap_or_default();
        final_name = final_name.replace(&format!("{{{}}}", capitalized), v);
    }

    // Legacy cleanup
    final_name = final_name
        .replace("{resolution}", &resolution)
        .replace(
            "{uploader}",
            meta.get("uploader")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown"),
        )
        .replace("{ext}", ""); // Strip explicit ext

    final_name = final_name.replace("..", ".");

    // Path segments
    let segments: Vec<String> = final_name
        .split(|c| c == '/' || c == '\\')
        .map(|s| sanitize_segment(s))
        .collect();

    final_name = segments.join("/");

    // Length check (simplistic 200 char limit)
    if final_name.len() > 200 {
        final_name = final_name[0..200].to_string();
    }

    // Extension Enforcement
    let mut target_ext = meta
        .get("ext")
        .and_then(|v| v.as_str())
        .unwrap_or("mp4")
        .to_string();

    let is_audio_mode = options.format.as_deref() == Some("audio")
        || (options.format.is_none() && options.audio_format.is_some());

    if is_audio_mode {
        target_ext = options.audio_format.as_deref().unwrap_or("mp3").to_string();
    } else if options.format.as_deref() == Some("gif") {
        target_ext = "gif".to_string();
    } else if let Some(c) = &options.container {
        target_ext = c.clone();
    }

    let expected_ext = format!(".{}", target_ext);
    let expected_ext_lower = expected_ext.to_lowercase();

    if final_name.to_lowercase().ends_with(&expected_ext_lower) {
        // Already ends with the correct extension
    } else {
        // Naive strip of common extensions if they don't match expected_ext
        let common_exts = [
            ".mp4", ".mp3", ".mkv", ".webm", ".m4a", ".wav", ".gif", ".mov", ".avi", ".ts",
        ];
        let final_lower = final_name.to_lowercase();
        for ext in common_exts {
            if final_lower.ends_with(ext) {
                final_name = final_name[..final_name.len() - ext.len()].to_string();
                break;
            }
        }

        // Final safeguard: if stripping left us with nothing plus the extension, or just a dot
        if final_name.is_empty() || final_name == "." {
            final_name = sanitize_segment(title_value);
        }

        final_name = format!("{}{}", final_name, expected_ext);
    }

    // Final check: if final_name is JUST the extension after all this, prepend the title
    if final_name.trim() == expected_ext.as_str()
        || final_name.trim() == expected_ext_lower.as_str()
    {
        final_name = format!("{}{}", sanitize_segment(title_value), expected_ext);
    }
    final_name
}

pub async fn build_ytdlp_args(
    url: &str,
    options: &YtDlpOptions,
    settings: &AppSettings,
    final_filename: &str,
    gpu_type: &str,
    app_handle: &AppHandle,
) -> Vec<String> {
    log::info!(
        "Building yt-dlp arguments for: {} (File: {})",
        url,
        final_filename
    );

    let is_audio_mode = options.format.as_deref() == Some("audio")
        || (options.format.is_none() && options.audio_format.is_some());

    let fmt = if is_audio_mode {
        "audio"
    } else {
        options.format.as_deref().unwrap_or(&settings.resolution)
    };

    let container = options
        .container
        .as_deref()
        .or(if settings.container.is_empty() {
            None
        } else {
            Some(&settings.container)
        })
        .unwrap_or("mp4");

    let is_clipping = options.range_start.is_some() || options.range_end.is_some();
    let is_gif = fmt == "gif";

    let concurrent_fragments = if is_clipping || is_gif { "1" } else { "4" };

    let mut args: Vec<String> = vec![
        "-o".to_string(), final_filename.to_string(),
        "--newline".to_string(),
        "--no-colors".to_string(),
        "--no-playlist".to_string(),
        "--no-overwrites".to_string(), // Safer default
        "--encoding".to_string(), "utf-8".to_string(),
        "-N".to_string(), concurrent_fragments.to_string(),
        "--continue".to_string(),
        "--socket-timeout".to_string(), DEFAULTS_SOCKET_TIMEOUT.to_string(),
        "--progress-template".to_string(), "download:SCENECLIP_DL;%(progress.status)s;%(progress.downloaded_bytes)s;%(progress.total_bytes)s;%(progress.total_bytes_estimate)s;%(progress.speed)s;%(progress.eta)s".to_string(),
        "--progress-template".to_string(), "postprocess:SCENECLIP_PP;%(progress.status)s;%(progress.postprocessor)s".to_string(),
        "--progress-delta".to_string(), "0.1".to_string(),
    ];

    // ffmpeg location
    let ffmpeg_path = resolve_ffmpeg_path(app_handle, &settings.binary_path_ffmpeg);
    if !ffmpeg_path.is_empty() && ffmpeg_path != "ffmpeg" {
        args.push("--ffmpeg-location".to_string());
        args.push(ffmpeg_path);
    }

    // Extract resolution number from fmt (e.g. "1080p" -> "1080")
    let res_num = fmt.chars().filter(|c| c.is_numeric()).collect::<String>();
    let res_val = if res_num.is_empty() {
        "2160".to_string()
    } else {
        res_num
    };

    let sort_string = if fmt == "gif" {
        "res:720,ext:mp4,fps:30".to_string()
    } else {
        format!("+vcodec:av01,+vcodec:hev1,res:{},fps,br,size", res_val)
    };
    args.push("-S".to_string());
    args.push(sort_string);

    args.push("--ignore-config".to_string());

    // Plugins & JS Runtime
    {
        let needs_plugins = options.subtitles.unwrap_or(false)
            || settings.use_smart_proxy
            || settings.use_replay_gain
            || settings.use_chrome_cookie_unlock;

        if needs_plugins {
            if let Ok(plugins_path) = app_handle
                .path()
                .resolve("resources/plugins", tauri::path::BaseDirectory::Resource)
            {
                args.push("--plugin-dirs".to_string());
                args.push(plugins_path.to_string_lossy().to_string());
            }
        }

        if !options.disable_js_runtime.unwrap_or(false) {
            let mut active_js_path = options.js_runtime_path.clone().or_else(|| {
                if !settings.binary_path_node.is_empty() {
                    Some(settings.binary_path_node.clone())
                } else {
                    None
                }
            });

            // Try to find Deno sidecar using proper resolution (handles platform suffix)
            if active_js_path.is_none() {
                let deno_path = resolve_binary_path(app_handle, "deno");
                // Only use if we found a real path (not just "deno" fallback)
                if deno_path != "deno" && std::path::Path::new(&deno_path).exists() {
                    active_js_path = Some(deno_path);
                }
            }

            if let Some(path) = active_js_path {
                let lower = path.to_lowercase();
                let runtime_type = if lower.contains("deno") {
                    "deno"
                } else if lower.contains("bun") {
                    "bun"
                } else if lower.contains("node") {
                    "node"
                } else {
                    "deno" // Default assumption if unknown
                };

                args.push("--js-runtimes".to_string());
                args.push(format!("{}:{}", runtime_type, path));

                if runtime_type == "deno" || runtime_type == "bun" {
                    args.push("--remote-components".to_string());
                    args.push("ejs:npm".to_string());
                }
            }
        }

        if options.subtitles.unwrap_or(false) {
            args.push("--use-postprocessor".to_string());
            args.push("SrtFix".to_string());
        }
        if settings.use_smart_proxy {
            args.push("--use-postprocessor".to_string());
            args.push("SmartProxyRotator".to_string());
        }
        if settings.use_replay_gain {
            args.push("--use-postprocessor".to_string());
            args.push("ReplayGain:when=after_move".to_string());
        }
        if settings.use_chrome_cookie_unlock {
            args.push("--use-postprocessor".to_string());
            args.push("ChromeCookieUnlock:when=pre_process".to_string());
        }
    }

    // NOTE: --ffmpeg-location is already handled above via resolve_ffmpeg_path()
    // Removed duplicate block that used to push settings.binary_path_ffmpeg directly.

    if is_clipping {
        // Force FFmpeg downloader for "Trim First" behavior (partial download via Range headers)
        // This ensures consistent behavior across generic sites/HLS without downloading full file first.
        args.push("--downloader".to_string());
        args.push("ffmpeg".to_string());
    } else if settings.use_aria2c {
        args.push("--downloader".to_string());
        args.push("aria2c".to_string());
        args.push("--downloader-args".to_string());
        args.push("aria2c:--summary-interval=0 --enable-color=false -x 16 -k 1M".to_string());
    }

    if is_clipping || is_gif {
        args.push("--no-part".to_string());
    }

    let active_gpu_type = if !settings.hardware_decoding {
        "cpu"
    } else {
        gpu_type
    };

    if fmt == "audio" {
        let audio_format = options.audio_format.as_deref().unwrap_or("mp3");
        args.push("-x".to_string());
        args.push("--audio-format".to_string());
        args.push(audio_format.to_string());

        let bitrate = options.audio_bitrate.as_deref().unwrap_or("192");
        let quality = match bitrate {
            "320" => "0",
            "256" => "1",
            "192" => "2",
            "160" => "3",
            "128" => "5",
            "96" => "7",
            "64" => "9",
            _ => "2",
        };
        args.push("--audio-quality".to_string());
        args.push(quality.to_string());

        // Redundant loudnorm removed here (handled in Consolidated FFmpeg Args section)
    } else if fmt == "gif" {
        // Redundant -S removed (now handled at the top)

        let fps = options.gif_fps.unwrap_or(15);
        let scale_height = options.gif_scale.unwrap_or(480);
        let scale_filter = if scale_height > 0 {
            format!(",scale=-2:'min({},ih)':flags=lanczos", scale_height)
        } else {
            "".to_string()
        };

        let gif_filter = if options.gif_quality.as_deref() == Some("high") {
            format!(
                "fps={}{},split[s0][s1];[s0]palettegen[p];[s1][p]paletteuse",
                fps, scale_filter
            )
        } else {
            format!("fps={}{}", fps, scale_filter)
        };

        args.push("--recode-video".to_string());
        args.push("gif".to_string());
        args.push("--postprocessor-args".to_string());
        // Use "ffmpeg" as the PP name for broader compatibility across yt-dlp versions
        args.push(format!("ffmpeg:-vf {} -loop 0", gif_filter));
    } else {
        let mut h = String::new();
        if fmt != "Best" && fmt != "audio" {
            let res = fmt.replace("p", "").replace("P", ""); // simplistic regex replacement
            h = format!("[height<={}]", res);
        }

        let codec = options.video_codec.as_deref().unwrap_or("auto");
        let format_string = match codec {
            "h264" => format!("bestvideo{}[vcodec^=avc]+bestaudio[ext=m4a]/best{}[ext=mp4]/bestvideo{}+bestaudio/best{}/best{}", h, h, h, h, h),
            "av1" => format!("bestvideo{}[vcodec^=av01]+bestaudio/bestvideo{}[vcodec^=vp9]+bestaudio/bestvideo{}+bestaudio/best{}/best{}", h, h, h, h, h),
            "vp9" => format!("bestvideo{}[vcodec^=vp9]+bestaudio/bestvideo{}+bestaudio/best{}/best{}", h, h, h, h),
            "hevc" => format!("bestvideo{}[vcodec^=hevc]+bestaudio/bestvideo{}[vcodec^=hev1]+bestaudio/bestvideo{}[vcodec^=hvc1]+bestaudio/bestvideo{}+bestaudio/best{}/best{}", h, h, h, h, h, h),
            _ => format!("bestvideo{}+bestaudio/best{}/best{}", h, h, h),
        };
        args.push("-f".to_string());
        args.push(format_string);

        if options.force_transcode.unwrap_or(false) || options.audio_normalization.unwrap_or(false)
        {
            let mut transcode_args = String::new();
            let mut active_codec = codec;
            if active_codec == "auto" {
                active_codec = "h264";
            }

            // Helper closure replacement
            let get_encoder =
                |sw: &str, nvidia: &str, amd: &str, intel: &str, apple: &str| -> String {
                    match active_gpu_type {
                        "nvidia" => nvidia.to_string(),
                        "amd" => amd.to_string(),
                        "intel" => intel.to_string(),
                        "apple" => apple.to_string(),
                        _ => sw.to_string(),
                    }
                };

            let audio_params = if options.audio_normalization.unwrap_or(false) {
                "-c:a aac -b:a 192k"
            } else {
                "-c:a copy"
            };

            if codec == "h264" {
                let enc = get_encoder(
                    "libx264",
                    "h264_nvenc",
                    "h264_amf",
                    "h264_qsv",
                    "h264_videotoolbox",
                );
                if active_gpu_type != "cpu" {
                    if active_gpu_type == "nvidia" {
                        transcode_args = format!(
                            "-c:v {} -rc:v vbr -cq:v 19 -preset p4 {}",
                            enc, audio_params
                        );
                    } else if active_gpu_type == "amd" {
                        transcode_args =
                            format!("-c:v {} -rc cqp -qp_i 22 -qp_p 22 {}", enc, audio_params);
                    } else if active_gpu_type == "intel" {
                        transcode_args =
                            format!("-c:v {} -global_quality 20 {}", enc, audio_params);
                    } else if active_gpu_type == "apple" {
                        transcode_args = format!("-c:v {} -q:v 65 {}", enc, audio_params);
                    }
                } else {
                    transcode_args = format!("-c:v {} -crf 23 -preset fast {}", enc, audio_params);
                }
            } else if active_codec == "av1" {
                let ap = if options.audio_normalization.unwrap_or(false) {
                    "-c:a libopus -b:a 128k"
                } else {
                    "-c:a copy"
                };
                transcode_args = format!("-c:v libsvtav1 -crf 30 -preset 8 {}", ap);
            } else if codec == "vp9" {
                let ap = if options.audio_normalization.unwrap_or(false) {
                    "-c:a libopus -b:a 128k"
                } else {
                    "-c:a copy"
                };
                transcode_args = format!("-c:v libvpx-vp9 -crf 30 -b:v 0 {}", ap);
            } else if codec == "hevc" {
                let enc = get_encoder(
                    "libx265",
                    "hevc_nvenc",
                    "hevc_amf",
                    "hevc_qsv",
                    "hevc_videotoolbox",
                );
                if active_gpu_type != "cpu" {
                    if active_gpu_type == "nvidia" {
                        transcode_args = format!(
                            "-c:v {} -rc:v vbr -cq:v 26 -preset p4 {}",
                            enc, audio_params
                        );
                    } else if active_gpu_type == "amd" {
                        transcode_args =
                            format!("-c:v {} -rc cqp -qp_i 26 -qp_p 26 {}", enc, audio_params);
                    } else if active_gpu_type == "intel" {
                        transcode_args =
                            format!("-c:v {} -global_quality 26 {}", enc, audio_params);
                    } else if active_gpu_type == "apple" {
                        transcode_args = format!("-c:v {} -q:v 60 {}", enc, audio_params);
                    }
                } else {
                    transcode_args =
                        format!("-c:v {} -crf 26 -preset medium {}", enc, audio_params);
                }
            }

            if !transcode_args.is_empty() {
                args.push("--postprocessor-args".to_string());
                args.push(format!("VideoConvertor:{}", transcode_args));
            }

            // FORCE VideoConvertor to run if we have custom args (transcoding/normalization)
            // This ensures single-stream downloads (that don't trigger Merger) still get processed.
            args.push("--recode-video".to_string());
            args.push(container.to_string());
        }

        // Redundant if we use recode-video, but kept for safety in non-transcode paths logic check
        // Actually, merge-output-format is useful for the Merger step itself.
        args.push("--merge-output-format".to_string());
        args.push(container.to_string());
    }

    if options.range_start.is_some() || options.range_end.is_some() {
        let sanitize_time = |t: &str| {
            t.chars()
                .filter(|c| c.is_numeric() || *c == ':' || *c == '.')
                .collect::<String>()
        };
        let start = options
            .range_start
            .as_deref()
            .map(sanitize_time)
            .unwrap_or_else(|| "0".to_string());
        let end = options
            .range_end
            .as_deref()
            .map(sanitize_time)
            .unwrap_or_else(|| "inf".to_string());

        args.push("--download-sections".to_string());
        args.push(format!("*{}-{}", start, end));
        args.push("--force-keyframes-at-cuts".to_string());
    }

    // Consolidated FFmpeg Args
    let mut ffmpeg_args: Vec<String> = Vec::new();

    if options.audio_normalization.unwrap_or(false) && fmt != "gif" {
        ffmpeg_args.push("-af loudnorm=I=-16:TP=-1.5:LRA=11".to_string());
    }

    if active_gpu_type != "cpu"
        && fmt != "audio"
        && fmt != "gif"
        && !options.force_transcode.unwrap_or(false)
    {
        let encoder = match active_gpu_type {
            "nvidia" => Some("h264_nvenc"),
            "amd" => Some("h264_amf"),
            "intel" => Some("h264_qsv"),
            "apple" => Some("h264_videotoolbox"),
            _ => None,
        };

        if let Some(enc) = encoder {
            let mut hw_args = format!("-c:v {}", enc);
            if is_clipping {
                if active_gpu_type == "nvidia" {
                    hw_args.push_str(" -rc:v vbr -cq:v 19 -preset p4 -forced-idr 1");
                } else if active_gpu_type == "amd" {
                    hw_args.push_str(" -rc cqp -qp_i 22 -qp_p 22");
                } else if active_gpu_type == "intel" {
                    hw_args.push_str(" -global_quality 20");
                } else if active_gpu_type == "apple" {
                    hw_args.push_str(" -q:v 65");
                } else {
                    hw_args.push_str(" -b:v 10M");
                }
            }
            ffmpeg_args.push(hw_args);
        }
    }

    if is_clipping {
        if fmt != "gif" {
            ffmpeg_args.push("-movflags +faststart -avoid_negative_ts make_zero".to_string());
        } else {
            ffmpeg_args.push("-avoid_negative_ts make_zero -map_metadata 0".to_string());
        }
    }

    if options.audio_normalization.unwrap_or(false) && fmt != "gif" {
        let has_custom_audio = ffmpeg_args.iter().any(|a| a.contains("-c:a "));
        if !has_custom_audio {
            // Determine target format/codec
            let target_format = options.audio_format.as_deref().unwrap_or("mp3");
            let target_bitrate = options.audio_bitrate.as_deref().unwrap_or("192");

            // Map format to ffmpeg encoder
            let (codec, bitrate_flag) = match target_format {
                "mp3" => ("libmp3lame", format!("-b:a {}k", target_bitrate)),
                "m4a" | "aac" => ("aac", format!("-b:a {}k", target_bitrate)),
                "opus" => ("libopus", format!("-b:a {}k", target_bitrate)),
                "flac" => ("flac", "".to_string()), // FLAC is lossless, bitrate arg often ignored/invalid for encoder
                "wav" => ("pcm_s16le", "".to_string()), // WAV is uncompressed pcm
                _ => ("aac", "192k".to_string()),   // Fallback
            };

            ffmpeg_args.push(format!("-c:a {} {}", codec, bitrate_flag));
        }
    }

    if !ffmpeg_args.is_empty() {
        args.push("--postprocessor-args".to_string());
        args.push(format!("ffmpeg:{}", ffmpeg_args.join(" ")));
    }

    if options.subtitles.unwrap_or(false) {
        let lang = options.subtitle_lang.as_deref().unwrap_or("en");
        if lang == "all" {
            args.push("--write-subs".to_string());
            args.push("--all-subs".to_string());
        } else if lang == "auto" {
            let app_lang = match settings.language.as_str() {
                "id" => "id",
                "ms" => "ms",
                _ => "en",
            };
            let priority = match app_lang {
                "en" => "en-orig,en",
                "id" => "id,id-orig,en-orig,en",
                _ => "ms,ms-orig,en-orig,en",
            };
            args.push("--write-subs".to_string());
            args.push("--write-auto-subs".to_string());
            args.push("--sub-langs".to_string());
            args.push(priority.to_string());
        } else {
            args.push("--write-subs".to_string());
            args.push("--write-auto-subs".to_string());
            args.push("--sub-langs".to_string());
            args.push(lang.to_string());
        }

        // Prioritize native SRT if available
        args.push("--sub-format".to_string());
        args.push("srt/best".to_string());

        args.push("--ignore-errors".to_string());
        args.push("--sleep-subtitles".to_string());
        args.push("7".to_string());
        args.push("--sleep-requests".to_string());
        args.push("3".to_string());

        if options.embed_subtitles.unwrap_or(false) && fmt != "audio" && !is_clipping {
            args.push("--embed-subs".to_string());
        }

        if options.embed_subtitles.unwrap_or(false) {
            args.push("--convert-subs".to_string());
            args.push("srt".to_string());
        } else if let Some(sf) = &options.subtitle_format {
            args.push("--convert-subs".to_string());
            args.push(sf.clone());
        }
    }

    let use_sb_now = options
        .remove_sponsors
        .unwrap_or(settings.use_sponsor_block);
    if use_sb_now && !settings.sponsor_segments.is_empty() {
        args.push("--sponsorblock-remove".to_string());
        args.push(settings.sponsor_segments.join(","));
    }

    if options.live_from_start.unwrap_or(false) {
        args.push("--live-from-start".to_string());
    }

    if options.split_chapters.unwrap_or(false) && !options.audio_normalization.unwrap_or(false) {
        args.push("--split-chapters".to_string());

        let last_slash = final_filename.rfind(|c| c == '/' || c == '\\');
        if let Some(idx) = last_slash {
            let dir = &final_filename[0..idx];
            let file_with_ext = &final_filename[idx + 1..];
            let file_base = file_with_ext.split('.').next().unwrap_or(file_with_ext);
            let tpl = format!(
                "chapter:{}/[Chapters] {}/%(chapter_number)s - %(chapter)s.%(ext)s",
                dir, file_base
            );
            args.push("-o".to_string());
            args.push(tpl);
        }
    }

    if let Some(proxy) = &options.proxy {
        if !proxy.starts_with("-") {
            args.push("--proxy".to_string());
            args.push(proxy.clone());
        }
    } else if !settings.proxy.is_empty() {
        if !settings.proxy.starts_with("-") {
            args.push("--proxy".to_string());
            args.push(settings.proxy.clone());
        }
    }

    if let (Some(u), Some(p)) = (&options.username, &options.password) {
        args.push("--username".to_string());
        args.push(u.clone());
        args.push("--password".to_string());
        args.push(p.clone());
    }

    if is_youtube_url(url) && settings.use_po_token {
        let mut yt_args = "player_client=mweb".to_string();
        if !settings.po_token.is_empty() {
            yt_args.push_str(&format!(";po_token={}", settings.po_token));
        }
        if !settings.visitor_data.is_empty() {
            yt_args.push_str(&format!(";visitor_data={}", settings.visitor_data));
        }
        args.push("--extractor-args".to_string());
        args.push(format!("youtube:{}", yt_args));
    }

    if let Some(cookies) = &options.cookies {
        args.push("--cookies".to_string());
        args.push(cookies.clone());
    } else if settings.cookie_source == "browser" {
        let target = settings.browser_type.as_deref().unwrap_or("chrome");
        args.push("--cookies-from-browser".to_string());
        args.push(target.to_string());
    } else if settings.cookie_source == "txt" {
        if let Some(path) = &settings.cookie_path {
            args.push("--cookies".to_string());
            args.push(path.clone());
        }
    }

    if let Some(ua) = &options.user_agent {
        args.push("--user-agent".to_string());
        args.push(ua.clone());
    } else if settings.user_agent.trim().is_empty() {
        // Do nothing (user disabled UA)
    } else {
        let default_ua = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";
        let ua = if settings.user_agent.is_empty() {
            default_ua
        } else {
            &settings.user_agent
        };
        if !ua.starts_with("-") && !ua.contains("\n") {
            args.push("--user-agent".to_string());
            args.push(ua.to_string());
        }
    }

    if !settings.speed_limit.is_empty() && !settings.speed_limit.starts_with("-") {
        let mut limit = settings.speed_limit.trim().to_string();
        if limit.chars().all(|c| c.is_numeric()) {
            limit.push('K');
        }
        args.push("--limit-rate".to_string());
        args.push(limit);
    }

    if settings.embed_metadata && !is_clipping {
        args.push("--embed-metadata".to_string());
    }
    if settings.embed_thumbnail && !is_clipping {
        args.push("--embed-thumbnail".to_string());

        // Aesthetic Fix: Auto-cropping (square) for audio thumbnails
        if fmt == "mp3"
            || fmt == "m4a"
            || fmt == "flac"
            || fmt == "wav"
            || fmt == "opus"
            || fmt == "aac"
            || fmt == "audio"
        {
            args.push("--ppa".to_string());
            args.push("ThumbnailsConvertor:-vf crop=min(iw\\,ih):min(iw\\,ih)".to_string());
        }
    }
    if (settings.embed_chapters || settings.use_metadata_enhancer) && !is_clipping {
        args.push("--embed-chapters".to_string());
        if settings.use_metadata_enhancer {
            // Enhanced metadata includes the full info json and extra flags
            args.push("--embed-info-json".to_string());
            args.push("--add-metadata".to_string()); // Legacy but ensures uploader/comments etc in some formats
        }
    }

    if let Some(pp_args) = &options.post_processor_args {
        let trimmed = pp_args.trim();
        if !trimmed.is_empty() {
            let mut final_args = trimmed.to_string();
            if !final_args.starts_with("ffmpeg:")
                && !final_args.starts_with("sami:")
                && !final_args.starts_with("double_ffmpeg:")
            {
                final_args = format!("ffmpeg:{}", final_args);
            }
            args.push("--postprocessor-args".to_string());
            args.push(final_args);
        }
    }

    // Feature 5: Global Custom Post-Processor Presets
    for preset_id in &settings.enabled_preset_ids {
        if let Some(preset) = settings
            .post_processor_presets
            .iter()
            .find(|p| &p.id == preset_id)
        {
            let mut pp_arg = preset.args.clone();

            // Only apply if type matches or it is general
            let is_match = match preset.r#type {
                PresetType::Audio => fmt == "audio",
                PresetType::Video => fmt != "audio",
                _ => true,
            };

            if is_match && !pp_arg.trim().is_empty() {
                if !pp_arg.starts_with("ffmpeg:")
                    && !pp_arg.starts_with("sami:")
                    && !pp_arg.starts_with("double_ffmpeg:")
                {
                    pp_arg = format!("ffmpeg:{}", pp_arg);
                }
                args.push("--postprocessor-args".to_string());
                args.push(pp_arg);
            }
        }
    }

    // Privacy: Remove source metadata
    if settings.remove_source_metadata {
        args.push("--postprocessor-args".to_string());
        args.push("ffmpeg:-metadata purl= -metadata description= -metadata synopsis= -metadata comment= -metadata source=".to_string());
    }

    // Hardware Acceleration (FFmpeg)
    if settings.hardware_decoding {
        args.push("--downloader-args".to_string());
        args.push("ffmpeg:-hwaccel auto".to_string());
        args.push("--postprocessor-args".to_string());
        args.push("ffmpeg:-hwaccel auto".to_string());
    }

    // Sanitize and Add URL
    let clean_url = sanitize_url(url);
    args.push("--".to_string());
    args.push(clean_url);

    log::debug!("Finalized yt-dlp arguments: {:?}", args);
    args
}

pub fn sanitize_url(url: &str) -> String {
    if let Ok(mut parsed) = url::Url::parse(url) {
        let mut query: Vec<(String, String)> = parsed.query_pairs().into_owned().collect();

        // 1. Blacklist for general tracking parameters
        // We removed 'list', 'index' from blacklist to support playlists
        // We keep tracking params
        let blacklisted = [
            "si",
            "pp",
            "feature",
            "utm_source",
            "utm_medium",
            "utm_campaign",
            "utm_term",
            "utm_content",
            "gclid",
            "fbclid",
            "igshid",
        ];
        query.retain(|(k, _)| !blacklisted.contains(&k.as_str()));

        // 2. Re-encode query
        let mut query_str = String::new();
        for (i, (k, v)) in query.iter().enumerate() {
            if i > 0 {
                query_str.push('&');
            }
            query_str.push_str(k);
            query_str.push('=');
            query_str.push_str(v);
        }

        if query_str.is_empty() {
            parsed.set_query(None);
        } else {
            parsed.set_query(Some(&query_str));
        }

        parsed.to_string()
    } else {
        url.to_string()
    }
}

// ============================================================================
// Unit Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // --- is_youtube_url tests ---

    #[test]
    fn is_youtube_url_standard_watch() {
        assert!(is_youtube_url(
            "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
        ));
        assert!(is_youtube_url("http://youtube.com/watch?v=abc123"));
        assert!(is_youtube_url("https://youtube.com/playlist?list=PLtest"));
    }

    #[test]
    fn is_youtube_url_short_format() {
        assert!(is_youtube_url("https://youtu.be/dQw4w9WgXcQ"));
        assert!(is_youtube_url("http://youtu.be/abc123"));
        assert!(is_youtube_url("youtu.be/test"));
    }

    #[test]
    fn is_youtube_url_music_and_subdomains() {
        assert!(is_youtube_url("https://music.youtube.com/watch?v=abc"));
        assert!(is_youtube_url("https://m.youtube.com/watch?v=abc"));
    }

    #[test]
    fn is_youtube_url_rejects_other_sites() {
        assert!(!is_youtube_url("https://vimeo.com/123456"));
        assert!(!is_youtube_url("https://tiktok.com/@user/video/123"));
        assert!(!is_youtube_url("https://twitter.com/user/status/123"));
        assert!(!is_youtube_url("not a url"));
        assert!(!is_youtube_url(""));
    }

    // --- SupportedSites tests ---

    #[test]
    fn supported_sites_vip_check() {
        let sites = SupportedSites::new();

        // VIP sites
        assert!(sites.is_vip("youtube.com"));
        assert!(sites.is_vip("youtu.be"));
        assert!(sites.is_vip("tiktok.com"));
        assert!(sites.is_vip("instagram.com"));
        assert!(sites.is_vip("twitter.com"));
        assert!(sites.is_vip("x.com"));
        assert!(sites.is_vip("twitch.tv"));

        // Subdomains of VIPs
        assert!(sites.is_vip("music.youtube.com"));
        assert!(sites.is_vip("m.tiktok.com"));

        // Not VIP
        assert!(!sites.is_vip("randomsite.com"));
        assert!(!sites.is_vip(""));
    }

    #[test]
    fn supported_sites_matches_vip_urls() {
        let sites = SupportedSites::new();

        assert!(sites.matches("https://www.youtube.com/watch?v=test"));
        assert!(sites.matches("https://youtu.be/test"));
        assert!(sites.matches("https://tiktok.com/@user/video/123"));
        assert!(sites.matches("https://www.instagram.com/p/abc123/"));
    }

    #[test]
    fn supported_sites_rejects_invalid_urls() {
        let sites = SupportedSites::new();

        assert!(!sites.matches("not a url"));
        assert!(!sites.matches(""));
        assert!(!sites.matches("file:///local/path"));
    }

    #[test]
    fn supported_sites_dynamic_loading() {
        let sites = SupportedSites::new();

        // Manually add a domain
        {
            let mut domains = sites.domains.write().unwrap();
            domains.insert("testsite.com".to_string());
        }

        // Should match now
        assert!(sites.matches("https://testsite.com/video/123"));
        assert!(sites.matches("https://sub.testsite.com/video/123"));
    }

    #[test]
    fn supported_sites_keyword_matching() {
        let sites = SupportedSites::new();

        // Add a keyword
        {
            let mut keywords = sites.keywords.write().unwrap();
            keywords.insert("bilibili".to_string());
        }

        // Should match via keyword
        assert!(sites.matches("https://www.bilibili.tv/video/123"));
    }

    // --- sanitize_filename tests ---
    // Note: sanitize_filename requires meta JSON and YtDlpOptions, testing core sanitization

    #[test]
    fn sanitize_segment_removes_dangerous_chars() {
        // Direct test of the sanitize logic
        let sanitize = |s: &str| -> String {
            s.replace(|c: char| "\\/:*?\"<>|%".contains(c), "_")
                .replace("..", "")
                .trim()
                .to_string()
        };

        assert_eq!(sanitize("normal_filename"), "normal_filename");
        assert_eq!(
            sanitize("file<with>special:chars"),
            "file_with_special_chars"
        );
        assert_eq!(sanitize("path/traversal"), "path_traversal");
        assert_eq!(sanitize("dots..dots"), "dotsdots");
        assert_eq!(sanitize("  spaces  "), "spaces");
        assert_eq!(sanitize("percent%encode"), "percent_encode");
        assert_eq!(sanitize("pipe|char"), "pipe_char");
    }

    #[test]
    fn sanitize_filename_with_empty_custom_name() {
        let meta = serde_json::json!({
            "title": "Test Video Title",
            "id": "abc123",
            "ext": "mp4"
        });

        let options = YtDlpOptions {
            custom_filename: Some("".to_string()),
            ..Default::default()
        };

        let result = sanitize_filename("{title}", &meta, &options);
        assert!(result.contains("Test Video Title"));
    }

    #[test]
    fn sanitize_filename_with_custom_name() {
        let meta = serde_json::json!({
            "title": "Original Title",
            "id": "abc123",
            "ext": "mp4"
        });

        let options = YtDlpOptions {
            custom_filename: Some("My Custom Name".to_string()),
            ..Default::default()
        };

        let result = sanitize_filename("{title}", &meta, &options);
        assert!(result.contains("My Custom Name"));
        assert!(!result.contains("Original Title"));
    }

    #[test]
    fn sanitize_filename_extension_handling() {
        let meta = serde_json::json!({
            "title": "Test",
            "ext": "mp4"
        });

        let options = YtDlpOptions::default();
        let result = sanitize_filename("{title}", &meta, &options);
        assert!(result.ends_with(".mp4"));
    }

    #[test]
    fn sanitize_filename_audio_mode() {
        let meta = serde_json::json!({
            "title": "Audio Track",
            "ext": "m4a"
        });

        let options = YtDlpOptions {
            format: Some("audio".to_string()),
            audio_format: Some("mp3".to_string()),
            ..Default::default()
        };

        let result = sanitize_filename("{title}", &meta, &options);
        assert!(result.ends_with(".mp3"));
    }

    #[test]
    fn sanitize_filename_length_limit() {
        let long_title = "A".repeat(300);
        let meta = serde_json::json!({
            "title": long_title,
            "ext": "mp4"
        });

        let options = YtDlpOptions::default();
        let result = sanitize_filename("{title}", &meta, &options);

        // Should be truncated to ~200 chars + extension
        assert!(result.len() <= 210);
    }
}
