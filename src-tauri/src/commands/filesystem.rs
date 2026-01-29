use std::path::Path;
use tauri::{AppHandle, Manager};

#[tauri::command]
pub fn get_unique_filepath(file_path: String) -> Result<String, String> {
    let path = Path::new(&file_path);
    if !path.exists() {
        return Ok(file_path);
    }

    let file_stem = path.file_stem().and_then(|s| s.to_str()).unwrap_or("");
    let extension = path.extension().and_then(|s| s.to_str()).unwrap_or("");
    let parent = path.parent().unwrap_or(Path::new(""));

    let mut counter = 1;
    loop {
        let new_name = if extension.is_empty() {
            format!("{} ({})", file_stem, counter)
        } else {
            format!("{} ({}).{}", file_stem, counter, extension)
        };
        let new_path = parent.join(&new_name);

        if !new_path.exists() {
            return Ok(new_path.to_string_lossy().to_string());
        }
        counter += 1;
        // Safety Break
        if counter > 5000 {
            return Err("Failed to find unique path after 5000 attempts".to_string());
        }
    }
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
