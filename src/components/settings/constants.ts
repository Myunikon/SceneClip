export const SUPPORTED_LANGUAGES = [
    { value: "en", label: "English" },
    { value: "id", label: "Indonesia" },
    { value: "ms", label: "Melayu" },
    { value: "zh", label: "Chinese" }
] as const

export const THEMES = [
    { value: "system", label: "settings.general.theme_system" },
    { value: "light", label: "settings.general.theme_light" },
    { value: "dark", label: "settings.general.theme_dark" }
] as const

export const FONT_SIZES = [
    { value: "small", label: "settings.general.font_small" },
    { value: "medium", label: "settings.general.font_medium" },
    { value: "large", label: "settings.general.font_large" }
] as const

export const CLOSE_ACTIONS = [
    { value: 'minimize', label: 'settings.general.minimize_tray' },
    { value: 'quit', label: 'settings.general.quit_app' }
] as const

export const POST_DOWNLOAD_ACTIONS = [
    { value: "none", label: "settings.advanced.post_actions.none" },
    { value: "sleep", label: "settings.advanced.post_actions.sleep" },
    { value: "shutdown", label: "settings.advanced.post_actions.shutdown" }
] as const

export const TOKEN_OPTIONS = [
    { value: '{title}', label: 'downloads.tokens.title' },
    { value: '{author}', label: 'downloads.tokens.author' },
    { value: '{res}', label: 'downloads.tokens.res' },
    { value: '{site}', label: 'downloads.tokens.site' },
    { value: '{date}', label: 'downloads.tokens.date' },
    { value: '{id}', label: 'downloads.tokens.id' },
] as const
