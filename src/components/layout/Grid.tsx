import type { HTMLAttributes } from 'react'
import { cn } from '@/lib/cn'
import { GAP_CLASSES, type SpaceValue } from './spacingScale'

export type GridColCount = 1 | 2 | 3 | 4

const BASE_COLS: Record<GridColCount, string> = {
  1: 'grid-cols-1',
  2: 'grid-cols-2',
  3: 'grid-cols-3',
  4: 'grid-cols-4',
}

const SM_COLS: Record<GridColCount, string> = {
  1: 'sm:grid-cols-1',
  2: 'sm:grid-cols-2',
  3: 'sm:grid-cols-3',
  4: 'sm:grid-cols-4',
}

const MD_COLS: Record<GridColCount, string> = {
  1: 'md:grid-cols-1',
  2: 'md:grid-cols-2',
  3: 'md:grid-cols-3',
  4: 'md:grid-cols-4',
}

const LG_COLS: Record<GridColCount, string> = {
  1: 'lg:grid-cols-1',
  2: 'lg:grid-cols-2',
  3: 'lg:grid-cols-3',
  4: 'lg:grid-cols-4',
}

export interface GridProps extends HTMLAttributes<HTMLDivElement> {
  cols?: GridColCount
  smCols?: GridColCount
  mdCols?: GridColCount
  lgCols?: GridColCount
  gap?: SpaceValue
}

/** Responsive CSS grid. Pass per-breakpoint column counts (e.g. `cols={1} lgCols={4}`) for the classic "stack on mobile, row on desktop" pricing-card layout. */
export function Grid({ cols = 1, smCols, mdCols, lgCols, gap = 6, className, ...props }: GridProps) {
  return (
    <div
      className={cn(
        'grid',
        BASE_COLS[cols],
        smCols && SM_COLS[smCols],
        mdCols && MD_COLS[mdCols],
        lgCols && LG_COLS[lgCols],
        GAP_CLASSES[gap],
        className,
      )}
      {...props}
    />
  )
}
