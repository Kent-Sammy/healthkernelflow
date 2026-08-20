import { useMemo } from 'react'
import { useAppStore } from './store'
import {
  resolvePlanEntitlements,
  getAccessibleFeatures,
  hasFeatureAccess as hasFeatureAccessFn,
  getTrialStatus,
  getTrialDaysRemaining,
  getTrialDayNumber,
  checkLimit,
} from '@/lib/entitlements'
import { getFixedPlanById } from '@/config/plans'
import type { FeatureKey, LimitCheck, TrialStatus, UsageSnapshot } from '@/types'

/**
 * DERIVED STATE SELECTORS
 * ------------------------------------------------------------------------
 * Components should reach for these instead of reading raw store fields
 * and re-deriving entitlements/usage/trial status themselves. Keeping the
 * derivation in one place is what guarantees the sidebar, the trial badge
 * and the usage meters can never show three different answers to "is this
 * org still on trial".
 */

/** The current org's resolved feature entitlements (plan, or custom capabilities). Empty set if no plan selected yet. */
export function useEntitlements(): Set<FeatureKey> {
  const selectedPlanId = useAppStore((s) => s.selectedPlanId)
  const customConfiguration = useAppStore((s) => s.customConfiguration)

  return useMemo(() => {
    if (!selectedPlanId) return new Set<FeatureKey>()
    return resolvePlanEntitlements(selectedPlanId, customConfiguration?.capabilities)
  }, [selectedPlanId, customConfiguration])
}

/** Whether the CURRENT USER can access a feature (plan entitlement AND role permission both pass). */
export function useHasFeatureAccess(feature: FeatureKey): boolean {
  const entitlements = useEntitlements()
  const currentUser = useAppStore((s) => s.currentUser)
  if (!currentUser) return false
  return hasFeatureAccessFn(entitlements, currentUser.role, feature)
}

/** Every feature the current user can see — the data source for the future dynamic sidebar. */
export function useAccessibleFeatures(): FeatureKey[] {
  const entitlements = useEntitlements()
  const currentUser = useAppStore((s) => s.currentUser)

  return useMemo(() => {
    if (!currentUser) return []
    return getAccessibleFeatures(entitlements, currentUser.role)
  }, [entitlements, currentUser])
}

/** Facilities/users usage vs. the active plan's limits (or the Custom configuration's configured counts). */
export function useUsage(): UsageSnapshot {
  const organization = useAppStore((s) => s.organization)
  const facilities = useAppStore((s) => s.facilities)
  const users = useAppStore((s) => s.users)
  const selectedPlanId = useAppStore((s) => s.selectedPlanId)
  const customConfiguration = useAppStore((s) => s.customConfiguration)

  const limits = useMemo(() => {
    if (!selectedPlanId) return { facilities: null as number | null, users: null as number | null }
    if (selectedPlanId === 'custom') {
      return {
        facilities: customConfiguration?.facilitiesCount ?? null,
        users: customConfiguration?.usersCount ?? null,
      }
    }
    return getFixedPlanById(selectedPlanId).limits
  }, [selectedPlanId, customConfiguration])

  return {
    organizationId: organization?.id ?? '',
    facilitiesUsed: facilities.length,
    facilitiesLimit: limits.facilities,
    usersUsed: users.length,
    usersLimit: limits.users,
    computedAt: new Date().toISOString(),
  }
}

export function useFacilitiesLimit(): LimitCheck {
  const usage = useUsage()
  return checkLimit(usage.facilitiesUsed, usage.facilitiesLimit)
}

export function useUsersLimit(): LimitCheck {
  const usage = useUsage()
  return checkLimit(usage.usersUsed, usage.usersLimit)
}

export interface TrialInfo {
  status: TrialStatus
  daysRemaining: number
  dayNumber: number
}

/** Live-derived trial status/countdown. Returns null when there's no trial (new visitor, or already subscribed without ever trialing). */
export function useTrialInfo(): TrialInfo | null {
  const trial = useAppStore((s) => s.trial)

  return useMemo(() => {
    if (!trial) return null
    return {
      status: getTrialStatus(trial),
      daysRemaining: getTrialDaysRemaining(trial),
      dayNumber: getTrialDayNumber(trial),
    }
  }, [trial])
}
