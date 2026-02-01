import { StateCreator } from 'zustand'
import { AppState, LogSlice, LogEntry } from './types'

export const createLogSlice: StateCreator<AppState, [], [], LogSlice> = (set) => ({
    logs: [],
    addLog: (entry) => set(state => {
        const newLogs: LogEntry[] = [...state.logs, {
            ...entry,
            id: typeof crypto !== 'undefined' && crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2) + Date.now().toString(36),
            timestamp: Date.now()
        }]
        if (newLogs.length > 1000) {
            newLogs.shift()
        }
        return { logs: newLogs }
    }),
    clearLogs: () => set({ logs: [] }),
    removeLog: (index) => set(state => ({
        logs: state.logs.filter((_, i) => i !== index)
    })),
})

