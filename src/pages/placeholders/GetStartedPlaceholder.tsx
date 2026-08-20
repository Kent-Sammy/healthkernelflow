import { RoutePlaceholder } from './RoutePlaceholder'
import { Card } from '@/components/ui/Card'
import { Text } from '@/components/ui/Typography'
import { Row } from '@/components/layout/Row'
import { useAppStore } from '@/state'
import { getPlanById, formatNGN, TRIAL_DAYS } from '@/config/plans'
import { isFixedPlan } from '@/types'

/**
 * Where a fixed-plan "Start 7-Day Free Trial" CTA lands. Signup and
 * onboarding are built in a later phase — this confirms the plan selection
 * from Pricing actually reached global state before that phase exists.
 */
export function GetStartedPlaceholder() {
  const selectedPlanId = useAppStore((s) => s.selectedPlanId)

  if (!selectedPlanId) {
    return (
      <RoutePlaceholder
        eyebrow="Get Started"
        title="No plan selected"
        description="This page expects a plan to have been chosen on the pricing page first. Head back and pick Starter, Growth or Enterprise."
      />
    )
  }

  const plan = getPlanById(selectedPlanId)

  return (
    <RoutePlaceholder
      eyebrow="Get Started · Phase 3 coming next"
      title={`You selected ${plan.name}`}
      description="Signup and onboarding (account creation, organization, facilities, team size, workspace setup) are built in the next phase. For now, here's what carried over from the pricing page:"
    >
      <Card variant="default" padding="sm" className="bg-neutral-50">
        <Row justify="between" wrap gap={2}>
          <Text size="body-sm" className="font-medium text-neutral-900">
            Plan
          </Text>
          <Text size="body-sm">{plan.name}</Text>
        </Row>
        {isFixedPlan(plan) && (
          <Row justify="between" wrap gap={2} className="pt-1">
            <Text size="body-sm" className="font-medium text-neutral-900">
              Price
            </Text>
            <Text size="body-sm">{formatNGN(plan.monthlyPriceNGN)}/month</Text>
          </Row>
        )}
        <Row justify="between" wrap gap={2} className="pt-1">
          <Text size="body-sm" className="font-medium text-neutral-900">
            Trial length
          </Text>
          <Text size="body-sm">{TRIAL_DAYS} days, no payment required</Text>
        </Row>
      </Card>
    </RoutePlaceholder>
  )
}
