import { RoutePlaceholder } from './RoutePlaceholder'

/** Where the pricing page's "Help Me Choose" CTA lands. The quiz itself is a later phase. */
export function HelpMeChoosePlaceholder() {
  return (
    <RoutePlaceholder
      eyebrow="Help Me Choose · Later phase"
      title="Plan recommendation quiz coming next"
      description="Organization type → facilities → users → required capabilities → recommended plan is built in a later phase. This route confirms the pricing page's Help Me Choose CTA lands in the right place."
    />
  )
}
