import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'
import { Inbox } from 'lucide-react'
import { cn } from '@/lib/cn'

export interface EmptyStateProps {
  icon?: LucideIcon
  title: string
  description?: string
  action?: ReactNode
  className?: string
}

/** Neutral "nothing here yet" state — distinct from ErrorState, which signals something went wrong. */
export function EmptyState({ icon: Icon = Inbox, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center gap-3 rounded-lg border border-dashed border-neutral-300 px-6 py-12 text-center', className)}>
      <div className="flex size-11 items-center justify-center rounded-full bg-neutral-100">
        <Icon className="size-5 text-neutral-500" aria-hidden="true" />
      </div>
      <div className="flex flex-col gap-1">
        <p className="text-body-sm font-semibold text-neutral-900">{title}</p>
        {description && <p className="max-w-sm text-body-sm text-neutral-500">{description}</p>}
      </div>
      {action && <div className="mt-1">{action}</div>}
    </div>
  )
}
