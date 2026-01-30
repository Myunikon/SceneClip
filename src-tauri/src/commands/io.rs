use std::fs;
use tauri::command;

#[command]
pub fn parse_batch_file(path: String) -> Result<Vec<String>, String> {
    let content = fs::read_to_string(&path).map_err(|e| e.to_string())?;

    let urls: Vec<String> = content
        .lines()
        .map(|l| l.trim())
        .filter(|l| !l.is_empty() && !l.starts_with('#'))
        .filter(|l| l.starts_with("http://") || l.starts_with("https://")) // Basic validation
        .map(|l| l.to_string())
        .collect();

    Ok(urls)
}
