export const ms = {
    nav: {
      downloads: "Muat Turun",
      browser: "Pelayar",
      settings: "Tetapan",
      tools: "Alatan",
      terminal: "Terminal"
    },
    error_boundary: {
        title: "Ada masalah berlaku.",
        reload: "Muat Semula Apl"
    },
    status: {
      missing: "Komponen Hilang",
      downloading_bin: "Sedang Memuat Turun Komponen...",
      ready: "Sedia",
      repair: "Muat Turun Komponen",
      offline: "Tiada Sambungan Internet",
      slow_connect: "Sambungan mungkin perlahan"
    },
    task_status: {
        pending: "Menunggu",
        fetching_info: "Mengambil Maklumat",
        downloading: "Memuat Turun",
        completed: "Selesai",
        error: "Ralat",
        stopped: "Berhenti",
        paused: "Jeda"
    },
    header: {
      title: "SceneClip",
    },
    downloads: {
      title: "Senarai Muat Turun",
      subtitle: "Urus muat turunan video dan klip anda.",
      new_download: "Muat Turun Baru",
      open_file: "Buka Fail",
      open_folder: "Buka Folder",
      stop: "Berhenti",
      clear: "Kosongkan",
      empty: "Tiada muat turun lagi",
      empty_description: "Tampal pautan atau tekan Ctrl+N untuk mula.",
      plus_more: "+1000 lagi",
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
            quit_app: "Keluar Aplikasi",
            low_perf_mode: "Mod Prestasi Rendah",
            low_perf_desc: "Lumpuhkan semua animasi untuk menjimatkan bateri",
            font_size: "Saiz Teks",
            font_small: "Kecil",
            font_medium: "Sederhana",
            font_large: "Besar"
        },
        downloads: {
            behavior: "Kelakuan",
            quick_mode: "Mod Pantas",
            quick_mode_desc: "Guna tetapan terakhir untuk muat turun terus tanpa dialog",
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
            embed_thumbnail: "Benamkan Gambar Kecil",
            disable_play_button: "Lumpuhkan Butang Main"
        },
        network: {
            connection: "Sambungan",
            concurrent: "Muat Turun Serentak",
            warning_ip: "Amaran: Terlalu banyak muat turun serentak boleh menyebabkan IP disekat.",
            speed_limit: "Had Kelajuan",
            proxy: "URL Proksi",
            user_agent: "Aktifkan Mod Penyamar (Ejen Pengguna)",
            ua_desc: "Menyamar sebagai Chrome untuk elakkan ralat 429.",
            concurrent_fragments: "Pecahan Serentak",
            perf_tuning: "Penalaan Prestasi:",
            perf_safe_title: "1-4 (Selamat)",
            perf_safe_desc: "Terbaik untuk kegunaan umum dan muat turun stabil.",
            perf_fast_title: "5-8 (Pantas)",
            perf_fast_desc: "Disyorkan untuk sambungan berkelajuan tinggi. Meningkatkan penggunaan CPU.",
            perf_aggressive_title: "9-16 (Agresif)",
            perf_aggressive_desc: "Daya pemprosesan maksimum. Boleh menyebabkan sekatan IP sementara (429) jika disalahgunakan.",
            perf_warning: "* Terpakai untuk semua mod muat turun (Video Penuh, Audio, & Potong).",
             placeholders: {
                speed: "cth. 5M, 500K",
                proxy: "http://user:pass@host:port",
                ua: "Kosong = Lalai Chrome"
            },
            turbo: "Mod Turbo",
            turbo_desc: "Gunakan enjin muat turun berbilang thread untuk kelajuan maksimum."
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
            confirm_redownload: "Anda pasti mahu memuat turun semula FFmpeg?\\n\\nIni akan menimpa ‘ffmpeg.exe’ sedia ada.",
            developer_tools: "Alatan Pembangun",
            developer_mode: "Mod Pembangun",
            developer_mode_desc: "Tunjukkan butiran arahan pada setiap tugasan muat turun",
            data_management: "Pengurusan Data",
            export_history: "Eksport Sejarah",
            export_desc: "Simpan sejarah muat turun anda ke fail JSON",
            export_btn: "Eksport",
            import_history: "Import Sejarah",
            import_desc: "Pulihkan tugasan daripada fail sandaran",
            import_btn: "Import",
            reset_defaults: "Tetapkan Semula",
            alerts: {
                export_success: "Sejarah berjaya dieksport!",
                export_fail: "Gagal mengeksport sejarah: ",
                import_success: "Berjaya mengimport {n} tugasan!",
                import_fail: "Gagal mengimport sejarah: ",
                invalid_backup: "Format fail sandaran tidak sah",
                confirm_reset: "Adakah anda pasti mahu menetapkan semula semua tetapan kepada lalai?"
            },
            errors: {
                access_denied: "Akses Ditolak",
                access_desc: "Kebenaran ditolak.",
                folder_not_found: "Folder Tidak Dijumpai",
                folder_desc: "Direktori tidak wujud.",
                file_desc: "Fail mungkin telah dialihkan atau dipadam.",
                open_folder: "Buka Folder"
            },
             video_processing: {
                title: "Pemprosesan Video",
                hw_accel: "Pecutan Perkakasan",
                hw_auto: "Auto (Disyorkan)",
                hw_gpu: "Paksa GPU (NVENC/AMF/QSV)",
                hw_cpu: "Paksa CPU (Perlahan tapi Selamat)",
                hw_desc: "Kawal penggunaan kad grafik untuk pengekodan video. 'Auto' akan kembali ke CPU jika GPU gagal."
            }
        },
        updater: {
            title: "Kemas Kini Perisian",
            subtitle: "Urus binari teras (yt-dlp)",
            latest: "Anda menggunakan versi terkini.",
            error: "Semakan versi gagal.",
            checking: "Memeriksa...",
            update_btn: "Semak Kemas Kini",
            updating: "Sedang Mengemas Kini...",
            binary_versions: "Versi Binari",
            check_updates: "Semak kemas kini dari GitHub",
            current_ver: "Semasa",
            not_checked: "Belum disemak",
            unknown: "Tidak diketahui",
            update_available: "Kemas Kini Tersedia",
            up_to_date: "Terkini",
            binary_bundled: "Binari dibundel sebagai sidecar. Kemas kini manual diperlukan jika usang."
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
            role_core: "Enjin Teras",
            role_media: "Pemprosesan Media",
            role_framework: "Rangka Kerja",
            role_ui: "UI Library",
            role_icon: "Ikonografi",
            role_api: "API skipSegments",
            visit_website: "Lawati Laman Web",
            legal: "Penafian Undang-undang",
            legal_text: "SceneClip bertujuan untuk kegunaan peribadi sahaja (cth., mengarkib kandungan sendiri, penggunaan adil pendidikan, atau kandungan creative commons). Pembangun tidak bertanggungjawab atas sebarang penyalahgunaan perisian ini atau pelanggaran hak cipta yang dilakukan oleh pengguna. Memuat turun bahan berhak cipta tanpa kebenaran adalah melanggar Syarat Perkhidmatan YouTube.",
            secret_found: "Rahsia Ditemui!",
            secret_desc: "Anda membuka lencana penghargaan pembangun rahsia!",
            secret_sub: "(Tiada tetapan tersembunyi, hanya suasana baik!)",
            awesome: "Hebat!"
        }
    },
    dialog: {
      title: "Tambah Muat Turun",
      new_download: "Muat Turun Baru",
      customize_download: "Sesuaikan Muat Turun",
      download_all: "Muat Turun Semua",
      url_label: "URL Video",
      format_label: "Format",
      folder_label: "Folder Simpan",
      clip_label: "Potong Video (Klip)",
      enhancements_label: "Ciri Tambahan",
      help: {
        format_help: "Pilih 'Video' untuk gambar+bunyi, 'Audio' untuk muzik sahaja, atau 'GIF' untuk animasi pendek senyap.",
        mp4_help: "MP4 paling selamat untuk semua peranti/TV. MKV lebih tahan lasak (tak rosak jika muat turun terputus) tapi bukan semua pemain sokong.",
        codec_help: "'H.264' serasi dengan semua alat. 'AV1' jimat data & lebih jelas tapi perlukan telefon/PC baru. 'Auto' biar kami pilihkan.",
        audio_help: "320kbps adalah kualiti studio (terbaik). 128kbps standard biasa YouTube.",
        sponsor_help: "Secara automatik memotong bahagian 'Jangan lupa subscribe' atau iklan penaja dalam video.",
        clip_help: "Gunakan ciri Gunting ini jika anda hanya mahu ambil momen lucu (contoh: minit 01:00 hingga 01:30) untuk jimat data."
      },
      turbo_label: "Mod Turbo",
      sponsor_label: "Buang Penaja",
      cancel: "Batal",
      download: "Muat Turun",
      remove_sponsors: "Buang Penaja",
      remove_sponsors_desc: "Langkau intro, outro, & iklan dalam video secara automatik",
      loudness_normalization: "Penormalan Kelantangan",
      loudness_desc: "Piawaian EBU R128",
      subtitles_title: "Sarikata",
      subtitles_desc: "Muat turun & benamkan kapsyen",
      subtitle_safe_mode_title: "Mod Selamat Aktif",
      subtitle_safe_mode_desc: "Muat turun akan menjadi LEBIH LAMBAT untuk mengelakkan sekatan YouTube (HTTP 429). Harap bersabar.",
      schedule_download: "Jadualkan Muat Turun",
      schedule_desc: "Mula tugasan secara automatik pada masa akan datang",
      live_from_start: "Live dari Mula",
      live_from_start_desc: "Muat turun siaran langsung dari awal",
      split_chapters: "Pisah Bab",
      split_chapters_desc: "Fail video berasingan bagi setiap bab",
      subtitle_settings: "Tetapan Sarikata",
      schedule_time: "Masa Jadual",
      embed_subs: "Benamkan ke dalam fail video",
      estimated_size: "Anggaran Saiz",
      trimmed: "DIPOTONG",
      pick_date: "Pilih tarikh...",
      set_time_next: "Tetapkan Masa Seterusnya",
      calendar: "Kalendar",
      time: "Masa",
      done: "Selesai",
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
       quality_profiles: {
          highest_quality: "Kualiti Tertinggi",
          standard: "Standard",
          ultra_hd: "Ultra HD",
          qhd: "QHD",
          full_hd: "Full HD",
          hd: "HD",
          data_saver: "Jimat Data"
      },
      audio_extraction: {
          title: "Pengekstrakan Audio",
          desc_auto: "Pengekstrakan prestasi tinggi ke MP3. Kadar bit dikesan dari video sumber.",
          desc_manual: "Pengekstrakan prestasi tinggi ke MP3. Pilih kualiti kadar bit sasaran."
      },
      labels: {
          quality_profile: "Profil Kualiti",
          fmt: "Fmt:",
          bitrate_quality: "Kualiti Kadar Bit"
      },
      trim_video: "Potong Video",
      trim_audio: "Potong Audio",
      trim_desc: "Potong bahagian spesifik video",
      metadata_required: "Metadata diperlukan untuk peluncur",
      time_error: "Masa mula mesti sebelum masa tamat",
      
      // Tab labels
      tabs: {
        video: "Video",
        audio: "Audio", 
        gif: "GIF"
      },
      
      // GIF section
      gif_maker: {
        title: "Pembuat GIF Berkualiti Tinggi",
        desc: "Cipta GIF licin dan jelas menggunakan penjanaan palet. Sesuai untuk meme dan klip reaksi.",
        note: "(Nota: Proses mengambil masa lebih lama daripada muat turun video standard)",
        trim_required: "Potong Diperlukan",
        max_duration: "Maks 30s",
        trim_desc: "Format GIF memerlukan pemotongan. Pilih klip pendek (maks 30 saat) untuk hasil terbaik.",
        too_long: "Klip terlalu panjang! Maks {max}s untuk GIF. Semasa: {current}s"
      },
      
      // Clip section
      clip: {
        duration: "Tempoh klip: {current}s",
        duration_max: "Tempoh klip: {current}s / {max}s maks",
        to: "KE"
      },
      
      // Codec
      codec: {
        label: "Codec",
        auto_desc: "Kualiti Terbaik Auto",
        h264: "H.264 main di mana-mana.",
        hevc: "Kecekapan Tinggi (H.265)",
        vp9: "Piawaian YouTube (4K)",
        av1: "AV1 jimat ruang (Generasi Seterusnya).",
        warning_title: "Polengkodan Semula Diperlukan",
        warning_desc: "Sumber tiada {codec}. Kualiti mungkin turun sedikit & muat turun lebih lama."
      },
      
      // Bagian UI Baru
      gif_options: {
        res_title: "Resolusi (Saiz)",
        res_desc: "Resolusi kecil membuat GIF lebih ringan dikongsi.",
        fps_title: "Kadar Bingkai (FPS)",
        fps_desc: "FPS tinggi gerakan lancar tapi fail besar.",
        quality_title: "Mod Kualiti",
        quality_high: "Tinggi (Palette Gen)",
        quality_fast: "Pantas (Normal)",
        
        // Opsi
        res_original: "Asal",
        res_social: "Sosial (480p)",
        res_sticker: "Pelekat (320p)",
        
        fps_smooth: "Lancar (30fps)",
        fps_standard: "Standard (15fps)",
        fps_lite: "Ringan (10fps)"
      },
      video_quality: {
          title: "Kualiti Video",
          desc: "Kualiti lebih tinggi bermakna saiz fail lebih besar."
      },
      output_format: {
          title: "Format Output",
          desc_mp4: "Universal (Terbaik untuk TV/Telefon)",
          desc_mkv: "Lanjutan (Sarikata/Audio Pelbagai)",
          desc_webm: "Piawaian Web Google",
          desc_mov: "Pilih berdasarkan editor video anda",
          desc_default: "Pilih Format"
      },
      audio_options: {
          title: "Format Audio",
          desc_mp3: "Universal (Muzik/Podcast)",
          desc_m4a: "Cekap (Apple/Mudah Alih)",
          desc_flac: "Lossless (Audiophile)",
          desc_wav: "Tidak Dimampatkan (Editor)",
          desc: "Kadar bit lebih tinggi bermakna butiran bunyi lebih jelas.",
          upscale_title: "Amaran Upscaling",
          upscale_desc: "Sumber mampat (Lossy). Menukar ke {fmt} menambah saiz fail tapi BUKAN kualiti.",
          reencode_title: "Pengekodan Semula",
          reencode_desc: "Penukaran ke {fmt} diperlukan."
      },
      compress: {
        title_video: "Kompres Video",
        title_audio: "Kompres Audio",
        title_image: "Kompres Imej/GIF",
        preset_wa: "WhatsApp / Discord",
        preset_wa_desc: "Saiz Paling Kecil",
        preset_wa_desc_audio: "Suara (64kbps)",
        preset_social: "Media Sosial",
        preset_social_desc: "Kualiti Seimbang",
        preset_social_desc_audio: "Standard (128kbps)",
        preset_archive: "Arkib / Tinggi",
        preset_archive_desc: "Kualiti Terbaik",
        preset_archive_desc_audio: "Tinggi (320kbps)",
        advanced: "Tetapan Lanjutan",
        original_size: "Saiz Asal",
        format: "Format",
        lbl_resolution: "Had Resolusi",
        lbl_quality: "Kualiti (CRF)",
        lbl_encoder: "Encoder (Perkakasan)",
        lbl_speed: "Kelajuan Encode",
        lbl_bitrate: "Kadar Bit Audio",
        btn_cancel: "Batal",
        btn_start: "Mulai Kompresi",
        
        // File validation
        file_missing: "Fail Tidak Ditemui",
        file_missing_desc: "Fail asal telah dialihkan atau dipadam.",
        browse_file: "Layari...",
        file_relocated: "Laluan fail berjaya dikemas kini",
        double_compression_warning: "Fail ini nampaknya sudah dimampatkan. Memampatkannya lagi akan mengurangkan kualiti secara ketara."
      },
      logic_warnings: {
          mov_reencode: "Format <strong>.MOV</strong> dengan <strong>{codec}</strong> memerlukan pengekodan semula. Ini mungkin ambil masa lebih lama."
      },

      restart: "Mula Semula",
      filename_label: "Nama Fail",
      filename_placeholder: "Nama fail tersuai (pilihan)"
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
        file_not_found: "Fail tidak dijumpai. Mungkin telah dialihkan atau dipadam.",
        search_placeholder: "Cari sejarah...",
        filter_date: "Tarikh",
        filter_size: "Saiz",
        filter_source: "Sumber",
        sort_asc: "Paling Lama",
        sort_desc: "Paling Baru",
        scan_files: "Imbas Fail"
    },
    guide: {
        title: "Manual Lengkap",
        subtitle: "Segala ilmu yang anda perlukan untuk menguasai SceneClip.",
        menu: {
            start: "Bermula",
            clip: "Clipping & Edit",
            perf: "Prestasi",
            advanced: "Lanjutan",
            faq: "Masalah Lazim"
        },
        steps: {
            smart: {
                title: "Pengesanan Pintar",
                desc: "Salin pautan, dan SceneClip akan mengesannya secara automatik."
            },
            clip: {
                title: "Potongan Tepat",
                desc: "Jimat data! Muat turun bahagian yang anda perlukan sahaja."
            },
            format: {
                title: "Pilih Format",
                desc: "Video 4K, Audio MP3 Jelas, atau GIF Segera."
            },
            perf: {
                title: "Mod Prestasi Rendah",
                desc: "PC perlahan? Hidupkan 'Low Performance Mode' (Ikon Kilat)."
            },
            terminal: {
                title: "Terminal & Log",
                desc: "Muat turun gagal? Semak tab Terminal untuk log ralat."
            }
        },
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
            shortcuts_list: "- **Ctrl + N**: Muat Turun Baru\n- **Ctrl + ,**: Tetapan\n- **Ctrl + H**: Sejarah\n- **Ctrl + D**: Paparan Muat Turun\n- **F11**: Skrin Penuh\n- **Esc**: Tutup Dialog",
            shortcuts_fullscreen: "Skrin Penuh",
            replay_tour: "Ulangi Jelajah Aluan",
            visual_placeholder: "Demo Visual akan datang",
            sponsorblock: "Langkau Penaja (SponsorBlock)",
            sponsorblock_text: "Secara automatik membuang segmen tajaan, intro, dan outro.\n\n- Cara Kerja: Menggunakan data komuniti untuk mengesan dan membuang bahagian bukan kandungan.\n- Kategori: Anda boleh suaikan apa yang hendak dibuang di Tetapan > Lanjutan > SponsorBlock.\n- Nota: Ciri ini memerlukan pemprosesan semula video, jadi mungkin mengambil masa lebih lama.",
            got_it: "Faham!"
        }
    },
    notifications: {
        title: "Pemberitahuan",
        empty: "Tiada pemberitahuan lagi",
        clear_all: "Kosongkan Semua",
        dismiss: "Tutup"
    },
    logs: {
        download_complete: "Muat Turun Selesai: {{id}}",
        download_started: "Muat Turun Bermula: {{id}}",
        binary_error: "Semakan Binari Gagal"
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
        },
    statusbar: {
      idle: "Senyap",
      active: "Aktif",
      queued: "beratur",
      nvidia_gpu: "GPU Nvidia",
      amd_gpu: "GPU AMD",
      intel_gpu: "GPU Intel",
      apple_gpu: "GPU Apple",
      cpu_mode: "Mod CPU",
      auto_cpu: "Auto (CPU)",
      forced: "Paksa",
      cpu_usage: "Penggunaan CPU",
      ram_usage: "RAM",
      disk_free: "Ruang Cakera",
      download_speed: "Kelajuan Muat Turun",
      upload_speed: "Kelajuan Muat Naik",
      active_downloads: "Muat Turun Aktif",
      hw_accel: "Pecutan Perkakasan",
      app_version: "Versi Aplikasi",
      open_folder: "Buka Folder Muat Turun",
      stats_unavailable: "Statistik sistem tidak tersedia",
      storage_devices: "Peranti Penyimpanan",
      available: "kosong"
    },
        errors: {
            system_action: "Tindakan sistem gagal: {action}",
            listener_attach: "Gagal melampirkan pendengar muat turun",
            binary_validation: "Pengesahan binari gagal",
            update_check: "Gagal menyemak kemas kini",
            binary_crash: "Ralat Binari Kritikal",
            copy_logs: "Gagal menyalin log",
            copy_line: "Gagal menyalin baris",
            path_empty: "Laluan kosong"
        }
}
