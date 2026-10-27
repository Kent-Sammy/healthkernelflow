import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ChartColumn as BarChart3Icon, Bookmark, CalendarRange, Check, Funnel as Filter, LayoutList, Play, RotateCcw, Search, Table2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useDb } from '../data/useDb'
import { CATEGORIES, MODULES, MODULE_BY_ID, REPORTS, REPORT_BY_ID, type ReportDef } from '../engine/catalogue'
import { SOURCES } from '../engine/sources'
import { defaultConfig, filterOptions, periodApplies, scopeRows, configPeriod, type ReportConfig } from '../engine/run'
import { configToSearch, searchToConfig } from '../engine/url'
import { PERIOD_OPTIONS, periodLabel, type PeriodPreset } from '../engine/period'
import { DATA_START, DEMO_TODAY } from '../engine/dates'
import { HkButton, ModuleIcon, NativeSelect, PageHeader, Panel, Pill, TypeBadge, DemoNotice } from '../components/ui'
import { SaveReportDialog } from '../components/ReportDialogs'
import { Modal } from '@/components/ui/Dialog'

export function BuilderPage() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const fromUrl = useMemo(() => searchToConfig(params), [params])
  const [draft, setDraft] = useState<ReportConfig | null>(fromUrl)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)

  useEffect(() => {
    if (fromUrl && (!draft || fromUrl.reportId !== draft.reportId)) setDraft(fromUrl)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fromUrl?.reportId])

  useEffect(() => {
    if (draft) setParams(configToSearch(draft).slice(1), { replace: true })
  }, [draft, setParams])

  const choose = (def: ReportDef) => {
    setPickerOpen(false)
    setDraft((d) => {
      const base = defaultConfig(def)
      if (!d) return base
      const src = SOURCES[def.source]
      const keep = Object.fromEntries(Object.entries(d.filters).filter(([k]) => src.filters.includes(k)))
      return { ...base, period: d.period, from: d.from, to: d.to, filters: keep }
    })
  }

  if (!draft) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Report Builder" subtitle="Choose a report to configure its period, filters, grouping and level of detail." eyebrow={<DemoNotice />} />
        <Panel>
          <ReportPicker onPick={choose} />
        </Panel>
      </div>
    )
  }

  const def = REPORT_BY_ID[draft.reportId]
  const src = SOURCES[def.source]
  const applies = periodApplies(def, src)
  const period = configPeriod(draft)
  const set = (patch: Partial<ReportConfig>) => setDraft({ ...draft, ...patch })
  const matching = scopeRows(db, def, draft, period).length
  const detailCount = def.detailWhere ? scopeRows(db, def, draft, period).filter(def.detailWhere).length : matching
  const activeFilters = Object.values(draft.filters).filter((v) => v && v !== 'all').length

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Report Builder"
        subtitle="Configure the report, preview what it will contain, then generate it."
        eyebrow={<DemoNotice />}
        actions={
          <>
            <HkButton variant="ghost" onClick={() => setDraft(defaultConfig(def))}>
              <RotateCcw /> Reset
            </HkButton>
            <HkButton onClick={() => setSaveOpen(true)}>
              <Bookmark /> Save configuration
            </HkButton>
            <HkButton variant="primary" onClick={() => navigate(`/reports/view${configToSearch(draft)}`)}>
              <Play /> Generate report
            </HkButton>
          </>
        }
      />
      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="flex min-w-0 flex-col gap-5">
          <Panel title={<Step n={1} label="Report" />}>
            <div className="flex flex-col gap-4 rounded-xl border border-[#d7e9e6] bg-[#f6fbfa] p-4 sm:flex-row sm:items-center">
              <ModuleIcon module={def.module} size="lg" />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-[16px] font-semibold text-neutral-900">{def.name}</p>
                  <TypeBadge type={def.type} />
                  <Pill>{MODULE_BY_ID[def.module].label}</Pill>
                </div>
                <p className="mt-1 text-[13px] text-neutral-500">{def.description}</p>
              </div>
              <HkButton onClick={() => setPickerOpen(true)}>Change report</HkButton>
            </div>
          </Panel>

          <Panel title={<Step n={2} label="Reporting period" />} subtitle={applies ? `Filters on ${src.dateLabel?.toLowerCase() ?? 'date'}. Demonstration data covers ${'1 Nov 2025'} – 27 Oct 2026.` : undefined}>
            {applies ? (
              <div className="flex flex-col gap-4">
                <div className="flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map((p) => (
                    <button
                      key={p.value}
                      type="button"
                      onClick={() => set({ period: p.value as PeriodPreset, ...(p.value === 'custom' ? { from: draft.from ?? period.from, to: draft.to ?? period.to } : {}) })}
                      className={cn('rounded-lg border px-3 py-2 text-[13px] font-medium transition', draft.period === p.value ? 'border-brand-600 bg-brand-600 text-white' : 'border-neutral-300 bg-white text-neutral-700 hover:border-brand-400')}
                    >
                      {p.label}
                    </button>
                  ))}
                </div>
                <div className="flex flex-wrap items-end gap-3">
                  <DateField label="From" value={period.from} disabled={draft.period !== 'custom'} onChange={(v) => set({ period: 'custom', from: v, to: draft.to ?? period.to })} />
                  <DateField label="To" value={period.to} disabled={draft.period !== 'custom'} onChange={(v) => set({ period: 'custom', to: v, from: draft.from ?? period.from })} />
                  <p className="pb-2.5 text-[12.5px] text-neutral-500">
                    <CalendarRange className="mr-1 inline size-3.5" />
                    {periodLabel(period)}
                  </p>
                </div>
              </div>
            ) : (
              <p className="rounded-lg bg-info-50 px-3 py-2.5 text-[13px] text-info-700">This is a snapshot report — it reflects current positions as at 27 Oct 2026, 13:45, so no period is needed.</p>
            )}
          </Panel>

          <Panel title={<Step n={3} label="Filters" />} subtitle={`Only filters relevant to ${def.name} are shown.${activeFilters ? ` ${activeFilters} active.` : ''}`} actions={activeFilters ? <HkButton size="sm" variant="ghost" onClick={() => set({ filters: {} })}>Clear filters</HkButton> : undefined}>
            {def.whereLabel && (
              <p className="mb-4 flex items-center gap-2 text-[12.5px] text-neutral-500">
                <Filter className="size-3.5" /> Built-in scope: <span className="font-medium text-neutral-700">{def.whereLabel}</span>
              </p>
            )}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {src.filters.map((f) => {
                const dim = src.dims.find((d) => d.id === f)!
                const opts = filterOptions(db, src, f)
                return <NativeSelect key={f} label={dim.label} value={draft.filters[f] ?? 'all'} onChange={(e) => set({ filters: { ...draft.filters, [f]: e.target.value } })} options={[{ value: 'all', label: `All (${opts.length})` }, ...opts.map((o) => ({ value: o, label: o }))]} />
              })}
            </div>
          </Panel>

          <Panel title={<Step n={4} label="Layout" />}>
            <div className="grid gap-5 md:grid-cols-2">
              <NativeSelect label="Group summary by" value={draft.groupBy ?? def.groupBy ?? src.dims[0].id} onChange={(e) => set({ groupBy: e.target.value })} options={src.dims.map((d) => ({ value: d.id, label: d.label }))} />
              <div className="flex flex-col gap-1.5">
                <span className="text-[12.5px] font-medium text-neutral-700">Open report on</span>
                <div className="grid grid-cols-2 gap-2">
                  {(
                    [
                      ['summary', 'Summary view', 'Grouped totals', LayoutList],
                      ['detailed', 'Detailed view', 'Record listing', Table2],
                    ] as const
                  ).map(([v, label, sub, Icon]) => (
                    <button key={v} type="button" onClick={() => set({ view: v })} className={cn('flex items-start gap-2.5 rounded-lg border p-3 text-left transition', draft.view === v ? 'border-brand-600 bg-[#effaf8] ring-1 ring-brand-600' : 'border-neutral-300 hover:border-brand-400')}>
                      <Icon className={cn('mt-0.5 size-4', draft.view === v ? 'text-brand-700' : 'text-neutral-400')} />
                      <span>
                        <span className="block text-[13px] font-semibold">{label}</span>
                        <span className="block text-[12px] text-neutral-500">{sub}</span>
                      </span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Panel>
        </div>

        <div className="xl:sticky xl:top-0 xl:self-start">
          <Panel title="Report preview" subtitle="Updates as you change the configuration">
            <div className="flex flex-col gap-4">
              <div className="rounded-xl bg-gradient-to-br from-[#16867b] to-[#0f6d64] p-4 text-white">
                <p className="text-[12px] uppercase tracking-wide text-white/75">Matching records</p>
                <p className="text-[30px] font-bold tabular-nums">{matching.toLocaleString()}</p>
                <p className="text-[12.5px] text-white/80">{applies ? periodLabel(period) : 'Snapshot as at today'}</p>
                {def.detailWhere && <p className="mt-1 text-[12px] text-white/80">{detailCount.toLocaleString()} in the exception list</p>}
              </div>
              {matching === 0 && <p className="rounded-lg bg-warning-50 px-3 py-2 text-[12.5px] text-warning-700">No records match. Widen the period or clear a filter — the report will show an empty state.</p>}
              <PreviewList title="KPI cards" items={def.kpis.map((k) => src.measures.find((m) => m.id === k)?.label ?? k)} />
              <PreviewList title="Charts" items={[...(def.trend && applies ? [`Trend: ${def.trend.title ?? def.trend.measures.map((m) => src.measures.find((x) => x.id === m)?.label).join(' vs ')}`] : []), ...(def.breakdowns ?? []).map((b) => b.title ?? `${src.measures.find((m) => m.id === b.measure)?.label} by ${src.dims.find((d) => d.id === b.dim)?.label.toLowerCase()}`)]} />
              <PreviewList title="Detailed columns" items={(def.columns ?? src.defaultColumns).map((c) => src.columns.find((x) => x.id === c)?.label ?? c)} chips />
              <HkButton variant="primary" size="lg" className="w-full" onClick={() => navigate(`/reports/view${configToSearch(draft)}`)}>
                <BarChart3Icon /> Generate report
              </HkButton>
            </div>
          </Panel>
        </div>
      </div>

      <Modal open={pickerOpen} onOpenChange={setPickerOpen} title="Choose a report" description={`${REPORTS.length} report templates across ${MODULES.length} modules`}>
        <div className="-mx-1 max-h-[60vh] overflow-y-auto px-1">
          <ReportPicker onPick={choose} current={draft.reportId} compact />
        </div>
      </Modal>
      <SaveReportDialog open={saveOpen} onOpenChange={setSaveOpen} config={draft} />
    </div>
  )
}

function Step({ n, label }: { n: number; label: string }) {
  return (
    <span className="flex items-center gap-2.5">
      <span className="flex size-6 items-center justify-center rounded-full bg-brand-600 text-[12px] font-bold text-white">{n}</span>
      {label}
    </span>
  )
}

function DateField({ label, value, onChange, disabled }: { label: string; value: string; onChange: (v: string) => void; disabled?: boolean }) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-[12.5px] font-medium text-neutral-700">{label}</span>
      <input type="date" value={value} min={DATA_START} max={DEMO_TODAY} disabled={disabled} onChange={(e) => e.target.value && onChange(e.target.value)} className="h-10 rounded-lg border border-neutral-300 bg-white px-3 text-[13.5px] disabled:bg-neutral-100 disabled:text-neutral-500" />
    </label>
  )
}

