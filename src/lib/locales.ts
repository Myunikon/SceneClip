export const translations = {
  en: {
    nav: {
      downloads: "Downloads",
      browser: "Browser",
      settings: "Settings",
      tools: "Tools",
      terminal: "Terminal"
    },
    status: {
      missing: "Missing Components",
      downloading_bin: "Downloading Components...",
      ready: "Ready",
      repair: "Download Components",
      offline: "No Internet Connection",
      slow_connect: "Network might be slow"
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
      empty: "No downloads yet.",
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
            quit_app: "Quit App"
        },
        downloads: {
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
            embed_thumbnail: "Embed Thumbnail"
        },
        network: {
            connection: "Connection",
            concurrent: "Concurrent Downloads",
            warning_ip: "Warning: Too many simultaneous downloads may result in IP bans.",
            speed_limit: "Speed Limit",
            proxy: "Proxy URL",
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
            confirm_redownload: "Are you sure you want to force re-download FFmpeg?\\n\\nThis will overwrite the existing ‘ffmpeg.exe’ and might take a few minutes depending on your internet connection."
        },
        updater: {
            title: "Software Update",
            subtitle: "Manage core binaries (yt-dlp)",
            latest: "You are on the latest version.",
            error: "Version check failed.",
            checking: "Checking...",
            update_btn: "Check for Updates",
            updating: "Updating..."
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
            legal: "Legal Disclaimer",
            legal_text: "ClipSceneYT is for personal use (archiving, education). The developer is not affiliated with YouTube/Google. All usage risks, including copyright infringement or platform ToS violations, are the user's responsibility.",
            secret_found: "Secret Found!",
            secret_desc: "You unlocked the secret developer appreciation badge!",
            secret_sub: "(No hidden settings, just good vibes!)",
            awesome: "Awesome!"
        }
    },
    dialog: {
      title: "Add Download",
      url_label: "Video URL",
      format_label: "Format",
      folder_label: "Save Folder",
      clip_label: "Clip Range",
      enhancements_label: "Enhancements",
      turbo_label: "Turbo Mode (Multi-threaded)",
      sponsor_label: "Remove Sponsors",
      cancel: "Cancel",
      download: "Download",
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
      trim_video: "Trim Video",
      metadata_required: "Metadata required for slider",
      time_error: "Start time must be before End time",
      restart: "Restart"
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
        file_not_found: "File not found. It may have been moved or deleted."
    },
    guide: {
        title: "User Manual",
        subtitle: "Everything you need to know to master ClipSceneYT.",
        sections: {
            started: "Getting Started",
            single: "Single Video Download",
            single_text: "1. Copy the URL of the YouTube video you want to download.\n2. Click the (+) button in the top-right corner.\n3. The app will automatically detect the link from your clipboard.\n4. Select your desired format:\n   - Best Video+Audio: Highest quality available (MP4).\n   - 360p: Data saver resolution.\n   - Audio Only: Converts to MP3 or WAV.\n   - GIF: Creates an animated GIF.\n5. Click 'Download' to start.",
            clipping: "Video Clipping & Cutting",
            clipping_text: "Create viral short clips without downloading the entire video.\n\nHow to use:\n1. Open the 'Add Download' dialog.\n2. Click on 'Clip Range' to expand the options.\n3. Enter the Start Time and End Time in seconds.\n\nExample:\n- Start: 60 (1 minute mark)\n- End: 120 (2 minute mark)\nThis will download ONLY that 1-minute segment.",
            power: "Power User Features",
            turbo: "Turbo Mode (Always On)",
            turbo_text: "Turbo Mode is now standard and always active.\n\n- How it works: It intelligently splits the file into 4 chunks and downloads them simultaneously.\n- Performance: Maximizes your bandwidth automatically.\n- Note: No configuration required. The app handles optimization for you.",
            queue: "Queue Management",
            queue_text: "The 'Downloads' tab shows active and pending tasks. The 'History' tab shows completed files.\n- Concurrency: By default, 3 downloads run at once. You can change this limit in Settings > Network.\n- Resume: If a download fails or is stopped, click the 'Resume' button to continue from where it left off.",
            renaming: "How to Auto-Name Files",
            renaming_text: "Customize how your files are named automatically.\nGo to Settings > Downloads > Filename Template.\n\nAvailable Variables:\n- {title}: Video Title\n- {uploader}: Channel Name\n- {id}: Video ID\n- {ext}: File Extension\n- {width} / {height}: Resolution\n\nRecommended Pattern:\n[{uploader}] {title}.{ext}",
            troubleshoot: "Fix Common Problems",
            ts_fail: "Why does my download fail instantly?",
            ts_fail_text: "Common Solutions:\n1. Check your Internet Connection.\n2. Update Binaries: Go to Settings > Advanced and verify FFmpeg usage.\n3. Age-Restricted Content: Use the 'System Browser' method to authenticate (Settings > Advanced > Source).",
            ts_restart: "Why did the app restart?",
            ts_restart_text: "If you see 'App Restarting' messages, you are likely in Developer Mode and saving files to the source code folder. This triggers a hot-reload. In the final release version, this behavior is disabled.",
            auth_guide: "How to download Age-Restricted videos",
            auth_guide_text: "To download age-restricted/premium content:\n1. Log in to YouTube in Chrome or Edge.\n2. In Settings > Advanced > Source, select 'Use System Browser Session'.\n3. The app will borrow your login session for downloads.\n\nNote: Works with Native Download method only.",
            shortcuts: "Keyboard Shortcuts",
            shortcuts_list: "- **Ctrl + N**: New Download\n- **Ctrl + H**: Open History\n- **Ctrl + ,**: Open Settings\n- **Space**: Pause/Resume Task (if selected)",
            replay_tour: "Replay Welcome Tour",
            visual_placeholder: "Visual Demo coming soon",
            sponsorblock: "Auto-Skip Sponsors (SponsorBlock)",
            sponsorblock_text: "Automatically skip sponsored segments, intros, and outros.\n\n- How it works: Uses simpler community-sourced data to detect and remove non-content parts of the video.\n- Categories: You can customize what to skip (Sponsors, Intros, Self-Promo, etc.) in Settings > Advanced > SponsorBlock.\n- Note: This feature requires re-processing the video, so it might take slightly longer to complete.",
            got_it: "Got it!"
        }
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
        }
  },
  id: {
    nav: {
      downloads: "Unduhan",
      browser: "Browser",
      settings: "Pengaturan",
      tools: "Alat",
      terminal: "Terminal"
    },
    status: {
      missing: "Komponen Hilang",
      downloading_bin: "Mengunduh Komponen...",
      ready: "Siap",
      repair: "Unduh Komponen",
      offline: "Tidak Ada Koneksi Internet",
      slow_connect: "Koneksi mungkin lambat"
    },
    header: {
      title: "ClipScene",
    },
    downloads: {
      title: "Daftar Unduhan",
      subtitle: "Kelola unduhan video dan klip Anda.",
      new_download: "Tambah Unduhan",
      open_file: "Buka File",
      open_folder: "Buka Folder",
      stop: "Stop",
      clear: "Hapus",
      empty: "Belum ada unduhan.",
      headers: {
        title_url: "Judul / URL",
        status: "Status",
        progress: "Progres",
        actions: "Aksi",
        eta: "ETA",
        clip: "Klip"
      }
    },
    browser: {
      placeholder: "Masukkan URL...",
      search_placeholder: "Cari atau masukkan nama website",
      download_this: "Unduh Video Ini"
    },
    settings: {
        title: "Pengaturan",
        save: "Simpan Konfigurasi",
        saved: "Tersimpan!",
        about: "Tentang",
        tabs: {
            general: "Umum",
            downloads: "Unduhan",
            network: "Jaringan",
            advanced: "Lanjutan",
            guide: "Panduan",
            about: "Tentang"
        },
        general: {
            language_theme: "Bahasa & Tema",
            language: "Bahasa Antarmuka",
            theme: "Tema Warna",
            theme_dark: "Mode Gelap",
            theme_light: "Mode Terang",
            startup: "Perilaku Startup",
            launch_startup: "Jalankan saat Startup",
            start_minimized: "Mulai diminimalkan ke Tray",
            close_action: "Tindakan Tombol Tutup",
            minimize_tray: "Minimalkan ke Tray",
            quit_app: "Keluar Aplikasi"
        },
        downloads: {
            storage: "Penyimpanan",
            path: "Lokasi Unduhan Default",
            change: "Ubah",
            always_ask: "Selalu tanya lokasi penyimpanan",
            defaults: "Default",
            filename_template: "Template Nama File",
            available_vars: "Tersedia: {title}, {width}, {height}, {ext}",
            resolution: "Resolusi Default",
            container: "Kontainer",
            best: "Terbaik",
            audio: "Hanya Audio",
            metadata_title: "Metadata & Tag",
            embed_metadata: "Sematkan Metadata",
            embed_thumbnail: "Sematkan Thumbnail"
        },
        network: {
            connection: "Koneksi",
            concurrent: "Unduhan Bersamaan",
            warning_ip: "Peringatan: Terlalu banyak unduhan sekaligus bisa menyebabkan ban IP.",
            speed_limit: "Batas Kecepatan",
            proxy: "URL Proxy",
            turbo: "Mode Turbo",
            turbo_desc: "Gunakan enjin muat turun berbilang thread untuk kelajuan maksimum."
        },
        advanced: {
            auth: "Otentikasi & Cookies",
            source: "Sumber",
            use_browser: "Gunakan Sesi Browser Tertanam",
            use_txt: "Muat dari cookies.txt",
            sponsorblock: "SponsorBlock",
            enable_sb: "Aktifkan SponsorBlock",
            binary_paths: "Lokasi Binary (Override)",
            clear_cache: "Hapus Cache",
            post_action: "Aksi Setelah Unduhan (Antrean Selesai)",
            post_actions: {
                none: "Tidak Ada",
                sleep: "Tidur (Sleep)",
                shutdown: "Matikan Sistem"
            },
            danger_zone_proxy: "Zona Bahaya (Proxy)",
            danger_zone_binaries: "Zona Bahaya (Binaries)",
            danger_desc: "Mengubah lokasi ini dapat merusak aplikasi.",
            redownload_ffmpeg: "Unduh Ulang FFmpeg (Paksa)",
            redownload_help: "Gunakan jika FFmpeg korup atau hilang.",
            confirm_redownload: "Yakin ingin mengunduh ulang FFmpeg secara paksa?\\n\\nIni akan menimpa ‘ffmpeg.exe’ yang ada dan memakan waktu beberapa menit."
        },
        updater: {
            title: "Pembaruan Perangkat Lunak",
            subtitle: "Kelola binary inti (yt-dlp)",
            latest: "Anda menggunakan versi terbaru.",
            error: "Gagal cek versi.",
            checking: "Memeriksa...",
            update_btn: "Cek Pembaruan",
            updating: "Memperbarui..."
        },
        setup: {
            title: "Setup Tambahan Diperlukan",
            subtitle: "FFmpeg dan yt-dlp gak ketemu nih.",
            desc: "Buat download video, aplikasi butuh 2 komponen inti. Mau install gimana?",
            auto_btn: "Download Otomatis",
            auto_badge: "Disarankan",
            auto_desc: "• Download modul resmi & aman\n• Otomatis setting jalur (path)\n• Ukuran: ~80MB",
            manual_btn: "Setup Manual",
            manual_desc: "• Saya sudah punya filenya\n• Instruksi Copy-paste\n• Bisa offline",
            disclaimer: "Dengan download otomatis, kamu setuju sama lisensi FFmpeg dan yt-dlp."
        },
        about_page: {
            desc: "Pengunduh & Pemotong YouTube Paling Canggih di Kelasnya.",
            core: "Mesin Inti & Kredit",
            yt_desc: "Kekuatan utama di balik layar. yt-dlp adalah standar industri global untuk mengunduh media dari ribuan situs.",
            ff_desc: "Swiss Army Knife untuk multimedia. Menangani konversi, penggabungan audio/video, dan pemotongan presisi.",
            aria_desc: "Akselerator unduhan. Memungkinkan koneksi multi-utas (Turbo Mode) untuk kecepatan maksimal.",
            tech_stack: "Dibangun Dengan Teknologi Modern",
            react_desc: "Pustaka JavaScript untuk membangun antarmuka pengguna. Digunakan untuk frontend yang dinamis.",
            tauri_desc: "Membangun aplikasi yang lebih kecil dan cepat. Menjembatani backend Rust dengan frontend web.",
            lucide_desc: "Ikon yang indah & konsisten. Menambah kejelasan visual dan estetika modern.",
            sb_desc: "Platform crowdsourced untuk melewati segmen sponsor di video YouTube secara otomatis.",
            legal: "Penafian Hukum",
            legal_text: "ClipSceneYT adalah alat untuk penggunaan pribadi (pengarsipan, edukasi). Pengembang tidak berafiliasi dengan YouTube/Google. Segala risiko penggunaan, termasuk pelanggaran hak cipta atau ToS platform, adalah tanggung jawab penuh pengguna.",
            secret_found: "Rahasia Ditemukan!",
            secret_desc: "Anda membuka lencana apresiasi pengembang rahasia!",
            secret_sub: "(Tidak ada pengaturan tersembunyi, hanya suasana asik!)",
            awesome: "Mantap!"
        }
    },
    dialog: {
      title: "Tambah Unduhan",
      url_label: "URL Video",
      format_label: "Format",
      folder_label: "Folder Simpan",
      clip_label: "Potong Video (Klip)",
      enhancements_label: "Fitur Tambahan",
      turbo_label: "Mode Turbo (Multi-thread)",
      sponsor_label: "Hapus Sponsor",
      cancel: "Batal",
      download: "Unduh",
      preview: {
        failed: "Pratinjau Gagal",
        no_data: "Tidak ada data kembali",
        instruction: "Masukkan URL valid untuk pratinjau"
      },
      formats: {
        best: "Video + Audio Terbaik",
        audio_mp3: "Audio (MP3)",
        audio_wav: "Audio (WAV Lossless)",
        gif: "GIF Animasi"
      },
      trim_video: "Potong Video",
      metadata_required: "Metadata diperlukan untuk slider",
      time_error: "Waktu mulai harus sebelum waktu selesai",
      restart: "Mulai Ulang"
    },
    updater_banner: {
        update_available: "Update yt-dlp tersedia:",
        update_now: "Update Sekarang",
        updating: "Mengupdate..."
    },
    monitor: {
        title: "Link Terdeteksi",
        download: "Unduh",
        ignore: "Abaikan"
    },
    playlist: {
        title: "Playlist Terdeteksi",
        fetch: "Ambil Info Playlist",
        select_all: "Pilih Semua",
        deselect_all: "Hapus Semua",
        selected: "Dipilih",
        download_selected: "Unduh Pilihan",
        fetching: "Mengambil info playlist...",
        error: "Gagal mengambil playlist."
    },
    history: {
        title: "Riwayat",
        open_folder: "Buka Folder",
        play: "Mainkan",
        clear: "Bersihkan Riwayat",
        empty: "Tidak ada riwayat unduhan.",
        delete_all: "Hapus Semua",
        file_details: "Detail File",
        format: "Format",
        actions: "Aksi",
        file_not_found: "File gak ketemu. Mungkin udah dipindah atau dihapus."
    },
    guide: {
        title: "Panduan Lengkap",
        subtitle: "Semua ilmu yang Anda butuhkan untuk menguasai ClipSceneYT.",
        sections: {
            started: "Memulai",
            single: "Cara Download Video",
            single_text: "1. Salin URL video YouTube yang ingin diunduh.\n2. Klik tombol (+) di pojok kanan atas.\n3. Aplikasi akan otomatis mendeteksi link dari clipboard Anda (Magic Paste).\n4. Pilih format yang diinginkan:\n   - Video Terbaik: Kualitas tertinggi (MP4/WebM).\n   - 360p: Resolusi hemat kuota.\n   - Audio Saja: Konversi ke MP3 atau WAV.\n   - GIF: Membuat animasi GIF pendek.\n5. Klik 'Unduh' untuk memulai proses.",
            clipping: "Memotong Video (Clipping)",
            clipping_text: "Buat klip viral pendek tanpa perlu mendownload durasi penuh.\n\nCara Penggunaan:\n1. Buka dialog 'Tambah Unduhan'.\n2. Klik 'Potong Video' (Clip Range) untuk membuka opsi.\n3. Masukkan Waktu Mulai dan Selesai dalam detik.\n4. Klik Unduh.\n\nContoh:\n- Mulai: 60 (menit ke-1)\n- Selesai: 120 (menit ke-2)\nAplikasi hanya akan mengambil potongan 1 menit tersebut.",
            power: "Fitur Power User",
            turbo: "Mode Turbo (Selalu Aktif)",
            turbo_text: "Mode Turbo kini menjadi standar dan selalu aktif.\n\n- Cara Kerja: Memecah file menjadi 4 bagian cerdas dan mengunduhnya secara bersamaan.\n- Performa: Memaksimalkan kecepatan bandwidth Anda secara otomatis.\n- Catatan: Tidak perlu konfigurasi manual. Aplikasi mengaturnya untuk Anda.",
            queue: "Manajemen Antrean",
            queue_text: "Tab 'Unduhan' menampilkan tugas aktif. Tab 'Riwayat' menyimpan file selesai.\n- Simultan: Secara default, 3 unduhan berjalan sekaligus. Anda bisa ubah batas ini di Pengaturan > Jaringan.\n- Lanjutkan (Resume): Jika unduhan gagal atau di-stop, klik tombol 'Resume' untuk melanjutkan dari posisi terakhir.",
            renaming: "Cara Mengatur Nama File Otomatis",
            renaming_text: "Atur penamaan file otomatis sesuai selera Anda.\nPergi ke Pengaturan > Unduhan > Template Nama File.\n\nVariabel Tersedia:\n- {title}: Judul Video\n- {uploader}: Nama Channel\n- {id}: ID Video unik\n- {ext}: Ekstensi File\n\nPola Rekomendasi:\n[{uploader}] {title}.{ext}",
            troubleshoot: "Perbaiki Masalah Umum",
            ts_fail: "Kenapa download saya gagal?",
            ts_fail_text: "Solusi Umum:\n1. Cek koneksi internet Anda.\n2. Update Binary: Pergi ke Pengaturan > Lanjutan dan cek status FFmpeg.\n3. Konten Dewasa/Terbatas: Gunakan metode 'Browser Sistem' untuk otentikasi (Pengaturan > Lanjutan > Sumber).",
            ts_restart: "Kenapa aplikasi restart sendiri?",
            ts_restart_text: "Jika muncul pesan 'App Restarting', Anda mungkin sedang dalam Mode Pengembangan (Dev) dan menyimpan file ke folder source code. Ini memicu hot-reload. Di versi Rilis final, perilaku ini dinonaktifkan.",
            auth_guide: "Cara Download Video Dewasa/Premium",
            auth_guide_text: "Untuk mengunduh konten terbatas (umur/premium):\n1. Pastikan Anda sudah login ke YouTube di browser Chrome/Edge.\n2. Di Pengaturan > Lanjutan > Sumber, pilih 'Gunakan Sesi Browser Sistem'.\n3. Aplikasi akan meminjam sesi login dari browser Anda untuk proses unduhan.\n\nCatatan: Fitur ini hanya bekerja dengan metode unduhan Native (SponsorBlock Aktif).",
            shortcuts: "Pintasan Keyboard",
            shortcuts_list: "- **Ctrl + N**: Unduhan Baru\n- **Ctrl + H**: Buka Riwayat\n- **Ctrl + ,**: Buka Pengaturan\n- **Spasi**: Jeda/Lanjut Tugas",
            replay_tour: "Ulangi Tur Sambutan",
            visual_placeholder: "Demo Visual segera hadir",
            sponsorblock: "Lewati Sponsor (SponsorBlock)",
            sponsorblock_text: "Otomatis membuang segmen iklan sponsor, intro, dan outro.\n\n- Cara Kerja: Menggunakan database komunitas untuk mendeteksi dan menghapus bagian yang bukan konten utama.\n- Kategori: Anda bisa atur apa saja yang ingin dibuang (Sponsor, Intro, Promosi Diri, dll) di Pengaturan > Lanjutan > SponsorBlock.\n- Catatan: Fitur ini membutuhkan proses ulang video, jadi mungkin sedikit lebih lama selesai.",
            got_it: "Mengerti!"
        }
    },
    context_menu: {
            back: "Kembali",
            refresh: "Muat Ulang",
            home: "Beranda",
            copy: "Salin",
            paste: "Tempel",
            copy_link: "Salin Link",
            screenshot: "Screenshot",
            more_soon: "Lainnya menyusul..."
        }
  },
  ms: {
    nav: {
      downloads: "Muat Turun",
      browser: "Pelayar",
      settings: "Tetapan",
      tools: "Alatan",
      terminal: "Terminal"
    },
    status: {
      missing: "Komponen Hilang",
      downloading_bin: "Sedang Memuat Turun Komponen...",
      ready: "Sedia",
      repair: "Muat Turun Komponen",
      offline: "Tiada Sambungan Internet",
      slow_connect: "Sambungan mungkin perlahan"
    },
    header: {
      title: "ClipScene",
    },
    downloads: {
      title: "Senarai Muat Turun",
      subtitle: "Urus muat turunan video dan klip anda.",
      new_download: "Muat Turun Baru",
      open_file: "Buka Fail",
      open_folder: "Buka Folder",
      stop: "Berhenti",
      clear: "Kosongkan",
      empty: "Tiada muat turun lagi.",
      headers: {
        title_url: "Tajuk / URL",
        status: "Status",
        progress: "Kemajuan",
        actions: "Tindakan",
        eta: "ETA",
        clip: "Klip"
      }
    },
    browser: {
      placeholder: "Masukkan URL...",
      search_placeholder: "Cari atau masukkan nama laman web",
      download_this: "Muat Turun Video Ini"
    },
    settings: {
        title: "Tetapan",
        save: "Simpan Tetapan",
        saved: "Disimpan!",
        about: "Tentang",
        tabs: {
            general: "Umum",
            downloads: "Muat Turun",
            network: "Rangkaian",
            advanced: "Lanjutan",
            guide: "Panduan",
            about: "Tentang"
        },
        general: {
            language_theme: "Bahasa & Tema",
            language: "Bahasa Antaramuka",
            theme: "Tema Warna",
            theme_dark: "Mod Gelap",
            theme_light: "Mod Terang",
            startup: "Kelakuan Permulaan",
            launch_startup: "Lancarkan semasa Mula",
            start_minimized: "Mula diminimimumkan ke Tray",
            close_action: "Tindakan Butang Tutup",
            minimize_tray: "Minimumkan ke Tray",
            quit_app: "Keluar Aplikasi"
        },
        downloads: {
            storage: "Penyimpanan",
            path: "Laluan Muat Turun Lalai",
            change: "Tukar",
            always_ask: "Sentiasa tanya lokasi simpan",
            defaults: "Lalai",
            filename_template: "Templat Nama Fail",
            available_vars: "Tersedia: {title}, {width}, {height}, {ext}",
            resolution: "Resolusi Lalai",
            container: "Bekas",
            best: "Terbaik",
            audio: "Audio Sahaja",
            metadata_title: "Metadata & Tag",
            embed_metadata: "Benamkan Metadata",
            embed_thumbnail: "Benamkan Gambar Kecil"
        },
        network: {
            connection: "Sambungan",
            concurrent: "Muat Turun Serentak",
            warning_ip: "Amaran: Terlalu banyak muat turun serentak boleh menyebabkan IP disekat.",
            speed_limit: "Had Kelajuan",
            proxy: "URL Proksi",
            turbo: "Mod Turbo",
            turbo_desc: "Gunakan enjin muat turun multi-bebenang luaran."
        },
        advanced: {
            auth: "Pengesahan & Kuki",
            source: "Sumber",
            use_browser: "Gunakan Sesi Browser Sistem (Chrome)",
            use_txt: "Muat dari cookies.txt",
            sponsorblock: "SponsorBlock",
            enable_sb: "Dayakan SponsorBlock",
            binary_paths: "Laluan Binari (Override)",
            clear_cache: "Kosongkan Cache",
            post_action: "Tindakan Selepas Muat Turun",
            post_actions: {
                none: "Tiada",
                sleep: "Tidur",
                shutdown: "Matikan Sistem"
            },
            danger_zone_proxy: "Zon Bahaya (Proxy)",
            danger_zone_binaries: "Zon Bahaya (Binari)",
            danger_desc: "Menukar laluan ini boleh merosakkan aplikasi.",
            redownload_ffmpeg: "Muat Turun Semula FFmpeg (Paksa)",
            redownload_help: "Gunakan jika FFmpeg rosak atau hilang.",
            confirm_redownload: "Anda pasti mahu memuat turun semula FFmpeg?\\n\\nIni akan menimpa ‘ffmpeg.exe’ sedia ada."
        },
        updater: {
            title: "Kemas Kini Perisian",
            subtitle: "Urus binari teras (yt-dlp)",
            latest: "Anda menggunakan versi terkini.",
            error: "Semakan versi gagal.",
            checking: "Memeriksa...",
            update_btn: "Semak Kemas Kini",
            updating: "Sedang Mengemas Kini..."
        },
        setup: {
            title: "Persiapan Tambahan Diperlukan",
            subtitle: "FFmpeg dan yt-dlp tidak dijumpai.",
            desc: "Untuk muat turun video, apl perlukan 2 komponen asas. Macam mana nak pasang?",
            auto_btn: "Muat Turun Automatik",
            auto_badge: "Disyorkan",
            auto_desc: "• Muat turun modul sah\n• Konfigurasi laluan automatik\n• Saiz: ~80MB",
            manual_btn: "Persiapan Manual",
            manual_desc: "• Saya dah ada failnya\n• Arahan salin-tampal\n• Boleh offline",
            disclaimer: "Dengan muat turun automatik, anda setuju dengan lesen FFmpeg dan yt-dlp."
        },
        about_page: {
            desc: "Pemuat Turun & Pemotong YouTube Prestasi Tinggi Moden",
            core: "Enjin Teras & Binari",
            yt_desc: "Program baris perintah untuk memuat turun video dari YouTube.",
            ff_desc: "Penyelesaian rentas platform lengkap untuk merakam, menukar dan menstrim audio dan video.",
            aria_desc: "Utiliti muat turun baris perintah pelbagai protokol & pelbagai sumber yang ringan.",
            tech_stack: "Timbunan Teknologi",
            react_desc: "Perpustakaan JavaScript untuk membina antara muka pengguna. Digunakan untuk frontend dinamik.",
            tauri_desc: "Bina aplikasi yang lebih kecil dan pantas. Menghubungkan backend Rust dengan frontend web.",
            lucide_desc: "Ikon yang cantik & konsisten. Menambah kejelasan visual dan estetika moden.",
            sb_desc: "Platform sumber ramai untuk melangkau segmen penaja dalam video YouTube secara automatik.",
            legal: "Penafian Undang-undang",
            legal_text: "ClipSceneYT bertujuan untuk kegunaan peribadi sahaja (cth., mengarkib kandungan sendiri, penggunaan adil pendidikan, atau kandungan creative commons). Pembangun tidak bertanggungjawab atas sebarang penyalahgunaan perisian ini atau pelanggaran hak cipta yang dilakukan oleh pengguna. Memuat turun bahan berhak cipta tanpa kebenaran adalah melanggar Syarat Perkhidmatan YouTube.",
            secret_found: "Rahsia Ditemui!",
            secret_desc: "Anda membuka lencana penghargaan pembangun rahsia!",
            secret_sub: "(Tiada tetapan tersembunyi, hanya suasana baik!)",
            awesome: "Hebat!"
        }
    },
    dialog: {
      title: "Tambah Muat Turun",
      url_label: "URL Video",
      format_label: "Format",
      folder_label: "Folder Simpan",
      clip_label: "Potong Video (Klip)",
      enhancements_label: "Ciri Tambahan",
      turbo_label: "Mod Turbo",
      sponsor_label: "Buang Penaja",
      cancel: "Batal",
      download: "Muat Turun",
      preview: {
        failed: "Pratonton Gagal",
        no_data: "Tiada data",
        instruction: "Masukkan URL sah untuk lihat pratonton"
      },
      formats: {
        best: "Video + Audio Terbaik",
        audio_mp3: "Audio (MP3)",
        audio_wav: "Audio (WAV Lossless)",
        gif: "GIF Animasi"
      },
      trim_video: "Potong Video",
      metadata_required: "Metadata diperlukan untuk peluncur",
      time_error: "Masa mula mesti sebelum masa tamat",
      restart: "Mula Semula"
    },
    updater_banner: {
        update_available: "Kemas kini yt-dlp tersedia:",
        update_now: "Kemas Kini Sekarang",
        updating: "Sedang mengemas kini..."
    },
    monitor: {
        title: "Pautan Dikesan",
        download: "Muat Turun",
        ignore: "Abaikan"
    },
    playlist: {
        title: "Playlist Dikesan",
        fetch: "Ambil Info Playlist",
        select_all: "Pilih Semua",
        deselect_all: "Nyahpilih Semua",
        selected: "Dipilih",
        download_selected: "Muat Turun Pilihan",
        fetching: "Sedang mengambil info playlist...",
        error: "Gagal mengambil playlist."
    },
    history: {
        title: "Sejarah",
        open_folder: "Buka Folder",
        play: "Mainkan",
        clear: "Kosongkan Sejarah",
        empty: "Tiada sejarah muat turun.",
        delete_all: "Padam Semua",
        file_details: "Butiran Fail",
        format: "Format",
        actions: "Tindakan",
        file_not_found: "Fail tidak dijumpai. Mungkin telah dialihkan atau dipadam."
    },
    guide: {
        title: "Manual Lengkap",
        subtitle: "Segala ilmu yang anda perlukan untuk menguasai ClipSceneYT.",
        sections: {
            started: "Bermula",
            single: "Cara Muat Turun Video",
            single_text: "1. Salin URL video YouTube yang ingin dimuat turun.\n2. Klik butang (+) di penjuru kanan atas.\n3. Apl akan mengesan pautan secara automatik dari papan keratan (Magic Paste).\n4. Pilih format yang diinginkan:\n   - Video Terbaik: Kualiti tertinggi (MP4/WebM).\n   - Audio Sahaja: Tukar kepada MP3 atau WAV.\n   - GIF: Cipta animasi GIF pendek.\n5. Klik 'Muat Turun' untuk memulakan proses.",
            clipping: "Memotong Video (Clipping)",
            clipping_text: "Cipta klip pendek viral tanpa perlu memuat turun video penuh.\n\nCara Penggunaan:\n1. Buka dialog 'Tambah Muat Turun'.\n2. Klik 'Potong Video' (Clip Range) untuk membuka pilihan.\n3. Masukkan Masa Mula dan Tamat dalam saat.\n4. Klik Muat Turun.\n\nContoh:\n- Mula: 60 (minit ke-1)\n- Tamat: 120 (minit ke-2)\nApl hanya akan mengambil potongan 1 minit tersebut.",
            power: "Ciri Kuasa",
            turbo: "Mod Turbo (Berbilang Bebenang)",
            turbo_text: "Mod Turbo menggunakan enjin tersuai berprestasi tinggi (seperti IDM/Aria2).\n\n- Cara Kerja: Memecahkan fail kepada 8 bahagian berasingan (hirisan pizza) dan memuat turunnya secara serentak.\n- Kelajuan: Boleh mencapai 10x lebih pantas berbanding pelayar biasa.\n- Had: Jika anda mengalami ralat '403 Forbidden' atau gagal serta-merta, YouTube mungkin menyekat IP anda sementara kerana terlalu banyak sambungan. Matikan Mod Turbo untuk beralih ke 'Mod Selamat' (1 bebenang).",
            queue: "Pengurusan Barisan",
            queue_text: "Tab 'Muat Turun' memaparkan tugasan aktif. Tab 'Sejarah' menyimpan fail selesai.\n- Serentak: Secara lalai, 3 muat turun berjalan serentak. Anda boleh ubah had ini di Tetapan > Rangkaian.\n- Sambung Semula (Resume): Jika muat turun gagal atau dihentikan, klik butang 'Sambung' untuk meneruskan dari kedudukan terakhir.",
            renaming: "Cara Nama Fail Automatik",
            renaming_text: "Sesuaikan penamaan fail automatik mengikut citarasa anda.\nPergi ke Tetapan > Muat Turun > Templat Nama Fail.\n\nPembolehubah Tersedia:\n- {title}: Tajuk Video\n- {uploader}: Nama Saluran\n- {id}: ID Video unik\n- {ext}: Sambungan Fail\n\nCorak Disyorkan:\n[{uploader}] {title}.{ext}",
            troubleshoot: "Selesaikan Masalah Umum",
            ts_fail: "Kenapa muat turun gagal?",
            ts_fail_text: "Penyelesaian Umum:\n1. Semak sambungan internet anda.\n2. Matikan Mod Turbo: Sesetengah ISP atau wilayah menyekat sambungan berbilang ke YouTube.\n3. Kandungan Dewasa/Terhad: Gunakan tab 'Pelayar' untuk log masuk ke akaun YouTube anda, kemudian cuba muat turun lagi.\n4. Semak Tetapan Proksi jika anda menggunakannya.",
            ts_restart: "Kenapa apl mula semula?",
            ts_restart_text: "Jika mesej 'Apl Mula Semula' muncul, anda mungkin berada dalam Mod Pembangun (Dev) dan menyimpan fail ke folder kod sumber. Ini mencetuskan muat semula panas (hot-reload). Dalam versi Rilis akhir, kelakuan ini dinyahaktifkan.",
            auth_guide: "Cara Muat Turun Kandungan Terhad",
            auth_guide_text: "Untuk memuat turun kandungan terhad umur/premium:\n1. Pastikan anda telah log masuk ke YouTube dalam Chrome atau Edge.\n2. Di Tetapan > Lanjutan > Sumber, pilih 'Gunakan Sesi Pelayar Sistem'.\n3. Apl akan meminjam sesi log masuk dari pelayar anda.\n\nNota: Berfungsi dengan kaedah Muat Turun Asli sahaja.",
            shortcuts: "Pintasan Papan Kekunci",
            shortcuts_list: "- **Ctrl + N**: Muat Turun Baru\n- **Ctrl + H**: Buka Sejarah\n- **Ctrl + ,**: Buka Tetapan\n- **Ruang (Space)**: Jeda/Sambung",
            replay_tour: "Ulangi Jelajah Aluan",
            visual_placeholder: "Demo Visual akan datang",
            sponsorblock: "Langkau Penaja (SponsorBlock)",
            sponsorblock_text: "Secara automatik membuang segmen tajaan, intro, dan outro.\n\n- Cara Kerja: Menggunakan data komuniti untuk mengesan dan membuang bahagian bukan kandungan.\n- Kategori: Anda boleh suaikan apa yang hendak dibuang di Tetapan > Lanjutan > SponsorBlock.\n- Nota: Ciri ini memerlukan pemprosesan semula video, jadi mungkin mengambil masa lebih lama.",
            got_it: "Faham!"
        }
    },
    context_menu: {
            back: "Kembali",
            refresh: "Muat Semula",
            home: "Laman Utama",
            copy: "Salin",
            paste: "Tampal",
            copy_link: "Salin Pautan",
            screenshot: "Tangkap Skrin",
            more_soon: "Lagi akan datang..."
        }
  },
  zh: {
    nav: {
      downloads: "下载",
      browser: "浏览器",
      settings: "设置",
      tools: "工具",
      terminal: "终端"
    },
    status: {
      missing: "缺少组件",
      downloading_bin: "正在下载组件...",
      ready: "就绪",
      repair: "下载组件",
      offline: "无网络连接",
      slow_connect: "网络连接可能较慢"
    },
    header: {
      title: "ClipScene",
    },
    downloads: {
      title: "下载列表",
      subtitle: "管理您的视频下载和剪辑。",
      new_download: "新建下载",
      open_file: "打开文件",
      open_folder: "打开文件夹",
      stop: "停止",
      clear: "清除",
      empty: "暂无下载。",
      headers: {
        title_url: "标题 / URL",
        status: "状态",
        progress: "进度",
        actions: "操作",
        eta: "剩余时间",
        clip: "片段"
      }
    },
    browser: {
      placeholder: "输入网址...",
      search_placeholder: "搜索或输入网站名称",
      download_this: "下载此视频"
    },
    settings: {
        title: "设置",
        save: "保存配置",
        saved: "已保存!",
        about: "关于",
        tabs: {
            general: "常规",
            downloads: "下载",
            network: "网络",
            advanced: "高级",
            guide: "指南",
            about: "关于"
        },
        general: {
            language_theme: "语言与主题",
            language: "界面语言",
            theme: "颜色主题",
            theme_dark: "深色模式",
            theme_light: "浅色模式",
            startup: "启动行为",
            launch_startup: "开机启动",
            start_minimized: "启动时最小化到托盘",
            close_action: "关闭按钮行为",
            minimize_tray: "最小化到托盘",
            quit_app: "退出应用"
        },
        downloads: {
            storage: "存储",
            path: "默认下载路径",
            change: "更改",
            always_ask: "总是询问保存位置",
            defaults: "默认值",
            filename_template: "文件名模板",
            available_vars: "可用变量: {title}, {width}, {height}, {ext}",
            resolution: "默认分辨率",
            container: "容器格式",
            best: "最佳可用",
            audio: "仅音频",
            metadata_title: "元数据 & 标签",
            embed_metadata: "嵌入元数据",
            embed_thumbnail: "嵌入缩略图"
        },
        network: {
            connection: "连接",
            concurrent: "同时下载数",
            warning_ip: "警告：过多的同时下载可能导致 IP 被封禁。",
            speed_limit: "速度限制",
            proxy: "代理 URL",
            turbo: "极速模式",
            turbo_desc: "使用多线程下载引擎以获得最大速度。"
        },
        advanced: {
            auth: "验证与 Cookie",
            source: "来源",
            use_browser: "使用内置浏览器会话",
            use_txt: "从 cookies.txt 加载",
            sponsorblock: "SponsorBlock",
            enable_sb: "启用 SponsorBlock",
            binary_paths: "二进制路径 (覆盖)",
            clear_cache: "清除缓存",
            post_action: "下载完成后动作",
            post_actions: {
                none: "无操作",
                sleep: "睡眠",
                shutdown: "关机"
            },
            danger_zone_proxy: "危险区域 (代理)",
            danger_zone_binaries: "危险区域 (二进制)",
            danger_desc: "更改这些路径可能会导致应用损坏。",
            redownload_ffmpeg: "重新下载 FFmpeg (强制)",
            redownload_help: "如果是 FFmpeg 损坏或缺少依赖项，请使用此功能。",
            confirm_redownload: "确定要强制重新下载 FFmpeg 吗？\\n\\n这将覆盖现有的 ‘ffmpeg.exe’，可能需要几分钟时间。"
        },
        updater: {
            title: "软件更新",
            subtitle: "管理核心组件 (yt-dlp)",
            latest: "您使用的是最新版本。",
            error: "版本检查失败。",
            checking: "检查中...",
            update_btn: "检查更新",
            updating: "更新中..."
        },
        setup: {
            title: "需额外设置",
            subtitle: "未找到 FFmpeg 和 yt-dlp。",
            desc: "下载视频需要两个核心组件。您想如何安装？",
            auto_btn: "自动下载",
            auto_badge: "推荐",
            auto_desc: "• 下载官方验证模块\n• 自动配置路径\n• 大小: ~80MB",
            manual_btn: "手动设置",
            manual_desc: "• 我已有文件\n• 复制粘贴指令\n• 可离线操作",
            disclaimer: "使用自动下载即表示您接受 FFmpeg 和 yt-dlp 的许可协议。"
        },
        about_page: {
            desc: "同类中最先进的 YouTube 下载器和剪辑器。",
            core: "核心引擎与致谢",
            yt_desc: "幕后的主力军。yt-dlp 是从数千个网站下载媒体的全球行业标准。",
            ff_desc: "多媒体的瑞士军刀。处理转换、音频/视频合成和精确剪辑。",
            aria_desc: "下载加速器。启用多线程连接（Turbo 模式）以获得最大速度。",
            tech_stack: "采用现代技术构建",
            react_desc: "用于构建用户界面的 JavaScript 库。用于动态和响应式的前端。",
            tauri_desc: "构建更小、更快、更清晰的应用程序。连接 Rust 后端与 Web 前端。",
            lucide_desc: "美观且一致的图标。为界面增添视觉清晰度和现代美感。",
            sb_desc: "一个众包平台，可自动跳过 YouTube 视频中的赞助片段。",
            legal: "法律免责声明",
            legal_text: "ClipSceneYT 仅供个人使用（存档、教育）。开发者与 YouTube/Google 无关。所有使用风险（包括侵犯版权或违反平台服务条款）均由用户自行承担。",
            secret_found: "发现秘密！",
            secret_desc: "您解锁了秘密开发者感谢徽章！",
            secret_sub: "（没有隐藏设置，纯粹为了好玩！）",
            awesome: "太棒了！"
        }
    },
    dialog: {
      title: "添加下载",
      url_label: "视频链接",
      format_label: "格式",
      folder_label: "保存路径",
      clip_label: "视频剪辑 (时间段)",
      enhancements_label: "高级功能",
      turbo_label: "极速模式 (多线程)",
      sponsor_label: "跳过赞助片段",
      cancel: "取消",
      download: "开始下载",
      preview: {
        failed: "预览失败",
        no_data: "无数据",
        instruction: "输入有效链接以查看预览"
      },
      formats: {
        best: "最佳视频 + 音频",
        audio_mp3: "音频 (MP3)",
        audio_wav: "音频 (WAV 无损)",
        gif: "动画 GIF（动图）"
      },
      trim_video: "裁剪视频",
      metadata_required: "滑块需要元数据",
      time_error: "开始时间必须在结束时间之前",
      restart: "重新开始"
    },
    updater_banner: {
        update_available: "yt-dlp 更新可用：",
        update_now: "立即更新",
        updating: "更新中..."
    },
    monitor: {
        title: "检测到链接",
        download: "下载",
        ignore: "忽略"
    },
    playlist: {
        title: "检测到播放列表",
        fetch: "获取播放列表",
        select_all: "全选",
        deselect_all: "取消全选",
        selected: "已选择",
        download_selected: "下载选中项",
        fetching: "正在获取播放列表信息...",
        error: "获取播放列表失败。"
    },
    history: {
        title: "历史记录",
        open_folder: "打开文件夹",
        play: "播放",
        clear: "清除历史",
        empty: "暂无下载历史。",
        delete_all: "全部删除",
        file_details: "文件详情",
        format: "格式",
        actions: "操作",
        file_not_found: "文件未找到。可能已被移动或删除。"
    },
    guide: {
        title: "完整用户手册",
        subtitle: "掌握 ClipSceneYT 所需的一切知识。",
        sections: {
            started: "快速入门",
            single: "如何下载视频",
            single_text: "1. 复制您想要下载的 YouTube 视频链接。\n2. 点击右上角的 (+) 按钮。\n3. 应用程序将自动检测剪贴板中的链接（Magic Paste）。\n4. 选择您需要的格式：\n   - 最佳视频+音频：最高可用质量 (MP4/WebM).\n   - 仅音频：转换为 MP3 或 WAV。\n   - GIF：创建短动画 GIF。\n5. 点击“下载”开始。",
            clipping: "视频剪辑 (Clipping)",
            clipping_text: "无需下载整个视频即可创建热门短片。\n\n使用方法：\n1. 打开“添加下载”对话框。\n2. 点击“视频剪辑” (Clip Range) 展开选项。\n3. 输入开始和结束时间（秒）。\n4. 点击下载。\n\n示例：\n- 开始：60（第1分钟）\n- 结束：120（第2分钟）\n应用程序将仅下载这 1 分钟的片段。",
            power: "高级功能",
            turbo: "极速模式 (多线程Turbo)",
            turbo_text: "极速模式使用类似 IDM/Aria2 的高性能自定义引擎。\n\n- 工作原理：将文件分成 8 个独立块（披萨切片）并同时下载。\n- 性能：与标准浏览器相比，速度可提高 10 倍。\n- 限制：如果您遇到 '403 Forbidden' 错误或立即失败，可能是 YouTube 因连接过多暂时封锁了您的 IP。请关闭极速模式以切换到“安全模式”（单线程）。",
            queue: "队列管理",
            queue_text: "“下载”标签页显示活动任务。“历史”标签页保存已完成的文件。\n- 并发：默认情况下，同时运行 3 个下载。您可以在 设置 > 网络 中更改此限制。\n- 如果下载失败或停止，请点击“继续”按钮从上次位置恢复。",
            renaming: "如何自动命名文件",
            renaming_text: "自定义文件的自动命名方式。\n前往 设置 > 下载 > 文件名模板。\n\n可用变量：\n- {title}: 视频标题\n- {uploader}: 频道名称\n- {id}: 唯一视频 ID\n- {ext}: 文件扩展名\n\n推荐格式：\n[{uploader}] {title}.{ext}",
            troubleshoot: "解决常见问题",
            ts_fail: "为什么下载失败？",
            ts_fail_text: "常见解决方案：\n1. 检查您的网络连接。\n2. 关闭极速模式：某些 ISP 或地区会阻止对 YouTube 的多线程连接。\n3. 年龄限制内容：使用“浏览器”标签页登录您的 YouTube 帐户，然后重试下载。\n4. 如果使用代理，请检查代理设置。",
            ts_restart: "为什么应用自动重启？",
            ts_restart_text: "如果看到“应用正在重启”消息，说明您可能处于开发模式 (Dev) 并将文件保存到了源代码文件夹。这会触发热重载 (Hot-reload)。在正式发布版本中，此行为已被禁用。",
            auth_guide: "如何下载年龄限制视频",
            auth_guide_text: "要下载年龄限制/会员内容：\n1. 请确保您已在 Chrome 或 Edge 浏览器中登录 YouTube。\n2. 在设置 > 高级 > 来源中，选择“使用系统浏览器会话”。\n3. 应用程序将借用您的浏览器登录会话进行下载。\n\n注意：仅适用于原生下载模式。",
            shortcuts: "键盘快捷键",
            shortcuts_list: "- **Ctrl + N**: 新建下载\n- **Ctrl + H**: 打开历史\n- **Ctrl + ,**: 打开设置\n- **空格**: 暂停/继续任务",
            replay_tour: "重播欢迎向导",
            visual_placeholder: "视觉演示即将推出",
            sponsorblock: "自动跳过赞助 (SponsorBlock)",
            sponsorblock_text: "自动跳过赞助片段、片头和片尾。\n\n- 工作原理：使用社区数据检测并移除视频中的非内容部分。\n- 分类：您可以在 设置 > 高级 > SponsorBlock 中自定义要跳过的内容。\n- 注意：此功能需要重新处理视频，因此完成时间可能会稍长。",
            got_it: "知道了!"
        }
    },
    context_menu: {
            back: "返回",
            refresh: "刷新",
            home: "主页",
            copy: "复制",
            paste: "粘贴",
            copy_link: "复制链接",
            screenshot: "截图",
            more_soon: "更多功能即将推出..."
        }
  }
}
