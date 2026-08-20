import { useState, type ReactNode } from 'react'
import { Rocket, Building2, RefreshCw } from 'lucide-react'
import { Container } from '@/components/layout/Container'
import { Stack } from '@/components/layout/Stack'
import { Row } from '@/components/layout/Row'
import { Grid } from '@/components/layout/Grid'
import { Section } from '@/components/layout/Section'
import { Heading, Text } from '@/components/ui/Typography'
import { Button } from '@/components/ui/Button'
import { Input } from '@/components/ui/Input'
import { Select } from '@/components/ui/Select'
import { Checkbox } from '@/components/ui/Checkbox'
import { RadioGroup } from '@/components/ui/RadioGroup'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Badge } from '@/components/ui/Badge'
import { Progress } from '@/components/ui/Progress'
import { Stepper } from '@/components/ui/Stepper'
import { Modal } from '@/components/ui/Dialog'
import { EmptyState } from '@/components/ui/EmptyState'
import { ErrorState } from '@/components/ui/ErrorState'
import { Spinner, PageLoading, Skeleton } from '@/components/ui/Loading'
import { useUiStore } from '@/state/uiStore'
import { FIXED_PLANS, formatNGN } from '@/config/plans'
import { resolvePlanEntitlements, getAccessibleFeatures } from '@/lib/entitlements'
import { getFeatureDefinition } from '@/config/features'

const SECTIONS = [
  'Typography',
  'Buttons',
  'Form Controls',
  'Cards',
  'Badges',
  'Progress & Stepper',
  'Modal & Toast',
  'Empty / Error / Loading',
  'Layout Primitives',
  'Plan Configuration (live)',
] as const

function SectionBlock({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Section paddingY={12} className="border-t border-neutral-200 first:border-t-0">
      <Container>
        <Stack gap={6}>
          <Heading level="h3">{title}</Heading>
          {children}
        </Stack>
      </Container>
    </Section>
  )
}