function PreviewList({ title, items, chips }: { title: string; items: string[]; chips?: boolean }) {
  if (!items.length) return null
  return (
    <div>
      <p className="mb-1.5 text-[12px] font-semibold uppercase tracking-wide text-neutral-400">{title}</p>
      {chips ? (
        <div className="flex flex-wrap gap-1.5">
          {items.map((i) => (
            <span key={i} className="rounded-md bg-neutral-100 px-2 py-0.5 text-[12px] text-neutral-700">
              {i}
            </span>
          ))}
        </div>
      ) : (
        <ul className="flex flex-col gap-1">
          {items.map((i) => (
            <li key={i} className="flex items-start gap-2 text-[13px] text-neutral-700">
              <Check className="mt-0.5 size-3.5 shrink-0 text-brand-600" /> {i}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export function ReportPicker({ onPick, current, compact }: { onPick: (d: ReportDef) => void; current?: string; compact?: boolean }) {
  const [q, setQ] = useState('')
  const [cat, setCat] = useState<string>('all')
  const needle = q.trim().toLowerCase()
  const list = REPORTS.filter((r) => (cat === 'all' || MODULE_BY_ID[r.module].category === cat) && (!needle || `${r.name} ${r.description} ${MODULE_BY_ID[r.module].label}`.toLowerCase().includes(needle)))
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" />
          <input autoFocus value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search reports, e.g. “claims”, “occupancy”, “expiry”" className="h-11 w-full rounded-lg border border-neutral-300 pl-9 pr-3 text-[14px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30" />
        </label>
        <NativeSelect value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: 'all', label: 'All categories' }, ...CATEGORIES.map((c) => ({ value: c, label: c }))]} aria-label="Category" />
      </div>
      {MODULES.map((m) => {
        const items = list.filter((r) => r.module === m.id)
        if (!items.length) return null
        return (
          <div key={m.id}>
            <p className="mb-2 flex items-center gap-2 text-[12.5px] font-semibold text-neutral-700">
              <ModuleIcon module={m.id} size="sm" /> {m.label} <span className="font-normal text-neutral-400">({items.length})</span>
            </p>
            <div className={cn('grid gap-1.5', compact ? 'grid-cols-1' : 'sm:grid-cols-2 lg:grid-cols-3')}>
              {items.map((r) => (
                <button key={r.id} type="button" onClick={() => onPick(r)} className={cn('flex items-start justify-between gap-2 rounded-lg border px-3 py-2 text-left transition hover:border-brand-400 hover:bg-[#f6fbfa]', current === r.id ? 'border-brand-600 bg-[#effaf8]' : 'border-[#e3eeec]')}>
                  <span className="min-w-0">
                    <span className="block text-[13px] font-semibold text-neutral-900">{r.name}</span>
                    <span className="line-clamp-1 block text-[12px] text-neutral-500">{r.description}</span>
                  </span>
                  <TypeBadge type={r.type} />
                </button>
              ))}
            </div>
          </div>
        )
      })}
      {list.length === 0 && <p className="py-10 text-center text-[13px] text-neutral-500">No reports match “{q}”.</p>}
    </div>
  )
}
