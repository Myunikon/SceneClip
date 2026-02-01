import { Package, RefreshCw, CheckCircle, ArrowDownCircle, ExternalLink, Terminal } from 'lucide-react'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'

export function Updater() {
    const {
        appVersion, appLatestVersion, appNeedsUpdate, appUpdateError, appUpdateProgress, installAppUpdate,
        ytdlpVersion, ytdlpLatestVersion, ytdlpNeedsUpdate, ytdlpIntegrityValid, ytdlpUpdateError, ytdlpUpdateProgress,
        checkBinaryUpdates, isCheckingAppUpdate, isCheckingYtdlpUpdate, updateBinary, cancelUpdate
    } = useAppStore()

    const { t } = useTranslation()

    // Auto-check removed per user request to save rate limits.
    // User must manually click "Check for updates".

    return (
        <div className="flex flex-col space-y-6">

            {/* 1. Application Version Card */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <Package className="h-4 w-4 text-muted-foreground/70" />
                        <span className="text-sm font-medium text-foreground">Application</span>
                    </div>

                    {/* Check Updates Button */}
                    <button
                        onClick={() => checkBinaryUpdates('app')}
                        disabled={isCheckingAppUpdate}
                        className="group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm disabled:opacity-50 transition-all"
                    >
                        <RefreshCw className={`h-3 w-3 ${isCheckingAppUpdate ? 'animate-spin' : ''}`} />
                        <span>{isCheckingAppUpdate ? t('settings.updater.checking') : t('settings.updater.check_updates')}</span>
                    </button>
                </div>

                <div className="divide-y divide-border/50 bg-card/50">
                    <BinaryRow
                        name="SceneClip"
                        version={appVersion}
                        latest={appLatestVersion}
                        needsUpdate={appNeedsUpdate}
                        error={appUpdateError}
                        progress={appUpdateProgress}
                        onUpdate={() => installAppUpdate()}
                        onCancel={() => { }}
                        sourceUrl="https://github.com/Myunikon/SceneClip/releases"
                        t={t}
                    />
                </div>
            </div>

            {/* 2. Binary Versions Card */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
                <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <Terminal className="h-4 w-4 text-muted-foreground/70" />
                        <span className="text-sm font-medium text-foreground">{t('settings.updater.binary_versions')}</span>
                    </div>

                    {/* Check Binaries Button */}
                    <button
                        onClick={() => checkBinaryUpdates('binaries')}
                        disabled={isCheckingYtdlpUpdate}
                        className="group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm disabled:opacity-50 transition-all"
                    >
                        <RefreshCw className={`h-3 w-3 ${isCheckingYtdlpUpdate ? 'animate-spin' : ''}`} />
                        <span>{isCheckingYtdlpUpdate ? t('settings.updater.checking') : t('settings.updater.check_updates')}</span>
                    </button>
                </div>

                <div className="divide-y divide-border/50 bg-card/50">
                    <BinaryRow
                        name="yt-dlp"
                        version={ytdlpVersion}
                        latest={ytdlpLatestVersion}
                        needsUpdate={ytdlpNeedsUpdate}
                        integrityValid={ytdlpIntegrityValid}
                        error={ytdlpUpdateError}
                        progress={ytdlpUpdateProgress}
                        onUpdate={() => updateBinary('yt-dlp')}
                        onCancel={() => cancelUpdate('yt-dlp')}
                        sourceUrl="https://github.com/yt-dlp/yt-dlp/releases"
                        t={t}
                    />
                </div>
            </div>

            {/* Footer Note */}
            <p className="px-2 text-center text-[11px] text-muted-foreground/50">
                {t('settings.updater.binary_bundled')}
            </p>
        </div>
    )
}



function BinaryRow({ name, version, latest, needsUpdate, integrityValid = true, error, progress, onUpdate, onCancel, sourceUrl, allowUpdate = true, t }: {
    name: string,
    version: string | null,
    latest: string | null,
    needsUpdate: boolean,
    integrityValid?: boolean,
    error?: string,
    progress: number | null,
    onUpdate: () => void,
    onCancel: () => void,
    sourceUrl: string,
    allowUpdate?: boolean,
    t: any
}) {
    return (
        <div className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors group">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{name}</span>

                    {/* Source Link */}
                    <button
                        onClick={() => openUrl(sourceUrl)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                        title="View Source"
                    >
                        <ExternalLink className="h-3 w-3" />
                    </button>

                    {needsUpdate && !error && allowUpdate && (
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            Update Available
                        </span>
                    )}

                    {!integrityValid && (
                        <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400" title="Binary may be corrupted or missing.">
                            Corrupted
                        </span>
                    )}

                    {error && (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400" title={error}>
                            Check Failed
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-muted-foreground">{version || t('settings.updater.unknown')}</span>

                    {needsUpdate && latest && !error && allowUpdate && (
                        <div className="flex items-center gap-1.5 animate-pulse">
                            <span className="text-muted-foreground/40">→</span>
                            <span className="font-mono font-bold text-blue-600 dark:text-blue-400">
                                {latest}
                            </span>
                        </div>
                    )}

                    {latest && !needsUpdate && !error && integrityValid && (
                        <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
                            <CheckCircle className="h-3 w-3" />
                            <span>{t('settings.updater.up_to_date')}</span>
                        </span>
                    )}

                    {!integrityValid && (
                        <span className="text-orange-500 dark:text-orange-400 font-medium">
                            Health Check Failed
                        </span>
                    )}

                    {error && (
                        <span className="text-red-500 dark:text-red-400 font-medium">
                            {/* Shorten error message for UI */}
                            {error.includes("403") ? "Rate Limited" : "Network Error"}
                        </span>
                    )}
                </div>
            </div>

            {/* Right Side Actions */}
            <div className="min-w-[120px] flex justify-end">
                {progress !== null ? (
                    <div className="flex items-center gap-3 w-full max-w-[140px]">
                        <div className="flex-1 flex flex-col gap-1">
                            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                                <div
                                    className="h-full bg-blue-600 transition-all duration-300 ease-out"
                                    style={{ width: `${progress}%` }}
                                />
                            </div>
                            <span className="text-[10px] text-muted-foreground text-right font-mono">
                                {progress.toFixed(0)}%
                            </span>
                        </div>
                        <button
                            onClick={onCancel}
                            className="p-1 rounded-full hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                            title={t('common.cancel') || "Cancel"}
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18" /><path d="m6 6 12 12" /></svg>
                        </button>
                    </div>
                ) : (needsUpdate || !integrityValid) && !error && allowUpdate ? (
                    <button
                        onClick={onUpdate}
                        className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:shadow active:scale-95 ${!integrityValid ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                    >
                        <ArrowDownCircle className="h-3.5 w-3.5" />
                        {!integrityValid ? 'Repair' : t('updater_banner.update_now')}
                    </button>
                ) : (
                    <span className="text-xs font-medium text-muted-foreground/40 text-right min-w-[60px]">
                        {error ? '' : (latest && allowUpdate ? '' : (!integrityValid && allowUpdate ? '' : (allowUpdate ? t('settings.updater.latest') : 'Bundled')))}
                    </span>
                )}
            </div>
        </div>
    )
}
