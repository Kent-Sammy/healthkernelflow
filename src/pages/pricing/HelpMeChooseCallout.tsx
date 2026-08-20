import { HelpCircle, ArrowRight } from 'lucide-react'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { Text } from '@/components/ui/Typography'
import { Row } from '@/components/layout/Row'
import { Stack } from '@/components/layout/Stack'

export interface HelpMeChooseCalloutProps {
  onHelpMeChoose: () => void
}

export function HelpMeChooseCallout({ onHelpMeChoose }: HelpMeChooseCalloutProps) {
  return (
    <Card variant="default" className="bg-brand-50/60 border-brand-100">
      <Row justify="between" align="center" gap={4} wrap>
        <Row gap={3} align="center">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand-100">
            <HelpCircle className="size-4.5 text-brand-700" aria-hidden="true" />
          </span>
          <Stack gap={0}>
            <Text size="body-sm" className="font-semibold text-neutral-900">
              Not sure which plan is right for you?
            </Text>
            <Text size="caption" color="muted">
              Answer a few quick questions and we'll recommend a plan.
            </Text>
          </Stack>
        </Row>
        <Button variant="outline" onClick={onHelpMeChoose} rightIcon={<ArrowRight className="size-4" />}>
          Help Me Choose
        </Button>
      </Row>
    </Card>
  )
}
