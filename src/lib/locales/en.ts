export const en = {
    nav: {
        downloads: "Downloads",
        browser: "Browser",
        settings: "Settings",
        tools: "Tools",
        terminal: "Terminal",
        keyring: "Keyring"
    },
    common: {
        copy_error: "Copy failed",
        pause: "Pause",
        resume: "Resume",
        cancel: "Cancel",
        logs: "Logs",
        remove: "Remove",
        delete: "Delete",
        retry: "Retry",
        unknown: "Unknown"
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
        storage: "Storage & Layout",
        path_select_label: "Save to",
        change_folder: "Choose Folder...",
        always_ask: "Always ask for download location",
        defaults: "Naming & Format",
        filename_template: "Filename Format",
        insert_token: "Insert Variable...",
        tokens: {
            title: "Video Title",
            uploader: "Uploader Name",
            id: "Video ID",
            res: "Resolution",
            source: "Source Name",
            site: "Source",
            author: "Uploader",
            date: "Upload Date"
        },
        example_note: "* Preview based on sample video",

        empty: "No downloads yet",
        empty_description: "Copy a link and press Ctrl+N to start.",
        plus_more: "+1000 more",
        headers: {
            title_url: "Title / URL",
            status: "Status",
            progress: "Progress",
            actions: "Actions",
            eta: "ETA",
            clip: "Clip"
        },
        fetching_info: "Fetching Info",
        pause_download: "Pause",
        resume_download: "Resume",
        stop: "Stop",
        restart: "Restart",
        open_file: "Open File",
        open_folder: "Open Folder",
        clear: "Clear",
        pause_clip_tooltip: "Pause clipped download (Resets to 0%)",
        cancel_confirm_title: "Cancel Download?",
        cancel_confirm_desc: "This will stop the download and you may need to restart from the beginning.",
        confirm: "Yes, Cancel",
        keep_downloading: "Keep Downloading",
        clip_pause_title: "Pause Clipped Download?",
        clip_pause_desc: "This is a CLIPPED download. Due to technical limitations, resuming will RESTART from 0%.",
        clip_pause_confirm: "Pause Anyway"
    },
    settings: {
        title: "Settings",
        save: "Save Configuration",
        saved: "Saved!",
        about: "About",
        tabs: {
            general: "General",
            downloads: "Storage",
            quality: "Quality",
            network: "Network",
            media: "Media",
            system: "System",
            advanced: "System",
            logs: "Logs",
            guide: "Guide",
            security: "Security",
            about: "About"
        },
        general: {
            language_theme: "Language & Theme",
            language: "Interface Language",
            theme: "Color Theme",
            theme_dark: "Dark Mode",
            theme_light: "Light Mode",
            theme_system: "System Default",
            startup: "Startup Behavior",
            launch_startup: "Launch at Startup",
            launch_startup_desc: "Automatically launch on system login",
            start_minimized: "Start Minimized to Tray",
            start_minimized_desc: "Start app in background (System Tray)",
            close_action: "Close Button Action",
            minimize_tray: "Minimize to Tray",
            quit_app: "Quit App",
            font_size: "Font Size",
            font_small: "Small",
            font_medium: "Medium",
            font_large: "Large",
            system_behavior: "Window & System",
            minimize_desc: "App keeps running in background",
            quit_desc: "App terminates completely",
            desktop_notifications: "Desktop Notifications",
            desktop_notifications_desc: "Show system notifications when app is in background",
            prevent_suspend: "Prevent Sleep",
            prevent_suspend_desc: "Keep system awake during downloads",
            post_processing: "Post-Processing"
        },
        downloads: {
            storage: "Storage & Path",
            path: "Download Folder",
            change: "Change",
            always_ask: "Always ask where to save",
            filename_template: "Auto-Rename Rule (Template)",
            available_vars: "Variables: {title}, {res}, {source}, {date}",
            resolution: "Default Resolution",
            container: "Default Format (Container)",
            best: "Best Available",
            audio: "Audio Only",
            defaults: "Defaults & Template",
            example_note: "* Example based on a sample video"
        },
        quality: {
            video: "Video Content",
            resolution: "Resolution Limit",
            container: "Container",
            audio: "Audio Processing",
            metadata: "Metadata & Tags",
            embed_metadata: "Embed Metadata",
            embed_metadata_desc: "Write metadata tags to the video file",
            embed_thumbnail: "Embed Thumbnail",
            embed_thumbnail_desc: "Set video thumbnail from source",
            embed_chapters: "Embed Chapters",
            embed_chapters_desc: "Add chapter markers to the video file",
            audio_normalization: "Loudness Normalization",
            sponsorblock: "SponsorBlock (Auto-Skip)",
            enable_sb: "Enable SponsorBlock",
            disable_play_button: "Hide Play Button in History",
            sponsorblock_desc: "Auto-skip ads, intros, and other segments",
            skip_segments: "Segments to Skip",
            audio_normalization_desc: "EBU R128 Standard (-14 LUFS)",
            metadata_warning_title: "Note:",
            metadata_warning_desc: "These options are automatically disabled when using <1>Trim/Clip</1> to prevent incorrect video duration issues (e.g. 10s clip showing as 1hr).",
            privacy_scrubbing: "Privacy Scrubbing",
            privacy_scrubbing_desc: "Remove source URL, description, and comments from downloaded files.",
            presets: {
                title: "Post-Processing Presets",
                desc: "Manage custom FFmpeg argument presets",
                empty: "No presets defined",
                add_new: "Add New Preset",
                name_label: "Name",
                type_label: "Type",
                args_label: "FFmpeg Arguments",
                desc_label: "Description (Optional)",
                placeholder_name: "My Custom Preset",
                placeholder_args: "-c:v libx265 -crf 28",
                placeholder_desc: "High efficiency HEVC encoding...",
                save_btn: "Save Preset",
                delete_tooltip: "Delete Preset",
                add_tooltip: "Add Preset",
                types: {
                    video: "Video",
                    audio: "Audio",
                    metadata: "Metadata",
                    general: "General"
                }
            }
        },
        filename_preview: {
            label: "Preview",
            example_title: "My Awesome Video",
            example_uploader: "CoolCreator",
            reset: "Reset"
        },
        network: {
            connection: "Speed & Connection",
            concurrent: "Max Simultaneous Downloads (Queue)",
            warning_ip: "Warning: Too many downloads may trigger IP protection.",
            speed_limit: "Global Speed Limit",
            proxy: "Proxy Configuration",
            concurrent_fragments: "Download Segments (Split)",
            performance: "Performance Mode",
            perf_tuning: "Download Engine Power:",
            perf_safe_title: "1-4 (Safe)",
            perf_safe_desc: "Best for general usage and stable downloads.",
            perf_fast_title: "5-8 (Fast)",
            perf_fast_desc: "Recommended for high-speed connections. Increases CPU usage.",
            perf_aggressive_title: "9-16 (Aggressive)",
            perf_aggressive_desc: "Maximum throughput. May cause temporary IP band (429 Too Many Requests) if abused.",
            perf_warning: "* Applies to all download modes (Full Video, Audio, & Trim).",
            user_agent: "User Agent",

            // Aria2c
            aria2c_section: "Downloader Engine",
            aria2c_title: "Use Aria2c (External Downloader)",
            aria2c_desc: "Multi-connection downloader (16x). Faster than standard.",
            aria2c_active: "Aria2c is active. Native 'Concurrent Fragments' settings are disabled to prevent conflicts.",

            // New Network Keys
            manual_config: "Manual configuration mode.",
            chunks_label: "{{n}} chunks",
            perf_profile: "Performance Profile",
            custom: "Custom",

            placeholders: {
                speed: "e.g. 5M, 500K",
                proxy: "http://user:pass@host:port",
                ua: "Empty = Default Chrome"
            },
            turbo: "Turbo Mode",
            turbo_desc: "Use multi-threaded download engine for maximum speed."
        },
        advanced: {
            auth: "Browser Authentication",
            source: "Source Choice",
            use_browser: "Use System Browser Session (Cookies)",
            use_txt: "Load from cookies.txt (Manual)",
            binary_paths: "Integration Paths",
            clear_cache: "Clear Cache",
            post_action: "Post-Download Action (Queue Finished)",
            post_actions: {
                none: "Do Nothing",
                sleep: "Sleep",
                shutdown: "Shutdown System"
            },
            post_download_action_desc: "Choose what happens after all downloads finish.",
            shutdown_warning: "Your computer will force shutdown after downloads. Unsaved work may be lost!",
            content_enhancements: {
                title: "Content Enhancements",
                srt_fixer: "SRT Fixer",
                srt_fixer_desc: "Fix duplicate lines and overlapping timings in YouTube auto-generated subtitles.",
                smart_proxy: "Smart Proxy Rotator",
                smart_proxy_desc: "Automatically rotate proxies to bypass HTTP 429 (Too Many Requests).",
                metadata_enhancer: "Metadata Enhancer",
                metadata_enhancer_desc: "Embed extra metadata like dislikes, chapters, and rich info json into file.",
                replaygain: "Audio ReplayGain",
                replaygain_desc: "Normalize audio volume levels using ReplayGain tags.",
                po_token: "PO Token Security",
                po_token_desc: "Bypass YouTube bot detection using Proof of Origin tokens.",
                cookie_unlock: "Cookie Database Unlock",
                cookie_unlock_desc: "Allow access to locked browser cookie databases (Windows).",
                po_token_label: "PO TOKEN",
                po_token_placeholder: "Manually enter token (optional)...",
                visitor_data_label: "VISITOR DATA",
                visitor_data_placeholder: "Manually enter visitor data (optional)...",
                token_info: "Leave empty to use automatic plugins if available."
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


            alerts: {
                export_success: "History exported successfully!",
                export_fail: "Failed to export history: ",
                import_success: "Successfully imported {{n}} tasks!",
                import_fail: "Failed to import history: ",
                invalid_backup: "Invalid backup file format",
                confirm_reset: "Are you sure you want to reset all settings to defaults?",
                reset_success_title: "App Reset Successfully",
                reset_success_desc: "All settings have been restored to defaults.",
                reset_confirm_desc: "This will clear all your preferences, download history, and saved paths. The app will be restored to its fresh install state. This action cannot be undone.",
                reset_confirm_btn: "Yes, Reset Everything"
            },

            // New Advanced Keys
            source_disabled: "Disabled (Default)",
            browser_type: "Browser Type",
            no_file: "No file selected...",
            clear_path: "Clear Path",
            cookie_path: "Cookies Path (.txt)",
            browse_btn: "Browse",
            auto_managed: "Auto-managed (Bundled)",
            tech_paths: "Technical & Binary Paths",
            js_runtime: "JS Runtime Path (Node/Deno)",
            js_runtime_desc: "Required for YouTube high-quality & stability. Auto-detected if empty.",
            detected_gpu: "Detected GPU:",
            unknown_integrated: "Unknown / Integrated",
            btn_replay_welcome: "Replay Welcome",
            btn_reset_data: "Reset All Data & Settings",
            btn_export_history: "Export History (.json)",
            btn_import_history: "Import History (.json)",
            errors: {
                open: "Open Folder"
            },
            validation: {
                checking: "Checking...",
                valid: "Binary Valid",
                invalid: "Binary Invalid",
                success_desc: "Found version: {{version}}",
                error_desc: "Verification failed. Ensure the file is an executable binary."
            },
            video_processing: {
                title: "Video Processing",
                hw_accel: "Hardware Acceleration",
                hw_auto: "Auto (Recommended)",
                hw_gpu: "Force GPU (NVENC/AMF/QSV)",
                hw_cpu: "Force CPU (Slow but Safe)",
                hw_desc: "Controls whether to use your graphics card for video encoding. 'Auto' falls back to CPU if GPU fails."
            },
            history_retention: "History Retention",
            history_retention_desc: "Automatically remove completed tasks from history after a period.",
            retention_days: "Delete after {{count}} Days",
            retention_forever: "Forever (Keep All)",
            retention_zero: "Don't Save History",
            history_max_items: "Max History Items",
            history_item_count: "{{count}} Items"
        },
        security: {
            keyring_title: "Secure Keyring",
            keyring_desc: "Manage saved passwords for premium sites",
            saved_passwords: "Saved Passwords",
            add_new: "Add New",
            add_first: "Add First Account",
            no_passwords: "No Passwords Saved",
            no_passwords_desc: "Add your premium account credentials to enable downloading from requires-login sites.",
            edit_credential: "Edit Credential",
            new_credential: "New Credential",
            service_domain: "Service Domain",
            service_placeholder: "e.g. crunchyroll.com",
            username: "Username",
            username_placeholder: "user@example.com",
            password: "Password",
            password_placeholder: "Enter secure password",
            save_btn: "Save Credential",
            saving_btn: "Saving...",
            confirm_delete: "Are you sure you want to remove credentials for {{service}}?",
            copy_success: "Username copied",
            save_success: "Saved credentials for {{service}}",
            save_error: "Failed to save credential: {{error}}",
            delete_success: "Removed credentials for {{service}}",
            delete_error: "Failed to delete: {{error}}",
            missing_vault: "Password missing from Vault. Please set a new one.",
            auth_failed: "Authentication failed: {{error}}",
            delete_title: "Delete",
            delete_warning_detail: "This password will be permanently deleted from {{storage}}. This action cannot be undone.",
            delete_confirm_desc: "Are you sure you want to delete the saved password for <1>{{service}}</1>?",
            delete_warning: "This will remove it from the <1>{{storage}}</1> permanently.",
            cancel: "Cancel",
            delete: "Delete",
            secure_storage_hint: "Securely stored in {{storage}}"
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
            check_updates: "Check for updates",
            current_ver: "Current",
            not_checked: "Not checked",
            unknown: "Unknown",
            update_available: "Update Available",
            up_to_date: "Up to date",
            binary_bundled: "Binaries are bundled as sidecar. Manual update required if outdated.",
            latest_prefix: "Latest: ",
            update_now: "Update Now"
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
            core: "Credits",
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
            role_state: "State Management",
            role_routing: "Routing",
            role_i18n: "Internationalization",
            role_lang: "Language",
            role_icon: "Iconography",
            role_api: "skipSegments API",
            visit_website: "Visit Website",
            legal: "Legal Disclaimer",
            made_with: "Made with <0>❤️</0> by <1>Myunikon</1>",
            legal_text: "SceneClip is for personal use (archiving, education). The developer is not affiliated with YouTube/Google. All usage risks, including copyright infringement or platform ToS violations, are the user's responsibility.",
            secret_found: "Secret Found!",
            secret_desc: "You unlocked the secret developer appreciation badge!",
            secret_sub: "(No hidden settings, just good vibes!)",
            awesome: "Awesome!"
        },



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
        sponsor_clip_conflict: "Unavailable while trimming",
        video_codec: "Video Codec",
        codec_desc: "AV1 is best, H264 is most compatible",
        proxy: "Network Proxy",
        proxy_desc: "Use specific proxy for this download",
        post_processing: "Post-Processing",
        post_proc_desc: "Apply FFmpeg presets",
        post_proc_active: "Custom FFmpeg args active",
        select_preset: "Select Preset",
        custom_preset: "Custom / Manual",
        custom_args_label: "Enter custom FFmpeg arguments",
        custom_args_empty: "Custom arguments cleared",
        format_original: "Original",
        not_available: "Not available",
        inside_video: "Inside video file",
        subtitle_settings: "Subtitle Settings",
        trim_video: "Trim Video",
        trim_audio: "Trim Audio",
        trim_desc: "Cut specific portion of the video",
        schedule_time: "Schedule Time",
        embed_subs: "Embed into video file",
        clip_pause_title: "Pause Clipped Download?",
        clip_pause_desc: "This is a CLIPPED download. Due to technical limitations, resuming will RESTART from 0%.",
        clip_pause_confirm: "Pause Anyway",
        cancel_confirm_title: "Cancel Download?",
        cancel_confirm_desc: "This will stop the download and you may need to restart from the beginning.",
        confirm: "Yes, Cancel",
        keep_downloading: "Keep Downloading",
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
            no_thumbnail: "No thumbnail available",
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
            too_long: "Clip is too long! Max {{max}}s for GIF. Current: {{current}}s",
        },

        // Clip section
        clip: {
            duration: "Clip duration: {{current}}s",
            duration_max: "Clip duration: {{current}}s / Max {{max}}s",
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
            warning_desc: "The source file does not contain {{codec}}. Quality may be slightly reduced, and download time will be longer.",
            reencode_short: "Re-encode needed"
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
            upscale_desc: "Source file is compressed (lossy). Converting to {{fmt}} will increase file size WITHOUT improving quality.",
            reencode_title: "Re-encoding",
            reencode_desc: "Conversion to {{fmt}} is required.",
        },
        // Export
        compress: {
            title_video: "Export Video",
            title_audio: "Export Audio",
            title_image: "Export Image/GIF",

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
            btn_export: "Export",

            // Missing keys added
            title: "Export Media",
            change_file: "Change",
            preset_label: "Preset",
            est_output: "Estimated Size",

            // File validation
            file_missing: "File Not Found",
            file_missing_desc: "The original file has been moved or deleted.",
            browse_file: "Browse...",
            file_relocated: "File path updated successfully",
            double_compression_warning: "This file appears to be already compressed. Compressing it again will significantly reduce quality.",

            // New UI states
            checking_file: "Checking file...",
            unknown: "Unknown",
            auto: "Auto",

            // Options
            opt_voice: "Voice",
            opt_low: "Low",
            opt_standard: "Standard",
            opt_good: "Good",
            opt_high: "High",
            opt_max: "Max",

            opt_original_no_resize: "Original (No Resize)",

            opt_auto_detect: "Auto (Detect)",
            opt_cpu: "CPU (x264 software)",

            opt_ultrafast: "Ultrafast (Low Quality)",
            opt_veryfast: "Very Fast",
            opt_medium: "Medium (Default)",
            opt_slow: "Slow (Better Compression)",
            opt_veryslow: "Very Slow (Best Compression)",

            quality_original: "Original",
            quality_standard: "Standard",
            quality_low: "Low"
        },
        logic_warnings: {
            mov_reencode: "Using <strong>.MOV</strong> format with <strong>{{codec}}</strong> requires re-encoding. This may take longer.",
        },

        sequential_mode: "Sequential Mode: Will split after download",

        restart: "Restart",
        filename_label: "Filename",
        filename_placeholder: "Custom filename (optional)",
        batch_import_btn: "Batch Import from File",
        batch_imported_title: "Batch Imported",
        batch_imported_desc: "{{count}} URLs copied to clipboard. Paste in generic dialog.",
        import_failed: "Import Failed"
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
        scan_files: "Scan Files",
        scan_missing_files: "Scan Complete: {{count}} missing files found",
        scan_healthy_files: "Scan Complete: All files are healthy",
        recover: "Recover File",
        find_on_disk: "Find on Disk",
        redownload: "Redownload Content",
        untitled: "Untitled",
        unknown_size: "Unknown Size",
        open_url: "Open {{source}}",
        view_command: "View Command",
        folder: "Show in Folder",
        compress: "Export",
        delete: "Delete",
        delete_all_title: "Delete All History",
        delete_all_desc: "This will remove all items from your download history. This action cannot be undone.",
        delete_selected_title: "Delete Selected"
    },

    history_menu: {
        select: "Select Mode",
        cancel: "Cancel Selection",
        selected_count: "{{count}} Selected",
        select_all: "Select All",
        deselect_all: "Deselect All",
        delete: "Delete",
        delete_selected_title: "Delete Selected Items?",
        confirm_delete_msg: "Are you sure you want to delete {{count}} items?",
        toast_deleted: "Deleted {{count}} items",
        toast_redownload: "Redownload Started",
        toast_file_updated: "File path updated",
        tooltip_missing: "File not found - Moved or Deleted"
    },
    // Updated Guide Content (New Structure)
    guide: {
        title: "User Manual",
        subtitle: "Master SceneClip in minutes.",
        sections: {
            overview: "Overview",
            features: "Features",
            advanced: "Advanced",
            troubleshooting: "Fix Issues",

            // Descriptions
            overview_desc: "Quick Start & Supported Platforms",
            features_desc: "Clipping, GIF Maker, Keyring, Batch",
            advanced_desc: "SponsorBlock, Subtitles, System",
            troubleshooting_desc: "Common errors and solutions",
            shortcuts: "Shortcuts",
            shortcuts_fullscreen: "Toggle Fullscreen"
        },
        // Content for GuideModal
        content: {
            overview: {
                title: "The Ultimate GUI for yt-dlp",
                desc: "Download videos, extract audio, and create precise clips from thousands of sites without touching a terminal.",
                smart_workflow: "Smart Detection Workflow",
                steps: {
                    s1_title: "Copy Link",
                    s1_desc: "Copy any video URL from your browser (YouTube, Twitch, etc).",
                    s2_title: "Auto-Detect",
                    s2_desc: "SceneClip reads your clipboard and auto-pastes the link.",
                    s3_title: "Download",
                    s3_desc: "One click for Best Quality. Use 'List' icon for batch mode."
                },
                formats: {
                    title: "Format Selection",
                    best: "Best:",
                    best_desc: "Auto-merges highest quality Video + Audio (recommended).",
                    audio: "Audio Only:",
                    audio_desc: "Extracts MP3/M4A for music or podcasts.",
                    custom: "Custom:",
                    custom_desc: "Manually select 1080p/720p and MP4/MKV container."
                },
                supported: {
                    title: "Supported Platforms",
                    major: "Major Sites:",
                    major_list: "YouTube, Twitch, Instagram, TikTok, Twitter (X), Facebook, Reddit, SoundCloud, Bilibili, Vimeo.",
                    streaming: "Streaming:",
                    streaming_list: "Crunchyroll, Disney+, Discovery+, HBO (free content), and many TV-network sites.",
                    full_list: "View full list of 1000+ supported sites"
                }
            },
            features: {
                clipping: {
                    title: "Clipping & Trimming",
                    desc: "Download only what you need. Enable the Trim toggle, then set Start/End timestamps to extract a specific segment without downloading the full video."
                },
                gif: {
                    title: "GIF Maker",
                    desc: "Turn any video segment into an optimized GIF. Select the GIF tab. Limit: 30 seconds max. Adjustable FPS and scale."
                },
                keyring: {
                    title: "Keyring Manager",
                    desc: "Securely store credentials for Premium/Age-gated content. Uses your OS native vault (Windows Credential Manager, macOS Keychain, or Linux Secret Service)."
                },
                batch: {
                    title: "Batch Downloading",
                    desc: "Queue multiple videos at once. Click the List Icon next to the URL bar to paste a list of links or import a .txt file."
                },
                scheduler: {
                    title: "Scheduler",
                    desc: "Schedule downloads for later. Access via Enhancements > Schedule. *App must remain open.*"
                }
            },
            advanced: {
                enhancements: "Enhancements",
                network: "Network & System",
                items: {
                    sponsorblock: "SponsorBlock",
                    sponsorblock_desc: "Auto-skip sponsors, intros, and outros (YouTube only).",
                    embed_subs: "Embed Subtitles",
                    embed_subs_desc: "Merge Soft-Subs or download .srt files.",
                    loudness: "Loudness Norm",
                    loudness_desc: "Normalize audio to EBU R128 broadcast standard.",
                    postproc: "Post-Processing",
                    postproc_desc: "Use custom FFmpeg presets for conversion.",
                    aria2c: "Aria2c Accelerator",
                    aria2c_desc: "Multi-threaded downloading for maximum speed.",
                    cookies: "Cookies Import",
                    cookies_desc: "Use browser cookies to access Premium content.",
                    gpu: "GPU Acceleration",
                    gpu_desc: "Hardware-accelerated transcoding for faster clips."
                }
            },
            troubleshooting: {
                stuck: {
                    title: "Download Stuck at 100%?",
                    desc: "Processing large files (4K/8K) involves merging video+audio streams. This is normal and depends on your CPU speed. Please wait."
                },
                signin: {
                    title: "Sign in / Bot Check?",
                    desc: "YouTube may throttle bots. Go to Settings > Advanced > Source and select your browser to use its cookies."
                },
                permission: {
                    title: "Permission Denied?",
                    desc: "Avoid saving to optimized system folders (e.g. C:\\Program Files or /usr/local). Use your User Downloads or Documents folder. Check Security Software exclusions."
                },
                slow: {
                    title: "Slow Speeds?",
                    desc: "Try enabling Aria2c in Network Settings to force multi-connection downloading."
                },
                geoblock: {
                    title: "Video Unavailable / Geo-Block?",
                    desc: "Use Proxy settings (Network tab) or a VPN. Do not use Smart Proxy and Manual Proxy together."
                },
                playlist: {
                    title: "Playlist stopped at 5?",
                    desc: "You likely pasted the link in Single URL mode. Use the Batch (List Icon) tab for playlists."
                },
                report_btn: "Report a Bug on GitHub",
                report_desc: "Attach logs from the Terminal tab"
            }
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
        home: "Home",
        copy_link: "Copy Link",
        screenshot: "Screenshot",
        more_soon: "More coming soon...",
        undo: "Undo",
        redo: "Redo",
        cut: "Cut",
        copy: "Copy",
        paste: "Paste",
        paste_plain: "Paste as plain text",
        select_all: "Select all",
        refresh: "Refresh"
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
        system_action: "System action failed: {{action}}",
        listener_attach: "Failed to attach download listener",
        binary_validation: "Binary validation failed",
        update_check: "Failed to check for updates",
        binary_crash: "Critical Binary Error",
        copy_logs: "Failed to copy logs",
        copy_line: "Failed to copy line",
        path_empty: "Path is empty",
        access_denied: "Access Denied",
        access_desc: "Permission refused.",
        folder_not_found: "Folder Not Found",
        folder_desc: "The directory no longer exists.",
        file_desc: "File may have been moved or deleted.",
        open_folder: "Open Folder"
    },
    shortcuts: {
        title: "Keyboard Shortcuts",
        close: "Close",
        groups: {
            general: "General",
            navigation: "Navigation"
        },
        actions: {
            settings: "Settings",
            history: "History",
            downloads: "Downloads",
            new_download: "New Download",
            fullscreen: "Toggle Fullscreen"
        }
    },

    terminal: {
        filter_all: "All",
        filter_system: "System",
        filter_ytdlp: "yt-dlp",
        filter_ffmpeg: "FFmpeg",
        copy_all: "Copy All",
        clear_all: "Clear All",
        copied: "Copied!",
        copy: "Copy",
        copy_line: "Copy Line",
        ready: "System ready. Waiting for tasks...",
        no_logs: "No {{filter}} logs found.",
    },

    empty_state: {
        title: "No downloads yet",
        description: "Copy a link and press <1>{{mod}}+N</1> to start."
    },

    filename_preview: {
        label: "Live Preview",
        reset: "Reset",
        example_title: "My Awesome Video",
        example_uploader: "CoolCreator"
    },

    url_input: {
        batch_switch: "Switch to Batch Mode",
        single_switch: "Switch to Single URL",
        batch_desc: "Paste multiple URLs, one per line.",
        placeholder_single: "Paste video URL (YouTube, TikTok, Instagram, Twitter...)",
        placeholder_batch: "https://youtube.com/watch?v=...\nhttps://tiktok.com/@user/video/...\nhttps://instagram.com/reel/...",
        paste_clipboard: "Paste from Clipboard",
        switch_tooltip_batch: "Switch to batch mode (multiple URLs)",
        switch_tooltip_single: "Switch to single URL"
    },

    // Legacy content kept if needed, but new logic uses guide.content
    guide_content: {
        help_center: "Help Center",
        // ... kept for fallback if needed
    },

    dialog_status: {
        trimmed: "TRIMMED",
        disk_full: "Insufficient Disk Space",
        est_size: "Estimated Size",
        calculating: "Calculating..."
    },




    // Onboarding (Welcome Sheet)
    onboarding: {
        welcome_title: "Welcome to SceneClip",
        start: "Get Started",
        skip: "Skip Introduction", // kept just in case, though likely typically removed in single page if blocking
        features: {
            smart_title: "Smart Detection",
            smart_desc: "Auto-detects video links from your clipboard.",
            clip_title: "Precision Clipping",
            clip_desc: "Download only the best parts to save space.",
            secure_title: "Secure Keyring",
            secure_desc: "Safe storage for your premium account credentials."
        }
    },

    all: "All",
    video: "Video",
    audio: "Audio",

    // ETA Human-Readable Translations (i18next pluralization)
    eta: {
        unknown: "Unknown time left",
        hours_one: "{{count}} hour",
        hours_other: "{{count}} hours",
        minutes_one: "{{count}} minute",
        minutes_other: "{{count}} minutes",
        seconds_one: "{{count}} second",
        seconds_other: "{{count}} seconds",
        and: "and",
        remaining: "{{time}} remaining"
    },
    exit_guard: {
        title: "Download in Progress",
        desc: "Active downloads are running in the background. Exiting now will forcefully stop them.",
        confirm: "Yes, Exit",
        cancel: "Cancel",
        refresh_msg: "Downloads are active! Reloading will disrupt the user interface state. Are you sure?"
    }
}
