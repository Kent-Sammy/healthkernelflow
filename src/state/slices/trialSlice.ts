import type { StateCreator } from 'zustand'
import type { AppState } from '../store'
import type { Trial } from '@/types'

export interface TrialSlice {
  trial: Trial | null
  setTrial: (trial: Trial) => void
  markTrialConverted: () => void
}

export const createTrialSlice: StateCreator<AppState, [], [], TrialSlice> = (set) => ({
  trial: null,

  setTrial: (trial) => set({ trial }),

  markTrialConverted: () =>
    set((state) => (state.trial ? { trial: { ...state.trial, status: 'converted' } } : state)),
})
