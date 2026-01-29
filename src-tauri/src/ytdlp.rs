use serde::{Deserialize, Serialize};
use tauri::{AppHandle, Manager};

// --- Constants ---
const BINARIES_DENO: &str = "bin/deno";
const DEFAULTS_SOCKET_TIMEOUT: &str = "15";

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
    // Parabolic
    pub enable_desktop_notifications: bool,
    pub prevent_suspend_during_download: bool,
}

// --- Logic ---

pub fn is_youtube_url(url: &str) -> bool {
    url.contains("youtube.com") || url.contains("youtu.be")
}

pub fn sanitize_filename(
    template: &str,
    meta: &serde_json::Value,
    options: &YtDlpOptions,
) -> String {
    let sanitize_segment = |s: &str| -> String {
        s.replace(|c: char| "\\/:*?\"<>|".contains(c), "_")
            .replace("..", "")
            .trim()
            .to_string()
    };

    let mut final_name = template.to_string();

    // Determine Variable Values
    let title_value = options
        .custom_filename
        .as_deref()
        .or_else(|| meta.get("title").and_then(|v| v.as_str()))
        .unwrap_or("Untitled");

    let mut resolution = "NA".to_string();
    if options.format.as_deref() == Some("audio") {
        resolution = "Audio".to_string();
    } else {
        if let Some(h) = meta.get("height").and_then(|v| v.as_u64()) {
            resolution = format!("{}p", h);
        } else if let Some(fmt) = &options.format {
            if fmt != "best" {
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

    let vars = vec![
        ("{title}", title_value),
        ("{Title}", title_value),
        ("{TITLE}", title_value),
        ("{res}", &resolution),
        ("{Res}", &resolution),
        ("{RES}", &resolution),
        ("{source}", source),
        ("{Source}", source),
        ("{date}", &date),
        ("{Date}", &date),
        (
            "{id}",
            meta.get("id").and_then(|v| v.as_str()).unwrap_or(""),
        ),
        (
            "{author}",
            meta.get("uploader")
                .and_then(|v| v.as_str())
                .unwrap_or("Unknown"),
        ),
    ];

    for (k, v) in vars {
        final_name = final_name.replace(k, v);
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

    if final_name.to_lowercase().ends_with(&expected_ext) {
    } else {
        // Naive strip
        if final_name.ends_with(".mp4")
            || final_name.ends_with(".mp3")
            || final_name.ends_with(".mkv")
        {
            final_name = final_name
                .rsplitn(2, '.')
                .nth(1)
                .unwrap_or(&final_name)
                .to_string();
        }
        final_name = format!("{}{}", final_name, expected_ext);
    }

    if final_name.trim() == expected_ext.as_str() {
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
    // Logic matching TS buildYtDlpArgs

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
        "--force-overwrites".to_string(),
        "--encoding".to_string(), "utf-8".to_string(),
        "-N".to_string(), concurrent_fragments.to_string(),
        "--continue".to_string(),
        "--socket-timeout".to_string(), DEFAULTS_SOCKET_TIMEOUT.to_string(),
        "--progress-template".to_string(), "SCENECLIP_PROGRESS;%(progress.status)s;%(progress.downloaded_bytes)s;%(progress.total_bytes)s;%(progress.total_bytes_estimate)s;%(progress.speed)s;%(progress.eta)s".to_string(),
        "-S".to_string(), "res:2160,fps,br,size".to_string(),
        "--ignore-config".to_string(),
    ];

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

        let mut active_js_path = options.js_runtime_path.clone().or_else(|| {
            if !settings.binary_path_node.is_empty() {
                Some(settings.binary_path_node.clone())
            } else {
                None
            }
        });

        if active_js_path.is_none() {
            if let Ok(sidecar_path) = app_handle
                .path()
                .resolve(BINARIES_DENO, tauri::path::BaseDirectory::Resource)
            {
                if sidecar_path.exists() {
                    active_js_path = Some(sidecar_path.to_string_lossy().to_string());
                }
            }
        }

        if let Some(path) = active_js_path {
            let lower = path.to_lowercase();
            let runtime_type = if lower.contains("deno") {
                "deno"
            } else if lower.contains("bun") {
                "bun"
            } else if lower.contains("qjs") {
                "quickjs"
            } else {
                "node"
            };

            args.push("--js-runtimes".to_string());
            args.push(format!("{}:{}", runtime_type, path));

            if runtime_type == "deno" || runtime_type == "bun" {
                args.push("--remote-components".to_string());
                args.push("ejs:npm".to_string());
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

    if !settings.binary_path_ffmpeg.trim().is_empty() {
        args.push("--ffmpeg-location".to_string());
        args.push(settings.binary_path_ffmpeg.clone());
    }

    if settings.use_aria2c {
        args.push("--downloader".to_string());
        args.push("aria2c".to_string());
        args.push("--downloader-args".to_string());
        args.push("aria2c:--summary-interval=0 --enable-color=false -x 16 -k 1M".to_string());

        if is_clipping {
            args.push("--format-sort".to_string());
            args.push("proto:https".to_string());
        }
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

        if options.audio_normalization.unwrap_or(false) {
            args.push("--postprocessor-args".to_string());
            args.push("ffmpeg:-af loudnorm=I=-16:TP=-1.5:LRA=11".to_string());
        }
    } else if fmt == "gif" {
        args.push("-S".to_string());
        args.push("res:720,ext:mp4,fps:30".to_string());

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
        args.push(format!("VideoConvertor:-vf {} -loop 0", gif_filter));
    } else {
        let mut h = String::new();
        if fmt != "Best" && fmt != "audio" {
            let res = fmt.replace("p", "").replace("P", ""); // simplistic regex replacement
            h = format!("[height<={}]", res);
        }

        let codec = options.video_codec.as_deref().unwrap_or("auto");
        let format_string = match codec {
            "h264" => format!("bestvideo{}[vcodec^=avc]+bestaudio[ext=m4a]/best{}[ext=mp4]", h, h),
            "av1" => format!("bestvideo{}[vcodec^=av01]+bestaudio/bestvideo{}[vcodec^=vp9]+bestaudio", h, h),
            "vp9" => format!("bestvideo{}[vcodec^=vp9]+bestaudio", h),
            "hevc" => format!("bestvideo{}[vcodec^=hevc]+bestaudio/bestvideo{}[vcodec^=hev1]+bestaudio/bestvideo{}[vcodec^=hvc1]+bestaudio", h, h, h),
            _ => format!("bestvideo{}+bestaudio/best{}", h, h),
        };
        args.push("-f".to_string());
        args.push(format_string);

        if options.force_transcode.unwrap_or(false) && codec != "auto" {
            let mut transcode_args = String::new();

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
                    transcode_args =
                        format!("-c:v {} -crf 23 -preset medium {}", enc, audio_params);
                }
            } else if codec == "av1" {
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
        }

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
        && !is_clipping
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
            ffmpeg_args.push("-c:a aac -b:a 192k".to_string());
        }
    } else if active_gpu_type != "cpu"
        && fmt != "audio"
        && fmt != "gif"
        && !is_clipping
        && !options.force_transcode.unwrap_or(false)
    {
        let has_custom_audio = ffmpeg_args.iter().any(|a| a.contains("-c:a "));
        if !has_custom_audio {
            ffmpeg_args.push("-c:a copy".to_string());
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
            let priority = if app_lang == "en" {
                "en-orig,en"
            } else {
                if app_lang == "id" {
                    "id,id-orig,en-orig,en"
                } else {
                    "ms,ms-orig,en-orig,en"
                }
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
                "{}/[Chapters] {}/%(chapter_number)s - %(chapter)s.%(ext)s",
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
    }
    if (settings.embed_chapters || settings.use_metadata_enhancer) && !is_clipping {
        args.push("--embed-chapters".to_string());
        if settings.use_metadata_enhancer {
            args.push("--embed-info-json".to_string());
        }
    }

    if let Some(pp_args) = &options.post_processor_args {
        let trimmed = pp_args.trim();
        if !trimmed.is_empty() {
            if !trimmed.starts_with("ffmpeg:")
                && !trimmed.starts_with("sami:")
                && !trimmed.starts_with("double_ffmpeg:")
            {
                args.push("--postprocessor-args".to_string());
                args.push(format!("ffmpeg:{}", trimmed));
            } else {
                args.push("--postprocessor-args".to_string());
                args.push(trimmed.to_string());
            }
        }
    }

    args.push("--".to_string());
    args.push(url.to_string());

    args
}
