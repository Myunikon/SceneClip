use regex::Regex;
use serde::Deserialize;
use std::path::Path;
use tauri::AppHandle;
use tauri_plugin_shell::ShellExt;

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
    pub filesize_approx: Option<f64>,
    pub abr: Option<f64>,
    pub height: Option<u32>,
}

#[derive(Debug, Deserialize)]
pub struct YtdlpMeta {
    pub filesize: Option<f64>,
    pub filesize_approx: Option<f64>,
    pub duration: Option<f64>,
    pub formats: Option<Vec<YtdlpFormat>>,
    pub height: Option<u32>,
}

fn parse_time(time_str: &str) -> f64 {
    let parts: Vec<&str> = time_str.split(':').collect();
    let mut seconds = 0.0;

    if parts.len() == 3 {
        seconds += parts[0].parse::<f64>().unwrap_or(0.0) * 3600.0;
        seconds += parts[1].parse::<f64>().unwrap_or(0.0) * 60.0;
        seconds += parts[2].parse::<f64>().unwrap_or(0.0);
    } else if parts.len() == 2 {
        seconds += parts[0].parse::<f64>().unwrap_or(0.0) * 60.0;
        seconds += parts[1].parse::<f64>().unwrap_or(0.0);
    } else if parts.len() == 1 {
        seconds += parts[0].parse::<f64>().unwrap_or(0.0);
    }

    seconds
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
}

#[derive(Debug, Deserialize)]
struct FfprobeFormat {
    duration: Option<String>,
    bit_rate: Option<String>,
}

/// Parses strings like "1.5 GB", "200 MiB", "500kb" into bytes.
fn parse_size_to_bytes(s: &str) -> u64 {
    let s = s.trim().to_uppercase();

    // Regex to capture numeric part and unit part
    // Matches "123", "1.5", "1,5", with optional unit "GB", "KiB", etc.
    let re = match Regex::new(r"([\d.,]+)\s*([A-Z]*)") {
        Ok(r) => r,
        Err(_) => return 0, // Should never happen with valid regex
    };

    let caps = match re.captures(&s) {
        Some(c) => c,
        None => return 0,
    };

    // Parse number (handle both dot and comma)
    let num_str = caps.get(1).map_or("0", |m| m.as_str()).replace(',', ".");
    let value: f64 = num_str.parse().unwrap_or(0.0);

    let unit = caps.get(2).map_or("", |m| m.as_str());

    // multipliers (handling decimal and binary prefixes roughly same for safety or strictly)
    let multiplier = match unit {
        "G" | "GB" | "GIB" => 1_073_741_824.0, // 1024^3
        "M" | "MB" | "MIB" => 1_048_576.0,     // 1024^2
        "K" | "KB" | "KIB" => 1_024.0,         // 1024
        "T" | "TB" | "TIB" => 1_099_511_627_776.0,
        _ => 1.0,
    };

    (value * multiplier) as u64
}

fn parse_bitrate_kbps(s: &str) -> u32 {
    let s = s.to_lowercase();
    let clean: String = s
        .chars()
        .filter(|c| c.is_digit(10) || *c == '.' || *c == ',')
        .collect();
    let val: f32 = clean.replace(',', ".").parse().unwrap_or(0.0);

    if s.contains('m') {
        (val * 1000.0) as u32
    } else {
        val as u32
    }
}

