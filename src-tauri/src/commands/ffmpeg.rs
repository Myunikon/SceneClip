use crate::ytdlp::AppSettings;
use regex::Regex;
use serde::{Deserialize, Serialize};
use std::process::Stdio;
use tauri::{ipc::Channel, AppHandle};
use tokio::io::{AsyncBufReadExt, BufReader as AsyncBufReader};
use tokio::process::Command;

lazy_static::lazy_static! {
    static ref DURATION_RE: Regex = Regex::new(r"Duration:\s+(\d+:\d+:\d+\.\d+)").unwrap();
    static ref TIME_RE: Regex = Regex::new(r"time=(\d+:\d+:\d+\.\d+)").unwrap();
    static ref SPEED_RE: Regex = Regex::new(r"speed=\s*(\d+\.\d+x)").unwrap();
    static ref ETA_RE: Regex = Regex::new(r"ETA=\s*(\d+:\d+:\d+|\d+s)").unwrap();
}

// Reusing types from frontend
#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CompressionOptions {
    pub resolution: String,
    pub encoder: String,
    pub crf: u32,
    pub preset: String, // 'quality' | 'balanced' | 'speed' | 'archive' | 'wa'
    pub audio_bitrate: Option<String>,
    pub speed_preset: String, // 'ultrafast' | 'superfast' | 'veryfast' | 'faster' | 'fast' | 'medium' | 'slow' | 'slower' | 'veryslow'
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct VideoChapter {
    pub title: String,
    pub start_time: f64,
    pub end_time: f64,
}

#[derive(Clone, Serialize, Debug)]
#[serde(rename_all = "camelCase", tag = "event", content = "data")]
pub enum FFmpegEvent {
    Progress {
        percent: f64,
        speed: String,
        eta: String,
    },
    Log {
        message: String,
        level: String,
    },
    Completed {
        output_path: String,
    },
    Error {
        message: String,
    },
}

