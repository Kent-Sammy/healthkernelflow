import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { CalendarClock, Mail, Pause, Pencil, Play, Plus, Send, Trash2 } from 'lucide-react'
import { cn } from '@/lib/cn'
import { Modal } from '@/components/ui/Dialog'
import { useUiStore } from '@/state/uiStore'
import { REPORT_BY_ID } from '../engine/catalogue'
import { configToSearch } from '../engine/url'
import { fmtDateTime } from '../engine/format'
import { useReportsStore, type Schedule } from '../state/reportsStore'
import { ScheduleDialog } from '../components/ReportDialogs'
import { DemoNotice, HkButton, KpiCard, ModuleIcon, PageHeader, Panel, StatusBadge } from '../components/ui'
import { DataTable } from '../components/DataTable'

function nextRun(s: Schedule): string {
  if (!s.active) return 'Paused'
  if (s.frequency === 'Daily') return `28 Oct 2026, ${s.time}`
  if (s.frequency === 'Weekly') {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
    const target = days.indexOf(s.day)
    const today = 2 // 27 Oct 2026 is a Tuesday
    const add = ((target - today + 7) % 7) || 7
    return `${27 + add > 31 ? `${27 + add - 31} Nov` : `${27 + add} Oct`} 2026, ${s.time}`
  }
  return `${s.day.startsWith('2nd') ? '2' : s.day.startsWith('5th') ? '5' : s.day.startsWith('Last') ? '30' : '1'} Nov 2026, ${s.time}`
}

