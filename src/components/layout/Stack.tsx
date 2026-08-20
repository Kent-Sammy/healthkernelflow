import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { GAP_CLASSES, type SpaceValue } from './spacingScale'

export interface StackProps extends HTMLAttributes<HTMLDivElement> {
  gap?: SpaceValue
  align?: 'start' | 'center' | 'end' | 'stretch'
}

const ALIGN_CLASSES = {
  start: 'items-start',
  center: 'items-center',
  end: 'items-end',
  stretch: 'items-stretch',
} as const

/** Vertical flex layout with a consistent gap — the default building block for form/page sections. */
export function Stack({ gap = 4, align = 'stretch', className, ...props }: StackProps) {
  return <div className={cn('flex flex-col', GAP_CLASSES[gap], ALIGN_CLASSES[align], className)} {...props} />
}
