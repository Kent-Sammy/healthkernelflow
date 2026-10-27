/**
 * Report data sources. Each source exposes rows from the shared demo
 * dataset plus the columns, dimensions (group-by / filter fields) and
 * measures that report definitions can combine. Keeping the maths here
 * means a KPI shown on the overview and the same KPI in a generated
 * report are calculated by exactly the same function.
 */
import type { Db } from '../data/types'
import { FACILITIES, facilityName } from '../data/reference'
import { AGE_BAND_ORDER, AGING_ORDER, TODAY_NUM, dayNum } from './dates'
import type { Fmt } from './format'
import type { Period } from './period'

/* eslint-disable @typescript-eslint/no-explicit-any */
export type Row = any

export interface ColumnDef {
  id: string
  label: string
  get: (r: Row) => unknown
  fmt?: Fmt
}

export interface DimensionDef {
  id: string
  label: string
  get: (r: Row) => string
  order?: string[]
}

export interface MeasureDef {
  id: string
  label: string
  fmt: Fmt
  agg: (rows: Row[], ctx?: AggCtx) => number
  /** Which direction is good — drives delta colouring. */
  better?: 'up' | 'down'
  hint?: string
}

export interface AggCtx {
  period: Period
}

export interface SourceDef {
  id: string
  label: string
  /** Static rows (filtered by the report period on `date`). */
  rows?: (db: Db) => Row[]
  /** Period-dependent derived rows (comparisons, reconciliations). */
  derive?: (db: Db, period: Period) => Row[]
  /** Returns a 'YYYY-MM-DD…' string. Absent for snapshot sources. */
  date?: (r: Row) => string
  dateLabel?: string
  snapshot?: boolean
  /** Force trend buckets to this size (e.g. month-level derived rows). */
  fixedGranularity?: 'month'
  columns: ColumnDef[]
  dims: DimensionDef[]
  measures: MeasureDef[]
  filters: string[]
  defaultColumns: string[]
}

// ----------------------------------------------------------------- helpers
const sum = (rows: Row[], f: (r: Row) => number) => {
  let s = 0
  for (const r of rows) s += f(r) || 0
  return s
}
const count = (rows: Row[], f: (r: Row) => boolean) => {
  let c = 0
  for (const r of rows) if (f(r)) c++
  return c
}
const avg = (rows: Row[], f: (r: Row) => number, where: (r: Row) => boolean = () => true) => {
  let s = 0
  let c = 0
  for (const r of rows)
    if (where(r)) {
      s += f(r)
      c++
    }
  return c ? s / c : NaN
}
const ratio = (a: number, b: number) => (b ? a / b : NaN)
const distinct = (rows: Row[], f: (r: Row) => string) => new Set(rows.map(f)).size
const percentile = (rows: Row[], f: (r: Row) => number, p: number, where: (r: Row) => boolean = () => true) => {
  const vals = rows.filter(where).map(f).sort((a, b) => a - b)
  if (!vals.length) return NaN
  return vals[Math.min(vals.length - 1, Math.floor(p * vals.length))]
}

const c = (id: string, label: string, fmt?: Fmt, get?: (r: Row) => unknown): ColumnDef => ({ id, label, fmt, get: get ?? ((r) => r[id]) })
const d = (id: string, label: string, get?: (r: Row) => string, order?: string[]): DimensionDef => ({ id, label, get: get ?? ((r) => String(r[id] ?? '—')), order })
const m = (id: string, label: string, fmt: Fmt, agg: MeasureDef['agg'], better?: 'up' | 'down', hint?: string): MeasureDef => ({ id, label, fmt, agg, better, hint })

const WEEKDAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
const weekdayOf = (date: string) => WEEKDAYS[new Date(dayNum(date) * 86400000).getUTCDay()]
const WEEKDAY_ORDER = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const hourOf = (date: string) => `${date.slice(11, 13)}:00`
const FAC_ORDER = FACILITIES.map((f) => f.name)

const facilityCol = c('facility', 'Facility', 'text', (r) => facilityName(r.facility))
const facilityDim = d('facility', 'Facility', (r) => facilityName(r.facility), FAC_ORDER)
const monthDim = (get: (r: Row) => string) => d('month', 'Month', (r) => get(r).slice(0, 7))
const weekdayDim = (get: (r: Row) => string) => d('weekday', 'Day of week', (r) => weekdayOf(get(r)), WEEKDAY_ORDER)
const hourDim = (get: (r: Row) => string) => d('hour', 'Hour of day', (r) => hourOf(get(r)))

// ------------------------------------------------------------------ visits
const done = (r: Row) => r.status === 'Completed'
const seen = (r: Row) => r.status === 'Completed' || r.status === 'In progress'

const visits: SourceDef = {
  id: 'visits',
  label: 'Visits & consultations',
  rows: (db) => db.visits,
  date: (r) => r.date,
  dateLabel: 'Visit date',
  columns: [
    c('date', 'Date & time', 'datetime'),
    c('id', 'Visit ID'),
    c('patientId', 'Patient ID'),
    c('patient', 'Patient'),
    c('gender', 'Sex'),
    c('ageBand', 'Age band'),
    facilityCol,
    c('department', 'Department'),
    c('doctor', 'Clinician'),
    c('type', 'Consultation type'),
    c('channel', 'Channel'),
    c('booking', 'Booking'),
    c('status', 'Status', 'status'),
    c('waitMinutes', 'Wait (min)', 'number'),
    c('consultMinutes', 'Consult (min)', 'number'),
    c('diagnosisCode', 'ICD-10'),
    c('diagnosis', 'Primary diagnosis'),
    c('secondaryDiagnosis', 'Secondary diagnosis'),
    c('codingFlag', 'Coding check', 'status'),
    c('documentation', 'Documentation', 'status'),
    c('referralSource', 'Referral source'),
    c('referredOut', 'Referred out to'),
    c('followUp', 'Follow-up'),
    c('payerType', 'Payer type'),
    c('payer', 'Payer'),
    c('fee', 'Consultation fee', 'currency'),
    c('tokens', 'Tokens used', 'number'),
    c('callQuality', 'Call quality'),
    c('invoiceNo', 'Invoice'),
  ],
  dims: [
    facilityDim,
    d('department', 'Department'),
    d('doctor', 'Clinician'),
    d('specialty', 'Specialty'),
    d('type', 'Consultation type'),
    d('channel', 'Channel'),
    d('booking', 'Booking type'),
    d('status', 'Visit status'),
    d('payerType', 'Payer type'),
    d('payer', 'Payer'),
    d('gender', 'Sex'),
    d('ageBand', 'Age band', undefined, AGE_BAND_ORDER),
    d('diagnosis', 'Primary diagnosis'),
    d('codingFlag', 'Coding check'),
    d('documentation', 'Documentation status'),
    d('referralSource', 'Referral source'),
    d('referredOut', 'Referred out to'),
    d('newReturning', 'New vs returning', (r) => (r.isNewPatient ? 'New patient' : 'Returning patient')),
    d('callQuality', 'Call quality'),
    d('waitBand', 'Waiting time band', (r) => (r.waitMinutes <= 15 ? '≤ 15 min' : r.waitMinutes <= 30 ? '16–30 min' : r.waitMinutes <= 60 ? '31–60 min' : '> 60 min'), ['≤ 15 min', '16–30 min', '31–60 min', '> 60 min']),
    monthDim((r) => r.date),
    weekdayDim((r) => r.date),
    hourDim((r) => r.date),
  ],
  measures: [
    m('visits', 'Total visits', 'number', (rs) => rs.length, 'up'),
    m('completed', 'Completed visits', 'number', (rs) => count(rs, done), 'up'),
    m('patients', 'Unique patients', 'number', (rs) => distinct(rs, (r) => r.patientId), 'up'),
    m('newPatients', 'New patients', 'number', (rs) => count(rs, (r) => r.isNewPatient), 'up'),
    m('returning', 'Returning-patient visits', 'number', (rs) => count(rs, (r) => !r.isNewPatient), 'up'),
    m('newShare', 'New-patient share', 'percent', (rs) => ratio(count(rs, (r) => r.isNewPatient), rs.length)),
    m('avgWait', 'Avg waiting time', 'minutes', (rs) => avg(rs, (r) => r.waitMinutes, seen), 'down'),
    m('medianWait', 'Median waiting time', 'minutes', (rs) => percentile(rs, (r) => r.waitMinutes, 0.5, seen), 'down'),
    m('p90Wait', '90th percentile wait', 'minutes', (rs) => percentile(rs, (r) => r.waitMinutes, 0.9, seen), 'down'),
    m('waitOver60', 'Waits over 60 min', 'number', (rs) => count(rs, (r) => seen(r) && r.waitMinutes > 60), 'down'),
    m('avgConsult', 'Avg consultation length', 'minutes', (rs) => avg(rs, (r) => r.consultMinutes, done)),
    m('noShowRate', 'No-show rate', 'percent', (rs) => ratio(count(rs, (r) => r.status === 'No-show'), count(rs, (r) => r.booking === 'Scheduled')), 'down'),
    m('cancelRate', 'Cancellation rate', 'percent', (rs) => ratio(count(rs, (r) => r.status === 'Cancelled'), rs.length), 'down'),
    m('cancelled', 'Cancelled / no-show', 'number', (rs) => count(rs, (r) => r.status === 'Cancelled' || r.status === 'No-show'), 'down'),
    m('docRate', 'Documentation completion', 'percent', (rs) => ratio(count(rs, (r) => done(r) && r.documentation === 'Complete'), count(rs, done)), 'up'),
    m('docIncomplete', 'Incomplete notes', 'number', (rs) => count(rs, (r) => done(r) && r.documentation === 'Incomplete'), 'down'),
    m('codingRate', 'Specific coding rate', 'percent', (rs) => ratio(count(rs, (r) => done(r) && r.codingFlag === 'OK'), count(rs, done)), 'up'),
    m('missingCodes', 'Missing ICD-10 codes', 'number', (rs) => count(rs, (r) => done(r) && r.codingFlag === 'Missing code'), 'down'),
    m('withSecondary', 'With secondary diagnosis', 'number', (rs) => count(rs, (r) => !!r.secondaryCode)),
    m('distinctDx', 'Distinct diagnoses', 'number', (rs) => distinct(rs.filter(done), (r) => r.diagnosis)),
    m('fees', 'Consultation fees', 'currency', (rs) => sum(rs, (r) => r.fee), 'up'),
    m('referralsIn', 'Referrals received', 'number', (rs) => count(rs, (r) => r.type === 'Referral')),
    m('referralsOut', 'Referrals made', 'number', (rs) => count(rs, (r) => r.referredOut !== '—')),
    m('followUps', 'Follow-up visits', 'number', (rs) => count(rs, (r) => r.type === 'Follow-up' || r.type === 'Review')),
    m('followUpsBooked', 'Follow-ups booked', 'number', (rs) => count(rs, (r) => r.followUp === 'Scheduled')),
    m('virtual', 'Virtual consultations', 'number', (rs) => count(rs, (r) => r.channel === 'Virtual')),
    m('tokens', 'Tokens consumed', 'number', (rs) => sum(rs, (r) => r.tokens)),
    m('tokensPerConsult', 'Tokens per consultation', 'decimal', (rs) => ratio(sum(rs, (r) => r.tokens), count(rs, (r) => r.tokens > 0))),
    m('goodCalls', 'Good call quality', 'percent', (rs) => ratio(count(rs, (r) => r.callQuality === 'Good'), count(rs, (r) => r.channel === 'Virtual' && r.status === 'Completed')), 'up'),
    m('doctors', 'Active clinicians', 'number', (rs) => distinct(rs, (r) => r.doctor)),
    m('perDoctor', 'Visits per clinician', 'decimal', (rs) => ratio(count(rs, done), distinct(rs, (r) => r.doctor))),
    m('perDay', 'Visits per day', 'decimal', (rs, ctx) => ratio(rs.length, ctx ? dayNum(ctx.period.to) - dayNum(ctx.period.from) + 1 : 1)),
  ],
  filters: ['facility', 'department', 'doctor', 'type', 'channel', 'status', 'payerType', 'payer'],
  defaultColumns: ['date', 'id', 'patient', 'facility', 'department', 'doctor', 'type', 'status', 'waitMinutes', 'diagnosis', 'payerType'],
}

// ---------------------------------------------------------------- patients
const patients: SourceDef = {
  id: 'patients',
  label: 'Patient registrations',
  rows: (db) => db.patients,
  date: (r) => r.registeredOn,
  dateLabel: 'Registration date',
  columns: [
    c('registeredOn', 'Registered', 'date'),
    c('id', 'Patient ID'),
    c('name', 'Patient'),
    c('gender', 'Sex'),
    c('age', 'Age', 'number'),
    c('ageBand', 'Age band'),
    facilityCol,
    c('city', 'City'),
    c('payerType', 'Payer type'),
    c('payer', 'Payer'),
    c('channel', 'Registration channel'),
  ],
  dims: [
    facilityDim,
    d('gender', 'Sex'),
    d('ageBand', 'Age band', undefined, AGE_BAND_ORDER),
    d('payerType', 'Payer type'),
    d('payer', 'Payer'),
    d('channel', 'Registration channel'),
    d('city', 'City'),
    monthDim((r) => r.registeredOn),
    weekdayDim((r) => r.registeredOn),
  ],
  measures: [
    m('registrations', 'Registrations', 'number', (rs) => rs.length, 'up'),
    m('female', 'Female share', 'percent', (rs) => ratio(count(rs, (r) => r.gender === 'Female'), rs.length)),
    m('children', 'Children (under 15)', 'number', (rs) => count(rs, (r) => r.age < 15)),
    m('elderly', 'Aged 65+', 'number', (rs) => count(rs, (r) => r.age >= 65)),
    m('insured', 'HMO / corporate covered', 'percent', (rs) => ratio(count(rs, (r) => r.payerType !== 'Self-pay'), rs.length)),
    m('avgAge', 'Average age', 'decimal', (rs) => avg(rs, (r) => r.age)),
  ],
  filters: ['facility', 'gender', 'ageBand', 'payerType', 'channel'],
  defaultColumns: ['registeredOn', 'id', 'name', 'gender', 'age', 'facility', 'payerType', 'payer', 'channel'],
}