export function ComponentShowcase() {
  const [selectValue, setSelectValue] = useState<string>('')
  const [checked, setChecked] = useState(false)
  const [radioValue, setRadioValue] = useState('starter')
  const [modalOpen, setModalOpen] = useState(false)
  const [showcaseLoading, setShowcaseLoading] = useState(false)
  const showToast = useUiStore((s) => s.showToast)

  const doctorEntitlements = resolvePlanEntitlements('growth')
  const doctorAccessibleFeatures = getAccessibleFeatures(doctorEntitlements, 'doctor')

  return (
    <div className="min-h-dvh bg-neutral-50 pb-24">
      <header className="border-b border-neutral-200 bg-neutral-0">
        <Container className="flex h-16 items-center justify-between">
          <Row gap={2}>
            <span className="text-h4 font-semibold tracking-tight text-neutral-900">HealthKernel</span>
            <Badge variant="outline" size="sm">
              Dev — Component Library
            </Badge>
          </Row>
          <Text size="caption" color="subtle">
            Phase 1 · Foundation
          </Text>
        </Container>
      </header>

      <Container>
        <Stack gap={2} className="py-10">
          <Heading level="display">Design System &amp; Architecture Foundation</Heading>
          <Text size="body-lg" color="muted" className="max-w-2xl">
            Internal reference for every reusable primitive built in Phase 1. Not a customer-facing page — pricing,
            signup, onboarding and the dashboard are built in later phases on top of these components.
          </Text>
          <Row gap={2} wrap className="pt-2">
            {SECTIONS.map((s) => (
              <Badge key={s} variant="default" size="sm">
                {s}
              </Badge>
            ))}
          </Row>
        </Stack>
      </Container>

      <SectionBlock title="Typography">
        <Stack gap={3}>
          <Heading level="display">Display / HealthKernel</Heading>
          <Heading level="h1">Heading 1 / Plan Selection</Heading>
          <Heading level="h2">Heading 2 / Choose your plan</Heading>
          <Heading level="h3">Heading 3 / Trial review</Heading>
          <Heading level="h4">Heading 4 / Card title</Heading>
          <Text size="body-lg">Body Large — used for section intros and pricing taglines.</Text>
          <Text size="body">Body — the default paragraph size across the product.</Text>
          <Text size="body-sm" color="muted">
            Body Small (muted) — helper text, secondary metadata.
          </Text>
          <Text size="caption" color="subtle">
            Caption (subtle) — timestamps, field hints.
          </Text>
          <Text size="overline" color="brand">
            Overline / Section Label
          </Text>
        </Stack>
      </SectionBlock>

      <SectionBlock title="Buttons">
        <Stack gap={4}>
          <Row gap={3} wrap>
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="link">Link button</Button>
          </Row>
          <Row gap={3} wrap align="center">
            <Button size="sm">Small</Button>
            <Button size="md">Medium</Button>
            <Button size="lg">Large</Button>
          </Row>
          <Row gap={3} wrap align="center">
            <Button leftIcon={<Rocket className="size-4" />}>With left icon</Button>
            <Button isLoading={showcaseLoading} onClick={() => setShowcaseLoading((v) => !v)}>
              {showcaseLoading ? 'Loading…' : 'Toggle loading'}
            </Button>
            <Button disabled>Disabled</Button>
          </Row>
        </Stack>
      </SectionBlock>

      <SectionBlock title="Form Controls">
        <Grid cols={1} mdCols={2} gap={8}>
          <Stack gap={5}>
            <Input label="Organization name" placeholder="e.g. St. Mary's Hospital" helperText="This is how you'll appear across HealthKernel." />
            <Input label="Work email" placeholder="you@organization.com" errorText="Enter a valid email address." />
            <Select
              label="Facility count"
              placeholder="Select a range"
              value={selectValue}
              onValueChange={setSelectValue}
              options={[
                { value: '1', label: '1 facility' },
                { value: '2-3', label: '2–3 facilities' },
                { value: '4-10', label: '4–10 facilities' },
                { value: '10+', label: '10+ facilities' },
              ]}
              helperText="Used to recommend a plan in Help Me Choose."
            />
          </Stack>
          <Stack gap={5}>
            <Checkbox
              checked={checked}
              onCheckedChange={(c) => setChecked(c === true)}
              label="I agree to the Terms of Service"
              description="Required to start your 7-day free trial."
            />
            <RadioGroup
              value={radioValue}
              onValueChange={setRadioValue}
              options={[
                { value: 'starter', label: 'Starter', description: '₦150,000/month · 1 facility' },
                { value: 'growth', label: 'Growth', description: '₦350,000/month · up to 3 facilities' },
                { value: 'enterprise', label: 'Enterprise', description: '₦750,000/month · up to 10 facilities' },
              ]}
            />
          </Stack>
        </Grid>
      </SectionBlock>

      <SectionBlock title="Cards">
        <Grid cols={1} smCols={2} lgCols={3} gap={5}>
          <Card variant="default">
            <CardHeader>
              <CardTitle>Default</CardTitle>
              <CardDescription>Resting state for most content cards.</CardDescription>
            </CardHeader>
            <CardContent>
              <Text size="body-sm" color="muted">
                Body content area.
              </Text>
            </CardContent>
          </Card>
          <Card variant="interactive">
            <CardHeader>
              <CardTitle>Interactive</CardTitle>
              <CardDescription>Hover for elevation — selectable plan/facility cards.</CardDescription>
            </CardHeader>
          </Card>
          <Card variant="selected">
            <CardHeader>
              <CardTitle>Selected</CardTitle>
              <CardDescription>Active selection state, e.g. chosen plan.</CardDescription>
            </CardHeader>
          </Card>
          <Card variant="highlighted">
            <CardHeader>
              <Row justify="between">
                <CardTitle>Growth</CardTitle>
                <Badge variant="brand">Most Popular</Badge>
              </Row>
              <CardDescription>Highlighted plan card treatment.</CardDescription>
            </CardHeader>
            <CardFooter>
              <Button size="sm" fullWidth>
                Select Growth
              </Button>
            </CardFooter>
          </Card>
        </Grid>
      </SectionBlock>

      <SectionBlock title="Badges">
        <Row gap={2} wrap>
          <Badge variant="default">Default</Badge>
          <Badge variant="brand">Brand</Badge>
          <Badge variant="success">Active</Badge>
          <Badge variant="warning">Ending Soon</Badge>
          <Badge variant="danger">Expired</Badge>
          <Badge variant="info">Info</Badge>
          <Badge variant="outline">Outline</Badge>
        </Row>
      </SectionBlock>

      <SectionBlock title="Progress & Stepper">
        <Stack gap={8}>
          <Stack gap={4} className="max-w-md">
            <Progress value={3} max={7} label="Trial countdown" showValueText variant="brand" />
            <Progress value={8} max={10} label="Users" showValueText variant="warning" />
            <Progress value={10} max={10} label="Facilities" showValueText variant="danger" />
          </Stack>
          <Stepper
            steps={[
              { id: 'account', label: 'Account' },
              { id: 'organization', label: 'Organization' },
              { id: 'facilities', label: 'Facilities' },
              { id: 'team_size', label: 'Team' },
              { id: 'trial_review', label: 'Review' },
            ]}
            currentStepId="facilities"
            completedStepIds={['account', 'organization']}
          />
        </Stack>
      </SectionBlock>

      <SectionBlock title="Modal & Toast">
        <Row gap={3} wrap>
          <Button variant="outline" onClick={() => setModalOpen(true)}>
            Open modal
          </Button>
          <Button
            variant="outline"
            onClick={() => showToast({ title: 'Trial started', description: 'Your 7-day trial is now active.', variant: 'success' })}
          >
            Show success toast
          </Button>
          <Button
            variant="outline"
            onClick={() => showToast({ title: 'Trial ending soon', description: '1 day remaining on your trial.', variant: 'warning' })}
          >
            Show warning toast
          </Button>
          <Button
            variant="outline"
            onClick={() => showToast({ title: 'Payment failed', description: 'Please check your payment details.', variant: 'danger' })}
          >
            Show error toast
          </Button>
        </Row>

        <Modal
          open={modalOpen}
          onOpenChange={setModalOpen}
          title="Start your free trial?"
          description="You won't be charged. Your 7-day trial begins immediately."
          footer={
            <>
              <Button variant="ghost" onClick={() => setModalOpen(false)}>
                Cancel
              </Button>
              <Button onClick={() => setModalOpen(false)}>Start trial</Button>
            </>
          }
        >
          <Text size="body-sm" color="muted">
            This is the Modal primitive used for confirmation flows across signup, onboarding and subscription changes.
          </Text>
        </Modal>
      </SectionBlock>

      <SectionBlock title="Empty / Error / Loading">
        <Grid cols={1} lgCols={2} gap={6}>
          <EmptyState
            icon={Building2}
            title="No facilities yet"
            description="Add your first facility to continue setting up your workspace."
            action={<Button size="sm">Add facility</Button>}
          />
          <ErrorState
            title="Couldn't load your workspace"
            description="Something went wrong while loading your organization's data."
            action={
              <Button size="sm" variant="outline" leftIcon={<RefreshCw className="size-4" />}>
                Retry
              </Button>
            }
          />
        </Grid>
        <Row gap={6} align="center" wrap className="pt-2">
          <Row gap={2}>
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
          </Row>
          <div className="flex flex-1 flex-col gap-2 min-w-48">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Row>
        <Card padding="none" className="overflow-hidden">
          <PageLoading label="Creating your workspace…" />
        </Card>
      </SectionBlock>

      <SectionBlock title="Layout Primitives">
        <Stack gap={4}>
          <Text size="body-sm" color="muted">
            Container / Stack / Row / Grid / Section are used throughout this page — every section above is built from
            them rather than one-off flex/grid classes.
          </Text>
          <div className="rounded-md border border-dashed border-neutral-300 p-4">
            <Grid cols={2} mdCols={4} gap={3}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className="rounded-md bg-brand-50 py-6 text-center text-caption text-brand-700">
                  Grid item {n}
                </div>
              ))}
            </Grid>
          </div>
        </Stack>
      </SectionBlock>

      <SectionBlock title="Plan Configuration (live from config/plans.ts)">
        <Stack gap={6}>
          <Grid cols={1} mdCols={3} gap={5}>
            {FIXED_PLANS.map((plan) => (
              <Card key={plan.id} variant={plan.mostPopular ? 'highlighted' : 'default'}>
                <CardHeader>
                  <Row justify="between">
                    <CardTitle>{plan.name}</CardTitle>
                    {plan.mostPopular && <Badge variant="brand">Most Popular</Badge>}
                  </Row>
                  <CardDescription>{plan.tagline}</CardDescription>
                </CardHeader>
                <CardContent>
                  <Stack gap={2}>
                    <Text as="p" className="text-h4 font-semibold text-neutral-900">
                      {formatNGN(plan.monthlyPriceNGN)}
                      <span className="text-body-sm font-normal text-neutral-500">/month</span>
                    </Text>
                    <Text size="caption" color="subtle">
                      Up to {plan.limits.facilities} facilit{plan.limits.facilities === 1 ? 'y' : 'ies'} · Up to {plan.limits.users} users
                    </Text>
                    <Text size="caption" color="subtle">
                      {plan.featureKeys.length} included capabilities · {plan.trialDays}-day free trial
                    </Text>
                  </Stack>
                </CardContent>
              </Card>
            ))}
          </Grid>

          <Card>
            <CardHeader>
              <CardTitle>Entitlement engine check</CardTitle>
              <CardDescription>
                A <code>doctor</code> role on the <code>Growth</code> plan — resolved via <code>resolvePlanEntitlements()</code> +{' '}
                <code>getAccessibleFeatures()</code>.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Row gap={2} wrap>
                {doctorAccessibleFeatures.map((key) => (
                  <Badge key={key} variant="outline" size="sm">
                    {getFeatureDefinition(key).sidebarLabel}
                  </Badge>
                ))}
              </Row>
              <Text size="caption" color="subtle" className="pt-3 block">
                {doctorAccessibleFeatures.length} of {doctorEntitlements.size} Growth-plan entitlements are visible to
                the Doctor role — the rest (e.g. Team, Billing) are entitled to the org but gated by role permissions.
              </Text>
            </CardContent>
          </Card>
        </Stack>
      </SectionBlock>
    </div>
  )
}
