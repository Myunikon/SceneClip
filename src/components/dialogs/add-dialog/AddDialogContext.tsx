import { createContext, useContext } from 'react'
import { VideoMeta, DialogOptions, DialogOptionSetters } from '../../../types'
import { LanguageOption } from '../../../lib/mediaUtils'

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

    // Available Options (Computed)
    availableResolutions?: number[]
    availableAudioBitrates?: number[]
    availableVideoCodecs?: string[]
    availableAudioCodecs?: string[]
    availableContainers?: string[]
    availableLanguages?: LanguageOption[]

    // Utilities
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    t: any
    browse: () => void
    handlePaste: () => void
    formatFileSize: (bytes?: number) => string
    estimatedSize: number
    isDiskFull: boolean
    diskFreeSpace: number | null
    settings: any // Using any to avoid circular dependency with AppSettings for now, or import it if clean
}

const AddDialogContext = createContext<AddDialogContextType | null>(null)

// eslint-disable-next-line react-refresh/only-export-components
export const useAddDialogContext = () => {
    const context = useContext(AddDialogContext)
    if (!context) {
        throw new Error("useAddDialogContext must be used within an AddDialogProvider (AddDialog component)")
    }
    return context
}

export const AddDialogProvider = AddDialogContext.Provider
