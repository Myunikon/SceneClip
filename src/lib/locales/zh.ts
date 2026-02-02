export const zh = {
    nav: {
        downloads: "下载",
        browser: "浏览器",
        settings: "设置",
        tools: "工具",
        terminal: "终端",
        keyring: "密钥环"
    },
    common: {
        copy_error: "复制失败",
        pause: "暂停",
        cancel: "取消"
    },
    error_boundary: {
        title: "出了点问题。",
        reload: "重新加载应用"
    },
    status: {
        missing: "缺少组件",
        downloading_bin: "正在下载组件...",
        ready: "就绪",
        repair: "下载组件",
        offline: "无网络连接",
        slow_connect: "网络连接可能较慢"
    },
    task_status: {
        pending: "等待中",
        fetching_info: "获取信息",
        downloading: "下载中",
        completed: "完成",
        error: "错误",
        stopped: "停止",
        paused: "已暂停"
    },
    header: {
        title: "SceneClip",
    },
    downloads: {
        title: "下载列表",
        subtitle: "管理您的视频下载和剪辑。",
        new_download: "新建下载",
        storage: "存储与布局",
        path_select_label: "保存到",
        change_folder: "选择文件夹...",
        always_ask: "总是询问下载位置",
        defaults: "命名与格式",
        filename_template: "文件名格式",
        insert_token: "插入变量...",
        tokens: {
            title: "标题",
            author: "作者",
            id: "ID",
            res: "分辨率",
            site: "来源",
            date: "日期"
        },
        example_note: "* 基于示例视频的预览",

        empty: "暂无下载。",
        headers: {
            title_url: "标题 / URL",
            status: "状态",
            progress: "进度",
            actions: "操作",
            eta: "剩余时间",
            clip: "片段"
        },
        fetching_info: "获取信息",
        pause_download: "暂停",
        resume_download: "继续",
        stop: "停止",
        restart: "重新开始",
        open_file: "打开文件",
        open_folder: "打开文件夹",
        clear: "清除",
        pause_clip_tooltip: "暂停剪辑 (需从 0% 重新开始)",
        cancel_confirm_title: "取消下载?",
        cancel_confirm_desc: "这将停止下载，您可能需要从头开始。",
        confirm: "是的，取消",
        keep_downloading: "继续下载",
        clip_pause_title: "暂停剪辑下载?",
        clip_pause_desc: "这是一个剪辑下载。由于技术限制，继续下载将从 0% 开始。",
        clip_pause_confirm: "仍然暂停"
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
            downloads: "存储",
            quality: "质量",
            network: "网络",
            media: "媒体",
            system: "系统",
            advanced: "系统",
            logs: "日志",
            guide: "指南",
            about: "关于"
        },
        general: {
            language_theme: "语言与主题",
            language: "界面语言",
            theme: "颜色主题",
            theme_dark: "深色模式",
            theme_light: "浅色模式",
            theme_system: "跟随系统",
            startup: "启动行为",
            launch_startup: "开机启动",
            launch_startup_desc: "登录系统时自动启动",
            start_minimized: "启动时最小化到托盘",
            start_minimized_desc: "在后台启动 (系统托盘)",
            close_action: "关闭按钮行为",
            minimize_tray: "最小化到托盘",
            quit_app: "退出应用",
            font_size: "字体大小",
            font_small: "小",
            font_medium: "中",
            font_large: "大",
            system_behavior: "窗口与系统",
            minimize_desc: "应用将在后台继续运行",
            quit_desc: "应用将完全退出",
            desktop_notifications: "桌面通知",
            desktop_notifications_desc: "当应用程序在后台时显示系统通知",
            prevent_suspend: "防止休眠",
            prevent_suspend_desc: "下载过程中保持系统唤醒"
        },
        downloads: {
            storage: "存储与路径",
            path: "下载文件夹",
            change: "更改",
            always_ask: "总是询问保存位置",
            filename_template: "自动命名规则 (模板)",
            available_vars: "可用变量: {title}, {res}, {source}, {date}",
            resolution: "默认分辨率",
            container: "默认格式 (容器)",
            best: "最佳可用",
            audio: "仅音频",
            example_note: "* 基于示例视频的演示"
        },
        quality: {
            video: "视频内容",
            audio: "音频处理",
            metadata: "元数据与标签",
            embed_metadata: "嵌入元数据",
            embed_metadata_desc: "将元数据标签写入视频文件",
            embed_thumbnail: "嵌入缩略图",
            embed_thumbnail_desc: "从源设置视频缩略图",
            embed_chapters: "嵌入章节",
            embed_chapters_desc: "将章节标记添加到视频文件",
            audio_normalization: "音量标准化 (Loudness)",
            sponsorblock: "SponsorBlock (自动跳过)",
            enable_sb: "启用 SponsorBlock",
            disable_play_button: "在历史记录中隐藏播放按钮",
            sponsorblock_desc: "自动跳过广告、片头和其他片段",
            skip_segments: "要跳过的片段",
            audio_normalization_desc: "EBU R128 标准 (-14 LUFS)",
            metadata_warning_title: "注意:",
            metadata_warning_desc: "当使用 <1>剪辑/Trim</1> 功能时，这些选项会自动禁用，以防止出现视频时长错误（例如 10 秒的片段显示为 1 小时）。",
            privacy_scrubbing: "隐私清理",
            privacy_scrubbing_desc: "从下载的文件中删除源 URL、描述和注释，以保护隐私。",
            presets: {
                title: "后处理预设",
                desc: "管理自定义 FFmpeg 参数预设",
                empty: "未定义预设",
                add_new: "添加新预设",
                name_label: "名称",
                type_label: "类型",
                args_label: "FFmpeg 参数",
                desc_label: "描述 (可选)",
                placeholder_name: "我的自定义预设",
                placeholder_args: "-c:v libx265 -crf 28",
                placeholder_desc: "高效 HEVC 编码...",
                save_btn: "保存预设",
                delete_tooltip: "删除预设",
                add_tooltip: "添加预设",
                types: {
                    video: "视频",
                    audio: "音频",
                    metadata: "元数据",
                    general: "通用"
                }
            }
        },
        filename_preview: {
            label: "预览",
            example_title: "我的精彩视频",
            example_uploader: "优秀创作者",
            reset: "重置"
        },
        network: {
            connection: "速度与连接",
            concurrent: "同时下载任务",
            warning_ip: "警告：过多的下载任务可能触发 IP 保护。",
            speed_limit: "全局速度限制",
            proxy: "代理配置",
            concurrent_fragments: "下载分段 (并发)",
            perf_tuning: "下载引擎功率:",
            perf_safe_title: "1-4 (安全)",
            perf_safe_desc: "适合一般用途和稳定下载。",
            perf_fast_title: "5-8 (快速)",
            perf_fast_desc: "推荐用于高速连接。增加 CPU 使用率。",
            perf_aggressive_title: "9-16 (激进)",

            perf_aggressive_desc: "最大吞吐量。如果滥用可能会导致暂时性 IP 封禁 (429 Too Many Requests)。",
            perf_warning: "* 适用于所有下载模式（完整视频、音频和剪辑）。",

            // Aria2c
            aria2c_section: "下载引擎",
            aria2c_title: "使用 Aria2c (外部下载器)",
            aria2c_desc: "多连接下载器 (16x)。比标准更快。",
            aria2c_active: "Aria2c 已激活。原生 '并行分片' 设置已禁用以防止冲突。",

            manual_config: "手动配置模式",
            chunks_label: "{{n}} 分段",
            perf_profile: "性能配置文件",
            custom: "自定义",

            placeholders: {
                speed: "例如 5M, 500K",
                proxy: "http://user:pass@host:port",
                ua: "留空 = 默认 Chrome"
            },
            turbo: "极速模式",
            turbo_desc: "使用多线程下载引擎以获得最大速度。"
        },
        advanced: {
            auth: "浏览器身份验证",
            source: "来源选择",
            use_browser: "使用系统浏览器会话 (Cookies)",
            use_txt: "从 cookies.txt 加载 (手动)",
            binary_paths: "集成路径",
            clear_cache: "清除缓存",
            post_action: "下载完成后动作",
            post_actions: {
                none: "不执行任何操作",
                sleep: "睡眠",
                shutdown: "关机"
            },
            post_download_action_desc: "选择所有下载完成后的操作。",
            shutdown_warning: "下载完成后电脑将强制关机。请保存您的工作！",
            content_enhancements: {
                title: "内容增强",
                srt_fixer: "SRT 修复器",
                srt_fixer_desc: "修复 YouTube 自动生成字幕中的重复行和重叠时间。",
                metadata_enhancer: "元数据增强器",
                metadata_enhancer_desc: "在文件中嵌入额外的元数据，如不喜欢数、章节和丰富的 info json。"
            },
            danger_zone_proxy: "危险区域 (代理)",
            danger_zone_binaries: "危险区域 (二进制)",
            danger_desc: "更改这些路径可能会导致应用损坏。",
            redownload_ffmpeg: "重新下载 FFmpeg (强制)",
            redownload_help: "如果是 FFmpeg 损坏或缺少依赖项，请使用此功能。",
            confirm_redownload: "确定要强制重新下载 FFmpeg 吗？\\n\\n这将覆盖现有的 ‘ffmpeg.exe’，可能需要几分钟时间。",
            developer_tools: "开发者工具",
            developer_mode: "开发者模式",
            developer_mode_desc: "在每个下载任务上显示详细命令",
            data_management: "数据管理",
            export_history: "导出历史",
            export_desc: "将下载历史保存到 JSON 文件",
            export_btn: "导出",
            import_history: "导入历史",
            import_desc: "从备份文件恢复任务",
            import_btn: "导入",
            reset_defaults: "重置为默认值",
            alerts: {
                export_success: "历史记录导出成功！",
                export_fail: "导出历史记录失败：",
                import_success: "成功导入 {{n}} 个任务！",

                invalid_backup: "无效的备份文件格式",
                confirm_reset: "您确定要将所有设置重置为默认值吗？",
                reset_success_title: "应用重置成功",
                reset_success_desc: "所有设置已恢复为默认值。",
                reset_confirm_desc: "这将清除您的所有偏好设置、下载历史记录和保存的路径。应用程序将恢复到全新安装状态。此操作无法撤消。",
                reset_confirm_btn: "是的，重置所有内容"
            },
            errors: {
                open: "打开文件夹"
            },
            validation: {
                checking: "正在检查...",
                valid: "二进制文件有效",
                invalid: "二进制文件无效",
                success_desc: "发现版本: {{version}}",
                error_desc: "验证失败。请确保文件是可执行二进制文件。"
            },
            video_processing: {
                title: "视频处理",
                hw_accel: "硬件加速",
                hw_auto: "自动 (推荐)",
                hw_gpu: "强制 GPU (NVENC/AMF/QSV)",
                hw_cpu: "强制 CPU (慢但安全)",
                hw_desc: "控制是否使用显卡进行视频编码。如果 GPU 失败，'自动' 将回退到 CPU。",
            },
            history_retention: "历史保留",
            history_retention_desc: "一段时间后自动从历史记录中删除已完成的任务。",
            retention_days: "{{count}} 天后删除",
            retention_forever: "永久 (保存所有)",
            retention_zero: "不保存历史",
            history_max_items: "最大历史项目数",
            history_item_count: "{{count}} 个项目",
            btn_replay_welcome: "重播欢迎页",
            btn_reset_data: "重置所有数据与设置",
            btn_export_history: "导出历史 (.json)",
            btn_import_history: "导入历史 (.json)"
        },
        security: {
            keyring_title: "安全密钥环",
            keyring_desc: "管理高级网站的保存密码",
            saved_passwords: "已保存密码",
            add_new: "新增",
            add_first: "添加首个账户",
            no_passwords: "未保存密码",
            no_passwords_desc: "添加您的高级账户凭证以从需要登录的网站下载。",
            edit_credential: "编辑凭证",
            new_credential: "新凭证",
            service_domain: "服务域名",
            service_placeholder: "例如 crunchyroll.com",
            username: "用户名",
            username_placeholder: "user@example.com",
            password: "密码",
            password_placeholder: "输入安全密码",
            save_btn: "保存凭证",
            saving_btn: "保存中...",
            confirm_delete: "确定要删除 {{service}} 的凭证吗？",
            copy_success: "用户名已复制",
            save_success: "已保存 {{service}} 的凭证",
            save_error: "保存失败: {{error}}",
            delete_success: "已删除 {{service}} 的凭证",
            delete_error: "删除失败: {{error}}",
            missing_vault: "Vault 中找不到密码。请重新设置。",
            auth_failed: "验证失败: {{error}}",
            delete_title: "删除",
            delete_warning_detail: "此密码将从 {{storage}} 中永久删除。此操作无法撤消。",
            cancel: "取消",
            delete: "删除",
            secure_storage_hint: "已安全存储在 {{storage}} 中"
        },
        updater: {
            title: "软件更新",
            subtitle: "管理核心组件 (yt-dlp)",
            latest: "您使用的是最新版本。",
            error: "版本检查失败。",
            checking: "检查中...",
            update_btn: "检查更新",
            updating: "更新中...",
            binary_versions: "二进制版本",
            check_updates: "检查更新",
            current_ver: "当前",
            not_checked: "未检查",
            unknown: "未知",
            update_available: "有可用更新",
            up_to_date: "已是最新",
            binary_bundled: "二进制文件作为 sidecar 捆绑。如果过时需要手动更新。"
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
            core: "致谢",
            yt_desc: "幕后的主力军。yt-dlp 是从数千个网站下载媒体的全球行业标准。",
            ff_desc: "多媒体的瑞士军刀。处理转换、音频/视频合成和精确剪辑。",
            aria_desc: "下载加速器。启用多线程连接（Turbo 模式）以获得最大速度。",
            tech_stack: "采用现代技术构建",
            react_desc: "用于构建用户界面的 JavaScript 库。用于动态和响应式的前端。",
            tauri_desc: "构建更小、更快、更清晰的应用程序。连接 Rust 后端与 Web 前端。",
            lucide_desc: "美观且一致的图标。为界面增添视觉清晰度和现代美感。",
            sb_desc: "一个众包平台，可自动跳过 YouTube 视频中的赞助片段。",
            role_core: "核心引擎",
            role_media: "媒体处理",
            role_framework: "框架",
            role_ui: "UI 库",
            role_state: "状态管理",
            role_routing: "路由",
            role_i18n: "国际化",
            role_lang: "语言",
            role_icon: "图标",
            role_api: "跳过片段 API",
            visit_website: "访问网站",
            legal: "法律免责声明",
            made_with: "由 <1>Myunikon</1> 用 <0>❤️</0> 制作",
            legal_text: "SceneClip 仅供个人使用（存档、教育）。开发者与 YouTube/Google 无关。所有使用风险（包括侵犯版权或违反平台服务条款）均由用户自行承担。",
            secret_found: "发现秘密！",
            secret_desc: "您解锁了秘密开发者感谢徽章！",
            secret_sub: "（没有隐藏设置，纯粹为了好玩！）",
            awesome: "太棒了！"
        },


    },
    notifications: {
        title: "通知",
        empty: "暂无通知",
        clear_all: "清除所有",
        dismiss: "关闭"
    },
    logs: {
        download_complete: "下载完成: {{id}}",
        download_started: "下载开始: {{id}}",
        binary_error: "二进制检查失败"
    },
    dialog: {
        title: "添加下载",
        new_download: "新建下载",
        customize_download: "自定义下载",
        download_all: "全部下载",
        url_label: "视频链接",


        format_label: "格式",
        folder_label: "保存路径",
        clip_label: "视频剪辑 (时间段)",
        enhancements_label: "高级功能",
        help: {
            format_help: "选择 'Video' 下载画面+声音, 'Audio' 仅下载音乐, 或 'GIF' 制作无声动图。",
            mp4_help: "MP4 兼容性最好，适合所有设备。MKV 更稳定（下载中断不会损坏文件）但并非所有播放器都支持。",
            codec_help: "'H.264'兼容性无敌。'AV1'省流量且清晰，但需要较新的手机/电脑支持。'Auto'让我们为您选择。",
            audio_help: "320kbps 是录音室音质（最佳）。128kbps 是 YouTube 标准音质。",
            sponsor_help: "自动剪掉视频中的 '求关注/三连' 或赞助商广告片段。",
            clip_help: "如果您只想保存某个搞笑瞬间（例如：01:00 到 01:30）以节省流量，请使用此剪刀工具。"
        },
        turbo_label: "极速模式 (多线程)",
        sponsor_label: "跳过赞助片段",
        cancel: "取消",
        download: "开始下载",
        remove_sponsors: "移除赞助",
        remove_sponsors_desc: "自动跳过视频中的片头、片尾和广告",
        loudness_normalization: "响度标准化",
        loudness_desc: "EBU R128 标准",
        subtitles_title: "字幕",
        subtitles_desc: "下载并嵌入字幕",
        subtitle_safe_mode_title: "安全模式已激活",
        subtitle_safe_mode_desc: "为了防止 YouTube 封锁 (HTTP 429)，下载速度将显著变慢。请耐心等待。",
        schedule_download: "计划下载",
        schedule_desc: "在稍后时间自动开始任务",
        live_from_start: "从开始录制",
        live_from_start_desc: "从开始录制直播",
        split_chapters: "分割章节",
        split_chapters_desc: "每个章节一个视频文件",
        sponsor_clip_conflict: "剪辑时不可用",
        video_codec: "视频编码",
        codec_desc: "AV1最佳，H264兼容性最好",
        proxy: "网络代理",
        proxy_desc: "为此下载使用特定代理",
        post_processing: "后期处理",
        post_proc_desc: "应用FFmpeg预设",
        post_proc_active: "自定义FFmpeg参数已激活",
        select_preset: "选择预设",
        custom_preset: "自定义 / 手动",
        custom_args_label: "输入自定义FFmpeg参数",
        not_available: "不可用",
        inside_video: "嵌入视频文件内",
        subtitle_settings: "字幕设置",
        schedule_time: "计划时间",
        embed_subs: "嵌入到视频文件",
        clip_pause_title: "暂停剪辑下载?",
        clip_pause_desc: "这是一个剪辑下载。由于技术限制，继续下载将从 0% 开始。",
        clip_pause_confirm: "仍然暂停",
        cancel_confirm_title: "取消下载?",
        cancel_confirm_desc: "这将停止下载，您可能需要从头开始。",
        confirm: "是的，取消",
        keep_downloading: "继续下载",
        estimated_size: "预计大小",
        trimmed: "已剪辑",
        pick_date: "选择日期...",
        set_time_next: "下一步设置时间",
        calendar: "日历",
        time: "时间",
        done: "完成",
        preview: {
            failed: "预览失败",
            no_data: "无数据",
            no_thumbnail: "无缩略图",
            instruction: "输入有效链接以查看预览"
        },
        formats: {
            best: "最佳视频 + 音频",
            audio_mp3: "音频 (MP3)",
            audio_wav: "音频 (WAV 无损)",
            gif: "动画 GIF（动图）"
        },
        quality_profiles: {
            highest_quality: "最高质量",
            standard: "标准",
            ultra_hd: "超高清 (UHD)",
            qhd: "2K (QHD)",
            full_hd: "全高清 (FHD)",
            hd: "高清 (HD)",
            data_saver: "省流模式"
        },
        audio_extraction: {
            title: "音频提取",
            desc_auto: "高性能提取为 MP3。从源视频检测比特率。",
            desc_manual: "高性能提取为 MP3。选择目标比特率质量。"
        },
        labels: {
            quality_profile: "画质配置",
            fmt: "格式:",
            bitrate_quality: "比特率质量"
        },
        trim_video: "裁剪视频",
        trim_audio: "裁剪音频",
        trim_desc: "裁剪视频的特定部分",
        metadata_required: "滑块需要元数据",
        time_error: "开始时间必须在结束时间之前",

        // Tab labels
        tabs: {
            video: "视频",
            audio: "音频",
            gif: "GIF动图"
        },

        // GIF section
        gif_maker: {
            title: "高品质GIF制作器",
            desc: "使用调色板生成创建流畅清晰的GIF。非常适合制作表情包和反应视频片段。",
            note: "(注意：处理时间比标准视频下载更长)",
            trim_required: "需要裁剪",
            max_duration: "最长30秒",
            trim_desc: "GIF格式需要裁剪。请选择短片段（最长30秒）以获得最佳效果。",
            too_long: "片段太长！GIF最长{{max}}秒。当前：{{current}}秒"
        },

        // Clip section
        clip: {
            duration: "片段时长：{{current}}秒",
            duration_max: "片段时长：{{current}}秒 / 最长{{max}}秒",
            to: "至"
        },

        // Codec
        codec: {
            label: "编解码器",
            auto_desc: "自动最佳质量",
            h264: "H.264 兼容性最强",
            hevc: "高效编码 (H.265)",
            vp9: "YouTube 标准 (4K)",
            av1: "AV1 节省流量 (下一代)",
            warning_title: "需要重新编码",
            warning_desc: "源文件不包含 {{codec}}。质量可能会略有下降，下载时间会变长。"
        },

        // 新的 UI 部分
        gif_options: {
            res_title: "分辨率 (尺寸)",
            res_desc: "分辨率越小，GIF 分享越轻便。",
            fps_title: "帧率 (FPS)",
            fps_desc: "高 FPS 动作更流畅，但文件更大。",
            quality_title: "质量模式",
            quality_high: "高质量 (调色板生成)",
            quality_fast: "快速 (标准)",

            // 选项
            res_original: "原始",
            res_social: "社交 (480p)",
            res_sticker: "表情包 (320p)",

            fps_smooth: "流畅 (30fps)",
            fps_standard: "标准 (15fps)",
            fps_lite: "精简 (10fps)"
        },
        video_quality: {
            title: "视频质量",
            desc: "质量越高，文件越大。"
        },
        output_format: {
            title: "输出格式",
            desc_mp4: "通用 (电视/手机最佳)",
            desc_mkv: "高级 (多字幕/多音轨)",
            desc_webm: "Google 网络标准",
            desc_mov: "适合视频剪辑软件",
            desc_default: "选择格式"
        },
        audio_options: {
            title: "音频格式",
            desc_mp3: "通用 (音乐/播客)",
            desc_m4a: "高效 (Apple/移动设备)",
            desc_flac: "无损 (发烧友)",
            desc_wav: "未压缩 (编辑用)",
            desc: "比特率越高，声音细节越清晰。",
            upscale_title: "升频警告",
            upscale_desc: "源文件已压缩 (有损)。转换为 {{fmt}} 会增加文件大小但不会提高质量。",
            reencode_title: "重新编码",
            reencode_desc: "需要转换为 {{fmt}}。"
        },
        compress: {
            title_video: "导出视频",
            title_audio: "导出音频",
            title_image: "导出图片/GIF",
            preset_wa: "WhatsApp / Discord",
            preset_wa_desc: "最小体积",
            preset_wa_desc_audio: "语音 (64kbps)",
            preset_social: "社群媒体",
            preset_social_desc: "平衡品质",
            preset_social_desc_audio: "标准 (128kbps)",
            preset_archive: "封存 / 高画质",
            preset_archive_desc: "最佳品质",
            preset_archive_desc_audio: "高音质 (320kbps)",
            advanced: "进阶设定",
            original_size: "原始大小",
            format: "格式",
            lbl_resolution: "解析度限制",
            lbl_quality: "品质 (CRF)",
            lbl_encoder: "编码器 (硬体加速)",
            lbl_speed: "编码速度",
            lbl_bitrate: "音讯位元率",
            btn_cancel: "取消",
            btn_start: "开始导出",

            // File validation
            file_missing: "文件未找到",
            file_missing_desc: "原始文件已被移动或删除。",
            browse_file: "浏览...",
            file_relocated: "文件路径更新成功",
            double_compression_warning: "此文件似乎已被压缩。再次压缩将显著降低质量。",

            // New UI states
            checking_file: "正在检查文件...",
            unknown: "未知",
            auto: "自动",

            // Options
            opt_voice: "语音",
            opt_low: "低",
            opt_standard: "标准",
            opt_good: "好",
            opt_high: "高",
            opt_max: "最大",

            opt_original_no_resize: "原始 (无调整大小)",

            opt_auto_detect: "自动 (检测)",
            opt_cpu: "CPU (x264 软件)",

            opt_ultrafast: "极快 (低质量)",
            opt_veryfast: "非常快",
            opt_medium: "中等 (默认)",
            opt_slow: "慢 (更好压缩)",
            opt_veryslow: "非常慢 (最佳压缩)",

            quality_original: "原始",
            quality_standard: "标准",
            quality_low: "低"
        },
        logic_warnings: {
            mov_reencode: "使用 <strong>{{codec}}</strong> 的 <strong>.MOV</strong> 格式需要重新编码。这可能需要更长的时间。"
        },

        restart: "重新开始",
        filename_label: "文件名",
        filename_placeholder: "自定义文件名（可选）"
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
        file_not_found: "文件未找到。可能已被移动或删除。",
        search_placeholder: "搜索历史...",
        filter_date: "日期",
        filter_size: "大小",
        filter_source: "来源",
        sort_asc: "最早优先",
        sort_desc: "最新优先",
        scan_files: "扫描文件",
        scan_missing_files: "扫描完成: 发现 {{count}} 个丢失文件",
        scan_healthy_files: "扫描完成: 所有文件完好",
        recover: "恢复文件",
        find_on_disk: "在磁盘上查找",
        redownload: "重新下载内容",
        untitled: "无标题",
        unknown_size: "未知大小",
        open_url: "打开 {{source}}",
        view_command: "查看命令",
        folder: "打开文件夹",
        compress: "导出",
        delete: "删除"
    },
    guide: {
        title: "完整用户手册",
        subtitle: "掌握 SceneClip 所需的一切知识。",
        menu: {
            start: "快速开始",
            clip: "剪辑与编辑",
            advanced: "高级功能",
            faq: "常见问题"
        },
        steps: {
            smart: {
                title: "智能检测",
                desc: "无需手动粘贴！复制链接，SceneClip 自动识别。"
            },
            clip: {
                title: "精准剪辑",
                desc: "节省流量！使用“剪刀”图标仅下载所需片段。"
            },
            format: {
                title: "格式选择",
                desc: "4K 视频、清晰 MP3 音频或即时 GIF 表情包。"
            },
            terminal: {
                title: "终端日志",
                desc: "下载失败？查看“终端”选项卡获取调试日志。"
            }
        },
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
            shortcuts_list: "- **Ctrl + N**: 新建下载\n- **Ctrl + ,**: 打开设置\n- **Ctrl + H**: 历史记录\n- **Ctrl + D**: 下载列表\n- **F11**: 切换全屏\n- **Esc**: 关闭对话框",
            shortcuts_fullscreen: "切换全屏",
            replay_tour: "重播欢迎向导",
            visual_placeholder: "视觉演示即将推出",
            sponsorblock: "自动跳过赞助 (SponsorBlock)",
            sponsorblock_text: "自动跳过赞助片段、片头和片尾。\n\n- 工作原理：使用社区数据检测并移除视频中的非内容部分。\n- 分类：您可以在 设置 > 高级 > SponsorBlock 中自定义要跳过的内容。\n- 注意：此功能需要重新处理视频，因此完成时间可能会稍长。",
            got_it: "知道了!"
        }
    },
    context_menu: {
        back: "返回",
        home: "主页",
        copy_link: "复制链接",
        screenshot: "截图",
        more_soon: "更多功能即将推出...",
        undo: "撤销",
        redo: "重做",
        cut: "剪切",
        copy: "复制",
        paste: "粘贴",
        paste_plain: "粘贴为纯文本",
        select_all: "全选",
        refresh: "刷新"
    },
    statusbar: {
        idle: "空闲",
        active: "活动中",
        queued: "排队中",
        nvidia_gpu: "Nvidia 显卡",
        amd_gpu: "AMD 显卡",
        intel_gpu: "Intel 显卡",
        apple_gpu: "Apple 显卡",
        cpu_mode: "CPU 模式",
        auto_cpu: "自动 (CPU)",
        forced: "强制",
        cpu_usage: "CPU 使用率",
        ram_usage: "内存",
        disk_free: "可用磁盘",
        download_speed: "下载速度",
        upload_speed: "上传速度",
        active_downloads: "活动下载",
        hw_accel: "硬件加速",
        app_version: "应用版本",
        open_folder: "打开下载文件夹",
        stats_unavailable: "系统统计不可用",
        storage_devices: "存储设备",
        available: "可用"
    },
    errors: {
        system_action: "系统操作失败: {{action}}",
        listener_attach: "无法绑定下载监听器",
        binary_validation: "程序验证失败",
        update_check: "检查更新失败",
        binary_crash: "严重程序错误",
        copy_logs: "复制日志失败",
        copy_line: "复制行失败",
        path_empty: "路径为空",
        access_denied: "拒绝访问",
        access_desc: "权限被拒绝。",
        folder_not_found: "找不到文件夹",
        folder_desc: "该目录不再存在。",
        file_desc: "文件可能已被移动或删除。",
        open_folder: "打开文件夹"
    },
    all: "全部",
    video: "视频",
    audio: "音频",

    shortcuts: {
        title: "键盘快捷键",
        close: "关闭"
    },

    onboarding: {
        step1_title: "欢迎使用 SceneClip",
        step1_desc: "具有精确剪辑和智能队列管理的终极视频下载器。",
        step2_title: "一键下载",
        step2_desc: "自动检测剪贴板中的链接。只需复制，剩下的交给我们。",
        step3_title: "智能队列",
        step3_desc: "实时跟踪下载并即时访问历史记录。",
        step4_title: "精确剪辑",
        step4_desc: "通过设置精确的时间戳仅下载您需要的内容。",
        step5_title: "准备就绪！",
        step5_desc: "随时在设置中自定义您的体验。",
        skip: "跳过",
        continue: "继续",
        start: "开始使用"
    },

    empty_state: {
        title: "暂无下载",
        description: "复制链接并按 <1>{{mod}}+N</1> 开始。"
    },

    filename_preview: {
        label: "实时预览",
        reset: "重置",
        example_title: "我的精彩视频",
        example_uploader: "知名创作者"
    },

    url_input: {
        batch_switch: "切换到批量模式",
        single_switch: "切换到单链接模式",
        batch_desc: "粘贴多个链接，每行一个。",
        placeholder_single: "粘贴视频链接 (YouTube, TikTok, Instagram, Twitter...)",
        placeholder_batch: "https://youtube.com/watch?v=...\nhttps://tiktok.com/@user/video/...\nhttps://instagram.com/reel/...",
        paste_clipboard: "从剪贴板粘贴",
        switch_tooltip_batch: "切换到批量模式 (多个链接)",
        switch_tooltip_single: "切换到单链接模式"
    },

    guide_content: {
        help_center: "帮助中心",
        pro_tip_title: "专业提示：拖放",
        pro_tip_desc: "将包含链接的任何 .txt 文件拖入应用即可立即开始批量下载。",
        how_to_use: "使用方法：",
        clip_step1: "切换 <strong>\"剪辑模式\"</strong> (剪刀图标)。",
        clip_step2: "等待元数据加载完成。",
        clip_step3: "拖动 <strong>范围滑块</strong> 选择开始/结束点。",
        clip_step4: "短片段使用 GIF 格式。",
        term_logs_title: "终端日志",
        term_logs_desc: "查看 yt-dlp 和 FFmpeg 的原始输出。调试错误时必不可少。",
        cookies_title: "浏览器 Cookie",
        cookies_desc: "使用浏览器 (Chrome/Firefox) 的 Cookie 下载受年龄限制的内容。",

        faq_1_q: "下载卡在 100%？",
        faq_1_a: "应用可能正在合并视频和音频流。对于大文件 (4K/8K)，这可能需要一些时间。",
        faq_2_q: "登录以确认年龄？",
        faq_2_a: "转到 设置 > 高级 > 来源，选择您的浏览器以使用其 Cookie。",
        faq_3_q: "下载速度慢？",
        faq_3_a: "尝试在网络设置中将“-连接类型”更改为“激进”。警告：可能会导致暂时性的 IP 封禁。"
    },

    dialog_status: {
        trimmed: "TRIMMED",
        disk_full: "Insufficient Disk Space",
        est_size: "Estimated Size",
        calculating: "Calculating..."
    },

    history_menu: {
        redownload: "Redownload",
        view_command: "View Command",
        compress: "Export",
        locate_file: "Locate File",
        recover: "Recover File",
        selected: "Selected",
        select_all: "Select All",
        deselect_all: "Deselect All",
        delete: "DELETE",
        cancel: "Cancel",
        toast_redownload: "重新下载已开始",
        toast_file_updated: "File path updated",
        toast_deleted: "已删除 {{count}} 项",
        tooltip_missing: "File not found - Moved or Deleted",
        selected_count: "已选择 {{count}} 项",
        confirm_delete_msg: "确定要删除这 {{count}} 项吗？"
    },

    terminal: {
        filter_all: "全部",
        filter_system: "系统",
        filter_ytdlp: "yt-dlp",
        filter_ffmpeg: "FFmpeg",
        copy_all: "复制全部",
        clear_all: "清空",
        copied: "已复制!",
        copy: "复制",
        copy_line: "复制行",
        ready: "系统就绪。等待任务...",
        no_logs: "未找到 {{filter}} 日志。"
    },

    // ETA Human-Readable Translations (i18next pluralization)
    eta: {
        unknown: "剩余时间未知",
        hours_one: "{{count}} 小时",
        hours_other: "{{count}} 小时",
        minutes_one: "{{count}} 分钟",
        minutes_other: "{{count}} 分钟",
        seconds_one: "{{count}} 秒",
        seconds_other: "{{count}} 秒",
        and: "",
        remaining: "剩余 {{time}}"
    },
    exit_guard: {
        title: "下载正在进行中",
        desc: "后台有正在进行的下载任务。现在退出将强制停止它们。",
        confirm: "是的，退出",
        cancel: "取消",
        refresh_msg: "下载仍在进行中！重新加载将中断界面状态。确定要刷新吗？"
    }
}

