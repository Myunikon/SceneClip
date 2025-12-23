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
pub async fn check_gpu_support(_app_handle: AppHandle) -> Result<bool, String> {
    // SECURITY: Ignore frontend-provided path. Always use sidecar or trusted system binary.
    // In production, you'd likely use a sidecar, but for now we'll check path or assume local.
    // Simplifying to check system ffmpeg to avoid RCE risk of executing arbitrary passed strings.

    // Safe way: Do not use user input for command construction

    // SECURITY: Use absolute path to avoiding PATH poisoning.
    // We assume the binary is in C:\Users\ACER ID\AppData\Roaming\clipscene\binaries\ffmpeg(.exe) as requested.
    let ffmpeg_name = if cfg!(target_os = "windows") {
        "ffmpeg.exe"
    } else {
        "ffmpeg"
    };

    // SECURITY: Use dynamic resolution via Tauri API
    // We assume the binary is in the app data directory or resources.
    // resolving 'binaries/ffmpeg(.exe)' inside AppConfig or generic Resource path.
    use tauri::path::BaseDirectory;
    let ffmpeg_path = _app_handle
        .path()
        .resolve(format!("binaries/{}", ffmpeg_name), BaseDirectory::AppData)
        .map_err(|e| format!("Failed to resolve binary path: {}", e))?;

    if !ffmpeg_path.exists() {
        // Fallback: Check local resources (sidecar location or similar) if not in AppData
        return Err(format!("FFmpeg binary not found at {:?}", ffmpeg_path));
    }

    let mut cmd = tokio::process::Command::new(ffmpeg_path);

    #[cfg(target_os = "windows")]
    cmd.creation_flags(0x08000000);

    let output = cmd
        .arg("-encoders")
        .arg("-hide_banner")
        .output()
        .await
        .map_err(|e| {
            format!(
                "Failed to execute FFmpeg at {:?}: {}",
                cmd.as_std().get_program(),
                e
            )
        })?;

    let stdout = String::from_utf8_lossy(&output.stdout);

    let has_nvidia = stdout.contains("h264_nvenc");
    let has_amd = stdout.contains("h264_amf");
    let has_intel = stdout.contains("h264_qsv");

    Ok(has_nvidia || has_amd || has_intel)
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