// -------------------------------------------------------------------- labs
const isPending = (r: Row) => r.status === 'Pending' || r.status === 'In progress'
const labs: SourceDef = {
  id: 'labs',
  label: 'Laboratory & diagnostics',
  rows: (db) => db.labs,
  date: (r) => r.date,
  dateLabel: 'Request date',
  columns: [
    c('date', 'Requested', 'datetime'),
    c('id', 'Request ID'),
    c('patient', 'Patient'),
    c('test', 'Test'),
    c('category', 'Category'),
    facilityCol,
    c('department', 'Requesting dept.'),
    c('clinician', 'Requested by'),
    c('priority', 'Priority', 'status'),
    c('status', 'Status', 'status'),
    c('tatHours', 'TAT (h)', 'decimal'),
    c('targetTat', 'Target (h)', 'number'),
    c('withinTarget', 'Within target', 'status'),
    c('ageHours', 'Pending for (h)', 'decimal'),
    c('resultAt', 'Result released', 'datetime'),
    c('performedAt', 'Performed at'),
    c('price', 'Charge', 'currency'),
  ],
  dims: [
    facilityDim,
    d('department', 'Requesting department'),
    d('clinician', 'Requesting clinician'),
    d('category', 'Test category'),
    d('test', 'Test'),
    d('status', 'Status'),
    d('priority', 'Priority'),
    d('site', 'Performed', (r) => (r.performedAt.startsWith('External') ? 'External referral' : 'In-house')),
    d('performedAt', 'Laboratory'),
    d('withinTarget', 'Within TAT target'),
    monthDim((r) => r.date),
    weekdayDim((r) => r.date),
    hourDim((r) => r.date),
  ],
  measures: [
    m('tests', 'Tests requested', 'number', (rs) => rs.length, 'up'),
    m('completed', 'Completed', 'number', (rs) => count(rs, (r) => r.status === 'Completed'), 'up'),
    m('pending', 'Pending / in progress', 'number', (rs) => count(rs, isPending), 'down'),
    m('cancelled', 'Cancelled', 'number', (rs) => count(rs, (r) => r.status === 'Cancelled'), 'down'),
    m('completionRate', 'Completion rate', 'percent', (rs) => ratio(count(rs, (r) => r.status === 'Completed'), count(rs, (r) => r.status !== 'Cancelled')), 'up'),
    m('avgTat', 'Avg turnaround', 'hours', (rs) => avg(rs, (r) => r.tatHours, (r) => r.status === 'Completed'), 'down'),
    m('medianTat', 'Median turnaround', 'hours', (rs) => percentile(rs, (r) => r.tatHours, 0.5, (r) => r.status === 'Completed'), 'down'),
    m('withinTarget', 'Within TAT target', 'percent', (rs) => ratio(count(rs, (r) => r.withinTarget === 'Yes'), count(rs, (r) => r.status === 'Completed')), 'up'),
    m('breaches', 'TAT breaches', 'number', (rs) => count(rs, (r) => r.withinTarget === 'No'), 'down'),
    m('revenue', 'Laboratory charges', 'currency', (rs) => sum(rs, (r) => (r.status === 'Cancelled' ? 0 : r.price)), 'up'),
    m('external', 'External referrals', 'number', (rs) => count(rs, (r) => r.performedAt.startsWith('External'))),
    m('urgent', 'Urgent requests', 'number', (rs) => count(rs, (r) => r.priority === 'Urgent')),
    m('avgPendingAge', 'Avg age of pending', 'hours', (rs) => avg(rs, (r) => r.ageHours, isPending), 'down'),
    m('patients', 'Patients tested', 'number', (rs) => distinct(rs, (r) => r.patient)),
  ],
  filters: ['facility', 'department', 'clinician', 'category', 'status', 'priority', 'site'],
  defaultColumns: ['date', 'id', 'patient', 'test', 'category', 'facility', 'clinician', 'status', 'tatHours', 'withinTarget', 'price'],
}

// ----------------------------------------------------------- prescriptions
const presented = (r: Row) => r.status !== 'Cancelled' && r.status !== 'Not collected'
const prescriptions: SourceDef = {
  id: 'prescriptions',
  label: 'Prescriptions & dispensing',
  rows: (db) => db.prescriptions,
  date: (r) => r.date,
  dateLabel: 'Prescription date',
  columns: [
    c('date', 'Date', 'datetime'),
    c('id', 'Rx ID'),
    c('patient', 'Patient'),
    c('medication', 'Medication'),
    c('category', 'Class'),
    facilityCol,
    c('department', 'Department'),
    c('doctor', 'Prescriber'),
    c('qtyPrescribed', 'Qty prescribed', 'number'),
    c('qtyDispensed', 'Qty dispensed', 'number'),
    c('status', 'Status', 'status'),
    c('unitPrice', 'Unit price', 'currency'),
    c('revenue', 'Sales value', 'currency'),
    c('cost', 'Cost of goods', 'currency'),
    c('margin', 'Margin', 'currency', (r) => r.revenue - r.cost),
    c('payerType', 'Payer type'),
  ],
  dims: [
    facilityDim,
    d('department', 'Department'),
    d('doctor', 'Prescriber'),
    d('medication', 'Medication'),
    d('category', 'Therapeutic class'),
    d('status', 'Dispensing status'),
    d('payerType', 'Payer type'),
    monthDim((r) => r.date),
    weekdayDim((r) => r.date),
  ],
  measures: [
    m('lines', 'Prescription lines', 'number', (rs) => rs.length, 'up'),
    m('prescriptions', 'Patients served', 'number', (rs) => distinct(rs, (r) => r.patient + r.date.slice(0, 10))),
    m('fulfilment', 'Fulfilment rate', 'percent', (rs) => ratio(count(rs, (r) => r.status === 'Fully dispensed'), count(rs, presented)), 'up'),
    m('stockouts', 'Unfilled – out of stock', 'number', (rs) => count(rs, (r) => r.status === 'Not dispensed – out of stock'), 'down'),
    m('partial', 'Partially dispensed', 'number', (rs) => count(rs, (r) => r.status === 'Partially dispensed'), 'down'),
    m('notCollected', 'Not collected', 'number', (rs) => count(rs, (r) => r.status === 'Not collected'), 'down'),
    m('units', 'Units dispensed', 'number', (rs) => sum(rs, (r) => r.qtyDispensed), 'up'),
    m('revenue', 'Pharmacy sales', 'currency', (rs) => sum(rs, (r) => r.revenue), 'up'),
    m('cost', 'Cost of goods sold', 'currency', (rs) => sum(rs, (r) => r.cost)),
    m('margin', 'Gross margin', 'currency', (rs) => sum(rs, (r) => r.revenue - r.cost), 'up'),
    m('marginPct', 'Margin %', 'percent', (rs) => ratio(sum(rs, (r) => r.revenue - r.cost), sum(rs, (r) => r.revenue)), 'up'),
    m('items', 'Distinct medications', 'number', (rs) => distinct(rs, (r) => r.medication)),
  ],
  filters: ['facility', 'department', 'doctor', 'medication', 'category', 'status', 'payerType'],
  defaultColumns: ['date', 'id', 'patient', 'medication', 'facility', 'doctor', 'qtyPrescribed', 'qtyDispensed', 'status', 'revenue'],
}

// -------------------------------------------------------------- procedures
const procedures: SourceDef = {
  id: 'procedures',
  label: 'Services & procedures',
  rows: (db) => db.procedures,
  date: (r) => r.date,
  dateLabel: 'Order date',
  columns: [
    c('date', 'Ordered', 'datetime'),
    c('id', 'Procedure ID'),
    c('patient', 'Patient'),
    c('procedure', 'Procedure / service'),
    c('category', 'Category'),
    facilityCol,
    c('department', 'Department'),
    c('clinician', 'Clinician'),
    c('status', 'Status', 'status'),
    c('waitDays', 'Wait (days)', 'number'),
    c('cancelReason', 'Cancellation reason'),
    c('price', 'Charge', 'currency'),
  ],
  dims: [facilityDim, d('department', 'Department'), d('clinician', 'Clinician'), d('procedure', 'Procedure / service'), d('category', 'Service category'), d('status', 'Status'), d('cancelReason', 'Cancellation reason'), monthDim((r) => r.date), weekdayDim((r) => r.date)],
  measures: [
    m('count', 'Procedures ordered', 'number', (rs) => rs.length, 'up'),
    m('completed', 'Completed', 'number', (rs) => count(rs, (r) => r.status === 'Completed'), 'up'),
    m('cancelled', 'Cancelled', 'number', (rs) => count(rs, (r) => r.status === 'Cancelled'), 'down'),
    m('scheduled', 'Scheduled (upcoming)', 'number', (rs) => count(rs, (r) => r.status === 'Scheduled')),
    m('cancelRate', 'Cancellation rate', 'percent', (rs) => ratio(count(rs, (r) => r.status === 'Cancelled'), rs.length), 'down'),
    m('revenue', 'Procedure revenue', 'currency', (rs) => sum(rs, (r) => (r.status === 'Completed' ? r.price : 0)), 'up'),
    m('avgWait', 'Avg wait to service', 'days', (rs) => avg(rs, (r) => r.waitDays), 'down'),
    m('waited', 'Deferred to later date', 'number', (rs) => count(rs, (r) => r.waitDays > 0)),
    m('patients', 'Patients served', 'number', (rs) => distinct(rs, (r) => r.patient)),
  ],
  filters: ['facility', 'department', 'clinician', 'category', 'procedure', 'status'],
  defaultColumns: ['date', 'id', 'patient', 'procedure', 'category', 'facility', 'clinician', 'status', 'waitDays', 'price'],
}

// ---------------------------------------------------------------- invoices
const invoiceCols = [
  c('date', 'Invoice date', 'datetime'),
  c('id', 'Invoice no.'),
  c('patient', 'Patient'),
  facilityCol,
  c('department', 'Department'),
  c('source', 'Setting'),
  c('payerType', 'Payer type'),
  c('payer', 'Payer'),
  c('gross', 'Gross', 'currency'),
  c('discount', 'Discount', 'currency'),
  c('net', 'Net billed', 'currency'),
  c('paidNet', 'Paid', 'currency', (r: Row) => r.paid - r.refunded),
  c('adjusted', 'Credits & write-offs', 'currency', (r: Row) => r.credits + r.writtenOff),
  c('balance', 'Balance', 'currency'),
  c('dueDate', 'Due date', 'date'),
  c('ageDays', 'Age (days)', 'number'),
  c('agingBucket', 'Aging bucket'),
  c('status', 'Status', 'status'),
  c('lastPayment', 'Last payment', 'date'),
]
const invoices: SourceDef = {
  id: 'invoices',
  label: 'Invoices & receivables',
  rows: (db) => db.invoices,
  date: (r) => r.date,
  dateLabel: 'Invoice date',
  columns: invoiceCols,
  dims: [
    facilityDim,
    d('department', 'Department'),
    d('source', 'Setting'),
    d('payerType', 'Payer type'),
    d('payer', 'Payer'),
    d('status', 'Invoice status'),
    d('agingBucket', 'Aging bucket', undefined, [...AGING_ORDER, '—']),
    monthDim((r) => r.date),
    weekdayDim((r) => r.date),
  ],
  measures: [
    m('count', 'Invoices raised', 'number', (rs) => rs.length, 'up'),
    m('gross', 'Gross charges', 'currency', (rs) => sum(rs, (r) => r.gross), 'up'),
    m('discount', 'Discounts & waivers', 'currency', (rs) => sum(rs, (r) => r.discount), 'down'),
    m('net', 'Net billed', 'currency', (rs) => sum(rs, (r) => r.net), 'up', 'Gross charges less discounts and waivers'),
    m('paid', 'Collected against invoices', 'currency', (rs) => sum(rs, (r) => r.paid - r.refunded), 'up'),
    m('adjusted', 'Credits & write-offs', 'currency', (rs) => sum(rs, (r) => r.credits + r.writtenOff), 'down'),
    m('balance', 'Outstanding balance', 'currency', (rs) => sum(rs, (r) => r.balance), 'down'),
    m('overdue', 'Overdue amount', 'currency', (rs) => sum(rs, (r) => (r.status === 'Overdue' ? r.balance : 0)), 'down'),
    m('overdueCount', 'Overdue invoices', 'number', (rs) => count(rs, (r) => r.status === 'Overdue'), 'down'),
    m('openCount', 'Open invoices', 'number', (rs) => count(rs, (r) => r.balance > 0), 'down'),
    m('collectionRate', 'Collection rate', 'percent', (rs) => ratio(sum(rs, (r) => r.paid - r.refunded), sum(rs, (r) => r.net)), 'up', 'Collected ÷ net billed for invoices in the period'),
    m('avgInvoice', 'Average invoice', 'currency', (rs) => avg(rs, (r) => r.net)),
    m('avgAge', 'Avg age of open balance', 'days', (rs) => avg(rs, (r) => r.ageDays, (r) => r.balance > 0), 'down'),
    m('over90', 'Balance over 90 days', 'currency', (rs) => sum(rs, (r) => (r.balance > 0 && r.ageDays > 90 ? r.balance : 0)), 'down'),
    m('patients', 'Patients billed', 'number', (rs) => distinct(rs, (r) => r.patientId)),
  ],
  filters: ['facility', 'department', 'payerType', 'payer', 'status', 'source'],
  defaultColumns: ['date', 'id', 'patient', 'facility', 'department', 'payerType', 'net', 'paidNet', 'balance', 'status'],
}

