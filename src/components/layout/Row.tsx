import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { GAP_CLASSES, type SpaceValue } from './spacingScale'

export interface RowProps extends HTMLAttributes<HTMLDivElement> {
  gap?: SpaceValue
  align?: 'start' | 'center' | 'end' | 'stretch' | 'baseline'
  justify?: 'start' | 'center' | 'end' | 'between' | 'around'
  wrap?: boolean
}

const ALIGN_CLASSES = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
  baseline: 'items-baseline',
} as const

const JUSTIFY_CLASSES = {
  start: 'justify-start',
  center: 'justify-center',
  end: 'justify-end',
  between: 'justify-between',
  around: 'justify-around',
} as const

/** Horizontal flex layout with a consistent gap — for toolbars, button groups, inline metadata. */
export function Row({ gap = 3, align = 'center', justify = 'start', wrap = false, className, ...props }: RowProps) {
  return (
    <div
      className={cn(
        'flex',
        wrap && 'flex-wrap',
        GAP_CLASSES[gap],
        ALIGN_CLASSES[align],
        JUSTIFY_CLASSES[justify],
        className,
      )}
      {...props}
    />
  )
}
