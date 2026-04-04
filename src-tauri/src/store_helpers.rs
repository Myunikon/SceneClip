use serde_json::Value;
use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

/// Reads the nested Zustand `settings` object from the JSON storage.
pub fn get_settings_value(app: &AppHandle) -> Option<Value> {
    if let Ok(store) = app.store("settings.json") {
        if let Some(store_val) = store.get("app-storage-v5-clean") {
            if let Some(json_str) = store_val.as_str() {
                if let Ok(parsed) = serde_json::from_str::<Value>(json_str) {
                    if let Some(state) = parsed.get("state") {
                        if let Some(settings) = state.get("settings") {
                            return Some(settings.clone());
                        }
                    }
                }
            } else if store_val.is_object() {
                if let Some(state) = store_val.get("state") {
                    if let Some(settings) = state.get("settings") {
                        return Some(settings.clone());
                    }
                }
            }
        }
    }
    None
}

/// Reads a specific top-level slice from the nested Zustand state (e.g. `gpuType`).
pub fn get_state_value(app: &AppHandle, key: &str) -> Option<Value> {
    if let Ok(store) = app.store("settings.json") {
        if let Some(store_val) = store.get("app-storage-v5-clean") {
            if let Some(json_str) = store_val.as_str() {
                if let Ok(parsed) = serde_json::from_str::<Value>(json_str) {
                    if let Some(state) = parsed.get("state") {
                        if let Some(val) = state.get(key) {
                            return Some(val.clone());
                        }
                    }
                }
            } else if store_val.is_object() {
                if let Some(state) = store_val.get("state") {
                    if let Some(val) = state.get(key) {
                        return Some(val.clone());
                    }
                }
            }
        }
    }
    None
}

/// Updates a specific key inside the Zustand `settings` object and persists.
pub fn set_settings_value(app: &AppHandle, key: &str, value: Value) -> Result<(), String> {
    if let Ok(store) = app.store("settings.json") {
        if let Some(store_val) = store.get("app-storage-v5-clean") {
            let mut parsed: Value = if let Some(json_str) = store_val.as_str() {
                serde_json::from_str(json_str).unwrap_or(serde_json::json!({
                    "state": { "settings": {} },
                    "version": 8
                }))
            } else if store_val.is_object() {
                store_val.clone()
            } else {
                return Err("Invalid store format".to_string());
            };

            if let Some(state) = parsed.get_mut("state") {
                if let Some(settings) = state.get_mut("settings") {
                    if let Some(obj) = settings.as_object_mut() {
                        obj.insert(key.to_string(), value);
                        
                        let new_val = if store_val.is_string() {
                            serde_json::json!(serde_json::to_string(&parsed).unwrap())
                        } else {
                            parsed
                        };
                        
                        let _ = store.set("app-storage-v5-clean", new_val);
                        let _ = store.save();
                        return Ok(());
                    }
                }
            }
        }
    }
    Err("Failed to set nested settings value".to_string())
}
