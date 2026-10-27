/**
 * ILLUSTRATIVE regulatory return templates.
 * None of these is an official form of any Nigerian authority. They show
 * how statutory and partner returns could be prepared from HealthKernel
 * data once real templates have been obtained and validated.
 */
import type { Db } from './types'
import { FACILITIES, facilityName } from './reference'
import { AGE_BAND_ORDER } from '../engine/dates'

export interface RegSection {
  title: string
  columns: string[]
  rows: (string | number)[][]
  numeric?: boolean[]
}

export interface RegIssue {
  severity: 'Error' | 'Warning'
  message: string
  count: number
  reportId?: string
}

export interface RegTemplate {
  id: string
  name: string
  shortName: string
  recipient: string
  frequency: 'Weekly' | 'Monthly' | 'Quarterly' | 'Annual'
  version: string
  owner: string
  description: string
  build: (db: Db, from: string, to: string) => RegSection[]
  validate: (db: Db, from: string, to: string) => RegIssue[]
}

const inRange = (d: string, from: string, to: string) => d.slice(0, 10) >= from && d.slice(0, 10) <= to
const nf = (n: number) => Math.round(n)

function visitsIn(db: Db, from: string, to: string) {
  return db.visits.filter((v) => inRange(v.date, from, to) && v.status === 'Completed')
}

function codingIssues(db: Db, from: string, to: string): RegIssue[] {
  const vs = visitsIn(db, from, to)
  const missing = vs.filter((v) => v.codingFlag === 'Missing code').length
  const symptom = vs.filter((v) => v.codingFlag === 'Symptom code only').length
  const out: RegIssue[] = []
  if (missing) out.push({ severity: 'Error', message: 'Completed consultations without an ICD-10 diagnosis code', count: missing, reportId: 'diagnosis-coding-quality' })
  if (symptom) out.push({ severity: 'Warning', message: 'Diagnoses recorded with symptom-only (R-chapter) codes', count: symptom, reportId: 'diagnosis-coding-quality' })
  return out
}