export function ScheduledPage() {
  const schedules = useReportsStore((s) => s.schedules)
  const toggle = useReportsStore((s) => s.toggleSchedule)
  const remove = useReportsStore((s) => s.deleteSchedule)
  const markRun = useReportsStore((s) => s.markScheduleRun)
  const toast = useUiStore((s) => s.showToast)
  const navigate = useNavigate()
  const [editing, setEditing] = useState<Schedule | undefined>()
  const [open, setOpen] = useState(false)
  const [deleting, setDeleting] = useState<Schedule | null>(null)
  const [freq, setFreq] = useState<'all' | Schedule['frequency']>('all')

  const rows = schedules.filter((s) => freq === 'all' || s.frequency === freq)
  const recipients = new Set(schedules.flatMap((s) => s.recipients)).size

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Scheduled Reports"
        subtitle="Reports delivered automatically by email on a daily, weekly or monthly cycle."
        eyebrow={<DemoNotice />}
        actions={
          <HkButton variant="primary" onClick={() => (setEditing(undefined), setOpen(true))}>
            <Plus /> New schedule
          </HkButton>
        }
      />
      <div className="flex items-start gap-3 rounded-xl border border-info-200 bg-info-50 px-4 py-3 text-[13px] text-info-700">
        <Mail className="mt-0.5 size-4 shrink-0" />
        Scheduling is simulated in this prototype: schedules are stored in the browser, “Run now” generates the report immediately, and no emails are sent.
      </div>
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Active schedules" value={schedules.filter((s) => s.active).length} fmt="number" sub={`${schedules.length} in total`} />
        <KpiCard label="Daily / weekly / monthly" value={schedules.filter((s) => s.frequency === 'Daily').length} fmt="number" sub={`${schedules.filter((s) => s.frequency === 'Weekly').length} weekly · ${schedules.filter((s) => s.frequency === 'Monthly').length} monthly`} />
        <KpiCard label="Distinct recipients" value={recipients} fmt="number" sub="Across all schedules" />
        <KpiCard label="Failed last run" value={schedules.filter((s) => s.lastStatus === 'Failed').length} fmt="number" sub="Needs attention" />
      </div>
      <Panel>
        <div className="mb-4 flex flex-wrap gap-2">
          {(['all', 'Daily', 'Weekly', 'Monthly'] as const).map((f) => (
            <button key={f} type="button" onClick={() => setFreq(f)} className={cn('rounded-full border px-3 py-1 text-[12.5px] font-medium', freq === f ? 'border-brand-600 bg-brand-600 text-white' : 'border-neutral-300 text-neutral-700 hover:border-brand-400')}>
              {f === 'all' ? 'All' : f}
            </button>
          ))}
        </div>
        <DataTable
          rows={rows}
          rowKey={(s) => s.id}
          searchPlaceholder="Search schedules or recipients…"
          empty="No schedules for this frequency."
          columns={[
            {
              id: 'name',
              label: 'Schedule',
              get: (s: Schedule) => s.name,
              render: (s: Schedule) => (
                <span className="flex items-center gap-2.5">
                  <ModuleIcon module={REPORT_BY_ID[s.config.reportId]?.module ?? 'billing'} size="sm" />
                  <span>
                    <span className="block font-semibold">{s.name}</span>
                    <span className="block text-[12px] text-neutral-500">{REPORT_BY_ID[s.config.reportId]?.name}</span>
                  </span>
                </span>
              ),
            },
            { id: 'frequency', label: 'Frequency', get: (s: Schedule) => `${s.frequency} · ${s.day} · ${s.time}`, render: (s: Schedule) => <span><StatusBadge value={s.frequency} tone="info" /> <span className="ml-1 text-[12.5px] text-neutral-600">{s.day}, {s.time}</span></span> },
            { id: 'next', label: 'Next run', get: (s: Schedule) => nextRun(s) },
            { id: 'last', label: 'Last run', get: (s: Schedule) => s.lastRun, render: (s: Schedule) => <span className="flex items-center gap-2">{s.lastRun ? fmtDateTime(s.lastRun) : '—'} <StatusBadge value={s.lastStatus} tone={s.lastStatus === 'Not run yet' ? 'neutral' : undefined} /></span> },
            { id: 'recipients', label: 'Recipients', get: (s: Schedule) => s.recipients.join(', '), render: (s: Schedule) => <span className="block max-w-[220px] truncate text-[12.5px]" title={s.recipients.join(', ')}>{s.recipients.join(', ')}</span> },
            { id: 'format', label: 'Format', get: (s: Schedule) => s.format },
            {
              id: 'active',
              label: 'Active',
              get: (s: Schedule) => (s.active ? 'Yes' : 'No'),
              render: (s: Schedule) => (
                <button type="button" role="switch" aria-checked={s.active} aria-label={s.active ? 'Pause schedule' : 'Resume schedule'} onClick={() => (toggle(s.id), toast({ title: s.active ? 'Schedule paused' : 'Schedule resumed', description: s.name, variant: 'default' }))} className={cn('relative h-6 w-11 rounded-full transition', s.active ? 'bg-brand-600' : 'bg-neutral-300')}>
                  <span className={cn('absolute top-0.5 size-5 rounded-full bg-white shadow transition', s.active ? 'left-[22px]' : 'left-0.5')} />
                </button>
              ),
            },
            {
              id: 'actions',
              label: 'Actions',
              sortable: false,
              get: () => '',
              render: (s: Schedule) => (
                <span className="flex gap-1">
                  <HkButton
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      markRun(s.id)
                      toast({ title: 'Report generated', description: `${s.name} — delivery simulated to ${s.recipients.length} recipient(s).`, variant: 'success' })
                      navigate(`/reports/view${configToSearch(s.config)}`)
                    }}
                  >
                    <Send /> Run now
                  </HkButton>
                  <HkButton size="sm" variant="ghost" onClick={() => (setEditing(s), setOpen(true))} aria-label="Edit schedule">
                    <Pencil />
                  </HkButton>
                  <HkButton size="sm" variant="ghost" onClick={() => toggle(s.id)} aria-label={s.active ? 'Pause' : 'Resume'}>
                    {s.active ? <Pause /> : <Play />}
                  </HkButton>
                  <HkButton size="sm" variant="ghost" className="text-danger-700 hover:bg-danger-50" onClick={() => setDeleting(s)} aria-label="Delete schedule">
                    <Trash2 />
                  </HkButton>
                </span>
              ),
            },
          ]}
        />
      </Panel>
      <ScheduleDialog open={open} onOpenChange={setOpen} initial={editing} />
      <Modal
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Delete schedule?"
        description={deleting ? `“${deleting.name}” will stop running. This can’t be undone.` : ''}
        footer={
          <>
            <HkButton variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </HkButton>
            <HkButton variant="danger" onClick={() => (remove(deleting!.id), setDeleting(null), toast({ title: 'Schedule deleted', variant: 'default' }))}>
              <CalendarClock /> Delete schedule
            </HkButton>
          </>
        }
      />
    </div>
  )
}
