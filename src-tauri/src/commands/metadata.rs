use serde::{Deserialize, Serialize};
use std::collections::{BTreeSet, HashMap};

#[derive(Debug, Serialize, Deserialize)]
pub struct LanguageOption {
    pub id: String,
    pub label: String,
}

#[derive(Debug, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ParsedMetadata {
    pub title: String,
    pub duration: f64,
    pub resolutions: Vec<u32>,
    pub audio_bitrates: Vec<u32>,
    pub video_codecs: Vec<String>,
    pub audio_codecs: Vec<String>,
    pub languages: Vec<LanguageOption>,
    pub thumbnail: Option<String>,
    pub filesize: Option<u64>,
    pub filesize_approx: Option<u64>,
}

#[derive(Debug, Deserialize)]
struct YtDlpFormat {
    height: Option<u32>,
    abr: Option<f64>,
    vcodec: Option<String>,
    acodec: Option<String>,
}

#[derive(Debug, Deserialize)]
struct YtDlpCaption {
    name: Option<String>,
}

#[derive(Debug, Deserialize)]
struct YtDlpMetadata {
    title: Option<String>,
    duration: Option<f64>,
    formats: Option<Vec<YtDlpFormat>>,
    automatic_captions: Option<HashMap<String, Vec<YtDlpCaption>>>,
    subtitles: Option<HashMap<String, Vec<YtDlpCaption>>>,
    thumbnail: Option<String>,
    filesize: Option<u64>,
    filesize_approx: Option<u64>,
}

#[tauri::command]
pub fn parse_video_metadata(raw_json: serde_json::Value) -> Result<ParsedMetadata, String> {
    let meta: YtDlpMetadata = serde_json::from_value(raw_json)
        .map_err(|e| format!("Failed to parse yt-dlp JSON: {}", e))?;

    let title = meta.title.unwrap_or_else(|| "Unknown Video".to_string());
    let duration = meta.duration.unwrap_or(0.0);

    let mut resolutions = Vec::new();
    let mut audio_bitrates = Vec::new();
    let mut video_codecs = BTreeSet::new();
    let mut audio_codecs = BTreeSet::new();

    if let Some(formats) = meta.formats {
        for f in formats {
            // Resolutions
            if let Some(h) = f.height {
                if h > 0 && !resolutions.contains(&h) {
                    resolutions.push(h);
                }
            }

            // Audio Bitrates
            if let Some(abr) = f.abr {
                if f.acodec.as_deref().unwrap_or("none") != "none" {
                    let bitrate = abr.round() as u32;
                    // Bucket logic (from TS)
                    let buckets: [u32; 5] = [64, 128, 192, 256, 320];
                    let closest = buckets
                        .into_iter()
                        .min_by_key(|&b| b.abs_diff(bitrate))
                        .unwrap();
                    if !audio_bitrates.contains(&closest) {
                        audio_bitrates.push(closest);
                    }
                }
            }

            // Video Codecs
            if let Some(v) = f.vcodec {
                if v != "none" {
                    let v_lower = v.to_lowercase();
                    if v_lower.starts_with("avc1") || v_lower.starts_with("h264") {
                        video_codecs.insert("h264".to_string());
                    } else if v_lower.starts_with("vp9") {
                        video_codecs.insert("vp9".to_string());
                    } else if v_lower.starts_with("av01") {
                        video_codecs.insert("av1".to_string());
                    } else if v_lower.starts_with("hev1")
                        || v_lower.starts_with("hvc1")
                        || v_lower.starts_with("hevc")
                    {
                        video_codecs.insert("hevc".to_string());
                    }
                }
            }

            // Audio Codecs
            if let Some(a) = f.acodec {
                if a != "none" {
                    let a_lower = a.to_lowercase();
                    if a_lower.starts_with("mp4a") {
                        audio_codecs.insert("m4a".to_string());
                    } else if a_lower.contains("opus") {
                        audio_codecs.insert("opus".to_string());
                    } else if a_lower.contains("vorbis") {
                        audio_codecs.insert("ogg".to_string());
                    } else if a_lower.contains("flac") {
                        audio_codecs.insert("flac".to_string());
                    } else if a_lower.contains("wav") {
                        audio_codecs.insert("wav".to_string());
                    }
                }
            }
        }
    }

    resolutions.sort_by(|a, b| b.cmp(a));
    audio_bitrates.sort_by(|a, b| b.cmp(a));

    let mut languages = Vec::new();

    // Auto Captions
    if let Some(auto) = meta.automatic_captions {
        if !auto.is_empty() {
            languages.push(LanguageOption {
                id: "auto".to_string(),
                label: "Auto (AI)".to_string(),
            });
        }
    }

    // Manual Subtitles
    if let Some(subs) = meta.subtitles {
        if !subs.is_empty() {
            let mut manual_langs = Vec::new();
            for (code, info) in subs {
                let name = info
                    .get(0)
                    .and_then(|i| i.name.clone())
                    .unwrap_or_else(|| code.to_uppercase());
                manual_langs.push(LanguageOption {
                    id: code,
                    label: name,
                });
            }
            manual_langs.sort_by(|a, b| a.label.cmp(&b.label));
            languages.extend(manual_langs);
            languages.push(LanguageOption {
                id: "all".to_string(),
                label: "All".to_string(),
            });
        }
    }

    Ok(ParsedMetadata {
        title,
        duration,
        resolutions,
        audio_bitrates,
        video_codecs: video_codecs.into_iter().collect(),
        audio_codecs: audio_codecs.into_iter().collect(),
        languages,
        thumbnail: meta.thumbnail,
        filesize: meta.filesize,
        filesize_approx: meta.filesize_approx,
    })
}
