import { Sparkles, Check } from 'lucide-react'
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Typography'
import { Stack } from '@/components/layout/Stack'
import { Row } from '@/components/layout/Row'
import type { CustomPlanDefinition } from '@/types'

const CONFIGURABLE_DIMENSIONS = [
  'Organization type & care model',
  'Services, specialties & capacity',
  'Facilities & users',
  'Branding & integrations',
]

export interface CustomPlanCardProps {
  plan: CustomPlanDefinition
  onSelect: () => void
}

export function CustomPlanCard({ plan, onSelect }: CustomPlanCardProps) {
  return (
    <Card variant="default" className="flex flex-col border-dashed">
      <CardHeader>
        <Row gap={2} align="center">
          <Sparkles className="size-4 text-brand-600" aria-hidden="true" />
          <CardTitle>{plan.tagline}</CardTitle>
        </Row>
        <CardDescription>{plan.description}</CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        <Stack gap={4}>
          <Text as="p" className="text-h2 font-semibold text-neutral-900">
            Custom pricing
          </Text>
          <Text size="body-sm" color="muted">
            Answer a few questions about your organization and get an instant estimated price.
          </Text>

          <Stack gap={2}>
            <Text size="caption" color="subtle" className="font-medium uppercase tracking-wide">
              You configure:
            </Text>
            <Stack gap={2}>
              {CONFIGURABLE_DIMENSIONS.map((item) => (
                <Row key={item} gap={2} align="start">
                  <Check className="mt-0.5 size-4 shrink-0 text-brand-600" aria-hidden="true" />
                  <Text size="body-sm">{item}</Text>
                </Row>
              ))}
            </Stack>
          </Stack>
        </Stack>
      </CardContent>

      <CardFooter>
        <Button fullWidth variant="secondary" onClick={onSelect}>
          Build Your Plan
        </Button>
      </CardFooter>
    </Card>
  )
}
