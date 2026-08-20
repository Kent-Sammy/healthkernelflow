import type { StateCreator } from 'zustand'
import type { AppState } from '../store'
import type { Subscription } from '@/types'

export interface SubscriptionSlice {
  subscription: Subscription | null
  setSubscription: (subscription: Subscription) => void
}

export const createSubscriptionSlice: StateCreator<AppState, [], [], SubscriptionSlice> = (set) => ({
  subscription: null,

  setSubscription: (subscription) => set({ subscription }),
})
