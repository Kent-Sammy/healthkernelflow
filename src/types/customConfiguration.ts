import type { OrganizationType } from './organization'
import type { FeatureKey } from './plan'

export type CareModel = 'inpatient' | 'outpatient' | 'both'

export type CustomConfigurationStatus = 'draft' | 'estimated' | 'confirmed'

/**
 * Only populated when the customer goes through the Custom configuration
 * flow (either at signup, or later as an existing customer moving beyond
 * their fixed plan). Fixed-plan orgs never have one of these.
 */
export interface CustomConfiguration {
  id: string
  organizationId: string
  organizationType?: OrganizationType
  careModel?: CareModel
  services: string[]
  bedsCount?: number
  specialties: string[]
  facilitiesCount: number
  usersCount: number
  capabilities: FeatureKey[]
  branding: {
    logoUrl?: string
    primaryColor?: string
  }
  integrations: string[]
  otherRequirements?: string
  estimatedPriceNGN: number | null
  status: CustomConfigurationStatus
  createdAt: string
  updatedAt: string
}
