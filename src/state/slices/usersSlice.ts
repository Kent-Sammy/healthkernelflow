import type { StateCreator } from 'zustand'
import type { AppState } from '../store'
import type { User, UserRole } from '@/types'

export interface UsersSlice {
  users: User[]
  setUsers: (users: User[]) => void
  addUser: (user: User) => void
  removeUser: (userId: string) => void
  updateUserRole: (userId: string, role: UserRole) => void
}

export const createUsersSlice: StateCreator<AppState, [], [], UsersSlice> = (set) => ({
  users: [],

  setUsers: (users) => set({ users }),

  addUser: (user) => set((state) => ({ users: [...state.users, user] })),

  removeUser: (userId) => set((state) => ({ users: state.users.filter((u) => u.id !== userId) })),

  updateUserRole: (userId, role) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === userId ? { ...u, role } : u)),
    })),
})
