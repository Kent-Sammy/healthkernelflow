import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storage } from '@/lib/storage'

import { createAuthSlice, type AuthSlice } from './slices/authSlice'
import { createOrganizationSlice, type OrganizationSlice } from './slices/organizationSlice'
import { createFacilitiesSlice, type FacilitiesSlice } from './slices/facilitiesSlice'
import { createUsersSlice, type UsersSlice } from './slices/usersSlice'
import { createPlanSlice, type PlanSlice } from './slices/planSlice'
import { createTrialSlice, type TrialSlice } from './slices/trialSlice'
import { createSubscriptionSlice, type SubscriptionSlice } from './slices/subscriptionSlice'
import { createOnboardingSlice, type OnboardingSlice } from './slices/onboardingSlice'

/**
 * ROOT APPLICATION STATE
 * ------------------------------------------------------------------------
 * Combines every domain slice into one persisted store. This is the
 * client-side stand-in for "the backend's source of truth" — components
 * never read mock data directly, they read from here (or, more often,
 * from the derived selectors in `state/selectors.ts`), and mutations go
 * through service functions, not direct `set()` calls from components.
 *
 * Persisted to localStorage (namespaced, see `lib/storage.ts`) so a page
 * refresh doesn't lose the simulated account/org/trial/subscription — this
 * is what makes "persistent application state" work without a real
 * backend.
 */
export type AppState = AuthSlice &
  OrganizationSlice &
  FacilitiesSlice &
  UsersSlice &
  PlanSlice &
  TrialSlice &
  SubscriptionSlice &
  OnboardingSlice & {
    /** Wipes all persisted domain state back to "new visitor". Used by the dev/demo reset tool (later phase) and account deletion (future). */
    resetAll: () => void
  }

function getResetState(): Partial<AppState> {
  return {
    currentUser: null,
    isAuthenticated: false,
    organization: null,
    facilities: [],
    users: [],
    selectedPlanId: null,
    customConfiguration: null,
    trial: null,
    subscription: null,
    onboarding: null,
  }
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get, api) => ({
      ...createAuthSlice(set, get, api),
      ...createOrganizationSlice(set, get, api),
      ...createFacilitiesSlice(set, get, api),
      ...createUsersSlice(set, get, api),
      ...createPlanSlice(set, get, api),
      ...createTrialSlice(set, get, api),
      ...createSubscriptionSlice(set, get, api),
      ...createOnboardingSlice(set, get, api),

      resetAll: () => set(getResetState()),
    }),
    {
      name: 'app-state',
      storage: createJSONStorage(() => storage.zustandAdapter),
      version: 1,
    },
  ),
)
