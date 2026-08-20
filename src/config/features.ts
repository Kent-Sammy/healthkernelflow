import type { FeatureDefinition, FeatureKey } from '@/types'

/**
 * FEATURE REGISTRY — the single source of truth for every capability
 * HealthKernel can grant. Plan definitions (plans.ts) reference these keys
 * rather than duplicating labels/descriptions. The future dynamic sidebar
 * and role-permission matrix both read from this registry too, so a
 * feature's label/copy only ever needs to change in one place.
 */
export const FEATURE_REGISTRY: Record<FeatureKey, FeatureDefinition> = {
  // ---- Starter tier ----
  clinical_management: {
    key: 'clinical_management',
    label: 'Clinical Management',
    description: 'Patient records, visits and clinical workflows.',
    category: 'clinical',
    sidebarLabel: 'Clinical',
  },
  doctor_interface: {
    key: 'doctor_interface',
    label: 'Doctor Interface',
    description: 'Dedicated workspace for doctors.',
    category: 'clinical',
    sidebarLabel: 'Doctor Workspace',
  },
  nurse_interface: {
    key: 'nurse_interface',
    label: 'Nurse Interface',
    description: 'Dedicated workspace for nursing staff.',
    category: 'clinical',
    sidebarLabel: 'Nurse Workspace',
  },
  billing: {
    key: 'billing',
    label: 'Billing',
    description: 'Patient invoicing and payments.',
    category: 'operations',
    sidebarLabel: 'Billing',
  },
  team_management: {
    key: 'team_management',
    label: 'Team Management',
    description: 'Invite and manage staff accounts.',
    category: 'administration',
    sidebarLabel: 'Team',
  },
  rbac: {
    key: 'rbac',
    label: 'Role-Based Access Control',
    description: 'Control what each role can see and do.',
    category: 'security',
    sidebarLabel: 'Roles & Access',
  },
  standard_security: {
    key: 'standard_security',
    label: 'Standard Security',
    description: 'Encryption at rest and in transit, audit logging.',
    category: 'security',
    sidebarLabel: 'Security',
  },
  basic_analytics: {
    key: 'basic_analytics',
    label: 'Basic Analytics',
    description: 'Core operational metrics at a glance.',
    category: 'analytics',
    sidebarLabel: 'Analytics',
  },

  // ---- Growth tier (additive over Starter) ----
  pharmacy: {
    key: 'pharmacy',
    label: 'Pharmacy',
    description: 'Dispensing, inventory and pharmacy workflows.',
    category: 'clinical',
    sidebarLabel: 'Pharmacy',
  },
  laboratory: {
    key: 'laboratory',
    label: 'Laboratory',
    description: 'Lab orders, results and workflows.',
    category: 'clinical',
    sidebarLabel: 'Laboratory',
  },
  insurance: {
    key: 'insurance',
    label: 'Insurance',
    description: 'Insurance claims and coverage management.',
    category: 'operations',
    sidebarLabel: 'Insurance',
  },
  advanced_analytics: {
    key: 'advanced_analytics',
    label: 'Advanced Analytics',
    description: 'Deeper operational and clinical insights.',
    category: 'analytics',
    sidebarLabel: 'Advanced Analytics',
  },
  advanced_billing: {
    key: 'advanced_billing',
    label: 'Advanced Billing',
    description: 'Multi-facility billing, payment plans and reconciliation.',
    category: 'operations',
    sidebarLabel: 'Advanced Billing',
  },
  multi_facility_management: {
    key: 'multi_facility_management',
    label: 'Multi-Facility Management',
    description: 'Manage multiple facilities from one workspace.',
    category: 'administration',
    sidebarLabel: 'Facilities',
  },
  advanced_team_management: {
    key: 'advanced_team_management',
    label: 'Advanced Team Management',
    description: 'Shift scheduling, cross-facility staff assignment.',
    category: 'administration',
    sidebarLabel: 'Team (Advanced)',
  },
  advanced_access_control: {
    key: 'advanced_access_control',
    label: 'Advanced Access Control',
    description: 'Granular, per-facility permission policies.',
    category: 'security',
    sidebarLabel: 'Access Policies',
  },
  advanced_security: {
    key: 'advanced_security',
    label: 'Advanced Security',
    description: 'SSO, advanced audit trails, session policies.',
    category: 'security',
    sidebarLabel: 'Advanced Security',
  },
  dentist_interface: {
    key: 'dentist_interface',
    label: 'Dentist Interface',
    description: 'Dedicated workspace for dental staff.',
    category: 'clinical',
    sidebarLabel: 'Dental Workspace',
  },
  operational_reporting: {
    key: 'operational_reporting',
    label: 'Operational Reporting',
    description: 'Scheduled and exportable operational reports.',
    category: 'analytics',
    sidebarLabel: 'Reports',
  },
  priority_support: {
    key: 'priority_support',
    label: 'Priority Support',
    description: 'Faster response times from HealthKernel support.',
    category: 'support',
    sidebarLabel: 'Priority Support',
  },

  // ---- Enterprise tier (additive over Growth) ----
  enterprise_security: {
    key: 'enterprise_security',
    label: 'Enterprise Security',
    description: 'Enterprise-grade compliance and security controls.',
    category: 'security',
    sidebarLabel: 'Enterprise Security',
  },
  advanced_org_management: {
    key: 'advanced_org_management',
    label: 'Advanced Organization Management',
    description: 'Organization-wide structure and governance tools.',
    category: 'administration',
    sidebarLabel: 'Organization',
  },
  centralized_administration: {
    key: 'centralized_administration',
    label: 'Centralized Administration',
    description: 'Administer every facility from a single control center.',
    category: 'administration',
    sidebarLabel: 'Admin Center',
  },
  cross_facility_analytics: {
    key: 'cross_facility_analytics',
    label: 'Cross-Facility Analytics',
    description: 'Compare and analyze performance across facilities.',
    category: 'analytics',
    sidebarLabel: 'Cross-Facility Analytics',
  },
  advanced_management_reporting: {
    key: 'advanced_management_reporting',
    label: 'Advanced Management Reporting',
    description: 'Executive-level reporting and dashboards.',
    category: 'analytics',
    sidebarLabel: 'Management Reports',
  },
  advanced_configuration: {
    key: 'advanced_configuration',
    label: 'Advanced Configuration',
    description: 'Deep workspace configuration and customization.',
    category: 'administration',
    sidebarLabel: 'Configuration',
  },
  integration_capabilities: {
    key: 'integration_capabilities',
    label: 'Integration Capabilities',
    description: 'Connect HealthKernel to external systems.',
    category: 'administration',
    sidebarLabel: 'Integrations',
  },
  dedicated_support: {
    key: 'dedicated_support',
    label: 'Dedicated Support',
    description: 'A named support contact for your organization.',
    category: 'support',
    sidebarLabel: 'Dedicated Support',
  },
  implementation_assistance: {
    key: 'implementation_assistance',
    label: 'Implementation Assistance',
    description: 'Hands-on help migrating and setting up.',
    category: 'support',
    sidebarLabel: 'Implementation',
  },
  enterprise_onboarding: {
    key: 'enterprise_onboarding',
    label: 'Enterprise Onboarding',
    description: 'White-glove onboarding for large organizations.',
    category: 'support',
    sidebarLabel: 'Enterprise Onboarding',
  },
}

export const ALL_FEATURE_KEYS = Object.keys(FEATURE_REGISTRY) as FeatureKey[]

export function getFeatureDefinition(key: FeatureKey): FeatureDefinition {
  return FEATURE_REGISTRY[key]
}
