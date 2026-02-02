import { Package, RefreshCw, CheckCircle, ArrowDownCircle, ExternalLink, Terminal, X } from 'lucide-react'
import { openUrl } from '@tauri-apps/plugin-opener'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { useShallow } from 'zustand/react/shallow'

export function Updater() {
    const { t } = useTranslation()

    const {
        appVersion,
        appLatestVersion,
        appNeedsUpdate,
        appUpdateError,
        appUpdateProgress,
        ytdlpVersion,
        ytdlpLatestVersion,
        ytdlpNeedsUpdate,
        ytdlpIntegrityValid,
        ytdlpUpdateError,
        ytdlpUpdateProgress,
        isCheckingAppUpdate,
        isCheckingYtdlpUpdate,
        checkBinaryUpdates,
        installAppUpdate,
        updateBinary,
        cancelUpdate
    } = useAppStore(useShallow(state => ({
        appVersion: state.appVersion,
        appLatestVersion: state.appLatestVersion,
        appNeedsUpdate: state.appNeedsUpdate,
        appUpdateError: state.appUpdateError,
        appUpdateProgress: state.appUpdateProgress,
        ytdlpVersion: state.ytdlpVersion,
        ytdlpLatestVersion: state.ytdlpLatestVersion,
        ytdlpNeedsUpdate: state.ytdlpNeedsUpdate,
        ytdlpIntegrityValid: state.ytdlpIntegrityValid,
        ytdlpUpdateError: state.ytdlpUpdateError,
        ytdlpUpdateProgress: state.ytdlpUpdateProgress,
        isCheckingAppUpdate: state.isCheckingAppUpdate,
        isCheckingYtdlpUpdate: state.isCheckingYtdlpUpdate,
        checkBinaryUpdates: state.checkBinaryUpdates,
        installAppUpdate: state.installAppUpdate,
        updateBinary: state.updateBinary,
        cancelUpdate: state.cancelUpdate
    })))

    const appState = {
        version: appVersion,
        latest: appLatestVersion,
        needsUpdate: appNeedsUpdate,
        error: appUpdateError,
        progress: appUpdateProgress
    }

    const ytdlpState = {
        version: ytdlpVersion,
        latest: ytdlpLatestVersion,
        needsUpdate: ytdlpNeedsUpdate,
        error: ytdlpUpdateError,
        progress: ytdlpUpdateProgress,
        integrityValid: ytdlpIntegrityValid
    }

    return (
        <div className="flex flex-col space-y-6">
            {/* 1. Application Version Card */}
            <BinaryCard
                title="Application"
                icon={Package}
                isChecking={isCheckingAppUpdate}
                onCheck={() => checkBinaryUpdates('app')}
                checkingText={t('settings.updater.checking')}
                checkText={t('settings.updater.check_updates')}
            >
                <BinaryRow
                    name="SceneClip"
                    version={appState.version}
                    latest={appState.latest}
                    needsUpdate={appState.needsUpdate}
                    error={appState.error}
                    progress={appState.progress}
                    onUpdate={installAppUpdate}
                    onCancel={() => cancelUpdate('app')}
                    sourceUrl="https://github.com/Myunikon/SceneClip/releases"
                    t={t}
                />
            </BinaryCard>

            {/* 2. Binary Versions Card */}
            <BinaryCard
                title={t('settings.updater.binary_versions')}
                icon={Terminal}
                isChecking={isCheckingYtdlpUpdate}
                onCheck={() => checkBinaryUpdates('binaries')}
                checkingText={t('settings.updater.checking')}
                checkText={t('settings.updater.check_updates')}
            >
                <BinaryRow
                    name="yt-dlp"
                    version={ytdlpState.version}
                    latest={ytdlpState.latest}
                    needsUpdate={ytdlpState.needsUpdate}
                    integrityValid={ytdlpState.integrityValid}
                    error={ytdlpState.error}
                    progress={ytdlpState.progress}
                    onUpdate={() => updateBinary('yt-dlp')}
                    onCancel={() => cancelUpdate('yt-dlp')}
                    sourceUrl="https://github.com/yt-dlp/yt-dlp/releases"
                    t={t}
                />
            </BinaryCard>

            {/* Footer Note */}
            <p className="px-2 text-center text-[11px] text-muted-foreground/50">
                {t('settings.updater.binary_bundled')}
            </p>
        </div>
    )
}

