import type { StateCreator } from 'zustand'
import type { AppState } from '../store'
import type { CustomConfiguration, PlanId } from '@/types'
import { nowIso } from '@/lib/id'

export interface PlanSlice {
  selectedPlanId: PlanId | null
  /** Only populated when the customer goes through the Custom flow. */
  customConfiguration: CustomConfiguration | null

  selectPlan: (planId: PlanId) => void
  setCustomConfiguration: (config: CustomConfiguration) => void
  updateCustomConfiguration: (patch: Partial<Omit<CustomConfiguration, 'id' | 'organizationId' | 'createdAt'>>) => void
}

export const createPlanSlice: StateCreator<AppState, [], [], PlanSlice> = (set) => ({
  selectedPlanId: null,
  customConfiguration: null,

  selectPlan: (planId) => set({ selectedPlanId: planId }),

  setCustomConfiguration: (config) => set({ customConfiguration: config, selectedPlanId: 'custom' }),

  updateCustomConfiguration: (patch) =>
    set((state) => {
      if (!state.customConfiguration) return state
      return {
        customConfiguration: { ...state.customConfiguration, ...patch, updatedAt: nowIso() },
      }
    }),
})
