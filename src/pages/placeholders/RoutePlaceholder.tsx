import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { CenteredLayout } from '@/components/layout/CenteredLayout'
import { Stack } from '@/components/layout/Stack'
import { Heading, Text } from '@/components/ui/Typography'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'

export interface RoutePlaceholderProps {
  eyebrow: string
  title: string
  description: string
  children?: ReactNode
}

/**
 * Stand-in for a flow that hasn't been built yet (signup/onboarding, the
 * Custom configurator, Help Me Choose). Confirms the route + any state the
 * previous step handed off actually arrived, without pretending the real
 * screen exists — a dead link would silently fail the "CTAs route
 * correctly" check this phase asks for; a placeholder passes it honestly.
 */
export function RoutePlaceholder({ eyebrow, title, description, children }: RoutePlaceholderProps) {
  const navigate = useNavigate()

  return (
    <CenteredLayout>
      <Card padding="lg">
        <Stack gap={4}>
          <Badge variant="outline" size="sm" className="w-fit">
            {eyebrow}
          </Badge>
          <Heading level="h2">{title}</Heading>
          <Text color="muted">{description}</Text>
          {children}
          <Button variant="ghost" className="w-fit" onClick={() => navigate('/pricing')}>
            ← Back to pricing
          </Button>
        </Stack>
      </Card>
    </CenteredLayout>
  )
}