// ---------------------------------------------------------- invoice lines
const invoiceLines: SourceDef = {
  id: 'invoiceLines',
  label: 'Billed services (invoice lines)',
  rows: (db) => {
    const out: Row[] = []
    for (const inv of db.invoices)
      for (const l of inv.lines)
        out.push({ date: inv.date, invoiceNo: inv.id, patient: inv.patient, facility: inv.facility, department: inv.department, payerType: inv.payerType, payer: inv.payer, source: inv.source, service: l.service, category: l.category, qty: l.qty, amount: l.amount })
    return out
  },
  date: (r) => r.date,
  dateLabel: 'Invoice date',
  columns: [
    c('date', 'Invoice date', 'datetime'),
    c('invoiceNo', 'Invoice no.'),
    c('patient', 'Patient'),
    facilityCol,
    c('department', 'Department'),
    c('category', 'Service category'),
    c('service', 'Service'),
    c('qty', 'Qty', 'number'),
    c('amount', 'Gross amount', 'currency'),
    c('payerType', 'Payer type'),
    c('payer', 'Payer'),
  ],
  dims: [facilityDim, d('department', 'Department'), d('category', 'Service category'), d('service', 'Service'), d('payerType', 'Payer type'), d('payer', 'Payer'), d('source', 'Setting'), monthDim((r) => r.date)],
  measures: [
    m('revenue', 'Gross service revenue', 'currency', (rs) => sum(rs, (r) => r.amount), 'up'),
    m('lines', 'Service lines', 'number', (rs) => rs.length, 'up'),
    m('qty', 'Units billed', 'number', (rs) => sum(rs, (r) => r.qty)),
    m('avgLine', 'Average line value', 'currency', (rs) => avg(rs, (r) => r.amount)),
    m('services', 'Distinct services', 'number', (rs) => distinct(rs, (r) => r.service)),
  ],
  filters: ['facility', 'department', 'category', 'payerType', 'payer', 'source'],
  defaultColumns: ['date', 'invoiceNo', 'patient', 'facility', 'department', 'category', 'service', 'qty', 'amount'],
}

// ---------------------------------------------------------------- payments
const payments: SourceDef = {
  id: 'payments',
  label: 'Payments & collections',
  rows: (db) => db.payments,
  date: (r) => r.date,
  dateLabel: 'Payment date',
  columns: [
    c('date', 'Received', 'datetime'),
    c('id', 'Receipt no.'),
    c('invoiceNo', 'Invoice no.'),
    c('patient', 'Patient / payer'),
    facilityCol,
    c('department', 'Department'),
    c('method', 'Method'),
    c('payerType', 'Payer type'),
    c('payer', 'Payer'),
    c('amount', 'Amount', 'currency'),
    c('cashier', 'Received by'),
    c('reconciliation', 'Reconciliation', 'status'),
    c('reference', 'Reference'),
  ],
  dims: [facilityDim, d('department', 'Department'), d('method', 'Payment method'), d('payerType', 'Payer type'), d('payer', 'Payer'), d('cashier', 'Received by'), d('reconciliation', 'Reconciliation status'), monthDim((r) => r.date), weekdayDim((r) => r.date), hourDim((r) => r.date)],
  measures: [
    m('collected', 'Total collections', 'currency', (rs) => sum(rs, (r) => r.amount), 'up'),
    m('receipts', 'Receipts issued', 'number', (rs) => rs.length, 'up'),
    m('avgReceipt', 'Average receipt', 'currency', (rs) => avg(rs, (r) => r.amount)),
    m('matched', 'Matched to invoices', 'currency', (rs) => sum(rs, (r) => (r.reconciliation === 'Matched' ? r.amount : 0)), 'up'),
    m('unmatched', 'Unmatched receipts', 'currency', (rs) => sum(rs, (r) => (r.reconciliation === 'Unmatched' ? r.amount : 0)), 'down'),
    m('unmatchedCount', 'Unmatched count', 'number', (rs) => count(rs, (r) => r.reconciliation === 'Unmatched'), 'down'),
    m('pendingReview', 'Pending review', 'number', (rs) => count(rs, (r) => r.reconciliation === 'Pending review'), 'down'),
    m('matchRate', 'Match rate', 'percent', (rs) => ratio(sum(rs, (r) => (r.reconciliation === 'Matched' ? r.amount : 0)), sum(rs, (r) => r.amount)), 'up'),
    m('hmo', 'HMO remittances', 'currency', (rs) => sum(rs, (r) => (r.method === 'HMO Remittance' ? r.amount : 0))),
    m('cashless', 'Cashless share', 'percent', (rs) => ratio(sum(rs, (r) => (r.method !== 'Cash' ? r.amount : 0)), sum(rs, (r) => r.amount)), 'up'),
  ],
  filters: ['facility', 'method', 'payerType', 'payer', 'reconciliation', 'cashier'],
  defaultColumns: ['date', 'id', 'invoiceNo', 'patient', 'facility', 'method', 'amount', 'cashier', 'reconciliation'],
}

// ------------------------------------------------------------- adjustments
const adjustments: SourceDef = {
  id: 'adjustments',
  label: 'Discounts, refunds & adjustments',
  rows: (db) => db.adjustments,
  date: (r) => r.date,
  dateLabel: 'Posting date',
  columns: [c('date', 'Posted', 'datetime'), c('id', 'Adjustment ID'), c('invoiceNo', 'Invoice no.'), c('patient', 'Patient'), facilityCol, c('department', 'Department'), c('type', 'Type', 'status'), c('reason', 'Reason'), c('amount', 'Amount', 'currency'), c('approvedBy', 'Approved by'), c('payerType', 'Payer type')],
  dims: [facilityDim, d('department', 'Department'), d('type', 'Adjustment type'), d('reason', 'Reason'), d('approvedBy', 'Approver'), d('payerType', 'Payer type'), monthDim((r) => r.date)],
  measures: [
    m('count', 'Adjustments', 'number', (rs) => rs.length),
    m('total', 'Total value', 'currency', (rs) => sum(rs, (r) => r.amount), 'down'),
    m('discounts', 'Discounts', 'currency', (rs) => sum(rs, (r) => (r.type === 'Discount' ? r.amount : 0)), 'down'),
    m('waivers', 'Waivers', 'currency', (rs) => sum(rs, (r) => (r.type === 'Waiver' ? r.amount : 0)), 'down'),
    m('creditNotes', 'Credit notes', 'currency', (rs) => sum(rs, (r) => (r.type === 'Credit Note' ? r.amount : 0)), 'down'),
    m('refunds', 'Refunds paid', 'currency', (rs) => sum(rs, (r) => (r.type === 'Refund' ? r.amount : 0)), 'down'),
    m('refundCount', 'Refunds', 'number', (rs) => count(rs, (r) => r.type === 'Refund')),
    m('writeOffs', 'Write-offs', 'currency', (rs) => sum(rs, (r) => (r.type === 'Write-off' || r.type === 'Claims Adjustment' ? r.amount : 0)), 'down'),
    m('avg', 'Average adjustment', 'currency', (rs) => avg(rs, (r) => r.amount)),
  ],
  filters: ['facility', 'department', 'type', 'approvedBy', 'payerType'],
  defaultColumns: ['date', 'id', 'invoiceNo', 'patient', 'facility', 'type', 'reason', 'amount', 'approvedBy'],
}

// ------------------------------------------------------------------ credits
const credits: SourceDef = {
  id: 'credits',
  label: 'Patient wallet transactions',
  rows: (db) => db.credits,
  date: (r) => r.date,
  dateLabel: 'Transaction date',
  columns: [c('date', 'Date', 'datetime'), c('id', 'Txn ID'), c('accountId', 'Wallet'), c('patient', 'Account holder'), facilityCol, c('creditType', 'Wallet funding', 'status'), c('action', 'Transaction', 'status'), c('amount', 'Amount', 'currency'), c('balanceAfter', 'Balance after', 'currency'), c('reference', 'Reference'), c('by', 'Processed by')],
  dims: [facilityDim, d('creditType', 'Wallet funding'), d('action', 'Transaction type'), d('by', 'Processed by'), monthDim((r) => r.date)],
  measures: [
    m('txns', 'Transactions', 'number', (rs) => rs.length),
    m('issued', 'Credits issued', 'currency', (rs) => sum(rs, (r) => (r.action === 'Issued' ? r.amount : 0))),
    m('utilized', 'Credits utilized', 'currency', (rs) => sum(rs, (r) => (r.action === 'Utilized' ? r.amount : 0))),
    m('adjusted', 'Net adjustments', 'currency', (rs) => sum(rs, (r) => (r.action === 'Adjusted' ? r.amount : 0))),
    m('reversed', 'Credits reversed', 'currency', (rs) => sum(rs, (r) => (r.action === 'Reversed' ? r.amount : 0)), 'down'),
    m('net', 'Net change in balances', 'currency', (rs) => sum(rs, (r) => (r.action === 'Issued' || r.action === 'Adjusted' ? r.amount : -r.amount))),
    m('accounts', 'Wallets active', 'number', (rs) => distinct(rs, (r) => r.accountId)),
    m('utilRate', 'Utilization ratio', 'percent', (rs) => ratio(sum(rs, (r) => (r.action === 'Utilized' ? r.amount : 0)), sum(rs, (r) => (r.action === 'Issued' ? r.amount : 0)))),
  ],
  filters: ['facility', 'creditType', 'action'],
  defaultColumns: ['date', 'id', 'accountId', 'patient', 'facility', 'creditType', 'action', 'amount', 'balanceAfter', 'reference'],
}

const creditAccounts: SourceDef = {
  id: 'creditAccounts',
  label: 'Patient wallet balances',
  snapshot: true,
  rows: (db) => {
    const map = new Map<string, Row>()
    for (const t of db.credits) {
      let a = map.get(t.accountId)
      if (!a) {
        a = { accountId: t.accountId, patient: t.patient, facility: t.facility, creditType: t.creditType, issued: 0, utilized: 0, reversed: 0, adjusted: 0, balance: 0, lastActivity: '', opened: t.date }
        map.set(t.accountId, a)
      }
      if (t.action === 'Issued') a.issued += t.amount
      if (t.action === 'Utilized') a.utilized += t.amount
      if (t.action === 'Reversed') a.reversed += t.amount
      if (t.action === 'Adjusted') a.adjusted += t.amount
      a.balance = t.balanceAfter
      a.lastActivity = t.date
    }
    return [...map.values()].map((a) => ({ ...a, dormantDays: TODAY_NUM - dayNum(a.lastActivity) }))
  },
  columns: [c('accountId', 'Wallet'), c('patient', 'Account holder'), facilityCol, c('creditType', 'Credit type', 'status'), c('opened', 'Opened', 'date'), c('issued', 'Issued', 'currency'), c('utilized', 'Utilized', 'currency'), c('reversed', 'Reversed', 'currency'), c('adjusted', 'Adjusted', 'currency'), c('balance', 'Balance', 'currency'), c('lastActivity', 'Last activity', 'datetime'), c('dormantDays', 'Days since activity', 'number')],
  dims: [facilityDim, d('creditType', 'Credit type'), d('dormancy', 'Activity', (r) => (r.dormantDays > 90 ? 'Dormant (90+ days)' : 'Active'))],
  measures: [
    m('accounts', 'Wallets', 'number', (rs) => rs.length),
    m('balance', 'Outstanding credit', 'currency', (rs) => sum(rs, (r) => r.balance)),
    m('withBalance', 'Wallets with balance', 'number', (rs) => count(rs, (r) => r.balance > 0)),
    m('avgBalance', 'Average balance', 'currency', (rs) => avg(rs, (r) => r.balance, (r) => r.balance > 0)),
    m('dormant', 'Dormant wallets', 'number', (rs) => count(rs, (r) => r.dormantDays > 90 && r.balance > 0), 'down'),
    m('issued', 'Lifetime issued', 'currency', (rs) => sum(rs, (r) => r.issued)),
    m('utilized', 'Lifetime utilized', 'currency', (rs) => sum(rs, (r) => r.utilized)),
  ],
  filters: ['facility', 'creditType', 'dormancy'],
  defaultColumns: ['accountId', 'patient', 'facility', 'creditType', 'issued', 'utilized', 'reversed', 'balance', 'lastActivity'],
}

const creditRecon: SourceDef = {
  id: 'creditRecon',
  label: 'Wallet reconciliation',
  derive: (db, p) => {
    const map = new Map<string, Row>()
    for (const t of db.credits) {
      const day = t.date.slice(0, 10)
      if (day > p.to) continue
      const key = `${t.facility}|${t.creditType}`
      let r = map.get(key)
      if (!r) {
        r = { facility: t.facility, creditType: t.creditType, opening: 0, issued: 0, utilized: 0, adjusted: 0, reversed: 0, closing: 0 }
        map.set(key, r)
      }
      const signed = t.action === 'Issued' || t.action === 'Adjusted' ? t.amount : -t.amount
      if (day < p.from) r.opening += signed
      else {
        if (t.action === 'Issued') r.issued += t.amount
        if (t.action === 'Utilized') r.utilized += t.amount
        if (t.action === 'Adjusted') r.adjusted += t.amount
        if (t.action === 'Reversed') r.reversed += t.amount
      }
      r.closing += signed
    }
    return [...map.values()].map((r) => ({ ...r, variance: r.opening + r.issued - r.utilized + r.adjusted - r.reversed - r.closing }))
  },
  columns: [facilityCol, c('creditType', 'Credit type'), c('opening', 'Opening balance', 'currency'), c('issued', 'Issued', 'currency'), c('utilized', 'Utilized', 'currency'), c('adjusted', 'Adjusted', 'currency'), c('reversed', 'Reversed', 'currency'), c('closing', 'Closing balance', 'currency'), c('variance', 'Variance', 'currency')],
  dims: [facilityDim, d('creditType', 'Credit type')],
  measures: [
    m('opening', 'Opening balance', 'currency', (rs) => sum(rs, (r) => r.opening)),
    m('issued', 'Issued', 'currency', (rs) => sum(rs, (r) => r.issued)),
    m('utilized', 'Utilized', 'currency', (rs) => sum(rs, (r) => r.utilized)),
    m('reversed', 'Reversed', 'currency', (rs) => sum(rs, (r) => r.reversed)),
    m('closing', 'Closing balance', 'currency', (rs) => sum(rs, (r) => r.closing)),
    m('variance', 'Unexplained variance', 'currency', (rs) => sum(rs, (r) => r.variance), 'down'),
  ],
  filters: ['facility', 'creditType'],
  defaultColumns: ['facility', 'creditType', 'opening', 'issued', 'utilized', 'adjusted', 'reversed', 'closing', 'variance'],
}

