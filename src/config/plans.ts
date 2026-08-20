import type { FeatureKey, FixedPlanDefinition, CustomPlanDefinition, PlanDefinition, PlanId } from '@/types'

/**
 * CENTRALIZED PLAN CONFIGURATION — the single source of truth for pricing,
 * limits and entitlements. No component, page or flow should ever hardcode
 * a price, a limit or a feature list; everything reads through here (via
 * `planService`) so a pricing change is a one-line edit, not a hunt across
 * the codebase.
 *
 * Each tier's feature list is defined as an explicit ADDITIVE union over
 * the tier below it (Growth = Starter + growth-only keys, Enterprise =
 * Growth + enterprise-only keys) so the "Growth includes everything in
 * Starter" business rule is structurally guaranteed, not manually kept in
 * sync.
 */

export const STARTER_FEATURES: FeatureKey[] = [
  'clinical_management',
  'doctor_interface',
  'nurse_interface',
  'billing',
  'team_management',
  'rbac',
  'standard_security',
  'basic_analytics',
]

export const GROWTH_ONLY_FEATURES: FeatureKey[] = [
  'pharmacy',
  'laboratory',
  'insurance',
  'advanced_analytics',
  'advanced_billing',
  'multi_facility_management',
  'advanced_team_management',
  'advanced_access_control',
  'advanced_security',
  'dentist_interface',
  'operational_reporting',
  'priority_support',
]

export const ENTERPRISE_ONLY_FEATURES: FeatureKey[] = [
  'enterprise_security',
  'advanced_org_management',
  'centralized_administration',
  'cross_facility_analytics',
  'advanced_management_reporting',
  'advanced_configuration',
  'integration_capabilities',
  'dedicated_support',
  'implementation_assistance',
  'enterprise_onboarding',
]

const GROWTH_FEATURES: FeatureKey[] = [...STARTER_FEATURES, ...GROWTH_ONLY_FEATURES]
const ENTERPRISE_FEATURES: FeatureKey[] = [...GROWTH_FEATURES, ...ENTERPRISE_ONLY_FEATURES]

export const TRIAL_DAYS = 7

export const STARTER_PLAN: FixedPlanDefinition = {
  kind: 'fixed',
  id: 'starter',
  name: 'Starter',
  tagline: 'Core clinical and billing tools for a single facility.',
  monthlyPriceNGN: 150_000,
  currency: 'NGN',
  limits: { facilities: 1, users: 10 },
  featureKeys: STARTER_FEATURES,
  mostPopular: false,
  trialDays: TRIAL_DAYS,
}

export const GROWTH_PLAN: FixedPlanDefinition = {
  kind: 'fixed',
  id: 'growth',
  name: 'Growth',
  tagline: 'Pharmacy, lab and multi-facility tools for growing organizations.',
  monthlyPriceNGN: 350_000,
  currency: 'NGN',
  limits: { facilities: 3, users: 30 },
  featureKeys: GROWTH_FEATURES,
  mostPopular: true,
  trialDays: TRIAL_DAYS,
}

export const ENTERPRISE_PLAN: FixedPlanDefinition = {
  kind: 'fixed',
  id: 'enterprise',
  name: 'Enterprise',
  tagline: 'Centralized administration and dedicated support at scale.',
  monthlyPriceNGN: 750_000,
  currency: 'NGN',
  limits: { facilities: 10, users: 100 },
  featureKeys: ENTERPRISE_FEATURES,
  mostPopular: false,
  trialDays: TRIAL_DAYS,
}

export const CUSTOM_PLAN: CustomPlanDefinition = {
  kind: 'custom',
  id: 'custom',
  name: 'Custom',
  tagline: 'Build Your HealthKernel',
  description: 'An intelligent configuration built around your organization — tell us what you need and we’ll price it.',
  trialDays: TRIAL_DAYS,
}

export const FIXED_PLANS: FixedPlanDefinition[] = [STARTER_PLAN, GROWTH_PLAN, ENTERPRISE_PLAN]

export const PLANS: Record<PlanId, PlanDefinition> = {
  starter: STARTER_PLAN,
  growth: GROWTH_PLAN,
  enterprise: ENTERPRISE_PLAN,
  custom: CUSTOM_PLAN,
}

export const PLAN_ORDER: PlanId[] = ['starter', 'growth', 'enterprise', 'custom']

export function getPlanById(id: PlanId): PlanDefinition {
  return PLANS[id]
}

export function getFixedPlanById(id: 'starter' | 'growth' | 'enterprise'): FixedPlanDefinition {
  return PLANS[id] as FixedPlanDefinition
}

export function formatNGN(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  }).format(amount)
}

/**
 * Annual billing discount. Not part of the original per-plan pricing spec
 * (only monthly prices were given) — 15% is the confirmed rate for the
 * Monthly/Annual toggle. Centralized here so it's a one-line change if the
 * business rate changes, rather than a number buried in a component.
 */
export const ANNUAL_DISCOUNT_PERCENT = 15

/** The effective monthly rate when billed annually (what a pricing card should headline). */
export function getAnnualMonthlyEquivalent(monthlyPriceNGN: number): number {
  return Math.round(monthlyPriceNGN * (1 - ANNUAL_DISCOUNT_PERCENT / 100))
}

/** The total amount charged once, up front, for the year. */
export function getAnnualTotalPrice(monthlyPriceNGN: number): number {
  return getAnnualMonthlyEquivalent(monthlyPriceNGN) * 12
}
