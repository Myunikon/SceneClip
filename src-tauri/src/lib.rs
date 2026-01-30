use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Manager,
};

mod commands;
mod download_queue;
mod server;
mod ytdlp; // Added

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(
            tauri_plugin_log::Builder::default()
                .targets([
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Stdout),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::LogDir {
                        file_name: Some("sceneclip".to_string()),
                    }),
                    tauri_plugin_log::Target::new(tauri_plugin_log::TargetKind::Webview),
                ])
                .rotation_strategy(tauri_plugin_log::RotationStrategy::KeepAll)
                .timezone_strategy(tauri_plugin_log::TimezoneStrategy::UseLocal)
                .build(),
        )
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            Some(vec![]),
        ))
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_os::init())
        .plugin(tauri_plugin_single_instance::init(|app, argv, _cwd| {
            log::info!("{}, {argv:?}, {_cwd}", app.package_info().name);
            let _ = app
                .get_webview_window("main")
                .expect("no main window")
                .set_focus();
        }))
        .plugin(tauri_plugin_deep_link::init())
        .invoke_handler(tauri::generate_handler![
            commands::system::perform_system_action,
            commands::system::check_gpu_support,
            commands::system::set_window_effects,
            commands::system::validate_binary,
            commands::system::open_log_dir,
            commands::process::suspend_process,
            commands::process::suspend_process,
            commands::process::resume_process,
            commands::process::kill_process_tree,
            commands::power::prevent_suspend,
            commands::power::is_suspend_inhibited,
            commands::stats::get_system_stats,
            commands::keyring::set_credential,
            commands::keyring::get_credential,
            commands::keyring::delete_credential,
            commands::download::download_with_channel,
            commands::download::get_download_args,
            commands::download::get_download_args,
            commands::download::cancel_download,
            commands::download::get_video_metadata,
            commands::filesystem::get_unique_filepath,
            commands::filesystem::save_temp_cookie_file,
            commands::ffmpeg::compress_media,
            commands::ffmpeg::split_media_chapters,
            commands::settings::validate_path,
            commands::settings::validate_url,
            commands::settings::is_youtube_url,
            commands::settings::validate_url,
            commands::settings::is_youtube_url,
            commands::queue::add_to_queue,
            commands::queue::remove_from_queue,
            commands::queue::pause_queue,
            commands::queue::resume_queue,
            commands::queue::pause_task,
            commands::queue::resume_task,
            commands::queue::get_queue_state,
            commands::updater::check_updates,
            commands::updater::update_binary,
            commands::notifications::notify_background,
            commands::io::parse_batch_file,
        ])
        .setup(|app| {
            let quit_i = MenuItem::with_id(app, "quit", "Quit", true, None::<&str>)?;
            let show_i = MenuItem::with_id(app, "show", "Show ClipScene", true, None::<&str>)?;
            let menu = Menu::with_items(app, &[&show_i, &quit_i])?;

            let tray_builder = TrayIconBuilder::with_id("tray")
                .menu(&menu)
                .show_menu_on_left_click(true)
                .on_menu_event(|app, event| match event.id.as_ref() {
                    "quit" => {
                        app.exit(0);
                    }
                    "show" => {
                        if let Some(window) = app.get_webview_window("main") {
                            let _ = window.show();
                            let _ = window.set_focus();
                        }
                    }
                    _ => {}
                });

            // Safely handle icon loading
            let _tray = if let Some(icon) = app.default_window_icon() {
                tray_builder.icon(icon.clone()).build(app)?
            } else {
                tray_builder.build(app)?
            };

            // DEEP LINK REGISTRATION
            #[cfg(any(windows, target_os = "linux"))]
            {
                use tauri_plugin_deep_link::DeepLinkExt;
                app.deep_link().register("clipscene")?;
            }

            // WINDOW VIBRANCY
            #[cfg(target_os = "windows")]
            use window_vibrancy::apply_blur;
            #[cfg(target_os = "macos")]
            use window_vibrancy::{apply_vibrancy, NSVisualEffectMaterial};

            if let Some(window) = app.get_webview_window("main") {
                #[cfg(target_os = "macos")]
                let _ = apply_vibrancy(&window, NSVisualEffectMaterial::HudWindow, None, None);

                #[cfg(target_os = "windows")]
                let _ = apply_blur(&window, Some((0, 0, 0, 0)));

                // --- 1. START MINIMIZED LOGIC ---
                use tauri_plugin_store::StoreExt;
                let store = app.store("settings.json")?; // Use ? to propagate error if store fails

                // Check 'startMinimized' (default false)
                let start_minimized = store
                    .get("startMinimized")
                    .and_then(|v| v.as_bool())
                    .unwrap_or(false);

                if start_minimized {
                    // Hide immediately (we assume window is created visible: false in tauri.conf.json is better,
                    // but if it's visible by default, this hides it quickly)
                    let _ = window.hide();
                } else {
                    let _ = window.show();
                    let _ = window.set_focus();
                }
            }

            let mut sys = sysinfo::System::new_with_specifics(
                sysinfo::RefreshKind::nothing()
                    .with_cpu(sysinfo::CpuRefreshKind::everything())
                    .with_memory(sysinfo::MemoryRefreshKind::everything()),
            );
            sys.refresh_cpu_usage();

            app.manage(std::sync::Mutex::new(sys));

            // Queue System Init
            let queue_state = std::sync::Arc::new(crate::download_queue::QueueState::new(Some(
                app.handle().clone(),
            )));
            app.manage(queue_state.clone());

            // Spawn Background Queue Processor
            let handle = app.handle().clone();
            tauri::async_runtime::spawn(async move {
                crate::download_queue::start_queue_processor(handle, queue_state).await;
            });

            server::init(app.handle().clone());

            #[cfg(target_os = "windows")]
            let _ = ensure_windows_shortcut(app);

            Ok(())
        })
        // --- 2. CLOSE TO TRAY LOGIC ---
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                // We need to check settings to see if we should Minimize to Tray or full Quit
                let app = window.app_handle();
                use tauri_plugin_store::StoreExt;

                // We attempt to load store differently depending on context
                // but app_handle has access to it.
                if let Ok(store) = app.store("settings.json") {
                    // Check 'closeAction' (default 'quit' or 'minimize')
                    let close_action = store
                        .get("closeAction")
                        .and_then(|v| v.as_str().map(|s| s.to_string()))
                        .unwrap_or_else(|| "quit".to_string()); // Default to quit if not set

                    if close_action == "minimize" {
                        // Prevent the close = Keep App Running
                        api.prevent_close();
                        let _ = window.hide();
                    }
                    // If "quit", we do nothing and let default close happen (which closes window -> app exit if simple)
                    // Note: on Mac, closing last window usually keeps app running, but on Win/Lin it quits.
                    // This behavior is standard.
                }
            }
        })
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

#[cfg(target_os = "windows")]
fn ensure_windows_shortcut(_app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    use std::os::windows::process::CommandExt;

    let app_name = "SceneClip";

    let exe_path = std::env::current_exe()?;
    let roaming_appdata = std::env::var("APPDATA")?;
    let shortcut_path = std::path::Path::new(&roaming_appdata)
        .join("Microsoft\\Windows\\Start Menu\\Programs")
        .join(format!("{}.lnk", app_name));

    if !shortcut_path.exists() {
        log::info!(
            "Creating Start Menu shortcut for portable support: {:?}",
            shortcut_path
        );

        let ps_script = format!(
            "$s=(New-Object -ComObject WScript.Shell).CreateShortcut('{shortcut}');$s.TargetPath='{target}';$s.Save()",
            shortcut = shortcut_path.to_string_lossy(),
            target = exe_path.to_string_lossy()
        );

        let mut cmd = std::process::Command::new("powershell");
        cmd.args(["-NoProfile", "-Command", &ps_script]);

        // Hide terminal window
        cmd.creation_flags(0x08000000); // CREATE_NO_WINDOW

        cmd.output()?;
        log::info!("Shortcut created successfully.");
    }

    Ok(())
}