#[tauri::command]
pub async fn compress_media(
    _app: AppHandle,
    input_path: String,
    output_path: String,
    options: CompressionOptions,
    is_audio: bool,
    is_image: bool,
    settings: AppSettings, // To get binary path
    on_event: Channel<FFmpegEvent>,
) -> Result<(), String> {
    log::info!(
        "[FFmpeg] Starting compression: {} -> {}",
        input_path,
        output_path
    );
    log::debug!("[FFmpeg] Options: {:?}", options);

    let ffmpeg_path = crate::ytdlp::resolve_ffmpeg_path(&_app, &settings.binary_path_ffmpeg);

    let mut args = vec!["-hide_banner".to_string(), "-y".to_string()];

    if settings.hardware_decoding {
        args.push("-hwaccel".to_string());
        args.push("auto".to_string());
    }

    args.push("-i".to_string());
    args.push(input_path.clone());

    // --- Build Arguments (Ported from TS) ---
    if is_audio {
        args.push("-vn".to_string());
        if let Some(bitrate) = &options.audio_bitrate {
            args.push("-b:a".to_string());
            args.push(bitrate.clone());
        }
    } else if is_image {
        if options.resolution != "original" {
            args.push("-vf".to_string());
            args.push(format!("scale=-2:{}", options.resolution));
        }
    } else {
        // Video
        match options.encoder.as_str() {
            "nvenc" => {
                args.push("-c:v".to_string());
                args.push("h264_nvenc".to_string());
                args.push("-cq".to_string());
                args.push(options.crf.to_string());
                args.push("-preset".to_string());
                args.push(if options.speed_preset == "veryslow" {
                    "p7".to_string()
                } else {
                    "p4".to_string()
                });
            }
            "amf" => {
                args.push("-c:v".to_string());
                args.push("h264_amf".to_string());
            }
            "qsv" => {
                args.push("-c:v".to_string());
                args.push("h264_qsv".to_string());
                args.push("-global_quality".to_string());
                args.push(options.crf.to_string());
            }
            _ => {
                // cpu/auto
                args.push("-c:v".to_string());
                args.push("libx264".to_string());
                args.push("-crf".to_string());
                args.push(options.crf.to_string());
                args.push("-preset".to_string());
                args.push(options.speed_preset.clone());
            }
        }

        if options.resolution != "original" {
            args.push("-vf".to_string());
            args.push(format!("scale=-2:{}", options.resolution));
        }

        if options.preset == "archive" {
            args.push("-c:a".to_string());
            args.push("copy".to_string());
        } else {
            args.push("-c:a".to_string());
            args.push("aac".to_string());
            args.push("-b:a".to_string());
            args.push(if options.preset == "wa" {
                "96k".to_string()
            } else {
                "128k".to_string()
            });
        }
    }

    args.push(output_path.clone());

    // --- Execute ---
    let mut std_command = std::process::Command::new(&ffmpeg_path);

    #[cfg(windows)]
    {
        use std::os::windows::process::CommandExt;
        // Use the constant from system.rs or define locally if not public
        // For now, consistent local definition
        const CREATE_NO_WINDOW: u32 = 0x08000000;
        std_command.creation_flags(CREATE_NO_WINDOW);
    }

    let mut command = Command::from(std_command);
    command.args(&args);
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped());

    let mut child = command
        .spawn()
        .map_err(|e| format!("Failed to spawn ffmpeg: {}", e))?;

    // --- Progress Parsing (Regex based) ---
    // Fixed: potential memory leak by ensuring parser stops when child exits
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;
    let reader = AsyncBufReader::new(stderr);
    let on_event_clone = on_event.clone();

    // Cancellation channel for the parser task
    let (cancel_tx, mut cancel_rx) = tokio::sync::oneshot::channel::<()>();

    let parser_handle = tokio::spawn(async move {
        let mut total_duration_secs = 0.0;
        let mut last_percent = 0.0;
        let mut lines = reader.lines();

        loop {
            tokio::select! {
                line_result = lines.next_line() => {
                    match line_result {
                        Ok(Some(l)) => {
                             // 1. Parse Duration
                            if total_duration_secs == 0.0 {
                                if let Some(cap) = DURATION_RE.captures(&l) {
                                    total_duration_secs = parse_time(&cap[1]);
                                }
                            }

                            // 2. Parse Progress
                            if let Some(t_cap) = TIME_RE.captures(&l) {
                                let current_time_secs = parse_time(&t_cap[1]);
                                let mut percent = 0.0;
                                if total_duration_secs > 0.0 {
                                    percent = (current_time_secs / total_duration_secs) * 100.0;
                                }

                                let speed = SPEED_RE
                                    .captures(&l)
                                    .map(|c| c[1].to_string())
                                    .unwrap_or_else(|| "N/A".to_string());

                                let eta = ETA_RE
                                    .captures(&l)
                                    .map(|c| c[1].to_string())
                                    .unwrap_or_else(|| "N/A".to_string());

                                let threshold = if total_duration_secs < 30.0 {
                                    0.01 // 1%
                                } else {
                                    0.1 // 0.1%
                                };

                                if (percent - last_percent).abs() > threshold || percent >= 100.0 {
                                    let _ = on_event_clone.send(FFmpegEvent::Progress {
                                        percent: percent.min(100.0),
                                        speed,
                                        eta,
                                    });
                                    last_percent = percent;
                                }
                            } else {
                                // Log other messages
                                let _ = on_event_clone.send(FFmpegEvent::Log {
                                    message: l,
                                    level: "info".to_string(),
                                });
                            }
                        }
                        Ok(None) => break, // EOF
                        Err(_) => break, // Error
                    }
                }
                _ = &mut cancel_rx => {
                    log::info!("FFmpeg parser cancelled");
                    break;
                }
            }
        }
    });

    let output = child.wait_with_output().await.map_err(|e| e.to_string())?;

    // Stop the parser task
    let _ = cancel_tx.send(());
    let _ = parser_handle.await; // Wait for cleanup

    if output.status.success() {
        log::info!(
            "[FFmpeg] Compression completed successfully: {}",
            output_path
        );
        let _ = on_event.send(FFmpegEvent::Completed { output_path });
        Ok(())
    } else {
        let error_message = String::from_utf8_lossy(&output.stderr).to_string();
        log::error!("[FFmpeg] Compression failed: {}", error_message);
        let _ = on_event.send(FFmpegEvent::Error {
            message: error_message.clone(),
        });
        Err(format!(
            "FFmpeg exited with code {:?}: {}",
            output.status.code(),
            error_message
        ))
    }
}

// Helper to parse HH:MM:SS.ss, MM:SS.ss, or SS.ss to seconds
fn parse_time(time_str: &str) -> f64 {
    let parts: Vec<&str> = time_str.split(':').collect();
    match parts.len() {
        3 => {
            // HH:MM:SS.ss
            let h: f64 = parts[0].parse().unwrap_or(0.0);
            let m: f64 = parts[1].parse().unwrap_or(0.0);
            let s: f64 = parts[2].parse().unwrap_or(0.0);
            h * 3600.0 + m * 60.0 + s
        }
        2 => {
            // MM:SS.ss
            let m: f64 = parts[0].parse().unwrap_or(0.0);
            let s: f64 = parts[1].parse().unwrap_or(0.0);
            m * 60.0 + s
        }
        _ => {
            // SS.ss or invalid
            time_str.parse().unwrap_or(0.0)
        }
    }
}

