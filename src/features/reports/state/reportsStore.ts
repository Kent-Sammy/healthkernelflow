import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { storage } from '@/lib/storage'
import type { ReportConfig } from '../engine/run'
import { configKey } from '../engine/url'
import { SEED_RETURNS, type RegReturn } from '../data/regulatory'
import { createRng } from '../data/rng'
import { REPORTS } from '../engine/catalogue'
import { DEMO_TODAY, addDays } from '../engine/dates'

export const CURRENT_USER = { name: 'Adaeze Okonkwo', role: 'Group Administrator', initials: 'AO' }

/** The prototype's clock is fixed to the demo "today" so seeded and new records line up. */
export function demoNow(): string {
  const d = new Date()
  return `${DEMO_TODAY} ${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`
}

export interface SavedReport {
  id: string
  name: string
  config: ReportConfig
  createdAt: string
  lastOpened: string
}

export interface HistoryEntry {
  id: string
  config: ReportConfig
  generatedAt: string
  generatedBy: string
  status: 'Completed' | 'Failed' | 'Scheduled run'
  rows?: number
  note?: string
}

export interface AuditEntry {
  id: string
  at: string
  user: string
  role: string
  action: string
  category: 'Generation' | 'Export' | 'Saved reports' | 'Scheduling' | 'Templates' | 'Regulatory workflow'
  target: string
  details: string
  ip: string
  before?: string
  after?: string
}

export interface Schedule {
  id: string
  name: string
  config: ReportConfig
  frequency: 'Daily' | 'Weekly' | 'Monthly'
  time: string
  day: string
  recipients: string[]
  format: 'CSV' | 'PDF'
  active: boolean
  lastRun: string
  lastStatus: 'Delivered' | 'Failed' | 'Not run yet'
  createdBy: string
}

const cfg = (reportId: string, period: ReportConfig['period'], filters: Record<string, string> = {}, extra: Partial<ReportConfig> = {}): ReportConfig => {
  const def = REPORTS.find((r) => r.id === reportId)!
  return { reportId, period, filters, groupBy: def.groupBy, view: def.defaultView ?? 'summary', ...extra }
}

const PEOPLE = [
  { name: 'Adaeze Okonkwo', role: 'Group Administrator' },
  { name: 'Tolu Adebayo', role: 'Finance Manager' },
  { name: 'Ngozi Eze-Williams', role: 'Accountant' },
  { name: 'Dr. Funmilayo Adeyemi', role: 'Medical Director' },
  { name: 'Chukwudi Obi', role: 'Health Records Lead' },
  { name: 'Halima Yusuf', role: 'Quality Officer' },
  { name: 'Tunde Bakare', role: 'Claims Officer' },
  { name: 'Pharm. Kemi Adeleke', role: 'Pharmacy Manager' },
  { name: 'Nkechi Ogbonna', role: 'Nursing Services Lead' },
]