export const REG_TEMPLATES: RegTemplate[] = [
  {
    id: 'mfss',
    name: 'Monthly Facility Service Statistics',
    shortName: 'Service statistics',
    recipient: 'State health authority (illustrative)',
    frequency: 'Monthly',
    version: 'v0.3 draft',
    owner: 'Health Information Management',
    description: 'Outpatient attendance by sex and age band, inpatient activity, leading diagnoses and laboratory workload per facility.',
    build: (db, from, to) => {
      const vs = visitsIn(db, from, to)
      const att = AGE_BAND_ORDER.map((band) => {
        const b = vs.filter((v) => v.ageBand === band)
        return [band, b.filter((v) => v.gender === 'Male').length, b.filter((v) => v.gender === 'Female').length, b.length]
      })
      att.push(['Total', vs.filter((v) => v.gender === 'Male').length, vs.filter((v) => v.gender === 'Female').length, vs.length])
      const adm = db.admissions.filter((a) => inRange(a.admitDate, from, to))
      const dis = db.admissions.filter((a) => a.dischargeDate && inRange(a.dischargeDate, from, to))
      const inpatient = FACILITIES.map((f) => [f.name, adm.filter((a) => a.facility === f.id).length, dis.filter((a) => a.facility === f.id).length, nf((dis.filter((a) => a.facility === f.id).reduce((s, a) => s + a.los, 0) / Math.max(1, dis.filter((a) => a.facility === f.id).length)) * 10) / 10])
      const dx = new Map<string, number>()
      vs.forEach((v) => v.diagnosis && dx.set(`${v.diagnosisCode || '—'} · ${v.diagnosis}`, (dx.get(`${v.diagnosisCode || '—'} · ${v.diagnosis}`) ?? 0) + 1))
      const top = [...dx.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10).map(([k, n], i) => [i + 1, k, n])
      const labs = db.labs.filter((l) => inRange(l.date, from, to) && l.status === 'Completed')
      const cats = [...new Set(labs.map((l) => l.category))].sort().map((c) => [c, labs.filter((l) => l.category === c).length])
      return [
        { title: 'A. Outpatient attendance by age band and sex', columns: ['Age band', 'Male', 'Female', 'Total'], rows: att, numeric: [false, true, true, true] },
        { title: 'B. Inpatient activity by facility', columns: ['Facility', 'Admissions', 'Discharges', 'ALOS (days)'], rows: inpatient, numeric: [false, true, true, true] },
        { title: 'C. Ten leading diagnoses', columns: ['Rank', 'ICD-10 · Diagnosis', 'Cases'], rows: top, numeric: [true, false, true] },
        { title: 'D. Laboratory tests performed', columns: ['Category', 'Tests completed'], rows: cats, numeric: [false, true] },
      ]
    },
    validate: (db, from, to) => {
      const out = codingIssues(db, from, to)
      const pendingOld = db.labs.filter((l) => inRange(l.date, from, to) && (l.status === 'Pending' || l.status === 'In progress')).length
      if (pendingOld) out.push({ severity: 'Warning', message: 'Laboratory requests in the period still without results', count: pendingOld, reportId: 'pending-tests' })
      return out
    },
  },
  {
    id: 'wnds',
    name: 'Weekly Notifiable Disease Summary',
    shortName: 'Disease surveillance',
    recipient: 'Disease surveillance unit (illustrative)',
    frequency: 'Weekly',
    version: 'v0.2 draft',
    owner: 'Clinical Governance',
    description: 'Weekly counts of selected priority conditions by facility for surveillance purposes.',
    build: (db, from, to) => {
      const vs = visitsIn(db, from, to)
      const conds: [string, string[]][] = [
        ['Malaria (B54)', ['B54']],
        ['Typhoid fever (A01.0)', ['A01.0']],
        ['Gastroenteritis (A09)', ['A09']],
        ['Pneumonia (J18.9)', ['J18.9']],
        ['Sickle-cell crisis (D57.0)', ['D57.0']],
      ]
      const rows = conds.map(([label, codes]) => [label, ...FACILITIES.map((f) => vs.filter((v) => v.facility === f.id && codes.includes(v.diagnosisCode)).length), vs.filter((v) => codes.includes(v.diagnosisCode)).length])
      const u5 = conds.map(([label, codes]) => [label, vs.filter((v) => codes.includes(v.diagnosisCode) && v.ageBand === '0–4').length, vs.filter((v) => codes.includes(v.diagnosisCode) && v.ageBand !== '0–4').length])
      return [
        { title: 'A. Cases by facility', columns: ['Condition', ...FACILITIES.map((f) => f.short), 'Total'], rows, numeric: [false, ...FACILITIES.map(() => true), true] },
        { title: 'B. Cases by age group', columns: ['Condition', 'Under 5', '5 and over'], rows: u5, numeric: [false, true, true] },
      ]
    },
    validate: (db, from, to) => codingIssues(db, from, to),
  },
  {
    id: 'qmch',
    name: 'Quarterly Maternal & Child Health Return',
    shortName: 'Maternal & child health',
    recipient: 'State health authority (illustrative)',
    frequency: 'Quarterly',
    version: 'v0.1 draft',
    owner: 'Obstetrics & Paediatrics',
    description: 'Antenatal bookings, deliveries, maternal complications, immunizations and paediatric admissions.',
    build: (db, from, to) => {
      const proc = db.procedures.filter((p) => inRange(p.date, from, to) && p.status === 'Completed')
      const mat = db.admissions.filter((a) => inRange(a.admitDate, from, to) && a.ward.startsWith('Maternity'))
      const paeds = db.admissions.filter((a) => inRange(a.admitDate, from, to) && a.department === 'Paediatrics')
      const rows = FACILITIES.map((f) => [
        f.name,
        proc.filter((p) => p.facility === f.id && p.procedure === 'Antenatal Booking Package').length,
        mat.filter((a) => a.facility === f.id && a.diagnosisCode === 'O80').length,
        mat.filter((a) => a.facility === f.id && a.diagnosisCode === 'O14.9').length,
        mat.filter((a) => a.facility === f.id && a.diagnosisCode === 'O99.0').length,
        proc.filter((p) => p.facility === f.id && p.procedure === 'Childhood Immunization').length,
        paeds.filter((a) => a.facility === f.id).length,
      ])
      return [{ title: 'A. Maternal and child health activity', columns: ['Facility', 'ANC bookings', 'Spontaneous deliveries', 'Pre-eclampsia admissions', 'Anaemia in pregnancy', 'Immunizations', 'Paediatric admissions'], rows, numeric: [false, true, true, true, true, true, true] }]
    },
    validate: (db, from, to) => {
      const mat = db.admissions.filter((a) => inRange(a.admitDate, from, to) && a.ward.startsWith('Maternity') && a.status === 'Admitted').length
      const out: RegIssue[] = []
      if (mat) out.push({ severity: 'Warning', message: 'Maternity patients still admitted — outcomes not yet final', count: mat, reportId: 'current-inpatient-census' })
      return out
    },
  },
  {
    id: 'hmou',
    name: 'HMO Claims Utilisation Return',
    shortName: 'HMO utilisation',
    recipient: 'HMO partners (illustrative)',
    frequency: 'Monthly',
    version: 'v1.0 draft',
    owner: 'Insurance & Claims',
    description: 'Claims volume, value and outcomes per HMO for partner utilisation review.',
    build: (db, from, to) => {
      const cl = db.claims.filter((c) => inRange(c.serviceDate, from, to))
      const hmos = [...new Set(cl.map((c) => c.hmo))].sort()
      const rows = hmos.map((h) => {
        const x = cl.filter((c) => c.hmo === h)
        return [h, x.length, x.reduce((s, c) => s + c.claimed, 0), x.reduce((s, c) => s + c.approved, 0), x.reduce((s, c) => s + c.paid, 0), x.filter((c) => c.status === 'Rejected').length]
      })
      return [{ title: 'A. Claims by HMO (₦)', columns: ['HMO', 'Claims', 'Claimed', 'Approved', 'Paid', 'Rejected'], rows, numeric: [false, true, true, true, true, true] }]
    },
    validate: (db, from, to) => {
      const cl = db.claims.filter((c) => inRange(c.serviceDate, from, to))
      const out: RegIssue[] = []
      const noAuth = cl.filter((c) => c.preAuth === '—').length
      const drafts = cl.filter((c) => c.status === 'Draft').length
      if (noAuth) out.push({ severity: 'Error', message: 'Claims without a pre-authorisation code', count: noAuth, reportId: 'claims-register' })
      if (drafts) out.push({ severity: 'Warning', message: 'Claims still in draft for the period', count: drafts, reportId: 'pending-claims' })
      return out
    },
  },
  {
    id: 'emsr',
    name: 'Essential Medicines Stock Return',
    shortName: 'Medicines stock',
    recipient: 'Pharmacy regulator (illustrative)',
    frequency: 'Monthly',
    version: 'v0.2 draft',
    owner: 'Pharmacy',
    description: 'Stock position, consumption and expiry exposure for tracked essential medicines.',
    build: (db) => {
      const tracked = ['MED-001', 'MED-002', 'MED-005', 'MED-012', 'MED-016', 'MED-018', 'MED-028', 'MED-029', 'MED-034']
      const rows = tracked.map((code) => {
        const lines = db.stock.filter((s) => s.itemCode === code)
        return [lines[0]?.item ?? code, lines.reduce((a, b) => a + b.onHand, 0), lines.filter((l) => l.status !== 'In stock').length, lines.reduce((a, b) => a + b.expiringQty, 0)]
      })
      return [{ title: 'A. Stock position (all facilities)', columns: ['Medicine', 'Units on hand', 'Facilities low / out', 'Units expiring ≤ 90 days'], rows, numeric: [false, true, true, true] }]
    },
    validate: (db) => {
      const out: RegIssue[] = []
      const exp = db.stock.filter((s) => s.kind === 'Medication' && s.expiringQty > 0).length
      const outs = db.stock.filter((s) => s.kind === 'Medication' && s.status === 'Out of stock').length
      if (outs) out.push({ severity: 'Warning', message: 'Medicines out of stock at one or more facilities', count: outs, reportId: 'out-of-stock-items' })
      if (exp) out.push({ severity: 'Warning', message: 'Medicine lines with stock expiring within 90 days', count: exp, reportId: 'expiring-medication' })
      return out
    },
  },
  {
    id: 'rtss',
    name: 'Revenue Summary for Statutory Filing',
    shortName: 'Revenue summary',
    recipient: 'Tax authority (illustrative)',
    frequency: 'Quarterly',
    version: 'v0.1 draft',
    owner: 'Finance',
    description: 'Gross revenue, discounts and net revenue by facility for statutory filing preparation.',
    build: (db, from, to) => {
      const inv = db.invoices.filter((i) => inRange(i.date, from, to))
      const rows = FACILITIES.map((f) => {
        const x = inv.filter((i) => i.facility === f.id)
        return [facilityName(f.id), x.reduce((s, i) => s + i.gross, 0), x.reduce((s, i) => s + i.discount, 0), x.reduce((s, i) => s + i.net, 0)]
      })
      rows.push(['Total', inv.reduce((s, i) => s + i.gross, 0), inv.reduce((s, i) => s + i.discount, 0), inv.reduce((s, i) => s + i.net, 0)])
      return [{ title: 'A. Revenue by facility (₦)', columns: ['Facility', 'Gross', 'Discounts & waivers', 'Net'], rows, numeric: [false, true, true, true] }]
    },
    validate: (db, from, to) => {
      const um = db.payments.filter((p) => inRange(p.date, from, to) && p.reconciliation === 'Unmatched').length
      return um ? [{ severity: 'Warning', message: 'Unallocated bank receipts in the period', count: um, reportId: 'unmatched-payments' }] : []
    },
  },
]

