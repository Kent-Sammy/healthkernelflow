import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

export interface ContainerProps extends HTMLAttributes<HTMLDivElement> {
  /** Narrow container for single-column flows (signup, onboarding steps). */
  narrow?: boolean
}

/** Centered, responsively-padded content width. The base horizontal rhythm every page should build on. */
export function Container({ narrow = false, className, ...props }: ContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        narrow ? 'max-w-(--container-narrow)' : 'max-w-(--container-page)',
        className,
      )}
      {...props}
    />
  )
}