#[tauri::command]
pub async fn split_media_chapters(
    _app: AppHandle,
    input_path: String,
    chapters: Vec<VideoChapter>,
    settings: AppSettings,
    on_event: Channel<FFmpegEvent>,
) -> Result<(), String> {
    let ffmpeg_path = crate::ytdlp::resolve_ffmpeg_path(&_app, &settings.binary_path_ffmpeg);

    let path_obj = std::path::Path::new(&input_path);
    let parent = path_obj.parent().unwrap_or(std::path::Path::new(""));
    let stem = path_obj
        .file_stem()
        .and_then(|s| s.to_str())
        .unwrap_or("video");
    let ext = path_obj
        .extension()
        .and_then(|s| s.to_str())
        .unwrap_or("mp4");

    let total_duration = if let Some(last) = chapters.last() {
        last.end_time - chapters.first().map(|c| c.start_time).unwrap_or(0.0)
    } else {
        1.0
    };

    let mut accumulated_time = 0.0;

    for (index, chapter) in chapters.iter().enumerate() {
        let safe_title = chapter
            .title
            .replace(|c: char| "\\/:*?\"<>|".contains(c), "_");
        let output_name = format!("{} - {:02} - {}.{}", stem, index + 1, safe_title, ext);
        let output_path = parent.join(output_name);

        let mut args = vec![
            "-hide_banner".to_string(),
            "-y".to_string(),
            "-i".to_string(),
            input_path.clone(),
        ];
        args.push("-ss".to_string());
        args.push(chapter.start_time.to_string());
        args.push("-to".to_string());
        args.push(chapter.end_time.to_string());
        args.push("-c".to_string());
        args.push("copy".to_string());
        args.push("-map_metadata".to_string());
        args.push("0".to_string());
        args.push(output_path.to_string_lossy().to_string());

        let mut command = Command::new(&ffmpeg_path);

        #[cfg(target_os = "windows")]
        {
            const CREATE_NO_WINDOW: u32 = 0x08000000;
            command.creation_flags(CREATE_NO_WINDOW);
        }

        let output = command
            .args(&args)
            .output()
            .await
            .map_err(|e| format!("Failed to split chapter {}: {}", index + 1, e))?;

        if !output.status.success() {
            let err_msg = format!(
                "Failed to split chapter {}: Exit code {:?}",
                index + 1,
                output.status.code()
            );
            let _ = on_event.send(FFmpegEvent::Error {
                message: err_msg.clone(),
            });
            return Err(err_msg); // P0 FIX: Fail entire operation
        }

        // Update Progress
        let chapter_duration = chapter.end_time - chapter.start_time;
        accumulated_time += chapter_duration;
        let percent = (accumulated_time / total_duration) * 100.0;

        let _ = on_event.send(FFmpegEvent::Progress {
            percent: percent.min(100.0),
            speed: "N/A".to_string(),
            eta: "N/A".to_string(),
        });
    }

    let _ = on_event.send(FFmpegEvent::Completed {
        output_path: "All chapters processed".to_string(),
    });
    Ok(())
}

// ============================================================================
// Unit Tests
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;

    // --- parse_time tests ---

    #[test]
    fn parse_time_hhmmss_format() {
        assert!((parse_time("01:30:45") - 5445.0).abs() < 0.001);
        assert!((parse_time("00:00:00") - 0.0).abs() < 0.001);
        assert!((parse_time("02:00:00") - 7200.0).abs() < 0.001);
    }

    #[test]
    fn parse_time_hhmmss_with_decimals() {
        assert!((parse_time("00:01:30.5") - 90.5).abs() < 0.001);
        assert!((parse_time("01:00:00.25") - 3600.25).abs() < 0.001);
        assert!((parse_time("00:00:05.123") - 5.123).abs() < 0.001);
    }

    #[test]
    fn parse_time_seconds_only() {
        assert!((parse_time("45.5") - 45.5).abs() < 0.001);
        assert!((parse_time("0") - 0.0).abs() < 0.001);
        assert!((parse_time("3600.99") - 3600.99).abs() < 0.001);
    }

    #[test]
    fn parse_time_invalid_input() {
        assert!((parse_time("invalid") - 0.0).abs() < 0.001);
        assert!((parse_time("") - 0.0).abs() < 0.001);
        assert!((parse_time("abc:de:fg") - 0.0).abs() < 0.001);
    }

    #[test]
    fn parse_time_mm_ss_format() {
        // MM:SS format (2 parts) - now properly handled
        assert!((parse_time("01:30") - 90.0).abs() < 0.001); // 1 min 30 sec = 90 sec
        assert!((parse_time("05:45") - 345.0).abs() < 0.001); // 5 min 45 sec = 345 sec
        assert!((parse_time("00:30") - 30.0).abs() < 0.001); // 30 sec
    }
}