// --------------------------------------------------------------- admissions
const admissionCols = [
  c('admitDate', 'Admitted', 'datetime'),
  c('id', 'Admission no.'),
  c('patient', 'Patient'),
  c('gender', 'Sex'),
  c('ageBand', 'Age band'),
  facilityCol,
  c('ward', 'Ward'),
  c('bed', 'Bed'),
  c('department', 'Department'),
  c('doctor', 'Admitting clinician'),
  c('source', 'Admission source'),
  c('diagnosis', 'Diagnosis'),
  c('los', 'LOS (days)', 'number'),
  c('status', 'Status', 'status'),
  c('expectedDischarge', 'Expected discharge', 'date'),
  c('dischargeDate', 'Discharged', 'datetime'),
  c('dischargeType', 'Discharge type'),
  c('dischargeDelayHours', 'Discharge delay (h)', 'decimal'),
  c('delayReason', 'Delay reason'),
  c('readmission', 'Readmission ≤30d', 'status'),
  c('payerType', 'Payer type'),
  c('billed', 'Billed', 'currency'),
  c('deposit', 'Deposit taken', 'currency'),
]
const admissionDims = [
  facilityDim,
  d('ward', 'Ward'),
  d('department', 'Department'),
  d('doctor', 'Admitting clinician'),
  d('source', 'Admission source'),
  d('status', 'Status'),
  d('dischargeType', 'Discharge type'),
  d('readmission', 'Readmission'),
  d('payerType', 'Payer type'),
  d('diagnosis', 'Diagnosis'),
  d('gender', 'Sex'),
  d('ageBand', 'Age band', undefined, AGE_BAND_ORDER),
  d('losBand', 'Length of stay', (r: Row) => (r.los <= 2 ? '1–2 days' : r.los <= 4 ? '3–4 days' : r.los <= 7 ? '5–7 days' : '8+ days'), ['1–2 days', '3–4 days', '5–7 days', '8+ days']),
  d('delayBand', 'Discharge delay', (r: Row) => (r.status !== 'Discharged' ? 'Not discharged' : r.dischargeDelayHours <= 2 ? '≤ 2 h' : r.dischargeDelayHours <= 4 ? '2–4 h' : r.dischargeDelayHours <= 8 ? '4–8 h' : '> 8 h'), ['≤ 2 h', '2–4 h', '4–8 h', '> 8 h', 'Not discharged']),
  d('delayReason', 'Delay reason'),
]
const isDischarged = (r: Row) => r.status === 'Discharged'
const admissionMeasures = [
  m('admissions', 'Admissions', 'number', (rs: Row[]) => rs.length, 'up'),
  m('discharges', 'Discharges', 'number', (rs: Row[]) => count(rs, isDischarged)),
  m('current', 'Currently admitted', 'number', (rs: Row[]) => count(rs, (r) => r.status === 'Admitted')),
  m('alos', 'Average length of stay', 'days', (rs: Row[]) => avg(rs, (r) => r.los, isDischarged), 'down'),
  m('readmissions', 'Readmissions (≤30 days)', 'number', (rs: Row[]) => count(rs, (r) => r.readmission === 'Yes'), 'down'),
  m('readmissionRate', 'Readmission rate', 'percent', (rs: Row[]) => ratio(count(rs, (r) => r.readmission === 'Yes'), rs.length), 'down'),
  m('avgDelay', 'Avg discharge delay', 'hours', (rs: Row[]) => avg(rs, (r) => r.dischargeDelayHours, isDischarged), 'down'),
  m('delayed', 'Discharges delayed > 4 h', 'number', (rs: Row[]) => count(rs, (r) => isDischarged(r) && r.dischargeDelayHours > 4), 'down'),
  m('billed', 'Inpatient billing', 'currency', (rs: Row[]) => sum(rs, (r) => r.billed), 'up'),
  m('avgBill', 'Average inpatient bill', 'currency', (rs: Row[]) => avg(rs, (r) => r.billed, isDischarged)),
  m('emergencyShare', 'Via emergency', 'percent', (rs: Row[]) => ratio(count(rs, (r) => r.source === 'Emergency'), rs.length)),
  m('avgDaysIn', 'Avg days in hospital', 'days', (rs: Row[]) => avg(rs, (r) => r.los)),
  m('ama', 'Discharged against advice', 'number', (rs: Row[]) => count(rs, (r) => r.dischargeType === 'Discharged against medical advice'), 'down'),
]
const admissions: SourceDef = {
  id: 'admissions',
  label: 'Admissions',
  rows: (db) => db.admissions,
  date: (r) => r.admitDate,
  dateLabel: 'Admission date',
  columns: admissionCols,
  dims: [...admissionDims, monthDim((r) => r.admitDate), weekdayDim((r) => r.admitDate)],
  measures: admissionMeasures,
  filters: ['facility', 'ward', 'department', 'doctor', 'source', 'status', 'payerType'],
  defaultColumns: ['admitDate', 'id', 'patient', 'facility', 'ward', 'doctor', 'source', 'diagnosis', 'los', 'status'],
}
const discharges: SourceDef = {
  ...admissions,
  id: 'discharges',
  label: 'Discharges',
  rows: (db) => db.admissions.filter(isDischarged),
  date: (r) => r.dischargeDate,
  dateLabel: 'Discharge date',
  dims: [...admissionDims, monthDim((r) => r.dischargeDate), weekdayDim((r) => r.dischargeDate)],
  filters: ['facility', 'ward', 'department', 'doctor', 'dischargeType', 'payerType'],
  defaultColumns: ['dischargeDate', 'id', 'patient', 'facility', 'ward', 'doctor', 'los', 'dischargeType', 'dischargeDelayHours', 'billed'],
}
const inpatients: SourceDef = {
  ...admissions,
  id: 'inpatients',
  label: 'Current inpatients',
  snapshot: true,
  date: undefined,
  rows: (db) => db.admissions.filter((r) => r.status === 'Admitted'),
  filters: ['facility', 'ward', 'department', 'doctor', 'payerType'],
  defaultColumns: ['admitDate', 'id', 'patient', 'facility', 'ward', 'bed', 'doctor', 'diagnosis', 'los', 'expectedDischarge', 'payerType'],
}

const wardDays: SourceDef = {
  id: 'wardDays',
  label: 'Ward census (daily)',
  rows: (db) => db.wardDays,
  date: (r) => r.date,
  dateLabel: 'Census date',
  columns: [c('date', 'Date', 'date'), c('ward', 'Ward'), facilityCol, c('department', 'Department'), c('beds', 'Beds', 'number'), c('occupied', 'Occupied (midnight)', 'number'), c('occ', 'Occupancy', 'percent', (r) => r.occupied / r.beds), c('admissions', 'Admissions', 'number'), c('discharges', 'Discharges', 'number')],
  dims: [facilityDim, d('ward', 'Ward'), d('department', 'Department'), monthDim((r) => r.date), weekdayDim((r) => r.date)],
  measures: [
    m('occupancy', 'Bed occupancy', 'percent', (rs) => ratio(sum(rs, (r) => r.occupied), sum(rs, (r) => r.beds)), 'up'),
    m('bedDays', 'Available bed-days', 'number', (rs) => sum(rs, (r) => r.beds)),
    m('occupiedDays', 'Occupied bed-days', 'number', (rs) => sum(rs, (r) => r.occupied), 'up'),
    m('admissions', 'Admissions', 'number', (rs) => sum(rs, (r) => r.admissions)),
    m('discharges', 'Discharges', 'number', (rs) => sum(rs, (r) => r.discharges)),
    m('beds', 'Bed complement', 'number', (rs) => {
      const days = distinct(rs, (r) => r.date)
      return days ? Math.round(sum(rs, (r) => r.beds) / days) : 0
    }),
    m('avgOccupied', 'Avg occupied beds', 'decimal', (rs) => {
      const days = distinct(rs, (r) => r.date)
      return days ? sum(rs, (r) => r.occupied) / days : NaN
    }),
    m('turnover', 'Bed turnover', 'decimal', (rs) => {
      const days = distinct(rs, (r) => r.date)
      const beds = days ? sum(rs, (r) => r.beds) / days : 0
      return ratio(sum(rs, (r) => r.discharges), beds)
    }, 'up', 'Discharges per available bed'),
    m('fullDays', 'Ward-days at 100%', 'number', (rs) => count(rs, (r) => r.occupied >= r.beds), 'down'),
  ],
  filters: ['facility', 'ward', 'department'],
  defaultColumns: ['date', 'ward', 'facility', 'beds', 'occupied', 'occ', 'admissions', 'discharges'],
}

const transfers: SourceDef = {
  id: 'transfers',
  label: 'Patient transfers',
  rows: (db) => db.transfers,
  date: (r) => r.date,
  dateLabel: 'Transfer date',
  columns: [c('date', 'Transferred', 'datetime'), c('id', 'Transfer ID'), c('admissionId', 'Admission no.'), c('patient', 'Patient'), facilityCol, c('fromWard', 'From ward'), c('toWard', 'To ward'), c('reason', 'Reason')],
  dims: [facilityDim, d('fromWard', 'From ward'), d('toWard', 'To ward'), d('reason', 'Reason'), monthDim((r) => r.date)],
  measures: [m('transfers', 'Transfers', 'number', (rs) => rs.length), m('patients', 'Patients transferred', 'number', (rs) => distinct(rs, (r) => r.patient))],
  filters: ['facility', 'fromWard', 'toWard', 'reason'],
  defaultColumns: ['date', 'id', 'admissionId', 'patient', 'facility', 'fromWard', 'toWard', 'reason'],
}

// ------------------------------------------------------------------ nursing
const nursing: SourceDef = {
  id: 'nursing',
  label: 'Nursing shifts',
  rows: (db) => db.nursing,
  date: (r) => r.date,
  dateLabel: 'Shift date',
  columns: [c('date', 'Shift start', 'datetime'), c('shift', 'Shift'), facilityCol, c('ward', 'Ward'), c('nurse', 'Nurse in charge'), c('patients', 'Patients', 'number'), c('tasksScheduled', 'Tasks scheduled', 'number'), c('tasksCompleted', 'Completed', 'number'), c('tasksDelayed', 'Delayed', 'number'), c('tasksMissed', 'Missed', 'number'), c('rate', 'Completion', 'percent', (r) => r.tasksCompleted / r.tasksScheduled), c('vitalsRecorded', 'Vitals sets', 'number'), c('medsAdministered', 'Med rounds', 'number')],
  dims: [facilityDim, d('ward', 'Ward'), d('department', 'Department'), d('nurse', 'Nurse'), d('shift', 'Shift'), monthDim((r) => r.date), weekdayDim((r) => r.date)],
  measures: [
    m('shifts', 'Shifts covered', 'number', (rs) => rs.length),
    m('patientShifts', 'Patient-shifts', 'number', (rs) => sum(rs, (r) => r.patients)),
    m('scheduled', 'Care tasks scheduled', 'number', (rs) => sum(rs, (r) => r.tasksScheduled)),
    m('completedTasks', 'Care tasks completed', 'number', (rs) => sum(rs, (r) => r.tasksCompleted), 'up'),
    m('completion', 'Task completion rate', 'percent', (rs) => ratio(sum(rs, (r) => r.tasksCompleted), sum(rs, (r) => r.tasksScheduled)), 'up'),
    m('missed', 'Missed tasks', 'number', (rs) => sum(rs, (r) => r.tasksMissed), 'down'),
    m('delayed', 'Delayed tasks', 'number', (rs) => sum(rs, (r) => r.tasksDelayed), 'down'),
    m('vitals', 'Vital-sign sets recorded', 'number', (rs) => sum(rs, (r) => r.vitalsRecorded), 'up'),
    m('meds', 'Medication rounds', 'number', (rs) => sum(rs, (r) => r.medsAdministered), 'up'),
    m('perShift', 'Patients per shift', 'decimal', (rs) => ratio(sum(rs, (r) => r.patients), rs.length)),
    m('nurses', 'Nurses rostered', 'number', (rs) => distinct(rs, (r) => r.nurse)),
  ],
  filters: ['facility', 'ward', 'nurse', 'shift'],
  defaultColumns: ['date', 'shift', 'facility', 'ward', 'nurse', 'patients', 'tasksScheduled', 'tasksCompleted', 'tasksMissed', 'rate'],
}

// -------------------------------------------------------------------- stock
const stock: SourceDef = {
  id: 'stock',
  label: 'Stock on hand',
  snapshot: true,
  rows: (db) => db.stock,
  columns: [
    c('itemCode', 'Code'),
    c('item', 'Item'),
    c('kind', 'Type'),
    c('category', 'Category'),
    facilityCol,
    c('onHand', 'On hand', 'number'),
    c('unit', 'Unit'),
    c('reorderLevel', 'Reorder level', 'number'),
    c('avgDailyUse', 'Avg daily use', 'decimal'),
    c('daysOfCover', 'Days of cover', 'number'),
    c('unitCost', 'Unit cost', 'currency'),
    c('value', 'Stock value', 'currency'),
    c('nearestExpiry', 'Nearest expiry', 'date'),
    c('daysToExpiry', 'Days to expiry', 'number'),
    c('expiringQty', 'Qty expiring ≤90d', 'number'),
    c('status', 'Status', 'status'),
    c('supplier', 'Preferred supplier'),
  ],
  dims: [
    facilityDim,
    d('kind', 'Item type'),
    d('category', 'Category'),
    d('item', 'Item'),
    d('status', 'Stock status', undefined, ['Out of stock', 'Low stock', 'In stock']),
    d('supplier', 'Preferred supplier'),
    d('expiryBand', 'Expiry window', (r) => (!r.onHand ? 'No stock' : r.daysToExpiry <= 30 ? '≤ 30 days' : r.daysToExpiry <= 90 ? '31–90 days' : r.daysToExpiry <= 180 ? '91–180 days' : '> 180 days'), ['≤ 30 days', '31–90 days', '91–180 days', '> 180 days', 'No stock']),
  ],
  measures: [
    m('skus', 'Stock lines', 'number', (rs) => rs.length),
    m('units', 'Units on hand', 'number', (rs) => sum(rs, (r) => r.onHand)),
    m('value', 'Inventory value', 'currency', (rs) => sum(rs, (r) => r.value)),
    m('low', 'Low-stock lines', 'number', (rs) => count(rs, (r) => r.status === 'Low stock'), 'down'),
    m('out', 'Out-of-stock lines', 'number', (rs) => count(rs, (r) => r.status === 'Out of stock'), 'down'),
    m('expiring', 'Lines expiring ≤90d', 'number', (rs) => count(rs, (r) => r.expiringQty > 0), 'down'),
    m('expiringValue', 'Value expiring ≤90d', 'currency', (rs) => sum(rs, (r) => r.expiringQty * r.unitCost), 'down'),
    m('avgCover', 'Median days of cover', 'number', (rs) => percentile(rs, (r) => Math.min(r.daysOfCover, 365), 0.5)),
    m('retailValue', 'Retail value', 'currency', (rs) => sum(rs, (r) => r.onHand * r.unitPrice)),
  ],
  filters: ['facility', 'kind', 'category', 'status', 'supplier'],
  defaultColumns: ['itemCode', 'item', 'category', 'facility', 'onHand', 'reorderLevel', 'daysOfCover', 'value', 'nearestExpiry', 'status'],
}

