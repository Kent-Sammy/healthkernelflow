import { cn } from '@/lib/cn'

export interface ProgressProps {
  value: number
  max?: number
  label?: string
  /** Shows "value / max" style text next to the label, e.g. usage meters. */
  showValueText?: boolean
  variant?: 'brand' | 'success' | 'warning' | 'danger'
  className?: string
}

const FILL_CLASSES: Record<NonNullable<ProgressProps['variant']>, string> = {
  brand: 'bg-brand-600',
  success: 'bg-success-600',
  warning: 'bg-warning-600',
  danger: 'bg-danger-600',
}

/** Linear progress bar — trial countdown, onboarding completion, usage meters. */
export function Progress({ value, max = 100, label, showValueText = false, variant = 'brand', className }: ProgressProps) {
  const pct = Math.min(100, Math.max(0, (value / max) * 100))

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      {(label || showValueText) && (
        <div className="flex items-center justify-between text-caption text-neutral-600">
          {label && <span>{label}</span>}
          {showValueText && (
            <span>
              {value} / {max}
            </span>
          )}
        </div>
      )}
      <div
        role="progressbar"
        aria-valuenow={value}
        aria-valuemin={0}
        aria-valuemax={max}
        className="h-2 w-full overflow-hidden rounded-full bg-neutral-200"
      >
        <div
          className={cn('h-full rounded-full transition-[width] duration-300 ease-out', FILL_CLASSES[variant])}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  )
}