#[tauri::command]
pub async fn estimate_export_size(
    app_handle: AppHandle,
    params: EstimationParams,
) -> Result<u64, String> {
    log::info!("Estimating export size for: {:?}", params);

    let mut duration_secs: Option<f64> = None;
    let mut actual_bitrate: Option<u64> = None;

    if let Some(ref path) = params.file_path {
        if Path::new(path).exists() {
            let sidecar_cmd = match app_handle.shell().sidecar("ffprobe") {
                Ok(cmd) => cmd,
                Err(e) => {
                    log::error!("Sidecar ffprobe not found: {}", e);
                    return Err(format!("ffprobe sidecar missing: {}", e));
                }
            };

            let output = sidecar_cmd
                .args([
                    "-v",
                    "error",
                    "-show_entries",
                    "format=duration,bit_rate",
                    "-of",
                    "json",
                    path,
                ])
                .output()
                .await
                .map_err(|e| {
                    log::error!("FFprobe exec failed: {}", e);
                    format!("analysis error: {}", e)
                })?;

            if output.status.success() {
                if let Ok(json_out) = serde_json::from_slice::<FfprobeOutput>(&output.stdout) {
                    if let Some(format) = json_out.format {
                        duration_secs = format.duration.and_then(|d| d.parse().ok());
                        actual_bitrate = format.bit_rate.and_then(|b| b.parse().ok());
                    }
                }
            }
        }
    }

    let base_bytes = if let (Some(d), Some(b)) = (duration_secs, actual_bitrate) {
        // Safe arithmetic with saturation to prevent overflow
        // d * (b / 8.0)
        let bits = b as f64;
        let bytes_per_sec = bits / 8.0;
        let total = d * bytes_per_sec;

        // Clamp to u64::MAX to prevent overflow loops
        if total > u64::MAX as f64 {
            u64::MAX
        } else {
            total as u64
        }
    } else if let Some(ref size_str) = params.original_size_str {
        parse_size_to_bytes(size_str)
    } else {
        0
    };

    if base_bytes == 0 {
        return Ok(0);
    }

    let ratio = if params.media_type == MediaType::Audio {
        match params.preset.as_str() {
            "wa" => 0.3,
            "social" => 0.7,
            "archive" => 1.0,
            _ => {
                let bit = parse_bitrate_kbps(&params.audio_bitrate);
                if bit >= 320 {
                    1.0
                } else if bit >= 128 {
                    0.7
                } else {
                    0.4
                }
            }
        }
    } else if params.media_type == MediaType::Video {
        // CRF Estimation Table
        // Range mapping for compression ratios
        match params.crf {
            0..=17 => 1.05,  // Near-lossless (can be larger than source!)
            18..=22 => 0.95, // High Quality
            23..=27 => 0.60, // Good Balance
            28..=34 => 0.30, // Low Bitrate
            _ => 0.15,       // Very Low (35+)
        }
    } else {
        1.0
    };

    // Calculate final size with overflow check
    let estimated = base_bytes as f64 * ratio;
    Ok(if estimated > u64::MAX as f64 {
        u64::MAX
    } else {
        estimated as u64
    })
}

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
    let mut ratio = 1.0;

    if options.is_clipping {
        let s = parse_time(options.range_start.as_deref().unwrap_or(""));
        let e = if let Some(end_str) = &options.range_end {
            parse_time(end_str)
        } else {
            total
        };

        // Math.max(0, Math.min(e, total) - Math.max(0, s))
        let min_e_total = e.min(total);
        let max_0_s = s.max(0.0);
        let duration = (min_e_total - max_0_s).max(0.0);

        ratio = duration / total;
    }

    let base_size;

    if let Some(formats) = meta.formats {
        // filter: f.acodec !== 'none' && f.vcodec === 'none'
        let mut audio_formats: Vec<_> = formats
            .iter()
            .filter(|f| f.acodec.as_deref() != Some("none") && f.vcodec.as_deref() == Some("none"))
            .collect();

        // sort: (b.filesize || b.filesize_approx || 0) - (a.filesize || a.filesize_approx || 0)
        audio_formats.sort_by(|a, b| {
            let b_size = b.filesize.or(b.filesize_approx).unwrap_or(0.0);
            let a_size = a.filesize.or(a.filesize_approx).unwrap_or(0.0);
            b_size
                .partial_cmp(&a_size)
                .unwrap_or(std::cmp::Ordering::Equal)
        });

        let best_audio = audio_formats.first();
        let audio_size = best_audio
            .and_then(|f| f.filesize.or(f.filesize_approx))
            .unwrap_or(0.0);

        let format_pref = options.format.as_deref().unwrap_or("");

        if format_pref == "audio" {
            let target_bitrate: f64 = options
                .audio_bitrate
                .as_deref()
                .unwrap_or("128")
                .parse()
                .unwrap_or(128.0);
            if !audio_formats.is_empty() {
                let target_audio = audio_formats.into_iter().reduce(|prev, curr| {
                    let curr_diff = (curr.abr.unwrap_or(0.0) - target_bitrate).abs();
                    let prev_diff = (prev.abr.unwrap_or(0.0) - target_bitrate).abs();
                    if curr_diff < prev_diff {
                        curr
                    } else {
                        prev
                    }
                });
                base_size = target_audio
                    .and_then(|f| f.filesize.or(f.filesize_approx))
                    .unwrap_or(audio_size);
            } else {
                base_size = audio_size;
            }
        } else if format_pref == "gif" {
            let h = options
                .gif_scale
                .unwrap_or_else(|| meta.height.unwrap_or(480)) as f64;
            let fps = options.gif_fps.unwrap_or(15) as f64;
            let base_factor = (h / 480.0) * (fps / 15.0) * 0.5 * 1024.0 * 1024.0;
            base_size = base_factor * total;
        } else if format_pref == "Best" {
            let mut video_formats: Vec<_> = formats
                .iter()
                .filter(|f| f.vcodec.as_deref() != Some("none"))
                .collect();

            video_formats.sort_by(|a, b| {
                let b_size = b.filesize.or(b.filesize_approx).unwrap_or(0.0);
                let a_size = a.filesize.or(a.filesize_approx).unwrap_or(0.0);
                b_size
                    .partial_cmp(&a_size)
                    .unwrap_or(std::cmp::Ordering::Equal)
            });

            let best_video = video_formats.first();
            let video_size = best_video
                .and_then(|f| f.filesize.or(f.filesize_approx))
                .unwrap_or(0.0);

            base_size = video_size + audio_size;
        } else {
            let target_height: u32 = format_pref.parse().unwrap_or(0);
            let mut video_formats: Vec<_> = formats
                .iter()
                .filter(|f| f.height == Some(target_height) && f.vcodec.as_deref() != Some("none"))
                .collect();

            if !video_formats.is_empty() {
                video_formats.sort_by(|a, b| {
                    let b_size = b.filesize.or(b.filesize_approx).unwrap_or(0.0);
                    let a_size = a.filesize.or(a.filesize_approx).unwrap_or(0.0);
                    b_size
                        .partial_cmp(&a_size)
                        .unwrap_or(std::cmp::Ordering::Equal)
                });

                let best_video = video_formats.first();
                let video_size = best_video
                    .and_then(|f| f.filesize.or(f.filesize_approx))
                    .unwrap_or(0.0);

                base_size = video_size + audio_size;
            } else {
                base_size = filesize;
            }
        }
    } else {
        base_size = filesize;
    }

    let final_size = base_size * ratio;

    if final_size > u64::MAX as f64 {
        Ok(u64::MAX)
    } else {
        Ok(final_size as u64)
    }
}
