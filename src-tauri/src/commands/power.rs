use keepawake::{Builder, KeepAwake};
use lazy_static::lazy_static;
use std::sync::Mutex;

lazy_static! {
    static ref KEEPER: Mutex<Option<KeepAwake>> = Mutex::new(None);
}

#[tauri::command]
pub fn prevent_suspend(prevent: bool) -> Result<(), String> {
    set_inhibit(prevent)
}

/// Internal function to set sleep inhibition state.
/// Can be called from other Rust modules.
pub fn set_inhibit(prevent: bool) -> Result<(), String> {
    let mut keeper = KEEPER.lock().map_err(|e| e.to_string())?;

    if prevent {
        if keeper.is_none() {
            log::info!("[Power] Inhibiting system sleep/suspend");
            let k = Builder::default()
                .display(true)
                .idle(true)
                .sleep(true)
                .create()
                .map_err(|e| e.to_string())?;
            *keeper = Some(k);
        }
    } else if keeper.is_some() {
        log::info!("[Power] Releasing sleep/suspend inhibition");
        *keeper = None;
    }
    Ok(())
}

#[tauri::command]
pub fn is_suspend_inhibited() -> bool {
    let keeper = KEEPER.lock().unwrap_or_else(|e| e.into_inner());
    keeper.is_some()
}