const movements: SourceDef = {
  id: 'movements',
  label: 'Stock movements',
  rows: (db) => db.movements,
  date: (r) => r.date,
  dateLabel: 'Movement date',
  columns: [c('date', 'Date', 'datetime'), c('id', 'Movement ID'), c('item', 'Item'), c('kind', 'Type'), c('category', 'Category'), facilityCol, c('type', 'Movement', 'status'), c('qty', 'Qty', 'number'), c('value', 'Value', 'currency'), c('department', 'Department / store'), c('reference', 'Reference'), c('by', 'Recorded by'), c('balanceAfter', 'Balance after', 'number')],
  dims: [facilityDim, d('kind', 'Item type'), d('category', 'Category'), d('item', 'Item'), d('type', 'Movement type'), d('department', 'Department / store'), d('by', 'Recorded by'), monthDim((r) => r.date), weekdayDim((r) => r.date)],
  measures: [
    m('movements', 'Movements', 'number', (rs) => rs.length),
    m('unitsIn', 'Units in', 'number', (rs) => sum(rs, (r) => (r.qty > 0 ? r.qty : 0))),
    m('unitsOut', 'Units out', 'number', (rs) => sum(rs, (r) => (r.qty < 0 ? -r.qty : 0))),
    m('valueIn', 'Value received / in', 'currency', (rs) => sum(rs, (r) => (r.qty > 0 ? r.value : 0))),
    m('valueOut', 'Value consumed / out', 'currency', (rs) => sum(rs, (r) => (r.qty < 0 ? -r.value : 0))),
    m('consumption', 'Consumption value', 'currency', (rs) => sum(rs, (r) => (r.type === 'Dispensed' || r.type === 'Issued' ? -r.value : 0))),
    m('consumedUnits', 'Units consumed', 'number', (rs) => sum(rs, (r) => (r.type === 'Dispensed' || r.type === 'Issued' ? -r.qty : 0))),
    m('wastage', 'Wastage value', 'currency', (rs) => sum(rs, (r) => (r.type === 'Damaged' || r.type === 'Expired' ? -r.value : 0)), 'down'),
    m('wastageUnits', 'Units wasted', 'number', (rs) => sum(rs, (r) => (r.type === 'Damaged' || r.type === 'Expired' ? -r.qty : 0)), 'down'),
    m('adjustNet', 'Net adjustment value', 'currency', (rs) => sum(rs, (r) => (r.type === 'Adjustment' ? r.value : 0))),
    m('adjustCount', 'Adjustments', 'number', (rs) => count(rs, (r) => r.type === 'Adjustment')),
    m('transfers', 'Transfer movements', 'number', (rs) => count(rs, (r) => r.type === 'Transfer in' || r.type === 'Transfer out')),
    m('received', 'Value received', 'currency', (rs) => sum(rs, (r) => (r.type === 'Received' ? r.value : 0))),
    m('items', 'Items moved', 'number', (rs) => distinct(rs, (r) => r.item)),
  ],
  filters: ['facility', 'kind', 'category', 'item', 'type', 'department'],
  defaultColumns: ['date', 'id', 'item', 'facility', 'type', 'qty', 'value', 'department', 'reference', 'balanceAfter'],
}

const purchaseOrders: SourceDef = {
  id: 'purchaseOrders',
  label: 'Local purchase orders (LPOs)',
  rows: (db) => db.purchaseOrders,
  date: (r) => r.date,
  dateLabel: 'LPO date',
  columns: [c('date', 'LPO date', 'date'), c('id', 'LPO no.'), c('supplier', 'Supplier'), facilityCol, c('item', 'Item'), c('category', 'Category'), c('qtyOrdered', 'Ordered', 'number'), c('qtyReceived', 'Received', 'number'), c('amount', 'LPO value', 'currency'), c('approvalDate', 'Approved', 'date'), c('approvedBy', 'Approved by'), c('expectedDate', 'Expected', 'date'), c('deliveredDate', 'Delivered', 'date'), c('onTime', 'On time', 'status'), c('delayDays', 'Delay (days)', 'number'), c('status', 'Status', 'status'), c('paymentDate', 'Paid on', 'date')],
  dims: [facilityDim, d('supplier', 'Supplier'), d('kind', 'Item type'), d('category', 'Category'), d('status', 'LPO status'), d('onTime', 'Delivered on time'), d('approvedBy', 'Approved by'), monthDim((r) => r.date)],
  measures: [
    m('pos', 'LPOs raised', 'number', (rs) => rs.length),
    m('value', 'LPO value', 'currency', (rs) => sum(rs, (r) => r.amount)),
    m('delivered', 'Deliveries', 'number', (rs) => count(rs, (r) => !!r.deliveredDate)),
    m('onTimeRate', 'On-time delivery', 'percent', (rs) => ratio(count(rs, (r) => r.onTime === 'Yes'), count(rs, (r) => !!r.deliveredDate)), 'up'),
    m('avgDelay', 'Avg delay (late orders)', 'days', (rs) => avg(rs, (r) => r.delayDays, (r) => r.delayDays > 0), 'down'),
    m('fillRate', 'Order fill rate', 'percent', (rs) => ratio(sum(rs, (r) => (r.deliveredDate ? r.qtyReceived : 0)), sum(rs, (r) => (r.deliveredDate ? r.qtyOrdered : 0))), 'up'),
    m('paid', 'Paid to suppliers', 'currency', (rs) => sum(rs, (r) => (r.status === 'Paid' ? Math.round((r.amount * r.qtyReceived) / r.qtyOrdered) : 0))),
    m('payable', 'Awaiting payment', 'currency', (rs) => sum(rs, (r) => (r.status === 'Delivered' || r.status === 'Partially delivered' ? Math.round((r.amount * r.qtyReceived) / r.qtyOrdered) : 0)), 'down'),
    m('open', 'Open LPOs', 'number', (rs) => count(rs, (r) => !r.deliveredDate)),
    m('suppliers', 'Suppliers used', 'number', (rs) => distinct(rs, (r) => r.supplier)),
  ],
  filters: ['facility', 'supplier', 'kind', 'category', 'status', 'onTime'],
  defaultColumns: ['date', 'id', 'supplier', 'facility', 'item', 'qtyOrdered', 'qtyReceived', 'amount', 'deliveredDate', 'onTime', 'status'],
}

// ------------------------------------------------------------------- claims
const claims: SourceDef = {
  id: 'claims',
  label: 'HMO claims',
  rows: (db) => db.claims,
  date: (r) => r.serviceDate,
  dateLabel: 'Service date',
  columns: [c('serviceDate', 'Service date', 'date'), c('id', 'Claim no.'), c('invoiceNo', 'Invoice no.'), c('hmo', 'HMO'), c('enrolleeId', 'Enrollee ID'), c('patient', 'Enrollee'), facilityCol, c('department', 'Department'), c('preAuth', 'Pre-auth code'), c('claimed', 'Claimed', 'currency'), c('tariff', 'Tariff value', 'currency'), c('approved', 'Approved', 'currency'), c('paid', 'Paid', 'currency'), c('outstanding', 'Outstanding', 'currency'), c('status', 'Status', 'status'), c('submittedDate', 'Submitted', 'date'), c('vettedDate', 'Vetted', 'date'), c('paidDate', 'Paid on', 'date'), c('rejectionReason', 'Rejection / variance reason'), c('ageDays', 'Age (days)', 'number'), c('agingBucket', 'Aging bucket')],
  dims: [d('hmo', 'HMO'), facilityDim, d('department', 'Department'), d('status', 'Claim status', undefined, ['Draft', 'Submitted', 'Under review', 'Approved', 'Partially approved', 'Rejected', 'Paid']), d('rejectionReason', 'Rejection / variance reason'), d('agingBucket', 'Aging bucket', undefined, AGING_ORDER), monthDim((r) => r.serviceDate)],
  measures: [
    m('claims', 'Claims', 'number', (rs) => rs.length),
    m('claimed', 'Amount claimed', 'currency', (rs) => sum(rs, (r) => r.claimed)),
    m('approved', 'Amount approved', 'currency', (rs) => sum(rs, (r) => r.approved)),
    m('paid', 'Amount paid', 'currency', (rs) => sum(rs, (r) => r.paid), 'up'),
    m('outstanding', 'Outstanding reimbursement', 'currency', (rs) => sum(rs, (r) => r.outstanding), 'down'),
    m('pending', 'Pending claims', 'number', (rs) => count(rs, (r) => ['Draft', 'Submitted', 'Under review'].includes(r.status)), 'down'),
    m('submitted', 'Submitted to HMO', 'number', (rs) => count(rs, (r) => !!r.submittedDate)),
    m('rejected', 'Rejected claims', 'number', (rs) => count(rs, (r) => r.status === 'Rejected'), 'down'),
    m('rejectedValue', 'Value rejected', 'currency', (rs) => sum(rs, (r) => (r.vettedDate ? r.claimed - r.approved : 0)), 'down'),
    m('approvalRate', 'Approval ratio (value)', 'percent', (rs) => ratio(sum(rs, (r) => (r.vettedDate ? r.approved : 0)), sum(rs, (r) => (r.vettedDate ? r.claimed : 0))), 'up'),
    m('rejectionRate', 'Rejection rate', 'percent', (rs) => ratio(count(rs, (r) => r.status === 'Rejected'), count(rs, (r) => !!r.vettedDate)), 'down'),
    m('daysToPay', 'Avg days to payment', 'days', (rs) => avg(rs, (r) => dayNum(r.paidDate) - dayNum(r.serviceDate), (r) => !!r.paidDate), 'down'),
    m('tariffVariance', 'Tariff variance', 'currency', (rs) => sum(rs, (r) => r.claimed - r.tariff), 'down'),
    m('varianceClaims', 'Claims above tariff', 'number', (rs) => count(rs, (r) => r.tariff < r.claimed), 'down'),
  ],
  filters: ['hmo', 'facility', 'department', 'status', 'agingBucket'],
  defaultColumns: ['serviceDate', 'id', 'hmo', 'patient', 'facility', 'claimed', 'approved', 'paid', 'outstanding', 'status'],
}

// -------------------------------------------------------------------- staff
const staff: SourceDef = {
  id: 'staff',
  label: 'Users & staff',
  snapshot: true,
  rows: (db) => db.staff,
  columns: [c('id', 'User ID'), c('name', 'Name'), c('role', 'Job role'), c('accessRole', 'Access role'), c('department', 'Department'), facilityCol, c('status', 'Account status', 'status'), c('mfa', 'MFA', 'status'), c('createdOn', 'Created', 'date'), c('lastLogin', 'Last login', 'datetime'), c('logins30d', 'Logins (30d)', 'number')],
  dims: [facilityDim, d('role', 'Job role'), d('accessRole', 'Access role'), d('department', 'Department'), d('status', 'Account status'), d('mfa', 'MFA status'), d('activity', 'Activity (30d)', (r) => (r.logins30d > 0 ? 'Active in last 30 days' : 'No login in 30 days'))],
  measures: [
    m('users', 'User accounts', 'number', (rs) => rs.length),
    m('active', 'Active accounts', 'number', (rs) => count(rs, (r) => r.status === 'Active')),
    m('inactive', 'Suspended / deactivated', 'number', (rs) => count(rs, (r) => r.status === 'Suspended' || r.status === 'Deactivated')),
    m('invited', 'Pending invitations', 'number', (rs) => count(rs, (r) => r.status === 'Invited')),
    m('mfaRate', 'MFA adoption', 'percent', (rs) => ratio(count(rs, (r) => r.mfa === 'Enabled'), rs.length), 'up'),
    m('active30', 'Logged in (30d)', 'number', (rs) => count(rs, (r) => r.logins30d > 0)),
    m('roles', 'Access roles in use', 'number', (rs) => distinct(rs, (r) => r.accessRole)),
  ],
  filters: ['facility', 'role', 'accessRole', 'status', 'mfa'],
  defaultColumns: ['id', 'name', 'role', 'accessRole', 'department', 'facility', 'status', 'mfa', 'lastLogin'],
}

const logins: SourceDef = {
  id: 'logins',
  label: 'Authentication events',
  rows: (db) => db.logins,
  date: (r) => r.date,
  dateLabel: 'Event time',
  columns: [c('date', 'Time', 'datetime'), c('id', 'Event ID'), c('user', 'User'), c('role', 'Role'), facilityCol, c('outcome', 'Outcome', 'status'), c('reason', 'Failure reason'), c('device', 'Device'), c('ip', 'IP address')],
  dims: [facilityDim, d('role', 'Role'), d('outcome', 'Outcome'), d('reason', 'Failure reason'), d('device', 'Device'), d('user', 'User'), d('ip', 'IP address'), weekdayDim((r) => r.date), hourDim((r) => r.date)],
  measures: [
    m('attempts', 'Sign-in attempts', 'number', (rs) => rs.length),
    m('success', 'Successful sign-ins', 'number', (rs) => count(rs, (r) => r.outcome === 'Success')),
    m('failed', 'Failed attempts', 'number', (rs) => count(rs, (r) => r.outcome === 'Failed'), 'down'),
    m('failRate', 'Failure rate', 'percent', (rs) => ratio(count(rs, (r) => r.outcome === 'Failed'), rs.length), 'down'),
    m('users', 'Distinct users', 'number', (rs) => distinct(rs, (r) => r.user)),
    m('external', 'From external IPs', 'number', (rs) => count(rs, (r) => !r.ip.startsWith('10.')), 'down'),
  ],
  filters: ['facility', 'role', 'outcome', 'reason', 'device'],
  defaultColumns: ['date', 'user', 'role', 'facility', 'outcome', 'reason', 'device', 'ip'],
}

