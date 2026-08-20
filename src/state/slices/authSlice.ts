import type { StateCreator } from 'zustand'
import type { AppState } from '../store'
import type { User } from '@/types'

export interface AuthSlice {
  currentUser: User | null
  isAuthenticated: boolean
  /** Sets the logged-in user (used by signup and login simulation, later phases). */
  setCurrentUser: (user: User) => void
  logout: () => void
}

export const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set) => ({
  currentUser: null,
  isAuthenticated: false,

  setCurrentUser: (user) => set({ currentUser: user, isAuthenticated: true }),

  logout: () => set({ currentUser: null, isAuthenticated: false }),
})
