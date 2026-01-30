import { Package, RefreshCw, CheckCircle, ArrowDownCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { useAppStore } from '../../store'
import { useEffect } from 'react'

export function Updater() {
    const {
        ytdlpVersion, ytdlpLatestVersion, ytdlpNeedsUpdate,
        checkBinaryUpdates, isCheckingUpdates, updateBinary
    } = useAppStore()

    const { t } = useTranslation()

    // Auto-check on mount if never checked before
    useEffect(() => {
        if (!ytdlpLatestVersion && !isCheckingUpdates) {
            checkBinaryUpdates()
        }
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    return (
        <div className="flex flex-col space-y-4">
            {/* Apple-style Grouped List Container */}
            <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm">

                {/* Section Header (Integrated like macOS Settings) */}
                <div className="flex items-center justify-between border-b border-border/50 bg-muted/30 px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <Package className="h-4 w-4 text-muted-foreground/70" />
                        <span className="text-sm font-medium text-foreground">{t('settings.updater.binary_versions')}</span>
                    </div>

                    {/* Secondary Action: Check for Updates */}
                    <button
                        onClick={() => checkBinaryUpdates()}
                        disabled={isCheckingUpdates}
                        className="group flex items-center gap-1.5 rounded-md px-2 py-1 text-xs font-medium text-muted-foreground hover:bg-background hover:text-foreground hover:shadow-sm disabled:opacity-50 transition-all"
                    >
                        <RefreshCw className={`h-3 w-3 ${isCheckingUpdates ? 'animate-spin' : ''}`} />
                        <span>{isCheckingUpdates ? t('settings.updater.checking') : t('settings.updater.check_updates')}</span>
                    </button>
                </div>

                {/* List Items */}
                <div className="divide-y divide-border/50 bg-card/50">
                    {/* Item: yt-dlp */}
                    <div className="flex items-center justify-between px-4 py-3.5 hover:bg-muted/20 transition-colors">
                        <div className="flex flex-col gap-0.5">
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-foreground">yt-dlp</span>
                                {ytdlpNeedsUpdate && (
                                    <span className="inline-flex items-center rounded-full bg-blue-500/10 px-2 py-0.5 text-[10px] font-semibold text-blue-600 dark:text-blue-400">
                                        Update Available
                                    </span>
                                )}
                            </div>
                            <div className="flex items-center gap-2 text-xs">
                                <span className="font-mono text-muted-foreground">{ytdlpVersion || t('settings.updater.unknown')}</span>
                                {ytdlpLatestVersion && !ytdlpNeedsUpdate && (
                                    <span className="flex items-center gap-1 text-green-600 dark:text-green-500">
                                        <CheckCircle className="h-3 w-3" />
                                        <span>{t('settings.updater.up_to_date')}</span>
                                    </span>
                                )}
                            </div>
                        </div>

                        {/* Right Side Actions */}
                        <div>
                            {ytdlpNeedsUpdate ? (
                                <button
                                    onClick={() => updateBinary('yt-dlp')}
                                    className="flex items-center gap-2 rounded-full bg-blue-600 px-4 py-1.5 text-xs font-medium text-white shadow-sm transition-all hover:bg-blue-700 hover:shadow active:scale-95"
                                >
                                    <ArrowDownCircle className="h-3.5 w-3.5" />
                                    {t('updater_banner.update_now')}
                                </button>
                            ) : (
                                <span className="text-xs font-medium text-muted-foreground/40">
                                    {t('settings.updater.latest')}
                                </span>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Footer Note */}
            <p className="px-2 text-center text-[11px] text-muted-foreground/50">
                {t('settings.updater.binary_bundled')}
            </p>
        </div>
    )
}
