export type OrganizationType =
  | 'hospital'
  | 'clinic'
  | 'diagnostic_center'
  | 'pharmacy_chain'
  | 'health_center'
  | 'other'

/**
 * NOTE: `type` is only ever collected in the Custom configuration flow or
 * the "Help Me Choose" quiz. Fixed-plan signup (Starter/Growth/Enterprise)
 * must never ask this — the fixed package is identical regardless of org
 * type, per the product's commercial model.
 */
export interface Organization {
  id: string
  name: string
  type?: OrganizationType
  country: string
  state?: string
  city?: string
  createdAt: string
  updatedAt: string
}
