import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AlertOctagon, AlertTriangle, Check, CheckCircle2, ClipboardCheck, Download, FilePlus2, FileText, Landmark, Play, Send, ShieldAlert, Stamp, Undo2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Modal } from '@/components/ui/Dialog'
import { useUiStore } from '@/state/uiStore'
import { useDb } from '../data/useDb'
import { REG_TEMPLATES, REG_TEMPLATE_BY_ID, type RegIssue, type RegReturn } from '../data/regulatory'
import { REPORT_BY_ID } from '../engine/catalogue'
import { configToSearch } from '../engine/url'
import { fmtDate, fmtDateTime } from '../engine/format'
import { downloadCsv, slug } from '../engine/csv'
import { DEMO_TODAY, addDays, endOfMonth } from '../engine/dates'
import { CURRENT_USER, demoNow, useReportsStore } from '../state/reportsStore'
import { DataTable } from '../components/DataTable'
import { DemoNotice, Drawer, HkButton, KpiCard, NativeSelect, PageHeader, Panel, Segmented, StatusBadge } from '../components/ui'

const STAGES = ['Preparation', 'Validation', 'Review', 'Approval', 'Submission'] as const

function stageState(r: RegReturn): ('done' | 'warn' | 'fail' | 'todo')[] {
  return [
    r.preparation === 'Complete' ? 'done' : r.preparation === 'In progress' ? 'warn' : 'todo',
    r.validation === 'Passed' ? 'done' : r.validation === 'Passed with warnings' ? 'warn' : r.validation === 'Failed' ? 'fail' : 'todo',
    r.review === 'Reviewed' ? 'done' : r.review === 'Changes requested' ? 'fail' : 'todo',
    r.approval === 'Approved' ? 'done' : 'todo',
    r.submission === 'Submitted (simulated)' ? 'done' : 'todo',
  ]
}

const DOT: Record<string, string> = { done: 'bg-success-600 text-white', warn: 'bg-warning-500 text-white', fail: 'bg-danger-600 text-white', todo: 'bg-neutral-200 text-neutral-500' }

function MiniStepper({ r }: { r: RegReturn }) {
  const st = stageState(r)
  return (
    <span className="flex items-center gap-1" aria-label={STAGES.map((s, i) => `${s}: ${st[i]}`).join(', ')}>
      {st.map((s, i) => (
        <span key={i} className="flex items-center gap-1">
          <span className={cn('size-2.5 rounded-full', DOT[s].split(' ')[0])} title={`${STAGES[i]}: ${s}`} />
          {i < st.length - 1 && <span className="h-px w-3 bg-neutral-300" />}
        </span>
      ))}
    </span>
  )
}

function Illustrative() {
  return <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md border border-warning-200 bg-warning-50 px-1.5 py-0.5 text-[10.5px] font-semibold uppercase tracking-wide text-warning-700">Illustrative · pending validation</span>
}