const security: SourceDef = {
  id: 'security',
  label: 'Security & administrative events',
  rows: (db) => db.security,
  date: (r) => r.date,
  dateLabel: 'Event time',
  columns: [c('date', 'Time', 'datetime'), c('id', 'Event ID'), c('actor', 'Performed by'), facilityCol, c('category', 'Category'), c('action', 'Action'), c('target', 'Target'), c('details', 'Details'), c('severity', 'Severity', 'status')],
  dims: [d('category', 'Category'), d('action', 'Action'), d('severity', 'Severity', undefined, ['High', 'Medium', 'Low']), d('actor', 'Performed by'), facilityDim, monthDim((r) => r.date)],
  measures: [
    m('events', 'Events', 'number', (rs) => rs.length),
    m('high', 'High-severity events', 'number', (rs) => count(rs, (r) => r.severity === 'High'), 'down'),
    m('access', 'Access changes', 'number', (rs) => count(rs, (r) => r.category === 'Access change')),
    m('permissions', 'Permission changes', 'number', (rs) => count(rs, (r) => r.category === 'Permission change')),
    m('exports', 'Data exports', 'number', (rs) => count(rs, (r) => r.category === 'Report export')),
    m('admin', 'Administrative actions', 'number', (rs) => count(rs, (r) => r.category === 'Administrative')),
    m('actors', 'Distinct administrators', 'number', (rs) => distinct(rs, (r) => r.actor)),
  ],
  filters: ['category', 'action', 'severity', 'actor', 'facility'],
  defaultColumns: ['date', 'actor', 'facility', 'category', 'action', 'target', 'details', 'severity'],
}

const integrations: SourceDef = {
  id: 'integrations',
  label: 'Integration runs',
  rows: (db) => db.integrations,
  date: (r) => r.date,
  dateLabel: 'Run time',
  columns: [c('date', 'Run time', 'datetime'), c('id', 'Run ID'), c('integration', 'Integration'), c('direction', 'Direction'), c('records', 'Records', 'number'), c('failed', 'Failed records', 'number'), c('status', 'Status', 'status'), c('durationSec', 'Duration (s)', 'number'), c('error', 'Error'), c('reconciled', 'Reconciliation', 'status')],
  dims: [d('integration', 'Integration'), d('direction', 'Direction'), d('status', 'Run status'), d('error', 'Error'), d('reconciled', 'Reconciliation result'), monthDim((r) => r.date), weekdayDim((r) => r.date)],
  measures: [
    m('runs', 'Sync runs', 'number', (rs) => rs.length),
    m('successRate', 'Run success rate', 'percent', (rs) => ratio(count(rs, (r) => r.status === 'Success'), rs.length), 'up'),
    m('failedRuns', 'Failed runs', 'number', (rs) => count(rs, (r) => r.status === 'Failed'), 'down'),
    m('partialRuns', 'Partial runs', 'number', (rs) => count(rs, (r) => r.status === 'Partial'), 'down'),
    m('records', 'Records processed', 'number', (rs) => sum(rs, (r) => r.records)),
    m('failedRecords', 'Records failed', 'number', (rs) => sum(rs, (r) => r.failed), 'down'),
    m('recordSuccess', 'Record success rate', 'percent', (rs) => ratio(sum(rs, (r) => r.records - r.failed), sum(rs, (r) => r.records)), 'up'),
    m('avgDuration', 'Avg run duration', 'number', (rs) => avg(rs, (r) => r.durationSec), 'down'),
    m('variances', 'Reconciliation variances', 'number', (rs) => count(rs, (r) => r.reconciled === 'Variance'), 'down'),
    m('balanced', 'Balanced reconciliations', 'number', (rs) => count(rs, (r) => r.reconciled === 'Balanced'), 'up'),
  ],
  filters: ['integration', 'direction', 'status', 'reconciled'],
  defaultColumns: ['date', 'integration', 'direction', 'records', 'failed', 'status', 'durationSec', 'error'],
}

// -------------------------------------------------------- derived sources
const inPeriod = (date: string, p: Period) => {
  const day = date.slice(0, 10)
  return day >= p.from && day <= p.to
}

function scorecard(db: Db, p: Period, keyOf: 'facility' | 'department') {
  const keys = keyOf === 'facility' ? FACILITIES.map((f) => f.id) : [...new Set(db.visits.map((v) => v.department))]
  const init = () => ({ visits: 0, completed: 0, newPatients: 0, waitSum: 0, waitN: 0, docDone: 0, revenue: 0, collections: 0, outstanding: 0, labs: 0, labDone: 0, tatSum: 0, rx: 0, rxFull: 0, rxPresented: 0, pharmacySales: 0, admissions: 0, occupied: 0, bedDays: 0, claims: 0, stockValue: 0 })
  const acc = new Map(keys.map((k) => [k, init()]))
  const get = (k: string) => acc.get(k)
  for (const v of db.visits) {
    if (!inPeriod(v.date, p)) continue
    const a = get(v[keyOf])!
    a.visits++
    if (v.status === 'Completed') {
      a.completed++
      if (v.documentation === 'Complete') a.docDone++
    }
    if (v.isNewPatient) a.newPatients++
    if (v.status === 'Completed' || v.status === 'In progress') {
      a.waitSum += v.waitMinutes
      a.waitN++
    }
  }
  for (const i of db.invoices) {
    if (!inPeriod(i.date, p)) continue
    const a = get(i[keyOf])
    if (!a) continue
    a.revenue += i.net
    a.outstanding += i.balance
  }
  for (const pm of db.payments) {
    if (!inPeriod(pm.date, p)) continue
    const a = get(pm[keyOf])
    if (a) a.collections += pm.amount
  }
  for (const l of db.labs) {
    if (!inPeriod(l.date, p)) continue
    const a = get(l[keyOf])!
    a.labs++
    if (l.status === 'Completed') {
      a.labDone++
      a.tatSum += l.tatHours
    }
  }
  for (const r of db.prescriptions) {
    if (!inPeriod(r.date, p)) continue
    const a = get(r[keyOf])!
    a.rx++
    a.pharmacySales += r.revenue
    if (r.status !== 'Cancelled' && r.status !== 'Not collected') a.rxPresented++
    if (r.status === 'Fully dispensed') a.rxFull++
  }
  for (const ad of db.admissions) {
    if (!inPeriod(ad.admitDate, p)) continue
    const a = get(ad[keyOf])
    if (a) a.admissions++
  }
  for (const w of db.wardDays) {
    if (!inPeriod(w.date, p)) continue
    const a = get(w[keyOf])
    if (!a) continue
    a.occupied += w.occupied
    a.bedDays += w.beds
  }
  for (const cl of db.claims) {
    if (!inPeriod(cl.serviceDate, p)) continue
    const a = get(cl[keyOf])
    if (a) a.claims += cl.claimed
  }
  if (keyOf === 'facility') for (const s of db.stock) get(s.facility)!.stockValue += s.value
  return keys.map((k) => {
    const a = acc.get(k)!
    return {
      key: k,
      facility: keyOf === 'facility' ? k : 'All',
      department: keyOf === 'department' ? k : 'All',
      visits: a.visits,
      completed: a.completed,
      newPatients: a.newPatients,
      avgWait: a.waitN ? a.waitSum / a.waitN : NaN,
      docRate: a.completed ? a.docDone / a.completed : NaN,
      revenue: a.revenue,
      collections: a.collections,
      outstanding: a.outstanding,
      revenuePerVisit: a.completed ? a.revenue / a.completed : NaN,
      labs: a.labs,
      avgTat: a.labDone ? a.tatSum / a.labDone : NaN,
      rx: a.rx,
      fulfilment: a.rxPresented ? a.rxFull / a.rxPresented : NaN,
      pharmacySales: a.pharmacySales,
      admissions: a.admissions,
      occupancy: a.bedDays ? a.occupied / a.bedDays : NaN,
      claims: a.claims,
      stockValue: a.stockValue,
    }
  })
}

const scoreColumns = (first: ColumnDef) => [
  first,
  c('visits', 'Visits', 'number'),
  c('newPatients', 'New patients', 'number'),
  c('avgWait', 'Avg wait', 'minutes'),
  c('revenue', 'Net billed', 'currency'),
  c('collections', 'Collections', 'currency'),
  c('outstanding', 'Outstanding (period invoices)', 'currency'),
  c('revenuePerVisit', 'Billed per visit*', 'currency'),
  c('labs', 'Lab tests', 'number'),
  c('avgTat', 'Avg lab TAT', 'hours'),
  c('rx', 'Rx lines', 'number'),
  c('fulfilment', 'Rx fulfilment', 'percent'),
  c('pharmacySales', 'Pharmacy sales', 'currency'),
  c('admissions', 'Admissions', 'number'),
  c('occupancy', 'Bed occupancy', 'percent'),
  c('claims', 'HMO claims value', 'currency'),
  c('docRate', 'Documentation', 'percent'),
  c('stockValue', 'Inventory value (now)', 'currency'),
]
const scoreMeasures = [
  m('visits', 'Patient visits', 'number', (rs: Row[]) => sum(rs, (r) => r.visits), 'up'),
  m('newPatients', 'New patients', 'number', (rs: Row[]) => sum(rs, (r) => r.newPatients), 'up'),
  m('revenue', 'Net billed', 'currency', (rs: Row[]) => sum(rs, (r) => r.revenue), 'up'),
  m('collections', 'Collections', 'currency', (rs: Row[]) => sum(rs, (r) => r.collections), 'up'),
  m('outstanding', 'Outstanding (period invoices)', 'currency', (rs: Row[]) => sum(rs, (r) => r.outstanding), 'down'),
  m('labs', 'Lab tests', 'number', (rs: Row[]) => sum(rs, (r) => r.labs), 'up'),
  m('rx', 'Prescription lines', 'number', (rs: Row[]) => sum(rs, (r) => r.rx), 'up'),
  m('pharmacySales', 'Pharmacy sales', 'currency', (rs: Row[]) => sum(rs, (r) => r.pharmacySales), 'up'),
  m('admissions', 'Admissions', 'number', (rs: Row[]) => sum(rs, (r) => r.admissions), 'up'),
  m('claims', 'HMO claims value', 'currency', (rs: Row[]) => sum(rs, (r) => r.claims)),
  m('stockValue', 'Inventory value', 'currency', (rs: Row[]) => sum(rs, (r) => r.stockValue)),
  m('avgWait', 'Avg wait (unweighted)', 'minutes', (rs: Row[]) => avg(rs, (r) => r.avgWait, (r) => Number.isFinite(r.avgWait)), 'down'),
  m('occupancy', 'Bed occupancy (avg)', 'percent', (rs: Row[]) => avg(rs, (r) => r.occupancy, (r) => Number.isFinite(r.occupancy)), 'up'),
]

const facilityScorecard: SourceDef = {
  id: 'facilityScorecard',
  label: 'Facility scorecard',
  derive: (db, p) => scorecard(db, p, 'facility'),
  columns: scoreColumns(facilityCol),
  dims: [facilityDim],
  measures: scoreMeasures,
  filters: ['facility'],
  defaultColumns: ['facility', 'visits', 'newPatients', 'revenue', 'collections', 'outstanding', 'labs', 'pharmacySales', 'admissions', 'occupancy', 'avgWait'],
}

const departmentScorecard: SourceDef = {
  id: 'departmentScorecard',
  label: 'Department scorecard',
  derive: (db, p) => scorecard(db, p, 'department'),
  columns: scoreColumns(c('department', 'Department')),
  dims: [d('department', 'Department')],
  measures: scoreMeasures,
  filters: ['department'],
  defaultColumns: ['department', 'visits', 'newPatients', 'avgWait', 'revenue', 'collections', 'revenuePerVisit', 'labs', 'rx', 'admissions', 'docRate'],
}

/** Clinician capacity: 16 consultation slots per clinic day worked. */
const doctorUtilization: SourceDef = {
  id: 'doctorUtilization',
  label: 'Clinician availability & utilization',
  derive: (db, p) => {
    const map = new Map<string, Row>()
    for (const v of db.visits) {
      if (!inPeriod(v.date, p)) continue
      let r = map.get(v.doctor)
      if (!r) {
        r = { doctor: v.doctor, facility: v.facility, department: v.department, days: new Set<string>(), booked: 0, seen: 0, noShow: 0, virtual: 0, minutes: 0 }
        map.set(v.doctor, r)
      }
      r.days.add(v.date.slice(0, 10))
      r.booked++
      if (v.status === 'Completed') {
        r.seen++
        r.minutes += v.consultMinutes
      }
      if (v.status === 'No-show') r.noShow++
      if (v.channel === 'Virtual') r.virtual++
    }
    const workdays = (() => {
      let n = 0
      for (let d0 = dayNum(p.from); d0 <= dayNum(p.to); d0++) if (new Date(d0 * 86400000).getUTCDay() !== 0) n++
      return n
    })()
    return [...map.values()].map((r) => ({ ...r, clinicDays: r.days.size, availability: r.days.size / Math.max(1, workdays), capacity: r.days.size * 16, utilization: r.seen / (r.days.size * 16), perDay: r.seen / r.days.size, days: undefined }))
  },
  columns: [c('doctor', 'Clinician'), facilityCol, c('department', 'Department'), c('clinicDays', 'Clinic days', 'number'), c('availability', 'Availability', 'percent'), c('capacity', 'Slot capacity', 'number'), c('booked', 'Booked', 'number'), c('seen', 'Seen', 'number'), c('noShow', 'No-shows', 'number'), c('virtual', 'Virtual', 'number'), c('perDay', 'Patients / day', 'decimal'), c('utilization', 'Utilization', 'percent')],
  dims: [facilityDim, d('department', 'Department'), d('doctor', 'Clinician'), d('utilBand', 'Utilization band', (r) => (r.utilization >= 0.85 ? 'High (≥85%)' : r.utilization >= 0.6 ? 'Optimal (60–85%)' : 'Under-utilized (<60%)'), ['High (≥85%)', 'Optimal (60–85%)', 'Under-utilized (<60%)'])],
  measures: [
    m('clinicians', 'Clinicians', 'number', (rs) => rs.length),
    m('clinicDays', 'Clinic days worked', 'number', (rs) => sum(rs, (r) => r.clinicDays)),
    m('capacity', 'Slot capacity', 'number', (rs) => sum(rs, (r) => r.capacity)),
    m('seen', 'Patients seen', 'number', (rs) => sum(rs, (r) => r.seen), 'up'),
    m('utilization', 'Overall utilization', 'percent', (rs) => ratio(sum(rs, (r) => r.seen), sum(rs, (r) => r.capacity)), 'up'),
    m('availability', 'Avg availability', 'percent', (rs) => avg(rs, (r) => r.availability)),
    m('perDay', 'Patients per clinic day', 'decimal', (rs) => ratio(sum(rs, (r) => r.seen), sum(rs, (r) => r.clinicDays))),
  ],
  filters: ['facility', 'department', 'utilBand'],
  defaultColumns: ['doctor', 'facility', 'department', 'clinicDays', 'availability', 'capacity', 'seen', 'noShow', 'perDay', 'utilization'],
}

