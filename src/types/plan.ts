/**
 * Plan & entitlement types.
 *
 * These types describe the SHAPE of commercial data. The actual values
 * (prices, limits, which features belong to which plan) live in
 * `src/config/plans.ts` and `src/config/features.ts` — never hardcode a
 * price or feature list in a component. Components read config through
 * `planService`.
 */

export type PlanId = 'starter' | 'growth' | 'enterprise' | 'custom'

/**
 * Every capability HealthKernel can grant. This is the single vocabulary
 * shared by plan definitions, the entitlement engine, the (future) dynamic
 * sidebar, and role permissions. Adding a new capability means adding one
 * key here — not touching every plan/UI that might reference it.
 */
export type FeatureKey =
  // Starter tier
  | 'clinical_management'
  | 'doctor_interface'
  | 'nurse_interface'
  | 'billing'
  | 'team_management'
  | 'rbac'
  | 'standard_security'
  | 'basic_analytics'
  // Growth tier (additive over Starter)
  | 'pharmacy'
  | 'laboratory'
  | 'insurance'
  | 'advanced_analytics'
  | 'advanced_billing'
  | 'multi_facility_management'
  | 'advanced_team_management'
  | 'advanced_access_control'
  | 'advanced_security'
  | 'dentist_interface'
  | 'operational_reporting'
  | 'priority_support'
  // Enterprise tier (additive over Growth)
  | 'enterprise_security'
  | 'advanced_org_management'
  | 'centralized_administration'
  | 'cross_facility_analytics'
  | 'advanced_management_reporting'
  | 'advanced_configuration'
  | 'integration_capabilities'
  | 'dedicated_support'
  | 'implementation_assistance'
  | 'enterprise_onboarding'

export type FeatureCategory =
  | 'clinical'
  | 'operations'
  | 'analytics'
  | 'security'
  | 'administration'
  | 'support'

export interface FeatureDefinition {
  key: FeatureKey
  label: string
  /** Short description used on pricing cards, comparison tables, tooltips. */
  description: string
  category: FeatureCategory
  /**
   * Sidebar section this feature would surface in the real dashboard.
   * The placeholder dashboard uses this to render a realistic-looking
   * dynamic sidebar without building the real screens behind it.
   */
  sidebarLabel: string
}

export interface PlanLimits {
  /** `null` means "configured per-org" (only meaningful for Custom). */
  facilities: number | null
  users: number | null
}

export interface FixedPlanDefinition {
  kind: 'fixed'
  id: 'starter' | 'growth' | 'enterprise'
  name: string
  tagline: string
  monthlyPriceNGN: number
  currency: 'NGN'
  limits: PlanLimits
  featureKeys: FeatureKey[]
  mostPopular: boolean
  trialDays: number
}

export interface CustomPlanDefinition {
  kind: 'custom'
  id: 'custom'
  name: string
  /** Short headline shown on the pricing card, e.g. "Build Your HealthKernel". */
  tagline: string
  /** Longer supporting copy beneath the tagline. */
  description: string
  trialDays: number
}

export type PlanDefinition = FixedPlanDefinition | CustomPlanDefinition

export function isFixedPlan(plan: PlanDefinition): plan is FixedPlanDefinition {
  return plan.kind === 'fixed'
}
