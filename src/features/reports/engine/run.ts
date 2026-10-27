import type { Db } from '../data/types'
import { REPORT_BY_ID, type ReportDef } from './catalogue'
import { SOURCES, sourceRows, type ColumnDef, type DimensionDef, type MeasureDef, type Row, type SourceDef } from './sources'
import { granularityFor, previousPeriod, resolvePeriod, periodLabel, type Granularity, type Period, type PeriodPreset } from './period'
import { dayNum, dowOf, isoDay } from './dates'
import { fmtMonth, type Fmt } from './format'

export interface ReportConfig {
  reportId: string
  period: PeriodPreset
  from?: string
  to?: string
  filters: Record<string, string>
  groupBy?: string
  view: 'summary' | 'detailed'
}

export interface KpiResult {
  id: string
  label: string
  fmt: Fmt
  value: number
  prev?: number
  delta?: number
  better?: 'up' | 'down'
  hint?: string
  spark?: number[]
}

export interface TrendResult {
  title: string
  chart: 'line' | 'bar' | 'area'
  fmt: Fmt
  buckets: { key: string; label: string }[]
  series: { id: string; label: string; values: number[] }[]
  stacked: boolean
  granularity: Granularity
}

export interface BreakdownItem {
  key: string
  value: number
}

export interface BreakdownResult {
  title: string
  dim: DimensionDef
  measure: MeasureDef
  chart: 'donut' | 'hbar' | 'bar'
  items: BreakdownItem[]
  total: number
}

export interface GroupRow {
  key: string
  values: number[]
  count: number
}

export interface GroupResult {
  dim: DimensionDef
  measures: MeasureDef[]
  rows: GroupRow[]
  totals: number[]
}

export interface ReportResult {
  def: ReportDef
  src: SourceDef
  config: ReportConfig
  period: Period
  periodApplies: boolean
  rows: Row[]
  detailRows: Row[]
  kpis: KpiResult[]
  trend?: TrendResult
  breakdowns: BreakdownResult[]
  group: GroupResult
  columns: ColumnDef[]
  chips: { label: string; value: string; fixed?: boolean }[]
}

export function defaultConfig(def: ReportDef): ReportConfig {
  return { reportId: def.id, period: def.defaultPeriod ?? 'this_month', filters: {}, groupBy: def.groupBy, view: def.defaultView ?? 'summary' }
}

export function configPeriod(c: ReportConfig): Period {
  return resolvePeriod(c.period, c.from, c.to)
}

/** Status-as-of-today measures: comparing with an earlier period is misleading. */
const NO_DELTA = new Set(['perDay', 'opening', 'closing', 'pending', 'avgPendingAge', 'current', 'outstanding', 'balance', 'openCount', 'overdue', 'overdueCount', 'avgAge', 'over90', 'avgDaysIn'])

const ORDERED_DIMS = new Set(['month', 'hour', 'weekday', 'ageBand', 'agingBucket', 'waitBand', 'losBand', 'delayBand', 'expiryBand', 'utilBand'])

export function periodApplies(def: ReportDef, src: SourceDef) {
  return !def.ignorePeriod && !src.snapshot && (!!src.date || !!src.derive)
}

/** Rows in scope: period + fixed filter + user filters. */
export function scopeRows(db: Db, def: ReportDef, config: ReportConfig, period: Period): Row[] {
  const src = SOURCES[def.source]
  let rows = sourceRows(src, db, period)
  if (periodApplies(def, src) && !src.derive && src.date) {
    const { from, to } = period
    const get = src.date
    rows = rows.filter((r) => {
      const d = get(r).slice(0, 10)
      return d >= from && d <= to
    })
  }
  if (def.where) rows = rows.filter(def.where)
  for (const [dimId, value] of Object.entries(config.filters)) {
    if (!value || value === 'all') continue
    const dim = src.dims.find((d) => d.id === dimId)
    if (dim) rows = rows.filter((r) => dim.get(r) === value)
  }
  return rows
}

function bucketKey(date: string, g: Granularity): string {
  const day = date.slice(0, 10)
  if (g === 'month') return day.slice(0, 7)
  if (g === 'week') {
    const n = dayNum(day)
    return isoDay(n - ((dowOf(n) + 6) % 7))
  }
  return day
}

function bucketsFor(period: Period, g: Granularity): { key: string; label: string }[] {
  const out: { key: string; label: string }[] = []
  const seen = new Set<string>()
  for (let n = dayNum(period.from); n <= dayNum(period.to); n++) {
    const key = bucketKey(isoDay(n), g)
    if (seen.has(key)) continue
    seen.add(key)
    const label = g === 'month' ? fmtMonth(key) : `${g === 'week' ? 'w/c ' : ''}${Number(key.slice(8, 10))} ${['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'][Number(key.slice(5, 7)) - 1]}`
    out.push({ key, label })
  }
  return out
}

function groupBy(rows: Row[], get: (r: Row) => string): Map<string, Row[]> {
  const m = new Map<string, Row[]>()
  for (const r of rows) {
    const k = get(r)
    let arr = m.get(k)
    if (!arr) {
      arr = []
      m.set(k, arr)
    }
    arr.push(r)
  }
  return m
}

