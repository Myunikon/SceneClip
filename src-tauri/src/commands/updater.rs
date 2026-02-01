// use futures::StreamExt;
use reqwest::header::USER_AGENT;
use std::cmp::Ordering;
use std::fs;
use std::io::Write;
use std::path::{Path, PathBuf};
use tauri::{AppHandle, Emitter, Manager};

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct ReleaseAsset {
    pub name: String,
    pub browser_download_url: String,
    pub size: u64,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
pub struct ReleaseData {
    pub tag_name: String,
    pub name: Option<String>,
    pub assets: Vec<ReleaseAsset>,
}

#[derive(serde::Serialize, Clone, Debug)]
pub struct UpdateInfo {
    pub current: Option<String>,
    pub latest: Option<String>,
    pub has_update: bool,
    pub integrity_valid: bool,
    pub error: Option<String>,
}

#[derive(serde::Serialize, Debug)]
pub struct UpdaterStatus {
    pub app_update: UpdateInfo,
    pub ytdlp: UpdateInfo,
}

#[derive(serde::Serialize, Clone)]
struct ProgressEvent {
    binary: String,
    percent: f64,
    downloaded: u64,
    total: u64,
}

// --- Helpers ---

fn get_writable_binary_path(app: &AppHandle, binary_name: &str) -> PathBuf {
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
    let writable_path = get_writable_binary_path(app, binary_name);
    if writable_path.exists() {
        return writable_path;
    }

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

        let flat = exe_path.join(&filename);
        if flat.exists() {
            return flat;
        }

        let bin = exe_path.join("bin").join(&filename);
        if bin.exists() {
            return bin;
        }

        let binary_name_lower = binary_name.to_lowercase();
        if let Ok(entries) = std::fs::read_dir(&exe_path) {
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

    PathBuf::from(binary_name)
}

fn strip_ansi(s: &str) -> String {
    let mut result = String::new();
    let mut chars = s.chars().peekable();
    while let Some(c) = chars.next() {
        if c == '\x1b' {
            if let Some(&'[') = chars.peek() {
                chars.next();
                while let Some(&c) = chars.peek() {
                    if c.is_ascii_alphabetic() {
                        chars.next();
                        break;
                    }
                    chars.next();
                }
            }
        } else {
            result.push(c);
        }
    }
    result
}

fn get_version_cmd(path: &Path, binary: &str) -> Option<String> {
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
        cmd.creation_flags(0x08000000);
    }
    let output = match cmd.output() {
        Ok(o) => o,
        Err(e) => {
            log::error!("Failed to execute {:?}: {}", path, e);
            return None;
        }
    };

    if !output.status.success() {
        return None;
    }

    let out_str = strip_ansi(&String::from_utf8_lossy(&output.stdout));
    let full = out_str.trim();
    let first_line = full.lines().next().unwrap_or("").trim();

    if binary == "ffmpeg" {
        if let Some(pos) = first_line.find("version") {
            let part = &first_line[pos + 8..];
            return Some(part.split_whitespace().next().unwrap_or(part).to_string());
        }
        return Some(first_line.to_string());
    } else if binary == "aria2c" {
        if let Some(pos) = first_line.find("version") {
            let part = &first_line[pos + 8..];
            return Some(part.split_whitespace().next().unwrap_or(part).to_string());
        }
    } else if binary == "rsgain" {
        if let Some(pos) = first_line.find("rsgain") {
            let part = &first_line[pos + 6..].trim();
            return Some(part.split_whitespace().next().unwrap_or(part).to_string());
        }
    } else if binary == "deno" {
        if let Some(pos) = first_line.find("deno") {
            let part = &first_line[pos + 4..].trim();
            return Some(part.split_whitespace().next().unwrap_or(part).to_string());
        }
    } else if binary == "yt-dlp" {
        if let Some(pos) = first_line.find("yt-dlp") {
            let part = &first_line[pos + 6..].trim();
            return Some(part.split_whitespace().next().unwrap_or(part).to_string());
        }
    }

    Some(first_line.to_string())
}

async fn download_file_with_progress(
    app: &AppHandle,
    url: &str,
    dest_path: &Path,
    event_name: &str,
    binary_name: &str,
) -> Result<(), String> {
    let client = reqwest::Client::new();
    let res = client
        .get(url)
        .header(USER_AGENT, "SceneClip")
        .send()
        .await
        .map_err(|e| e.to_string())?;

    let total_size = res.content_length().unwrap_or(0);
    let mut file = fs::File::create(dest_path).map_err(|e| e.to_string())?;
    let mut downloaded: u64 = 0;

    use futures::StreamExt;
    let mut stream = res.bytes_stream();

    while let Some(item) = stream.next().await {
        let chunk = item.map_err(|e| e.to_string())?;
        file.write_all(&chunk).map_err(|e| e.to_string())?;
        downloaded += chunk.len() as u64;

        if total_size > 0 {
            let percent = (downloaded as f64 / total_size as f64) * 100.0;
            let event = ProgressEvent {
                binary: binary_name.to_string(),
                percent,
                downloaded,
                total: total_size,
            };
            let _ = app.emit(event_name, event);
        }
    }
    Ok(())
}

async fn fetch_github_latest(repo: &str) -> Result<ReleaseData, String> {
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

    let tag_name = json["tag_name"].as_str().ok_or("No tag_name")?.to_string();
    let name = json["name"].as_str().map(|s| s.to_string());

    let mut assets = Vec::new();
    if let Some(arr) = json["assets"].as_array() {
        for a in arr {
            if let (Some(n), Some(u), Some(s)) = (
                a["name"].as_str(),
                a["browser_download_url"].as_str(),
                a["size"].as_u64(),
            ) {
                assets.push(ReleaseAsset {
                    name: n.to_string(),
                    browser_download_url: u.to_string(),
                    size: s,
                });
            }
        }
    }

    Ok(ReleaseData {
        tag_name,
        name,
        assets,
    })
}

// --- Version Comparison ---

#[derive(Debug, PartialEq, Eq, PartialOrd, Ord)]
enum Version {
    Date(u32, u32, u32),
    Semantic(Vec<u64>),
    Unknown(String),
}

fn parse_version(s: &str) -> Version {
    let clean: String = s.chars().skip_while(|c| !c.is_numeric()).collect();

    let numeric_parts: Vec<u64> = clean
        .split(|c: char| !c.is_numeric())
        .filter(|s| !s.is_empty())
        .filter_map(|s| s.parse().ok())
        .collect();

    if numeric_parts.len() >= 3 && numeric_parts[0] > 2000 {
        return Version::Date(
            numeric_parts[0] as u32,
            numeric_parts[1] as u32,
            numeric_parts[2] as u32,
        );
    }

    if !numeric_parts.is_empty() {
        return Version::Semantic(numeric_parts);
    }

    Version::Unknown(s.to_string())
}

fn compare_versions(current: &str, latest: &str) -> Ordering {
    let v_current = parse_version(current);
    let v_latest = parse_version(latest);

    match (v_current, v_latest) {
        (Version::Date(y1, m1, d1), Version::Date(y2, m2, d2)) => (y1, m1, d1).cmp(&(y2, m2, d2)),
        (Version::Semantic(v1), Version::Semantic(v2)) => v1.cmp(&v2),
        (Version::Date(..), Version::Semantic(..)) => Ordering::Greater,
        (Version::Semantic(..), Version::Date(..)) => Ordering::Less,
        (Version::Unknown(s1), Version::Unknown(s2)) => s1.cmp(&s2),
        _ => Ordering::Equal,
    }
}

// --- Commands ---

#[tauri::command]
pub async fn get_binary_version_local(app: AppHandle, binary: String) -> Option<String> {
    let path = find_active_binary(&app, &binary);
    log::info!("Binary check for {}: path={:?}", binary, path);
    get_version_cmd(&path, &binary)
}

#[tauri::command]
pub async fn debug_binary_paths(app: AppHandle) -> Vec<String> {
    let binaries = vec!["yt-dlp", "ffmpeg", "aria2c", "rsgain", "deno", "ffprobe"];
    binaries
        .into_iter()
        .map(|b| {
            let path = find_active_binary(&app, b);
            format!("{}: {:?}", b, path)
        })
        .collect()
}

#[tauri::command]
pub async fn check_updates(app: AppHandle, scope: String) -> Result<UpdaterStatus, String> {
    // 0. Check App Version (SceneClip)
    let app_current = app.package_info().version.to_string();
    let mut app_latest_tag = None;
    let mut app_has_update = false;
    let mut app_error = None;

    if scope == "app" || scope == "all" {
        match fetch_github_latest("Myunikon/SceneClip").await {
            Ok(v) => {
                app_latest_tag = Some(v.tag_name.clone());
                app_has_update = compare_versions(&app_current, &v.tag_name) == Ordering::Less;
            }
            Err(e) => app_error = Some(e),
        }
    }

    // 1. Check yt-dlp
    let yt_path_active = find_active_binary(&app, "yt-dlp");
    let yt_current = get_version_cmd(&yt_path_active, "yt-dlp");
    let mut yt_latest_tag = None;
    let mut yt_update = false;
    let mut yt_error = None;

    if scope == "binaries" || scope == "all" {
        match fetch_github_latest("yt-dlp/yt-dlp").await {
            Ok(v) => {
                yt_latest_tag = Some(v.tag_name.clone());
                yt_update = match &yt_current {
                    Some(c) => compare_versions(c, &v.tag_name) == Ordering::Less,
                    None => true, // Not installed
                };
            }
            Err(e) => yt_error = Some(e),
        }
    }

    // 2. Binary health check (simplified)
    let yt_integrity = yt_current.is_some();

    Ok(UpdaterStatus {
        app_update: UpdateInfo {
            current: Some(app_current),
            latest: app_latest_tag,
            has_update: app_has_update,
            integrity_valid: true, // App itself is running
            error: app_error,
        },
        ytdlp: UpdateInfo {
            current: yt_current,
            latest: yt_latest_tag,
            has_update: yt_update,
            integrity_valid: yt_integrity,
            error: yt_error,
        },
    })
}

lazy_static::lazy_static! {
    static ref UPDATE_ABORT_HANDLES: std::sync::Arc<std::sync::Mutex<std::collections::HashMap<String, tokio::task::AbortHandle>>> = std::sync::Arc::new(std::sync::Mutex::new(std::collections::HashMap::new()));
}

#[tauri::command]
pub async fn cancel_update(binary: String) -> Result<(), String> {
    let mut handles = UPDATE_ABORT_HANDLES.lock().unwrap();
    if let Some(handle) = handles.remove(&binary) {
        handle.abort();
    }
    Ok(())
}

#[tauri::command]
pub async fn update_binary(app: AppHandle, binary: String) -> Result<String, String> {
    let binary_clone = binary.clone();
    let app_clone = app.clone();

    let update_task = tokio::spawn(async move {
        // Map binaries to their GitHub repos
        let repo = match binary.as_str() {
            "yt-dlp" => "yt-dlp/yt-dlp",
            _ => {
                return Err(format!(
                    "Manual updates and checks are disabled for {}. Only yt-dlp can be updated.",
                    binary
                ));
            }
        };

        // Reuse fetch_github_latest
        let release_data = fetch_github_latest(repo).await.map_err(|e| e.to_string())?;
        let assets = release_data.assets;

        let (target_keyword, extension) = get_target_pattern(&binary);

        let asset = assets
            .iter()
            .find(|a| {
                let name = a.name.to_lowercase();
                if binary == "yt-dlp" {
                    if cfg!(target_os = "windows") {
                        name == "yt-dlp.exe"
                    } else if cfg!(target_os = "macos") {
                        name == "yt-dlp_macos"
                    } else {
                        name == "yt-dlp_linux"
                    }
                } else {
                    name.contains(&target_keyword) && name.ends_with(&extension)
                }
            })
            .ok_or("No asset found")?;

        let temp_dir = app.path().temp_dir().unwrap_or_else(|_| PathBuf::from("."));
        let temp_filename = format!("sceneclip_update_{}.tmp", binary);
        let temp_path = temp_dir.join(&temp_filename);

        download_file_with_progress(
            &app,
            &asset.browser_download_url,
            &temp_path,
            "update-progress",
            &binary,
        )
        .await?;

        let final_path = get_writable_binary_path(&app, &binary);
        if let Some(parent) = final_path.parent() {
            let _ = fs::create_dir_all(parent);
        }

        if extension == "zip" {
            extract_zip(&temp_path, &final_path, &binary)?;
        } else if extension.contains("tar") {
            extract_tar(&temp_path, &final_path, &binary)?;
        } else {
            replace_binary(&temp_path, &final_path)?;
        }

        let _ = fs::remove_file(&temp_path);
        Ok(final_path.to_string_lossy().to_string())
    });

    let abort_handle = update_task.abort_handle();
    {
        let mut map = UPDATE_ABORT_HANDLES.lock().unwrap();
        map.insert(binary_clone.clone(), abort_handle);
    }

    let result = match update_task.await {
        Ok(res) => res,
        Err(e) => {
            if e.is_cancelled() {
                let event = ProgressEvent {
                    // Reset UI
                    binary: binary_clone.clone(),
                    percent: 0.0,
                    downloaded: 0,
                    total: 0,
                };
                let _ = app_clone.emit("update-progress", event);
                Err("Update cancelled by user".to_string())
            } else {
                Err(format!("Update task panicked: {}", e))
            }
        }
    };

    {
        let mut map = UPDATE_ABORT_HANDLES.lock().unwrap();
        map.remove(&binary_clone);
    }

    result
}

#[tauri::command]
pub async fn install_app_update(app: AppHandle) -> Result<(), String> {
    log::info!("Starting App Update Process...");

    // 1. Fetch Latest Data
    let release_data = fetch_github_latest("Myunikon/SceneClip").await?;
    let assets = release_data.assets;

    // 2. Identify Current State
    let current_exe = std::env::current_exe().map_err(|e| e.to_string())?;
    let parent_dir = current_exe.parent().ok_or("No parent dir")?;

    // Detect architecture
    let arch = std::env::consts::ARCH; // "x86_64", "aarch64", etc.
    log::info!("Detected architecture: {}", arch);

    // 3. Find Matching Asset (OS + Architecture specific)
    #[cfg(target_os = "windows")]
    let asset = {
        // Check if installed (Inno Setup indicator)
        let is_installed = parent_dir.join("unins000.exe").exists()
            || current_exe
                .to_string_lossy()
                .to_lowercase()
                .contains("program files");

        log::info!("Windows Mode: is_installed={}, arch={}", is_installed, arch);

        let keyword = if is_installed { "setup" } else { "portable" };

        // Try architecture-specific match first
        let arch_keyword = if arch == "aarch64" { "arm64" } else { "" };

        assets
            .iter()
            .find(|a| {
                let name = a.name.to_lowercase();
                let is_exe = name.ends_with(".exe");
                let matches_type = name.contains(keyword);
                let matches_arch = arch_keyword.is_empty() || name.contains(arch_keyword);
                // Exclude ARM builds if we're on x64
                let excludes_wrong_arch = if arch != "aarch64" {
                    !name.contains("arm64")
                } else {
                    true
                };

                is_exe && matches_type && matches_arch && excludes_wrong_arch
            })
            .or_else(|| {
                // Fallback: any .exe matching type
                assets.iter().find(|a| {
                    let name = a.name.to_lowercase();
                    name.ends_with(".exe") && name.contains(keyword)
                })
            })
    };

    #[cfg(target_os = "macos")]
    let asset = {
        log::info!("macOS Mode: arch={}", arch);

        // Prefer universal or architecture-specific DMG
        let arch_keywords: &[&str] = if arch == "aarch64" {
            &["universal", "arm64", "aarch64"]
        } else {
            &["universal", "x64", "intel", "x86_64"]
        };

        assets
            .iter()
            .find(|a| {
                let name = a.name.to_lowercase();
                let is_dmg = name.ends_with(".dmg");
                let matches_arch = arch_keywords.iter().any(|kw| name.contains(kw));
                is_dmg && matches_arch
            })
            .or_else(|| {
                // Fallback: any .dmg
                assets
                    .iter()
                    .find(|a| a.name.to_lowercase().ends_with(".dmg"))
            })
    };

    #[cfg(target_os = "linux")]
    let asset = {
        log::info!("Linux Mode: arch={}", arch);

        // Prefer AppImage
        assets
            .iter()
            .find(|a| {
                let name = a.name.to_lowercase();
                name.ends_with(".appimage")
            })
            .or_else(|| {
                // Fallback: tar.gz
                assets
                    .iter()
                    .find(|a| a.name.to_lowercase().ends_with(".tar.gz"))
            })
    };

    let asset = asset.ok_or("No matching release asset found for this OS/Architecture")?;
    log::info!("Found update asset: {}", asset.name);

    // 4. Download
    let download_url = &asset.browser_download_url;
    let temp_dir = app.path().temp_dir().unwrap_or_else(|_| PathBuf::from("."));
    let temp_filename = format!("SceneClip_Update_{}", asset.name);
    let temp_path = temp_dir.join(&temp_filename);

    log::info!("Downloading to {:?}", temp_path);
    download_file_with_progress(
        &app,
        download_url,
        &temp_path,
        "update-progress",
        "SceneClip",
    )
    .await?;

    // 5. Apply Update (OS-specific)

    // --- WINDOWS ---
    #[cfg(target_os = "windows")]
    {
        let is_installed = parent_dir.join("unins000.exe").exists()
            || current_exe
                .to_string_lossy()
                .to_lowercase()
                .contains("program files");

        if is_installed {
            log::info!("Running Windows Installer...");
            std::process::Command::new(&temp_path)
                .arg("/VERYSILENT")
                .spawn()
                .map_err(|e| format!("Failed to start installer: {}", e))?;
            app.exit(0);
        } else {
            log::info!("Applying Windows Portable Update...");
            let old_exe = current_exe.with_extension("old");

            if old_exe.exists() {
                let _ = fs::remove_file(&old_exe);
            }
            fs::rename(&current_exe, &old_exe)
                .map_err(|e| format!("Failed to rename current exe: {}", e))?;

            if fs::rename(&temp_path, &current_exe).is_err() {
                fs::copy(&temp_path, &current_exe)
                    .map_err(|e| format!("Failed to copy new exe: {}", e))?;
                let _ = fs::remove_file(&temp_path);
            }

            std::process::Command::new(&current_exe)
                .spawn()
                .map_err(|e| format!("Failed to restart app: {}", e))?;
            app.exit(0);
        }
    }

    // --- MACOS ---
    #[cfg(target_os = "macos")]
    {
        log::info!("Applying macOS DMG Update...");

        // Mount the DMG
        let mount_output = std::process::Command::new("hdiutil")
            .args(["attach", "-nobrowse", "-quiet"])
            .arg(&temp_path)
            .output()
            .map_err(|e| format!("Failed to mount DMG: {}", e))?;

        if !mount_output.status.success() {
            return Err(format!(
                "hdiutil attach failed: {}",
                String::from_utf8_lossy(&mount_output.stderr)
            ));
        }

        // Find the mount point (typically /Volumes/SceneClip or similar)
        let mount_info = std::process::Command::new("hdiutil")
            .args(["info", "-plist"])
            .output()
            .map_err(|e| format!("Failed to get mount info: {}", e))?;

        // Parse mount point (simple heuristic: look for /Volumes/SceneClip)
        let volumes_dir = PathBuf::from("/Volumes");
        let mut mount_point: Option<PathBuf> = None;

        if let Ok(entries) = fs::read_dir(&volumes_dir) {
            for entry in entries.flatten() {
                let name = entry.file_name().to_string_lossy().to_lowercase();
                if name.contains("sceneclip") {
                    mount_point = Some(entry.path());
                    break;
                }
            }
        }

        let mount_point = mount_point.ok_or("Could not find mounted DMG volume")?;
        log::info!("DMG mounted at {:?}", mount_point);

        // Find .app bundle in mount
        let mut app_bundle: Option<PathBuf> = None;
        if let Ok(entries) = fs::read_dir(&mount_point) {
            for entry in entries.flatten() {
                if entry.path().extension().map_or(false, |e| e == "app") {
                    app_bundle = Some(entry.path());
                    break;
                }
            }
        }

        let app_bundle = app_bundle.ok_or("No .app bundle found in DMG")?;
        log::info!("Found app bundle: {:?}", app_bundle);

        // Copy to /Applications
        let dest = PathBuf::from("/Applications").join(app_bundle.file_name().unwrap());

        // Remove old version first
        if dest.exists() {
            fs::remove_dir_all(&dest).map_err(|e| format!("Failed to remove old app: {}", e))?;
        }

        // Use ditto for proper macOS copy with attributes
        let copy_result = std::process::Command::new("ditto")
            .arg(&app_bundle)
            .arg(&dest)
            .output()
            .map_err(|e| format!("Failed to copy app: {}", e))?;

        if !copy_result.status.success() {
            return Err(format!(
                "ditto copy failed: {}",
                String::from_utf8_lossy(&copy_result.stderr)
            ));
        }

        // Unmount DMG
        let _ = std::process::Command::new("hdiutil")
            .args(["detach", "-quiet"])
            .arg(&mount_point)
            .output();

        // Clean up temp file
        let _ = fs::remove_file(&temp_path);

        // Restart app
        std::process::Command::new("open")
            .arg(&dest)
            .spawn()
            .map_err(|e| format!("Failed to restart app: {}", e))?;

        app.exit(0);
    }

    // --- LINUX ---
    #[cfg(target_os = "linux")]
    {
        log::info!("Applying Linux Update...");

        let is_appimage = current_exe
            .to_string_lossy()
            .to_lowercase()
            .ends_with(".appimage")
            || std::env::var("APPIMAGE").is_ok();

        if is_appimage || temp_path.to_string_lossy().ends_with(".AppImage") {
            log::info!("AppImage self-replacement...");

            // Rename current to .old
            let old_exe = current_exe.with_extension("old");
            if old_exe.exists() {
                let _ = fs::remove_file(&old_exe);
            }

            // If current is AppImage, replace it
            if is_appimage {
                fs::rename(&current_exe, &old_exe)
                    .map_err(|e| format!("Failed to rename current AppImage: {}", e))?;

                fs::rename(&temp_path, &current_exe)
                    .or_else(|_| fs::copy(&temp_path, &current_exe).map(|_| ()))
                    .map_err(|e| format!("Failed to install new AppImage: {}", e))?;
            } else {
                // New install location
                fs::rename(&temp_path, &current_exe)
                    .or_else(|_| fs::copy(&temp_path, &current_exe).map(|_| ()))
                    .map_err(|e| format!("Failed to install AppImage: {}", e))?;
            }

            // Set executable permission
            let chmod_result = std::process::Command::new("chmod")
                .args(["+x"])
                .arg(&current_exe)
                .output();

            if let Err(e) = chmod_result {
                log::warn!("chmod failed: {}", e);
            }

            // Restart
            std::process::Command::new(&current_exe)
                .spawn()
                .map_err(|e| format!("Failed to restart app: {}", e))?;

            app.exit(0);
        } else {
            // Fallback: Open folder
            use tauri_plugin_shell::ShellExt;
            app.shell()
                .open(temp_dir.to_string_lossy(), None)
                .map_err(|e| e.to_string())?;

            return Err("Update downloaded. Please install manually.".to_string());
        }
    }

    Ok(())
}

fn get_target_pattern(binary: &str) -> (String, String) {
    #[cfg(target_os = "windows")]
    {
        match binary {
            "ffmpeg" => ("win64-gpl".to_string(), "zip".to_string()),
            "aria2c" => ("win-64bit".to_string(), "zip".to_string()),
            "rsgain" => ("win64".to_string(), "zip".to_string()),
            "deno" => ("x86_64-pc-windows-msvc".to_string(), "zip".to_string()),
            _ => ("".to_string(), "".to_string()),
        }
    }
    #[cfg(target_os = "macos")]
    {
        match binary {
            "ffmpeg" => ("".to_string(), "".to_string()),
            "aria2c" => ("osx".to_string(), "tar.bz2".to_string()),
            "deno" => ("aarch64-apple-darwin".to_string(), "zip".to_string()),
            _ => ("".to_string(), "".to_string()),
        }
    }
    #[cfg(target_os = "linux")]
    {
        match binary {
            "ffmpeg" => ("linux64-gpl".to_string(), "tar.xz".to_string()),
            "aria2c" => ("linux-gnu".to_string(), "tar.bz2".to_string()),
            "deno" => ("unknown-linux-gnu".to_string(), "zip".to_string()),
            _ => ("".to_string(), "".to_string()),
        }
    }
}

fn replace_binary(source: &Path, dest: &Path) -> Result<(), String> {
    if dest.exists() {
        let _ = fs::remove_file(dest);
    }
    fs::rename(source, dest).map_err(|e| e.to_string())?;

    #[cfg(unix)]
    {
        use std::os::unix::fs::PermissionsExt;
        let mut perms = fs::metadata(dest).map_err(|e| e.to_string())?.permissions();
        perms.set_mode(0o755);
        let _ = fs::set_permissions(dest, perms);
    }
    Ok(())
}

fn extract_zip(
    archive_path: &Path,
    dest_binary_path: &Path,
    binary_name: &str,
) -> Result<(), String> {
    let file = fs::File::open(archive_path).map_err(|e| e.to_string())?;
    let mut archive = zip::ZipArchive::new(file).map_err(|e| e.to_string())?;

    for i in 0..archive.len() {
        let mut file = archive.by_index(i).map_err(|e| e.to_string())?;
        let name = file.name().to_lowercase();

        let is_match = if cfg!(target_os = "windows") {
            name.ends_with(&format!("{}.exe", binary_name))
                || (binary_name == "ffmpeg" && name.ends_with("ffmpeg.exe"))
        } else {
            name.ends_with(&format!("/{}", binary_name)) || name == binary_name
        };

        if is_match && !name.ends_with("/") {
            let mut out_file = fs::File::create(dest_binary_path).map_err(|e| e.to_string())?;
            std::io::copy(&mut file, &mut out_file).map_err(|e| e.to_string())?;

            #[cfg(unix)]
            {
                use std::os::unix::fs::PermissionsExt;
                let mut perms = fs::metadata(dest_binary_path).unwrap().permissions();
                perms.set_mode(0o755);
                let _ = fs::set_permissions(dest_binary_path, perms);
            }
            return Ok(());
        }
    }
    Err("Binary not found in zip".to_string())
}

fn extract_tar(
    archive_path: &Path,
    dest_binary_path: &Path,
    binary_name: &str,
) -> Result<(), String> {
    #[cfg(unix)]
    {
        let temp_dir = archive_path
            .parent()
            .unwrap()
            .join(format!("{}_extract", binary_name));
        if temp_dir.exists() {
            let _ = fs::remove_dir_all(&temp_dir);
        }
        fs::create_dir_all(&temp_dir).map_err(|e| e.to_string())?;

        let status = std::process::Command::new("tar")
            .arg("-xf")
            .arg(archive_path)
            .arg("-C")
            .arg(&temp_dir)
            .status()
            .map_err(|e| format!("Failed to execute tar: {}", e))?;

        if !status.success() {
            return Err("Tar command failed to extract".to_string());
        }

        let mut found_path: Option<PathBuf> = None;
        let mut search_stack = vec![temp_dir.clone()];

        while let Some(dir) = search_stack.pop() {
            if let Ok(entries) = fs::read_dir(dir) {
                for entry in entries.flatten() {
                    let path = entry.path();
                    if path.is_dir() {
                        search_stack.push(path);
                        continue;
                    }

                    if let Some(name) = path.file_name().and_then(|s| s.to_str()) {
                        if name == binary_name {
                            found_path = Some(path);
                            break;
                        }
                    }
                }
            }
            if found_path.is_some() {
                break;
            }
        }

        if let Some(source) = found_path {
            replace_binary(&source, dest_binary_path)?;
            let _ = fs::remove_dir_all(&temp_dir);
            Ok(())
        } else {
            let _ = fs::remove_dir_all(&temp_dir);
            Err(format!(
                "Binary '{}' not found in extracted archive",
                binary_name
            ))
        }
    }

    #[cfg(not(unix))]
    {
        let _ = archive_path;
        let _ = dest_binary_path;
        let _ = binary_name;
        Err(
            "Tar extractions are not supported on non-Unix systems yet inside this app."
                .to_string(),
        )
    }
}
