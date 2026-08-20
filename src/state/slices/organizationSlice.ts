import type { StateCreator } from 'zustand'
import type { AppState } from '../store'
import type { Organization } from '@/types'
import { nowIso } from '@/lib/id'

export interface OrganizationSlice {
  organization: Organization | null
  setOrganization: (organization: Organization) => void
  updateOrganization: (patch: Partial<Omit<Organization, 'id' | 'createdAt'>>) => void
}

export const createOrganizationSlice: StateCreator<AppState, [], [], OrganizationSlice> = (set) => ({
  organization: null,

  setOrganization: (organization) => set({ organization }),

  updateOrganization: (patch) =>
    set((state) => {
      if (!state.organization) return state
      return {
        organization: { ...state.organization, ...patch, updatedAt: nowIso() },
      }
    }),
})
