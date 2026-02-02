use std::path::PathBuf;
use std::sync::Arc;
use tauri::{
    menu::{Menu, MenuItem},
    tray::TrayIconBuilder,
    Emitter, Manager,
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
            commands::system::force_exit,
            commands::system::check_gpu_support,
            commands::system::set_window_effects,
            commands::system::validate_binary,
            commands::system::open_log_dir,
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
            commands::download::cancel_download,
            commands::download::get_video_metadata,
            commands::filesystem::get_unique_filepath,
            commands::filesystem::save_temp_cookie_file,
            commands::ffmpeg::compress_media,
            commands::ffmpeg::split_media_chapters,
            commands::settings::validate_path,
            commands::settings::validate_url,
            commands::settings::is_youtube_url,
            commands::queue::add_to_queue,
            commands::queue::remove_from_queue,
            commands::queue::pause_queue,
            commands::queue::resume_queue,
            commands::queue::pause_task,
            commands::queue::resume_task,
            commands::queue::get_queue_state,
            commands::queue::verify_file_sizes,
            commands::updater::check_updates,
            commands::updater::update_binary,
            commands::updater::cancel_update,
            commands::updater::get_binary_version_local,
            commands::updater::debug_binary_paths,
            commands::updater::install_app_update,
            commands::integrity::verify_binary_integrity,
            commands::notifications::notify_background,
            commands::metadata::parse_video_metadata,
            commands::analysis::estimate_export_size,
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
                log::info!("Attempting to load settings for window configuration...");
                
                let start_minimized = match app.store("settings.json") {
                    Ok(store) => {
                        log::info!("Settings store loaded successfully.");
                        store.get("startMinimized")
                            .and_then(|v| v.as_bool())
                            .unwrap_or(false)
                    },
                    Err(e) => {
                        log::error!("CRITICAL: Failed to load settings store at startup: {}. Continuing with defaults.", e);
                        false
                    }
                };

                if start_minimized {
                    log::info!("Settings indicate 'startMinimized' is TRUE. Hiding main window.");
                    // Hide immediately (we assume window is created visible: false in tauri.conf.json is better,
                    // but if it's visible by default, this hides it quickly)
                    let _ = window.hide();
                } else {
                    log::info!("Settings indicate 'startMinimized' is FALSE. Showing main window.");
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

            // --- SUPPORTED SITES INIT ---
            let sites = crate::ytdlp::SupportedSites::new();

            // Try various paths to find supportedsites.md
            let paths = vec![
                app.path()
                    .resource_dir()
                    .map(|p| p.join("supportedsites.md"))
                    .ok(),
                Some(PathBuf::from("..").join("supportedsites.md")), // Dev root
                Some(PathBuf::from("supportedsites.md")),            // Current dir
            ];

            for path in paths.into_iter().flatten() {
                if path.exists() {
                    log::info!("Loading supported sites from: {:?}", path);
                    let _ = sites.load_from_file(path);
                    break;
                }
            }

            let sites_arc = Arc::new(sites);
            app.manage(sites_arc.clone());

            // --- DYNAMIC EXTRACTOR LOADING (Background) ---
            // This ensures 100% parity with yt-dlp's supported sites list (1800+)
            let sites_bg = sites_arc.clone();
            let app_handle_bg = app.handle().clone();
            
            tauri::async_runtime::spawn(async move {
                // Wait a bit for startup to settle
                tokio::time::sleep(std::time::Duration::from_secs(2)).await;

                // Resolve yt-dlp path using existing settings logic
                let settings = crate::ytdlp::load_settings(&app_handle_bg);
                let binary_path = crate::ytdlp::resolve_ytdlp_path(&app_handle_bg, &settings.binary_path_yt_dlp);

                // Run the heavy lifting
                if let Err(e) = sites_bg.load_from_ytdlp(&binary_path) {
                    log::warn!("Dynamic yt-dlp extractor loading failed: {}", e);
                }
            });

            // --- CLIPBOARD LISTENER (Background) ---
            let app_handle_cb = app.handle().clone();
            let sites_cb = sites_arc.clone();
            tauri::async_runtime::spawn(async move {
                let mut last_clipboard = String::new();
                loop {
                    tokio::time::sleep(std::time::Duration::from_millis(1500)).await;

                    use tauri_plugin_clipboard_manager::ClipboardExt;
                    if let Ok(content) = app_handle_cb.clipboard().read_text() {
                        let text = content.trim();
                        if !text.is_empty() && text != last_clipboard {
                            last_clipboard = text.to_string();

                            // 1. Sanitize (Remove si, pp, etc)
                            let sanitized = crate::ytdlp::sanitize_url(text);

                            // 2. Validate (Check against supported sites whitelist)
                            if sanitized.starts_with("http") && sites_cb.matches(&sanitized) {
                                log::info!("Clipboard link detected & sanitized: {}", sanitized);
                                let _ = app_handle_cb.emit("link-detected", sanitized);
                            }
                        }
                    }
                }
            });

            #[cfg(target_os = "windows")]
            let _ = ensure_windows_shortcut(app);

            // Cleanup local binaries to force use of bundled ones (except yt-dlp)
            let _ = cleanup_local_binaries(app);
            // Cleanup updater temp files (portable update leftovers)
            let _ = cleanup_updater_temp_files(app);

            Ok(())
        })
        // --- 2. CLOSE TO TRAY LOGIC ---
        .on_window_event(|window, event| {
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let app = window.app_handle();

                // 1. Check for Active Downloads (Exit Guard)
                let queue_state = app.state::<std::sync::Arc<crate::download_queue::QueueState>>();
                let has_active_downloads = {
                    let tasks = queue_state.tasks.lock().unwrap();
                    tasks.values().any(|t| {
                        matches!(
                            t.status,
                            crate::download_queue::TaskStatus::Downloading
                                | crate::download_queue::TaskStatus::FetchingInfo
                                | crate::download_queue::TaskStatus::Processing
                                | crate::download_queue::TaskStatus::Queued
                        )
                    })
                };

                if has_active_downloads {
                    log::info!("Close requested but downloads are active. Triggering Exit Guard.");
                    api.prevent_close();
                    if let Err(e) = window.emit("request-close-confirmation", ()) {
                        log::error!("Failed to emit exit confirmation event: {}", e);
                    }
                    let _ = window.set_focus();
                    return;
                }

                // 2. Normal Close Logic (Check Settings)
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

fn cleanup_local_binaries(app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    let app_local_data = app.path().app_local_data_dir()?;
    if !app_local_data.exists() {
        return Ok(());
    }

    for binary in ["ffmpeg", "aria2c", "rsgain", "deno", "ffprobe"] {
        #[cfg(target_os = "windows")]
        let filename = format!("{}.exe", binary);
        #[cfg(not(target_os = "windows"))]
        let filename = binary;

        let path = app_local_data.join(filename);
        if path.exists() {
            log::info!(
                "Removing local binary override to enforce bundled version: {:?}",
                path
            );
            if let Err(e) = std::fs::remove_file(&path) {
                log::warn!(
                    "Could not remove local binary {:?}: {}. It may be in use.",
                    path,
                    e
                );
            }
        }
    }
    Ok(())
}

fn cleanup_updater_temp_files(_app: &tauri::App) -> Result<(), Box<dyn std::error::Error>> {
    #[cfg(target_os = "windows")]
    {
        if let Ok(current_exe) = std::env::current_exe() {
            let old_exe = current_exe.with_extension("old");
            // Also check for other patterns if needed, but .old is what we use.
            if old_exe.exists() {
                log::info!("Cleaning up old update file: {:?}", old_exe);
                // Best effort removal
                let _ = std::fs::remove_file(old_exe);
            }
        }
    }
    Ok(())
}
