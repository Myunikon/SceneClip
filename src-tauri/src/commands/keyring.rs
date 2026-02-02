use keyring::Entry;
use tauri::command;

// PREFIX for service to avoid collision with other apps
const SERVICE_PREFIX: &str = "sceneclip:";

#[command]
pub async fn set_credential(
    service: String,
    username: String,
    password: String,
) -> Result<(), String> {
    // Basic validation
    if service.trim().is_empty() || username.trim().is_empty() || password.is_empty() {
        return Err("Service, username, and password cannot be empty".to_string());
    }

    let service_id = format!("{}{}", SERVICE_PREFIX, service.trim());
    let entry = Entry::new(&service_id, &username.trim()).map_err(|e| e.to_string())?;
    entry.set_password(&password).map_err(|e| e.to_string())?;
    Ok(())
}

#[command]
pub async fn get_credential(service: String, username: String) -> Result<String, String> {
    if service.trim().is_empty() || username.trim().is_empty() {
        return Err("Service and username cannot be empty".to_string());
    }
    let service_id = format!("{}{}", SERVICE_PREFIX, service.trim());
    let entry = Entry::new(&service_id, &username.trim()).map_err(|e| e.to_string())?;
    let password = entry.get_password().map_err(|e| e.to_string())?;
    Ok(password)
}

#[command]
pub async fn delete_credential(service: String, username: String) -> Result<(), String> {
    if service.trim().is_empty() || username.trim().is_empty() {
        return Err("Service and username cannot be empty".to_string());
    }
    let service_id = format!("{}{}", SERVICE_PREFIX, service.trim());
    let entry = Entry::new(&service_id, &username.trim()).map_err(|e| e.to_string())?;
    entry.delete_credential().map_err(|e| e.to_string())?;
    Ok(())
}
