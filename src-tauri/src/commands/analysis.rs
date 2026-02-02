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
