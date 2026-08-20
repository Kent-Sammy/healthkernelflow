import type { StateCreator } from 'zustand'
import type { AppState } from '../store'
import type { OnboardingProgress, OnboardingStepId } from '@/types'
import { nowIso } from '@/lib/id'

export interface OnboardingSlice {
  onboarding: OnboardingProgress | null
  startOnboarding: (progress: OnboardingProgress) => void
  setCurrentStep: (stepId: OnboardingStepId) => void
  completeStep: (stepId: OnboardingStepId) => void
}

export const createOnboardingSlice: StateCreator<AppState, [], [], OnboardingSlice> = (set) => ({
  onboarding: null,

  startOnboarding: (progress) => set({ onboarding: progress }),

  setCurrentStep: (stepId) =>
    set((state) => {
      if (!state.onboarding) return state
      return { onboarding: { ...state.onboarding, currentStepId: stepId, updatedAt: nowIso() } }
    }),

  completeStep: (stepId) =>
    set((state) => {
      if (!state.onboarding) return state
      const completed = state.onboarding.completedStepIds.includes(stepId)
        ? state.onboarding.completedStepIds
        : [...state.onboarding.completedStepIds, stepId]
      return { onboarding: { ...state.onboarding, completedStepIds: completed, updatedAt: nowIso() } }
    }),
})