/** Month × facility financial roll-up (cash basis for collections). */
const monthlyFinance: SourceDef = {
  id: 'monthlyFinance',
  label: 'Monthly financial summary',
  fixedGranularity: 'month',
  derive: (db, p) => {
    const map = new Map<string, Row>()
    const key = (month: string, f: string) => {
      const k = `${month}|${f}`
      let r = map.get(k)
      if (!r) {
        r = { month, facility: f, gross: 0, discount: 0, net: 0, collections: 0, refunds: 0, writeOffs: 0, invoices: 0, openBalance: 0 }
        map.set(k, r)
      }
      return r
    }
    for (const i of db.invoices) {
      if (!inPeriod(i.date, p)) continue
      const r = key(i.date.slice(0, 7), i.facility)
      r.gross += i.gross
      r.discount += i.discount
      r.net += i.net
      r.invoices++
      r.openBalance += i.balance
    }
    for (const pm of db.payments) if (inPeriod(pm.date, p)) key(pm.date.slice(0, 7), pm.facility).collections += pm.amount
    for (const a of db.adjustments) {
      if (!inPeriod(a.date, p)) continue
      const r = key(a.date.slice(0, 7), a.facility)
      if (a.type === 'Refund') r.refunds += a.amount
      if (a.type === 'Write-off' || a.type === 'Claims Adjustment') r.writeOffs += a.amount
    }
    return [...map.values()].map((r) => ({ ...r, date: `${r.month}-01`, netCollections: r.collections - r.refunds, collectionRatio: r.net ? (r.collections - r.refunds) / r.net : NaN })).sort((a, b) => a.month.localeCompare(b.month))
  },
  date: (r) => r.date,
  columns: [c('month', 'Month'), facilityCol, c('invoices', 'Invoices', 'number'), c('gross', 'Gross charges', 'currency'), c('discount', 'Discounts & waivers', 'currency'), c('net', 'Net billed', 'currency'), c('collections', 'Cash collected', 'currency'), c('refunds', 'Refunds', 'currency'), c('netCollections', 'Net collections', 'currency'), c('writeOffs', 'Write-offs', 'currency'), c('collectionRatio', 'Cash ÷ billed', 'percent'), c('openBalance', 'Still outstanding', 'currency')],
  dims: [facilityDim, d('month', 'Month')],
  measures: [
    m('gross', 'Gross charges', 'currency', (rs) => sum(rs, (r) => r.gross), 'up'),
    m('discount', 'Discounts & waivers', 'currency', (rs) => sum(rs, (r) => r.discount), 'down'),
    m('net', 'Net billed', 'currency', (rs) => sum(rs, (r) => r.net), 'up'),
    m('collections', 'Cash collected', 'currency', (rs) => sum(rs, (r) => r.collections), 'up'),
    m('refunds', 'Refunds', 'currency', (rs) => sum(rs, (r) => r.refunds), 'down'),
    m('netCollections', 'Net collections', 'currency', (rs) => sum(rs, (r) => r.netCollections), 'up'),
    m('writeOffs', 'Write-offs', 'currency', (rs) => sum(rs, (r) => r.writeOffs), 'down'),
    m('ratio', 'Cash ÷ billed', 'percent', (rs) => ratio(sum(rs, (r) => r.netCollections), sum(rs, (r) => r.net)), 'up'),
    m('openBalance', 'Still outstanding', 'currency', (rs) => sum(rs, (r) => r.openBalance), 'down'),
  ],
  filters: ['facility'],
  defaultColumns: ['month', 'facility', 'invoices', 'gross', 'discount', 'net', 'collections', 'refunds', 'netCollections', 'writeOffs', 'collectionRatio'],
}

/** Daily cash-up: one row per facility per day. */
const dailyCollections: SourceDef = {
  id: 'dailyCollections',
  label: 'Daily cash-up',
  derive: (db, p) => {
    const map = new Map<string, Row>()
    for (const pm of db.payments) {
      if (!inPeriod(pm.date, p)) continue
      const k = `${pm.date.slice(0, 10)}|${pm.facility}`
      let r = map.get(k)
      if (!r) {
        r = { date: pm.date.slice(0, 10), facility: pm.facility, receipts: 0, cash: 0, card: 0, transfer: 0, ussd: 0, remittance: 0, credit: 0, deposit: 0, total: 0 }
        map.set(k, r)
      }
      r.receipts++
      r.total += pm.amount
      if (pm.method === 'Cash') r.cash += pm.amount
      else if (pm.method === 'POS / Card') r.card += pm.amount
      else if (pm.method === 'Bank Transfer') r.transfer += pm.amount
      else if (pm.method === 'USSD / Mobile') r.ussd += pm.amount
      else if (pm.method === 'Patient Wallet') r.credit += pm.amount
      else if (pm.method === 'Deposit Applied') r.deposit += pm.amount
      else r.remittance += pm.amount
    }
    return [...map.values()].sort((a, b) => b.date.localeCompare(a.date))
  },
  date: (r) => r.date,
  columns: [c('date', 'Date', 'date'), facilityCol, c('receipts', 'Receipts', 'number'), c('cash', 'Cash', 'currency'), c('card', 'POS / Card', 'currency'), c('transfer', 'Bank transfer', 'currency'), c('ussd', 'USSD / Mobile', 'currency'), c('credit', 'Patient wallet', 'currency'), c('deposit', 'Deposits applied', 'currency'), c('remittance', 'HMO / corporate', 'currency'), c('total', 'Total', 'currency')],
  dims: [facilityDim, weekdayDim((r) => r.date)],
  measures: [
    m('total', 'Total collected', 'currency', (rs) => sum(rs, (r) => r.total), 'up'),
    m('cash', 'Cash in till', 'currency', (rs) => sum(rs, (r) => r.cash)),
    m('electronic', 'Electronic (card, transfer, USSD)', 'currency', (rs) => sum(rs, (r) => r.card + r.transfer + r.ussd)),
    m('remittance', 'HMO / corporate remittances', 'currency', (rs) => sum(rs, (r) => r.remittance)),
    m('receipts', 'Receipts', 'number', (rs) => sum(rs, (r) => r.receipts)),
    m('avgDay', 'Average per facility-day', 'currency', (rs) => avg(rs, (r) => r.total)),
  ],
  filters: ['facility'],
  defaultColumns: ['date', 'facility', 'receipts', 'cash', 'card', 'transfer', 'ussd', 'credit', 'deposit', 'remittance', 'total'],
}

/** Book reconciliation per facility × item: opening + in − out = closing. */
const stockRecon: SourceDef = {
  id: 'stockRecon',
  label: 'Stock reconciliation',
  derive: (db, p) => {
    const map = new Map<string, Row>()
    for (const mv of db.movements) {
      const day = mv.date.slice(0, 10)
      if (day > p.to) continue
      const k = `${mv.facility}|${mv.itemCode}`
      let r = map.get(k)
      if (!r) {
        r = { facility: mv.facility, itemCode: mv.itemCode, item: mv.item, kind: mv.kind, category: mv.category, unitCost: mv.unitCost, opening: mv.balanceAfter - mv.qty, received: 0, transferIn: 0, consumed: 0, transferOut: 0, adjustments: 0, wastage: 0, returned: 0, closing: 0 }
        map.set(k, r)
      }
      if (day < p.from) {
        r.opening = mv.balanceAfter
        r.closing = mv.balanceAfter
        continue
      }
      if (mv.type === 'Received') r.received += mv.qty
      else if (mv.type === 'Transfer in') r.transferIn += mv.qty
      else if (mv.type === 'Dispensed' || mv.type === 'Issued') r.consumed -= mv.qty
      else if (mv.type === 'Transfer out') r.transferOut -= mv.qty
      else if (mv.type === 'Adjustment') r.adjustments += mv.qty
      else if (mv.type === 'Damaged' || mv.type === 'Expired') r.wastage -= mv.qty
      else if (mv.type === 'Returned') r.returned += mv.qty
      r.closing = mv.balanceAfter
    }
    return [...map.values()].map((r) => {
      const expected = r.opening + r.received + r.transferIn + r.returned + r.adjustments - r.consumed - r.transferOut - r.wastage
      const avgStock = (r.opening + r.closing) / 2
      return { ...r, expected, variance: r.closing - expected, closingValue: r.closing * r.unitCost, consumedValue: r.consumed * r.unitCost, turnover: avgStock > 0 ? r.consumed / avgStock : NaN, status: r.closing - expected === 0 ? 'Balanced' : 'Variance' }
    })
  },
  columns: [c('itemCode', 'Code'), c('item', 'Item'), c('category', 'Category'), facilityCol, c('opening', 'Opening', 'number'), c('received', 'Received', 'number'), c('transferIn', 'Transfer in', 'number'), c('returned', 'Returns', 'number'), c('consumed', 'Consumed', 'number'), c('transferOut', 'Transfer out', 'number'), c('wastage', 'Wastage', 'number'), c('adjustments', 'Count adj.', 'number'), c('expected', 'Expected', 'number'), c('closing', 'Closing (book)', 'number'), c('variance', 'Variance', 'number'), c('status', 'Result', 'status'), c('turnover', 'Turnover', 'decimal'), c('closingValue', 'Closing value', 'currency')],
  dims: [facilityDim, d('kind', 'Item type'), d('category', 'Category'), d('item', 'Item'), d('status', 'Reconciliation result')],
  measures: [
    m('lines', 'Items reconciled', 'number', (rs) => rs.length),
    m('balanced', 'Balanced lines', 'number', (rs) => count(rs, (r) => r.variance === 0), 'up'),
    m('consumedValue', 'Consumption value', 'currency', (rs) => sum(rs, (r) => r.consumedValue)),
    m('closingValue', 'Closing stock value', 'currency', (rs) => sum(rs, (r) => r.closingValue)),
    m('adjustUnits', 'Net count adjustments (units)', 'number', (rs) => sum(rs, (r) => r.adjustments)),
    m('wastageUnits', 'Units wasted', 'number', (rs) => sum(rs, (r) => r.wastage), 'down'),
    m('turnover', 'Median turnover', 'decimal', (rs) => percentile(rs, (r) => r.turnover, 0.5, (r) => Number.isFinite(r.turnover)), 'up', 'Consumption ÷ average stock for the period'),
    m('slow', 'Slow movers (turnover < 0.5)', 'number', (rs) => count(rs, (r) => Number.isFinite(r.turnover) && r.turnover < 0.5), 'down'),
  ],
  filters: ['facility', 'kind', 'category', 'status'],
  defaultColumns: ['item', 'facility', 'opening', 'received', 'transferIn', 'consumed', 'transferOut', 'wastage', 'adjustments', 'closing', 'variance', 'status'],
}

// --------------------------------------------------------- deposits
const depositAccounts: SourceDef = {
  id: 'depositAccounts',
  label: 'Admission deposits',
  rows: (db) => db.deposits,
  date: (r) => r.collectedOn,
  dateLabel: 'Date collected',
  columns: [c('collectedOn', 'Collected', 'datetime'), c('id', 'Deposit no.'), c('admissionId', 'Admission no.'), c('patient', 'Patient'), facilityCol, c('ward', 'Ward'), c('collected', 'Initial deposit', 'currency'), c('topUps', 'Top-ups', 'currency'), c('total', 'Total deposited', 'currency', (r) => r.collected + r.topUps), c('billed', 'Final bill', 'currency'), c('applied', 'Applied to bill', 'currency'), c('refundedAll', 'Refunded / to wallet', 'currency', (r) => r.refunded + r.movedToWallet), c('held', 'Still held', 'currency'), c('balanceDue', 'Bill balance due', 'currency'), c('status', 'Status', 'status'), c('invoiceNo', 'Invoice')],
  dims: [facilityDim, d('ward', 'Ward'), d('department', 'Department'), d('status', 'Deposit status'), d('coverBand', 'Deposit cover of bill', (r) => (!r.billed ? 'Not yet billed' : r.collected + r.topUps >= r.billed ? 'Covered in full' : (r.collected + r.topUps) / r.billed >= 0.5 ? '50–99% covered' : 'Under 50% covered'), ['Covered in full', '50–99% covered', 'Under 50% covered', 'Not yet billed']), monthDim((r) => r.collectedOn)],
  measures: [
    m('deposits', 'Deposits taken', 'number', (rs) => rs.length, 'up'),
    m('deposited', 'Total deposited', 'currency', (rs) => sum(rs, (r) => r.collected + r.topUps), 'up'),
    m('held', 'Deposits held now', 'currency', (rs) => sum(rs, (r) => r.held)),
    m('heldCount', 'Patients with deposit held', 'number', (rs) => count(rs, (r) => r.held > 0)),
    m('applied', 'Applied to bills', 'currency', (rs) => sum(rs, (r) => r.applied)),
    m('refunded', 'Refunded / moved to wallet', 'currency', (rs) => sum(rs, (r) => r.refunded + r.movedToWallet)),
    m('avgDeposit', 'Average deposit', 'currency', (rs) => avg(rs, (r) => r.collected + r.topUps)),
    m('cover', 'Deposit cover of final bills', 'percent', (rs) => ratio(sum(rs, (r) => (r.billed ? r.applied : 0)), sum(rs, (r) => r.billed)), 'up', 'Share of final inpatient bills settled from deposits'),
    m('balanceDue', 'Balance due after deposit', 'currency', (rs) => sum(rs, (r) => r.balanceDue), 'down'),
    m('shortfall', 'Bills exceeding deposit', 'number', (rs) => count(rs, (r) => r.status === 'Applied – balance due'), 'down'),
  ],
  filters: ['facility', 'ward', 'department', 'status'],
  defaultColumns: ['collectedOn', 'id', 'patient', 'facility', 'ward', 'total', 'billed', 'applied', 'refundedAll', 'held', 'status'],
}
const depositsHeld: SourceDef = { ...depositAccounts, id: 'depositsHeld', label: 'Deposits held', snapshot: true, date: undefined, rows: (db) => db.deposits.filter((r) => r.held > 0), defaultColumns: ['collectedOn', 'id', 'admissionId', 'patient', 'facility', 'ward', 'collected', 'topUps', 'held', 'status'] }

