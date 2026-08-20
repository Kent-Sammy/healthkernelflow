import { FIXED_PLANS, getPlanById as lookupPlan } from '@/config/plans'
import { estimateCustomPrice as computeCustomPrice, resolveCustomCapabilities as computeCustomCapabilities } from '@/lib/entitlements'
import type { FeatureKey, FixedPlanDefinition, PlanDefinition, PlanId } from '@/types'

/**
 * SERVICE LAYER — the pattern every future service follows.
 * ------------------------------------------------------------------------
 * Components and pages call `planService.*`, never `config/plans.ts`
 * directly. Every method is async-shaped (returns a Promise) even though
 * today it just reads local config synchronously — that's deliberate:
 * when a real backend exists, only this file changes (e.g. an actual
 * `fetch('/api/plans')`), and no calling code needs to change, because the
 * call site was already written as `await planService.getFixedPlans()`.
 *
 * We do NOT add artificial `setTimeout` delays here. Plan config is static
 * and local — a real implementation of this specific endpoint would likely
 * be cached/instant too, so there's nothing honest to simulate by making
 * the caller wait. Services that model genuine backend work (creating an
 * account, starting a trial, processing a subscription) are the ones that
 * should carry a loading state, and will when those flows are built.
 *
 * Upcoming services (added alongside their flows, same pattern):
 *   - authService        (signup, login simulation)
 *   - organizationService (create/update org, facilities, team)
 *   - trialService        (start trial, lifecycle transitions)
 *   - subscriptionService (create/upgrade/cancel subscription, payment simulation)
 */
export const planService = {
  async getFixedPlans(): Promise<FixedPlanDefinition[]> {
    return FIXED_PLANS
  },

  async getPlan(id: PlanId): Promise<PlanDefinition> {
    return lookupPlan(id)
  },

  async estimateCustomPrice(input: { facilitiesCount: number; usersCount: number; serviceIds: string[] }): Promise<number> {
    return computeCustomPrice(input)
  },

  async resolveCustomCapabilities(serviceIds: string[]): Promise<FeatureKey[]> {
    return computeCustomCapabilities(serviceIds)
  },
}
