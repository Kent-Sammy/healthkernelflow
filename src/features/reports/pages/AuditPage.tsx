import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { useUiStore } from '@/state/uiStore'
import { downloadCsv } from '../engine/csv'
import { DEMO_TODAY, addDays } from '../engine/dates'
import { fmtDateTime } from '../engine/format'
import { useReportsStore, type AuditEntry } from '../state/reportsStore'
import { DataTable } from '../components/DataTable'
import { DemoNotice, Drawer, HkButton, KpiCard, NativeSelect, PageHeader, Panel, StatusBadge, type Tone } from '../components/ui'

const CAT_TONE: Record<AuditEntry['category'], Tone> = {
  Generation: 'info',
  Export: 'warn',
  'Saved reports': 'neutral',
  Scheduling: 'neutral',
  Templates: 'bad',
  'Regulatory workflow': 'good',
}

export function AuditPage() {
  const audit = useReportsStore((s) => s.audit)
  const toast = useUiStore((s) => s.showToast)
  const [cat, setCat] = useState('all')
  const [user, setUser] = useState('all')
  const [range, setRange] = useState('30')
  const [selected, setSelected] = useState<AuditEntry | null>(null)
  const users = useMemo(() => [...new Set(audit.map((a) => a.user))].sort(), [audit])
  const since = range === 'all' ? '' : addDays(DEMO_TODAY, -Number(range) + 1)
  const rows = audit.filter((a) => (cat === 'all' || a.category === cat) && (user === 'all' || a.user === user) && (!since || a.at.slice(0, 10) >= since))

  const exportCsv = () => {
    downloadCsv(`reporting-audit-trail_${DEMO_TODAY}`, ['Time', 'User', 'Role', 'Action', 'Category', 'Target', 'Details', 'Before', 'After', 'IP address'], rows.map((a) => [a.at, a.user, a.role, a.action, a.category, a.target, a.details, a.before ?? '', a.after ?? '', a.ip]))
    toast({ title: 'Audit trail exported', description: `${rows.length.toLocaleString()} events downloaded.`, variant: 'success' })
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Audit Trail"
        subtitle="Who generated, exported, scheduled, edited or submitted reports — and when. Entries are append-only."
        eyebrow={<DemoNotice />}
        actions={
          <HkButton onClick={exportCsv}>
            <Download /> Export audit log
          </HkButton>
        }
      />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Events in view" value={rows.length} fmt="number" sub={range === 'all' ? 'All time' : `Last ${range} days`} />
        <KpiCard label="Reports generated" value={rows.filter((a) => a.category === 'Generation').length} fmt="number" sub="Manual generations" />
        <KpiCard label="Exports & prints" value={rows.filter((a) => a.category === 'Export').length} fmt="number" sub="Data leaving the system" />
        <KpiCard label="Template & regulatory actions" value={rows.filter((a) => a.category === 'Templates' || a.category === 'Regulatory workflow').length} fmt="number" sub="Governance events" />
      </div>
      <Panel>
        <DataTable
          rows={rows}
          rowKey={(a) => a.id}
          onRowClick={setSelected}
          initialSort={{ id: 'at', dir: 'desc' }}
          searchPlaceholder="Search user, action, report or details…"
          toolbar={
            <div className="grid grid-cols-3 gap-2.5">
              <NativeSelect value={cat} onChange={(e) => setCat(e.target.value)} options={[{ value: 'all', label: 'All activity types' }, ...Object.keys(CAT_TONE).map((c) => ({ value: c, label: c }))]} aria-label="Activity type" />
              <NativeSelect value={user} onChange={(e) => setUser(e.target.value)} options={[{ value: 'all', label: 'All users' }, ...users.map((u) => ({ value: u, label: u }))]} aria-label="User" />
              <NativeSelect value={range} onChange={(e) => setRange(e.target.value)} options={[{ value: '1', label: 'Today' }, { value: '7', label: 'Last 7 days' }, { value: '30', label: 'Last 30 days' }, { value: 'all', label: 'All time' }]} aria-label="Date range" />
            </div>
          }
          columns={[
            { id: 'at', label: 'Time', fmt: 'datetime', get: (a: AuditEntry) => a.at },
            { id: 'user', label: 'User', get: (a: AuditEntry) => a.user, render: (a: AuditEntry) => <span><span className="block font-medium">{a.user}</span><span className="block text-[11.5px] text-neutral-500">{a.role}</span></span> },
            { id: 'action', label: 'Action', get: (a: AuditEntry) => a.action, render: (a: AuditEntry) => <span className="font-medium">{a.action}</span> },
            { id: 'category', label: 'Type', get: (a: AuditEntry) => a.category, render: (a: AuditEntry) => <StatusBadge value={a.category} tone={CAT_TONE[a.category]} /> },
            { id: 'target', label: 'Report / template', get: (a: AuditEntry) => a.target },
            { id: 'details', label: 'Details', get: (a: AuditEntry) => a.details, render: (a: AuditEntry) => <span className="block max-w-[280px] truncate text-neutral-600" title={a.details}>{a.details}</span> },
            { id: 'ip', label: 'IP address', get: (a: AuditEntry) => a.ip },
          ]}
        />
      </Panel>
      <Drawer open={!!selected} onOpenChange={(o) => !o && setSelected(null)} title={selected?.action ?? ''} subtitle={selected ? `${selected.id} · ${fmtDateTime(selected.at)}` : ''}>
        {selected && (
          <dl className="grid grid-cols-[140px_1fr] gap-x-4 gap-y-3 text-[13px]">
            {(
              [
                ['User', selected.user],
                ['Role', selected.role],
                ['Activity type', selected.category],
                ['Report / template', selected.target],
                ['Details', selected.details],
                ['Before', selected.before ?? '—'],
                ['After', selected.after ?? '—'],
                ['IP address', selected.ip],
                ['Recorded', fmtDateTime(selected.at)],
              ] as const
            ).map(([k, v]) => (
              <div key={k} className="contents">
                <dt className="text-neutral-500">{k}</dt>
                <dd className="font-medium text-neutral-900">{v}</dd>
              </div>
            ))}
          </dl>
        )}
      </Drawer>
    </div>
  )
}
