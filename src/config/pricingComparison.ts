import type { FeatureKey } from '@/types'

/**
 * FULL FEATURE COMPARISON — the data behind the pricing page's comparison
 * table. Every row is defined in terms of the same feature vocabulary used
 * by plan config and the entitlement engine, so this table can never say
 * something a plan's actual entitlements disagree with.
 *
 * Four row kinds, chosen per feature:
 *   - 'feature'    a single entitlement, shown as included/not included
 *   - 'tier'       the same capability at different strengths across tiers
 *                   (e.g. Security: Standard -> Advanced -> Enterprise-Grade)
 *   - 'limit'      a numeric plan limit (facilities/users)
 *   - 'custom-only' a capability no fixed plan offers at any tier (only
 *                   available by configuring Custom)
 */

export interface ComparisonTier {
  label: string
  /** All of these feature keys must be entitled for this tier's label to apply. Omit for the baseline tier every fixed plan starts at. */
  requiredFeatureKeys?: FeatureKey[]
}

export interface FeatureComparisonRow {
  id: string
  label: string
  kind: 'feature'
  featureKey: FeatureKey
}

export interface TierComparisonRow {
  id: string
  label: string
  kind: 'tier'
  tiers: ComparisonTier[]
}

export interface LimitComparisonRow {
  id: string
  label: string
  kind: 'limit'
  limitKey: 'facilities' | 'users'
}

export interface CustomOnlyComparisonRow {
  id: string
  label: string
  kind: 'custom-only'
}

export type ComparisonRow = FeatureComparisonRow | TierComparisonRow | LimitComparisonRow | CustomOnlyComparisonRow

export const PRICING_COMPARISON_ROWS: ComparisonRow[] = [
  { id: 'clinical_management', label: 'Clinical Management', kind: 'feature', featureKey: 'clinical_management' },
  { id: 'doctor_interface', label: 'Doctor Interface', kind: 'feature', featureKey: 'doctor_interface' },
  { id: 'nurse_interface', label: 'Nurse Interface', kind: 'feature', featureKey: 'nurse_interface' },
  { id: 'dentist_interface', label: 'Dentist Interface', kind: 'feature', featureKey: 'dentist_interface' },
  { id: 'pharmacy', label: 'Pharmacy', kind: 'feature', featureKey: 'pharmacy' },
  { id: 'laboratory', label: 'Laboratory', kind: 'feature', featureKey: 'laboratory' },
  {
    id: 'billing',
    label: 'Billing',
    kind: 'tier',
    tiers: [{ label: 'Standard' }, { label: 'Advanced', requiredFeatureKeys: ['advanced_billing'] }],
  },
  { id: 'insurance', label: 'Insurance', kind: 'feature', featureKey: 'insurance' },
  { id: 'multi_facility_management', label: 'Multi-Facility Management', kind: 'feature', featureKey: 'multi_facility_management' },
  {
    id: 'analytics',
    label: 'Analytics',
    kind: 'tier',
    tiers: [
      { label: 'Basic' },
      { label: 'Advanced', requiredFeatureKeys: ['advanced_analytics'] },
      { label: 'Cross-Facility', requiredFeatureKeys: ['cross_facility_analytics'] },
    ],
  },
  {
    id: 'team_management',
    label: 'Team Management',
    kind: 'tier',
    tiers: [{ label: 'Standard' }, { label: 'Advanced', requiredFeatureKeys: ['advanced_team_management'] }],
  },
  {
    id: 'access_control',
    label: 'Access Control',
    kind: 'tier',
    tiers: [{ label: 'Role-Based (RBAC)' }, { label: 'Advanced', requiredFeatureKeys: ['advanced_access_control'] }],
  },
  {
    id: 'security',
    label: 'Security',
    kind: 'tier',
    tiers: [
      { label: 'Standard' },
      { label: 'Advanced', requiredFeatureKeys: ['advanced_security'] },
      { label: 'Enterprise-Grade', requiredFeatureKeys: ['enterprise_security'] },
    ],
  },
  { id: 'users', label: 'Users', kind: 'limit', limitKey: 'users' },
  { id: 'facilities', label: 'Facilities', kind: 'limit', limitKey: 'facilities' },
  {
    id: 'implementation',
    label: 'Implementation',
    kind: 'tier',
    tiers: [
      { label: 'Self-Serve' },
      {
        label: 'Implementation Assistance + Enterprise Onboarding',
        requiredFeatureKeys: ['implementation_assistance', 'enterprise_onboarding'],
      },
    ],
  },
  {
    id: 'support',
    label: 'Support',
    kind: 'tier',
    tiers: [
      { label: 'Standard' },
      { label: 'Priority', requiredFeatureKeys: ['priority_support'] },
      { label: 'Dedicated', requiredFeatureKeys: ['dedicated_support'] },
    ],
  },
  { id: 'custom_branding', label: 'Custom Branding', kind: 'custom-only' },
  { id: 'custom_domain', label: 'Custom Domain', kind: 'custom-only' },
  { id: 'advanced_integrations', label: 'Advanced Integrations', kind: 'feature', featureKey: 'integration_capabilities' },
]
