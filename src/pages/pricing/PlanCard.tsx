import { Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Typography'
import { Stack } from '@/components/layout/Stack'
import { Row } from '@/components/layout/Row'
import { formatNGN, getAnnualMonthlyEquivalent, getAnnualTotalPrice, STARTER_FEATURES, GROWTH_ONLY_FEATURES, ENTERPRISE_ONLY_FEATURES } from '@/config/plans'
import { getFeatureDefinition } from '@/config/features'
import type { BillingCycle, FixedPlanDefinition } from '@/types'

const TEASER_LIMIT = 4

function getTeaserFeatures(planId: FixedPlanDefinition['id']): { heading: string; keys: typeof STARTER_FEATURES } {
  if (planId === 'starter') return { heading: 'Includes:', keys: STARTER_FEATURES }
  if (planId === 'growth') return { heading: 'Everything in Starter, plus:', keys: GROWTH_ONLY_FEATURES }
  return { heading: 'Everything in Growth, plus:', keys: ENTERPRISE_ONLY_FEATURES }
}

export interface PlanCardProps {
  plan: FixedPlanDefinition
  billingCycle: BillingCycle
  onSelect: (planId: FixedPlanDefinition['id']) => void
}

export function PlanCard({ plan, billingCycle, onSelect }: PlanCardProps) {
  const teaser = getTeaserFeatures(plan.id)
  const shown = teaser.keys.slice(0, TEASER_LIMIT)
  const remaining = teaser.keys.length - shown.length

  const monthlyEquivalent = billingCycle === 'annual' ? getAnnualMonthlyEquivalent(plan.monthlyPriceNGN) : plan.monthlyPriceNGN
  const annualTotal = getAnnualTotalPrice(plan.monthlyPriceNGN)

  return (
    <Card variant={plan.mostPopular ? 'highlighted' : 'default'} className="flex flex-col">
      <CardHeader>
        <Row justify="between" align="start">
          <CardTitle>{plan.name}</CardTitle>
          {plan.mostPopular && <Badge variant="brand">Most Popular</Badge>}
        </Row>
        <CardDescription>{plan.tagline}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <Stack gap={4}>
          <div>
            <Row gap={2} align="baseline">
              <span className="text-h2 font-semibold text-neutral-900">{formatNGN(monthlyEquivalent)}</span>
              <span className="text-body-sm text-neutral-500">/month</span>
            </Row>
            {billingCycle === 'annual' ? (
              <Text size="caption" color="subtle">
                Billed {formatNGN(annualTotal)} annually
              </Text>
            ) : (
              <Text size="caption" color="subtle">
                Billed monthly
              </Text>
            )}
          </div>

          <Text size="body-sm" color="muted">
            Up to {plan.limits.facilities} facilit{plan.limits.facilities === 1 ? 'y' : 'ies'} · Up to {plan.limits.users} users
          </Text>

          <Stack gap={2}>
            <Text size="caption" color="subtle" className="font-medium uppercase tracking-wide">
              {teaser.heading}
            </Text>
            <Stack gap={2}>
              {shown.map((key) => (
                <Row key={key} gap={2} align="start">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                  <Text size="body-sm">{getFeatureDefinition(key).label}</Text>
                </Row>
              ))}
            </Stack>
            {remaining > 0 && (
              <Text size="caption" color="subtle">
                +{remaining} more — see full comparison below
              </Text>
            )}
          </Stack>
        </Stack>
      </CardContent>

      <CardFooter>
        <Button fullWidth variant={plan.mostPopular ? 'primary' : 'outline'} onClick={() => onSelect(plan.id)}>
          Start 7-Day Free Trial
        </Button>
      </CardFooter>
    </Card>
  )
}