function seedHistory(): HistoryEntry[] {
  const rng = createRng(77)
  const picks: [string, ReportConfig['period'], Record<string, string>?][] = [
    ['billing-summary', 'last_month'], ['daily-collections', 'yesterday'], ['outstanding-balances', 'last12'], ['patient-visits', 'last_month'],
    ['insurance-activity-summary', 'last_month'], ['pharmacy-activity-summary', 'last_month', { facility: 'Crestfield Lekki' }], ['lab-activity-summary', 'last7'],
    ['bed-occupancy', 'last_month'], ['monthly-financial-summary', 'ytd'], ['rejected-claims', 'last_quarter'], ['expiring-medication', 'this_month'],
    ['facility-performance-summary', 'last_quarter'], ['waiting-time-analysis', 'last_month', { facility: 'Crestfield Ikeja' }], ['failed-authentication', 'last7'],
    ['turnaround-time', 'last_month'], ['inventory-summary', 'this_month'], ['payment-reconciliation', 'last_month'], ['overdue-invoices', 'last12'],
    ['diagnosis-summary', 'last_quarter'], ['admissions-summary', 'last_month'], ['nursing-activity', 'last7'], ['supplier-performance-scorecard', 'ytd'],
    ['clinical-documentation-completion', 'last_month'], ['organization-wide-summary', 'ytd'], ['daily-collections', 'last7', { facility: 'Crestfield Abuja (Wuse)' }],
    ['claims-aging', 'last12'], ['stock-reconciliation', 'last_month'], ['malaria-surveillance', 'last12'], ['virtual-consultation-summary', 'last_quarter'],
    ['revenue-by-service', 'last_month'], ['credit-reconciliation', 'last_quarter'], ['integration-activity', 'last30'],
  ]
  return picks.map(([id, p, f], i) => {
    const day = addDays(DEMO_TODAY, -Math.floor(i * 1.3) - 1)
    const failed = i === 9 || i === 22
    const person = PEOPLE[rng.int(0, PEOPLE.length - 1)]
    return {
      id: `HIS-${String(5200 - i).padStart(5, '0')}`,
      config: cfg(id, p, f ?? {}),
      generatedAt: `${day} ${String(rng.int(8, 18)).padStart(2, '0')}:${String(rng.int(0, 59)).padStart(2, '0')}`,
      generatedBy: i % 6 === 1 ? 'Scheduler (automated)' : person.name,
      status: failed ? 'Failed' : i % 6 === 1 ? 'Scheduled run' : 'Completed',
      note: failed ? 'Simulated time-out while generating — retry to complete' : undefined,
    }
  })
}

function seedAudit(): AuditEntry[] {
  const rng = createRng(4242)
  const out: AuditEntry[] = []
  const actions: { action: string; category: AuditEntry['category']; w: number }[] = [
    { action: 'Report generated', category: 'Generation', w: 40 },
    { action: 'Report exported (CSV)', category: 'Export', w: 18 },
    { action: 'Report printed', category: 'Export', w: 5 },
    { action: 'Report configuration saved', category: 'Saved reports', w: 6 },
    { action: 'Saved report renamed', category: 'Saved reports', w: 2 },
    { action: 'Schedule created', category: 'Scheduling', w: 2 },
    { action: 'Scheduled report delivered', category: 'Scheduling', w: 14 },
    { action: 'Schedule paused', category: 'Scheduling', w: 1 },
    { action: 'Template edited', category: 'Templates', w: 2 },
    { action: 'Validation run', category: 'Regulatory workflow', w: 4 },
    { action: 'Return reviewed', category: 'Regulatory workflow', w: 2 },
    { action: 'Return approved', category: 'Regulatory workflow', w: 2 },
    { action: 'Return submitted (simulated)', category: 'Regulatory workflow', w: 1 },
  ]
  for (let i = 0; i < 190; i++) {
    const a = rng.weighted(actions, actions.map((x) => x.w))
    const person = a.action === 'Scheduled report delivered' ? { name: 'Scheduler (automated)', role: 'System' } : PEOPLE[rng.int(0, PEOPLE.length - 1)]
    const rep = REPORTS[rng.int(0, REPORTS.length - 1)]
    const day = addDays(DEMO_TODAY, -rng.int(1, 45))
    const isTemplate = a.category === 'Templates' || a.category === 'Regulatory workflow'
    const tmpl = rng.pick(['Monthly Facility Service Statistics', 'Weekly Notifiable Disease Summary', 'HMO Claims Utilisation Return', 'Quarterly Maternal & Child Health Return', 'Essential Medicines Stock Return'])
    out.push({
      id: `AUD-${String(90000 - i)}`,
      at: `${day} ${String(rng.int(7, 19)).padStart(2, '0')}:${String(rng.int(0, 59)).padStart(2, '0')}`,
      user: person.name,
      role: person.role,
      action: a.action,
      category: a.category,
      target: isTemplate ? tmpl : rep.name,
      details:
        a.action === 'Template edited'
          ? 'Changed section B column mapping'
          : a.action === 'Report exported (CSV)'
            ? `${rng.int(40, 2400)} rows exported`
            : a.action === 'Scheduled report delivered'
              ? `Emailed to ${rng.int(1, 4)} recipient(s) (simulated)`
              : a.action === 'Validation run'
                ? `${rng.int(0, 2)} errors, ${rng.int(0, 4)} warnings`
                : a.category === 'Regulatory workflow'
                  ? 'Workflow status updated'
                  : rng.pick(['Period: Last month', 'Period: This month', 'Period: Year to date', 'Period: Last 7 days']),
      ip: `10.${rng.int(10, 13)}.${rng.int(1, 40)}.${rng.int(2, 250)}`,
      before: a.action === 'Template edited' ? 'Section B ← Admissions by ward' : undefined,
      after: a.action === 'Template edited' ? 'Section B ← Admissions by facility' : undefined,
    })
  }
  return out.sort((x, y) => y.at.localeCompare(x.at))
}

