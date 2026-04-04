use tauri::AppHandle;
use tauri_plugin_store::StoreExt;

/// The Zustand persist key used by the frontend store.
const ZUSTAND_KEY: &str = "app-storage-v5-clean";

/// Drills into the Zustand persisted JSON structure and returns the `settings` object.
///
/// The frontend uses Zustand with persist middleware, which stores state at:
/// `settings.json` → `"app-storage-v5-clean"` → `"state"` → `"settings"` → { ... }
///
/// This helper abstracts away this nesting so callers don't need to know the structure.
pub fn get_settings_value(app: &AppHandle) -> Option<serde_json::Value> {
    let store = app.store("settings.json").ok()?;
    let root = store.get(ZUSTAND_KEY)?;
    let state = root.get("state")?;
    state.get("settings").cloned()
}

/// Reads a specific key from the Zustand-persisted state (not from settings, but from state root).
///
/// Path: `"app-storage-v5-clean"` → `"state"` → `key`
pub fn get_state_value(app: &AppHandle, key: &str) -> Option<serde_json::Value> {
    let store = app.store("settings.json").ok()?;
    let root = store.get(ZUSTAND_KEY)?;
    let state = root.get("state")?;
    state.get(key).cloned()
}
