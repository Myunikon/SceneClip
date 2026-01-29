use crate::ytdlp::AppSettings;
use serde::{Deserialize, Serialize};
use std::io::{BufRead, BufReader};
use std::process::{Command, Stdio};
use tauri::{ipc::Channel, AppHandle};

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
    let ffmpeg_path = if settings.binary_path_ffmpeg.is_empty() {
        "ffmpeg"
    } else {
        &settings.binary_path_ffmpeg
    };

    let mut args = vec![
        "-hide_banner".to_string(),
        "-y".to_string(),
        "-i".to_string(),
        input_path.clone(),
    ];

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
    let mut command = Command::new(ffmpeg_path);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        command.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    command.args(&args);
    command.stdout(Stdio::piped());
    command.stderr(Stdio::piped()); // FFmpeg writes progress to stderr

    let mut child = command
        .spawn()
        .map_err(|e| format!("Failed to spawn ffmpeg: {}", e))?;

    // --- Progress Parsing ---
    let stderr = child.stderr.take().ok_or("Failed to open stderr")?;
    let reader = BufReader::new(stderr);
    let on_event_clone = on_event.clone();

    tauri::async_runtime::spawn_blocking(move || {
        let mut total_duration_secs = 0.0;
        let mut last_percent = 0.0;

        for line in reader.lines() {
            if let Ok(l) = line {
                // Parse total duration from "Duration: HH:MM:SS.ss,"
                if total_duration_secs == 0.0 {
                    if let Some(idx) = l.find("Duration: ") {
                        let sub = &l[idx + 10..];
                        if let Some(comma) = sub.find(',') {
                            let duration_str = &sub[0..comma];
                            total_duration_secs = parse_time(duration_str);
                        }
                    }
                }

                // Parse current time, speed, and ETA from "time=HH:MM:SS.ss speed=X.X ETA=HH:MM:SS.ss"
                if let Some(time_idx) = l.find("time=") {
                    let time_str_start = time_idx + "time=".len();
                    if let Some(time_str_end) = l[time_str_start..].find(' ') {
                        let current_time_str = &l[time_str_start..time_str_start + time_str_end];
                        let current_time_secs = parse_time(current_time_str);

                        let mut percent = 0.0;
                        if total_duration_secs > 0.0 {
                            percent = (current_time_secs / total_duration_secs) * 100.0;
                            if percent > 100.0 {
                                percent = 100.0;
                            }
                        }

                        // Extract speed
                        let speed = if let Some(speed_idx) = l.find("speed=") {
                            let speed_str_start = speed_idx + "speed=".len();
                            if let Some(speed_str_end) = l[speed_str_start..].find('x') {
                                l[speed_str_start..speed_str_start + speed_str_end].to_string()
                                    + "x"
                            } else {
                                "N/A".to_string()
                            }
                        } else {
                            "N/A".to_string()
                        };

                        // Extract ETA
                        let eta = if let Some(eta_idx) = l.find("ETA=") {
                            let eta_str_start = eta_idx + "ETA=".len();
                            if let Some(eta_str_end) = l[eta_str_start..].find(' ') {
                                l[eta_str_start..eta_str_start + eta_str_end].to_string()
                            } else {
                                l[eta_str_start..].to_string() // Sometimes ETA is at the end of the line
                            }
                        } else {
                            "N/A".to_string()
                        };

                        // Only send if percent has changed significantly to avoid spamming
                        if (percent - last_percent).abs() > 0.5 || percent == 100.0 {
                            let _ = on_event_clone.send(FFmpegEvent::Progress {
                                percent,
                                speed,
                                eta,
                            });
                            last_percent = percent;
                        }
                    }
                } else {
                    // Log other messages
                    let _ = on_event_clone.send(FFmpegEvent::Log {
                        message: l,
                        level: "info".to_string(),
                    });
                }
            }
        }
    });

    let output = child.wait_with_output().map_err(|e| e.to_string())?;

    if output.status.success() {
        let _ = on_event.send(FFmpegEvent::Completed { output_path });
        Ok(())
    } else {
        let error_message = String::from_utf8_lossy(&output.stderr).to_string();
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

// Helper to parse HH:MM:SS.ss or SS.ss to seconds
fn parse_time(time_str: &str) -> f64 {
    let parts: Vec<&str> = time_str.split(':').collect();
    if parts.len() == 3 {
        // HH:MM:SS.ss
        let h: f64 = parts[0].parse().unwrap_or(0.0);
        let m: f64 = parts[1].parse().unwrap_or(0.0);
        let s: f64 = parts[2].parse().unwrap_or(0.0);
        h * 3600.0 + m * 60.0 + s
    } else {
        // SS.ss
        time_str.parse().unwrap_or(0.0)
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
    let ffmpeg_path = if settings.binary_path_ffmpeg.is_empty() {
        "ffmpeg"
    } else {
        &settings.binary_path_ffmpeg
    };

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

        let args = vec![
            "-hide_banner".to_string(),
            "-y".to_string(),
            "-i".to_string(),
            input_path.clone(),
            "-ss".to_string(),
            chapter.start_time.to_string(),
            "-to".to_string(),
            chapter.end_time.to_string(),
            "-c".to_string(),
            "copy".to_string(),
            "-map_metadata".to_string(),
            "0".to_string(),
            output_path.to_string_lossy().to_string(),
        ];

        let mut command = Command::new(ffmpeg_path);

        #[cfg(target_os = "windows")]
        {
            use std::os::windows::process::CommandExt;
            command.creation_flags(0x08000000); // Windows: CREATE_NO_WINDOW
        }

        let output = command
            .args(&args)
            .output()
            .map_err(|e| format!("Failed to split chapter {}: {}", index + 1, e))?;

        if !output.status.success() {
            let _ = on_event.send(FFmpegEvent::Error {
                message: format!(
                    "Failed to split chapter {}: Exit code {:?}",
                    index + 1,
                    output.status.code()
                ),
            });
        }

        // Update Progress
        let chapter_duration = chapter.end_time - chapter.start_time;
        accumulated_time += chapter_duration;
        let percent = (accumulated_time / total_duration) * 100.0;

        let _ = on_event.send(FFmpegEvent::Progress {
            percent,
            speed: "N/A".to_string(),
            eta: "N/A".to_string(),
        });
    }

    let _ = on_event.send(FFmpegEvent::Completed {
        output_path: "All chapters processed".to_string(),
    });
    Ok(())
}