const SEED_SAVED: SavedReport[] = [
  { id: 'SAV-001', name: 'Lekki month-end finance pack', config: cfg('billing-summary', 'last_month', { facility: 'Crestfield Lekki' }), createdAt: '2026-09-02 09:15', lastOpened: '2026-10-01 08:40' },
  { id: 'SAV-002', name: 'Weekly HMO rejections', config: cfg('rejected-claims', 'last7'), createdAt: '2026-08-11 14:02', lastOpened: '2026-10-20 10:11' },
  { id: 'SAV-003', name: 'Morning cash-up – all facilities', config: cfg('daily-collections', 'yesterday'), createdAt: '2026-07-21 07:55', lastOpened: '2026-10-26 08:05' },
  { id: 'SAV-004', name: 'Paediatrics waiting times', config: cfg('waiting-time-analysis', 'this_month', { department: 'Paediatrics' }), createdAt: '2026-09-18 12:30', lastOpened: '2026-10-22 13:44' },
  { id: 'SAV-005', name: 'Expiry watch – Ikeja pharmacy', config: cfg('expiring-medication', 'this_month', { facility: 'Crestfield Ikeja' }, { view: 'detailed' }), createdAt: '2026-10-03 16:20', lastOpened: '2026-10-24 09:30' },
]

