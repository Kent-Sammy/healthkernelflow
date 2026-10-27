import { useEffect, useMemo, useRef, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { AlertTriangle, Bookmark, CalendarClock, CheckCircle2, ChevronDown, ChevronRight, Columns3, Download, Info, Pencil, Printer, RefreshCw, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useUiStore } from '@/state/uiStore'
import { useDb } from '../data/useDb'
import { MODULE_BY_ID, REPORT_BY_ID } from '../engine/catalogue'
import { runReport, filterOptions, type BreakdownResult, type ReportResult } from '../engine/run'
import { configKey, configToSearch, searchToConfig } from '../engine/url'
import { PERIOD_OPTIONS, type PeriodPreset } from '../engine/period'
import { csvValue, fmtDateTime, formatValue } from '../engine/format'
import { downloadCsv, slug } from '../engine/csv'
import { AGING_ORDER } from '../engine/dates'
import type { ColumnDef, Row } from '../engine/sources'
import { CURRENT_USER, demoNow, useReportsStore } from '../state/reportsStore'
import { Drawer, HkButton, KpiCard, ModuleIcon, NativeSelect, Panel, Pill, Segmented, Skeleton, StatusBadge, TypeBadge, DemoNotice } from '../components/ui'
import { DataTable, type TableColumn } from '../components/DataTable'
import { LineChart } from '../components/charts/LineChart'
import { BarChart } from '../components/charts/BarChart'
import { Donut } from '../components/charts/Donut'
import { HBarList } from '../components/charts/HBarList'
import { SaveReportDialog, ScheduleDialog } from '../components/ReportDialogs'

export function ReportViewPage() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const config = useMemo(() => searchToConfig(params), [params])
  const key = config ? configKey(config) : ''
  const [result, setResult] = useState<ReportResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [generatedAt, setGeneratedAt] = useState(demoNow())
  const logGeneration = useReportsStore((s) => s.logGeneration)
  const configRef = useRef(config)
  configRef.current = config

  useEffect(() => {
    if (!configRef.current) return
    setLoading(true)
    const t = setTimeout(() => {
      const c = configRef.current!
      const r = runReport(db, c)
      setResult(r)
      setGeneratedAt(demoNow())
      setLoading(false)
      logGeneration(c, r.rows.length)
    }, 480)
    return () => clearTimeout(t)
  }, [key, db, logGeneration])

  if (!config) {
    return (
      <div className="flex flex-col items-center gap-4 py-24 text-center">
        <p className="text-[18px] font-semibold">Report not found</p>
        <p className="max-w-md text-neutral-500">The link may be incomplete. Choose a report from the catalogue to generate it.</p>
        <HkButton variant="primary" onClick={() => navigate('/reports/catalogue')}>
          Browse all reports
        </HkButton>
      </div>
    )
  }

  const def = REPORT_BY_ID[config.reportId]
  const update = (patch: Partial<typeof config>) => setParams(configToSearch({ ...config, ...patch }).slice(1), { replace: false })
  const view = config.view

  return (
    <div className="flex flex-col gap-5">
      <ReportHeader result={loading ? null : result} config={config} def={def} generatedAt={generatedAt} onPeriod={(p) => update({ period: p })} onFilter={(k, v) => update({ filters: { ...config.filters, [k]: v } })} />
      {loading || !result || result.def.id !== def.id ? (
        <LoadingBody />
      ) : (
        <ReportBody result={result} view={view} onView={(v) => setParams(configToSearch({ ...config, view: v }).slice(1), { replace: true })} onGroupBy={(g) => update({ groupBy: g })} onDrill={(dim, value) => update({ filters: { ...config.filters, [dim]: value }, view: 'detailed' })} />
      )}
    </div>
  )
}

function plural(s: string) {
  if (s.endsWith('y') && !s.endsWith('ay')) return `${s.slice(0, -1)}ies`
  if (s.endsWith('s')) return s
  return `${s}s`
}

function LoadingBody() {
  return (
    <div className="flex flex-col gap-5" aria-busy="true" aria-label="Generating report">
      <div className="flex items-center gap-2 text-[13px] text-brand-700">
        <RefreshCw className="size-4 animate-spin" /> Generating report from the demonstration dataset…
      </div>
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-[104px]" />
        ))}
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Skeleton className="h-[320px] lg:col-span-2" />
        <Skeleton className="h-[320px]" />
      </div>
      <Skeleton className="h-[360px]" />
    </div>
  )
}

