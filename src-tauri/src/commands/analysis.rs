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
    let s = s.to_uppercase();
    let parts: Vec<&str> = s.split_whitespace().collect();
    if parts.is_empty() {
        return 0;
    }

    let size_part = parts[0];
    let mut clean = String::new();
    let mut dot_count = 0;

    for c in size_part.chars() {
        if c.is_ascii_digit() {
            clean.push(c);
        } else if (c == '.' || c == ',') && dot_count == 0 {
            clean.push('.');
            dot_count += 1;
        }
    }

    let val: f64 = clean.parse().unwrap_or(0.0);

    if s.contains('G') {
        (val * 1024.0 * 1024.0 * 1024.0) as u64
    } else if s.contains('M') {
        (val * 1024.0 * 1024.0) as u64
    } else if s.contains('K') {
        (val * 1024.0) as u64
    } else {
        val as u64
    }
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
        (d * (b as f64) / 8.0) as u64
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
        /// CRF (Constant Rate Factor) compression ratios for H.264/H.265.
        /// These ratios are used to estimate the final file size after compression.
        /// Based on empirical testing with mixed content (movies, anime, screencasts).
        ///
        /// | CRF Range | Quality      | Typical Use Case        | Ratio |
        /// |-----------|--------------|------------------------|-------|
        /// | 35+       | Low          | Previews, thumbnails   | 0.15  |
        /// | 28-34     | Medium-Low   | Social media uploads   | 0.30  |
        /// | 23-27     | Good         | Streaming, web video   | 0.60  |
        /// | 18-22     | High         | Archival, BluRay rips  | 0.95  |
        /// | <18       | Near-lossless| Production work        | 1.05  |
        const CRF_RATIOS: &[(i32, f64)] = &[(35, 0.15), (28, 0.3), (23, 0.6), (18, 0.95)];

        CRF_RATIOS
            .iter()
            .find(|(limit, _)| params.crf >= *limit)
            .map(|(_, r)| *r)
            .unwrap_or(1.05)
    } else {
        1.0
    };

    Ok((base_bytes as f64 * ratio) as u64)
}
