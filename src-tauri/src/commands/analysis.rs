use lazy_static::lazy_static;
use regex::Regex;
use serde::Deserialize;
use std::path::Path;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

lazy_static! {
    /// Pre-compiled regex for parsing size strings like "1.5 GB", "200 MiB", "500kb".
    static ref SIZE_RE: Regex = Regex::new(r"([\d.,]+)\s*([A-Z]*)").unwrap();
}

// ─── Shared Constants ────────────────────────────────────────────────

/// Bitrate fallback formula: kbps → bytes/sec → total bytes.
/// `target_bitrate` is in kbps.
fn bitrate_bytes(kbps: f64, duration_secs: f64) -> f64 {
    (kbps * 1000.0 / 8.0) * duration_secs
}

/// Safely clamp an `f64` to `u64`, saturating at `u64::MAX`.
fn clamp_to_u64(value: f64) -> u64 {
    if value <= 0.0 {
        0
    } else if value >= u64::MAX as f64 {
        u64::MAX
    } else {
        value as u64
    }
}

// ─── Data Types ──────────────────────────────────────────────────────

#[derive(Debug, Deserialize, PartialEq)]
#[serde(rename_all = "lowercase")]
pub enum MediaType {
    Video,
    Audio,
    Image,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DownloadEstimationOptions {
    pub is_clipping: bool,
    pub range_start: Option<String>,
    pub range_end: Option<String>,
    pub format: Option<String>,
    pub audio_bitrate: Option<String>,
    pub gif_scale: Option<u32>,
    pub gif_fps: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct YtdlpFormat {
    pub acodec: Option<String>,
    pub vcodec: Option<String>,
    pub filesize: Option<f64>,
    #[serde(alias = "filesizeApprox")]
    pub filesize_approx: Option<f64>,
    pub abr: Option<f64>,
    pub height: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct YtdlpMeta {
    pub filesize: Option<f64>,
    #[serde(alias = "filesizeApprox")]
    pub filesize_approx: Option<f64>,
    pub duration: Option<f64>,
    pub formats: Option<Vec<YtdlpFormat>>,
    pub height: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct EstimationParams {
    pub file_path: Option<String>,
    pub original_size_str: Option<String>,
    pub media_type: MediaType,
    pub preset: String,
    pub crf: i32,
    pub audio_bitrate: String,
}

#[derive(Debug, Deserialize)]
struct FfprobeOutput {
    format: Option<FfprobeFormat>,
    streams: Option<Vec<FfprobeStream>>,
}

#[derive(Debug, Deserialize)]
struct FfprobeFormat {
    duration: Option<String>,
    bit_rate: Option<String>,
}

#[derive(Debug, Deserialize)]
struct FfprobeStream {
    #[allow(dead_code)]
    width: Option<u32>,
    height: Option<u32>,
}

// ─── Parsing Helpers ─────────────────────────────────────────────────

/// Parses time strings in `HH:MM:SS`, `MM:SS`, or `SS` format into seconds.
fn parse_time(time_str: &str) -> f64 {
    if time_str.is_empty() {
        return 0.0;
    }

    let parts: Vec<&str> = time_str.split(':').collect();
    let mut seconds = 0.0;

    let parse_part = |s: &str| -> f64 {
        s.parse::<f64>().unwrap_or_else(|_| {
            log::warn!("Failed to parse time component '{}' in '{}'", s, time_str);
            0.0
        })
    };

    match parts.len() {
        3 => {
            seconds += parse_part(parts[0]) * 3600.0;
            seconds += parse_part(parts[1]) * 60.0;
            seconds += parse_part(parts[2]);
        }
        2 => {
            seconds += parse_part(parts[0]) * 60.0;
            seconds += parse_part(parts[1]);
        }
        1 => {
            seconds += parse_part(parts[0]);
        }
        _ => {}
    }

    seconds
}

/// Parses strings like "1.5 GB", "200 MiB", "500kb" into bytes.
///
/// Note: GB and GiB are both treated as binary (1024-based) for consistency
/// with how yt-dlp and most media tools report sizes.
fn parse_size_to_bytes(s: &str) -> u64 {
    let s = s.trim().to_uppercase();

    let caps = match SIZE_RE.captures(&s) {
        Some(c) => c,
        None => return 0,
    };

    let num_str = caps.get(1).map_or("0", |m| m.as_str()).replace(',', ".");
    let value: f64 = num_str.parse().unwrap_or(0.0);

    let unit = caps.get(2).map_or("", |m| m.as_str());

    let multiplier = match unit {
        "G" | "GB" | "GIB" => 1_073_741_824.0,
        "M" | "MB" | "MIB" => 1_048_576.0,
        "K" | "KB" | "KIB" => 1_024.0,
        "T" | "TB" | "TIB" => 1_099_511_627_776.0,
        _ => 1.0,
    };

    (value * multiplier) as u64
}

/// Parses bitrate strings like "128", "128k", "1.5mbps" into kbps.
fn parse_bitrate_kbps(s: &str) -> u32 {
    let s = s.to_lowercase();
    let clean: String = s
        .chars()
        .filter(|c| c.is_ascii_digit() || *c == '.' || *c == ',')
        .collect();
    let val: f32 = clean.replace(',', ".").parse().unwrap_or(0.0);

    if s.contains("mbps") || s.contains("mb/s") || s.contains("mbit") {
        (val * 1000.0) as u32
    } else {
        val as u32
    }
}

// ─── Format Helpers ──────────────────────────────────────────────────

/// Returns the best available filesize for a format entry.
fn get_format_size(f: &YtdlpFormat) -> f64 {
    f.filesize.or(f.filesize_approx).unwrap_or(0.0)
}

/// Predicate: true if the format is a video-only stream.
fn is_video_stream(f: &YtdlpFormat) -> bool {
    f.vcodec.as_deref() != Some("none")
}

/// Predicate: true if the format is an audio-only stream.
fn is_audio_only_stream(f: &YtdlpFormat) -> bool {
    f.acodec.as_deref() != Some("none") && f.vcodec.as_deref() == Some("none")
}

/// Sort format references by filesize descending (largest first).
fn sort_formats_desc(formats: &mut [&YtdlpFormat]) {
    formats.sort_by(|a, b| {
        get_format_size(b)
            .partial_cmp(&get_format_size(a))
            .unwrap_or(std::cmp::Ordering::Equal)
    });
}

/// Returns the largest filesize among the given format refs.
fn largest_format_size(formats: &mut Vec<&YtdlpFormat>) -> f64 {
    sort_formats_desc(formats);
    formats.first().map(|f| get_format_size(f)).unwrap_or(0.0)
}

/// Finds the format whose `abr` is closest to `target_bitrate` (in kbps).
fn find_closest_audio_format<'a>(
    audio_formats: Vec<&'a YtdlpFormat>,
    target_bitrate: f64,
) -> Option<&'a YtdlpFormat> {
    audio_formats.into_iter().reduce(|prev, curr| {
        let curr_diff = (curr.abr.unwrap_or(0.0) - target_bitrate).abs();
        let prev_diff = (prev.abr.unwrap_or(0.0) - target_bitrate).abs();
        if curr_diff < prev_diff { curr } else { prev }
    })
}

// ─── Estimation Logic ────────────────────────────────────────────────

/// Returns the fraction of the video that's being clipped (0.0–1.0).
/// Returns 1.0 if not clipping, or if total duration is invalid.
fn calculate_clip_ratio(options: &DownloadEstimationOptions, total: f64) -> f64 {
    if !options.is_clipping || total <= 0.0 {
        return 1.0;
    }

    let s = parse_time(options.range_start.as_deref().unwrap_or(""));
    let e = if let Some(end_str) = &options.range_end {
        parse_time(end_str)
    } else {
        total
    };

    let duration = (e.min(total) - s.max(0.0)).max(0.0);
    let ratio = duration / total;
    
    // 15% VBR Buffer, capped at 1.0 (so a clip is never estimated larger than the full video base format)
    (ratio * 1.15).min(1.0)
}

/// Estimates size by scaling a known resolution's size to a target resolution.
/// Uses quadratic scaling (area-proportional) capped at 1.5x.
fn calculate_scaled_fallback(target_height: u32, known_size: f64, known_h: f64, audio_size: f64) -> f64 {
    if known_h <= 0.0 {
        return known_size + audio_size;
    }
    // Sublinear scaling (power 1.5) due to macroblock/motion-vector efficiency in codecs. Capped at 4.0x to prevent extreme inflation.
    let scale = (target_height as f64 / known_h).powf(1.5).min(4.0);
    known_size * scale + audio_size
}

/// Estimates GIF output size based on resolution, fps, and duration.
fn calculate_gif_size(options: &DownloadEstimationOptions, total: f64, meta_height: Option<u32>) -> f64 {
    let h = options.gif_scale.unwrap_or_else(|| meta_height.unwrap_or(480)) as f64;
    let fps = options.gif_fps.unwrap_or(15) as f64;

    // Use full duration. The clip ratio will be applied at the end of estimate_download_size!
    let base_factor = (h / 480.0) * (fps / 15.0) * 0.5 * 1024.0 * 1024.0;
    base_factor * total.max(1.0)
}

/// Estimates audio-only download size for a target bitrate.
fn calculate_audio_size(options: &DownloadEstimationOptions, formats: &[YtdlpFormat], total: f64, audio_size: f64) -> f64 {
    let target_bitrate: f64 = options
        .audio_bitrate
        .as_deref()
        .unwrap_or("128")
        .parse()
        .unwrap_or(128.0);

    let audio_formats: Vec<_> = formats.iter().filter(|f| is_audio_only_stream(f)).collect();

    if audio_formats.is_empty() {
        return if audio_size > 0.0 { audio_size } else { bitrate_bytes(target_bitrate, total) };
    }

    let from_meta = find_closest_audio_format(audio_formats, target_bitrate)
        .map(|f| get_format_size(f))
        .unwrap_or(0.0);

    if from_meta > 0.0 { from_meta } else { bitrate_bytes(target_bitrate, total) }
}

/// Estimates size of the "Best" quality download (largest video + best audio).
fn calculate_best_size(formats: &[YtdlpFormat], audio_size: f64) -> f64 {
    let mut video_formats: Vec<_> = formats.iter().filter(|f| is_video_stream(f)).collect();
    let video_size = largest_format_size(&mut video_formats);
    video_size + audio_size
}

/// Estimates download size for a specific resolution target.
///
/// Fallback chain:
/// 1. Exact height match → use its filesize
/// 2. Any video with known size → scale proportionally to target height
/// 3. Nearest height match → scale proportionally
/// 4. Global fallback filesize
fn calculate_resolution_size(
    formats: &[YtdlpFormat],
    target_height: u32,
    audio_size: f64,
    fallback_filesize: f64,
) -> f64 {
    // 1. Try exact height match
    let mut exact_matches: Vec<_> = formats
        .iter()
        .filter(|f| f.height == Some(target_height) && is_video_stream(f))
        .collect();

    if !exact_matches.is_empty() {
        let video_size = largest_format_size(&mut exact_matches);

        if video_size > 0.0 {
            return video_size + audio_size;
        }

        // Exact height found but no filesize — try scaling from any known format
        if let Some((known_size, known_h)) = find_best_known_video(formats) {
            return calculate_scaled_fallback(target_height, known_size, known_h, audio_size);
        }

        return if fallback_filesize > 0.0 { fallback_filesize } else { audio_size };
    }

    // 2. No exact match — find the nearest resolution and scale
    let all_video: Vec<_> = formats
        .iter()
        .filter(|f| is_video_stream(f) && f.height.is_some())
        .collect();

    if all_video.is_empty() || target_height == 0 {
        return fallback_filesize;
    }

    let nearest = all_video.iter().min_by_key(|f| {
        (f.height.unwrap_or(0) as i64 - target_height as i64).unsigned_abs()
    });

    if let Some(near) = nearest {
        let near_size = get_format_size(near);
        let near_h = near.height.unwrap_or(1) as f64;

        if near_size > 0.0 {
            return calculate_scaled_fallback(target_height, near_size, near_h, audio_size);
        }
    }

    fallback_filesize
}

/// Finds the video format with the highest resolution that has a known filesize.
/// Returns `(filesize, height)`.
fn find_best_known_video(formats: &[YtdlpFormat]) -> Option<(f64, f64)> {
    formats
        .iter()
        .filter(|f| is_video_stream(f))
        .filter_map(|f| {
            let sz = get_format_size(f);
            let h = f.height.unwrap_or(0) as f64;
            if sz > 0.0 && h > 0.0 { Some((sz, h)) } else { None }
        })
        .max_by(|a, b| a.1.partial_cmp(&b.1).unwrap_or(std::cmp::Ordering::Equal))
}

// ─── Tauri Commands ──────────────────────────────────────────────────

/// Estimates the output file size after re-encoding / compressing a local file.
/// Uses ffprobe to get actual bitrate, or falls back to a parsed size string.
#[tauri::command]
pub async fn estimate_export_size(
    app_handle: AppHandle,
    params: EstimationParams,
) -> Result<u64, String> {
    log::info!("Estimating export size for: {:?}", params);

    let (duration_secs, actual_bitrate, probe_height) = probe_file_info(&app_handle, params.file_path.as_deref()).await;

    let duration = duration_secs.unwrap_or(1.0).max(1.0);
    
    let base_bytes = match params.media_type {
        MediaType::Video => {
            // Solve the CRF Paradox: Ignore original bitrate; apply empirical Baseline Bitrate instead.
            let base_kbps = match probe_height.unwrap_or(1080) {
                h if h >= 4320 => 35_000.0, // 8K
                h if h >= 2160 => 15_000.0, // 4K
                h if h >= 1440 => 8_000.0,  // 2K
                h if h >= 1080 => 4_000.0,  // 1080p
                h if h >= 720  => 2_500.0,  // 720p
                h if h >= 480  => 1_200.0,  // 480p
                h if h >= 360  => 700.0,    // 360p
                _              => 2_500.0,  // Default fallback
            };
            clamp_to_u64(bitrate_bytes(base_kbps, duration))
        },
        _ => {
            // Audio mostly respects exact bitrate
            match (duration_secs, actual_bitrate) {
                (Some(d), Some(b)) => clamp_to_u64(d * (b as f64 / 8.0)),
                _ => params.original_size_str.as_deref().map_or(0, parse_size_to_bytes),
            }
        }
    };

    if base_bytes == 0 {
        return Ok(0);
    }

    let crf_multiplier = estimate_compression_ratio(&params);
    let with_container_overhead = (base_bytes as f64 * crf_multiplier) * 1.01;

    Ok(clamp_to_u64(with_container_overhead))
}

/// Estimates the download size for a remote video based on yt-dlp metadata.
#[tauri::command]
pub async fn estimate_download_size(
    meta: Option<YtdlpMeta>,
    options: DownloadEstimationOptions,
) -> Result<u64, String> {
    log::info!("Estimating download size...");

    let meta = match meta {
        Some(m) => m,
        None => return Ok(0),
    };

    let filesize = meta.filesize.or(meta.filesize_approx).unwrap_or(0.0);
    if filesize == 0.0 && meta.formats.is_none() {
        return Ok(0);
    }

    let total = meta.duration.unwrap_or(1.0).max(1.0);
    let clip_ratio = calculate_clip_ratio(&options, total);

    let base_size = match &meta.formats {
        Some(formats) => {
            let mut audio_refs: Vec<_> = formats.iter().filter(|f| is_audio_only_stream(f)).collect();
            let audio_size = largest_format_size(&mut audio_refs);
            let format_pref = options.format.as_deref().unwrap_or("").to_lowercase();

            match format_pref.as_str() {
                "audio" => calculate_audio_size(&options, formats, total, audio_size),
                "gif" => calculate_gif_size(&options, total, meta.height),
                "best" => calculate_best_size(formats, audio_size),
                _ => {
                    let height_str: String = format_pref.chars().filter(|c| c.is_numeric()).collect();
                    let target_height: u32 = height_str.parse().unwrap_or(0);
                    calculate_resolution_size(formats, target_height, audio_size, filesize)
                }
            }
        }
        None => filesize,
    };

    let final_size = (base_size * clip_ratio) * 1.01; // Global 1.01x container format overhead
    Ok(clamp_to_u64(final_size))
}

// ─── Internal Helpers ────────────────────────────────────────────────

/// Runs ffprobe on a local file and returns (duration_secs, bitrate_bps).
async fn probe_file_info(app_handle: &AppHandle, file_path: Option<&str>) -> (Option<f64>, Option<u64>, Option<u32>) {
    let path = match file_path {
        Some(p) if Path::new(p).exists() => p,
        _ => return (None, None, None),
    };

    let sidecar_cmd = match app_handle.shell().sidecar("ffprobe") {
        Ok(cmd) => cmd,
        Err(e) => {
            log::error!("Sidecar ffprobe not found: {}", e);
            return (None, None, None);
        }
    };

    let output = match sidecar_cmd
        .args(["-v", "error", "-show_entries", "format=duration,bit_rate:stream=width,height", "-of", "json", path])
        .output()
        .await
    {
        Ok(o) => o,
        Err(e) => {
            log::error!("FFprobe exec failed: {}", e);
            return (None, None, None);
        }
    };

    if !output.status.success() {
        let stderr = String::from_utf8_lossy(&output.stderr);
        log::warn!("FFprobe failed for {:?}: {}", path, stderr);
        return (None, None, None);
    }

    match serde_json::from_slice::<FfprobeOutput>(&output.stdout) {
        Ok(json_out) => {
            let format = json_out.format;
            let duration = format.as_ref().and_then(|f| f.duration.as_ref()?.parse().ok());
            let bitrate = format.as_ref().and_then(|f| f.bit_rate.as_ref()?.parse().ok());
            let height = json_out.streams.and_then(|streams| streams.into_iter().find_map(|s| s.height));
            (duration, bitrate, height)
        }
        Err(_) => {
            log::warn!("FFprobe returned unparseable JSON for {:?}", path);
            (None, None, None)
        }
    }
}

/// Determines the compression ratio for a given export preset + media type.
fn estimate_compression_ratio(params: &EstimationParams) -> f64 {
    match params.media_type {
        MediaType::Audio => match params.preset.as_str() {
            "wa" => 0.3,
            "social" => 0.7,
            "archive" => 1.0,
            _ => {
                let bit = parse_bitrate_kbps(&params.audio_bitrate);
                if bit >= 320 { 1.0 } else if bit >= 128 { 0.7 } else { 0.4 }
            }
        },
        MediaType::Video => match params.crf {
            0..=17 => 1.50,  // Significantly larger than empirical baseline
            18..=22 => 1.00, // Baseline equivalent
            23..=27 => 0.70, // Standard compression
            28..=34 => 0.40, // High compression
            _ => 0.20,       // Maximum compression (35+)
        },
        MediaType::Image => 1.0,
    }
}
