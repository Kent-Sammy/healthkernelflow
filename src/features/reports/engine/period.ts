import { DATA_START, DEMO_TODAY, addDays, dayNum, endOfMonth, isoDay } from './dates'
import { fmtDate } from './format'

export type PeriodPreset = 'today' | 'yesterday' | 'last7' | 'last30' | 'this_month' | 'last_month' | 'this_quarter' | 'last_quarter' | 'ytd' | 'last12' | 'custom'

export interface Period {
  preset: PeriodPreset
  from: string
  to: string
}

export const PERIOD_OPTIONS: { value: PeriodPreset; label: string }[] = [
  { value: 'today', label: 'Today' },
  { value: 'yesterday', label: 'Yesterday' },
  { value: 'last7', label: 'Last 7 days' },
  { value: 'last30', label: 'Last 30 days' },
  { value: 'this_month', label: 'This month' },
  { value: 'last_month', label: 'Last month' },
  { value: 'this_quarter', label: 'This quarter' },
  { value: 'last_quarter', label: 'Last quarter' },
  { value: 'ytd', label: 'Year to date' },
  { value: 'last12', label: 'Last 12 months' },
  { value: 'custom', label: 'Custom range' },
]

export function resolvePeriod(preset: PeriodPreset, from?: string, to?: string): Period {
  const t = DEMO_TODAY
  const y = t.slice(0, 4)
  const m = Number(t.slice(5, 7))
  switch (preset) {
    case 'today':
      return { preset, from: t, to: t }
    case 'yesterday':
      return { preset, from: addDays(t, -1), to: addDays(t, -1) }
    case 'last7':
      return { preset, from: addDays(t, -6), to: t }
    case 'last30':
      return { preset, from: addDays(t, -29), to: t }
    case 'this_month':
      return { preset, from: `${t.slice(0, 7)}-01`, to: t }
    case 'last_month': {
      const lastEnd = addDays(`${t.slice(0, 7)}-01`, -1)
      return { preset, from: `${lastEnd.slice(0, 7)}-01`, to: lastEnd }
    }
    case 'this_quarter': {
      const qs = Math.floor((m - 1) / 3) * 3 + 1
      return { preset, from: `${y}-${String(qs).padStart(2, '0')}-01`, to: t }
    }
    case 'last_quarter': {
      const qs = Math.floor((m - 1) / 3) * 3 + 1
      const start = qs - 3 > 0 ? `${y}-${String(qs - 3).padStart(2, '0')}-01` : `${Number(y) - 1}-10-01`
      return { preset, from: start, to: endOfMonth(`${start.slice(0, 5)}${String(Number(start.slice(5, 7)) + 2).padStart(2, '0')}-01`) }
    }
    case 'ytd':
      return { preset, from: `${y}-01-01`, to: t }
    case 'last12':
      return { preset, from: DATA_START, to: t }
    case 'custom': {
      const f = from && /^\d{4}-\d{2}-\d{2}$/.test(from) ? from : addDays(t, -29)
      const tt = to && /^\d{4}-\d{2}-\d{2}$/.test(to) ? to : t
      return f <= tt ? { preset, from: f, to: tt } : { preset, from: tt, to: f }
    }
  }
}

export function previousPeriod(p: Period): Period {
  const len = dayNum(p.to) - dayNum(p.from) + 1
  const to = isoDay(dayNum(p.from) - 1)
  return { preset: 'custom', from: isoDay(dayNum(to) - len + 1), to }
}

export function periodLabel(p: Period): string {
  const name = PERIOD_OPTIONS.find((o) => o.value === p.preset)?.label
  const range = p.from === p.to ? fmtDate(p.from) : `${fmtDate(p.from)} – ${fmtDate(p.to)}`
  return p.preset === 'custom' ? range : `${name} · ${range}`
}

export function periodDays(p: Period): number {
  return dayNum(p.to) - dayNum(p.from) + 1
}

export type Granularity = 'day' | 'week' | 'month'

export function granularityFor(p: Period): Granularity {
  const d = periodDays(p)
  if (d <= 35) return 'day'
  if (d <= 120) return 'week'
  return 'month'
}
