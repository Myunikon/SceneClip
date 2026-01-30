use tauri_plugin_notification::NotificationExt;

#[derive(serde::Deserialize)]
pub struct NotificationOptions {
    pub icon: Option<String>,
    pub sound: Option<String>,
}

#[tauri::command]
pub fn notify_background(
    app: tauri::AppHandle,
    title: String,
    body: String,
    options: Option<NotificationOptions>,
) -> Result<(), String> {
    let mut builder = app.notification().builder().title(title).body(body);

    if let Some(opts) = options {
        if let Some(icon) = opts.icon {
            builder = builder.icon(icon);
        }
        if let Some(sound) = opts.sound {
            builder = builder.sound(sound);
        }
    }

    builder.show().map_err(|e| e.to_string())?;

    Ok(())
}
