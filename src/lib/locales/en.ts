export const en = {
    nav: {
      downloads: "Downloads",
      browser: "Browser",
      settings: "Settings",
      tools: "Tools",
      terminal: "Terminal"
    },
    error_boundary: {
        title: "Something went wrong.",
        reload: "Reload App"
    },
    status: {
      missing: "Missing Components",
      downloading_bin: "Downloading Components...",
      ready: "Ready",
      repair: "Download Components",
      offline: "No Internet Connection",
      slow_connect: "Network might be slow"
    },
    task_status: {
        pending: "Pending",
        fetching_info: "Fetching Info",
        downloading: "Downloading",
        completed: "Completed",
        error: "Error",
        stopped: "Stopped",
        paused: "Paused"
    },
    header: {
      title: "ClipScene",
    },
    downloads: {
      title: "Downloads",
      subtitle: "Manage your video downloads and clips.",
      new_download: "New Download",
      open_file: "Open File",
      open_folder: "Open Folder",
      stop: "Stop",
      clear: "Clear",
      empty: "No downloads yet",
      empty_description: "Paste a link or press Ctrl+N to start.",
      plus_more: "+1000 more",
      headers: {
        title_url: "Title / URL",
        status: "Status",
        progress: "Progress",
        actions: "Actions",
        eta: "ETA",
        clip: "Clip"
      }
    },
    settings: {
        title: "Settings",
        save: "Save Configuration",
        saved: "Saved!",
        about: "About",
        tabs: {
            general: "General",
            downloads: "Downloads",
            network: "Network",
            advanced: "Advanced",
            guide: "Guide",
            about: "About"
        },
        general: {
            language_theme: "Language & Theme",
            language: "Interface Language",
            theme: "Color Theme",
            theme_dark: "Dark Mode",
            theme_light: "Light Mode",
            startup: "Startup Behavior",
            launch_startup: "Launch at Startup",
            start_minimized: "Start Minimized to Tray",
            close_action: "Close Button Action",
            minimize_tray: "Minimize to Tray",
            quit_app: "Quit App",
            low_perf_mode: "Low Performance Mode",
            low_perf_desc: "Disable all animations to save battery",
            font_size: "Font Size",
            font_small: "Small",
            font_medium: "Medium",
            font_large: "Large"
        },
        downloads: {
            behavior: "Behavior",
            quick_mode: "Quick Mode",
            quick_mode_desc: "Use last settings to download instantly without showing dialog",
            storage: "Storage",
            path: "Default Download Path",
            change: "Change",
            always_ask: "Always ask where to save",
            defaults: "Defaults",
            filename_template: "Filename Template",
            available_vars: "Available: {title}, {width}, {height}, {ext}",
            resolution: "Default Resolution",
            container: "Container",
            best: "Best Available",
            audio: "Audio Only",
            metadata_title: "Metadata & Tags",
            embed_metadata: "Embed Metadata",
            embed_thumbnail: "Embed Thumbnail",
            disable_play_button: "Disable Play Button"
        },
        network: {
            connection: "Connection",
            concurrent: "Concurrent Downloads",
            warning_ip: "Warning: Too many simultaneous downloads may result in IP bans.",
            speed_limit: "Speed Limit",
            proxy: "Proxy URL",
            user_agent: "Enable Imposter Mode (User Agent)",
            ua_desc: "Masquerade as Chrome to avoid 429 errors.",
            concurrent_fragments: "Concurrent Fragments",
            perf_tuning: "Performance Tuning:",
            perf_safe_title: "1-4 (Safe)",
            perf_safe_desc: "Best for general usage and stable downloads.",
            perf_fast_title: "5-8 (Fast)",
            perf_fast_desc: "Recommended for high-speed connections. Increases CPU usage.",
            perf_aggressive_title: "9-16 (Aggressive)",
            perf_aggressive_desc: "Maximum throughput. May cause temporary IP band (429 Too Many Requests) if abused.",
            perf_warning: "* Applies to all download modes (Full Video, Audio, & Trim).",
            placeholders: {
                speed: "e.g. 5M, 500K",
                proxy: "http://user:pass@host:port",
                ua: "Empty = Default Chrome"
            },
            turbo: "Turbo Mode",
            turbo_desc: "Use multi-threaded download engine for maximum speed."
        },
        advanced: {
            auth: "Authentication & Cookies",
            source: "Source",
            use_browser: "Use Embedded Browser Session",
            use_txt: "Load from cookies.txt",
            sponsorblock: "SponsorBlock",
            enable_sb: "Enable SponsorBlock",
            binary_paths: "Binary Paths (Override)",
            clear_cache: "Clear Cache",
            post_action: "Post-Download Action (Queue Finished)",
            post_actions: {
                none: "Do Nothing",
                sleep: "Sleep",
                shutdown: "Shutdown System"
            },
            danger_zone_proxy: "Danger Zone (Proxy)",
            danger_zone_binaries: "Danger Zone (Binaries)",
            danger_desc: "Changing these paths may break the application.",
            redownload_ffmpeg: "Re-download FFmpeg (Force)",
            redownload_help: "Use this if FFmpeg is corrupted or missing dependencies.",
            confirm_redownload: "Are you sure you want to force re-download FFmpeg?\\n\\nThis will overwrite the existing ‘ffmpeg.exe’ and might take a few minutes depending on your internet connection.",
            developer_tools: "Developer Tools",
            developer_mode: "Developer Mode",
            developer_mode_desc: "Show command details on each download task",
            data_management: "Data Management",
            export_history: "Export History",
            export_desc: "Save your download history to a JSON file",
            export_btn: "Export",
            import_history: "Import History",
            import_desc: "Restore tasks from a backup file",
            import_btn: "Import",
            reset_defaults: "Reset to Defaults",
            alerts: {
                export_success: "History exported successfully!",
                export_fail: "Failed to export history: ",
                import_success: "Successfully imported {n} tasks!",
                import_fail: "Failed to import history: ",
                invalid_backup: "Invalid backup file format",
                confirm_reset: "Are you sure you want to reset all settings to defaults?"
            },
            errors: {
                access_denied: "Access Denied",
                access_desc: "Permission refused.",
                folder_not_found: "Folder Not Found",
                folder_desc: "The directory no longer exists.",
                file_desc: "File may have been moved or deleted.",
                open_folder: "Open Folder"
            },
            video_processing: {
                title: "Video Processing",
                hw_accel: "Hardware Acceleration",
                hw_auto: "Auto (Recommended)",
                hw_gpu: "Force GPU (NVENC/AMF/QSV)",
                hw_cpu: "Force CPU (Slow but Safe)",
                hw_desc: "Controls whether to use your graphics card for video encoding. 'Auto' falls back to CPU if GPU fails."
            }
        },
        updater: {
            title: "Software Update",
            subtitle: "Manage core binaries (yt-dlp)",
            latest: "You are on the latest version.",
            error: "Version check failed.",
            checking: "Checking...",
            update_btn: "Check for Updates",
            updating: "Updating...",
            binary_versions: "Binary Versions",
            check_updates: "Check for updates from GitHub",
            current_ver: "Current",
            not_checked: "Not checked",
            unknown: "Unknown",
            update_available: "Update Available",
            up_to_date: "Up to date",
            binary_bundled: "Binaries are bundled as sidecar. Manual update required if outdated."
        },
        setup: {
            title: "Additional Setup Required",
            subtitle: "FFmpeg and yt-dlp were not found.",
            desc: "To download videos, this app needs two core components. How would you like to install them?",
            auto_btn: "Automatic Download",
            auto_badge: "Recommended",
            auto_desc: "• Downloads verified modules from official sources\n• Configures paths automatically\n• Size: ~80MB",
            manual_btn: "Manual Setup",
            manual_desc: "• I already have the files\n• Copy-paste instructions\n• Works offline",
            disclaimer: "By using the automatic download, you accept the license agreements of FFmpeg and yt-dlp."
        },
        about_page: {
            desc: "The Most Advanced YouTube Downloader & Clipper in its Class.",
            core: "Core Engines & Credits",
            yt_desc: "The powerhouse behind the scenes. yt-dlp is the global industry standard for media downloading from thousands of sites.",
            ff_desc: "The Swiss Army Knife of multimedia. Handles conversion, audio/video muxing, and precision clipping.",
            aria_desc: "Download accelerator. Enables multi-threaded connections (Turbo Mode) for maximum speed.",
            tech_stack: "Built With Modern Tech",
            react_desc: "A JavaScript library for building user interfaces. Used for the dynamic and responsive frontend.",
            tauri_desc: "Build smaller, faster, and clearer applications. Bridges the Rust backend with the web frontend.",
            lucide_desc: "Beautiful & consistent icons. Adds visual clarity and modern aesthetics to the interface.",
            sb_desc: "A crowdsourced platform to skip sponsor segments in YouTube videos automatically.",
            role_core: "Core Engine",
            role_media: "Media Processing",
            role_framework: "Framework",
            role_ui: "UI Library",
            role_icon: "Iconography",
            role_api: "skipSegments API",
            visit_website: "Visit Website",
            legal: "Legal Disclaimer",
            legal_text: "SceneClip is for personal use (archiving, education). The developer is not affiliated with YouTube/Google. All usage risks, including copyright infringement or platform ToS violations, are the user's responsibility.",
            secret_found: "Secret Found!",
            secret_desc: "You unlocked the secret developer appreciation badge!",
            secret_sub: "(No hidden settings, just good vibes!)",
            awesome: "Awesome!"
        }
    },
    dialog: {
      title: "Add Download",
      new_download: "New Download",
      customize_download: "Customize Download",
      download_all: "Download All",
      url_label: "Video URL",
      format_label: "Format",
      folder_label: "Save Folder",
      clip_label: "Clip Range",
      enhancements_label: "Enhancements",
      help: {
        format_help: "Choose 'Video' for image+sound, 'Audio' for music only, or 'GIF' for short silent animations.",
        mp4_help: "MP4 is safest for all devices/TVs. MKV is more resilient (won't corrupt if download cuts off) but not all players support it.",
        codec_help: "'H.264' is compatible with everything. 'AV1' saves data & is clearer but needs a new phone/PC. 'Auto' let us choose.",
        audio_help: "320kbps is studio quality (best). 128kbps is standard YouTube.",
        sponsor_help: "Automatically cuts out 'Don't forget to subscribe' or sponsor ads inside the video.",
        clip_help: "Use this Scissors feature if you only want to grab a funny moment (e.g., minute 01:00 to 01:30) to save data."
      },
      turbo_label: "Turbo Mode (Multi-threaded)",
      sponsor_label: "Remove Sponsors",
      cancel: "Cancel",
      download: "Download",
      remove_sponsors: "Remove Sponsors",
      remove_sponsors_desc: "Auto-skip intro, outro, & ads inside video",
      loudness_normalization: "Loudness Normalization",
      loudness_desc: "EBU R128 Standard",
      subtitles_title: "Subtitles",
      subtitles_desc: "Download & embed captions",
      subtitle_safe_mode_title: "Safe Mode Active",
      subtitle_safe_mode_desc: "Downloads will be significantly SLOWER to prevent YouTube blocking (HTTP 429). Please be patient.",
      schedule_download: "Schedule Download",
      schedule_desc: "Start task automatically at a later time",
      live_from_start: "Live from Start",
      live_from_start_desc: "Download livestream from the beginning",
      split_chapters: "Split Chapters",
      split_chapters_desc: "Separate video file per chapter",
      subtitle_settings: "Subtitle Settings",
      trim_video: "Trim Video",
      trim_audio: "Trim Audio",
      trim_desc: "Cut specific portion of the video",
      schedule_time: "Schedule Time",
      embed_subs: "Embed into video file",
      estimated_size: "Estimated Size",
      trimmed: "TRIMMED",
      pick_date: "Pick a date...",
      set_time_next: "Set Time Next",
      calendar: "Calendar",
      time: "Time",
      done: "Done",
      preview: {
        failed: "Preview Failed",
        no_data: "No data returned",
        instruction: "Enter a valid URL to see preview"
      },
      formats: {
        best: "Best Video + Audio",
        audio_mp3: "Audio (MP3)",
        audio_wav: "Audio (WAV Lossless)",
        gif: "Animated GIF"
      },
      quality_profiles: {
          highest_quality: "Highest Quality",
          standard: "Standard",
          ultra_hd: "Ultra HD",
          qhd: "QHD",
          full_hd: "Full HD",
          hd: "HD",
          data_saver: "Data Saver"
      },
      audio_extraction: {
          title: "Audio Extraction",
          desc_auto: "High-performance extraction to MP3. Bitrates detected from source video.",
          desc_manual: "High-performance extraction to MP3. Select target bitrate quality."
      },
      labels: {
          quality_profile: "Quality Profile",
          fmt: "Fmt:",
          bitrate_quality: "Bitrate Quality"
      },

      metadata_required: "Metadata required for slider",
      time_error: "Start time must be before End time",
      
      // Tab labels
      tabs: {
        video: "Video",
        audio: "Audio", 
        gif: "GIF"
      },
      
      // GIF section
      gif_maker: {
        title: "High-Quality GIF Maker",
        desc: "Create smooth, clear GIFs using palette generation. Perfect for memes and reaction clips.",
        note: "(Note: Process takes longer than standard video download)",
        trim_required: "Trim Required",
        max_duration: "Max 30s",
        trim_desc: "GIF format requires trimming. Select a short clip (max 30 seconds) for best results.",
        too_long: "Clip is too long! Max {max}s for GIF. Current: {current}s"
      },
      
      // Clip section
      clip: {
        duration: "Clip duration: {current}s",
        duration_max: "Clip duration: {current}s / {max}s max",
        to: "TO"
      },
      
      // Codec
      codec: {
        label: "Codec",
        auto_desc: "Auto Best Quality",
        h264: "H.264 plays everywhere.",
        hevc: "High Efficiency (H.265)",
        vp9: "YouTube Standard (4K)",
        av1: "AV1 saves space (Next-Gen).",
        warning_title: "Re-encoding Required",
        warning_desc: "Source does not have {codec}. Quality may degrade slightly & download will take longer."
      },
      
      // New UI Sections
      gif_options: {
        res_title: "Resolution",
        res_desc: "Smaller resolution makes GIF lighter to share.",
        fps_title: "Frame Rate",
        fps_desc: "Higher FPS means smoother motion but larger file.",
        quality_title: "Quality Mode",
        quality_high: "High Quality (Palette)",
        quality_fast: "Fast (Normal)",
        
        // Options
        res_original: "Original",
        res_social: "Social (480p)",
        res_sticker: "Sticker (320p)",
        
        fps_smooth: "Smooth (30fps)",
        fps_standard: "Standard (15fps)",
        fps_lite: "Lite (10fps)"
      },
      video_quality: {
          title: "Video Quality",
          desc: "Higher quality means larger file size."
      },
      output_format: {
          title: "Output Format",
          desc_mp4: "Universal (Best for TV/Mobile)",
          desc_mkv: "Advanced (Subs/Multi-Audio)",
          desc_webm: "Google Web Standard",
          desc_mov: "Choose based on your video editor",
          desc_default: "Select Format"
      },
      audio_options: {
          title: "Audio Format",
          desc_mp3: "Universal (Music/Podcast)",
          desc_m4a: "Efficient (Apple/Mobile)",
          desc_flac: "Lossless (Audiophile)",
          desc_wav: "Uncompressed (Editing)",
          desc: "Higher bitrate means clearer sound details.",
          upscale_title: "Upscaling Warning",
          upscale_desc: "Source is compressed (Lossy). Converting to {fmt} increases size but NOT quality.",
          reencode_title: "Re-encoding",
          reencode_desc: "Conversion to {fmt} required."
      },
      // Compression
      compress: {
        title_video: "Compress Video",
        title_audio: "Compress Audio",
        title_image: "Compress Image/GIF",
        
        preset_wa: "WhatsApp / Discord",
        preset_wa_desc: "Smallest Size",
        preset_wa_desc_audio: "Voice (64kbps)",
        
        preset_social: "Social Media",
        preset_social_desc: "Balanced Quality",
        preset_social_desc_audio: "Standard (128kbps)",
        
        preset_archive: "Archive / High",
        preset_archive_desc: "Best Quality",
        preset_archive_desc_audio: "High (320kbps)",
        
        advanced: "Advanced Settings",
        original_size: "Original Size",
        format: "Format",
        
        lbl_resolution: "Resolution Limit",
        lbl_quality: "Quality (CRF)",
        lbl_encoder: "Encoder (Hardware)",
        lbl_speed: "Encoding Speed",
        lbl_bitrate: "Audio Bitrate",
        
        btn_cancel: "Cancel",
        btn_start: "Start Compression",
        
        // File validation
        file_missing: "File Not Found",
        file_missing_desc: "The original file has been moved or deleted.",
        browse_file: "Browse...",
        file_relocated: "File path updated successfully",
        double_compression_warning: "This file appears to be already compressed. Compressing it again will significantly reduce quality."
      },
      logic_warnings: {
          mov_reencode: "Format <strong>.MOV</strong> with <strong>{codec}</strong> requires re-encoding. This may take longer."
      },

      restart: "Restart",
      filename_label: "Filename",
      filename_placeholder: "Custom filename (optional)"
    },
    updater_banner: {
        update_available: "yt-dlp update available:",
        update_now: "Update Now",
        updating: "Updating..."
    },
    monitor: {
        title: "Link Detected",
        download: "Download",
        ignore: "Ignore"
    },
    playlist: {
        title: "Playlist Detected",
        fetch: "Fetch Playlist",
        select_all: "Select All",
        deselect_all: "Deselect All",
        selected: "Selected",
        download_selected: "Download Selected",
        fetching: "Fetching playlist info...",
        error: "Failed to fetch playlist."
    },
    history: {
        title: "History",
        open_folder: "Open Folder",
        play: "Play",
        clear: "Clear History",
        empty: "No download history found.",
        delete_all: "Delete All History",
        file_details: "File Details",
        format: "Format",
        actions: "Actions",
        file_not_found: "File not found. It may have been moved or deleted.",
        search_placeholder: "Search history...",
        filter_date: "Date",
        filter_size: "Size",
        filter_source: "Source",
        sort_asc: "Oldest First",
        sort_desc: "Newest First",
        scan_files: "Scan Files"
    },
    guide: {
        title: "User Manual",
        subtitle: "Master SceneClip in minutes.",
        menu: {
            start: "Getting Started",
            clip: "Clipping & Edit",
            perf: "Performance",
            advanced: "Advanced",
            faq: "Common Errors"
        },
        steps: {
            smart: {
                title: "Smart Detection",
                desc: "No need to paste manually! Copy a link and SceneClip detects it automatically."
            },
            clip: {
                title: "Precision Clipping",
                desc: "Save data! Use the 'Scissors' icon to download only the part you need."
            },
            format: {
                title: "Format & Convert",
                desc: "Choose your flavor: 4K Video, Clear MP3 Audio, or instant GIF memes."
            },
            perf: {
                title: "Performance Mode",
                desc: "PC lagging? Enable 'Low Performance Mode' (Lightning Icon) to save CPU/GPU."
            },
            terminal: {
                title: "Terminal & Logs",
                desc: "Download failed? Check the 'Terminal' tab for raw debug logs."
            }
        },
        sections: {
            started: "Quick Start",
            single: "Paste & Download",
            single_text: "1. Copy a video URL.\n2. Click (+) or press Ctrl+N.\n3. The app auto-detects the link.\n4. Choose format and click Download.",
            clipping: "Clip & Trim",
            clipping_text: "Download only what you need.\n1. Open Add Dialog.\n2. Expand 'Clip Video'.\n3. Set Start/End times (e.g., 10 to 60 for a 50s clip).\n4. Download to get just that segment.",
            power: "Advanced Features",
            turbo: "Turbo Mode",
            turbo_text: "Multi-threaded downloading is enabled by default for maximum speed. No setup needed.",
            queue: "Queue System",
            queue_text: "Downloads are queued automatically. Default limit is 3 concurrent tasks (Adjustable in Settings > Network).",
            renaming: "Smart Renaming",
            renaming_text: "Customize filenames in Settings > Downloads.\nVariables: {title}, {uploader}, {id}, {width}, {height}.",
            troubleshoot: "Troubleshooting",
            ts_fail: "Download Failed?",
            ts_fail_text: "- Check internet.\n- Check disk space.\n- Retrying usually fixes temporary network glitches.",
            ts_restart: "Reset Settings",
            ts_restart_text: "Settings > Advanced > Reset to Defaults.",
            auth_guide: "Age-Restricted Content",
            auth_guide_text: "Use 'System Browser Session' in Settings > Advanced > Source to download age-gated videos using your browser's cookies.",
            shortcuts: "Keyboard Shortcuts",
            shortcuts_list: "- **Ctrl + N**: New Download\n- **Ctrl + ,**: Settings\n- **Ctrl + H**: History\n- **Ctrl + D**: Downloads View\n- **F11**: Toggle Fullscreen\n- **Esc**: Close Dialogs",
            shortcuts_fullscreen: "Toggle Fullscreen",
            replay_tour: "Replay Tour",
            visual_placeholder: "Visual Demo coming soon",
            sponsorblock: "SponsorBlock",
            sponsorblock_text: "Auto-skip non-content segments like benchmarks, intros, and more.",
            got_it: "Close Guide"
        }
    },
    notifications: {
        title: "Notifications",
        empty: "No notifications yet",
        clear_all: "Clear All",
        dismiss: "Dismiss"
    },
    logs: {
        download_complete: "Download Complete: {{id}}",
        download_started: "Download Started: {{id}}",
        binary_error: "Binary Check Failed"
    },
    context_menu: {
            back: "Back",
            refresh: "Refresh",
            home: "Home",
            copy: "Copy",
            paste: "Paste",
            copy_link: "Copy Link",
            screenshot: "Screenshot",
            more_soon: "More coming soon..."
        },
    statusbar: {
      idle: "Idle",
      active: "Active",
      queued: "queued",
      nvidia_gpu: "Nvidia GPU",
      amd_gpu: "AMD GPU",
      intel_gpu: "Intel GPU",
      apple_gpu: "Apple GPU",
      cpu_mode: "CPU Mode",
      auto_cpu: "Auto (CPU)",
      forced: "Forced",
      cpu_usage: "CPU Usage",
      ram_usage: "RAM",
      disk_free: "Disk Free",
      download_speed: "Download Speed",
      upload_speed: "Upload Speed",
      active_downloads: "Active Downloads",
      hw_accel: "Hardware Acceleration",
      app_version: "App Version",
      open_folder: "Open Download Folder",
      stats_unavailable: "System stats unavailable",
      storage_devices: "Storage Devices",
      available: "free"
    },
    errors: {
        system_action: "System action failed: {action}",
        listener_attach: "Failed to attach download listener",
        binary_validation: "Binary validation failed",
        update_check: "Failed to check for updates",
        binary_crash: "Critical Binary Error",
        copy_logs: "Failed to copy logs",
        copy_line: "Failed to copy line",
        path_empty: "Path is empty"
    }
}
