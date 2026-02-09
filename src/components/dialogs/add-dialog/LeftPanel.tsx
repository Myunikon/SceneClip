import { UrlInput } from './UrlInput'
import { VideoPreview } from './VideoPreview'
import { FilenameSettings } from './FilenameSettings'
import { useAddDialogContext } from './AddDialogContext'
import { cn } from '../../../lib/utils'

export function LeftPanel() {
    const {
        url, setUrl, handlePaste, t,
        loadingMeta, meta, errorMeta,
        options, setters,
        browse
    } = useAddDialogContext()

    const hasMeta = !!meta

    return (
        <div className={cn(
            "flex flex-col transition-all duration-300 panel-left min-w-0 custom-scrollbar",
            hasMeta ? "flex-[0.7] border-r border-border/40 bg-background/50 backdrop-blur-xl shadow-[5px_0_15px_-5px_rgba(0,0,0,0.2)] min-w-[320px]" : "flex-1 w-full"
        )}>
            <div className="flex-1 w-full cq-p-6 flex flex-col cq-gap-4">
                <UrlInput
                    url={url}
                    onChange={setUrl}
                    onPaste={handlePaste}
                    t={t}
                    batchMode={options.batchMode}
                    onBatchModeChange={setters.setBatchMode}
                />

                {!options.batchMode && <VideoPreview loading={loadingMeta} meta={meta} error={errorMeta} t={t} url={url} />}

                <FilenameSettings
                    options={options}
                    setters={setters}
                    meta={meta}
                    t={t}
                    browse={browse}
                />
            </div>
        </div>
    )
}
