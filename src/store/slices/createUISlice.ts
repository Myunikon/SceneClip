import { StateCreator } from 'zustand'
import { AppState, UISlice } from './types'

let confirmationResolver: ((value: boolean) => void) | null = null

export const createUISlice: StateCreator<AppState, [], [], UISlice> = (set) => ({
  showBinaryConfirmation: false,
  missingBinaries: [],

  requestBinaryConfirmation: (missing) => {
      set({ showBinaryConfirmation: true, missingBinaries: missing })
      return new Promise((resolve) => {
          confirmationResolver = resolve
      })
  },

  respondBinaryConfirmation: (answer) => {
      set({ showBinaryConfirmation: false })
      if (confirmationResolver) {
          confirmationResolver(answer)
          confirmationResolver = null
      }
  },


})