function ReportHeader({ result, config, def, generatedAt, onPeriod, onFilter }: { result: ReportResult | null; config: NonNullable<ReturnType<typeof searchToConfig>>; def: (typeof REPORT_BY_ID)[string]; generatedAt: string; onPeriod: (p: PeriodPreset) => void; onFilter: (k: string, v: string) => void }) {
  const db = useDb()
  const navigate = useNavigate()
  const [saveOpen, setSaveOpen] = useState(false)
  const [schedOpen, setSchedOpen] = useState(false)
  const [exportOpen, setExportOpen] = useState(false)
  const logAudit = useReportsStore((s) => s.logAudit)
  const toast = useUiStore((s) => s.showToast)
  const mod = MODULE_BY_ID[def.module]
  const src = result?.src
  const quickFilters = src ? src.filters.filter((f) => ['facility', 'department', 'hmo', 'payerType', 'category', 'integration', 'ward', 'method', 'kind'].includes(f)).slice(0, 2) : []

  const exportCsv = (which: 'detailed' | 'summary') => {
    if (!result) return
    setExportOpen(false)
    const base = `${slug(def.name)}_${result.period.from}_${result.period.to}`
    if (which === 'detailed') {
      downloadCsv(`${base}_records`, result.columns.map((c) => c.label), result.detailRows.map((r) => result.columns.map((c) => csvValue(c.get(r), c.fmt))))
    } else {
      const g = result.group
      downloadCsv(`${base}_summary_by_${slug(g.dim.label)}`, [g.dim.label, ...g.measures.map((m) => m.label), 'Records'], [...g.rows.map((r) => [r.key, ...r.values.map((v, i) => (Number.isFinite(v) ? csvValue(v, g.measures[i].fmt) : '')), r.count]), ['Total', ...g.totals.map((v, i) => (Number.isFinite(v) ? csvValue(v, g.measures[i].fmt) : '')), result.rows.length]])
    }
    const n = which === 'detailed' ? result.detailRows.length : result.group.rows.length
    logAudit({ action: 'Report exported (CSV)', category: 'Export', target: def.name, details: `${n.toLocaleString()} ${which === 'detailed' ? 'records' : 'summary rows'} exported` })
    toast({ title: 'CSV exported', description: `${n.toLocaleString()} rows downloaded.`, variant: 'success' })
  }

  return (
    <>
      <nav className="flex items-center gap-1.5 text-[12.5px] text-neutral-500 print:hidden" aria-label="Breadcrumb">
        <Link to="/reports/catalogue" className="hover:text-brand-700">
          All Reports
        </Link>
        <ChevronRight className="size-3.5" />
        <Link to={`/reports/catalogue?module=${def.module}`} className="hover:text-brand-700">
          {mod.label}
        </Link>
        <ChevronRight className="size-3.5" />
        <span className="text-neutral-700">{def.name}</span>
      </nav>

      <Panel bodyClassName="p-0">
        <div className="flex flex-col gap-5 p-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <ModuleIcon module={def.module} size="lg" />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-[21px] font-bold tracking-tight text-neutral-900">{def.name}</h1>
                <TypeBadge type={def.type} />
                <Pill>{mod.label}</Pill>
              </div>
              <p className="mt-1 max-w-3xl text-[13.5px] text-neutral-500">{def.description}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 print:hidden">
            <HkButton size="sm" variant="ghost" onClick={() => navigate(`/reports/builder${configToSearch(config)}`)}>
              <Pencil /> Edit configuration
            </HkButton>
            <HkButton size="sm" variant="ghost" onClick={() => setSaveOpen(true)}>
              <Bookmark /> Save
            </HkButton>
            <HkButton size="sm" variant="ghost" onClick={() => setSchedOpen(true)}>
              <CalendarClock /> Schedule
            </HkButton>
            <HkButton
              size="sm"
              variant="ghost"
              onClick={() => {
                logAudit({ action: 'Report printed', category: 'Export', target: def.name, details: 'Print layout opened' })
                window.print()
              }}
            >
              <Printer /> Print
            </HkButton>
            <div className="relative">
              <HkButton size="sm" variant="primary" disabled={!result} onClick={() => setExportOpen((o) => !o)} aria-expanded={exportOpen}>
                <Download /> Export CSV <ChevronDown />
              </HkButton>
              {exportOpen && result && (
                <>
                  <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="Close" onClick={() => setExportOpen(false)} />
                  <div className="absolute right-0 top-10 z-40 w-72 rounded-xl border border-neutral-200 bg-white p-1.5 shadow-xl">
                    <button type="button" onClick={() => exportCsv('detailed')} className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-[#f3faf9]">
                      <span className="text-[13px] font-semibold">Detailed records</span>
                      <span className="text-[12px] text-neutral-500">{result.detailRows.length.toLocaleString()} rows · {result.columns.length} columns</span>
                    </button>
                    <button type="button" onClick={() => exportCsv('summary')} className="flex w-full flex-col rounded-lg px-3 py-2 text-left hover:bg-[#f3faf9]">
                      <span className="text-[13px] font-semibold">Summary by {result.group.dim.label.toLowerCase()}</span>
                      <span className="text-[12px] text-neutral-500">{result.group.rows.length.toLocaleString()} rows + total</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
        <dl className="grid grid-cols-2 gap-px border-t border-[#e3eeec] bg-[#e3eeec] md:grid-cols-5">
          {[
            ['Reporting period', result ? result.chips[0].value : '…'],
            ['Generated', fmtDateTime(generatedAt)],
            ['Generated by', CURRENT_USER.name],
            ['Records in scope', result ? result.rows.length.toLocaleString() : '…'],
            ['Data source', result ? `${result.src.label}` : '…'],
          ].map(([k, v]) => (
            <div key={k} className="bg-[#fafdfc] px-5 py-3">
              <dt className="text-[11.5px] font-medium uppercase tracking-wide text-neutral-400">{k}</dt>
              <dd className="mt-0.5 truncate text-[13px] font-medium text-neutral-800" title={v}>
                {v}
              </dd>
            </div>
          ))}
        </dl>
        <div className="flex flex-wrap items-center gap-2 border-t border-[#e3eeec] px-5 py-3 print:hidden">
          <span className="mr-1 text-[12.5px] font-medium text-neutral-500">Adjust &amp; regenerate:</span>
          {(!result || result.periodApplies) && (
            <select value={config.period} onChange={(e) => onPeriod(e.target.value as PeriodPreset)} className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-[12.5px]" aria-label="Reporting period">
              {PERIOD_OPTIONS.filter((p) => p.value !== 'custom' || config.period === 'custom').map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          )}
          {src &&
            quickFilters.map((f) => {
              const dim = src.dims.find((d) => d.id === f)!
              return (
                <select key={f} value={config.filters[f] ?? 'all'} onChange={(e) => onFilter(f, e.target.value)} className="h-8 max-w-[220px] rounded-md border border-neutral-300 bg-white px-2 text-[12.5px]" aria-label={dim.label}>
                  <option value="all">All {plural(dim.label.toLowerCase())}</option>
                  {filterOptions(db, src, f).map((o) => (
                    <option key={o} value={o}>
                      {o}
                    </option>
                  ))}
                </select>
              )
            })}
          {result?.chips.slice(1).map((c) => (
            <span key={c.label + c.value} className={cn('inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[12px]', c.fixed ? 'bg-neutral-100 text-neutral-600' : 'bg-[#e6f4f2] text-brand-800')}>
              <span className="font-medium">{c.label}:</span> {c.value}
              {!c.fixed && (
                <button type="button" onClick={() => onFilter(Object.keys(config.filters).find((k) => config.filters[k] === c.value) ?? '', 'all')} className="ml-0.5 rounded-full p-0.5 hover:bg-brand-100" aria-label={`Remove ${c.label} filter`}>
                  <X className="size-3" />
                </button>
              )}
            </span>
          ))}
          <Link to={`/reports/builder${configToSearch(config)}`} className="ml-auto text-[12.5px] font-medium text-brand-700 hover:underline">
            All filters &amp; options →
          </Link>
        </div>
      </Panel>
      <SaveReportDialog open={saveOpen} onOpenChange={setSaveOpen} config={config} />
      <ScheduleDialog open={schedOpen} onOpenChange={setSchedOpen} config={config} />
    </>
  )
}

function ReportBody({ result, view, onView, onGroupBy, onDrill }: { result: ReportResult; view: 'summary' | 'detailed'; onView: (v: 'summary' | 'detailed') => void; onGroupBy: (g: string) => void; onDrill: (dim: string, value: string) => void }) {
  const { def, src } = result
  const drillable = (dim: string) => src.filters.includes(dim)
  const drill = (dim: string) => (drillable(dim) ? (key: string) => !key.startsWith('Other') && onDrill(dim, key) : undefined)
  const type = def.type
  const compactKpis = type === 'Register'

  return (
    <div className="flex flex-col gap-5">
      {type === 'Exception' && <ExceptionBanner result={result} />}
      {(type === 'Snapshot' || !result.periodApplies) && (
        <div className="flex items-center gap-2 rounded-xl border border-info-200 bg-info-50 px-4 py-3 text-[13px] text-info-700">
          <Info className="size-4 shrink-0" /> Snapshot report — shows positions as at 27 Oct 2026, 13:45. The reporting period does not apply.
        </div>
      )}

      <div className={cn('grid grid-cols-2 gap-3.5', result.kpis.length <= 4 ? 'md:grid-cols-4' : result.kpis.length === 5 ? 'md:grid-cols-3 xl:grid-cols-5' : 'md:grid-cols-3 xl:grid-cols-6')}>
        {result.kpis.map((k) => (
          <KpiCard key={k.id} label={k.label} value={k.value} fmt={k.fmt} delta={k.delta} better={k.better} hint={k.hint} spark={compactKpis ? undefined : k.spark} compact={compactKpis} />
        ))}
      </div>

      {type === 'Aging' && <AgingStrip result={result} />}
      {type === 'Reconciliation' && <ReconciliationStatement result={result} />}
      {type === 'Comparison' && <ComparisonPanel key={result.def.id + result.group.dim.id} result={result} onDrill={drill(result.group.dim.id)} />}

      <ChartsArea result={result} drill={drill} />

      <Panel
        title={
          <div className="flex flex-wrap items-center gap-3">
            <Segmented
              value={view}
              onChange={onView}
              options={[
                { value: 'summary', label: `Summary by ${result.group.dim.label.toLowerCase()}` },
                { value: 'detailed', label: `Detailed records (${result.detailRows.length.toLocaleString()})` },
              ]}
            />
          </div>
        }
        actions={
          view === 'summary' ? (
            <NativeSelect value={result.group.dim.id} onChange={(e) => onGroupBy(e.target.value)} options={src.dims.map((d) => ({ value: d.id, label: `Group by: ${d.label}` }))} aria-label="Group by" />
          ) : undefined
        }
      >
        {view === 'summary' ? <GroupTable result={result} onDrill={drill(result.group.dim.id)} onShowRecords={() => onView('detailed')} /> : <DetailTable key={result.def.id} result={result} />}
      </Panel>

      <div className="flex flex-wrap items-center justify-between gap-2 text-[12px] text-neutral-400">
        <DemoNotice />
        <span>
          Report ID {def.id} · All figures computed in the browser from the shared demonstration dataset · Period comparisons use the immediately preceding period of equal length.
        </span>
      </div>
    </div>
  )
}

function ChartsArea({ result, drill }: { result: ReportResult; drill: (dim: string) => ((key: string) => void) | undefined }) {
  const { trend, breakdowns, def } = result
  if (!trend && breakdowns.length === 0) return null
  if (!trend)
    return (
      <div className={cn('grid gap-5', breakdowns.length === 2 ? 'lg:grid-cols-2' : breakdowns.length >= 3 ? 'lg:grid-cols-2 2xl:grid-cols-3' : '')}>
        {breakdowns.map((b, i) => (
          <BreakdownPanel key={i} b={b} onClick={drill(b.dim.id)} />
        ))}
      </div>
    )
  const [first, ...rest] = breakdowns
  return (
    <div className="flex flex-col gap-5">
      {(trend || first) && (
        <div className={cn('grid gap-5', trend && first ? 'lg:grid-cols-3' : '')}>
          {trend && (
            <Panel title={trend.title} subtitle={`By ${trend.granularity}${trend.stacked ? ' · stacked' : ''} · hover for values`} className={first ? 'lg:col-span-2' : ''}>
              {trend.chart === 'bar' ? (
                <BarChart labels={trend.buckets.map((b) => b.label)} series={trend.series} fmt={trend.fmt} stacked={trend.stacked} height={def.type === 'Register' ? 200 : 250} />
              ) : (
                <LineChart labels={trend.buckets.map((b) => b.label)} series={trend.series} fmt={trend.fmt} area={trend.series.length === 1} height={def.type === 'Register' ? 200 : 250} />
              )}
            </Panel>
          )}
          {first && <BreakdownPanel b={first} onClick={drill(first.dim.id)} />}
        </div>
      )}
      {rest.length > 0 && (
        <div className={cn('grid gap-5', rest.length >= 2 ? 'lg:grid-cols-2' : '')}>
          {rest.map((b, i) => (
            <BreakdownPanel key={i} b={b} onClick={drill(b.dim.id)} />
          ))}
        </div>
      )}
    </div>
  )
}

function BreakdownPanel({ b, onClick }: { b: BreakdownResult; onClick?: (key: string) => void }) {
  return (
    <Panel title={b.title} subtitle={onClick ? 'Click an item to filter the report' : undefined}>
      {b.items.length === 0 ? (
        <p className="py-10 text-center text-[13px] text-neutral-500">No data for this selection.</p>
      ) : b.chart === 'donut' ? (
        <Donut items={b.items} fmt={b.measure.fmt} centerLabel={b.measure.label} onSliceClick={onClick} />
      ) : b.chart === 'hbar' ? (
        <HBarList items={b.items} fmt={b.measure.fmt} onClick={onClick} />
      ) : (
        <BarChart labels={b.items.map((i) => i.key)} series={[{ id: b.measure.id, label: b.measure.label, values: b.items.map((i) => i.value) }]} fmt={b.measure.fmt} height={230} onBarClick={onClick ? (i) => onClick(b.items[i].key) : undefined} />
      )}
    </Panel>
  )
}

function GroupTable({ result, onDrill, onShowRecords }: { result: ReportResult; onDrill?: (key: string) => void; onShowRecords: () => void }) {
  const g = result.group
  const additive = g.measures[0] && ['number', 'currency'].includes(g.measures[0].fmt)
  const isComparison = result.def.type === 'Comparison'
  const extremes = g.measures.map((m, i) => {
    const vals = g.rows.map((r) => r.values[i]).filter(Number.isFinite)
    return { max: Math.max(...vals), min: Math.min(...vals), better: m.better }
  })
  type GR = (typeof g.rows)[number]
  const columns: TableColumn<GR>[] = [
    { id: 'key', label: g.dim.label, get: (r) => r.key, render: (r) => <span className="font-medium text-neutral-900">{r.key}</span> },
    ...g.measures.map((m, i) => ({
      id: m.id,
      label: m.label,
      fmt: m.fmt,
      get: (r: GR) => r.values[i],
      render: (r: GR) => {
        const v = r.values[i]
        const e = extremes[i]
        const best = isComparison && e.better && g.rows.length > 2 && v === (e.better === 'up' ? e.max : e.min)
        const worst = isComparison && e.better && g.rows.length > 2 && v === (e.better === 'up' ? e.min : e.max)
        return <span className={cn(best && 'font-semibold text-success-700', worst && 'font-semibold text-danger-700')}>{formatValue(v, m.fmt)}</span>
      },
    })),
    ...(additive && result.group.totals[0] ? [{ id: '_share', label: 'Share', fmt: 'percent' as const, get: (r: GR) => r.values[0] / g.totals[0] }] : []),
    { id: '_count', label: 'Records', fmt: 'number' as const, get: (r: GR) => r.count },
  ]
  return (
    <DataTable
      columns={columns}
      rows={g.rows}
      rowKey={(r) => r.key}
      onRowClick={onDrill ? (r) => onDrill(r.key) : undefined}
      searchable={g.rows.length > 12}
      searchPlaceholder={`Search ${g.dim.label.toLowerCase()}…`}
      dense
      footer={
        <>
          {isComparison && <span className="text-neutral-400">Green = best, red = weakest per measure.</span>}
          {onDrill && <span className="text-neutral-400">Click a row to filter.</span>}
          <button type="button" className="font-medium text-brand-700 hover:underline" onClick={onShowRecords}>
            View underlying records →
          </button>
        </>
      }
      totalsRow={
        <tr className="border-t-2 border-[#cfe6e2] bg-[#f3faf9] font-semibold">
          <td className="px-4 py-2.5 text-[13px]">Total</td>
          {g.totals.map((v, i) => (
            <td key={i} className="px-4 py-2.5 text-right text-[13px] tabular-nums">
              {formatValue(v, g.measures[i].fmt)}
            </td>
          ))}
          {additive && g.totals[0] ? <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">100.0%</td> : null}
          <td className="px-4 py-2.5 text-right text-[13px] tabular-nums">{result.rows.length.toLocaleString()}</td>
        </tr>
      }
    />
  )
}

function DetailTable({ result }: { result: ReportResult }) {
  const [visible, setVisible] = useState<string[]>(result.columns.map((c) => c.id))
  const [picker, setPicker] = useState(false)
  const [selected, setSelected] = useState<Row | null>(null)
  const cols = visible.map((id) => result.src.columns.find((c) => c.id === id)).filter((c): c is ColumnDef => !!c)
  const tableCols: TableColumn<Row>[] = cols.map((c) => ({ id: c.id, label: c.label, fmt: c.fmt, get: c.get }))
  const dateCol = cols.find((c) => c.fmt === 'datetime' || c.fmt === 'date')

  return (
    <>
      {result.def.detailWhereLabel && (
        <p className="mb-3 flex items-center gap-2 text-[12.5px] text-warning-700">
          <AlertTriangle className="size-3.5" /> {result.def.detailWhereLabel}
        </p>
      )}
      <DataTable
        columns={tableCols}
        rows={result.detailRows}
        rowKey={(r, i) => String(r.id ?? r.key ?? r.accountId ?? i) + i}
        onRowClick={setSelected}
        initialSort={result.def.detailSort ? { id: result.def.detailSort.col, dir: result.def.detailSort.dir } : dateCol ? { id: dateCol.id, dir: 'desc' } : undefined}
        toolbar={
          <div className="relative">
            <HkButton size="md" variant="outline" onClick={() => setPicker((p) => !p)} aria-expanded={picker}>
              <Columns3 /> Columns ({cols.length})
            </HkButton>
            {picker && (
              <>
                <button type="button" className="fixed inset-0 z-30 cursor-default" aria-label="Close" onClick={() => setPicker(false)} />
                <div className="absolute right-0 top-11 z-40 max-h-80 w-64 overflow-y-auto rounded-xl border border-neutral-200 bg-white p-2 shadow-xl">
                  {result.src.columns.map((c) => (
                    <label key={c.id} className="flex cursor-pointer items-center gap-2 rounded-md px-2 py-1.5 text-[13px] hover:bg-[#f3faf9]">
                      <input
                        type="checkbox"
                        className="accent-brand-600"
                        checked={visible.includes(c.id)}
                        onChange={(e) => setVisible((v) => (e.target.checked ? result.src.columns.map((x) => x.id).filter((id) => v.includes(id) || id === c.id) : v.filter((x) => x !== c.id)))}
                      />
                      {c.label}
                    </label>
                  ))}
                </div>
              </>
            )}
          </div>
        }
      />
      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title="Record details" subtitle={selected ? String(selected.id ?? selected.item ?? selected.key ?? '') : ''}>
        {selected && (
          <dl className="grid grid-cols-[minmax(0,40%)_1fr] gap-x-4 gap-y-2.5 text-[13px]">
            {result.src.columns.map((c) => (
              <div key={c.id} className="contents">
                <dt className="text-neutral-500">{c.label}</dt>
                <dd className="font-medium text-neutral-900">{c.fmt === 'status' ? <StatusBadge value={String(c.get(selected) ?? '—')} /> : formatValue(c.get(selected), c.fmt ?? 'text')}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>
    </>
  )
}

function ExceptionBanner({ result }: { result: ReportResult }) {
  const n = result.detailRows.length
  return (
    <div className={cn('flex items-start gap-3 rounded-xl border px-4 py-3', n ? 'border-warning-200 bg-warning-50 text-warning-700' : 'border-success-200 bg-success-50 text-success-700')}>
      {n ? <AlertTriangle className="mt-0.5 size-5 shrink-0" /> : <CheckCircle2 className="mt-0.5 size-5 shrink-0" />}
      <div>
        <p className="text-[14px] font-semibold">{n ? `${n.toLocaleString()} item${n === 1 ? '' : 's'} need attention` : 'No exceptions for this selection'}</p>
        <p className="text-[12.5px] opacity-90">{result.def.detailWhereLabel ?? result.def.whereLabel ?? 'Exception list'} · open the detailed records to work through them.</p>
      </div>
    </div>
  )
}

function AgingStrip({ result }: { result: ReportResult }) {
  const b = result.breakdowns.find((x) => x.dim.id === 'agingBucket')
  if (!b) return null
  const total = b.items.reduce((a, i) => a + i.value, 0)
  const tones = ['#0f9488', '#eda100', '#eb6834', '#e34948']
  return (
    <Panel title="Aging profile" subtitle={`${b.measure.label} by age since ${result.src.dateLabel?.toLowerCase() ?? 'date'}`}>
      <div className="mb-4 flex h-3 overflow-hidden rounded-full bg-neutral-100">
        {AGING_ORDER.map((k, i) => {
          const v = b.items.find((x) => x.key === k)?.value ?? 0
          return <span key={k} style={{ width: `${total ? (v / total) * 100 : 0}%`, background: tones[i] }} className="h-full border-r-2 border-white last:border-r-0" title={`${k}: ${formatValue(v, b.measure.fmt)}`} />
        })}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {AGING_ORDER.map((k, i) => {
          const v = b.items.find((x) => x.key === k)?.value ?? 0
          return (
            <div key={k} className="rounded-lg border border-[#e3eeec] p-3">
              <div className="flex items-center gap-2 text-[12.5px] text-neutral-500">
                <span className="size-2.5 rounded-sm" style={{ background: tones[i] }} /> {k}
              </div>
              <div className="mt-1 text-[18px] font-bold tabular-nums">{formatValue(v, b.measure.fmt, b.measure.fmt === 'currency')}</div>
              <div className="text-[12px] text-neutral-500">{total ? ((v / total) * 100).toFixed(1) : '0.0'}% of total</div>
            </div>
          )
        })}
      </div>
    </Panel>
  )
}

function ReconciliationStatement({ result }: { result: ReportResult }) {
  const k = (id: string) => result.kpis.find((x) => x.id === id)?.value ?? result.src.measures.find((m) => m.id === id)?.agg(result.rows, { period: result.period }) ?? NaN
  let lines: { label: string; value: number; op?: '+' | '−' | '='; fmt: 'currency' | 'number' }[] = []
  let check: { ok: boolean; text: string } | null = null
  if (result.src.id === 'creditRecon') {
    const adj = result.rows.reduce((a: number, r: Row) => a + r.adjusted, 0)
    lines = [
      { label: 'Opening balance', value: k('opening'), fmt: 'currency' },
      { label: 'Credits issued', value: k('issued'), op: '+', fmt: 'currency' },
      { label: 'Net adjustments', value: adj, op: '+', fmt: 'currency' },
      { label: 'Credits utilized', value: k('utilized'), op: '−', fmt: 'currency' },
      { label: 'Credits reversed', value: k('reversed'), op: '−', fmt: 'currency' },
      { label: 'Closing balance', value: k('closing'), op: '=', fmt: 'currency' },
    ]
    const v = k('variance')
    check = { ok: Math.abs(v) < 1, text: Math.abs(v) < 1 ? 'Ledger balances — no unexplained variance' : `Unexplained variance ${formatValue(v, 'currency')}` }
  } else if (result.src.id === 'payments') {
    const pending = result.rows.filter((r: Row) => r.reconciliation === 'Pending review').reduce((a: number, r: Row) => a + r.amount, 0)
    lines = [
      { label: 'Receipts matched to invoices', value: k('matched'), fmt: 'currency' },
      { label: 'Pending review', value: pending, op: '+', fmt: 'currency' },
      { label: 'Unmatched (unallocated)', value: k('unmatched'), op: '+', fmt: 'currency' },
      { label: 'Total collections', value: k('collected'), op: '=', fmt: 'currency' },
    ]
    check = { ok: k('unmatched') === 0, text: k('unmatched') === 0 ? 'All receipts allocated' : `${formatValue(k('unmatched'), 'currency')} awaiting allocation` }
  } else if (result.src.id === 'stockRecon') {
    const sum = (f: string) => result.rows.reduce((a: number, r: Row) => a + r[f], 0)
    lines = [
      { label: 'Opening units', value: sum('opening'), fmt: 'number' },
      { label: 'Received + transfers in + returns', value: sum('received') + sum('transferIn') + sum('returned'), op: '+', fmt: 'number' },
      { label: 'Count adjustments (net)', value: sum('adjustments'), op: '+', fmt: 'number' },
      { label: 'Consumed + transfers out + wastage', value: sum('consumed') + sum('transferOut') + sum('wastage'), op: '−', fmt: 'number' },
      { label: 'Closing units (book)', value: sum('closing'), op: '=', fmt: 'number' },
    ]
    const bal = result.rows.filter((r: Row) => r.variance === 0).length
    check = { ok: bal === result.rows.length, text: `${bal.toLocaleString()} of ${result.rows.length.toLocaleString()} item lines balance` }
  } else if (result.src.id === 'claims') {
    lines = [
      { label: 'Approved value', value: k('approved'), fmt: 'currency' },
      { label: 'Remitted by HMOs', value: k('paid'), op: '−', fmt: 'currency' },
      { label: 'Awaiting remittance', value: result.rows.reduce((a: number, r: Row) => a + (r.status !== 'Paid' && r.status !== 'Rejected' ? r.approved : 0), 0), op: '=', fmt: 'currency' },
    ]
    check = { ok: true, text: 'Remittances matched to approved claims' }
  } else if (result.src.id === 'integrations') {
    lines = [
      { label: 'Reconciliation runs', value: result.rows.length, fmt: 'number' },
      { label: 'Balanced', value: k('balanced'), op: '−', fmt: 'number' },
      { label: 'Runs with variances', value: k('variances'), op: '=', fmt: 'number' },
    ]
    check = { ok: k('variances') === 0, text: k('variances') === 0 ? 'All runs balanced' : `${k('variances')} runs need investigation` }
  }
  if (!lines.length) return null
  return (
    <Panel title="Reconciliation statement" subtitle="Movements for the selected period and filters">
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_280px]">
        <table className="w-full text-[13.5px]">
          <tbody>
            {lines.map((l) => (
              <tr key={l.label} className={cn('border-b border-[#edf3f2]', l.op === '=' && 'border-b-0 border-t-2 border-t-neutral-300 font-semibold')}>
                <td className="w-8 py-2 text-center text-neutral-400">{l.op}</td>
                <td className="py-2">{l.label}</td>
                <td className="py-2 text-right tabular-nums">{formatValue(l.value, l.fmt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {check && (
          <div className={cn('flex items-start gap-3 self-start rounded-xl border p-4', check.ok ? 'border-success-200 bg-success-50 text-success-700' : 'border-warning-200 bg-warning-50 text-warning-700')}>
            {check.ok ? <CheckCircle2 className="size-5 shrink-0" /> : <AlertTriangle className="size-5 shrink-0" />}
            <div>
              <p className="text-[13.5px] font-semibold">{check.ok ? 'Reconciled' : 'Needs attention'}</p>
              <p className="text-[12.5px]">{check.text}</p>
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}

function ComparisonPanel({ result, onDrill }: { result: ReportResult; onDrill?: (key: string) => void }) {
  const g = result.group
  const [mi, setMi] = useState(0)
  if (g.rows.length < 2) return null
  const m = g.measures[mi]
  const items = g.rows.map((r) => ({ key: r.key, value: r.values[mi] })).filter((i) => Number.isFinite(i.value))
  const sorted = [...items].sort((a, b) => b.value - a.value)
  const best = m.better === 'down' ? sorted[sorted.length - 1] : sorted[0]
  const worst = m.better === 'down' ? sorted[0] : sorted[sorted.length - 1]
  return (
    <Panel title={`Compare ${plural(g.dim.label.toLowerCase())}`} subtitle="Choose a measure to rank">
      <div className="mb-4 flex flex-wrap gap-1.5">
        {g.measures.map((x, i) => (
          <button key={x.id} type="button" onClick={() => setMi(i)} className={cn('rounded-full border px-3 py-1 text-[12.5px] font-medium transition', i === mi ? 'border-brand-600 bg-brand-600 text-white' : 'border-neutral-300 bg-white text-neutral-700 hover:border-brand-400')}>
            {x.label}
          </button>
        ))}
      </div>
      <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_260px]">
        <HBarList items={sorted} fmt={m.fmt} onClick={onDrill} highlight={(k) => (m.better && sorted.length > 2 ? (k === best?.key ? 'good' : k === worst?.key ? 'bad' : undefined) : undefined)} />
        {m.better && best && worst && (
          <div className="flex flex-col gap-3 text-[13px]">
            <div className="rounded-lg border border-success-200 bg-success-50 p-3">
              <p className="text-[11.5px] font-medium uppercase tracking-wide text-success-700">Leading</p>
              <p className="font-semibold text-neutral-900">{best.key}</p>
              <p className="tabular-nums text-success-700">{formatValue(best.value, m.fmt)}</p>
            </div>
            <div className="rounded-lg border border-danger-200 bg-danger-50 p-3">
              <p className="text-[11.5px] font-medium uppercase tracking-wide text-danger-700">Needs focus</p>
              <p className="font-semibold text-neutral-900">{worst.key}</p>
              <p className="tabular-nums text-danger-700">{formatValue(worst.value, m.fmt)}</p>
            </div>
          </div>
        )}
      </div>
    </Panel>
  )
}
