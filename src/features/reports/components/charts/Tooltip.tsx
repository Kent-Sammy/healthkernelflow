import type { ReactNode } from 'react'

export function ChartTooltip({ x, y, width, children }: { x: number; y: number; width: number; children: ReactNode }) {
  const left = Math.min(Math.max(x + 12, 4), width - 200)
  return (
    <div className="pointer-events-none absolute z-10 min-w-[150px] max-w-[240px] rounded-lg border border-neutral-200 bg-white px-3 py-2 text-[12px] shadow-lg" style={{ left, top: Math.max(0, y - 10) }}>
      {children}
    </div>
  )
}

export function TooltipRow({ color, label, value }: { color?: string; label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-4 py-0.5">
      <span className="flex min-w-0 items-center gap-1.5 text-neutral-600">
        {color && <span className="size-2 shrink-0 rounded-full" style={{ background: color }} />}
        <span className="truncate">{label}</span>
      </span>
      <span className="font-semibold tabular-nums text-neutral-900">{value}</span>
    </div>
  )
}
