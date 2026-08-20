import type { HTMLAttributes } from 'react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const badgeVariants = cva('inline-flex items-center gap-1 rounded-full font-medium', {
  variants: {
    variant: {
      default: 'bg-neutral-100 text-neutral-700',
      brand: 'bg-brand-50 text-brand-700',
      success: 'bg-success-50 text-success-700',
      warning: 'bg-warning-50 text-warning-700',
      danger: 'bg-danger-50 text-danger-700',
      info: 'bg-info-50 text-info-700',
      outline: 'border border-neutral-300 text-neutral-700',
    },
    size: {
      sm: 'h-5 px-2 text-[0.6875rem]',
      md: 'h-6 px-2.5 text-caption',
    },
  },
  defaultVariants: { variant: 'default', size: 'md' },
})

export interface BadgeProps extends HTMLAttributes<HTMLSpanElement>, VariantProps<typeof badgeVariants> {}

export function Badge({ variant, size, className, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant, size }), className)} {...props} />
}
