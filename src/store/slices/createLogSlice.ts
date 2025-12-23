import { StateCreator } from 'zustand'
import { AppState, LogSlice } from './types'

export const createLogSlice: StateCreator<AppState, [], [], LogSlice> = (set) => ({
  logs: [],
  addLog: (msg) => set(state => {
      const newLogs = [...state.logs, { message: msg, timestamp: Date.now() }]
      // Limit log buffer to 500 entries to prevent memory growth
      if (newLogs.length > 500) {
          newLogs.shift()
      }
      return { logs: newLogs }
  }),
  clearLogs: () => set({ logs: [] }),
})