export function RegulatoryPage() {
  const db = useDb()
  const [params, setParams] = useSearchParams()
  const returns = useReportsStore((s) => s.returns)
  const [tab, setTab] = useState<'returns' | 'templates'>('returns')
  const [newOpen, setNewOpen] = useState(false)
  const [tmplEdit, setTmplEdit] = useState<string | null>(null)
  const openId = params.get('open')
  const open = returns.find((r) => r.id === openId) ?? null

  const weekAhead = addDays(DEMO_TODAY, 7)
  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Regulatory & Compliance"
        subtitle="Prepare, validate, review, approve and track statutory and partner returns from HealthKernel data."
        eyebrow={<DemoNotice />}
        actions={
          <HkButton variant="primary" onClick={() => setNewOpen(true)}>
            <FilePlus2 /> New return
          </HkButton>
        }
      />
      <div className="flex items-start gap-3 rounded-xl border border-warning-200 bg-warning-50 px-4 py-3 text-[13px] text-warning-800">
        <ShieldAlert className="mt-0.5 size-5 shrink-0 text-warning-700" />
        <div>
          <p className="font-semibold text-warning-800">Illustrative templates — not official regulatory forms</p>
          <p className="text-warning-700">
            These templates demonstrate the workflow only. They are not official forms of any Nigerian authority and must be validated against the real requirements before use. Submissions are simulated — nothing leaves this browser.
          </p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Returns in workflow" value={returns.filter((r) => r.submission !== 'Submitted (simulated)').length} fmt="number" sub={`${returns.length} returns in total`} />
        <KpiCard label="Due in next 7 days" value={returns.filter((r) => r.submission !== 'Submitted (simulated)' && r.dueDate <= weekAhead).length} fmt="number" sub="Including overdue" />
        <KpiCard label="Awaiting approval" value={returns.filter((r) => r.review === 'Reviewed' && r.approval === 'Pending').length} fmt="number" sub="Reviewed, not yet approved" />
        <KpiCard label="Submitted (simulated)" value={returns.filter((r) => r.submission === 'Submitted (simulated)').length} fmt="number" sub="With tracking reference" />
      </div>

      <Panel
        title={
          <Segmented
            value={tab}
            onChange={setTab}
            options={[
              { value: 'returns', label: `Returns (${returns.length})` },
              { value: 'templates', label: `Templates (${REG_TEMPLATES.length})` },
            ]}
          />
        }
      >
        {tab === 'returns' ? (
          <DataTable
            rows={returns}
            rowKey={(r) => r.id}
            onRowClick={(r) => setParams({ open: r.id })}
            initialSort={{ id: 'due', dir: 'asc' }}
            searchPlaceholder="Search returns…"
            columns={[
              {
                id: 'name',
                label: 'Return',
                get: (r: RegReturn) => REG_TEMPLATE_BY_ID[r.templateId].name,
                render: (r: RegReturn) => (
                  <span className="flex flex-col gap-1">
                    <span className="font-semibold">{REG_TEMPLATE_BY_ID[r.templateId].name}</span>
                    <span className="flex items-center gap-2 text-[11.5px] text-neutral-500">
                      {r.id} <Illustrative />
                    </span>
                  </span>
                ),
              },
              { id: 'recipient', label: 'Recipient', get: (r: RegReturn) => REG_TEMPLATE_BY_ID[r.templateId].recipient },
              { id: 'period', label: 'Period', get: (r: RegReturn) => r.periodLabel },
              { id: 'due', label: 'Due', get: (r: RegReturn) => r.dueDate, render: (r: RegReturn) => <span className={cn(r.submission !== 'Submitted (simulated)' && r.dueDate < DEMO_TODAY && 'font-semibold text-danger-700')}>{fmtDate(r.dueDate)}{r.submission !== 'Submitted (simulated)' && r.dueDate < DEMO_TODAY && ' · overdue'}</span> },
              { id: 'workflow', label: 'Workflow', sortable: false, get: () => '', render: (r: RegReturn) => <MiniStepper r={r} /> },
              { id: 'validation', label: 'Validation', get: (r: RegReturn) => r.validation, render: (r: RegReturn) => <StatusBadge value={r.validation} tone={r.validation === 'Not run' ? 'neutral' : undefined} /> },
              { id: 'review', label: 'Review', get: (r: RegReturn) => r.review, render: (r: RegReturn) => <StatusBadge value={r.review} /> },
              { id: 'approval', label: 'Approval', get: (r: RegReturn) => r.approval, render: (r: RegReturn) => <StatusBadge value={r.approval} /> },
              { id: 'submission', label: 'Submission', get: (r: RegReturn) => r.submission, render: (r: RegReturn) => (r.submissionRef ? <span className="flex flex-col"><StatusBadge value="Submitted (simulated)" /><span className="mt-0.5 text-[11px] text-neutral-500">{r.submissionRef}</span></span> : <StatusBadge value="Not submitted" tone="neutral" />) },
            ]}
          />
        ) : (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {REG_TEMPLATES.map((t) => (
              <div key={t.id} className="flex flex-col rounded-xl border border-[#e3eeec] p-4">
                <div className="flex items-start gap-3">
                  <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-[#e6f4f2] text-brand-700">
                    <Landmark className="size-[18px]" />
                  </span>
                  <div className="min-w-0">
                    <p className="font-semibold">{t.name}</p>
                    <div className="mt-1">
                      <Illustrative />
                    </div>
                  </div>
                </div>
                <p className="mt-3 flex-1 text-[12.5px] text-neutral-600">{t.description}</p>
                <dl className="mt-3 grid grid-cols-2 gap-y-1 text-[12px]">
                  <dt className="text-neutral-500">Recipient</dt>
                  <dd className="font-medium">{t.recipient}</dd>
                  <dt className="text-neutral-500">Frequency</dt>
                  <dd className="font-medium">{t.frequency}</dd>
                  <dt className="text-neutral-500">Version</dt>
                  <dd className="font-medium">{t.version}</dd>
                  <dt className="text-neutral-500">Owner</dt>
                  <dd className="font-medium">{t.owner}</dd>
                </dl>
                <div className="mt-3 flex gap-2 border-t border-[#edf3f2] pt-3">
                  <HkButton size="sm" variant="outline" onClick={() => setTmplEdit(t.id)}>
                    <FileText /> Record template change
                  </HkButton>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      {open && <ReturnDrawer key={open.id} r={open} onClose={() => setParams({})} db={db} />}
      <NewReturnDialog open={newOpen} onOpenChange={setNewOpen} onCreated={(id) => setParams({ open: id })} />
      <TemplateChangeDialog id={tmplEdit} onClose={() => setTmplEdit(null)} />
    </div>
  )
}

function ReturnDrawer({ r, onClose, db }: { r: RegReturn; onClose: () => void; db: ReturnType<typeof useDb> }) {
  const t = REG_TEMPLATE_BY_ID[r.templateId]
  const update = useReportsStore((s) => s.updateReturn)
  const logAudit = useReportsStore((s) => s.logAudit)
  const toast = useUiStore((s) => s.showToast)
  const navigate = useNavigate()
  const sections = useMemo(() => t.build(db, r.from, r.to), [t, db, r.from, r.to])
  const issues: RegIssue[] = useMemo(() => t.validate(db, r.from, r.to), [t, db, r.from, r.to])
  const st = stageState(r)
  const errors = issues.filter((i) => i.severity === 'Error')
  const act = (action: string, patch: Partial<RegReturn>, msg: string) => {
    update(r.id, patch)
    logAudit({ action, category: 'Regulatory workflow', target: t.name, details: `${r.id} · ${r.periodLabel}${patch.submissionRef ? ` · ref ${patch.submissionRef}` : ''}` })
    toast({ title: msg, description: `${t.name} · ${r.periodLabel}`, variant: 'success' })
  }
  const prepared = r.preparation === 'Complete'
  const validated = r.validation === 'Passed' || r.validation === 'Passed with warnings'
  const exportReturn = () => {
    const rows: (string | number)[][] = []
    sections.forEach((s) => {
      rows.push([s.title])
      rows.push(s.columns)
      s.rows.forEach((x) => rows.push(x))
      rows.push([])
    })
    downloadCsv(`${slug(t.name)}_${r.from}_${r.to}_ILLUSTRATIVE`, [`${t.name} — ILLUSTRATIVE TEMPLATE, NOT AN OFFICIAL FORM`, `Period: ${r.periodLabel}`], rows)
    logAudit({ action: 'Report exported (CSV)', category: 'Export', target: t.name, details: `${r.id} return data exported` })
  }

  return (
    <Drawer
      open
      onOpenChange={(o) => !o && onClose()}
      width="max-w-4xl"
      title={
        <span className="flex flex-wrap items-center gap-2">
          {t.name} <Illustrative />
        </span>
      }
      subtitle={`${r.id} · ${r.periodLabel} · due ${fmtDate(r.dueDate)} · ${t.recipient}`}
      footer={
        <>
          <HkButton variant="ghost" onClick={exportReturn}>
            <Download /> Export return data
          </HkButton>
          <HkButton variant="ghost" onClick={onClose}>
            Close
          </HkButton>
        </>
      }
    >
      <div className="flex flex-col gap-6">
        <ol className="grid grid-cols-5 gap-2">
          {STAGES.map((s, i) => (
            <li key={s} className="flex flex-col items-center gap-1.5 text-center">
              <span className={cn('flex size-8 items-center justify-center rounded-full text-[12px] font-bold', DOT[st[i]])}>{st[i] === 'done' ? <Check className="size-4" /> : st[i] === 'fail' ? '!' : i + 1}</span>
              <span className="text-[12px] font-medium text-neutral-700">{s}</span>
              <span className="text-[11px] text-neutral-500">{[r.preparation, r.validation, r.review, r.approval, r.submission === 'Submitted (simulated)' ? 'Submitted' : 'Not submitted'][i]}</span>
            </li>
          ))}
        </ol>

        <div className="flex flex-wrap gap-2 rounded-xl bg-[#f3faf9] p-3">
          <HkButton size="sm" variant={prepared ? 'ghost' : 'primary'} disabled={r.submission !== 'Not submitted'} onClick={() => act('Return prepared', { preparation: 'Complete', preparedBy: CURRENT_USER.name, validation: 'Not run', review: 'Pending', approval: 'Pending' }, 'Return data prepared')}>
            <ClipboardCheck /> {prepared ? 'Re-prepare data' : 'Prepare return'}
          </HkButton>
          <HkButton size="sm" variant={prepared && !validated ? 'primary' : 'ghost'} disabled={!prepared || r.submission !== 'Not submitted'} onClick={() => act('Validation run', { validation: errors.length ? 'Failed' : issues.length ? 'Passed with warnings' : 'Passed', lastValidated: demoNow() }, errors.length ? 'Validation failed — fix errors' : 'Validation complete')}>
            <Play /> Run validation
          </HkButton>
          <HkButton size="sm" variant={validated && r.review !== 'Reviewed' ? 'primary' : 'ghost'} disabled={!validated || r.review === 'Reviewed' || r.submission !== 'Not submitted'} onClick={() => act('Return reviewed', { review: 'Reviewed', reviewedBy: CURRENT_USER.name }, 'Marked as reviewed')}>
            <CheckCircle2 /> Mark reviewed
          </HkButton>
          <HkButton size="sm" variant="ghost" disabled={!prepared || r.submission !== 'Not submitted'} onClick={() => act('Changes requested', { review: 'Changes requested', approval: 'Pending' }, 'Changes requested')}>
            <Undo2 /> Request changes
          </HkButton>
          <HkButton size="sm" variant={r.review === 'Reviewed' && r.approval !== 'Approved' ? 'primary' : 'ghost'} disabled={r.review !== 'Reviewed' || r.approval === 'Approved'} onClick={() => act('Return approved', { approval: 'Approved', approvedBy: CURRENT_USER.name }, 'Return approved')}>
            <Stamp /> Approve
          </HkButton>
          <HkButton size="sm" variant={r.approval === 'Approved' && r.submission !== 'Submitted (simulated)' ? 'primary' : 'ghost'} disabled={r.approval !== 'Approved' || r.submission === 'Submitted (simulated)'} onClick={() => act('Return submitted (simulated)', { submission: 'Submitted (simulated)', submissionRef: `SIM-2026-${String(Math.floor(1000 + Math.random() * 8999))}`, submittedAt: demoNow(), submittedBy: CURRENT_USER.name }, 'Submission simulated — nothing was sent')}>
            <Send /> Submit (simulated)
          </HkButton>
        </div>

        <section>
          <h3 className="mb-2 flex items-center gap-2 text-[14px] font-semibold">
            Validation {r.lastValidated && <span className="text-[12px] font-normal text-neutral-500">· last run {fmtDateTime(r.lastValidated)}</span>}
          </h3>
          {issues.length === 0 ? (
            <p className="flex items-center gap-2 rounded-lg bg-success-50 px-3 py-2 text-[13px] text-success-700">
              <CheckCircle2 className="size-4" /> No validation issues for this period.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {issues.map((i) => (
                <li key={i.message} className={cn('flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2 text-[13px]', i.severity === 'Error' ? 'border-danger-200 bg-danger-50' : 'border-warning-200 bg-warning-50')}>
                  {i.severity === 'Error' ? <AlertOctagon className="size-4 text-danger-700" /> : <AlertTriangle className="size-4 text-warning-700" />}
                  <span className="font-semibold">{i.severity}</span>
                  <span className="flex-1">
                    {i.message}: <strong>{i.count.toLocaleString()}</strong>
                  </span>
                  {i.reportId && REPORT_BY_ID[i.reportId] && (
                    <button type="button" className="text-[12.5px] font-medium text-brand-700 hover:underline" onClick={() => navigate(`/reports/view${configToSearch({ reportId: i.reportId!, period: 'custom', from: r.from, to: r.to, filters: {}, view: 'detailed', groupBy: REPORT_BY_ID[i.reportId!].groupBy })}`)}>
                      Open {REPORT_BY_ID[i.reportId].name} →
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>

        {sections.map((s) => (
          <section key={s.title}>
            <h3 className="mb-2 text-[14px] font-semibold">{s.title}</h3>
            <div className="overflow-x-auto rounded-lg border border-[#e3eeec]">
              <table className="w-full text-[13px]">
                <thead>
                  <tr className="bg-[#dcf1ed]">
                    {s.columns.map((c, i) => (
                      <th key={c} className={cn('whitespace-nowrap px-3 py-2 text-left font-semibold', s.numeric?.[i] && 'text-right')}>
                        {c}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {s.rows.map((row, ri) => (
                    <tr key={ri} className={cn('border-t border-[#edf3f2]', row[0] === 'Total' && 'bg-[#f3faf9] font-semibold')}>
                      {row.map((v, ci) => (
                        <td key={ci} className={cn('whitespace-nowrap px-3 py-2', s.numeric?.[ci] && 'text-right tabular-nums')}>
                          {typeof v === 'number' ? v.toLocaleString() : v}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        ))}

        <section>
          <h3 className="mb-2 text-[14px] font-semibold">Submission tracking</h3>
          <ul className="flex flex-col gap-2 border-l-2 border-[#d7e9e6] pl-4 text-[13px]">
            <li>Prepared by {r.preparedBy || '—'}</li>
            <li>Validation: {r.validation}{r.lastValidated && ` (${fmtDateTime(r.lastValidated)})`}</li>
            <li>Reviewed by {r.reviewedBy || '—'}</li>
            <li>Approved by {r.approvedBy || '—'}</li>
            <li>{r.submissionRef ? `Submitted (simulated) by ${r.submittedBy} on ${fmtDateTime(r.submittedAt)} · tracking ref ${r.submissionRef}` : 'Not yet submitted'}</li>
          </ul>
        </section>
      </div>
    </Drawer>
  )
}

function NewReturnDialog({ open, onOpenChange, onCreated }: { open: boolean; onOpenChange: (o: boolean) => void; onCreated: (id: string) => void }) {
  const [tid, setTid] = useState(REG_TEMPLATES[0].id)
  const [month, setMonth] = useState('2026-10')
  const toast = useUiStore((s) => s.showToast)
  const logAudit = useReportsStore((s) => s.logAudit)
  const months = ['2026-10', '2026-09', '2026-08', '2026-07', '2026-06', '2026-05', '2026-04', '2026-03', '2026-02', '2026-01']
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Start a new return"
      description="Creates a return from an illustrative template for the selected month."
      footer={
        <>
          <HkButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </HkButton>
          <HkButton
            variant="primary"
            onClick={() => {
              const t = REG_TEMPLATE_BY_ID[tid]
              const from = `${month}-01`
              const to = month === DEMO_TODAY.slice(0, 7) ? DEMO_TODAY : endOfMonth(from)
              const id = `RET-${String(160 + useReportsStore.getState().returns.length)}`
              const label = new Date(`${from}T00:00:00Z`).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' })
              useReportsStore.setState((s) => ({
                returns: [{ id, templateId: tid, periodLabel: label, from, to, dueDate: addDays(endOfMonth(from), 15), preparation: 'Not started', validation: 'Not run', review: 'Pending', approval: 'Pending', submission: 'Not submitted', submissionRef: '', submittedAt: '', submittedBy: '', preparedBy: '', reviewedBy: '', approvedBy: '', lastValidated: '' }, ...s.returns],
              }))
              logAudit({ action: 'Return created', category: 'Regulatory workflow', target: t.name, details: `${id} · ${label}` })
              toast({ title: 'Return created', description: `${t.name} · ${label}`, variant: 'success' })
              onOpenChange(false)
              onCreated(id)
            }}
          >
            Create return
          </HkButton>
        </>
      }
    >
      <div className="grid gap-3">
        <NativeSelect label="Template (illustrative)" value={tid} onChange={(e) => setTid(e.target.value)} options={REG_TEMPLATES.map((t) => ({ value: t.id, label: t.name }))} />
        <NativeSelect label="Reporting month" value={month} onChange={(e) => setMonth(e.target.value)} options={months.map((m) => ({ value: m, label: new Date(`${m}-01T00:00:00Z`).toLocaleString('en-GB', { month: 'long', year: 'numeric', timeZone: 'UTC' }) }))} />
      </div>
    </Modal>
  )
}

function TemplateChangeDialog({ id, onClose }: { id: string | null; onClose: () => void }) {
  const [note, setNote] = useState('')
  const logAudit = useReportsStore((s) => s.logAudit)
  const toast = useUiStore((s) => s.showToast)
  const t = id ? REG_TEMPLATE_BY_ID[id] : null
  return (
    <Modal
      open={!!id}
      onOpenChange={(o) => !o && (onClose(), setNote(''))}
      title="Record template change"
      description={t ? `${t.name} · ${t.version}. Template editing is illustrative; the change note is written to the audit trail.` : ''}
      footer={
        <>
          <HkButton variant="ghost" onClick={onClose}>
            Cancel
          </HkButton>
          <HkButton
            variant="primary"
            disabled={!note.trim()}
            onClick={() => {
              logAudit({ action: 'Template edited', category: 'Templates', target: t!.name, details: note.trim(), before: t!.version, after: `${t!.version} (amended ${fmtDate(DEMO_TODAY)})` })
              toast({ title: 'Template change recorded', description: 'See the Audit Trail for details.', variant: 'success' })
              setNote('')
              onClose()
            }}
          >
            Save change note
          </HkButton>
        </>
      }
    >
      <textarea value={note} onChange={(e) => setNote(e.target.value)} rows={4} placeholder="e.g. Mapped section B to admissions by facility after guidance from the authority" className="w-full rounded-lg border border-neutral-300 p-3 text-[13.5px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30" />
    </Modal>
  )
}
