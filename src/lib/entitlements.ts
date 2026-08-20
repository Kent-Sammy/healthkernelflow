import { getFixedPlanById, ROLE_PERMISSIONS, CUSTOM_SERVICE_OPTIONS } from '@/config'
import { STARTER_PLAN } from '@/config/plans'
import { roleGrantsFeature } from '@/config/roles'
import { ALL_FEATURE_KEYS } from '@/config/features'
import type { FeatureKey, LimitCheck, PlanId, Trial, TrialStatus, UserRole } from '@/types'

/**
 * ENTITLEMENT ENGINE
 * ------------------------------------------------------------------------
 * The bridge between "what plan is this org on" and "what can this org's
 * UI show". Every place that needs to know "can we show X" should go
 * through this module (usually via the `useEntitlements` state selector),
 * not read plan config directly.
 *
 *   PLAN            -> resolvePlanEntitlements()
 *   FEATURE ENTITLEMENT + USER ROLE -> hasFeatureAccess()
 *   TRIAL DATES      -> getTrialStatus() / getTrialDaysRemaining()
 *   USAGE vs LIMITS  -> checkLimit()
 */

/** Every org — fixed or custom — gets at least the Starter baseline. */
const CUSTOM_BASE_FEATURES: FeatureKey[] = STARTER_PLAN.featureKeys

/**
 * Resolves the entitlement set for a fixed plan. Custom plans don't have a
 * static list — use `resolveCustomCapabilities` first, then pass the
 * result here as `customCapabilities`.
 */
export function resolvePlanEntitlements(planId: PlanId, customCapabilities?: FeatureKey[]): Set<FeatureKey> {
  if (planId === 'custom') {
    return new Set([...CUSTOM_BASE_FEATURES, ...(customCapabilities ?? [])])
  }
  return new Set(getFixedPlanById(planId).featureKeys)
}

/** Maps a Custom flow's selected service IDs to the feature keys they grant. */
export function resolveCustomCapabilities(serviceIds: string[]): FeatureKey[] {
  const keys = new Set<FeatureKey>(CUSTOM_BASE_FEATURES)
  for (const serviceId of serviceIds) {
    const option = CUSTOM_SERVICE_OPTIONS.find((o) => o.id === serviceId)
    option?.featureKeys.forEach((k) => keys.add(k))
  }
  return Array.from(keys)
}

/**
 * The two-gate access check: the feature must be entitled to the
 * ORGANIZATION'S plan, AND the ROLE must be granted that feature.
 */
export function hasFeatureAccess(entitlements: Set<FeatureKey>, role: UserRole, feature: FeatureKey): boolean {
  return entitlements.has(feature) && roleGrantsFeature(role, feature)
}

/** Every feature a given role can see, filtered down from the org's plan entitlements. Powers the future dynamic sidebar. */
export function getAccessibleFeatures(entitlements: Set<FeatureKey>, role: UserRole): FeatureKey[] {
  return ALL_FEATURE_KEYS.filter((key) => hasFeatureAccess(entitlements, role, key))
}

// ---------------------------------------------------------------------------
// Custom pricing estimate
// ---------------------------------------------------------------------------

/**
 * Deterministic, transparent placeholder pricing heuristic for the Custom
 * flow's "estimated price" step. This is intentionally simple and
 * frontend-only — real custom pricing would ultimately be confirmed by a
 * sales/backend process. Rounds to the nearest ₦5,000 for a clean quote.
 */
export function estimateCustomPrice(input: { facilitiesCount: number; usersCount: number; serviceIds: string[] }): number {
  const facilities = Math.max(1, input.facilitiesCount || 1)
  const users = Math.max(1, input.usersCount || 1)
  const serviceCount = input.serviceIds.length

  const facilityCost = 150_000 + Math.max(0, facilities - 1) * 60_000
  const userBlocksBeyondTen = Math.ceil(Math.max(0, users - 10) / 5)
  const userCost = userBlocksBeyondTen * 20_000
  const serviceCost = serviceCount * 35_000

  const rawEstimate = facilityCost + userCost + serviceCost
  return Math.round(rawEstimate / 5000) * 5000
}

// ---------------------------------------------------------------------------
// Trial status
// ---------------------------------------------------------------------------

const MS_PER_DAY = 1000 * 60 * 60 * 24

/**
 * Derives the LIVE trial status from dates rather than trusting a stored
 * value, so the countdown and the status badge can never disagree. The
 * only state this can't derive is `converted`, which is set explicitly
 * when a subscription is created.
 */
export function getTrialStatus(trial: Trial, now: Date = new Date()): TrialStatus {
  if (trial.status === 'converted') return 'converted'

  const endsAt = new Date(trial.endsAt).getTime()
  const nowMs = now.getTime()

  if (nowMs >= endsAt) return 'expired'

  const daysRemaining = (endsAt - nowMs) / MS_PER_DAY
  if (daysRemaining <= 1) return 'ending_soon'

  return 'active'
}

export function getTrialDaysRemaining(trial: Trial, now: Date = new Date()): number {
  const endsAt = new Date(trial.endsAt).getTime()
  const nowMs = now.getTime()
  return Math.max(0, Math.ceil((endsAt - nowMs) / MS_PER_DAY))
}

export function getTrialDayNumber(trial: Trial, now: Date = new Date()): number {
  const startedAt = new Date(trial.startedAt).getTime()
  const nowMs = now.getTime()
  const elapsed = Math.floor((nowMs - startedAt) / MS_PER_DAY) + 1
  return Math.min(Math.max(elapsed, 1), trial.daysTotal)
}

// ---------------------------------------------------------------------------
// Usage limits
// ---------------------------------------------------------------------------

export function checkLimit(used: number, limit: number | null): LimitCheck {
  if (limit === null) {
    return { used, limit: null, isAtLimit: false, isOverLimit: false, remaining: null }
  }
  return {
    used,
    limit,
    isAtLimit: used >= limit,
    isOverLimit: used > limit,
    remaining: Math.max(0, limit - used),
  }
}

export { ROLE_PERMISSIONS }
