use system_shutdown::{shutdown, sleep};
use tauri::{command, AppHandle, Manager};

#[command]
pub fn perform_system_action(action: String, confirm: bool) -> Result<(), String> {
    if !confirm {
        return Err("Confirmation required".to_string());
    }
    match action.as_str() {
        "shutdown" => {
            shutdown().map_err(|e| e.to_string())?;
            Ok(())
        }
        "sleep" => {
            sleep().map_err(|e| e.to_string())?;
            Ok(())
        }
        _ => Err("Invalid action".to_string()),
    }
}

#[command]
pub fn force_exit(_app_handle: AppHandle) {
    log::info!("[System] Force exit requested by user");
    // We use std::process::exit to guarantee immediate termination,
    // bypassing any potential recursive CloseRequested checks.
    std::process::exit(0);
}

#[derive(serde::Serialize)]
pub struct GpuInfo {
    vendor: String,
    model: String,
    renderer: String,
    debug_info: String,
}

#[command]
pub async fn check_gpu_support(app_handle: AppHandle) -> Result<GpuInfo, String> {
    // 1. Check FFmpeg Encodes (Capability)
    use tauri_plugin_shell::ShellExt;

    let mut debug_log = String::new();
    debug_log.push_str("Using Sidecar: ffmpeg\n");

    // Default values if FFmpeg fails
    let (mut vendor, mut renderer) = ("cpu", "Detection Failed");

    let cmd_setup = app_handle.shell().sidecar("ffmpeg");

    match cmd_setup {
        Ok(cmd) => {
            match cmd.args(["-encoders", "-hide_banner"]).output().await {
                Ok(output) => {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    debug_log.push_str(&format!(
                        "FFmpeg Capabilities (stdout len): {}\n",
                        stdout.len()
                    ));

                    // Determine Vendor & Renderer (Cross-Platform)
                    if stdout.contains("h264_nvenc") {
                        vendor = "nvidia";
                        renderer = "nvenc";
                    } else if stdout.contains("h264_amf") {
                        vendor = "amd";
                        renderer = "amf";
                    } else if stdout.contains("h264_qsv") {
                        vendor = "intel";
                        renderer = "qsv";
                    } else if stdout.contains("h264_videotoolbox") {
                        // macOS hardware encoding (Apple Silicon or Intel Mac with VideoToolbox)
                        vendor = "apple";
                        renderer = "videotoolbox";
                    } else {
                        vendor = "cpu";
                        renderer = "libx264";
                    }
                    debug_log.push_str(&format!("FFmpeg Detected Vendor: {}\n", vendor));
                }
                Err(e) => {
                    debug_log.push_str(&format!("FFmpeg Exec Failed: {}\n", e));
                }
            }
        }
        Err(e) => {
            debug_log.push_str(&format!("Sidecar Setup Failed: {}\n", e));
        }
    }

    // 2. Get Actual GPU Model Name (OS Level)
    #[allow(unused_assignments)]
    let mut model_name = "Unknown Model".to_string();
    #[allow(unused_assignments)]
    let mut detected_os_vendor = "none";

    #[cfg(target_os = "windows")]
    {
        // Use PowerShell to get video controller names
        let mut cmd_wmic = tokio::process::Command::new("powershell");
        cmd_wmic.creation_flags(0x08000000); // CREATE_NO_WINDOW
        cmd_wmic.args(&[
            "-NoProfile",
            "-Command",
            "Get-CimInstance Win32_VideoController | Select-Object -ExpandProperty Name",
        ]);

        match cmd_wmic.output().await {
            Ok(wmic_output) => {
                let wmic_stdout = String::from_utf8_lossy(&wmic_output.stdout);
                let wmic_stderr = String::from_utf8_lossy(&wmic_output.stderr);

                debug_log.push_str("--- POWERSHELL OUTPUT ---\n");
                debug_log.push_str(&wmic_stdout);

                if !wmic_stderr.trim().is_empty() {
                    debug_log.push_str("--- POWERSHELL ERROR ---\n");
                    debug_log.push_str(&wmic_stderr);
                }

                let gpu_lines: Vec<&str> = wmic_stdout
                    .lines()
                    .map(|l| l.trim())
                    .filter(|l| !l.is_empty())
                    .collect();

                // Heuristic: finding a "real" GPU
                for line in &gpu_lines {
                    let upper = line.to_uppercase();
                    debug_log.push_str(&format!("Checking GPU Line: {}\n", line));

                    if upper.contains("NVIDIA") {
                        model_name = line.to_string();
                        detected_os_vendor = "nvidia";
                        break;
                    }
                    if upper.contains("AMD") || upper.contains("RADEON") {
                        model_name = line.to_string();
                        detected_os_vendor = "amd";
                        break;
                    }
                    if upper.contains("INTEL")
                        && (upper.contains("IRIS")
                            || upper.contains("ARC")
                            || upper.contains("UHD"))
                    {
                        model_name = line.to_string();
                        detected_os_vendor = "intel";
                    }
                }

                if detected_os_vendor == "none" && !gpu_lines.is_empty() {
                    // Fallback
                    model_name = gpu_lines[0].to_string();
                }
            }
            Err(e) => {
                debug_log.push_str(&format!("PowerShell Exec Failed: {}\n", e));
            }
        }
    }

    #[cfg(target_os = "macos")]
    {
        // On macOS, if vendor is apple (VideoToolbox detected), set model appropriately
        if vendor == "apple" {
            model_name = "Apple Silicon / VideoToolbox".to_string();
            detected_os_vendor = "apple";
        } else {
            model_name = "macOS System GPU".to_string();
        }
    }

    #[cfg(target_os = "linux")]
    {
        model_name = "Linux System GPU".to_string();
    }

    #[cfg(not(any(target_os = "windows", target_os = "macos", target_os = "linux")))]
    {
        model_name = "Generic System GPU".to_string();
    }

    debug_log.push_str(&format!("OS Detected Vendor: {}\n", detected_os_vendor));

    let final_vendor = if vendor != "cpu" {
        vendor
    } else {
        detected_os_vendor
    };
    let final_renderer = if vendor != "cpu" {
        renderer
    } else {
        "libx264 (Software)"
    };

    if final_vendor == "none" || (final_vendor == "cpu" && model_name == "Unknown Model") {
        model_name = "Software Rendering (CPU)".to_string();
    }

    debug_log.push_str(&format!(
        "Final Decision: Vendor={}, Model={}, Renderer={}",
        final_vendor, model_name, final_renderer
    ));

    // 3. Get CPU Info (Added to fix frontend popup issue)
    #[allow(unused_mut)]
    let mut cpu_info_str = String::new();
    #[cfg(target_os = "windows")]
    {
        let mut cmd_cpu = tokio::process::Command::new("powershell");
        cmd_cpu.creation_flags(0x08000000); // CREATE_NO_WINDOW
        cmd_cpu.args(&[
            "-NoProfile",
            "-Command",
            "Get-CimInstance Win32_Processor | Select-Object Name, Manufacturer, NumberOfCores, NumberOfLogicalProcessors, MaxClockSpeed, L3CacheSize | Format-List",
        ]);

        match cmd_cpu.output().await {
            Ok(output) => {
                let stdout = String::from_utf8_lossy(&output.stdout);
                cpu_info_str.push_str("\n--- CPU INFO ---\n");
                cpu_info_str.push_str(&stdout);
            }
            Err(e) => {
                cpu_info_str.push_str(&format!("\nCPU Info Failed: {}\n", e));
            }
        }
    }
    debug_log.push_str(&cpu_info_str);

    Ok(GpuInfo {
        vendor: final_vendor.to_string(),
        model: model_name,
        renderer: final_renderer.to_string(),
        debug_info: debug_log,
    })
}

