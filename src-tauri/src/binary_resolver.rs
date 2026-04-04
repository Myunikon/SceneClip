use std::path::PathBuf;
use tauri::{AppHandle, Manager};

/// Returns the platform-appropriate executable name.
/// On Windows, appends `.exe` if not already present. On other platforms, returns as-is.
pub fn platform_exe_name(binary_name: &str) -> String {
    #[cfg(target_os = "windows")]
    {
        if binary_name.ends_with(".exe") {
            binary_name.to_string()
        } else {
            format!("{}.exe", binary_name)
        }
    }
    #[cfg(not(target_os = "windows"))]
    {
        binary_name.to_string()
    }
}

/// Returns the writable update storage path for a binary.
/// This is in `app_local_data_dir`, where updated binaries are placed.
pub fn writable_path(app: &AppHandle, binary_name: &str) -> PathBuf {
    let app_local_data = app.path().app_local_data_dir().unwrap();
    if !app_local_data.exists() {
        let _ = std::fs::create_dir_all(&app_local_data);
    }
    app_local_data.join(platform_exe_name(binary_name))
}

/// Resolves the best available path for a binary, checking in order:
/// 1. Writable update storage (`app_local_data_dir`)
/// 2. Bundled sidecar (flat next to executable)
/// 3. `bin/` subdirectory next to executable
/// 4. Sidecar scan (e.g. `binary-x86_64-pc-windows-msvc.exe`)
/// 5. Fallback to system PATH (just the binary name)
pub fn resolve(app: &AppHandle, binary_name: &str) -> PathBuf {
    let exe_name = platform_exe_name(binary_name);

    // 1. Check writable update storage (priority — contains user-updated binaries)
    if let Ok(local_dir) = app.path().app_local_data_dir() {
        let local_path = local_dir.join(&exe_name);
        if local_path.exists() {
            return local_path;
        }
    }

    // 2–4. Check bundled sidecar locations
    if let Ok(mut exe_path) = std::env::current_exe() {
        exe_path.pop(); // Parent dir

        // 2. Flat next to executable
        let flat_path = exe_path.join(&exe_name);
        if flat_path.exists() {
            return flat_path;
        }

        // 3. bin/ subdirectory
        let bin_path = exe_path.join("bin").join(&exe_name);
        if bin_path.exists() {
            return bin_path;
        }

        // 4. Sidecar scan (for names like `binary-x86_64-pc-windows-msvc.exe`)
        if let Some(found) = scan_for_sidecar(&exe_path, binary_name) {
            return found;
        }

        // Also scan bin/ subdirectory
        let bin_dir = exe_path.join("bin");
        if let Some(found) = scan_for_sidecar(&bin_dir, binary_name) {
            return found;
        }
    }

    // 5. Fallback to system PATH
    PathBuf::from(binary_name)
}

/// Convenience: Resolves to a `String` (for compatibility with existing code that uses String paths).
pub fn resolve_to_string(app: &AppHandle, binary_name: &str) -> String {
    resolve(app, binary_name).to_string_lossy().to_string()
}

/// Resolves a binary path, preferring a user-configured path if non-empty.
pub fn resolve_configured(app: &AppHandle, binary_name: &str, configured_path: &str) -> String {
    if !configured_path.is_empty() {
        return configured_path.to_string();
    }
    resolve_to_string(app, binary_name)
}

/// Scans a directory for a sidecar binary whose stem starts with `binary_name`.
fn scan_for_sidecar(dir: &std::path::Path, binary_name: &str) -> Option<PathBuf> {
    let binary_name_lower = binary_name.to_lowercase();
    let entries = std::fs::read_dir(dir).ok()?;

    for entry in entries.flatten() {
        let path = entry.path();
        let stem = path.file_stem().and_then(|s| s.to_str())?;
        let stem_lower = stem.to_lowercase();

        if stem_lower.starts_with(&binary_name_lower) && is_executable(&path) {
            return Some(path);
        }
    }
    None
}

/// Checks if a path looks like an executable file.
fn is_executable(path: &std::path::Path) -> bool {
    #[cfg(target_os = "windows")]
    {
        path.extension()
            .map_or(false, |e| e.to_ascii_lowercase() == "exe")
    }
    #[cfg(not(target_os = "windows"))]
    {
        // On Unix, any file without a common non-executable extension is considered executable
        let _ = path;
        true
    }
}