const SEED_SCHEDULES: Schedule[] = [
  { id: 'SCH-01', name: 'Daily cash-up', config: cfg('daily-collections', 'yesterday'), frequency: 'Daily', time: '07:00', day: 'Every day', recipients: ['finance@crestfield-demo.ng', 'cfo@crestfield-demo.ng'], format: 'CSV', active: true, lastRun: '2026-10-27 07:00', lastStatus: 'Delivered', createdBy: 'Tolu Adebayo' },
  { id: 'SCH-02', name: 'Pending lab results', config: cfg('pending-tests', 'last7'), frequency: 'Daily', time: '08:00', day: 'Weekdays', recipients: ['lab.lekki@crestfield-demo.ng'], format: 'PDF', active: true, lastRun: '2026-10-27 08:00', lastStatus: 'Delivered', createdBy: 'Chukwudi Obi' },
  { id: 'SCH-03', name: 'Weekly operations review', config: cfg('facility-performance-summary', 'last7'), frequency: 'Weekly', time: '08:30', day: 'Monday', recipients: ['coo@crestfield-demo.ng', 'medical.director@crestfield-demo.ng'], format: 'PDF', active: true, lastRun: '2026-10-26 08:30', lastStatus: 'Delivered', createdBy: 'Adaeze Okonkwo' },
  { id: 'SCH-04', name: 'HMO claims pipeline', config: cfg('insurance-activity-summary', 'last30'), frequency: 'Weekly', time: '09:00', day: 'Wednesday', recipients: ['claims@crestfield-demo.ng'], format: 'CSV', active: true, lastRun: '2026-10-21 09:00', lastStatus: 'Failed', createdBy: 'Tunde Bakare' },
  { id: 'SCH-05', name: 'Low stock & expiry alert', config: cfg('inventory-low-stock', 'this_month'), frequency: 'Weekly', time: '07:30', day: 'Friday', recipients: ['pharmacy@crestfield-demo.ng', 'stores@crestfield-demo.ng'], format: 'CSV', active: true, lastRun: '2026-10-23 07:30', lastStatus: 'Delivered', createdBy: 'Pharm. Kemi Adeleke' },
  { id: 'SCH-06', name: 'Monthly board pack', config: cfg('organization-wide-summary', 'last_month'), frequency: 'Monthly', time: '09:00', day: '1st of month', recipients: ['board@crestfield-demo.ng'], format: 'PDF', active: true, lastRun: '2026-10-01 09:00', lastStatus: 'Delivered', createdBy: 'Adaeze Okonkwo' },
  { id: 'SCH-07', name: 'Monthly financial summary', config: cfg('monthly-financial-summary', 'last_month'), frequency: 'Monthly', time: '10:00', day: '2nd of month', recipients: ['finance@crestfield-demo.ng'], format: 'CSV', active: true, lastRun: '2026-10-02 10:00', lastStatus: 'Delivered', createdBy: 'Tolu Adebayo' },
  { id: 'SCH-08', name: 'Security sign-in review', config: cfg('failed-authentication', 'last7'), frequency: 'Weekly', time: '17:00', day: 'Friday', recipients: ['it.security@crestfield-demo.ng'], format: 'CSV', active: false, lastRun: '2026-09-25 17:00', lastStatus: 'Delivered', createdBy: 'Adaeze Okonkwo' },
]

interface ReportsState {
  saved: SavedReport[]
  history: HistoryEntry[]
  audit: AuditEntry[]
  schedules: Schedule[]
  returns: RegReturn[]
  recents: string[]
  sidebarCollapsed: boolean
  logGeneration: (config: ReportConfig, rows: number, origin?: string) => void
  logAudit: (a: Omit<AuditEntry, 'id' | 'at' | 'user' | 'role' | 'ip'>) => void
  saveReport: (name: string, config: ReportConfig) => string
  renameSaved: (id: string, name: string) => void
  deleteSaved: (id: string) => void
  touchSaved: (id: string) => void
  upsertSchedule: (s: Schedule) => void
  deleteSchedule: (id: string) => void
  toggleSchedule: (id: string) => void
  markScheduleRun: (id: string) => void
  updateReturn: (id: string, patch: Partial<RegReturn>) => void
  toggleSidebar: () => void
  resetDemo: () => void
}

let seq = 1
const nextId = (p: string) => `${p}-${Date.now().toString(36).slice(-5).toUpperCase()}${seq++}`

const initial = () => ({
  saved: SEED_SAVED,
  history: seedHistory(),
  audit: seedAudit(),
  schedules: SEED_SCHEDULES,
  returns: SEED_RETURNS,
  recents: ['billing-summary', 'patient-visits', 'pending-tests', 'insurance-activity-summary'],
  sidebarCollapsed: false,
})