#[command]
pub fn set_window_effects(app_handle: AppHandle, enable: bool) -> Result<(), String> {
    if let Some(window) = app_handle.get_webview_window("main") {
        #[cfg(target_os = "windows")]
        {
            use window_vibrancy::{apply_blur, clear_blur};
            if enable {
                apply_blur(&window, Some((0, 0, 0, 0))).map_err(|e| e.to_string())?;
            } else {
                clear_blur(&window).map_err(|e| e.to_string())?;
            }
        }

        #[cfg(target_os = "macos")]
        {
            use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};
            // Note: macOS doesn't have a direct "clear" in this crate usually,
            // but re-applying standard appearance might help or ignored if not supported.
            // For now we only apply if enable is true.
            if enable {
                apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None)
                    .map_err(|e| e.to_string())?;
            }
        }
    }
    Ok(())
}

#[derive(serde::Serialize)]
pub struct ValidationResult {
    pub is_valid: bool,
    pub version: Option<String>,
    pub error: Option<String>,
}

#[derive(serde::Serialize)]
pub struct ValidationReport {
    pub ffmpeg: ValidationResult,
    pub ytdlp: ValidationResult,
}

#[command]
pub async fn validate_all_sidecars(app_handle: AppHandle) -> Result<ValidationReport, String> {
    log::info!("[System] Validating sidecars...");
    use tauri_plugin_shell::ShellExt;

    // Validate FFmpeg
    let mut ffmpeg_res = ValidationResult {
        is_valid: false,
        version: None,
        error: None,
    };

    match app_handle.shell().sidecar("bin/ffmpeg") {
        Ok(sidecar) => {
            let cmd = sidecar.arg("-version");

            match cmd.output().await {
                Ok(output) if output.status.success() => {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    let first_line = stdout.lines().next().unwrap_or("").to_string();
                    let lower_stdout = stdout.to_lowercase();

                    if lower_stdout.contains("gyan.dev")
                        && (lower_stdout.contains("--enable-libxml2")
                            || lower_stdout.contains("full"))
                    {
                        ffmpeg_res.error = Some("Non-Essentials FFmpeg detected. Please use FFmpeg Essentials to save space.".to_string());
                        ffmpeg_res.version = Some(first_line);
                    } else if lower_stdout.contains("ffmpeg") {
                        ffmpeg_res.is_valid = true;
                        ffmpeg_res.version = Some(first_line);
                    } else {
                        ffmpeg_res.error =
                            Some("Unexpected output or identity mismatch".to_string());
                    }
                }
                Ok(output) => {
                    ffmpeg_res.error = Some(String::from_utf8_lossy(&output.stderr).to_string());
                }
                Err(e) => {
                    ffmpeg_res.error = Some(e.to_string());
                }
            }
        }
        Err(e) => {
            ffmpeg_res.error = Some(format!("Failed to retrieve ffmpeg sidecar: {}", e));
        }
    }

    // Validate yt-dlp
    let mut ytdlp_res = ValidationResult {
        is_valid: false,
        version: None,
        error: None,
    };

    match app_handle.shell().sidecar("bin/yt-dlp") {
        Ok(sidecar) => {
            let cmd = sidecar.arg("--version");

            match cmd.output().await {
                Ok(output) if output.status.success() => {
                    let stdout = String::from_utf8_lossy(&output.stdout);
                    let version = stdout.trim().to_string();

                    // Rust equivalent of /^\d{4}\.\d{2}\.\d{2}/
                    let re = regex::Regex::new(r"^\d{4}\.\d{2}\.\d{2}").unwrap();
                    if re.is_match(&version) {
                        ytdlp_res.is_valid = true;
                        ytdlp_res.version = Some(version);
                    } else {
                        ytdlp_res.error =
                            Some("yt-dlp output format mismatch or invalid".to_string());
                    }
                }
                Ok(output) => {
                    ytdlp_res.error = Some(String::from_utf8_lossy(&output.stderr).to_string());
                }
                Err(e) => {
                    ytdlp_res.error = Some(e.to_string());
                }
            }
        }
        Err(e) => {
            ytdlp_res.error = Some(format!("Failed to retrieve yt-dlp sidecar: {}", e));
        }
    }

    Ok(ValidationReport {
        ffmpeg: ffmpeg_res,
        ytdlp: ytdlp_res,
    })
}

