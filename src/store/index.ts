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
        version: 8, // Bump to 8 to clear stale update flags
        storage: createJSONStorage(() => tauriStorage),
        partialize: (state) => ({
          // NOTE: 'tasks' is NOT persisted here. Rust (queue.json) is the source of truth.
          // The queue is loaded via initializeQueue() -> get_queue_state command.
          settings: state.settings,
          gpuType: state.gpuType,
        }),
        // Migration handles structural changes between versions
        migrate: (persistedState: unknown, version: number) => {
          let state = persistedState as Record<string, unknown>;

          if (version < 6) {
            console.log('Migrating store to version 6 (Applying baseline defaults)');
            state = { ...state, settings: DEFAULT_SETTINGS };
          }

          if (version < 8) {
            console.log('Migrating to v8: Clearing stale update status');
            // Strip out any accidental SystemSlice persistence
            // We only want to keep tasks, settings, and gpuType
            return {
              tasks: state.tasks,
              settings: state.settings,
              gpuType: state.gpuType
            };
          }

          return state;
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
