import type { FeatureKey } from './plan'
import type { UserRole } from './user'

/**
 * The access-control chain this app is built around:
 *
 *   PLAN -> FEATURE ENTITLEMENT -> USER ROLE -> PERMISSION -> ACCESS
 *
 * A plan's entitlements (resolved by `entitlements.ts`) decide which
 * features exist for the ORGANIZATION at all. A role's permissions decide
 * which of those entitled features a given USER can actually see/use.
 * Neither layer alone is sufficient — both gates must pass.
 */

/** Fine-grained action within a feature, e.g. "pharmacy.dispense". Reserved for the phase that builds real feature screens; not enforced yet. */
export type Permission = `${FeatureKey}.${string}`

export type RolePermissionGrant = 'all' | FeatureKey[]

export interface AccessCheckInput {
  organizationEntitlements: Set<FeatureKey>
  role: UserRole
  feature: FeatureKey
}
