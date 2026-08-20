import type { FeatureKey, RolePermissionGrant, UserRole } from '@/types'

/**
 * ROLE -> FEATURE PERMISSION MATRIX.
 *
 * This is the second gate in the access chain. Plan entitlements
 * (config/plans.ts) decide what exists for the ORGANIZATION; this decides
 * what a given ROLE within that org can see, once granted. A feature only
 * becomes visible to a user when BOTH gates pass — see
 * `state/selectors/access.ts`.
 *
 * 'all' means "every feature the org is entitled to" (owner/admin). Every
 * other role lists an explicit allow-list, so adding a new role forces a
 * conscious decision about what it can touch rather than defaulting open.
 *
 * This is a reasonable default matrix, not final policy — action-level
 * permissions (e.g. "pharmacist can dispense but not void") are reserved
 * for the phase that builds the real feature screens.
 */
export const ROLE_PERMISSIONS: Record<UserRole, RolePermissionGrant> = {
  owner: 'all',
  admin: 'all',
  doctor: ['clinical_management', 'doctor_interface', 'laboratory', 'pharmacy', 'basic_analytics', 'advanced_analytics'],
  nurse: ['clinical_management', 'nurse_interface', 'laboratory', 'basic_analytics'],
  dentist: ['clinical_management', 'dentist_interface', 'basic_analytics'],
  pharmacist: ['pharmacy', 'basic_analytics'],
  lab_technician: ['laboratory', 'basic_analytics'],
  billing_staff: ['billing', 'advanced_billing', 'insurance', 'basic_analytics'],
  front_desk: ['clinical_management', 'billing', 'team_management'],
  staff: ['basic_analytics'],
}

export const ROLE_LABELS: Record<UserRole, string> = {
  owner: 'Owner',
  admin: 'Admin',
  doctor: 'Doctor',
  nurse: 'Nurse',
  dentist: 'Dentist',
  pharmacist: 'Pharmacist',
  lab_technician: 'Lab Technician',
  billing_staff: 'Billing Staff',
  front_desk: 'Front Desk',
  staff: 'Staff',
}

export function roleGrantsFeature(role: UserRole, feature: FeatureKey): boolean {
  const grant = ROLE_PERMISSIONS[role]
  return grant === 'all' || grant.includes(feature)
}
