import { useState, useMemo } from 'react'
import { invoke } from '@tauri-apps/api/core'
import { type as osType } from '@tauri-apps/plugin-os'
import { Trash2, Plus, Eye, EyeOff, Lock, Edit2, Check, X, Key, Copy, Globe, User, Loader2 } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { useTranslation, Trans } from 'react-i18next'
import { AppSettings } from '../store/slices/types'
import { notify } from '../lib/notify'
import { cn } from '../lib/utils'
import { SettingSection } from './settings/SettingItem'


interface KeyringManagerProps {
    settings: AppSettings
    setSetting: <K extends keyof AppSettings>(key: K, val: AppSettings[K]) => void
}

export function KeyringManager({ settings, setSetting }: KeyringManagerProps) {
    const { t } = useTranslation()
    const [service, setService] = useState('')
    const [username, setUsername] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [isAdding, setIsAdding] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [editingId, setEditingId] = useState<string | null>(null) // '{service}::{username}'

    const [deleteConfirm, setDeleteConfirm] = useState<{ service: string, username: string } | null>(null)

    const storageName = useMemo(() => {
        try {
            const os = osType()
            switch (os) {
                case 'windows': return 'Windows Credential Manager'
                case 'macos': return 'macOS Keychain'
                case 'linux': return 'Linux Secret Service / Keyring'
                default: return 'System Secure Storage'
            }
        } catch {
            return 'System Secure Storage'
        }
    }, [])

    // Helper: Clean domain input
    const cleanDomain = (url: string) => {
        return url.replace(/^(?:https?:\/\/)?(?:www\.)?/i, "").split('/')[0].toLowerCase();
    }

    // Fetch password for editing
    const handleEditStart = async (cred: { service: string, username: string }) => {
        try {
            const pass = await invoke<string>('get_credential', { service: cred.service, username: cred.username })
            setService(cred.service)
            setUsername(cred.username)
            setPassword(pass)
            setEditingId(`${cred.service}::${cred.username}`)
            setIsAdding(true)
            // Scroll to top to see the form
            window.scrollTo({ top: 0, behavior: 'smooth' })
        } catch (e: any) {
            const errString = String(e)
            // Handle "Ghost" credentials (exists in list but not in OS keyring)
            if (errString.includes("No matching entry") || errString.includes("not found")) {
                notify.warning(t('settings.security.missing_vault') || "Password missing from Vault. Please set a new one.")
                setService(cred.service)
                setUsername(cred.username)
                setPassword('') // Empty so they must set new one
                setEditingId(`${cred.service}::${cred.username}`)
                setIsAdding(true)
                window.scrollTo({ top: 0, behavior: 'smooth' })
            } else {
                notify.error(t('settings.security.auth_failed', { error: String(e) }))
            }
        }
    }

    const cancelEdit = () => {
        setIsAdding(false)
        setEditingId(null)
        setService('')
        setUsername('')
        setPassword('')
        setShowPassword(false)
        setIsSubmitting(false)
    }

    const handleSave = async () => {
        if (!service || !username || !password) {
            notify.error("Please fill in all fields")
            return
        }

        setIsSubmitting(true)

        try {
            const cleanService = cleanDomain(service.trim())
            const trimmedUsername = username.trim()

            // If editing, and service/username changed, delete old one first
            if (editingId) {
                const [oldService, oldUsername] = editingId.split('::')
                if (oldService !== cleanService || oldUsername !== trimmedUsername) {
                    await invoke('delete_credential', { service: oldService, username: oldUsername })
                }
            }

            // Save new
            await invoke('set_credential', { service: cleanService, username: trimmedUsername, password })

            // Update state
            let newCreds = settings.savedCredentials || []

            // If editing, remove old entry from state array first (to avoid dupes if key changed)
            if (editingId) {
                const [oldService, oldUsername] = editingId.split('::')
                newCreds = newCreds.filter(c => !(c.service === oldService && c.username === oldUsername))
            }

            const newCred = { service: cleanService, username: trimmedUsername }
            newCreds = [...newCreds, newCred]

            // Deduplicate safely
            const uniqueCreds = Array.from(
                new Map(newCreds.map(c => [`${c.service}::${c.username}`, c])).values()
            )

            setSetting('savedCredentials', uniqueCreds)

            notify.success(t('settings.security.save_success', { service: cleanService }))
            cancelEdit()
        } catch (e) {
            notify.error(t('settings.security.save_error', { error: String(e) }))
        } finally {
            setIsSubmitting(false)
        }
    }

    const requestDelete = (cred: { service: string, username: string }) => {
        setDeleteConfirm(cred)
    }

    const confirmDelete = async () => {
        if (!deleteConfirm) return

        try {
            await invoke('delete_credential', { service: deleteConfirm.service, username: deleteConfirm.username })
            // Success path
            const newCreds = settings.savedCredentials.filter(c =>
                !(c.service === deleteConfirm.service && c.username === deleteConfirm.username)
            )
            setSetting('savedCredentials', newCreds)
            notify.success(t('settings.security.delete_success', { service: deleteConfirm.service }))
        } catch (e: any) {
            const errString = String(e)
            // Handle "Ghost" credentials during delete
            if (errString.includes("No matching entry") || errString.includes("not found")) {
                // It's already gone from the vault, so just remove from our list
                const newCreds = settings.savedCredentials.filter(c =>
                    !(c.service === deleteConfirm.service && c.username === deleteConfirm.username)
                )
                setSetting('savedCredentials', newCreds)
                notify.warning(t('settings.security.missing_vault') || "Entry was already missing from Vault. Removed from list.")
            } else {
                notify.error(t('settings.security.delete_error', { error: errString }))
            }
        } finally {
            setDeleteConfirm(null)
        }
    }



    return (
        <div className="space-y-6">
            {/* Delete Confirmation Dialog */}
            <AnimatePresence>
                {deleteConfirm && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/20 backdrop-blur-sm">
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0, y: -10 }}
                            animate={{ scale: 1, opacity: 1, y: 0 }}
                            exit={{ scale: 0.95, opacity: 0, y: -10 }}
                            className="relative bg-background border border-border rounded-xl shadow-2xl w-full max-w-[420px] overflow-hidden flex flex-col"
                        >
                            <div className="flex bg-card p-5 gap-5">
                                {/* App Icon / Alert Icon (Left) */}
                                <div className="shrink-0">
                                    <img
                                        src="/icon.png"
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.classList.add('fallback-icon-alert');
                                        }}
                                        className="w-16 h-16 object-contain"
                                        alt="App Icon"
                                    />
                                    <div className="w-16 h-16 rounded-2xl bg-red-100 hidden fallback-show-alert flex items-center justify-center">
                                        <Trash2 className="w-8 h-8 text-red-500" />
                                    </div>
                                </div>

                                {/* Content (Right) */}
                                <div className="flex-1 space-y-1 pt-1">
                                    <h3 className="font-bold text-base leading-none text-foreground">
                                        {t('settings.security.delete_title')} "{deleteConfirm.service}"?
                                    </h3>
                                    <p className="text-sm text-foreground/80 leading-snug">
                                        <Trans i18nKey="settings.security.delete_warning_detail" values={{ storage: storageName }}>
                                            This will permanently remove the password from your <span className="font-medium">{storageName}</span>. This action cannot be undone.
                                        </Trans>
                                    </p>
                                </div>
                            </div>

                            {/* Buttons stick to bottom right, gray background sometimes, or just spaced */}
                            <div className="flex justify-end gap-3 p-4 bg-muted/20 border-t border-border/50">
                                <button
                                    onClick={() => setDeleteConfirm(null)}
                                    className="px-4 py-1.5 rounded-md text-sm font-medium bg-secondary hover:bg-secondary/80 text-secondary-foreground transition-colors min-w-[80px]"
                                >
                                    {t('settings.security.cancel')}
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="px-4 py-1.5 rounded-md text-sm font-medium bg-red-500 hover:bg-red-600 text-white shadow-sm transition-colors min-w-[80px]"
                                >
                                    {t('settings.security.delete')}
                                </button>
                            </div>

                            {/* Alert Icon Fallback Style */}
                            <style>{`
                                .fallback-icon-alert .fallback-show-alert {
                                    display: flex !important;
                                }
                            `}</style>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <SettingSection
                title={
                    <div className="flex items-center justify-between w-full">
                        <span>{t('settings.security.saved_passwords')}</span>
                        {!isAdding && (
                            <button
                                onClick={() => setIsAdding(true)}
                                className="text-primary hover:bg-primary/10 p-1.5 rounded-md transition-colors"
                                title={t('settings.security.add_new')}
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        )}
                    </div>
                }
                icon={<Lock className="w-4 h-4" />}
                description={t('settings.security.secure_storage_hint', { storage: storageName })}
            >
                {/* Form (Conditionally Rendered at Top) */}
                <AnimatePresence>
                    {isAdding && (
                        <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
                            className="overflow-hidden border-b border-border/40 mb-2 pb-4"
                        >
                            <div className="bg-secondary/30 rounded-xl border border-border/50 p-4 space-y-4">
                                <div className="flex items-center justify-between mb-2">
                                    <h4 className="font-medium text-sm text-foreground flex items-center gap-2">
                                        {editingId ? <Edit2 className="w-4 h-4 text-blue-500" /> : <Plus className="w-4 h-4 text-green-500" />}
                                        {editingId ? t('settings.security.edit_credential') : t('settings.security.new_credential')}
                                    </h4>
                                    <button onClick={cancelEdit} className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-background/50 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground ml-1">{t('settings.security.service_domain')}</label>
                                        <div className="relative group">
                                            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <input
                                                className="w-full pl-9 p-2.5 rounded-lg border border-input bg-background/80 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                                                placeholder={t('settings.security.service_placeholder') || "e.g. crunchyroll.com"}
                                                value={service}
                                                onChange={e => setService(e.target.value)}
                                                autoFocus
                                            />
                                        </div>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground ml-1">{t('settings.security.username')}</label>
                                        <div className="relative group">
                                            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <input
                                                className="w-full pl-9 p-2.5 rounded-lg border border-input bg-background/80 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all placeholder:text-muted-foreground/50 shadow-sm"
                                                placeholder={t('settings.security.username_placeholder') || "user@example.com"}
                                                value={username}
                                                onChange={e => setUsername(e.target.value)}
                                            />
                                        </div>
                                    </div>
                                    <div className="col-span-1 md:col-span-2 space-y-1.5">
                                        <label className="text-xs font-medium text-muted-foreground ml-1">{t('settings.security.password')}</label>
                                        <div className="relative group">
                                            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                            <input
                                                className="w-full pl-9 p-2.5 rounded-lg border border-input bg-background/80 text-sm focus:ring-1 focus:ring-primary focus:border-primary outline-none transition-all pr-10 placeholder:text-muted-foreground/50 shadow-sm"
                                                placeholder={t('settings.security.password_placeholder') || "Enter secure password"}
                                                type={showPassword ? "text" : "password"}
                                                value={password}
                                                onChange={e => setPassword(e.target.value)}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex justify-end pt-2">
                                    <button
                                        onClick={handleSave}
                                        disabled={isSubmitting}
                                        className="bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed text-primary-foreground px-6 py-2 rounded-lg text-sm font-medium shadow-sm flex items-center gap-2 transition-all active:scale-95"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="w-4 h-4 animate-spin" />
                                                <span>{t('settings.security.saving_btn')}</span>
                                            </>
                                        ) : (
                                            <>
                                                <Check className="w-4 h-4" />
                                                <span>{t('settings.security.save_btn')}</span>
                                            </>
                                        )}
                                    </button>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {/* Credentials List */}
                <div className="divide-y divide-border/40 border border-border/40 rounded-xl overflow-hidden bg-card/30">
                    {(!settings.savedCredentials || settings.savedCredentials.length === 0) && !isAdding && (
                        <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                            <Lock className="w-8 h-8 opacity-20 mb-3" />
                            <h3 className="text-sm font-medium text-foreground mb-1">{t('settings.security.no_passwords')}</h3>
                            <p className="text-xs opacity-70 max-w-[200px] mb-4">
                                {t('settings.security.no_passwords_desc')}
                            </p>
                            <button
                                onClick={() => setIsAdding(true)}
                                className="text-xs bg-primary/10 text-primary hover:bg-primary/20 px-4 py-2 rounded-full font-medium transition-colors"
                            >
                                {t('settings.security.add_first')}
                            </button>
                        </div>
                    )}

                    {settings.savedCredentials?.map((cred) => (
                        <div
                            key={`${cred.service}::${cred.username}`}
                            className={cn(
                                "group flex items-center justify-between p-3.5 hover:bg-secondary/30 transition-colors",
                                editingId === `${cred.service}::${cred.username}` ? "bg-primary/5" : ""
                            )}
                        >
                            <div className="flex items-center gap-4 min-w-0">
                                {/* Icon */}
                                <div className="w-8 h-8 rounded-md bg-white flex items-center justify-center shrink-0 border border-border/50 shadow-sm overflow-hidden p-0.5">
                                    <img
                                        src={`https://www.google.com/s2/favicons?domain=${cred.service}&sz=64`}
                                        onError={(e) => {
                                            e.currentTarget.style.display = 'none';
                                            e.currentTarget.parentElement!.classList.add('fallback-icon');
                                        }}
                                        className="w-full h-full object-contain"
                                        alt={cred.service}
                                    />
                                    <Key className="w-4 h-4 text-neutral-400 hidden fallback-show" />
                                </div>

                                <div className="min-w-0">
                                    <div className={cn(
                                        "font-medium text-sm truncate transition-colors",
                                        editingId === `${cred.service}::${cred.username}` ? "text-primary" : "text-foreground"
                                    )}>
                                        {cred.service}
                                    </div>
                                    <div className="text-xs text-muted-foreground truncate flex items-center gap-1.5 font-mono opacity-80">
                                        {cred.username}
                                        <button
                                            onClick={() => {
                                                navigator.clipboard.writeText(cred.username)
                                                notify.success(t('settings.security.copy_success'))
                                            }}
                                            className="opacity-0 group-hover:opacity-100 p-0.5 hover:bg-muted rounded transition-all text-muted-foreground hover:text-foreground"
                                            title="Copy Username"
                                        >
                                            <Copy className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            </div>

                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity translate-x-2 group-hover:translate-x-0 duration-200">
                                <button
                                    onClick={() => handleEditStart(cred)}
                                    className="p-1.5 hover:bg-primary/10 text-muted-foreground hover:text-primary rounded-md transition-colors"
                                    title={t('settings.security.edit_credential')}
                                >
                                    <Edit2 className="w-4 h-4" />
                                </button>
                                <button
                                    onClick={() => requestDelete(cred)}
                                    className="p-1.5 hover:bg-red-500/10 text-muted-foreground hover:text-red-500 rounded-md transition-colors"
                                    title="Delete"
                                >
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </SettingSection>

            {/* Fallback CSS for Favicon errors - simple inline style hack */}
            <style>{`
                .fallback-icon .fallback-show {
                    display: block !important;
                }
            `}</style>
        </div>
    )
}
