import { cn } from '@/lib/cn'
import { Badge } from '@/components/ui/Badge'
import { ANNUAL_DISCOUNT_PERCENT } from '@/config/plans'
import type { BillingCycle } from '@/types'

export interface BillingToggleProps {
  value: BillingCycle
  onChange: (value: BillingCycle) => void
  className?: string
}

/** Monthly/Annual segmented control. Annual carries the confirmed 15% discount, applied centrally in `config/plans.ts`. */
export function BillingToggle({ value, onChange, className }: BillingToggleProps) {
  return (
    <div
      role="group"
      aria-label="Billing frequency"
      className={cn('inline-flex items-center gap-1 rounded-full border border-neutral-200 bg-neutral-0 p-1', className)}
    >
      <button
        type="button"
        aria-pressed={value === 'monthly'}
        onClick={() => onChange('monthly')}
        className={cn(
          'rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors',
          value === 'monthly' ? 'bg-brand-600 text-white' : 'text-neutral-600 hover:text-neutral-900',
        )}
      >
        Monthly
      </button>
      <button
        type="button"
        aria-pressed={value === 'annual'}
        onClick={() => onChange('annual')}
        className={cn(
          'flex items-center gap-2 rounded-full px-4 py-1.5 text-body-sm font-medium transition-colors',
          value === 'annual' ? 'bg-brand-600 text-white' : 'text-neutral-600 hover:text-neutral-900',
        )}
      >
        Annual
        <Badge variant={value === 'annual' ? 'default' : 'success'} size="sm" className={value === 'annual' ? 'bg-white/20 text-white' : ''}>
          Save {ANNUAL_DISCOUNT_PERCENT}%
        </Badge>
      </button>
    </div>
  )
}
