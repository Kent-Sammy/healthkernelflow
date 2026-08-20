import { Check, Minus } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Text } from '@/components/ui/Typography'
import { PRICING_COMPARISON_ROWS } from '@/config/pricingComparison'
import { FIXED_PLANS, CUSTOM_PLAN } from '@/config/plans'
import { getComparisonCell } from '@/lib/pricingComparison'
import type { PlanId } from '@/types'

const COLUMN_PLANS: { id: PlanId; label: string }[] = [
  ...FIXED_PLANS.map((p) => ({ id: p.id as PlanId, label: p.name })),
  { id: CUSTOM_PLAN.id, label: CUSTOM_PLAN.name },
]

function ComparisonCellValue({ display, state }: { display: string; state: 'included' | 'excluded' | 'info' }) {
  if (state === 'included') {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-success-50 p-1">
        <Check className="size-3.5 text-success-600" aria-hidden="true" />
        <span className="sr-only">{display}</span>
      </span>
    )
  }
  if (state === 'excluded') {
    return (
      <span className="inline-flex items-center justify-center rounded-full bg-neutral-100 p-1">
        <Minus className="size-3.5 text-neutral-400" aria-hidden="true" />
        <span className="sr-only">{display}</span>
      </span>
    )
  }
  return <span className="text-body-sm text-neutral-700">{display}</span>
}

/**
 * Full feature comparison. Every cell is derived from `getComparisonCell()`
 * — nothing here is a hardcoded per-plan value, so the table can't drift
 * from the actual plan config.
 *
 * Responsive strategy: horizontally-scrollable table with a sticky
 * feature-name column, rather than a completely different mobile layout —
 * keeps the same data structure legible at any width without duplicating
 * the table twice.
 */
export function ComparisonTable() {
  return (
    <div>
      <p className="mb-2 text-caption text-neutral-500 sm:hidden">Scroll to compare plans →</p>
      <div className="overflow-x-auto rounded-lg border border-neutral-200">
        <table className="w-full min-w-[640px] border-collapse bg-neutral-0 text-left">
          <thead>
            <tr className="border-b border-neutral-200 bg-neutral-50">
              <th className="sticky left-0 z-10 bg-neutral-50 px-4 py-3 text-body-sm font-semibold text-neutral-900">Feature</th>
              {COLUMN_PLANS.map((col) => (
                <th key={col.id} className="px-4 py-3 text-center text-body-sm font-semibold text-neutral-900">
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {PRICING_COMPARISON_ROWS.map((row, index) => (
              <tr key={row.id} className={cn('border-b border-neutral-100 last:border-b-0', index % 2 === 1 ? 'bg-neutral-50' : 'bg-neutral-0')}>
                <td className="sticky left-0 z-10 bg-inherit px-4 py-3 text-body-sm text-neutral-800">
                  <Text size="body-sm">{row.label}</Text>
                </td>
                {COLUMN_PLANS.map((col) => {
                  const cell = getComparisonCell(row, col.id)
                  return (
                    <td key={col.id} className="px-4 py-3 text-center">
                      <ComparisonCellValue display={cell.display} state={cell.state} />
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
