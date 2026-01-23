export const id = {
    nav: {
        downloads: "Unduhan",
        browser: "Browser",
        settings: "Pengaturan",
        tools: "Alat",
        terminal: "Terminal"
    },
    error_boundary: {
        title: "Ada yang salah nih.",
        reload: "Muat Ulang Aplikasi"
    },
    status: {
        missing: "Komponen Hilang",
        downloading_bin: "Mengunduh Komponen...",
        ready: "Siap",
        repair: "Unduh Komponen",
        offline: "Tidak Ada Koneksi Internet",
        slow_connect: "Koneksi mungkin lambat"
    },
    task_status: {
        pending: "Menunggu",
        fetching_info: "Mengambil Info",
        downloading: "Mengunduh",
        completed: "Selesai",
        error: "Gagal",
        stopped: "Berhenti",
        paused: "Jeda"
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
        empty: "Belum ada unduhan",
        empty_description: "Tempel link atau tekan Ctrl+N untuk mulai.",
        plus_more: "+1000 lainnya",
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
            general: "Tampilan",
            downloads: "Penyimpanan",
            quality: "Kualitas",
            network: "Jaringan",
            advanced: "Sistem",
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
            quit_app: "Keluar Aplikasi",
            font_size: "Ukuran Teks",
            font_small: "Kecil",
            font_medium: "Sedang",
            font_large: "Besar"
        },
        downloads: {
            storage: "Lokasi & File",
            path: "Folder Unduhan",
            change: "Ubah",
            always_ask: "Selalu tanya lokasi simpan",
            filename_template: "Aturan Nama File (Template)",
            available_vars: "Tersedia: {title}, {width}, {height}, {ext}",
            resolution: "Resolusi Default",
            container: "Kontainer (Format)",
            best: "Terbaik",
            audio: "Hanya Audio"
        },
        quality: {
            video: "Konten Video",
            audio: "Pemrosesan Audio",
            metadata: "Metadata & Tag",
            embed_metadata: "Sematkan Metadata",
            embed_thumbnail: "Sematkan Thumbnail",
            embed_chapters: "Sematkan Bab Video",
            audio_normalization: "Normalisasi Suara (Loudness)",
            sponsorblock: "SponsorBlock (Lewati Iklan)",
            enable_sb: "Aktifkan SponsorBlock",
            disable_play_button: "Sembunyikan Tombol Play di Riwayat"
        },
        network: {
            connection: "Kecepatan & Koneksi",
            concurrent: "Unduhan Bersamaan",
            warning_ip: "Peringatan: Terlalu banyak unduhan bisa memicu blokir IP.",
            speed_limit: "Batas Kecepatan Global",
            proxy: "Konfigurasi Proxy",
            concurrent_fragments: "Segmen Unduhan (Parallel)",
            perf_tuning: "Kekuatan Enjin Unduh:",
            perf_safe_title: "1-4 (Aman)",
            perf_safe_desc: "Terbaik untuk penggunaan umum dan unduhan stabil.",
            perf_fast_title: "5-8 (Cepat)",
            perf_fast_desc: "Disarankan untuk koneksi berkecepatan tinggi. Meningkatkan penggunaan CPU.",
            perf_aggressive_title: "9-16 (Agresif)",
            perf_aggressive_desc: "Throughput maksimum. Dapat menyebabkan ban IP sementara (429) jika disalahgunakan.",
            perf_warning: "* Berlaku untuk semua mode unduhan (Video Penuh, Audio, & Potong).",
            placeholders: {
                speed: "cth. 5M, 500K",
                proxy: "http://user:pass@host:port",
                ua: "Kosong = Default Chrome"
            },
            turbo: "Mode Turbo",
            turbo_desc: "Gunakan enjin muat turun berbilang thread untuk kelajuan maksimum."
        },
        advanced: {
            auth: "Otentikasi Browser",
            source: "Pilihan Sumber",
            use_browser: "Gunakan Sessi Browser Sistem (Cookies)",
            use_txt: "Muat dari cookies.txt (Manual)",
            binary_paths: "Jalur Integrasi",
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
            confirm_redownload: "Yakin ingin mengunduh ulang FFmpeg secara paksa?\\n\\nIni akan menimpa ‘ffmpeg.exe’ yang ada dan memakan waktu beberapa menit.",
            developer_tools: "Alat Pengembang",
            developer_mode: "Mode Pengembang",
            developer_mode_desc: "Tampilkan detail perintah pada setiap tugas unduhan",
            data_management: "Manajemen Data",
            export_history: "Ekspor Riwayat",
            export_desc: "Simpan riwayat unduhan Anda ke file JSON",
            export_btn: "Ekspor",
            import_history: "Impor Riwayat",
            import_desc: "Pulihkan tugas dari file cadangan",
            import_btn: "Impor",
            reset_defaults: "Reset ke Awal",
            alerts: {
                export_success: "Riwayat berhasil diekspor!",
                export_fail: "Gagal mengekspor riwayat: ",
                import_success: "Berhasil mengimpor {n} tugas!",
                import_fail: "Gagal mengimpor riwayat: ",
                invalid_backup: "Format file cadangan tidak valid",
                confirm_reset: "Anda yakin ingin mereset semua pengaturan ke default?"
            },
            errors: {
                open: "Buka Folder"
            },
            video_processing: {
                title: "Pemrosesan Video",
                hw_accel: "Akselerasi Hardware",
                hw_auto: "Otomatis (Disarankan)",
                hw_gpu: "Paksa GPU (NVENC/AMF/QSV)",
                hw_cpu: "Paksa CPU (Lambat tapi Aman)",
                hw_desc: "Mengontrol penggunaan kartu grafis untuk encoding video. 'Otomatis' akan beralih ke CPU jika GPU gagal."
            }
        },
        updater: {
            title: "Pembaruan Perangkat Lunak",
            subtitle: "Kelola binary inti (yt-dlp)",
            latest: "Anda menggunakan versi terbaru.",
            error: "Gagal cek versi.",
            checking: "Memeriksa...",
            update_btn: "Cek Pembaruan",
            updating: "Memperbarui...",
            binary_versions: "Versi Binari",
            check_updates: "Periksa pembaruan dari GitHub",
            current_ver: "Saat ini",
            not_checked: "Belum diperiksa",
            unknown: "Tidak diketahui",
            update_available: "Pembaruan Tersedia",
            up_to_date: "Sudah Terbaru",
            binary_bundled: "Binari dibundel sebagai sidecar. Pembaruan manual diperlukan jika usang."
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
            role_core: "Mesin Inti",
            role_media: "Pemrosesan Media",
            role_framework: "Kerangka Kerja",
            role_ui: "Pustaka UI",
            role_icon: "Ikonografi",
            role_api: "API skipSegments",
            visit_website: "Kunjungi Situs",
            legal: "Penafian Hukum",
            legal_text: "SceneClip adalah alat untuk penggunaan pribadi (pengarsipan, edukasi). Pengembang tidak berafiliasi dengan YouTube/Google. Segala risiko penggunaan, termasuk pelanggaran hak cipta atau ToS platform, adalah tanggung jawab penuh pengguna.",
            secret_found: "Rahasia Ditemukan!",
            secret_desc: "Anda membuka lencana apresiasi pengembang rahasia!",
            secret_sub: "(Tidak ada pengaturan tersembunyi, hanya suasana asik!)",
            awesome: "Mantap!"
        }
    },
    dialog: {
        title: "Tambah Unduhan",
        new_download: "Unduhan Baru",
        customize_download: "Kustomisasi Unduhan",
        download_all: "Unduh Semua",
        url_label: "URL Video",
        format_label: "Format",
        folder_label: "Folder Simpan",
        clip_label: "Potong Video (Klip)",
        enhancements_label: "Fitur Tambahan",
        help: {
            format_help: "Pilih 'Video' untuk gambar+suara, 'Audio' untuk musik saja, atau 'GIF' untuk animasi pendek tanpa suara.",
            mp4_help: "MP4 paling aman untuk semua HP/TV. MKV lebih tahan banting (tidak korup jika download putus) tapi tidak semua player mendukung.",
            codec_help: "'H.264' kompatibel dengan semua alat. 'AV1' hemat kuota & jernih tapi butuh HP/PC baru. 'Auto' biarkan kami memilihkan.",
            audio_help: "320kbps adalah kualitas studio (terbaik). 128kbps standar YouTube biasa.",
            sponsor_help: "Otomatis memotong bagian 'Jangan lupa subscribe' atau iklan sponsor di dalam video.",
            clip_help: "Gunakan fitur Gunting ini jika Anda hanya ingin mengambil momen lucu (misal: menit 01:00 sampai 01:30) agar hemat kuota."
        },
        turbo_label: "Mode Turbo (Multi-thread)",
        sponsor_label: "Hapus Sponsor",
        cancel: "Batal",
        download: "Unduh",
        remove_sponsors: "Hapus Sponsor",
        remove_sponsors_desc: "Lewati intro, outro, & iklan dalam video secara otomatis",
        loudness_normalization: "Normalisasi Kekerasan (Loudness)",
        loudness_desc: "Standar EBU R128",
        subtitles_title: "Subtitle",
        subtitles_desc: "Unduh & sematkan takarir",
        subtitle_safe_mode_title: "Safe Mode Aktif",
        subtitle_safe_mode_desc: "Unduhan akan JAUH LEBIH LAMA demi menghindari blokir YouTube (HTTP 429). Mohon bersabar.",
        schedule_download: "Jadwalkan Unduhan",
        schedule_desc: "Mulai tugas secara otomatis di lain waktu",
        live_from_start: "Live dari Awal",
        live_from_start_desc: "Unduh livestream dari awal",
        split_chapters: "Pisah Bab",
        split_chapters_desc: "File video terpisah per bab",
        sponsor_clip_conflict: "Tidak tersedia saat memotong",
        video_codec: "Codec Video",
        codec_desc: "AV1 terbaik, H264 paling kompatibel",
        subtitle_settings: "Pengaturan Subtitle",
        schedule_time: "Waktu Jadwal",
        embed_subs: "Sematkan ke file video",
        estimated_size: "Perkiraan Ukuran",
        trimmed: "DIPOTONG",
        pick_date: "Pilih tanggal...",
        set_time_next: "Atur Waktu Berikutnya",
        calendar: "Kalender",
        time: "Waktu",
        done: "Selesai",
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
        quality_profiles: {
            highest_quality: "Kualitas Tertinggi",
            standard: "Standar",
            ultra_hd: "Ultra HD",
            qhd: "QHD",
            full_hd: "Full HD",
            hd: "HD",
            data_saver: "Hemat Data"
        },
        audio_extraction: {
            title: "Ekstraksi Audio",
            desc_auto: "Ekstraksi performa tinggi ke MP3. Bitrate dideteksi dari video sumber.",
            desc_manual: "Ekstraksi performa tinggi ke MP3. Pilih target kualitas bitrate."
        },
        labels: {
            quality_profile: "Profil Kualitas",
            fmt: "Fmt:",
            bitrate_quality: "Kualitas Bitrate"
        },
        trim_video: "Potong Video",
        trim_audio: "Potong Audio",
        trim_desc: "Potong bagian spesifik video",
        metadata_required: "Metadata diperlukan untuk slider",
        time_error: "Waktu mulai harus sebelum waktu selesai",

        // Tab labels
        tabs: {
            video: "Video",
            audio: "Audio",
            gif: "GIF"
        },

        // GIF section
        gif_maker: {
            title: "Pembuat GIF Berkualitas Tinggi",
            desc: "Buat GIF halus dan jernih menggunakan pembuatan palet. Sempurna untuk meme dan klip reaksi.",
            note: "(Catatan: Proses lebih lama dari unduhan video standar)",
            trim_required: "Potong Diperlukan",
            max_duration: "Maks 30d",
            trim_desc: "Format GIF memerlukan pemotongan. Pilih klip pendek (maks 30 detik) untuk hasil terbaik.",
            too_long: "Klip terlalu panjang! Maks {max}d untuk GIF. Saat ini: {current}d"
        },

        // Clip section
        clip: {
            duration: "Durasi klip: {current}d",
            duration_max: "Durasi klip: {current}d / {max}d maks",
            to: "KE"
        },

        // Codec
        codec: {
            label: "Codec",
            auto_desc: "Otomatis Terbaik",
            h264: "H.264 bisa diputar di mana saja.",
            hevc: "Efisiensi Tinggi (H.265)",
            vp9: "Standar YouTube (4K)",
            av1: "AV1 hemat kuota (Next-Gen).",
            warning_title: "Re-encoding Diperlukan",
            warning_desc: "Sumber tidak memiliki {codec}. Kualitas mungkin turun & proses lebih lama."
        },

        // Bagian UI Baru
        gif_options: {
            res_title: "Resolusi (Ukuran)",
            res_desc: "Resolusi kecil membuat GIF lebih ringan dikirim.",
            fps_title: "Frame Rate (FPS)",
            fps_desc: "FPS tinggi gerakan halus tapi file besar.",
            quality_title: "Mode Kualitas",
            quality_high: "Tinggi (Palette Gen)",
            quality_fast: "Cepat (Normal)",

            // Opsi
            res_original: "Asli",
            res_social: "Sosial (480p)",
            res_sticker: "Stiker (320p)",

            fps_smooth: "Halus (30fps)",
            fps_standard: "Standar (15fps)",
            fps_lite: "Hemat (10fps)"
        },
        video_quality: {
            title: "Kualitas Video",
            desc: "Makin tinggi kualitas, makin besar ukuran file."
        },
        output_format: {
            title: "Format Output",
            desc_mp4: "Universal (Terbaik untuk TV/HP)",
            desc_mkv: "Canggih (Subs/Multi-Audio)",
            desc_webm: "Standar Web Google",
            desc_mov: "Pilih untuk diedit di video editor",
            desc_default: "Pilih Format"
        },
        audio_options: {
            title: "Format Audio",
            desc_mp3: "Universal (Musik/Podcast)",
            desc_m4a: "Efisien (Apple/Mobile)",
            desc_flac: "Lossless (Audiophile)",
            desc_wav: "Uncompressed (Editing)",
            desc: "Bitrate tinggi = detail suara lebih jernih.",
            upscale_title: "Peringatan Upscaling",
            upscale_desc: "Sumber terkompresi (Lossy). Mengubah ke {fmt} memperbesar file tapi TIDAK kualitas.",
            reencode_title: "Re-encoding",
            reencode_desc: "Konversi ke {fmt} diperlukan."
        },
        compress: {
            title_video: "Kompres Video",
            title_audio: "Kompres Audio",
            title_image: "Kompres Gambar/GIF",
            preset_wa: "WhatsApp / Discord",
            preset_wa_desc: "Ukuran Terkecil",
            preset_wa_desc_audio: "Suara (64kbps)",
            preset_social: "Sosial Media",
            preset_social_desc: "Kualitas Seimbang",
            preset_social_desc_audio: "Standar (128kbps)",
            preset_archive: "Arsip / High",
            preset_archive_desc: "Kualitas Terbaik",
            preset_archive_desc_audio: "Tinggi (320kbps)",
            advanced: "Pengaturan Lanjutan",
            original_size: "Ukuran Asli",
            format: "Format",
            lbl_resolution: "Batas Resolusi",
            lbl_quality: "Kualitas (CRF)",
            lbl_encoder: "Encoder (Hardware)",
            lbl_speed: "Kecepatan Encode",
            lbl_bitrate: "Bitrate Audio",
            btn_cancel: "Batal",
            btn_start: "Mulai Kompresi",

            // File validation
            file_missing: "File Tidak Ditemukan",
            file_missing_desc: "File asli telah dipindahkan atau dihapus.",
            browse_file: "Telusuri...",
            file_relocated: "Path file berhasil diperbarui",
            double_compression_warning: "File ini sepertinya sudah dikompres. Kompres ulang akan menurunkan kualitas secara signifikan."
        },
        logic_warnings: {
            mov_reencode: "Format <strong>.MOV</strong> dengan <strong>{codec}</strong> butuh re-encode. Proses akan lebih lama."
        },

        restart: "Mulai Ulang",
        filename_label: "Nama File",
        filename_placeholder: "Nama file kustom (opsional)"
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
        file_not_found: "File gak ketemu. Mungkin udah dipindah atau dihapus.",
        search_placeholder: "Cari riwayat...",
        filter_date: "Tanggal",
        filter_size: "Ukuran",
        filter_source: "Sumber",
        sort_asc: "Terlama",
        sort_desc: "Terbaru",
        scan_files: "Pindai File",
        scan_missing_files: "Pindaian Selesai: {count} file hilang ditemukan",
        scan_healthy_files: "Pindaian Selesai: Semua file sehat",
        recover: "Pulihkan File",
        find_on_disk: "Cari di Disk",
        redownload: "Unduh Ulang Konten"
    },
    guide: {
        title: "Panduan Pengguna",
        subtitle: "Kuasai SceneClip dalam hitungan menit.",
        menu: {
            start: "Mulai (Getting Started)",
            clip: "Clipping & Edit",
            advanced: "Lanjutan",
            faq: "Masalah Umum"
        },
        steps: {
            smart: {
                title: "Deteksi Pintar",
                desc: "Copy link, dan SceneClip akan mendeteksinya otomatis."
            },
            clip: {
                title: "Pemotongan Presisi",
                desc: "Hemat data! Download hanya bagian yang kamu butuhkan."
            },
            format: {
                title: "Pilih Format",
                desc: "4K Video, Audio MP3 Jernih, atau GIF Instan."
            },
            terminal: {
                title: "Terminal & Log",
                desc: "Download gagal? Cek tab Terminal untuk diagnosa."
            }
        },
        sections: {
            started: "Mulai Cepat",
            single: "Paste & Download",
            single_text: "1. Salin URL video.\n2. Klik (+) atau tekan Ctrl+N.\n3. Aplikasi mendeteksi link otomatis.\n4. Pilih format dan klik Download.",
            clipping: "Potong Klip",
            clipping_text: "Unduh bagian yang penting saja.\n1. Buka Dialog Tambah.\n2. Buka 'Potong Video'.\n3. Atur waktu Mulai/Selesai (cth. 10 sampai 60).\n4. Unduh segmen tersebut.",
            power: "Fitur Lanjutan",
            turbo: "Mode Turbo",
            turbo_text: "Unduhan multi-thread aktif secara default untuk kecepatan maksimal.",
            queue: "Sistem Antrean",
            queue_text: "Unduhan diantrekan otomatis. Batas default 3 tugas bersamaan (Bisa diatur di Pengaturan).",
            renaming: "Penamaan Pintar",
            renaming_text: "Kustomisasi nama file di Pengaturan > Unduhan.\nVariabel: {title}, {uploader}, {id}, {width}, {height}.",
            troubleshoot: "Pemecahan Masalah",
            ts_fail: "Unduhan Gagal?",
            ts_fail_text: "- Cek internet.\n- Cek penyimpanan.\n- Coba lagi biasanya berhasil.",
            ts_restart: "Reset Pengaturan",
            ts_restart_text: "Pengaturan > Lanjutan > Reset ke Awal.",
            auth_guide: "Konten Terbatas",
            auth_guide_text: "Gunakan 'Sessi Browser Sistem' di Pengaturan untuk mengunduh video terbatas umur menggunakan cookies browser Anda.",
            shortcuts: "Pintasan Keyboard",
            shortcuts_list: "- **Ctrl + N**: Unduhan Baru\n- **Ctrl + ,**: Pengaturan\n- **Ctrl + H**: Riwayat\n- **Ctrl + D**: Tampilan Unduhan\n- **F11**: Layar Penuh\n- **Esc**: Tutup Dialog",
            shortcuts_fullscreen: "Layar Penuh",
            replay_tour: "Ulangi Tur",
            visual_placeholder: "Demo Visual segera hadir",
            sponsorblock: "SponsorBlock",
            sponsorblock_text: "Lewati segmen non-konten seperti intro dan sponsor secara otomatis.",
            got_it: "Tutup Panduan"
        }
    },
    notifications: {
        title: "Notifikasi",
        empty: "Belum ada notifikasi",
        clear_all: "Hapus Semua",
        dismiss: "Tutup"
    },

    logs: {
        download_complete: "Unduhan Selesai: {{id}}",
        download_started: "Unduhan Dimulai: {{id}}",
        binary_error: "Cek Binari Gagal"
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
    },
    statusbar: {
        idle: "Idle",
        active: "Aktif",
        queued: "antrean",
        nvidia_gpu: "GPU Nvidia",
        amd_gpu: "GPU AMD",
        intel_gpu: "GPU Intel",
        apple_gpu: "GPU Apple",
        cpu_mode: "Mode CPU",
        auto_cpu: "Auto (CPU)",
        forced: "Paksa",
        cpu_usage: "Penggunaan CPU",
        ram_usage: "RAM",
        disk_free: "Ruang Disk",
        download_speed: "Kecepatan Unduh",
        upload_speed: "Kecepatan Unggah",
        active_downloads: "Unduhan Aktif",
        hw_accel: "Akselerasi Hardware",
        app_version: "Versi Aplikasi",
        open_folder: "Buka Folder Unduhan",
        stats_unavailable: "Statistik sistem tidak tersedia",
        storage_devices: "Perangkat Penyimpanan",
        available: "kosong"
    },
    errors: {
        system_action: "Aksi sistem gagal: {action}",
        listener_attach: "Gagal menghubungkan pendengar unduhan",
        binary_validation: "Validasi biner gagal",
        update_check: "Gagal memeriksa pembaruan",
        binary_crash: "Kesalahan Biner Kritis",
        copy_logs: "Gagal menyalin log",
        copy_line: "Gagal menyalin baris",
        path_empty: "Path kosong",
        access_denied: "Akses Ditolak",
        access_desc: "Izin ditolak.",
        folder_not_found: "Folder Tidak Ditemukan",
        folder_desc: "Direktori sudah tidak ada.",
        file_desc: "File mungkin telah dipindah atau dihapus.",
        open_folder: "Buka Folder"
    },
    all: "Semua",
    video: "Video",
    audio: "Audio"
}
