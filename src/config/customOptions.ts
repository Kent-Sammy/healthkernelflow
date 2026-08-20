import type { FeatureKey, OrganizationType, CareModel } from '@/types'

/**
 * Catalog for the Custom configuration flow. Not the flow itself (that's a
 * later phase) — just the data each question in that flow will need,
 * defined once so the flow's UI, the entitlement resolver, and the price
 * estimator all read the same list instead of three hand-maintained ones.
 */

export interface CustomServiceOption {
  id: string
  label: string
  description: string
  featureKeys: FeatureKey[]
}

export const CUSTOM_SERVICE_OPTIONS: CustomServiceOption[] = [
  { id: 'pharmacy', label: 'Pharmacy', description: 'Dispensing and pharmacy inventory.', featureKeys: ['pharmacy'] },
  { id: 'laboratory', label: 'Laboratory', description: 'Lab orders and results.', featureKeys: ['laboratory'] },
  { id: 'insurance', label: 'Insurance', description: 'Claims and coverage management.', featureKeys: ['insurance'] },
  { id: 'dentistry', label: 'Dentistry', description: 'Dedicated dental workspace.', featureKeys: ['dentist_interface'] },
  {
    id: 'multi_facility',
    label: 'Multi-Facility Operations',
    description: 'Manage several facilities as one workspace.',
    featureKeys: ['multi_facility_management'],
  },
  {
    id: 'advanced_analytics',
    label: 'Advanced Analytics & Reporting',
    description: 'Deeper insights and operational reports.',
    featureKeys: ['advanced_analytics', 'operational_reporting'],
  },
  {
    id: 'integrations',
    label: 'Third-Party Integrations',
    description: 'Connect external systems and devices.',
    featureKeys: ['integration_capabilities'],
  },
  {
    id: 'centralized_admin',
    label: 'Centralized Administration',
    description: 'Single control center across the organization.',
    featureKeys: ['centralized_administration', 'advanced_org_management'],
  },
  {
    id: 'enterprise_security',
    label: 'Enterprise-Grade Security',
    description: 'SSO, advanced audit trails and compliance controls.',
    featureKeys: ['enterprise_security', 'advanced_security'],
  },
  {
    id: 'dedicated_support',
    label: 'Dedicated Support',
    description: 'A named support contact and priority response.',
    featureKeys: ['dedicated_support', 'priority_support'],
  },
]

export const ORGANIZATION_TYPE_OPTIONS: { id: OrganizationType; label: string }[] = [
  { id: 'hospital', label: 'Hospital' },
  { id: 'clinic', label: 'Clinic' },
  { id: 'diagnostic_center', label: 'Diagnostic Center' },
  { id: 'pharmacy_chain', label: 'Pharmacy Chain' },
  { id: 'health_center', label: 'Health Center' },
  { id: 'other', label: 'Other' },
]

export const CARE_MODEL_OPTIONS: { id: CareModel; label: string }[] = [
  { id: 'inpatient', label: 'Inpatient' },
  { id: 'outpatient', label: 'Outpatient' },
  { id: 'both', label: 'Both' },
]
