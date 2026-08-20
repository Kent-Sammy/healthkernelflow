import type { ReactNode } from 'react'
import { Container } from './Container'

export interface CenteredLayoutProps {
  children: ReactNode
  /** Slot above the content card — typically a Stepper for onboarding flows. */
  topSlot?: ReactNode
}

/**
 * Single-column shell for focused, linear flows: signup, onboarding steps,
 * trial review, payment. Keeps the visitor's attention on one task at a
 * time rather than a full app chrome.
 */
export function CenteredLayout({ children, topSlot }: CenteredLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-neutral-0">
        <Container className="flex h-16 items-center">
          <span className="text-h4 font-semibold tracking-tight text-neutral-900">HealthKernel</span>
        </Container>
      </header>

      <main className="flex flex-1 flex-col items-center px-4 py-10 sm:py-16">
        <Container narrow>
          {topSlot && <div className="mb-8">{topSlot}</div>}
          {children}
        </Container>
      </main>
    </div>
  )
}
