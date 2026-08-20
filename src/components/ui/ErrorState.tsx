import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface ErrorStateProps {
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** Signals something went wrong (failed load, blocked action) — visually distinct (danger accent) from the neutral EmptyState. */
export function ErrorState({ title, description, action, className }: ErrorStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-lg border border-danger-200 bg-danger-50 px-6 py-12 text-center', className)}>
      <div className="flex size-11 items-center justify-center rounded-full bg-danger-100">
        <AlertTriangle className="size-5 text-danger-600" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-body-sm font-semibold text-neutral-900">{title}</p>
        {description && <p className="max-w-sm text-body-sm text-neutral-600">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
