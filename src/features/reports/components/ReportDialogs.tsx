import { useEffect, useState } from 'react'
import { Modal } from '@/components/ui/Dialog'
import { REPORTS, REPORT_BY_ID } from '../engine/catalogue'
import { configPeriod, defaultConfig, type ReportConfig } from '../engine/run'
import { PERIOD_OPTIONS, periodLabel } from '../engine/period'
import { useReportsStore, CURRENT_USER, type Schedule } from '../state/reportsStore'
import { HkButton, NativeSelect } from './ui'
import { useUiStore } from '@/state/uiStore'

const inputCls = 'h-10 w-full rounded-lg border border-neutral-300 bg-white px-3 text-[13.5px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30'

export function SaveReportDialog({ open, onOpenChange, config }: { open: boolean; onOpenChange: (o: boolean) => void; config: ReportConfig }) {
  const save = useReportsStore((s) => s.saveReport)
  const toast = useUiStore((s) => s.showToast)
  const def = REPORT_BY_ID[config.reportId]
  const suggested = `${def.name} – ${PERIOD_OPTIONS.find((p) => p.value === config.period)?.label ?? 'Custom'}${config.filters.facility ? ` – ${config.filters.facility.replace('Crestfield ', '')}` : ''}`
  const [name, setName] = useState(suggested)
  useEffect(() => {
    if (open) setName(suggested)
  }, [open, suggested])
  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title="Save report configuration"
      description="Saved reports keep the report type, period and filters so anyone can regenerate them with current data. Stored in this browser."
      footer={
        <>
          <HkButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </HkButton>
          <HkButton
            variant="primary"
            disabled={!name.trim()}
            onClick={() => {
              save(name.trim(), config)
              onOpenChange(false)
              toast({ title: 'Report saved', description: `“${name.trim()}” is now in Saved Reports.`, variant: 'success' })
            }}
          >
            Save report
          </HkButton>
        </>
      }
    >
      <label className="flex flex-col gap-1.5">
        <span className="text-[12.5px] font-medium text-neutral-700">Name</span>
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} className={inputCls} maxLength={80} />
      </label>
      <p className="mt-3 text-[12.5px] text-neutral-500">
        {def.name} · {periodLabel(configPeriod(config))}
      </p>
    </Modal>
  )
}

const DAYS: Record<Schedule['frequency'], string[]> = {
  Daily: ['Every day', 'Weekdays'],
  Weekly: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
  Monthly: ['1st of month', '2nd of month', '5th of month', 'Last day of month'],
}

export function ScheduleDialog({ open, onOpenChange, initial, config }: { open: boolean; onOpenChange: (o: boolean) => void; initial?: Schedule; config?: ReportConfig }) {
  const upsert = useReportsStore((s) => s.upsertSchedule)
  const toast = useUiStore((s) => s.showToast)
  const [reportId, setReportId] = useState(initial?.config.reportId ?? config?.reportId ?? 'billing-summary')
  const [name, setName] = useState('')
  const [frequency, setFrequency] = useState<Schedule['frequency']>(initial?.frequency ?? 'Weekly')
  const [day, setDay] = useState(initial?.day ?? 'Monday')
  const [time, setTime] = useState(initial?.time ?? '08:00')
  const [recipients, setRecipients] = useState(initial?.recipients.join(', ') ?? '')
  const [format, setFormat] = useState<Schedule['format']>(initial?.format ?? 'PDF')

  useEffect(() => {
    if (!open) return
    const rid = initial?.config.reportId ?? config?.reportId ?? 'billing-summary'
    setReportId(rid)
    setName(initial?.name ?? REPORT_BY_ID[rid].name)
    setFrequency(initial?.frequency ?? 'Weekly')
    setDay(initial?.day ?? 'Monday')
    setTime(initial?.time ?? '08:00')
    setRecipients(initial?.recipients.join(', ') ?? 'reports@crestfield-demo.ng')
    setFormat(initial?.format ?? 'PDF')
  }, [open, initial, config])

  const emails = recipients.split(/[,;\s]+/).filter(Boolean)
  const invalid = emails.filter((e) => !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(e))
  const periodFor = frequency === 'Daily' ? 'yesterday' : frequency === 'Weekly' ? 'last7' : 'last_month'

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={initial ? 'Edit schedule' : 'Schedule report'}
      description="Simulated in this prototype: schedules are stored in the browser and no emails are sent."
      footer={
        <>
          <HkButton variant="ghost" onClick={() => onOpenChange(false)}>
            Cancel
          </HkButton>
          <HkButton
            variant="primary"
            disabled={!name.trim() || emails.length === 0 || invalid.length > 0}
            onClick={() => {
              const base = initial?.config.reportId === reportId ? initial.config : config?.reportId === reportId ? config : defaultConfig(REPORT_BY_ID[reportId])
              upsert({
                id: initial?.id ?? `SCH-${Date.now().toString(36).toUpperCase()}`,
                name: name.trim(),
                config: { ...base, period: periodFor },
                frequency,
                day,
                time,
                recipients: emails,
                format,
                active: initial?.active ?? true,
                lastRun: initial?.lastRun ?? '',
                lastStatus: initial?.lastStatus ?? 'Not run yet',
                createdBy: initial?.createdBy ?? CURRENT_USER.name,
              })
              onOpenChange(false)
              toast({ title: initial ? 'Schedule updated' : 'Schedule created', description: `${name.trim()} · ${frequency.toLowerCase()} at ${time}`, variant: 'success' })
            }}
          >
            {initial ? 'Save changes' : 'Create schedule'}
          </HkButton>
        </>
      }
    >
      <div className="grid gap-3.5">
        <NativeSelect label="Report" value={reportId} onChange={(e) => (setReportId(e.target.value), setName(REPORT_BY_ID[e.target.value].name))} options={REPORTS.map((r) => ({ value: r.id, label: r.name }))} />
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium text-neutral-700">Schedule name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} />
        </label>
        <div className="grid grid-cols-3 gap-3">
          <NativeSelect label="Frequency" value={frequency} onChange={(e) => (setFrequency(e.target.value as Schedule['frequency']), setDay(DAYS[e.target.value as Schedule['frequency']][0]))} options={['Daily', 'Weekly', 'Monthly'].map((v) => ({ value: v, label: v }))} />
          <NativeSelect label="Runs on" value={day} onChange={(e) => setDay(e.target.value)} options={DAYS[frequency].map((v) => ({ value: v, label: v }))} />
          <label className="flex flex-col gap-1.5">
            <span className="text-[12.5px] font-medium text-neutral-700">Time</span>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className={inputCls} />
          </label>
        </div>
        <label className="flex flex-col gap-1.5">
          <span className="text-[12.5px] font-medium text-neutral-700">Recipients</span>
          <input value={recipients} onChange={(e) => setRecipients(e.target.value)} className={inputCls} placeholder="name@hospital.ng, …" />
          {invalid.length > 0 ? <span className="text-[12px] text-danger-700">Check: {invalid.join(', ')}</span> : <span className="text-[12px] text-neutral-500">Separate addresses with commas.</span>}
        </label>
        <NativeSelect label="Format" value={format} onChange={(e) => setFormat(e.target.value as Schedule['format'])} options={[{ value: 'PDF', label: 'PDF summary' }, { value: 'CSV', label: 'CSV data extract' }]} />
        <p className="rounded-lg bg-[#f3faf9] px-3 py-2 text-[12.5px] text-neutral-600">
          Each run covers <strong>{PERIOD_OPTIONS.find((p) => p.value === periodFor)?.label.toLowerCase()}</strong> relative to the run date.
        </p>
      </div>
    </Modal>
  )
}
