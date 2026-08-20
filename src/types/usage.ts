/**
 * Usage is a DERIVED value, never persisted directly — it's always
 * computed from the current facilities/users arrays plus the active plan's
 * limits, so it can't drift out of sync with the data it's summarizing.
 * This is the shape a real `/usage` endpoint would return.
 */
export interface UsageSnapshot {
  organizationId: string
  facilitiesUsed: number
  facilitiesLimit: number | null
  usersUsed: number
  usersLimit: number | null
  computedAt: string
}

export interface LimitCheck {
  used: number
  limit: number | null
  isAtLimit: boolean
  isOverLimit: boolean
  remaining: number | null
}
