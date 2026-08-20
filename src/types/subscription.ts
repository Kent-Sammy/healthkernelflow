import type { PlanId } from './plan'

export type SubscriptionStatus = 'none' | 'active' | 'past_due' | 'canceled'
export type BillingCycle = 'monthly' | 'annual'

export interface Subscription {
  id: string
  organizationId: string
  planId: PlanId
  status: SubscriptionStatus
  billingCycle: BillingCycle
  amountNGN: number
  startedAt: string | null
  currentPeriodEnd: string | null
  canceledAt: string | null
  /** Set when the org has upgraded/downgraded — powers the "Upgraded" demo state and any future billing history UI. */
  previousPlanId: PlanId | null
  upgradedAt: string | null
}