export const useReportsStore = create<ReportsState>()(
  persist(
    (set, get) => ({
      ...initial(),
      logGeneration: (config, rows, origin) => {
        const now = demoNow()
        const last = get().history[0]
        if (last && configKey(last.config) === configKey(config) && last.generatedAt === now) return
        const name = REPORTS.find((r) => r.id === config.reportId)?.name ?? config.reportId
        set((s) => ({
          history: [{ id: nextId('HIS'), config, generatedAt: now, generatedBy: CURRENT_USER.name, status: 'Completed' as const, rows }, ...s.history].slice(0, 300),
          recents: [config.reportId, ...s.recents.filter((r) => r !== config.reportId)].slice(0, 8),
        }))
        get().logAudit({ action: 'Report generated', category: 'Generation', target: name, details: `${rows.toLocaleString()} records${origin ? ` · ${origin}` : ''}` })
      },
      logAudit: (a) =>
        set((s) => ({ audit: [{ id: nextId('AUD'), at: demoNow(), user: CURRENT_USER.name, role: CURRENT_USER.role, ip: '10.10.4.27', ...a }, ...s.audit].slice(0, 1000) })),
      saveReport: (name, config) => {
        const id = nextId('SAV')
        set((s) => ({ saved: [{ id, name, config, createdAt: demoNow(), lastOpened: demoNow() }, ...s.saved] }))
        get().logAudit({ action: 'Report configuration saved', category: 'Saved reports', target: name, details: REPORTS.find((r) => r.id === config.reportId)?.name ?? '' })
        return id
      },
      renameSaved: (id, name) => {
        const old = get().saved.find((x) => x.id === id)
        set((s) => ({ saved: s.saved.map((x) => (x.id === id ? { ...x, name } : x)) }))
        get().logAudit({ action: 'Saved report renamed', category: 'Saved reports', target: name, details: 'Renamed', before: old?.name, after: name })
      },
      deleteSaved: (id) => {
        const old = get().saved.find((x) => x.id === id)
        set((s) => ({ saved: s.saved.filter((x) => x.id !== id) }))
        get().logAudit({ action: 'Saved report deleted', category: 'Saved reports', target: old?.name ?? id, details: 'Removed from saved reports' })
      },
      touchSaved: (id) => set((s) => ({ saved: s.saved.map((x) => (x.id === id ? { ...x, lastOpened: demoNow() } : x)) })),
      upsertSchedule: (sch) => {
        const exists = get().schedules.some((x) => x.id === sch.id)
        set((s) => ({ schedules: exists ? s.schedules.map((x) => (x.id === sch.id ? sch : x)) : [sch, ...s.schedules] }))
        get().logAudit({ action: exists ? 'Schedule updated' : 'Schedule created', category: 'Scheduling', target: sch.name, details: `${sch.frequency} · ${sch.day} at ${sch.time} · ${sch.recipients.length} recipient(s)` })
      },
      deleteSchedule: (id) => {
        const old = get().schedules.find((x) => x.id === id)
        set((s) => ({ schedules: s.schedules.filter((x) => x.id !== id) }))
        get().logAudit({ action: 'Schedule deleted', category: 'Scheduling', target: old?.name ?? id, details: 'Schedule removed' })
      },
      toggleSchedule: (id) => {
        const sch = get().schedules.find((x) => x.id === id)
        set((s) => ({ schedules: s.schedules.map((x) => (x.id === id ? { ...x, active: !x.active } : x)) }))
        if (sch) get().logAudit({ action: sch.active ? 'Schedule paused' : 'Schedule resumed', category: 'Scheduling', target: sch.name, details: '—' })
      },
      markScheduleRun: (id) => {
        const sch = get().schedules.find((x) => x.id === id)
        set((s) => ({ schedules: s.schedules.map((x) => (x.id === id ? { ...x, lastRun: demoNow(), lastStatus: 'Delivered' } : x)) }))
        if (sch) get().logAudit({ action: 'Scheduled report run manually', category: 'Scheduling', target: sch.name, details: `Delivered to ${sch.recipients.length} recipient(s) (simulated — no email sent)` })
      },
      updateReturn: (id, patch) => set((s) => ({ returns: s.returns.map((r) => (r.id === id ? { ...r, ...patch } : r)) })),
      toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      resetDemo: () => set(initial()),
    }),
    { name: 'reports-prototype-v1', storage: createJSONStorage(() => storage.zustandAdapter), version: 1 },
  ),
)
