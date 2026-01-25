import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

import { AppState } from './slices/types'
import { createUISlice } from './slices/createUISlice'
import { createLogSlice } from './slices/createLogSlice'
import { createSettingsSlice } from './slices/createSettingsSlice'
import { createSystemSlice } from './slices/createSystemSlice'
import { createVideoSlice } from './slices/createVideoSlice'
import { tauriStorage } from './storage'

export type { DownloadTask, AppState, CompressionOptions } from './slices/types'

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (...a) => ({
        ...createUISlice(...a),
        ...createLogSlice(...a),
        ...createSettingsSlice(...a),
        ...createSystemSlice(...a),
        ...createVideoSlice(...a),
      }),
      {
        name: 'app-storage-v2',
        storage: createJSONStorage(() => tauriStorage),
        partialize: (state) => ({
          tasks: state.tasks,
          settings: state.settings,
          gpuType: state.gpuType
        }),
      }
    )
  )
)
