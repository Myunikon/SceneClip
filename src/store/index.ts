import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

import { AppState } from './slices/types'
import { createUISlice } from './slices/createUISlice'
import { createLogSlice } from './slices/createLogSlice'
import { createSettingsSlice } from './slices/createSettingsSlice'
import { createSystemSlice } from './slices/createSystemSlice'
import { createVideoSlice } from './slices/createVideoSlice'

export type { DownloadTask, AppState } from './slices/types'

export const useAppStore = create<AppState>()(
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
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ 
          tasks: state.tasks, 
          settings: state.settings,
          gpuType: state.gpuType 
      }),
    }
  )
)
