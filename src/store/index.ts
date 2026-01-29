import { create } from 'zustand'
import { persist, createJSONStorage, devtools } from 'zustand/middleware'

import { AppState } from './slices/types'
import { createUISlice } from './slices/createUISlice'
import { createLogSlice } from './slices/createLogSlice'
import { createSettingsSlice, DEFAULT_SETTINGS } from './slices/createSettingsSlice'
import { createSystemSlice } from './slices/createSystemSlice'
import { createVideoSlice } from './slices/createVideoSlice'
import { tauriStorage } from './storage'

export type { DownloadTask, AppState, CompressionOptions } from './slices/types'

// Helper for robust settings merging (Value preservation)
const isObject = (item: any) => item && typeof item === 'object' && !Array.isArray(item);

const deepMerge = (target: any, source: any): any => {
  if (!source) return target;
  const output = { ...target };
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach((key) => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] });
        } else {
          output[key] = deepMerge(target[key], source[key]);
        }
      } else {
        Object.assign(output, { [key]: source[key] });
      }
    });
  }
  return output;
};

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
        name: 'app-storage-v5-clean',
        version: 7, // Bumped to 7 for robust deep merging
        storage: createJSONStorage(() => tauriStorage),
        partialize: (state) => ({
          tasks: state.tasks,
          settings: state.settings, // We persist the whole settings object
          gpuType: state.gpuType,
        }),
        // Migration handles structural changes between versions
        migrate: (persistedState: unknown, version: number) => {
          if (version < 6) {
            console.log('Migrating store to version 6 (Applying baseline defaults)');
            const state = persistedState as Record<string, unknown>;
            return {
              ...state,
              settings: DEFAULT_SETTINGS,
            };
          }
          return persistedState;
        },
        // Merge handles combining defaults with persisted user data
        merge: (persistedState, currentState) => {
          console.log('Hydrating store: Merging persisted state with defaults');
          return deepMerge(currentState, persistedState);
        }
      }
    )
  )
)
