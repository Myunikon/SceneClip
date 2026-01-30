// use futures::StreamExt; // Not explicitly needed if using .chunk() inherent method? Actually, let's keep it commented out or remove.
// reqwest::Response::chunk() is inherent.

use reqwest::header::USER_AGENT;
use std::cmp::Ordering;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, Manager};

#[derive(serde::Serialize, Clone, Debug)]
pub struct UpdateInfo {
    pub current: Option<String>,
    pub latest: Option<String>,
    pub has_update: bool,
}

#[derive(serde::Serialize, Debug)]
pub struct UpdaterStatus {
    pub ytdlp: UpdateInfo,
    pub ffmpeg: UpdateInfo,
}

#[derive(serde::Serialize, Clone)]
struct ProgressEvent {
    binary: String,
    percent: f64,
    downloaded: u64,
    total: u64,
}

// --- Helpers ---

// --- Helpers ---

fn get_writable_binary_path(app: &AppHandle, binary_name: &str) -> PathBuf {
    // Resolve: AppLocalData/target_binary
    // Why AppLocalData? Because it's writable. Resources are read-only.
    let app_local_data = app.path().app_local_data_dir().unwrap();
    if !app_local_data.exists() {
        let _ = fs::create_dir_all(&app_local_data);
    }

    #[cfg(target_os = "windows")]
    let filename = if binary_name.ends_with(".exe") {
        binary_name.to_string()
    } else {
        format!("{}.exe", binary_name)
    };
    #[cfg(not(target_os = "windows"))]
    let filename = binary_name.to_string();

    app_local_data.join(filename)
}

fn find_active_binary(app: &AppHandle, binary_name: &str) -> PathBuf {
    // 1. Check Writable Location (Updates)
    let writable_path = get_writable_binary_path(app, binary_name);
    if writable_path.exists() {
        return writable_path;
    }

    // 2. Check Bundle/Sidecar Location
    // In dev: target/debug/
    // In prod: root of install or resources
    if let Ok(mut exe_path) = std::env::current_exe() {
        exe_path.pop(); // Parent dir

        #[cfg(target_os = "windows")]
        let filename = if binary_name.ends_with(".exe") {
            binary_name.to_string()
        } else {
            format!("{}.exe", binary_name)
        };
        #[cfg(not(target_os = "windows"))]
        let filename = binary_name.to_string();

        // Check flat (Standard Tauri)
        let flat = exe_path.join(&filename);
        if flat.exists() {
            return flat;
        }

        // Check bin/ subdir
        let bin = exe_path.join("bin").join(&filename);
        if bin.exists() {
            return bin;
        }

        // Check triple-target name (Tauri sidecar standard naming)
        // Since we don't have tauri_utils to get proper triple, we'll scan the directory
        // for files that start with the binary name and look somewhat like a sidecar.
        // FIX: Case insensitive and allow exact match
        let binary_name_lower = binary_name.to_lowercase();

        if let Ok(entries) = std::fs::read_dir(&exe_path) {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    let stem_lower = stem.to_lowercase();
                    if stem_lower.starts_with(&binary_name_lower) {
                        // It's a candidate: "yt-dlp-x86_64..." or "yt-dlp"
                        if path
                            .extension()
                            .map_or(false, |e| e.to_ascii_lowercase() == "exe")
                            || path.extension().is_none()
                        {
                            return path;
                        }
                    }
                }
            }
        }

        // Also check bin/ subdir for triple names
        let bin_dir = exe_path.join("bin");
        if let Ok(entries) = std::fs::read_dir(bin_dir) {
            for entry in entries.flatten() {
                let path = entry.path();
                if let Some(stem) = path.file_stem().and_then(|s| s.to_str()) {
                    let stem_lower = stem.to_lowercase();
                    if stem_lower.starts_with(&binary_name_lower) {
                        if path
                            .extension()
                            .map_or(false, |e| e.to_ascii_lowercase() == "exe")
                            || path.extension().is_none()
                        {
                            return path;
                        }
                    }
                }
            }
        }
    }

    // 3. Fallback to just returning the name (implies PATH lookup)
    PathBuf::from(binary_name)
}

fn get_version_cmd(path: &Path, binary: &str) -> Option<String> {
    // If path is just a filename (from fallback 3), Command::new works with PATH
    // But path.exists() checks explicitly.
    // Optimization: if it looks like a simple name, bypass exists check?
    // Actually, Command::new searches PATH if no separators.

    // We try to run it.
    let arg = if binary == "ffmpeg" {
        "-version"
    } else {
        "--version"
    };

    let mut cmd = std::process::Command::new(path);
    cmd.arg(arg);

    #[cfg(target_os = "windows")]
    {
        use std::os::windows::process::CommandExt;
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    let output = cmd.output().ok()?;

    if !output.status.success() {
        return None;
    }

    let out_str = String::from_utf8_lossy(&output.stdout).to_string();
    let err_str = String::from_utf8_lossy(&output.stderr).to_string();
    let full = if out_str.trim().is_empty() {
        err_str
    } else {
        out_str
    };

    // Parse
    let first_line = full.lines().next().unwrap_or("").trim();
    if binary == "ffmpeg" {
        // ffmpeg version n6.0 ...
        if let Some(pos) = first_line.find("version") {
            let part = &first_line[pos + 8..]; // skip "version "
            return Some(part.split_whitespace().next().unwrap_or(part).to_string());
        }
        return Some(first_line.to_string());
    }

    // yt-dlp usually outputs just "2024.10.22"
    Some(first_line.to_string())
}

async fn fetch_github_latest(repo: &str) -> Result<String, String> {
    let client = reqwest::Client::new();
    let url = format!("https://api.github.com/repos/{}/releases/latest", repo);

    let res = client
        .get(&url)
        .header(USER_AGENT, "SceneClip")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        return Err(format!("GitHub API Error: {}", res.status()));
    }

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;
    let tag = json["tag_name"].as_str().ok_or("No tag_name in response")?;

    Ok(tag.to_string())
}

