import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { PY_CLASSES, type SpaceValue } from './spacingScale'

export interface SectionProps extends HTMLAttributes<HTMLElement> {
  paddingY?: SpaceValue
}

/** Consistent vertical rhythm between page sections (pricing tiers, onboarding steps, dashboard blocks). */
export function Section({ paddingY = 16, className, ...props }: SectionProps) {
  return <section className={cn(PY_CLASSES[paddingY], className)} {...props} />
}