const ADDITIVE: Fmt[] = ['number', 'currency']

function orderKeys(dim: DimensionDef, keys: string[], valueOf: (k: string) => number): string[] {
  if (dim.order) {
    const idx = (k: string) => {
      const i = dim.order!.indexOf(k)
      return i < 0 ? 999 : i
    }
    return [...keys].sort((a, b) => idx(a) - idx(b))
  }
  if (ORDERED_DIMS.has(dim.id)) return [...keys].sort()
  return [...keys].sort((a, b) => (valueOf(b) || 0) - (valueOf(a) || 0))
}

export function computeBreakdown(rows: Row[], src: SourceDef, dimId: string, measureId: string, chart: 'donut' | 'hbar' | 'bar', title: string | undefined, period: Period): BreakdownResult | null {
  const dim = src.dims.find((d) => d.id === dimId)
  const measure = src.measures.find((m) => m.id === measureId)
  if (!dim || !measure) return null
  const ctx = { period }
  const groups = groupBy(rows, dim.get)
  const vals = new Map<string, number>()
  for (const [k, rs] of groups) vals.set(k, measure.agg(rs, ctx))
  let keys = orderKeys(dim, [...groups.keys()].filter((k) => k !== '—' || dim.id === 'agingBucket'), (k) => vals.get(k)!)
  if (dim.id === 'agingBucket') keys = keys.filter((k) => k !== '—')
  const limit = chart === 'donut' ? 6 : chart === 'hbar' ? 10 : 24
  let items: BreakdownItem[] = keys.map((k) => ({ key: k, value: vals.get(k)! }))
  if (items.length > limit && !dim.order && !ORDERED_DIMS.has(dim.id)) {
    const head = items.slice(0, limit - 1)
    const restKeys = new Set(keys.slice(limit - 1))
    const restRows = rows.filter((r) => restKeys.has(dim.get(r)))
    items = [...head, { key: `Other (${restKeys.size})`, value: measure.agg(restRows, ctx) }]
  }
  items = items.filter((i) => Number.isFinite(i.value))
  const total = ADDITIVE.includes(measure.fmt) ? items.reduce((a, b) => a + b.value, 0) : measure.agg(rows, ctx)
  return { title: title ?? `${measure.label} by ${dim.label.toLowerCase()}`, dim, measure, chart, items, total }
}

