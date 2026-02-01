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
            "relative z-20 p-6 space-y-6 transition-all duration-300 ease-out panel-left",
            hasMeta ? "w-[26rem] shrink-0 border-r border-white/5 bg-black/5 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.5)]" : "w-full"
        )}>
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
    )
}