fn compare_versions(current: &str, latest: &str) -> Ordering {
    // Simple numeric chunk comparison
    // "2024.10.22" vs "2024.11.01"
    let parse = |s: &str| -> Vec<u64> {
        s.split(|c: char| !c.is_numeric())
            .filter(|s| !s.is_empty())
            .filter_map(|s| s.parse().ok())
            .collect()
    };

    let c_parts = parse(current);
    let l_parts = parse(latest);

    c_parts.cmp(&l_parts)
}

// --- Commands ---

#[tauri::command]
pub async fn check_updates(app: AppHandle) -> Result<UpdaterStatus, String> {
    // 1. Check yt-dlp
    // Find active binary (bundle or local update)
    let yt_path_active = find_active_binary(&app, "yt-dlp");
    let yt_current = get_version_cmd(&yt_path_active, "yt-dlp");

    // Check for later version
    let yt_latest = fetch_github_latest("yt-dlp/yt-dlp").await.ok();

    let yt_update = match (&yt_current, &yt_latest) {
        (Some(c), Some(l)) => compare_versions(c, l) == Ordering::Less,
        (None, Some(_)) => true, // Not installed
        _ => false,
    };

    // 2. Check ffmpeg
    let ff_path_active = find_active_binary(&app, "ffmpeg");
    let ff_current = get_version_cmd(&ff_path_active, "ffmpeg");
    let ff_latest = fetch_github_latest("BtbN/FFmpeg-Builds").await.ok();

    Ok(UpdaterStatus {
        ytdlp: UpdateInfo {
            current: yt_current,
            latest: yt_latest,
            has_update: yt_update,
        },
        ffmpeg: UpdateInfo {
            current: ff_current,
            latest: ff_latest,
            has_update: false, // Disabled for now
        },
    })
}

#[tauri::command]
pub async fn update_binary(app: AppHandle, binary: String) -> Result<String, String> {
    if binary == "ffmpeg" {
        return Err("FFmpeg auto-update not supported via this method.".to_string());
    }

    let repo = "yt-dlp/yt-dlp";
    let client = reqwest::Client::new();

    // 1. Get Assets
    let url = format!("https://api.github.com/repos/{}/releases/latest", repo);
    let res = client
        .get(&url)
        .header(USER_AGENT, "SceneClip")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    if !res.status().is_success() {
        let status = res.status();
        let text = res.text().await.unwrap_or_default();
        return Err(format!("GitHub API Error {}: {}", status, text));
    }

    let json: serde_json::Value = res.json().await.map_err(|e| e.to_string())?;

    // 2. Find Asset
    let assets = json["assets"].as_array().ok_or("No assets found")?;

    #[cfg(target_os = "windows")]
    let target_name = "yt-dlp.exe";

    #[cfg(target_os = "macos")]
    let target_name = "yt-dlp_macos"; // Note: Official releases are usually universal or x64. User might need rosetta if universal not avail.
                                      // Actually, yt-dlp officially provides: yt-dlp, yt-dlp_macos (universal/x64), yt-dlp_linux, yt-dlp_linux_aarch64
                                      // Checking ARCH is good for Linux. For MacOS, 'yt-dlp_macos' is usually sufficient.

    #[cfg(target_os = "linux")]
    let target_name = match std::env::consts::ARCH {
        "aarch64" => "yt-dlp_linux_aarch64",
        "arm" => "yt-dlp_linux_armv7l",
        _ => "yt-dlp", // Default x64
    };

    let asset = assets
        .iter()
        .find(|a| a["name"].as_str() == Some(target_name))
        .ok_or(format!("Binary {} not found in release", target_name))?;

    let download_url = asset["browser_download_url"]
        .as_str()
        .ok_or("No download URL")?;
    let total_size = asset["size"].as_u64().unwrap_or(0);

    // 3. Download Stream
    let mut res = client
        .get(download_url)
        .send()
        .await
        .map_err(|e| e.to_string())?;
    // FIX: Use get_writable_binary_path
    let target_path = get_writable_binary_path(&app, "yt-dlp");

    // Write to temp file first
    let temp_path = target_path.with_extension("tmp");
    let mut file = fs::File::create(&temp_path).map_err(|e| e.to_string())?;

    let mut downloaded: u64 = 0;

    while let Some(chunk) = res.chunk().await.map_err(|e| e.to_string())? {
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        // Emit Progress
        let event = ProgressEvent {
            binary: binary.clone(),
            percent: if total_size > 0 {
                (downloaded as f64 / total_size as f64) * 100.0
            } else {
                0.0
            },
            downloaded,
            total: total_size,
        };
        let _ = app.emit("update-progress", event);
    }

    // 4. Replace
    let _ = file.sync_all();
    drop(file); // Close file

    // Rename
    // On Windows, if running, this might fail. We should try to move old one aside?
    // Rust fs::rename usually handles replace atomically on POSIX, but Windows is picky.
    // For now, simpler:
    if target_path.exists() {
        let _ = fs::remove_file(&target_path); // Attempt delete
    }
    fs::rename(&temp_path, &target_path).map_err(|e| e.to_string())?;

    // 5. Permissions (Unix)
    #[cfg(not(target_os = "windows"))]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(&target_path).unwrap().permissions();
        perms.set_mode(0o755);
        let _ = fs::set_permissions(&target_path, perms);
    }

    Ok(target_path.to_string_lossy().to_string())
}
