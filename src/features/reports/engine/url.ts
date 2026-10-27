import type { ReportConfig } from './run'
import type { PeriodPreset } from './period'
import { PERIOD_OPTIONS } from './period'
import { REPORT_BY_ID } from './catalogue'
import { defaultConfig } from './run'

/** Report configurations live in the URL so links, refreshes and history all reproduce a report. */
export function configToSearch(c: ReportConfig): string {
  const p = new URLSearchParams()
  p.set('r', c.reportId)
  p.set('p', c.period)
  if (c.period === 'custom') {
    if (c.from) p.set('from', c.from)
    if (c.to) p.set('to', c.to)
  }
  for (const [k, v] of Object.entries(c.filters)) if (v && v !== 'all') p.set(`f.${k}`, v)
  if (c.groupBy) p.set('g', c.groupBy)
  p.set('v', c.view)
  return `?${p.toString()}`
}

export function searchToConfig(search: URLSearchParams): ReportConfig | null {
  const id = search.get('r')
  if (!id || !REPORT_BY_ID[id]) return null
  const base = defaultConfig(REPORT_BY_ID[id])
  const p = search.get('p') as PeriodPreset | null
  if (p && PERIOD_OPTIONS.some((o) => o.value === p)) base.period = p
  base.from = search.get('from') ?? undefined
  base.to = search.get('to') ?? undefined
  const filters: Record<string, string> = {}
  search.forEach((v, k) => {
    if (k.startsWith('f.')) filters[k.slice(2)] = v
  })
  base.filters = filters
  base.groupBy = search.get('g') ?? base.groupBy
  const v = search.get('v')
  if (v === 'summary' || v === 'detailed') base.view = v
  return base
}

export function configKey(c: ReportConfig): string {
  return configToSearch({ ...c, view: 'summary' })
}
