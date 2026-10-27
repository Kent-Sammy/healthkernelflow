import { useMemo } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { ArrowRight, Clock, Play, Search, SlidersHorizontal, Sparkles, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { CATEGORIES, MODULES, MODULE_BY_ID, REPORTS, REPORT_TYPES, REPORT_BY_ID, type ReportDef } from '../engine/catalogue'
import { SOURCES } from '../engine/sources'
import { defaultConfig } from '../engine/run'
import { configToSearch } from '../engine/url'
import { useReportsStore } from '../state/reportsStore'
import { DemoNotice, HkButton, ModuleIcon, NativeSelect, PageHeader, Pill, TypeBadge } from '../components/ui'

function ReportCard({ r, highlight }: { r: ReportDef; highlight?: string }) {
  const navigate = useNavigate()
  const cfg = configToSearch(defaultConfig(r))
  return (
    <article className="group flex min-w-0 flex-col rounded-xl border border-[#e3eeec] bg-white p-4 shadow-[0_1px_2px_rgba(16,64,58,0.04)] transition hover:border-brand-300 hover:shadow-md">
      <div className="flex items-start gap-3">
        <ModuleIcon module={r.module} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-1.5">
            <h3 className="text-[14px] font-semibold leading-snug text-neutral-900">
              <Link to={`/reports/builder${cfg}`} className="hover:text-brand-700">
                {r.name}
              </Link>
            </h3>
            {highlight && <span className="rounded bg-warning-100 px-1.5 text-[10.5px] font-semibold uppercase text-warning-700">{highlight}</span>}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            <TypeBadge type={r.type} />
            <span className="text-[11.5px] text-neutral-500">{MODULE_BY_ID[r.module].label}</span>
          </div>
        </div>
      </div>
      <p className="mt-3 line-clamp-2 flex-1 text-[12.5px] leading-relaxed text-neutral-600">{r.description}</p>
      <div className="mt-3 flex items-center justify-between gap-2 border-t border-[#edf3f2] pt-3">
        <span className="min-w-0 truncate text-[11.5px] text-neutral-400" title={SOURCES[r.source].label}>
          {SOURCES[r.source].label}
        </span>
        <div className="flex shrink-0 gap-1.5">
          <HkButton size="sm" variant="ghost" onClick={() => navigate(`/reports/builder${cfg}`)} aria-label={`Configure ${r.name}`}>
            <SlidersHorizontal /> Configure
          </HkButton>
          <HkButton size="sm" variant="outline" onClick={() => navigate(`/reports/view${cfg}`)} aria-label={`Generate ${r.name}`}>
            <Play /> Generate
          </HkButton>
        </div>
      </div>
    </article>
  )
}

export function CataloguePage() {
  const [params, setParams] = useSearchParams()
  const q = params.get('q') ?? ''
  const module = params.get('module') ?? 'all'
  const category = params.get('category') ?? 'all'
  const type = params.get('type') ?? 'all'
  const recents = useReportsStore((s) => s.recents)
  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params)
    if (!v || v === 'all') next.delete(k)
    else next.set(k, v)
    if (k === 'category') next.delete('module')
    setParams(next, { replace: true })
  }
  const needle = q.trim().toLowerCase()
  const filtered = useMemo(
    () =>
      REPORTS.filter((r) => {
        const m = MODULE_BY_ID[r.module]
        if (module !== 'all' && r.module !== module) return false
        if (category !== 'all' && m.category !== category) return false
        if (type !== 'all' && r.type !== type) return false
        if (needle && !`${r.name} ${r.description} ${m.label} ${r.type} ${r.audience ?? ''}`.toLowerCase().includes(needle)) return false
        return true
      }),
    [module, category, type, needle],
  )
  const browsing = !needle && module === 'all' && category === 'all' && type === 'all'
  const recommended = REPORTS.filter((r) => r.recommended)
  const recent = recents.map((id) => REPORT_BY_ID[id]).filter(Boolean).slice(0, 4)
  const visibleModules = MODULES.filter((m) => category === 'all' || m.category === category)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="All Reports"
        subtitle={`${REPORTS.length} report templates across ${MODULES.length} modules — browse, search, then configure or generate.`}
        eyebrow={<DemoNotice />}
        actions={
          <Link to="/reports/builder">
            <HkButton variant="primary">
              <SlidersHorizontal /> Open report builder
            </HkButton>
          </Link>
        }
      />

      <div className="flex flex-col gap-3 rounded-xl border border-[#e3eeec] bg-white p-4">
        <div className="flex flex-col gap-3 lg:flex-row">
          <label className="relative flex-1">
            <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-neutral-400" />
            <input value={q} onChange={(e) => setParam('q', e.target.value)} placeholder="Search reports by name, module or purpose — e.g. “overdue”, “bed”, “HMO”" className="h-12 w-full rounded-lg border border-neutral-300 pl-12 pr-10 text-[15px] placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30" aria-label="Search reports" />
            {q && (
              <button type="button" onClick={() => setParam('q', '')} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-neutral-400 hover:bg-neutral-100" aria-label="Clear search">
                <X className="size-4" />
              </button>
            )}
          </label>
          <div className="grid grid-cols-2 gap-3 lg:w-[440px]">
            <NativeSelect value={module} onChange={(e) => setParam('module', e.target.value)} options={[{ value: 'all', label: 'All modules' }, ...visibleModules.map((m) => ({ value: m.id, label: m.label }))]} aria-label="Module" />
            <NativeSelect value={type} onChange={(e) => setParam('type', e.target.value)} options={[{ value: 'all', label: 'All report types' }, ...REPORT_TYPES.map((t) => ({ value: t, label: t }))]} aria-label="Report type" />
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-[12.5px] font-medium text-neutral-500">Category:</span>
          {['all', ...CATEGORIES].map((c) => (
            <button key={c} type="button" onClick={() => setParam('category', c)} className={cn('rounded-full border px-3 py-1 text-[12.5px] font-medium transition', category === c ? 'border-brand-600 bg-brand-600 text-white' : 'border-neutral-300 bg-white text-neutral-700 hover:border-brand-400')}>
              {c === 'all' ? 'All' : c}
              <span className={cn('ml-1.5', category === c ? 'text-white/80' : 'text-neutral-400')}>{c === 'all' ? REPORTS.length : REPORTS.filter((r) => MODULE_BY_ID[r.module].category === c).length}</span>
            </button>
          ))}
          {!browsing && (
            <button type="button" onClick={() => setParams({}, { replace: true })} className="ml-auto text-[12.5px] font-medium text-brand-700 hover:underline">
              Clear all
            </button>
          )}
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[230px_minmax(0,1fr)]">
        <nav className="hidden lg:block" aria-label="Modules">
          <div className="sticky top-0 flex flex-col gap-0.5">
            <button type="button" onClick={() => setParam('module', 'all')} className={cn('flex items-center justify-between rounded-lg px-3 py-2 text-[13px] font-medium', module === 'all' ? 'bg-[#e1f3f0] text-brand-800' : 'text-neutral-600 hover:bg-white')}>
              All modules <span className="text-neutral-400">{REPORTS.filter((r) => category === 'all' || MODULE_BY_ID[r.module].category === category).length}</span>
            </button>
            {CATEGORIES.filter((c) => category === 'all' || c === category).map((c) => (
              <div key={c} className="mt-2">
                <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400">{c}</p>
                {MODULES.filter((m) => m.category === c).map((m) => (
                  <button key={m.id} type="button" onClick={() => setParam('module', m.id)} className={cn('flex w-full items-center justify-between gap-2 rounded-lg px-3 py-1.5 text-left text-[13px]', module === m.id ? 'bg-[#e1f3f0] font-semibold text-brand-800' : 'text-neutral-600 hover:bg-white')}>
                    <span className="truncate">{m.label}</span>
                    <span className="text-[12px] text-neutral-400">{REPORTS.filter((r) => r.module === m.id).length}</span>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </nav>

        <div className="flex min-w-0 flex-col gap-8">
          {browsing && (
            <>
              {recent.length > 0 && (
                <section>
                  <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
                    <Clock className="size-4 text-brand-600" /> Recently used
                  </h2>
                  <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-4">
                    {recent.map((r) => (
                      <ReportCard key={r.id} r={r} />
                    ))}
                  </div>
                </section>
              )}
              <section>
                <h2 className="mb-3 flex items-center gap-2 text-[15px] font-semibold">
                  <Sparkles className="size-4 text-brand-600" /> Recommended for hospital leadership
                </h2>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {recommended.slice(0, 8).map((r) => (
                    <ReportCard key={r.id} r={r} highlight={r.audience} />
                  ))}
                </div>
              </section>
            </>
          )}

          {!browsing && (
            <p className="text-[13px] text-neutral-500">
              {filtered.length} report{filtered.length === 1 ? '' : 's'} found
              {needle && (
                <>
                  {' '}
                  for “<span className="font-medium text-neutral-800">{q}</span>”
                </>
              )}
            </p>
          )}

          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
              <Search className="size-6 text-neutral-400" />
              <p className="font-semibold">No reports match your search</p>
              <p className="max-w-sm text-[13px] text-neutral-500">Try a broader term such as “revenue”, “stock” or “claims”, or clear the filters.</p>
              <HkButton onClick={() => setParams({}, { replace: true })}>Clear filters</HkButton>
            </div>
          )}

          {MODULES.map((m) => {
            const items = filtered.filter((r) => r.module === m.id)
            if (!items.length) return null
            return (
              <section key={m.id} id={`module-${m.id}`}>
                <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-3">
                    <ModuleIcon module={m.id} />
                    <div>
                      <h2 className="text-[16px] font-semibold text-neutral-900">{m.label}</h2>
                      <p className="text-[12.5px] text-neutral-500">{m.blurb}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Pill>{m.category}</Pill>
                    {module === 'all' && items.length > 6 && (
                      <button type="button" onClick={() => setParam('module', m.id)} className="inline-flex items-center gap-1 text-[12.5px] font-medium text-brand-700 hover:underline">
                        View all {items.length} <ArrowRight className="size-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
                  {(module === 'all' && browsing ? items.slice(0, 6) : items).map((r) => (
                    <ReportCard key={r.id} r={r} />
                  ))}
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
