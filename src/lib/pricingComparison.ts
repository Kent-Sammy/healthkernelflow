import { getFixedPlanById } from '@/config/plans'
import { resolvePlanEntitlements } from './entitlements'
import type { ComparisonRow } from '@/config/pricingComparison'
import type { PlanId } from '@/types'

export type ComparisonCellState = 'included' | 'excluded' | 'info'

export interface ComparisonCell {
  display: string
  state: ComparisonCellState
}

/**
 * Resolves a single comparison-table cell for a given row + plan. Fixed
 * plans are checked directly against their entitlements/limits from
 * `config/plans.ts`; Custom never claims a fixed yes/no here (nothing is
 * decided until the customer actually configures it in the Custom flow),
 * so it reads "Configurable" for everything except the two capabilities no
 * fixed plan can ever offer.
 */
export function getComparisonCell(row: ComparisonRow, planId: PlanId): ComparisonCell {
  if (planId === 'custom') {
    if (row.kind === 'custom-only') return { display: 'Included', state: 'included' }
    return { display: 'Configurable', state: 'info' }
  }

  const plan = getFixedPlanById(planId)
  const entitlements = resolvePlanEntitlements(planId)

  switch (row.kind) {
    case 'feature': {
      const included = entitlements.has(row.featureKey)
      return { display: included ? 'Included' : 'Not included', state: included ? 'included' : 'excluded' }
    }

    case 'tier': {
      let label = row.tiers[0]?.label ?? ''
      for (const tier of row.tiers) {
        const required = tier.requiredFeatureKeys ?? []
        if (required.every((key) => entitlements.has(key))) {
          label = tier.label
        }
      }
      return { display: label, state: 'info' }
    }

    case 'limit': {
      const value = plan.limits[row.limitKey]
      return { display: value === null ? 'Configurable' : `Up to ${value}`, state: 'info' }
    }

    case 'custom-only':
      return { display: 'Custom only', state: 'excluded' }
  }
}
