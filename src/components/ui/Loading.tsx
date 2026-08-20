import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
  label?: string
}

const SIZE_CLASSES: Record<NonNullable<SpinnerProps['size']>, string> = {
  sm: 'size-4',
  md: 'size-6',
  lg: 'size-8',
}

export function Spinner({ size = 'md', className, label = 'Loading' }: SpinnerProps) {
  return (
    <span role="status" aria-label={label} className="inline-flex">
      <Loader2 className={cn('animate-spin text-brand-600', SIZE_CLASSES[size], className)} aria-hidden="true" />
    </span>
  )
}

/** Full-section loading state — use where an actual async boundary exists (e.g. "creating your workspace"), not decoratively. */
export function PageLoading({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-24">
      <Spinner size="lg" />
      <p className="text-body-sm text-neutral-500">{label}</p>
    </div>
  )
}

export interface SkeletonProps {
  className?: string
}

/** Content placeholder for data that's about to arrive — pairs with Skeleton-shaped layouts, not a substitute for a Spinner on quick actions. */
export function Skeleton({ className }: SkeletonProps) {
  return <div className={cn('animate-pulse rounded-md bg-neutral-200', className)} />
}
