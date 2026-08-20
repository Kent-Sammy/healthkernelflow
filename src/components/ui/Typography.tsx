import type { ElementType, HTMLAttributes, ReactNode } from 'react'
import { cn } from '@/lib/cn'

type HeadingLevel = 'display' | 'h1' | 'h2' | 'h3' | 'h4'

const HEADING_STYLES: Record<HeadingLevel, string> = {
  display: 'text-display text-neutral-900',
  h1: 'text-h1 text-neutral-900',
  h2: 'text-h2 text-neutral-900',
  h3: 'text-h3 text-neutral-900',
  h4: 'text-h4 text-neutral-900',
}

const HEADING_TAGS: Record<HeadingLevel, ElementType> = {
  display: 'h1',
  h1: 'h1',
  h2: 'h2',
  h3: 'h3',
  h4: 'h4',
}

export interface HeadingProps extends HTMLAttributes<HTMLHeadingElement> {
  level?: HeadingLevel
  /** Override the rendered tag independent of visual size (e.g. visually `h2`, semantically `h1`). */
  as?: ElementType
  children: ReactNode
}

/** Every page heading should use this instead of raw `<h1>`/text-size classes, so the type scale stays centralized. */
export function Heading({ level = 'h2', as, className, children, ...props }: HeadingProps) {
  const Tag = as ?? HEADING_TAGS[level]
  return (
    <Tag className={cn('font-semibold tracking-tight', HEADING_STYLES[level], className)} {...props}>
      {children}
    </Tag>
  )
}

type TextSize = 'body-lg' | 'body' | 'body-sm' | 'caption' | 'overline'
type TextColor = 'default' | 'muted' | 'subtle' | 'danger' | 'success' | 'brand'

const TEXT_SIZE_STYLES: Record<TextSize, string> = {
  'body-lg': 'text-body-lg',
  body: 'text-body',
  'body-sm': 'text-body-sm',
  caption: 'text-caption',
  overline: 'text-overline uppercase tracking-wide',
}

const TEXT_COLOR_STYLES: Record<TextColor, string> = {
  default: 'text-neutral-900',
  muted: 'text-neutral-600',
  subtle: 'text-neutral-500',
  danger: 'text-danger-600',
  success: 'text-success-600',
  brand: 'text-brand-700',
}

export interface TextProps extends HTMLAttributes<HTMLParagraphElement> {
  size?: TextSize
  color?: TextColor
  as?: ElementType
  children: ReactNode
}

/** The default body-copy primitive. Use instead of raw `<p>` + text-size utility classes. */
export function Text({ size = 'body', color = 'default', as: Tag = 'p', className, children, ...props }: TextProps) {
  return (
    <Tag className={cn(TEXT_SIZE_STYLES[size], TEXT_COLOR_STYLES[color], className)} {...props}>
      {children}
    </Tag>
  )
}
