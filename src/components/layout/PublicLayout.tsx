import type { ReactNode } from 'react'
import { Container } from './Container'

export interface PublicLayoutProps {
  children: ReactNode
  /** Right-aligned header slot — e.g. "Log in" link during pricing/signup. */
  headerActions?: ReactNode
}

/**
 * Shell for the commercial/onboarding surface (pricing, plan selection,
 * signup, onboarding, trial review). Deliberately minimal — this is NOT
 * the marketing site, so no marketing nav/footer here, just enough chrome
 * to orient the visitor and host a "Log in" affordance.
 */
export function PublicLayout({ children, headerActions }: PublicLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-neutral-50">
      <header className="border-b border-neutral-200 bg-neutral-0">
        <Container className="flex h-16 items-center justify-between">
          <span className="text-h4 font-semibold tracking-tight text-neutral-900">HealthKernel</span>
          {headerActions}
        </Container>
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-neutral-200 py-6">
        <Container>
          <p className="text-caption text-neutral-500">© {new Date().getFullYear()} HealthKernel. All rights reserved.</p>
        </Container>
      </footer>
    </div>
  )
}
