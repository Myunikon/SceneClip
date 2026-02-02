use std::path::Path;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn get_unique_filepath(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);
    let parent = path.parent().unwrap_or(Path::new(""));
    let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("file");
    let extension = path.extension().and_then(|s| s.to_str()).unwrap_or("");

    // 1. Try original path
    if !path.exists() {
        return Ok(file_path);
    }

    // 2. Try numbered suffix (fast path)
    // Limit to 1000 to prevent long blocking on slow file systems
    for counter in 1..=1000 {
        let new_name = if extension.is_empty() {
            format!("{} ({})", file_stem, counter)
        } else {
            format!("{} ({}).{}", file_stem, counter, extension)
        };
        let new_path = parent.join(&new_name);

        if !new_path.exists() {
            return Ok(new_path.to_string_lossy().to_string());
        }
    }

    // 3. Fallback to UUID (Guaranteed Unique)
    // If we can't find a numbered slot, we just append a UUID to ensure success
    let uuid_suffix = uuid::Uuid::new_v4()
        .to_string()
        .chars()
        .take(8)
        .collect::<String>();
    let unique_name = if extension.is_empty() {
        format!("{} ({})", file_stem, uuid_suffix)
    } else {
        format!("{} ({}).{}", file_stem, uuid_suffix, extension)
    };

    Ok(parent.join(unique_name).to_string_lossy().to_string())
}

#[tauri::command]
pub fn save_temp_cookie_file(
    app: AppHandle,
    content: String,
    id: String,
) -> Result<String, String> {
    let file_name = format!("cookies_{}.txt", id);

    // Resolve AppLocalData directory
    let app_local_data = app.path().app_local_data_dir().map_err(|e| e.to_string())?;

    if !app_local_data.exists() {
        std::fs::create_dir_all(&app_local_data).map_err(|e| e.to_string())?;
    }

    let path = app_local_data.join(file_name);
    std::fs::write(&path, content).map_err(|e| e.to_string())?;

    Ok(path.to_string_lossy().to_string())
}