function BinaryCard({ title, icon: Icon, isChecking, onCheck, checkingText, checkText, children }: any) {
    return (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">
            <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-3">
                <div className="flex items-center gap-2.5">
                    <Icon className="h-4 w-4 text-muted-foreground/70" />
                    <span className="text-sm font-medium text-foreground">{title}</span>
                </div>
                <button
                    onClick={onCheck}
                    disabled={isChecking}
                    className="group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm disabled:opacity-50 transition-all"
                >
                    <RefreshCw className={`h-3 w-3 ${isChecking ? 'animate-spin' : ''}`} />
                    <span>{isChecking ? checkingText : checkText}</span>
                </button>
            </div>
            <div className="divide-y divide-border/50 bg-card/50">
                {children}
            </div>
        </div>
    )
}

interface BinaryRowProps {
    name: string
    version: string | null
    latest: string | null
    needsUpdate: boolean
    integrityValid?: boolean
    error?: string | null
    progress: number | null
    onUpdate: () => void
    onCancel: () => void
    sourceUrl: string
    t: any
}

function BinaryRow({ name, version, latest, needsUpdate, integrityValid = true, error, progress, onUpdate, onCancel, sourceUrl, t }: BinaryRowProps) {
    const isUpdating = progress !== null

    return (
        <div className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors group">
            <div className="flex flex-col gap-0.5">
                <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">{name}</span>

                    <button
                        onClick={() => openUrl(sourceUrl)}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-primary"
                        title="View Source"
                    >
                        <ExternalLink className="h-3 w-3" />
                    </button>

                    {/* Status Badges */}
                    {needsUpdate && !error && (
                        <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                            {t('settings.updater.update_available') || 'Update Available'}
                        </span>
                    )}

                    {!integrityValid && (
                        <span className="inline-flex items-center rounded-full bg-orange-500/10 px-2 py-0.5 text-[10px] font-semibold text-orange-600 dark:text-orange-400">
                            Corrupted
                        </span>
                    )}

                    {error && (
                        <span className="inline-flex items-center rounded-full bg-red-500/10 px-2 py-0.5 text-[10px] font-semibold text-red-600 dark:text-red-400">
                            Check Failed
                        </span>
                    )}
                </div>

                <div className="flex items-center gap-2 text-xs">
                    <span className="font-mono text-muted-foreground">{version || t('settings.updater.unknown')}</span>

                    {needsUpdate && latest && !error && (
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
                </div>
            </div>

            {/* Actions */}
            <div className="min-w-[120px] flex justify-end">
                {isUpdating ? (
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
                            title={t('common.cancel')}
                        >
                            <X className="h-3.5 w-3.5" />
                        </button>
                    </div>
                ) : (
                    <>
                        {(needsUpdate || !integrityValid) && !error ? (
                            <button
                                onClick={onUpdate}
                                className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:shadow active:scale-95 ${!integrityValid ? 'bg-orange-600 hover:bg-orange-700' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                <ArrowDownCircle className="h-3.5 w-3.5" />
                                <span>{!integrityValid ? 'Repair' : t('settings.updater.update_now')}</span>
                            </button>
                        ) : (
                            <span className="text-xs font-medium text-muted-foreground/40 text-right min-w-[60px]">
                                {error ? (error.includes("403") ? "Rate Limited" : "Error") : t('settings.updater.latest')}
                            </span>
                        )}
                    </>
                )}
            </div>
        </div>
    )
}