export const REG_TEMPLATE_BY_ID = Object.fromEntries(REG_TEMPLATES.map((t) => [t.id, t]))

export type StageStatus = 'todo' | 'done' | 'warn' | 'fail'

export interface RegReturn {
  id: string
  templateId: string
  periodLabel: string
  from: string
  to: string
  dueDate: string
  preparation: 'Not started' | 'In progress' | 'Complete'
  validation: 'Not run' | 'Passed' | 'Passed with warnings' | 'Failed'
  review: 'Pending' | 'Reviewed' | 'Changes requested'
  approval: 'Pending' | 'Approved'
  submission: 'Not submitted' | 'Submitted (simulated)'
  submissionRef: string
  submittedAt: string
  submittedBy: string
  preparedBy: string
  reviewedBy: string
  approvedBy: string
  lastValidated: string
}

export const SEED_RETURNS: RegReturn[] = [
  { id: 'RET-0141', templateId: 'mfss', periodLabel: 'September 2026', from: '2026-09-01', to: '2026-09-30', dueDate: '2026-10-15', preparation: 'Complete', validation: 'Passed with warnings', review: 'Reviewed', approval: 'Approved', submission: 'Submitted (simulated)', submissionRef: 'SIM-2026-0917', submittedAt: '2026-10-13 16:20', submittedBy: 'Adaeze Okonkwo', preparedBy: 'Chukwudi Obi', reviewedBy: 'Dr. Funmilayo Adeyemi', approvedBy: 'Adaeze Okonkwo', lastValidated: '2026-10-12 11:04' },
  { id: 'RET-0152', templateId: 'mfss', periodLabel: 'October 2026', from: '2026-10-01', to: '2026-10-27', dueDate: '2026-11-15', preparation: 'In progress', validation: 'Not run', review: 'Pending', approval: 'Pending', submission: 'Not submitted', submissionRef: '', submittedAt: '', submittedBy: '', preparedBy: 'Chukwudi Obi', reviewedBy: '', approvedBy: '', lastValidated: '' },
  { id: 'RET-0149', templateId: 'wnds', periodLabel: 'Week ending 25 Oct 2026', from: '2026-10-19', to: '2026-10-25', dueDate: '2026-10-28', preparation: 'Complete', validation: 'Passed with warnings', review: 'Pending', approval: 'Pending', submission: 'Not submitted', submissionRef: '', submittedAt: '', submittedBy: '', preparedBy: 'Halima Yusuf', reviewedBy: '', approvedBy: '', lastValidated: '2026-10-26 09:12' },
  { id: 'RET-0146', templateId: 'wnds', periodLabel: 'Week ending 18 Oct 2026', from: '2026-10-12', to: '2026-10-18', dueDate: '2026-10-21', preparation: 'Complete', validation: 'Passed', review: 'Reviewed', approval: 'Approved', submission: 'Submitted (simulated)', submissionRef: 'SIM-2026-0931', submittedAt: '2026-10-20 10:02', submittedBy: 'Dr. Funmilayo Adeyemi', preparedBy: 'Halima Yusuf', reviewedBy: 'Dr. Funmilayo Adeyemi', approvedBy: 'Dr. Funmilayo Adeyemi', lastValidated: '2026-10-19 15:40' },
  { id: 'RET-0138', templateId: 'qmch', periodLabel: 'Q3 2026 (Jul–Sep)', from: '2026-07-01', to: '2026-09-30', dueDate: '2026-10-31', preparation: 'Complete', validation: 'Passed', review: 'Reviewed', approval: 'Pending', submission: 'Not submitted', submissionRef: '', submittedAt: '', submittedBy: '', preparedBy: 'Nkechi Ogbonna', reviewedBy: 'Dr. Ngozi Eze', approvedBy: '', lastValidated: '2026-10-21 14:30' },
  { id: 'RET-0150', templateId: 'hmou', periodLabel: 'September 2026', from: '2026-09-01', to: '2026-09-30', dueDate: '2026-10-30', preparation: 'Complete', validation: 'Failed', review: 'Changes requested', approval: 'Pending', submission: 'Not submitted', submissionRef: '', submittedAt: '', submittedBy: '', preparedBy: 'Tunde Bakare', reviewedBy: 'Tolu Adebayo', approvedBy: '', lastValidated: '2026-10-24 12:15' },
  { id: 'RET-0151', templateId: 'emsr', periodLabel: 'October 2026', from: '2026-10-01', to: '2026-10-27', dueDate: '2026-11-07', preparation: 'Not started', validation: 'Not run', review: 'Pending', approval: 'Pending', submission: 'Not submitted', submissionRef: '', submittedAt: '', submittedBy: '', preparedBy: '', reviewedBy: '', approvedBy: '', lastValidated: '' },
  { id: 'RET-0139', templateId: 'rtss', periodLabel: 'Q3 2026 (Jul–Sep)', from: '2026-07-01', to: '2026-09-30', dueDate: '2026-11-30', preparation: 'Complete', validation: 'Passed with warnings', review: 'Pending', approval: 'Pending', submission: 'Not submitted', submissionRef: '', submittedAt: '', submittedBy: '', preparedBy: 'Ngozi Eze-Williams', reviewedBy: '', approvedBy: '', lastValidated: '2026-10-22 17:45' },
]
