import { createContext, useContext } from 'react'
import { VideoMeta, DialogOptions, DialogOptionSetters, AppTranslations } from '../../types'

interface AddDialogContextType {
    url: string
    setUrl: (url: string) => void

    // Core State
    options: DialogOptions
    setters: DialogOptionSetters

    // Metadata
    meta: VideoMeta | null
    loadingMeta: boolean
    errorMeta: boolean
    hasMeta: boolean

    // Available Options (Computed)
    availableResolutions?: number[]
    availableAudioBitrates?: number[]
    availableVideoCodecs?: string[]
    availableAudioCodecs?: string[]
    availableLanguages?: any[]

    // Utilities
    t: AppTranslations['dialog']
    browse: () => void
    handlePaste: () => void
    formatFileSize: (bytes?: number) => string
    estimatedSize: number
    isDiskFull: boolean
    diskFreeSpace: number | null
}

const AddDialogContext = createContext<AddDialogContextType | null>(null)

export const useAddDialogContext = () => {
    const context = useContext(AddDialogContext)
    if (!context) {
        throw new Error("useAddDialogContext must be used within an AddDialogProvider (AddDialog component)")
    }
    return context
}

export const AddDialogProvider = AddDialogContext.Provider
