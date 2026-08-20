import type { PlanId } from './plan'

/**
 * `status` mirrors what a real backend would send, but time-based states
 * (active / ending_soon / expired) should be treated as advisory only —
 * always re-derive the live status from `endsAt` via
 * `entitlements.getTrialStatus()` rather than trusting a stale stored
 * value, so the countdown can never drift out of sync with the badge.
 */
export type TrialStatus = 'not_started' | 'active' | 'ending_soon' | 'expired' | 'converted'

export interface Trial {
  id: string
  organizationId: string
  planId: PlanId
  startedAt: string
  endsAt: string
  daysTotal: number
  status: TrialStatus
}
