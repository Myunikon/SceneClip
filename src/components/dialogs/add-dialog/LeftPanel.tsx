import { UrlInput } from './UrlInput'
import { VideoPreview } from './VideoPreview'
import { FilenameSettings } from './FilenameSettings'
import { useAddDialogContext } from './AddDialogContext'

export function LeftPanel() {
    const {
        url, setUrl, handlePaste, t,
        loadingMeta, meta, errorMeta,
        options, setters,
        browse
    } = useAddDialogContext()

    const hasMeta = !!meta

    return (
        <div className={`relative z-20 p-6 space-y-6 lg:overflow-y-auto transition-all duration-300 ease-out ${hasMeta ? 'lg:w-[26rem] xl:w-[28rem] shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 bg-black/5 shadow-[5px_0_15px_-5px_rgba(0,0,0,0.5)]' : 'w-full'}`}>
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
