import type { StateCreator } from 'zustand'
import type { AppState } from '../store'
import type { Facility } from '@/types'

export interface FacilitiesSlice {
  facilities: Facility[]
  setFacilities: (facilities: Facility[]) => void
  addFacility: (facility: Facility) => void
  removeFacility: (facilityId: string) => void
}

export const createFacilitiesSlice: StateCreator<AppState, [], [], FacilitiesSlice> = (set) => ({
  facilities: [],

  setFacilities: (facilities) => set({ facilities }),

  addFacility: (facility) => set((state) => ({ facilities: [...state.facilities, facility] })),

  removeFacility: (facilityId) =>
    set((state) => ({ facilities: state.facilities.filter((f) => f.id !== facilityId) })),
})
