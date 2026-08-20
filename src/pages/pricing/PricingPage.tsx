import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, CreditCard } from 'lucide-react'
import { PublicLayout } from '@/components/layout/PublicLayout'
import { Container } from '@/components/layout/Container'
import { Section } from '@/components/layout/Section'
import { Stack } from '@/components/layout/Stack'
import { Row } from '@/components/layout/Row'
import { Grid } from '@/components/layout/Grid'
import { Heading, Text } from '@/components/ui/Typography'
import { PlanCard } from './PlanCard'
import { CustomPlanCard } from './CustomPlanCard'
import { BillingToggle } from './BillingToggle'
import { HelpMeChooseCallout } from './HelpMeChooseCallout'
import { ComparisonTable } from './ComparisonTable'
import { FIXED_PLANS, CUSTOM_PLAN, TRIAL_DAYS } from '@/config/plans'
import { useAppStore } from '@/state'
import type { BillingCycle, FixedPlanDefinition } from '@/types'

export function PricingPage() {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly')
  const navigate = useNavigate()
  const selectPlan = useAppStore((s) => s.selectPlan)

  function handleSelectFixedPlan(planId: FixedPlanDefinition['id']) {
    selectPlan(planId)
    navigate('/get-started')
  }

  function handleSelectCustom() {
    navigate('/custom')
  }

  function handleHelpMeChoose() {
    navigate('/help-me-choose')
  }

  return (
    <PublicLayout>
      <Section paddingY={16}>
        <Container>
          <Stack gap={4} align="center" className="text-center">
            <Heading level="display" className="max-w-3xl">
              Simple, transparent pricing for every stage of care
            </Heading>
            <Text size="body-lg" color="muted" className="max-w-2xl">
              Every plan includes a {TRIAL_DAYS}-day free trial. No payment required today — start your workspace now
              and decide later.
            </Text>

            <Row gap={5} wrap justify="center" className="pt-1">
              <Row gap={2}>
                <ShieldCheck className="size-4 text-success-600" aria-hidden="true" />
                <Text size="body-sm" color="muted">
                  {TRIAL_DAYS}-day free trial on every plan
                </Text>
              </Row>
              <Row gap={2}>
                <CreditCard className="size-4 text-success-600" aria-hidden="true" />
                <Text size="body-sm" color="muted">
                  No payment required today
                </Text>
              </Row>
            </Row>

            <div className="pt-4">
              <BillingToggle value={billingCycle} onChange={setBillingCycle} />
            </div>
          </Stack>
        </Container>
      </Section>

      <Section paddingY={0}>
        <Container>
          <Stack gap={8}>
            <Grid cols={1} smCols={2} lgCols={4} gap={5} className="items-stretch">
              {FIXED_PLANS.map((plan) => (
                <PlanCard key={plan.id} plan={plan} billingCycle={billingCycle} onSelect={handleSelectFixedPlan} />
              ))}
              <CustomPlanCard plan={CUSTOM_PLAN} onSelect={handleSelectCustom} />
            </Grid>

            <HelpMeChooseCallout onHelpMeChoose={handleHelpMeChoose} />
          </Stack>
        </Container>
      </Section>

      <Section paddingY={16}>
        <Container>
          <Stack gap={6}>
            <Stack gap={2} align="center" className="text-center">
              <Heading level="h2">Compare every feature</Heading>
              <Text size="body" color="muted" className="max-w-xl">
                A full side-by-side breakdown of what's included on Starter, Growth, Enterprise, and what's
                configurable on Custom.
              </Text>
            </Stack>
            <ComparisonTable />
          </Stack>
        </Container>
      </Section>
    </PublicLayout>
  )
}