export function runReport(db: Db, config: ReportConfig): ReportResult {
  const def = REPORT_BY_ID[config.reportId]
  const src = SOURCES[def.source]
  const period = configPeriod(config)
  const applies = periodApplies(def, src)
  const rows = scopeRows(db, def, config, period)
  const ctx = { period }

  // KPIs with previous-period comparison
  let prevRows: Row[] | null = null
  if (applies) {
    const prev = previousPeriod(period)
    if (prev.from >= '2025-11-01') prevRows = scopeRows(db, def, config, prev)
  }
  const g: Granularity = src.fixedGranularity ?? granularityFor(period)
  const buckets = applies && src.date ? bucketsFor(period, g) : []
  const byBucket = buckets.length ? groupBy(rows, (r) => bucketKey(src.date!(r), g)) : new Map<string, Row[]>()

  const kpis: KpiResult[] = def.kpis
    .map((id) => src.measures.find((m) => m.id === id))
    .filter((m): m is MeasureDef => !!m)
    .map((m) => {
      const value = m.agg(rows, ctx)
      const prev = prevRows ? m.agg(prevRows, { period: previousPeriod(period) }) : undefined
      const comparable = prev !== undefined && Number.isFinite(prev) && Number.isFinite(value) && !NO_DELTA.has(m.id)
      const delta = comparable ? (m.fmt === 'percent' ? value - prev! : prev ? (value - prev!) / Math.abs(prev!) : undefined) : undefined
      const spark = buckets.length > 2 ? buckets.map((b) => {
        const v = m.agg(byBucket.get(b.key) ?? [], ctx)
        return Number.isFinite(v) ? v : 0
      }) : undefined
      return { id: m.id, label: m.label, fmt: m.fmt, value, prev, delta, better: m.better, hint: m.hint, spark }
    })

  // Trend
  let trend: TrendResult | undefined
  if (def.trend && buckets.length > 1) {
    const measures = def.trend.measures.map((id) => src.measures.find((m) => m.id === id)).filter((m): m is MeasureDef => !!m)
    const splitDim = def.trend.splitBy ? src.dims.find((d) => d.id === def.trend!.splitBy) : undefined
    let series: TrendResult['series'] = []
    if (splitDim && measures[0]) {
      const m = measures[0]
      const groups = groupBy(rows, splitDim.get)
      const ranked = orderKeys(splitDim, [...groups.keys()], (k) => (ADDITIVE.includes(m.fmt) ? m.agg(groups.get(k)!, ctx) : groups.get(k)!.length))
      const top = splitDim.order || ranked.length <= 6 ? ranked : ranked.slice(0, 5)
      const rest = ranked.filter((k) => !top.includes(k))
      const mk = (label: string, rs: Row[]) => {
        const bb = groupBy(rs, (r) => bucketKey(src.date!(r), g))
        return { id: label, label, values: buckets.map((b) => m.agg(bb.get(b.key) ?? [], ctx)) }
      }
      series = top.map((k) => mk(k, groups.get(k)!))
      if (rest.length && ADDITIVE.includes(m.fmt)) series.push(mk(`Other (${rest.length})`, rest.flatMap((k) => groups.get(k)!)))
    } else {
      series = measures.map((m) => ({ id: m.id, label: m.label, values: buckets.map((b) => m.agg(byBucket.get(b.key) ?? [], ctx)) }))
    }
    const fmt = measures[0]?.fmt ?? 'number'
    const chart = def.trend.chart ?? 'line'
    trend = {
      title: def.trend.title ?? (splitDim ? `${measures[0]?.label} by ${splitDim.label.toLowerCase()}` : measures.map((m) => m.label).join(' vs ')),
      chart,
      fmt,
      buckets,
      series: series.map((s) => ({ ...s, values: s.values.map((v) => (Number.isFinite(v) ? v : 0)) })),
      stacked: !!splitDim && chart === 'bar' && ADDITIVE.includes(fmt),
      granularity: g,
    }
  }

  const breakdowns = (def.breakdowns ?? []).map((b) => computeBreakdown(rows, src, b.dim, b.measure, b.chart, b.title, period)).filter((b): b is BreakdownResult => !!b)

  // Grouped summary
  const gDim = src.dims.find((d) => d.id === (config.groupBy || def.groupBy)) ?? src.dims[0]
  const gMeasures = (def.groupMeasures ?? def.kpis).map((id) => src.measures.find((m) => m.id === id)).filter((m): m is MeasureDef => !!m)
  const gMap = groupBy(rows, gDim.get)
  const gRowsUnsorted = [...gMap.entries()].map(([key, rs]) => ({ key, values: gMeasures.map((m) => m.agg(rs, ctx)), count: rs.length }))
  const valOf = new Map(gRowsUnsorted.map((r) => [r.key, r.values[0]]))
  const order = orderKeys(gDim, [...gMap.keys()], (k) => valOf.get(k)!)
  const gRows = order.map((k) => gRowsUnsorted.find((r) => r.key === k)!)
  const group: GroupResult = { dim: gDim, measures: gMeasures, rows: gRows, totals: gMeasures.map((m) => m.agg(rows, ctx)) }

  // Detail rows
  let detailRows = def.detailWhere ? rows.filter(def.detailWhere) : rows
  if (src.date && !src.derive) {
    const get = src.date
    detailRows = [...detailRows].sort((a, b) => get(b).localeCompare(get(a)))
  }
  const colIds = def.columns ?? src.defaultColumns
  const columns = colIds.map((id) => src.columns.find((c) => c.id === id)).filter((c): c is ColumnDef => !!c)

  const chips: ReportResult['chips'] = []
  chips.push({ label: 'Period', value: applies ? periodLabel(period) : 'As at 27 Oct 2026, 13:45 (snapshot)' })
  if (def.whereLabel) chips.push({ label: 'Scope', value: def.whereLabel, fixed: true })
  for (const [dimId, value] of Object.entries(config.filters)) {
    if (!value || value === 'all') continue
    const dim = src.dims.find((d) => d.id === dimId)
    if (dim) chips.push({ label: dim.label, value })
  }

  return { def, src, config, period, periodApplies: applies, rows, detailRows, kpis, trend, breakdowns, group, columns, chips }
}

/** Distinct values for a filter dimension (cached). */
const optionCache = new Map<string, string[]>()
export function filterOptions(db: Db, src: SourceDef, dimId: string): string[] {
  const key = `${src.id}|${dimId}`
  const hit = optionCache.get(key)
  if (hit) return hit
  const dim = src.dims.find((d) => d.id === dimId)
  if (!dim) return []
  const rows = sourceRows(src, db, resolvePeriod('last12'))
  const vals = [...new Set(rows.map(dim.get))].filter((v) => v && v !== '—')
  const sorted = dim.order ? dim.order.filter((o) => vals.includes(o)) : vals.sort((a, b) => a.localeCompare(b))
  optionCache.set(key, sorted)
  return sorted
}

/** Single measure for the overview dashboard. */
export function measure(db: Db, sourceId: string, measureId: string, period: Period, filters: Record<string, string> = {}, where?: (r: Row) => boolean): number {
  const src = SOURCES[sourceId]
  const fake: ReportDef = { id: '_', name: '', module: 'billing', type: 'Summary', source: sourceId, description: '', kpis: [], where }
  const rows = scopeRows(db, fake, { reportId: '_', period: period.preset, from: period.from, to: period.to, filters, view: 'summary' }, period)
  return src.measures.find((m) => m.id === measureId)!.agg(rows, { period })
}

export { periodLabel }