const depositTxns: SourceDef = {
  id: 'depositTxns',
  label: 'Deposit transactions',
  rows: (db) => db.depositTxns,
  date: (r) => r.date,
  dateLabel: 'Transaction date',
  columns: [c('date', 'Date', 'datetime'), c('id', 'Txn ID'), c('depositId', 'Deposit no.'), c('admissionId', 'Admission no.'), c('patient', 'Patient'), facilityCol, c('ward', 'Ward'), c('type', 'Transaction', 'status'), c('amount', 'Amount', 'currency'), c('method', 'Method / invoice'), c('by', 'Processed by')],
  dims: [facilityDim, d('ward', 'Ward'), d('type', 'Transaction type'), d('method', 'Method / invoice'), d('by', 'Processed by'), monthDim((r) => r.date)],
  measures: [
    m('txns', 'Transactions', 'number', (rs) => rs.length),
    m('collected', 'Deposits received', 'currency', (rs) => sum(rs, (r) => (r.type === 'Collected' || r.type === 'Top-up' ? r.amount : 0)), 'up'),
    m('applied', 'Applied to bills', 'currency', (rs) => sum(rs, (r) => (r.type === 'Applied to bill' ? r.amount : 0))),
    m('refunded', 'Refunded to patients', 'currency', (rs) => sum(rs, (r) => (r.type === 'Refunded' ? r.amount : 0))),
    m('toWallet', 'Moved to patient wallet', 'currency', (rs) => sum(rs, (r) => (r.type === 'Moved to wallet' ? r.amount : 0))),
    m('net', 'Net change in deposits held', 'currency', (rs) => sum(rs, (r) => (r.type === 'Collected' || r.type === 'Top-up' ? r.amount : -r.amount))),
  ],
  filters: ['facility', 'ward', 'type'],
  defaultColumns: ['date', 'id', 'depositId', 'patient', 'facility', 'ward', 'type', 'amount', 'method', 'by'],
}

const depositRecon: SourceDef = {
  id: 'depositRecon',
  label: 'Deposit reconciliation',
  derive: (db, p) => {
    const map = new Map<string, Row>()
    for (const t of db.depositTxns) {
      const day = t.date.slice(0, 10)
      if (day > p.to) continue
      let r = map.get(t.facility)
      if (!r) map.set(t.facility, (r = { facility: t.facility, opening: 0, received: 0, applied: 0, refunded: 0, toWallet: 0, closing: 0 }))
      const signed = t.type === 'Collected' || t.type === 'Top-up' ? t.amount : -t.amount
      if (day < p.from) r.opening += signed
      else if (signed > 0) r.received += t.amount
      else if (t.type === 'Applied to bill') r.applied += t.amount
      else if (t.type === 'Refunded') r.refunded += t.amount
      else r.toWallet += t.amount
      r.closing += signed
    }
    return [...map.values()].map((r) => ({ ...r, variance: r.opening + r.received - r.applied - r.refunded - r.toWallet - r.closing }))
  },
  columns: [facilityCol, c('opening', 'Opening held', 'currency'), c('received', 'Received', 'currency'), c('applied', 'Applied to bills', 'currency'), c('refunded', 'Refunded', 'currency'), c('toWallet', 'Moved to wallet', 'currency'), c('closing', 'Closing held', 'currency'), c('variance', 'Variance', 'currency')],
  dims: [facilityDim],
  measures: [
    m('opening', 'Opening deposits held', 'currency', (rs) => sum(rs, (r) => r.opening)),
    m('received', 'Deposits received', 'currency', (rs) => sum(rs, (r) => r.received)),
    m('applied', 'Applied to bills', 'currency', (rs) => sum(rs, (r) => r.applied)),
    m('refunded', 'Refunded', 'currency', (rs) => sum(rs, (r) => r.refunded)),
    m('toWallet', 'Moved to wallet', 'currency', (rs) => sum(rs, (r) => r.toWallet)),
    m('closing', 'Closing deposits held', 'currency', (rs) => sum(rs, (r) => r.closing)),
    m('variance', 'Unexplained variance', 'currency', (rs) => sum(rs, (r) => r.variance), 'down'),
  ],
  filters: ['facility'],
  defaultColumns: ['facility', 'opening', 'received', 'applied', 'refunded', 'toWallet', 'closing', 'variance'],
}

// ---------------------------------------------- patient credit accounts
const creditFacilities: SourceDef = {
  id: 'creditFacilities',
  label: 'Patient credit accounts',
  snapshot: true,
  rows: (db) => db.creditFacilities,
  columns: [c('id', 'Account'), c('patient', 'Account holder'), c('patientId', 'Patient ID'), facilityCol, c('scheme', 'Scheme'), c('openedOn', 'Opened', 'date'), c('approvedBy', 'Approved by'), c('limit', 'Credit limit', 'currency'), c('owed', 'Amount owed', 'currency'), c('available', 'Available credit', 'currency'), c('utilisation', 'Utilisation', 'percent'), c('oldestUnpaidDays', 'Oldest unpaid (days)', 'number'), c('owedPastTerms', 'Past due', 'currency'), c('lastActivity', 'Last activity', 'datetime'), c('status', 'Status', 'status')],
  dims: [facilityDim, d('scheme', 'Credit scheme'), d('status', 'Limit status', undefined, ['Over limit', 'Near limit', 'Within limit', 'Clear']), d('utilBand', 'Utilisation band', (r) => (r.utilisation > 1 ? 'Over 100%' : r.utilisation >= 0.8 ? '80–100%' : r.utilisation >= 0.5 ? '50–79%' : r.utilisation > 0 ? '1–49%' : 'Nothing owed'), ['Over 100%', '80–100%', '50–79%', '1–49%', 'Nothing owed']), d('ageBand', 'Oldest unpaid', (r) => (!r.owed ? 'Nothing owed' : r.oldestUnpaidDays <= 30 ? 'Within terms (≤30 days)' : r.oldestUnpaidDays <= 60 ? '31–60 days' : r.oldestUnpaidDays <= 90 ? '61–90 days' : '90+ days'), ['Within terms (≤30 days)', '31–60 days', '61–90 days', '90+ days', 'Nothing owed'])],
  measures: [
    m('accounts', 'Credit accounts', 'number', (rs) => rs.length),
    m('withBalance', 'Accounts with balance', 'number', (rs) => count(rs, (r) => r.owed > 0)),
    m('limit', 'Total credit limits', 'currency', (rs) => sum(rs, (r) => r.limit)),
    m('owed', 'Credit owed by patients', 'currency', (rs) => sum(rs, (r) => r.owed), 'down'),
    m('available', 'Unused credit', 'currency', (rs) => sum(rs, (r) => r.available)),
    m('utilisation', 'Overall utilisation', 'percent', (rs) => ratio(sum(rs, (r) => r.owed), sum(rs, (r) => r.limit))),
    m('nearLimit', 'Near limit (≥80%)', 'number', (rs) => count(rs, (r) => r.status === 'Near limit'), 'down'),
    m('overLimit', 'Over limit', 'number', (rs) => count(rs, (r) => r.status === 'Over limit'), 'down'),
    m('pastTerms', 'Owed past due date', 'currency', (rs) => sum(rs, (r) => r.owedPastTerms), 'down', 'Bills not repaid within the 30-day credit terms'),
  ],
  filters: ['facility', 'scheme', 'status', 'utilBand'],
  defaultColumns: ['id', 'patient', 'facility', 'scheme', 'limit', 'owed', 'available', 'utilisation', 'oldestUnpaidDays', 'status'],
}

const creditLedger: SourceDef = {
  id: 'creditLedger',
  label: 'Patient credit ledger',
  rows: (db) => db.creditLedger,
  date: (r) => r.date,
  dateLabel: 'Transaction date',
  columns: [c('date', 'Date', 'datetime'), c('id', 'Txn ID'), c('accountId', 'Account'), c('patient', 'Account holder'), facilityCol, c('scheme', 'Scheme'), c('type', 'Transaction', 'status'), c('amount', 'Amount', 'currency'), c('invoiceNo', 'Invoice'), c('dueDate', 'Due date', 'date'), c('balanceAfter', 'Balance after', 'currency')],
  dims: [facilityDim, d('scheme', 'Credit scheme'), d('type', 'Transaction type'), monthDim((r) => r.date)],
  measures: [
    m('txns', 'Transactions', 'number', (rs) => rs.length),
    m('charged', 'Charged to credit', 'currency', (rs) => sum(rs, (r) => (r.type === 'Charged to credit' ? r.amount : 0))),
    m('repaid', 'Repayments received', 'currency', (rs) => sum(rs, (r) => (r.type === 'Repayment' ? r.amount : 0)), 'up'),
    m('writtenOff', 'Written off', 'currency', (rs) => sum(rs, (r) => (r.type === 'Written off' ? r.amount : 0)), 'down'),
    m('net', 'Net change in credit owed', 'currency', (rs) => sum(rs, (r) => (r.type === 'Charged to credit' ? r.amount : -r.amount)), 'down'),
    m('accounts', 'Accounts active', 'number', (rs) => distinct(rs, (r) => r.accountId)),
    m('repayRate', 'Repayment ratio', 'percent', (rs) => ratio(sum(rs, (r) => (r.type === 'Repayment' ? r.amount : 0)), sum(rs, (r) => (r.type === 'Charged to credit' ? r.amount : 0))), 'up'),
  ],
  filters: ['facility', 'scheme', 'type'],
  defaultColumns: ['date', 'id', 'accountId', 'patient', 'facility', 'type', 'amount', 'invoiceNo', 'dueDate', 'balanceAfter'],
}

/** One row per patient: wallet balance, deposit held and credit owed. */
const patientBalances: SourceDef = {
  id: 'patientBalances',
  label: 'Patient account balances',
  snapshot: true,
  rows: (db) => {
    const map = new Map<string, Row>()
    const get = (pid: string, patient: string, facility: string) => {
      let r = map.get(pid)
      if (!r) map.set(pid, (r = { patientId: pid, patient, facility, wallet: 0, deposit: 0, creditOwed: 0, creditLimit: 0, scheme: '—' }))
      return r
    }
    const lastWallet = new Map<string, Row>()
    for (const t of db.credits) lastWallet.set(t.accountId, t)
    for (const t of lastWallet.values()) if (t.balanceAfter > 0) get(`HK-${t.accountId.slice(4)}`, t.patient, t.facility).wallet = t.balanceAfter
    for (const d of db.deposits) if (d.held > 0) get(d.patientId, d.patient, d.facility).deposit += d.held
    for (const a of db.creditFacilities)
      if (a.owed > 0) {
        const r = get(a.patientId, a.patient, a.facility)
        r.creditOwed = a.owed
        r.creditLimit = a.limit
        r.scheme = a.scheme
      }
    return [...map.values()].map((r) => ({ ...r, net: r.wallet + r.deposit - r.creditOwed, position: r.wallet + r.deposit - r.creditOwed >= 0 ? 'Hospital holds patient funds' : 'Patient owes hospital' }))
  },
  columns: [c('patientId', 'Patient ID'), c('patient', 'Patient'), facilityCol, c('wallet', 'Wallet balance', 'currency'), c('deposit', 'Deposit held', 'currency'), c('creditOwed', 'Credit owed', 'currency'), c('creditLimit', 'Credit limit', 'currency'), c('net', 'Net position', 'currency'), c('position', 'Position')],
  dims: [facilityDim, d('position', 'Net position'), d('holds', 'Balance type', (r) => (r.creditOwed > 0 ? 'Has credit owed' : r.deposit > 0 ? 'Has deposit held' : 'Wallet only')), d('scheme', 'Credit scheme')],
  measures: [
    m('patients', 'Patients with balances', 'number', (rs) => rs.length),
    m('wallet', 'Patient wallet balances', 'currency', (rs) => sum(rs, (r) => r.wallet)),
    m('deposit', 'Deposits held', 'currency', (rs) => sum(rs, (r) => r.deposit)),
    m('creditOwed', 'Patient credit owed', 'currency', (rs) => sum(rs, (r) => r.creditOwed), 'down'),
    m('liability', 'Owed to patients (wallet + deposits)', 'currency', (rs) => sum(rs, (r) => r.wallet + r.deposit), undefined, 'Money the hospital holds on behalf of patients'),
    m('net', 'Net patient position', 'currency', (rs) => sum(rs, (r) => r.net), undefined, 'Wallet + deposits − credit owed'),
    m('owing', 'Patients owing', 'number', (rs) => count(rs, (r) => r.net < 0)),
  ],
  filters: ['facility', 'position', 'holds'],
  defaultColumns: ['patientId', 'patient', 'facility', 'wallet', 'deposit', 'creditOwed', 'creditLimit', 'net', 'position'],
}

export const SOURCES: Record<string, SourceDef> = Object.fromEntries(
  [visits, patients, labs, prescriptions, procedures, invoices, invoiceLines, payments, adjustments, credits, creditAccounts, creditRecon, admissions, discharges, inpatients, wardDays, transfers, nursing, stock, movements, purchaseOrders, claims, staff, logins, security, integrations, facilityScorecard, departmentScorecard, doctorUtilization, monthlyFinance, dailyCollections, stockRecon, depositAccounts, depositsHeld, depositTxns, depositRecon, creditFacilities, creditLedger, patientBalances].map((s) => [s.id, s]),
)

// Cache flattened static rows per source.
const rowCache = new Map<string, Row[]>()
export function sourceRows(src: SourceDef, db: Db, period: Period): Row[] {
  if (src.derive) return src.derive(db, period)
  let rows = rowCache.get(src.id)
  if (!rows) {
    rows = src.rows!(db)
    rowCache.set(src.id, rows)
  }
  return rows
}