#[command]
pub async fn validate_single_binary(
    path: String,
    binary_type: String,
) -> Result<ValidationResult, String> {
    log::info!(
        "[System] Validating single binary: {} (type: {})",
        path,
        binary_type
    );

    let (args, check_fn): (&[&str], Box<dyn Fn(&str) -> ValidationResult + Send>) =
        match binary_type.as_str() {
            "ytdlp" => (
                &["--version"],
                Box::new(|stdout: &str| {
                    let version = stdout.trim().to_string();
                    let re = regex::Regex::new(r"^\d{4}\.\d{2}\.\d{2}").unwrap();
                    if re.is_match(&version) {
                        ValidationResult {
                            is_valid: true,
                            version: Some(version),
                            error: None,
                        }
                    } else {
                        ValidationResult {
                            is_valid: false,
                            version: None,
                            error: Some("Version format mismatch".to_string()),
                        }
                    }
                }),
            ),
            "ffmpeg" => (
                &["-version"] as &[&str],
                Box::new(|stdout: &str| {
                    let first_line = stdout.lines().next().unwrap_or("").to_string();
                    if stdout.to_lowercase().contains("ffmpeg") {
                        ValidationResult {
                            is_valid: true,
                            version: Some(first_line),
                            error: None,
                        }
                    } else {
                        ValidationResult {
                            is_valid: false,
                            version: None,
                            error: Some("Identity mismatch".to_string()),
                        }
                    }
                }) as Box<dyn Fn(&str) -> ValidationResult + Send>,
            ),
            "ffprobe" => (
                &["-version"],
                Box::new(|stdout: &str| {
                    let first_line = stdout.lines().next().unwrap_or("").to_string();
                    if stdout.to_lowercase().contains("ffprobe") {
                        ValidationResult {
                            is_valid: true,
                            version: Some(first_line),
                            error: None,
                        }
                    } else {
                        ValidationResult {
                            is_valid: false,
                            version: None,
                            error: Some("Identity mismatch".to_string()),
                        }
                    }
                }),
            ),
            "node" => (
                &["--version"],
                Box::new(|stdout: &str| {
                    let version = stdout.trim().to_string();
                    if version.starts_with('v') {
                        ValidationResult {
                            is_valid: true,
                            version: Some(version),
                            error: None,
                        }
                    } else {
                        ValidationResult {
                            is_valid: false,
                            version: None,
                            error: Some("Not a valid Node.js binary".to_string()),
                        }
                    }
                }),
            ),
            "deno" => (
                &["--version"],
                Box::new(|stdout: &str| {
                    let version = stdout.trim().to_string();
                    if stdout.to_lowercase().contains("deno") {
                        ValidationResult {
                            is_valid: true,
                            version: Some(version.lines().next().unwrap_or("").to_string()),
                            error: None,
                        }
                    } else {
                        ValidationResult {
                            is_valid: false,
                            version: None,
                            error: Some("Not a valid Deno binary".to_string()),
                        }
                    }
                }),
            ),
            "bun" => (
                &["--version"],
                Box::new(|stdout: &str| {
                    let version = stdout.trim().to_string();
                    if !version.is_empty() {
                        ValidationResult {
                            is_valid: true,
                            version: Some(version),
                            error: None,
                        }
                    } else {
                        ValidationResult {
                            is_valid: false,
                            version: None,
                            error: Some("Not a valid Bun binary".to_string()),
                        }
                    }
                }),
            ),
            _ => return Err(format!("Unknown binary type: {}", binary_type)),
        };

    let mut cmd = tokio::process::Command::new(&path);
    cmd.args(args);
    #[cfg(target_os = "windows")]
    {
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW
    }

    match cmd.output().await {
        Ok(output) => {
            let stdout = String::from_utf8_lossy(&output.stdout);
            if output.status.success() {
                Ok(check_fn(&stdout))
            } else {
                let stderr = String::from_utf8_lossy(&output.stderr);
                Ok(ValidationResult {
                    is_valid: false,
                    version: None,
                    error: Some(format!("Process exited with error: {}", stderr.trim())),
                })
            }
        }
        Err(e) => Ok(ValidationResult {
            is_valid: false,
            version: None,
            error: Some(format!("Failed to execute: {}", e)),
        }),
    }
}

#[command]
pub async fn open_log_dir(app_handle: AppHandle) -> Result<(), String> {
    log::info!("[System] Opening log directory");
    use tauri_plugin_opener::OpenerExt;
    let log_dir = app_handle.path().app_log_dir().map_err(|e| {
        log::error!("[System] Failed to get log directory: {}", e);
        e.to_string()
    })?;

    if !log_dir.exists() {
        log::warn!("[System] Log directory does not exist: {:?}", log_dir);
        return Err("Log directory does not exist".to_string());
    }

    log::debug!("[System] Opening path: {:?}", log_dir);
    app_handle
        .opener()
        .open_path(log_dir.to_string_lossy().to_string(), None::<String>)
        .map_err(|e| e.to_string())?;
    Ok(())
}
