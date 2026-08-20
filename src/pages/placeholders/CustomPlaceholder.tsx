import { RoutePlaceholder } from './RoutePlaceholder'

/** Where the pricing page's "Build Your Plan" CTA lands. The Custom configuration wizard itself is a later phase. */
export function CustomPlaceholder() {
  return (
    <RoutePlaceholder
      eyebrow="Build Your HealthKernel · Later phase"
      title="Custom configuration coming next"
      description="The intelligent configuration flow (organization type, care model, services, capacity, facilities, users, branding, integrations, and an estimated price) is built in a later phase. This route confirms the pricing page's Custom CTA lands in the right place."
    />
  )
}
