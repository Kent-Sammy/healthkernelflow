import type { ReactNode, SelectHTMLAttributes } from 'react'
import * as DialogPrimitive from '@radix-ui/react-dialog'
import { ArrowDownRight, ArrowUpRight, ChevronDown, Info, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatValue, type Fmt } from '../engine/format'
import { MODULE_BY_ID } from '../engine/catalogue'
import { MODULE_ICONS } from './icons'
import { Sparkline } from './charts/Sparkline'

export function PageHeader({ title, subtitle, actions, eyebrow }: { title: string; subtitle?: ReactNode; actions?: ReactNode; eyebrow?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {eyebrow && <div className="mb-1.5">{eyebrow}</div>}
        <h1 className="text-[22px] font-bold leading-tight tracking-tight text-neutral-900">{title}</h1>
        {subtitle && <p className="mt-1 text-[14.5px] text-neutral-500">{subtitle}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2.5">{actions}</div>}
    </div>
  )
}

export function Panel({ title, subtitle, actions, children, className, bodyClassName, id }: { title?: ReactNode; subtitle?: ReactNode; actions?: ReactNode; children: ReactNode; className?: string; bodyClassName?: string; id?: string }) {
  return (
    <section id={id} className={cn('hk-panel flex min-w-0 flex-col rounded-xl border border-[#e3eeec] bg-white shadow-[0_1px_2px_rgba(16,64,58,0.04),0_4px_16px_-8px_rgba(16,64,58,0.08)]', className)}>
      {(title || actions) && (
        <header className="flex flex-wrap items-start justify-between gap-3 px-5 pb-1 pt-4">
          <div className="min-w-0">
            {title && <h2 className="text-[15px] font-semibold text-neutral-900">{title}</h2>}
            {subtitle && <p className="mt-0.5 text-[12.5px] text-neutral-500">{subtitle}</p>}
          </div>
          {actions && <div className="flex items-center gap-2">{actions}</div>}
        </header>
      )}
      <div className={cn('min-w-0 flex-1 px-5 pb-5 pt-3', bodyClassName)}>{children}</div>
    </section>
  )
}

const GOOD = ['Paid', 'Completed', 'Fully dispensed', 'Matched', 'Success', 'Active', 'Delivered', 'Approved', 'In stock', 'Yes', 'Balanced', 'Complete', 'OK', 'Enabled', 'Discharged', 'Passed', 'Reviewed', 'Submitted (simulated)', 'Issued', 'Received', 'Low', 'Routine', 'Transfer in', 'Returned', 'Wallet top-up', 'Collected', 'Top-up', 'Repayment', 'Clear', 'Within limit', 'Applied – fully used', 'Applied – excess refunded', 'Hospital holds patient funds']
const WARN = ['Part-paid', 'Pending', 'In progress', 'Partially dispensed', 'Partially delivered', 'Pending review', 'Low stock', 'Partial', 'Under review', 'Submitted', 'Draft', 'Scheduled', 'Invited', 'Unspecified code', 'Symptom code only', 'Incomplete', 'Medium', 'Passed with warnings', 'Not enabled', 'Admitted', 'Not collected', 'Partially approved', 'Pending approval', 'Urgent', 'Adjustment', 'Adjusted', 'Discount', 'Waiver', 'Not run', 'In preparation', 'Scheduled run', 'Changes requested', 'Utilized', 'Promotional credit', 'Near limit', 'Held – patient admitted', 'Applied – refund pending', 'Charged to credit', 'Moved to wallet', 'Refund to wallet', 'Applied to bill']
const BAD = ['Overdue', 'Unpaid', 'Unmatched', 'Rejected', 'Failed', 'Out of stock', 'Not dispensed – out of stock', 'Cancelled', 'No-show', 'No', 'Variance', 'Missing code', 'High', 'Suspended', 'Deactivated', 'Written off', 'Expired', 'Damaged', 'Reversed', 'Write-off', 'Refund', 'Claims Adjustment', 'Transfer out', 'Over limit', 'Applied – balance due', 'Written off', 'Patient owes hospital', 'Refunded']

export type Tone = 'good' | 'warn' | 'bad' | 'info' | 'neutral'
export function toneOf(v: string): Tone {
  if (GOOD.includes(v)) return 'good'
  if (WARN.includes(v)) return 'warn'
  if (BAD.includes(v)) return 'bad'
  if (v === '—' || !v) return 'neutral'
  return 'info'
}

const TONE_CLASS: Record<Tone, string> = {
  good: 'bg-success-50 text-success-700 ring-success-200',
  warn: 'bg-warning-50 text-warning-700 ring-warning-200',
  bad: 'bg-danger-50 text-danger-700 ring-danger-200',
  info: 'bg-[#e6f4f2] text-brand-800 ring-brand-200',
  neutral: 'bg-neutral-100 text-neutral-600 ring-neutral-200',
}
const DOT: Record<Tone, string> = { good: 'bg-success-600', warn: 'bg-warning-600', bad: 'bg-danger-600', info: 'bg-brand-600', neutral: 'bg-neutral-400' }

export function StatusBadge({ value, tone, className }: { value: string; tone?: Tone; className?: string }) {
  const t = tone ?? toneOf(value)
  if (!value || value === '—') return <span className="text-neutral-400">—</span>
  return (
    <span className={cn('inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11.5px] font-medium ring-1 ring-inset', TONE_CLASS[t], className)}>
      <span className={cn('size-1.5 rounded-full', DOT[t])} aria-hidden="true" />
      {value}
    </span>
  )
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return <span className={cn('inline-flex items-center gap-1 whitespace-nowrap rounded-full bg-[#e6f4f2] px-2.5 py-0.5 text-[11.5px] font-medium text-brand-800', className)}>{children}</span>
}

export function TypeBadge({ type }: { type: string }) {
  return <span className="inline-flex items-center whitespace-nowrap rounded-md border border-neutral-200 bg-neutral-50 px-1.5 py-0.5 text-[11px] font-medium text-neutral-600">{type}</span>
}

export function ModuleIcon({ module, size = 'md' }: { module: string; size?: 'sm' | 'md' | 'lg' }) {
  const def = MODULE_BY_ID[module]
  const Icon = MODULE_ICONS[def?.icon ?? 'Receipt']
  const cls = size === 'sm' ? 'size-7 rounded-md [&>svg]:size-3.5' : size === 'lg' ? 'size-11 rounded-xl [&>svg]:size-5' : 'size-9 rounded-lg [&>svg]:size-[18px]'
  return (
    <span className={cn('inline-flex shrink-0 items-center justify-center bg-[#e6f4f2] text-brand-700', cls)} aria-hidden="true">
      <Icon />
    </span>
  )
}

export function KpiCard({ label, value, fmt, delta, better, hint, spark, onClick, sub, compact }: { label: string; value: number; fmt: Fmt; delta?: number; better?: 'up' | 'down'; hint?: string; spark?: number[]; onClick?: () => void; sub?: ReactNode; compact?: boolean }) {
  const hasDelta = delta !== undefined && Number.isFinite(delta) && Math.abs(delta) > 0.0005
  const good = hasDelta && better ? (better === 'up' ? delta! > 0 : delta! < 0) : null
  const Tag = onClick ? 'button' : 'div'
  return (
    <Tag
      type={onClick ? 'button' : undefined}
      onClick={onClick}
      className={cn(
        'group flex min-w-0 flex-col justify-between gap-1.5 overflow-hidden rounded-xl border border-[#e3eeec] bg-white text-left shadow-[0_1px_2px_rgba(16,64,58,0.04)] transition',
        compact ? 'p-3.5' : 'p-4',
        onClick && 'hover:-translate-y-px hover:border-brand-300 hover:shadow-md focus-visible:ring-2 focus-visible:ring-brand-600/40',
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <span className="flex items-center gap-1 text-[12.5px] font-medium text-neutral-500">
          {label}
          {hint && (
            <span title={hint} className="text-neutral-400">
              <Info className="size-3" aria-label={hint} />
            </span>
          )}
        </span>
        {onClick && <ArrowUpRight className="size-3.5 text-neutral-300 transition group-hover:text-brand-600" aria-hidden="true" />}
      </div>
      <div className={cn('truncate font-bold tabular-nums tracking-tight text-neutral-900', compact ? 'text-[19px]' : 'text-[22px]')} title={formatValue(value, fmt)}>
        {formatValue(value, fmt, fmt === 'currency' && Math.abs(value) >= 1e6)}
      </div>
      <div className="flex min-h-[28px] items-end justify-between gap-2">
        {hasDelta ? (
          <div className={cn('flex items-center gap-1 whitespace-nowrap text-[11.5px] font-medium', good === null ? 'text-neutral-500' : good ? 'text-success-700' : 'text-danger-700')} title="Compared with the previous period of equal length">
            {delta! > 0 ? <ArrowUpRight className="size-3" aria-hidden="true" /> : <ArrowDownRight className="size-3" aria-hidden="true" />}
            {fmt === 'percent' ? `${(Math.abs(delta!) * 100).toFixed(1)} pts` : `${(Math.abs(delta!) * 100).toFixed(1)}%`}
            <span className="font-normal text-neutral-400">vs prior</span>
          </div>
        ) : (
          <div className="truncate text-[11.5px] text-neutral-500">{sub}</div>
        )}
        {spark && (
          <span className="hidden shrink-0 sm:block">
            <Sparkline values={spark} width={72} height={26} />
          </span>
        )}
      </div>
    </Tag>
  )
}

export function NativeSelect({ label, options, className, ...props }: SelectHTMLAttributes<HTMLSelectElement> & { label?: string; options: { value: string; label: string }[] }) {
  return (
    <label className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label && <span className="text-[12.5px] font-medium text-neutral-700">{label}</span>}
      <span className="relative">
        <select
          className="h-10 w-full appearance-none truncate rounded-lg border border-neutral-300 bg-white pl-3 pr-9 text-[13.5px] text-neutral-900 transition hover:border-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
          {...props}
        >
          {options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-neutral-500" aria-hidden="true" />
      </span>
    </label>
  )
}

export function Segmented<T extends string>({ value, onChange, options, size = 'md' }: { value: T; onChange: (v: T) => void; options: { value: T; label: string }[]; size?: 'sm' | 'md' }) {
  return (
    <div role="radiogroup" className="inline-flex flex-wrap gap-1 rounded-lg border border-[#d7e9e6] bg-[#f3faf9] p-1">
      {options.map((o) => (
        <button
          key={o.value}
          type="button"
          role="radio"
          aria-checked={value === o.value}
          onClick={() => onChange(o.value)}
          className={cn('rounded-md font-medium transition', size === 'sm' ? 'px-2.5 py-1 text-[12px]' : 'px-3 py-1.5 text-[13px]', value === o.value ? 'bg-white text-brand-800 shadow-sm ring-1 ring-[#cfe6e2]' : 'text-neutral-600 hover:text-neutral-900')}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}

export function Drawer({ open, onOpenChange, title, subtitle, children, footer, width = 'max-w-xl' }: { open: boolean; onOpenChange: (o: boolean) => void; title: ReactNode; subtitle?: ReactNode; children: ReactNode; footer?: ReactNode; width?: string }) {
  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="fixed inset-0 z-50 bg-neutral-950/30 data-[state=open]:animate-in data-[state=open]:fade-in" />
        <DialogPrimitive.Content className={cn('fixed inset-y-0 right-0 z-50 flex w-full flex-col bg-white shadow-xl focus:outline-none data-[state=open]:animate-in data-[state=open]:slide-in-from-right', width)}>
          <div className="flex items-start justify-between gap-4 border-b border-neutral-200 px-6 py-4">
            <div className="min-w-0">
              <DialogPrimitive.Title className="text-[16px] font-semibold text-neutral-900">{title}</DialogPrimitive.Title>
              {subtitle && <DialogPrimitive.Description className="mt-0.5 text-[12.5px] text-neutral-500">{subtitle}</DialogPrimitive.Description>}
            </div>
            <DialogPrimitive.Close className="rounded-md p-1.5 text-neutral-500 hover:bg-neutral-100" aria-label="Close">
              <X className="size-4" />
            </DialogPrimitive.Close>
          </div>
          <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
          {footer && <div className="flex justify-end gap-2 border-t border-neutral-200 px-6 py-3">{footer}</div>}
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  )
}

export function HkButton({ variant = 'outline', size = 'md', className, children, ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'outline' | 'primary' | 'ghost' | 'danger'; size?: 'sm' | 'md' | 'lg' }) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-lg font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-600/40 disabled:pointer-events-none disabled:opacity-50 [&>svg]:size-4',
        size === 'sm' ? 'h-8 px-3 text-[12.5px]' : size === 'lg' ? 'h-12 px-6 text-[15px]' : 'h-10 px-4 text-[13.5px]',
        variant === 'outline' && 'border-[1.5px] border-brand-500 bg-white text-brand-700 hover:bg-[#effaf8]',
        variant === 'primary' && 'bg-brand-600 text-white shadow-sm hover:bg-brand-700',
        variant === 'ghost' && 'text-neutral-600 hover:bg-neutral-100 hover:text-neutral-900',
        variant === 'danger' && 'border-[1.5px] border-danger-200 bg-white text-danger-700 hover:bg-danger-50',
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}

export function Skeleton({ className }: { className?: string }) {
  return <div className={cn('animate-pulse rounded-lg bg-[#e8f1ef]', className)} />
}

export function DemoNotice({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 rounded-full border border-warning-200 bg-warning-50 px-2.5 py-0.5 text-[11.5px] font-medium text-warning-700', className)}>
      <span className="size-1.5 rounded-full bg-warning-600" aria-hidden="true" />
      Prototype · fictional demonstration data
    </span>
  )
}
