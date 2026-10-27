/**
 * The report catalogue. Every entry is a declarative definition: which
 * source it reads, an optional fixed filter, which KPIs / charts / grouping
 * to show and the layout family. The engine (run.ts) turns a definition
 * plus a user configuration into a rendered report.
 */
import type { Row } from './sources'
import type { PeriodPreset } from './period'

export type ModuleId =
  | 'billing' | 'credits' | 'patients' | 'clinical' | 'diagnoses' | 'admissions' | 'laboratory' | 'pharmacy' | 'inventory'
  | 'procurement' | 'insurance' | 'doctor' | 'nurse' | 'dental' | 'team' | 'security' | 'services' | 'facilities'
  | 'integrations' | 'telemedicine' | 'quality'

export type Category = 'Financial' | 'Clinical' | 'Operational' | 'Supply chain' | 'Governance & security' | 'Technology'

export interface ModuleDef {
  id: ModuleId
  label: string
  icon: string
  category: Category
  blurb: string
}

export const MODULES: ModuleDef[] = [
  { id: 'billing', label: 'Billing & Payments', icon: 'Receipt', category: 'Financial', blurb: 'Invoices, collections, receivables and reconciliation' },
  { id: 'credits', label: 'Credits', icon: 'Wallet', category: 'Financial', blurb: 'Patient deposits, promotional and refund credits' },
  { id: 'insurance', label: 'Insurance & HMO', icon: 'ShieldCheck', category: 'Financial', blurb: 'Claims lifecycle, reimbursements and tariff variance' },
  { id: 'patients', label: 'Patients', icon: 'Users', category: 'Clinical', blurb: 'Registrations, visits, demographics and waiting times' },
  { id: 'clinical', label: 'Clinical Management', icon: 'Stethoscope', category: 'Clinical', blurb: 'Consultations, workload and documentation' },
  { id: 'diagnoses', label: 'Diagnoses', icon: 'ClipboardList', category: 'Clinical', blurb: 'Disease burden, trends and ICD-10 coding quality' },
  { id: 'admissions', label: 'Admissions & Inpatient', icon: 'BedDouble', category: 'Clinical', blurb: 'Census, occupancy, length of stay and discharges' },
  { id: 'laboratory', label: 'Laboratory & Diagnostics', icon: 'FlaskConical', category: 'Clinical', blurb: 'Test volumes, turnaround and referrals' },
  { id: 'doctor', label: 'Doctor Interface', icon: 'UserRound', category: 'Clinical', blurb: 'Clinician activity, load and utilization' },
  { id: 'nurse', label: 'Nurse Interface', icon: 'HeartPulse', category: 'Clinical', blurb: 'Nursing workload, monitoring and care tasks' },
  { id: 'dental', label: 'Dentist Interface', icon: 'Smile', category: 'Clinical', blurb: 'Dental consultations, treatments and revenue' },
  { id: 'telemedicine', label: 'Telemedicine', icon: 'Video', category: 'Clinical', blurb: 'Virtual consultations, billing and token usage' },
  { id: 'quality', label: 'Quality & Patient Safety', icon: 'BadgeCheck', category: 'Clinical', blurb: 'Exception lists for clinical governance' },
  { id: 'pharmacy', label: 'Pharmacy', icon: 'Pill', category: 'Supply chain', blurb: 'Dispensing, sales, stock and expiry' },
  { id: 'inventory', label: 'Inventory & Consumables', icon: 'Boxes', category: 'Supply chain', blurb: 'Valuation, movements, wastage and turnover' },
  { id: 'procurement', label: 'Procurement & Suppliers', icon: 'Truck', category: 'Supply chain', blurb: 'LPOs, deliveries and supplier payables' },
  { id: 'services', label: 'Services & Procedures', icon: 'Activity', category: 'Operational', blurb: 'Procedure volumes, cancellations and waits' },
  { id: 'facilities', label: 'Multi-Facility & Organisation', icon: 'Building2', category: 'Operational', blurb: 'Facility and department comparisons' },
  { id: 'team', label: 'Team & Access Control', icon: 'UsersRound', category: 'Governance & security', blurb: 'Staff, roles, accounts and access' },
  { id: 'security', label: 'Security', icon: 'Lock', category: 'Governance & security', blurb: 'Authentication, permissions and exports' },
  { id: 'integrations', label: 'Integrations', icon: 'Plug', category: 'Technology', blurb: 'Sync health, errors and reconciliation' },
]

export const CATEGORIES: Category[] = ['Financial', 'Clinical', 'Operational', 'Supply chain', 'Governance & security', 'Technology']

export type ReportType = 'Summary' | 'Register' | 'Analysis' | 'Trend' | 'Comparison' | 'Aging' | 'Exception' | 'Reconciliation' | 'Snapshot'

export const REPORT_TYPES: ReportType[] = ['Summary', 'Register', 'Analysis', 'Trend', 'Comparison', 'Aging', 'Exception', 'Reconciliation', 'Snapshot']

export interface BreakdownSpec {
  dim: string
  measure: string
  chart: 'donut' | 'hbar' | 'bar'
  title?: string
}

export interface ReportDef {
  id: string
  name: string
  module: ModuleId
  type: ReportType
  source: string
  description: string
  where?: (r: Row) => boolean
  whereLabel?: string
  /** Narrows only the detailed record list (KPIs still use the full scope). */
  detailWhere?: (r: Row) => boolean
  detailWhereLabel?: string
  kpis: string[]
  trend?: { measures: string[]; splitBy?: string; chart?: 'line' | 'bar' | 'area'; title?: string }
  breakdowns?: BreakdownSpec[]
  groupBy?: string
  groupMeasures?: string[]
  columns?: string[]
  defaultPeriod?: PeriodPreset
  defaultView?: 'summary' | 'detailed'
  ignorePeriod?: boolean
  /** Initial sort for the detailed records list. */
  detailSort?: { col: string; dir: 'asc' | 'desc' }
  recommended?: boolean
  audience?: string
}

type Opts = Omit<ReportDef, 'id' | 'name' | 'module' | 'type' | 'source' | 'description'>

const reports: ReportDef[] = []
function R(module: ModuleId, id: string, name: string, type: ReportType, source: string, description: string, opts: Opts) {
  reports.push({ id, name, module, type, source, description, ...opts })
}

const oneOf = (field: string, ...vals: string[]) => (r: Row) => vals.includes(r[field])

// ============================================================ BILLING
R('billing', 'billing-summary', 'Billing Summary', 'Summary', 'invoices', 'Net billing, collections and outstanding balances for invoices raised in the period, by department and payer.', {
  kpis: ['net', 'paid', 'balance', 'collectionRate', 'discount', 'count'],
  trend: { measures: ['net', 'paid'], title: 'Billed vs collected' },
  breakdowns: [{ dim: 'payerType', measure: 'net', chart: 'donut', title: 'Net billed by payer type' }, { dim: 'department', measure: 'net', chart: 'hbar', title: 'Net billed by department' }],
  groupBy: 'department', groupMeasures: ['count', 'gross', 'discount', 'net', 'paid', 'balance', 'collectionRate'], recommended: true, audience: 'Finance',
})
R('billing', 'invoice-register', 'Invoice Register', 'Register', 'invoices', 'Every invoice raised in the period with billed, paid and balance amounts and current status.', {
  kpis: ['count', 'net', 'paid', 'balance'], trend: { measures: ['count'], chart: 'bar', title: 'Invoices raised' },
  breakdowns: [{ dim: 'status', measure: 'count', chart: 'donut', title: 'Invoices by status' }], groupBy: 'status', groupMeasures: ['count', 'net', 'paid', 'balance'], defaultView: 'detailed',
  columns: ['date', 'id', 'patient', 'facility', 'department', 'source', 'payerType', 'payer', 'gross', 'discount', 'net', 'paidNet', 'balance', 'dueDate', 'status'],
})
R('billing', 'payment-collections', 'Payment Collections', 'Summary', 'payments', 'All receipts posted in the period by payment method, facility and payer — the cash view of revenue.', {
  kpis: ['collected', 'receipts', 'avgReceipt', 'cashless', 'hmo'], trend: { measures: ['collected'], splitBy: 'method', chart: 'bar', title: 'Collections by payment method' },
  breakdowns: [{ dim: 'method', measure: 'collected', chart: 'donut', title: 'Share by method' }, { dim: 'facility', measure: 'collected', chart: 'hbar', title: 'Collections by facility' }],
  groupBy: 'method', groupMeasures: ['receipts', 'collected', 'avgReceipt'], recommended: true, audience: 'Finance',
})
R('billing', 'outstanding-balances', 'Outstanding Balances', 'Aging', 'invoices', 'Open invoice balances aged by days since billing, split by payer and facility.', {
  where: (r) => r.balance > 0, whereLabel: 'Balance > ₦0', kpis: ['balance', 'openCount', 'avgAge', 'over90'],
  breakdowns: [{ dim: 'agingBucket', measure: 'balance', chart: 'bar', title: 'Balance by age' }, { dim: 'payerType', measure: 'balance', chart: 'donut', title: 'Balance by payer type' }],
  groupBy: 'payer', groupMeasures: ['openCount', 'balance', 'avgAge', 'over90'], defaultPeriod: 'last12', recommended: true, audience: 'Finance',
})
R('billing', 'overdue-invoices', 'Overdue Invoices', 'Exception', 'invoices', 'Invoices past their due date with an unpaid balance — the collections team work-list.', {
  where: (r) => r.status === 'Overdue', whereLabel: 'Status = Overdue', kpis: ['overdue', 'overdueCount', 'avgAge', 'over90'],
  breakdowns: [{ dim: 'agingBucket', measure: 'overdue', chart: 'bar', title: 'Overdue amount by age' }, { dim: 'payer', measure: 'overdue', chart: 'hbar', title: 'Top overdue payers' }],
  groupBy: 'facility', groupMeasures: ['overdueCount', 'overdue', 'avgAge'], defaultPeriod: 'last12', defaultView: 'detailed',
})
R('billing', 'revenue-by-department', 'Revenue by Department', 'Analysis', 'invoices', 'Net billed revenue attributed to the department that raised each invoice.', {
  kpis: ['net', 'count', 'avgInvoice', 'collectionRate'], trend: { measures: ['net'], splitBy: 'department', chart: 'bar', title: 'Net billed by department' },
  breakdowns: [{ dim: 'department', measure: 'net', chart: 'hbar', title: 'Department ranking' }], groupBy: 'department', groupMeasures: ['count', 'net', 'avgInvoice', 'paid', 'collectionRate'],
})
R('billing', 'revenue-by-service', 'Revenue by Service', 'Analysis', 'invoiceLines', 'Gross charges by individual service and service category, before discounts.', {
  kpis: ['revenue', 'lines', 'services', 'avgLine'], breakdowns: [{ dim: 'category', measure: 'revenue', chart: 'donut', title: 'By service category' }, { dim: 'service', measure: 'revenue', chart: 'hbar', title: 'Top services' }],
  trend: { measures: ['revenue'], splitBy: 'category', chart: 'bar' }, groupBy: 'service', groupMeasures: ['lines', 'qty', 'revenue', 'avgLine'],
})
R('billing', 'revenue-by-facility', 'Revenue by Facility', 'Comparison', 'invoices', 'Net billed, collected and outstanding by facility for a like-for-like comparison.', {
  kpis: ['net', 'paid', 'balance', 'collectionRate'], trend: { measures: ['net'], splitBy: 'facility', chart: 'line', title: 'Net billed by facility' },
  breakdowns: [{ dim: 'facility', measure: 'net', chart: 'bar', title: 'Net billed' }], groupBy: 'facility', groupMeasures: ['count', 'net', 'paid', 'balance', 'collectionRate', 'avgInvoice'],
})
R('billing', 'revenue-by-payer', 'Revenue by Payer', 'Analysis', 'invoices', 'Revenue mix across self-pay patients, HMOs and corporate clients.', {
  kpis: ['net', 'paid', 'balance', 'collectionRate'], breakdowns: [{ dim: 'payerType', measure: 'net', chart: 'donut' }, { dim: 'payer', measure: 'net', chart: 'hbar', title: 'Net billed by payer' }],
  trend: { measures: ['net'], splitBy: 'payerType', chart: 'bar' }, groupBy: 'payer', groupMeasures: ['count', 'net', 'paid', 'balance', 'collectionRate'],
})
R('billing', 'payment-method-breakdown', 'Payment Method Breakdown', 'Analysis', 'payments', 'How patients and payers settle bills — cash, POS, transfer, USSD, remittances and credit.', {
  kpis: ['collected', 'receipts', 'cashless'], breakdowns: [{ dim: 'method', measure: 'collected', chart: 'donut' }, { dim: 'method', measure: 'receipts', chart: 'hbar', title: 'Receipts by method' }],
  trend: { measures: ['collected'], splitBy: 'method', chart: 'bar' }, groupBy: 'method', groupMeasures: ['receipts', 'collected', 'avgReceipt'],
})
R('billing', 'refunds', 'Refunds', 'Register', 'adjustments', 'Refunds paid to patients, with reason, approver and refund channel.', {
  where: oneOf('type', 'Refund'), whereLabel: 'Type = Refund', kpis: ['refunds', 'refundCount', 'avg'],
  breakdowns: [{ dim: 'reason', measure: 'refunds', chart: 'hbar', title: 'Refunds by reason' }, { dim: 'facility', measure: 'refunds', chart: 'donut' }],
  groupBy: 'approvedBy', groupMeasures: ['count', 'refunds'], defaultPeriod: 'ytd', defaultView: 'detailed',
})
R('billing', 'credit-notes-adjustments', 'Credit Notes & Adjustments', 'Register', 'adjustments', 'Post-billing credit notes, bad-debt write-offs and HMO claims adjustments.', {
  where: oneOf('type', 'Credit Note', 'Write-off', 'Claims Adjustment'), whereLabel: 'Credit notes, write-offs & claims adjustments', kpis: ['total', 'creditNotes', 'writeOffs', 'count'],
  breakdowns: [{ dim: 'type', measure: 'total', chart: 'donut' }, { dim: 'reason', measure: 'total', chart: 'hbar', title: 'By reason' }], groupBy: 'type', groupMeasures: ['count', 'total', 'avg'], defaultPeriod: 'ytd',
})
R('billing', 'daily-collections', 'Daily Collections', 'Register', 'dailyCollections', 'End-of-day cash-up by facility and payment channel for till reconciliation.', {
  kpis: ['total', 'cash', 'electronic', 'remittance', 'receipts'], trend: { measures: ['total'], chart: 'bar', title: 'Collected per day' },
  breakdowns: [{ dim: 'facility', measure: 'total', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['receipts', 'cash', 'electronic', 'remittance', 'total', 'avgDay'], defaultView: 'detailed', recommended: true,
})
R('billing', 'monthly-financial-summary', 'Monthly Financial Summary', 'Summary', 'monthlyFinance', 'Month-by-month billed revenue, cash collected, refunds and write-offs per facility.', {
  kpis: ['net', 'collections', 'netCollections', 'ratio', 'discount', 'writeOffs'], trend: { measures: ['net', 'netCollections'], chart: 'bar', title: 'Billed vs net collections' },
  breakdowns: [{ dim: 'facility', measure: 'net', chart: 'donut' }], groupBy: 'month', groupMeasures: ['gross', 'discount', 'net', 'collections', 'refunds', 'netCollections', 'writeOffs', 'ratio'], defaultPeriod: 'ytd', recommended: true, audience: 'Executive',
})
R('billing', 'payment-reconciliation', 'Payment Reconciliation', 'Reconciliation', 'payments', 'Matches receipts to invoices and highlights unallocated or pending bank receipts.', {
  kpis: ['collected', 'matched', 'unmatched', 'matchRate', 'pendingReview'], breakdowns: [{ dim: 'reconciliation', measure: 'collected', chart: 'donut' }, { dim: 'method', measure: 'unmatched', chart: 'hbar', title: 'Unmatched by method' }],
  groupBy: 'facility', groupMeasures: ['receipts', 'collected', 'matched', 'unmatched', 'matchRate'],
})
R('billing', 'unmatched-payments', 'Unmatched Payments', 'Exception', 'payments', 'Bank transfers received without an invoice reference, awaiting allocation.', {
  where: oneOf('reconciliation', 'Unmatched'), whereLabel: 'Reconciliation = Unmatched', kpis: ['unmatched', 'unmatchedCount', 'avgReceipt'],
  breakdowns: [{ dim: 'facility', measure: 'unmatched', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['unmatchedCount', 'unmatched'], defaultPeriod: 'last_quarter', defaultView: 'detailed',
})
R('billing', 'discounts-waivers', 'Discounts & Waivers', 'Analysis', 'adjustments', 'Discounts and waivers granted at billing with reasons and approving officers.', {
  where: oneOf('type', 'Discount', 'Waiver'), whereLabel: 'Discounts & waivers', kpis: ['total', 'discounts', 'waivers', 'count'],
  breakdowns: [{ dim: 'reason', measure: 'total', chart: 'hbar', title: 'By reason' }, { dim: 'approvedBy', measure: 'total', chart: 'donut', title: 'By approver' }],
  trend: { measures: ['total'], chart: 'bar' }, groupBy: 'reason', groupMeasures: ['count', 'total', 'avg'],
})
R('billing', 'bad-debt-write-offs', 'Bad Debt & Write-offs', 'Analysis', 'adjustments', 'Self-pay balances written off as uncollectable and HMO disallowances written off.', {
  where: oneOf('type', 'Write-off', 'Claims Adjustment'), whereLabel: 'Write-offs', kpis: ['writeOffs', 'count', 'avg'],
  breakdowns: [{ dim: 'type', measure: 'total', chart: 'donut' }, { dim: 'facility', measure: 'total', chart: 'hbar' }], trend: { measures: ['total'], chart: 'bar' }, groupBy: 'facility', groupMeasures: ['count', 'total'], defaultPeriod: 'ytd',
})
R('billing', 'cashier-performance', 'Cashier Performance', 'Analysis', 'payments', 'Receipts and amounts processed by each cashier, for till accountability.', {
  where: (r) => !['Finance – Receivables'].includes(r.cashier), whereLabel: 'Front-desk receipts only', kpis: ['collected', 'receipts', 'avgReceipt'],
  breakdowns: [{ dim: 'cashier', measure: 'collected', chart: 'hbar' }], groupBy: 'cashier', groupMeasures: ['receipts', 'collected', 'avgReceipt', 'cashless'],
})

// ============================================================ CREDITS
R('credits', 'credits-issued', 'Credits Issued', 'Analysis', 'credits', 'Credit issued to patient wallets — prepaid deposits, promotional and refund credits.', {
  where: oneOf('action', 'Issued'), whereLabel: 'Transaction = Issued', kpis: ['issued', 'txns', 'accounts'],
  breakdowns: [{ dim: 'creditType', measure: 'issued', chart: 'donut' }, { dim: 'facility', measure: 'issued', chart: 'hbar' }], trend: { measures: ['issued'], splitBy: 'creditType', chart: 'bar' }, groupBy: 'creditType', groupMeasures: ['txns', 'issued', 'accounts'], defaultPeriod: 'ytd',
})
R('credits', 'credits-utilized', 'Credits Utilized', 'Analysis', 'credits', 'Wallet credit applied against patient invoices at the point of payment.', {
  where: oneOf('action', 'Utilized'), whereLabel: 'Transaction = Utilized', kpis: ['utilized', 'txns', 'accounts'],
  breakdowns: [{ dim: 'creditType', measure: 'utilized', chart: 'donut' }, { dim: 'facility', measure: 'utilized', chart: 'hbar' }], trend: { measures: ['utilized'], chart: 'bar' }, groupBy: 'facility', groupMeasures: ['txns', 'utilized'], defaultPeriod: 'ytd',
})
R('credits', 'outstanding-credit-balances', 'Outstanding Credit Balances', 'Snapshot', 'creditAccounts', 'Current wallet balances owed to patients, by credit type and facility.', {
  where: (r) => r.balance > 0, whereLabel: 'Balance > ₦0', kpis: ['balance', 'withBalance', 'avgBalance', 'dormant'],
  breakdowns: [{ dim: 'creditType', measure: 'balance', chart: 'donut' }, { dim: 'facility', measure: 'balance', chart: 'hbar' }], groupBy: 'creditType', groupMeasures: ['accounts', 'balance', 'avgBalance'], recommended: true,
})
R('credits', 'credit-adjustments', 'Credit Adjustments', 'Register', 'credits', 'Manual corrections to wallet balances and who processed them.', {
  where: oneOf('action', 'Adjusted'), whereLabel: 'Transaction = Adjusted', kpis: ['adjusted', 'txns'], breakdowns: [{ dim: 'by', measure: 'txns', chart: 'hbar', title: 'By officer' }], groupBy: 'creditType', groupMeasures: ['txns', 'adjusted'], defaultPeriod: 'ytd', defaultView: 'detailed',
})
R('credits', 'credit-reversals', 'Credit Reversals', 'Register', 'credits', 'Deposits reversed and refunded to patients on request.', {
  where: oneOf('action', 'Reversed'), whereLabel: 'Transaction = Reversed', kpis: ['reversed', 'txns'], breakdowns: [{ dim: 'facility', measure: 'reversed', chart: 'hbar' }], groupBy: 'creditType', groupMeasures: ['txns', 'reversed'], defaultPeriod: 'ytd', defaultView: 'detailed',
})
R('credits', 'credit-transaction-history', 'Credit Transaction History', 'Register', 'credits', 'Complete ledger of wallet transactions with running balances.', {
  kpis: ['txns', 'issued', 'utilized', 'net'], trend: { measures: ['issued', 'utilized'], chart: 'bar' }, breakdowns: [{ dim: 'action', measure: 'txns', chart: 'donut' }], groupBy: 'action', groupMeasures: ['txns', 'issued', 'utilized', 'reversed'], defaultView: 'detailed',
})
R('credits', 'credit-reconciliation', 'Credit Reconciliation', 'Reconciliation', 'creditRecon', 'Opening balance + issued − utilized ± adjustments − reversals = closing balance, per credit type.', {
  kpis: ['opening', 'issued', 'utilized', 'reversed', 'closing', 'variance'], breakdowns: [{ dim: 'creditType', measure: 'closing', chart: 'donut', title: 'Closing balance by type' }], groupBy: 'creditType', groupMeasures: ['opening', 'issued', 'utilized', 'reversed', 'closing', 'variance'], defaultPeriod: 'last_quarter',
})
R('credits', 'dormant-credit-wallets', 'Dormant Credit Wallets', 'Exception', 'creditAccounts', 'Wallets holding a balance with no activity for over 90 days — candidates for outreach.', {
  where: (r) => r.balance > 0 && r.dormantDays > 90, whereLabel: 'Balance > ₦0 and idle 90+ days', kpis: ['accounts', 'balance', 'avgBalance'], breakdowns: [{ dim: 'creditType', measure: 'balance', chart: 'donut' }], groupBy: 'facility', groupMeasures: ['accounts', 'balance'], defaultView: 'detailed',
})

// ============================================================ PATIENTS
R('patients', 'patient-registration', 'Patient Registration', 'Register', 'patients', 'New patient records created in the period, by channel, payer and facility.', {
  kpis: ['registrations', 'female', 'children', 'insured'], trend: { measures: ['registrations'], chart: 'bar' }, breakdowns: [{ dim: 'channel', measure: 'registrations', chart: 'donut' }, { dim: 'facility', measure: 'registrations', chart: 'hbar' }],
  groupBy: 'facility', groupMeasures: ['registrations', 'female', 'children', 'insured'], defaultView: 'detailed',
})
R('patients', 'new-patients', 'New Patients', 'Analysis', 'visits', 'First visits by newly registered patients, showing where new demand comes from.', {
  where: (r) => r.isNewPatient, whereLabel: 'First visit', kpis: ['visits', 'patients', 'referralsIn'], trend: { measures: ['visits'], chart: 'bar', title: 'New-patient visits' },
  breakdowns: [{ dim: 'department', measure: 'visits', chart: 'hbar' }, { dim: 'payerType', measure: 'visits', chart: 'donut' }], groupBy: 'facility', groupMeasures: ['visits', 'referralsIn'],
})
R('patients', 'returning-patients', 'Returning Patients', 'Analysis', 'visits', 'Visits by established patients — a measure of retention and continuity of care.', {
  where: (r) => !r.isNewPatient, whereLabel: 'Returning patients', kpis: ['visits', 'patients', 'followUps'], trend: { measures: ['visits'], chart: 'bar' },
  breakdowns: [{ dim: 'type', measure: 'visits', chart: 'donut' }, { dim: 'department', measure: 'visits', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['visits', 'patients', 'followUps'],
})
R('patients', 'patient-demographics', 'Patient Demographics', 'Snapshot', 'patients', 'Profile of the registered patient base by age, sex, payer and location.', {
  ignorePeriod: true, kpis: ['registrations', 'female', 'avgAge', 'children', 'elderly', 'insured'],
  breakdowns: [{ dim: 'ageBand', measure: 'registrations', chart: 'bar', title: 'Patients by age band' }, { dim: 'gender', measure: 'registrations', chart: 'donut', title: 'By sex' }, { dim: 'payerType', measure: 'registrations', chart: 'donut', title: 'By payer type' }],
  groupBy: 'ageBand', groupMeasures: ['registrations', 'female', 'insured'], recommended: true,
})
R('patients', 'patient-visits', 'Patient Visits', 'Summary', 'visits', 'Total outpatient and emergency visits with completion, no-show and channel mix.', {
  kpis: ['visits', 'patients', 'completed', 'perDay', 'noShowRate'], trend: { measures: ['visits'], chart: 'bar' }, breakdowns: [{ dim: 'department', measure: 'visits', chart: 'hbar' }, { dim: 'status', measure: 'visits', chart: 'donut' }],
  groupBy: 'department', groupMeasures: ['visits', 'completed', 'patients', 'noShowRate'], recommended: true, audience: 'Operations',
})
R('patients', 'visits-by-department', 'Visits by Department', 'Analysis', 'visits', 'Visit volume and completion by clinical department.', {
  kpis: ['visits', 'completed', 'avgWait'], trend: { measures: ['visits'], splitBy: 'department', chart: 'bar' }, breakdowns: [{ dim: 'department', measure: 'visits', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['visits', 'completed', 'newPatients', 'avgWait', 'cancelRate'],
})
R('patients', 'visits-by-facility', 'Visits by Facility', 'Comparison', 'visits', 'Patient visits across facilities with new-patient share and waiting times.', {
  kpis: ['visits', 'patients', 'newShare', 'avgWait'], trend: { measures: ['visits'], splitBy: 'facility', chart: 'line' }, breakdowns: [{ dim: 'facility', measure: 'visits', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['visits', 'patients', 'newPatients', 'newShare', 'avgWait', 'perDay'],
})
R('patients', 'visits-by-consultation-type', 'Visits by Consultation Type', 'Analysis', 'visits', 'New, follow-up, review, referral and emergency visits, in person and virtual.', {
  kpis: ['visits', 'followUps', 'referralsIn', 'virtual'], breakdowns: [{ dim: 'type', measure: 'visits', chart: 'donut' }, { dim: 'channel', measure: 'visits', chart: 'donut', title: 'By channel' }], trend: { measures: ['visits'], splitBy: 'type', chart: 'bar' }, groupBy: 'type', groupMeasures: ['visits', 'completed', 'avgConsult'],
})
R('patients', 'referral-activity', 'Referral Activity', 'Analysis', 'visits', 'Inbound referrals by source and outbound referrals made by clinicians.', {
  where: (r) => r.type === 'Referral' || r.referredOut !== '—', whereLabel: 'Referred in or out', kpis: ['referralsIn', 'referralsOut', 'patients'],
  breakdowns: [{ dim: 'referralSource', measure: 'referralsIn', chart: 'donut', title: 'Referrals received by source' }, { dim: 'referredOut', measure: 'referralsOut', chart: 'hbar', title: 'Referrals made to' }], groupBy: 'department', groupMeasures: ['referralsIn', 'referralsOut'], defaultPeriod: 'last_quarter',
})
R('patients', 'patient-volume-trends', 'Patient Volume Trends', 'Trend', 'visits', 'Twelve-month visit trend with weekday and hourly arrival patterns for staffing.', {
  kpis: ['visits', 'perDay', 'newPatients', 'patients'], trend: { measures: ['visits', 'newPatients'], chart: 'line' }, breakdowns: [{ dim: 'weekday', measure: 'visits', chart: 'bar', title: 'Visits by weekday' }, { dim: 'hour', measure: 'visits', chart: 'bar', title: 'Arrivals by hour' }],
  groupBy: 'month', groupMeasures: ['visits', 'newPatients', 'patients'], defaultPeriod: 'last12',
})
R('patients', 'waiting-time-analysis', 'Waiting Time Analysis', 'Analysis', 'visits', 'Time from arrival to consultation, by facility, department and hour of day.', {
  where: (r) => r.status === 'Completed' || r.status === 'In progress', whereLabel: 'Seen patients', kpis: ['avgWait', 'medianWait', 'p90Wait', 'waitOver60'],
  trend: { measures: ['avgWait'], chart: 'line', title: 'Average wait' }, breakdowns: [{ dim: 'waitBand', measure: 'visits', chart: 'bar', title: 'Distribution of waits' }, { dim: 'hour', measure: 'avgWait', chart: 'bar', title: 'Average wait by arrival hour' }],
  groupBy: 'facility', groupMeasures: ['visits', 'avgWait', 'medianWait', 'p90Wait', 'waitOver60'], recommended: true, audience: 'Operations',
})
R('patients', 'patients-by-payer', 'Patients by Payer', 'Analysis', 'visits', 'Visit volumes by HMO, corporate client and self-pay.', {
  kpis: ['visits', 'patients'], breakdowns: [{ dim: 'payerType', measure: 'visits', chart: 'donut' }, { dim: 'payer', measure: 'visits', chart: 'hbar' }], groupBy: 'payer', groupMeasures: ['visits', 'patients', 'fees'],
})
R('patients', 'no-shows-cancellations', 'No-shows & Cancellations', 'Exception', 'visits', 'Booked appointments not attended and visits cancelled, for appointment management.', {
  where: oneOf('status', 'No-show', 'Cancelled'), whereLabel: 'No-show or cancelled', kpis: ['visits', 'patients'], breakdowns: [{ dim: 'status', measure: 'visits', chart: 'donut' }, { dim: 'department', measure: 'visits', chart: 'hbar' }], groupBy: 'doctor', groupMeasures: ['visits'], defaultView: 'detailed',
})

// ============================================================ CLINICAL
R('clinical', 'clinical-activity-summary', 'Clinical Activity Summary', 'Summary', 'visits', 'Consultations completed, documentation, referrals and follow-ups across the clinical service.', {
  kpis: ['completed', 'patients', 'avgConsult', 'docRate', 'referralsOut', 'followUpsBooked'], trend: { measures: ['completed'], chart: 'bar' }, breakdowns: [{ dim: 'department', measure: 'completed', chart: 'hbar' }, { dim: 'type', measure: 'completed', chart: 'donut' }],
  groupBy: 'department', groupMeasures: ['completed', 'patients', 'avgConsult', 'docRate', 'referralsOut'], recommended: true, audience: 'Clinical leads',
})
R('clinical', 'consultation-register', 'Consultation Register', 'Register', 'visits', 'Line listing of completed consultations with clinician, diagnosis and documentation status.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed consultations', kpis: ['completed', 'patients', 'avgConsult'], trend: { measures: ['completed'], chart: 'bar' }, groupBy: 'doctor', groupMeasures: ['completed'], defaultView: 'detailed',
  columns: ['date', 'id', 'patient', 'facility', 'department', 'doctor', 'type', 'channel', 'diagnosisCode', 'diagnosis', 'documentation', 'followUp'],
})
R('clinical', 'consultations-by-doctor', 'Consultations by Doctor', 'Analysis', 'visits', 'Consultation counts, consultation length and documentation per clinician.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['completed', 'doctors', 'perDoctor'], breakdowns: [{ dim: 'doctor', measure: 'completed', chart: 'hbar' }], groupBy: 'doctor', groupMeasures: ['completed', 'patients', 'avgConsult', 'docRate', 'referralsOut'],
})
R('clinical', 'consultations-by-specialty', 'Consultations by Specialty', 'Analysis', 'visits', 'Volume and mix of consultations by medical specialty.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['completed', 'patients'], breakdowns: [{ dim: 'specialty', measure: 'completed', chart: 'donut' }], trend: { measures: ['completed'], splitBy: 'specialty', chart: 'bar' }, groupBy: 'specialty', groupMeasures: ['completed', 'patients', 'avgConsult', 'fees'],
})
R('clinical', 'consultations-by-department', 'Consultations by Department', 'Analysis', 'visits', 'Completed consultations per department with average wait and length.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['completed', 'avgWait', 'avgConsult'], breakdowns: [{ dim: 'department', measure: 'completed', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['completed', 'patients', 'avgWait', 'avgConsult'],
})
R('clinical', 'consultations-by-facility', 'Consultations by Facility', 'Comparison', 'visits', 'Facility comparison of consultations, clinicians and productivity.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['completed', 'doctors', 'perDoctor'], breakdowns: [{ dim: 'facility', measure: 'completed', chart: 'bar' }], trend: { measures: ['completed'], splitBy: 'facility', chart: 'line' }, groupBy: 'facility', groupMeasures: ['completed', 'doctors', 'perDoctor', 'avgConsult', 'docRate'],
})
R('clinical', 'doctor-workload', 'Doctor Workload', 'Analysis', 'doctorUtilization', 'Patients seen per clinic day and slot utilization for each clinician.', {
  kpis: ['seen', 'perDay', 'utilization', 'clinicians'], breakdowns: [{ dim: 'utilBand', measure: 'clinicians', chart: 'donut', title: 'Clinicians by utilization band' }, { dim: 'doctor', measure: 'seen', chart: 'hbar', title: 'Patients seen' }], groupBy: 'doctor', groupMeasures: ['clinicDays', 'seen', 'perDay', 'utilization'],
})
R('clinical', 'clinical-service-utilization', 'Service Utilization', 'Analysis', 'procedures', 'Clinical procedures and services ordered alongside consultations.', {
  kpis: ['count', 'completed', 'cancelRate', 'revenue'], breakdowns: [{ dim: 'category', measure: 'count', chart: 'donut' }, { dim: 'procedure', measure: 'count', chart: 'hbar' }], groupBy: 'procedure', groupMeasures: ['count', 'completed', 'cancelled', 'revenue'],
})
R('clinical', 'follow-up-visits', 'Follow-up Visits', 'Analysis', 'visits', 'Follow-up and review attendances, and follow-ups booked at the end of consultations.', {
  where: oneOf('type', 'Follow-up', 'Review'), whereLabel: 'Follow-up & review visits', kpis: ['visits', 'patients', 'noShowRate'], trend: { measures: ['visits'], chart: 'bar' }, breakdowns: [{ dim: 'department', measure: 'visits', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['visits', 'patients', 'noShowRate'],
})
R('clinical', 'clinical-documentation-completion', 'Clinical Documentation Completion', 'Analysis', 'visits', 'Share of completed consultations with signed-off clinical notes, by clinician.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', detailWhere: oneOf('documentation', 'Incomplete'), detailWhereLabel: 'Records list shows incomplete notes only', kpis: ['docRate', 'docIncomplete', 'codingRate'],
  breakdowns: [{ dim: 'documentation', measure: 'completed', chart: 'donut' }, { dim: 'doctor', measure: 'docIncomplete', chart: 'hbar', title: 'Incomplete notes by clinician' }], trend: { measures: ['docRate'], chart: 'line' }, groupBy: 'doctor', groupMeasures: ['completed', 'docIncomplete', 'docRate'], recommended: true,
})

// ============================================================ DIAGNOSES
R('diagnoses', 'diagnosis-summary', 'Diagnosis Summary', 'Summary', 'visits', 'Leading primary diagnoses, comorbidity recording and coding quality.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed consultations', kpis: ['completed', 'distinctDx', 'withSecondary', 'codingRate'], breakdowns: [{ dim: 'diagnosis', measure: 'completed', chart: 'hbar', title: 'Top diagnoses' }, { dim: 'department', measure: 'completed', chart: 'donut' }],
  groupBy: 'diagnosis', groupMeasures: ['completed', 'patients'], recommended: true,
})
R('diagnoses', 'diagnosis-frequency', 'Diagnosis Frequency', 'Analysis', 'visits', 'Frequency table of primary diagnoses with ICD-10 codes.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['completed', 'distinctDx'], breakdowns: [{ dim: 'diagnosis', measure: 'completed', chart: 'hbar' }], groupBy: 'diagnosis', groupMeasures: ['completed', 'patients'],
})
R('diagnoses', 'diagnoses-by-department', 'Diagnoses by Department', 'Analysis', 'visits', 'Case mix within each department.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['completed', 'distinctDx'], breakdowns: [{ dim: 'department', measure: 'completed', chart: 'hbar' }, { dim: 'diagnosis', measure: 'completed', chart: 'hbar', title: 'Top diagnoses' }], groupBy: 'department', groupMeasures: ['completed', 'distinctDx'],
})
R('diagnoses', 'diagnoses-by-facility', 'Diagnoses by Facility', 'Comparison', 'visits', 'Disease burden compared across facilities.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['completed', 'distinctDx'], breakdowns: [{ dim: 'facility', measure: 'completed', chart: 'bar' }, { dim: 'diagnosis', measure: 'completed', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['completed', 'distinctDx', 'codingRate'],
})
R('diagnoses', 'diagnosis-trends', 'Diagnosis Trends', 'Trend', 'visits', 'Monthly trend of leading diagnoses, highlighting seasonal patterns such as malaria.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['completed', 'distinctDx'], trend: { measures: ['completed'], splitBy: 'diagnosis', chart: 'line', title: 'Top diagnoses over time' }, breakdowns: [{ dim: 'diagnosis', measure: 'completed', chart: 'hbar' }], groupBy: 'month', groupMeasures: ['completed', 'distinctDx'], defaultPeriod: 'last12',
})
R('diagnoses', 'primary-secondary-diagnoses', 'Primary & Secondary Diagnoses', 'Analysis', 'visits', 'Consultations recording a secondary diagnosis alongside the primary diagnosis.', {
  where: (r) => r.status === 'Completed' && !!r.secondaryCode, whereLabel: 'Has secondary diagnosis', kpis: ['completed', 'patients'], breakdowns: [{ dim: 'diagnosis', measure: 'completed', chart: 'hbar', title: 'Primary diagnosis' }], groupBy: 'diagnosis', groupMeasures: ['completed'],
  columns: ['date', 'patient', 'facility', 'department', 'doctor', 'diagnosisCode', 'diagnosis', 'secondaryDiagnosis'],
})
R('diagnoses', 'diagnosis-coding-quality', 'Diagnosis Coding Quality', 'Exception', 'visits', 'Missing, unspecified and symptom-only ICD-10 codes by clinician — supports claims accuracy.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', detailWhere: (r) => r.codingFlag !== 'OK', detailWhereLabel: 'Records list shows coding issues only', kpis: ['codingRate', 'missingCodes', 'completed'],
  breakdowns: [{ dim: 'codingFlag', measure: 'completed', chart: 'donut' }, { dim: 'doctor', measure: 'missingCodes', chart: 'hbar', title: 'Missing codes by clinician' }], groupBy: 'doctor', groupMeasures: ['completed', 'missingCodes', 'codingRate'],
})
R('diagnoses', 'malaria-surveillance', 'Malaria Surveillance', 'Trend', 'visits', 'Malaria cases by month, facility and age band for public-health monitoring.', {
  where: (r) => r.status === 'Completed' && r.diagnosisCode === 'B54', whereLabel: 'Primary diagnosis = Malaria (B54)', kpis: ['completed', 'patients'], trend: { measures: ['completed'], chart: 'bar', title: 'Malaria cases' },
  breakdowns: [{ dim: 'ageBand', measure: 'completed', chart: 'bar', title: 'By age band' }, { dim: 'facility', measure: 'completed', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['completed'], defaultPeriod: 'last12',
})
R('diagnoses', 'ncd-burden', 'Hypertension & Diabetes Burden', 'Analysis', 'visits', 'Non-communicable disease consultations (I10, E11.9, I50.9) by facility and age band.', {
  where: (r) => r.status === 'Completed' && ['I10', 'E11.9', 'I50.9'].includes(r.diagnosisCode), whereLabel: 'Hypertension, diabetes or heart failure', kpis: ['completed', 'patients'],
  breakdowns: [{ dim: 'diagnosis', measure: 'completed', chart: 'donut' }, { dim: 'ageBand', measure: 'completed', chart: 'bar' }], trend: { measures: ['completed'], splitBy: 'diagnosis', chart: 'line' }, groupBy: 'facility', groupMeasures: ['completed', 'patients'], defaultPeriod: 'ytd',
})

// ============================================================ ADMISSIONS
R('admissions', 'admissions-summary', 'Admissions Summary', 'Summary', 'admissions', 'Admissions, discharges, length of stay and readmissions across all wards.', {
  kpis: ['admissions', 'discharges', 'alos', 'readmissionRate', 'billed'], trend: { measures: ['admissions', 'discharges'], chart: 'bar' }, breakdowns: [{ dim: 'source', measure: 'admissions', chart: 'donut' }, { dim: 'ward', measure: 'admissions', chart: 'hbar' }],
  groupBy: 'ward', groupMeasures: ['admissions', 'discharges', 'alos', 'readmissions', 'billed'], recommended: true, audience: 'Operations',
})
R('admissions', 'admission-register', 'Admission Register', 'Register', 'admissions', 'Line listing of admissions with ward, bed, diagnosis and status.', {
  kpis: ['admissions', 'current', 'emergencyShare'], trend: { measures: ['admissions'], chart: 'bar' }, groupBy: 'ward', groupMeasures: ['admissions'], defaultView: 'detailed',
  columns: ['admitDate', 'id', 'patient', 'gender', 'ageBand', 'facility', 'ward', 'bed', 'doctor', 'source', 'diagnosis', 'status', 'payerType'],
})
R('admissions', 'discharge-register', 'Discharge Register', 'Register', 'discharges', 'All discharges in the period with length of stay, discharge type and bill.', {
  kpis: ['discharges', 'alos', 'avgBill', 'ama'], trend: { measures: ['discharges'], chart: 'bar' }, breakdowns: [{ dim: 'dischargeType', measure: 'discharges', chart: 'donut' }], groupBy: 'ward', groupMeasures: ['discharges', 'alos', 'billed'], defaultView: 'detailed',
})
R('admissions', 'current-inpatient-census', 'Current Inpatient Census', 'Snapshot', 'inpatients', 'Patients on the wards right now, with bed, clinician and expected discharge date.', {
  kpis: ['admissions', 'avgDaysIn'], breakdowns: [{ dim: 'ward', measure: 'admissions', chart: 'hbar', title: 'Patients by ward' }, { dim: 'payerType', measure: 'admissions', chart: 'donut' }], groupBy: 'ward', groupMeasures: ['admissions', 'avgDaysIn'], defaultView: 'detailed', recommended: true,
})
R('admissions', 'length-of-stay', 'Length of Stay', 'Analysis', 'discharges', 'Average and distribution of length of stay for discharged patients.', {
  kpis: ['alos', 'discharges'], breakdowns: [{ dim: 'losBand', measure: 'discharges', chart: 'bar', title: 'LOS distribution' }, { dim: 'ward', measure: 'alos', chart: 'hbar', title: 'ALOS by ward' }], trend: { measures: ['alos'], chart: 'line' }, groupBy: 'ward', groupMeasures: ['discharges', 'alos'],
})
R('admissions', 'readmissions', 'Readmissions', 'Analysis', 'admissions', 'Patients readmitted to the same facility within 30 days of discharge.', {
  detailWhere: oneOf('readmission', 'Yes'), detailWhereLabel: 'Records list shows readmissions only', kpis: ['readmissions', 'readmissionRate', 'admissions'], trend: { measures: ['readmissionRate'], chart: 'line' },
  breakdowns: [{ dim: 'department', measure: 'readmissions', chart: 'hbar' }], groupBy: 'ward', groupMeasures: ['admissions', 'readmissions', 'readmissionRate'], defaultPeriod: 'ytd',
})
R('admissions', 'bed-occupancy', 'Bed Occupancy', 'Analysis', 'wardDays', 'Midnight bed occupancy by ward and day, including days at full capacity.', {
  kpis: ['occupancy', 'avgOccupied', 'beds', 'fullDays'], trend: { measures: ['occupancy'], chart: 'line' }, breakdowns: [{ dim: 'ward', measure: 'occupancy', chart: 'hbar', title: 'Occupancy by ward' }], groupBy: 'ward', groupMeasures: ['beds', 'avgOccupied', 'occupancy', 'fullDays'], recommended: true,
})
R('admissions', 'bed-utilization', 'Bed Utilization', 'Analysis', 'wardDays', 'Available versus occupied bed-days and bed turnover by facility.', {
  kpis: ['bedDays', 'occupiedDays', 'occupancy', 'turnover'], breakdowns: [{ dim: 'facility', measure: 'occupiedDays', chart: 'bar' }], trend: { measures: ['occupiedDays'], chart: 'bar' }, groupBy: 'facility', groupMeasures: ['beds', 'bedDays', 'occupiedDays', 'occupancy', 'turnover'],
})
R('admissions', 'patient-transfers', 'Patient Transfers', 'Register', 'transfers', 'Inter-ward transfers during admission with reason.', {
  kpis: ['transfers', 'patients'], breakdowns: [{ dim: 'reason', measure: 'transfers', chart: 'donut' }, { dim: 'toWard', measure: 'transfers', chart: 'hbar', title: 'Receiving ward' }], groupBy: 'facility', groupMeasures: ['transfers'], defaultPeriod: 'ytd', defaultView: 'detailed',
})
R('admissions', 'admissions-by-facility', 'Admissions by Facility', 'Comparison', 'admissions', 'Admissions, ALOS and inpatient billing compared across facilities.', {
  kpis: ['admissions', 'alos', 'billed'], breakdowns: [{ dim: 'facility', measure: 'admissions', chart: 'bar' }], trend: { measures: ['admissions'], splitBy: 'facility', chart: 'line' }, groupBy: 'facility', groupMeasures: ['admissions', 'discharges', 'alos', 'readmissionRate', 'billed'],
})
R('admissions', 'admissions-by-department', 'Admissions by Department', 'Analysis', 'admissions', 'Inpatient activity by admitting department.', {
  kpis: ['admissions', 'alos'], breakdowns: [{ dim: 'department', measure: 'admissions', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['admissions', 'discharges', 'alos', 'billed'],
})
R('admissions', 'discharge-delays', 'Discharge Delays', 'Exception', 'discharges', 'Time between discharge order and the patient leaving the ward, with causes.', {
  detailWhere: (r) => r.dischargeDelayHours > 4, detailWhereLabel: 'Records list shows delays over 4 h', kpis: ['avgDelay', 'delayed', 'discharges'],
  breakdowns: [{ dim: 'delayBand', measure: 'discharges', chart: 'bar', title: 'Delay distribution' }, { dim: 'delayReason', measure: 'delayed', chart: 'hbar', title: 'Causes of delays > 4 h' }], groupBy: 'ward', groupMeasures: ['discharges', 'avgDelay', 'delayed'],
})
R('admissions', 'inpatient-revenue', 'Inpatient Revenue', 'Analysis', 'discharges', 'Billing raised at discharge by ward and payer.', {
  kpis: ['billed', 'avgBill', 'discharges'], breakdowns: [{ dim: 'payerType', measure: 'billed', chart: 'donut' }, { dim: 'ward', measure: 'billed', chart: 'hbar' }], trend: { measures: ['billed'], chart: 'bar' }, groupBy: 'ward', groupMeasures: ['discharges', 'billed', 'avgBill'],
})
R('admissions', 'maternity-deliveries', 'Maternity Admissions & Deliveries', 'Analysis', 'admissions', 'Maternity ward admissions including deliveries and pregnancy complications.', {
  where: (r) => r.ward.startsWith('Maternity'), whereLabel: 'Maternity wards', kpis: ['admissions', 'alos', 'billed'], breakdowns: [{ dim: 'diagnosis', measure: 'admissions', chart: 'donut' }, { dim: 'facility', measure: 'admissions', chart: 'hbar' }], trend: { measures: ['admissions'], chart: 'bar' }, groupBy: 'facility', groupMeasures: ['admissions', 'alos', 'billed'], defaultPeriod: 'ytd',
})

// ============================================================ LABORATORY
R('laboratory', 'lab-activity-summary', 'Laboratory Activity Summary', 'Summary', 'labs', 'Tests requested, completed and pending, with turnaround performance and charges.', {
  kpis: ['tests', 'completed', 'pending', 'avgTat', 'withinTarget', 'revenue'], trend: { measures: ['tests'], splitBy: 'category', chart: 'bar' }, breakdowns: [{ dim: 'category', measure: 'tests', chart: 'donut' }, { dim: 'test', measure: 'tests', chart: 'hbar', title: 'Most requested tests' }],
  groupBy: 'category', groupMeasures: ['tests', 'completed', 'pending', 'avgTat', 'withinTarget', 'revenue'], recommended: true, audience: 'Laboratory',
})
R('laboratory', 'lab-test-register', 'Laboratory Test Register', 'Register', 'labs', 'Every test request with status, turnaround and where it was performed.', {
  kpis: ['tests', 'completed', 'pending'], trend: { measures: ['tests'], chart: 'bar' }, groupBy: 'status', groupMeasures: ['tests'], defaultView: 'detailed',
})
R('laboratory', 'tests-by-category', 'Tests by Category', 'Analysis', 'labs', 'Volumes by haematology, chemistry, microbiology, serology, radiology and more.', {
  kpis: ['tests', 'revenue'], breakdowns: [{ dim: 'category', measure: 'tests', chart: 'donut' }], trend: { measures: ['tests'], splitBy: 'category', chart: 'line' }, groupBy: 'category', groupMeasures: ['tests', 'completed', 'avgTat', 'revenue'],
})
R('laboratory', 'tests-by-department', 'Tests by Department', 'Analysis', 'labs', 'Requesting departments and their test mix.', {
  kpis: ['tests', 'urgent'], breakdowns: [{ dim: 'department', measure: 'tests', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['tests', 'urgent', 'revenue'],
})
R('laboratory', 'tests-by-facility', 'Tests by Facility', 'Comparison', 'labs', 'Laboratory workload and turnaround compared across facilities.', {
  kpis: ['tests', 'avgTat', 'withinTarget'], breakdowns: [{ dim: 'facility', measure: 'tests', chart: 'bar' }], trend: { measures: ['tests'], splitBy: 'facility', chart: 'line' }, groupBy: 'facility', groupMeasures: ['tests', 'completed', 'avgTat', 'withinTarget', 'revenue'],
})
R('laboratory', 'tests-by-clinician', 'Tests by Requesting Clinician', 'Analysis', 'labs', 'Ordering patterns by clinician — supports utilization review.', {
  kpis: ['tests', 'patients'], breakdowns: [{ dim: 'clinician', measure: 'tests', chart: 'hbar' }], groupBy: 'clinician', groupMeasures: ['tests', 'patients', 'urgent', 'revenue'],
})
R('laboratory', 'pending-tests', 'Pending Tests', 'Exception', 'labs', 'Tests awaiting results, oldest first — the bench work-list.', {
  where: oneOf('status', 'Pending', 'In progress'), whereLabel: 'Pending or in progress', kpis: ['pending', 'avgPendingAge', 'urgent'], breakdowns: [{ dim: 'category', measure: 'pending', chart: 'donut' }, { dim: 'facility', measure: 'pending', chart: 'hbar' }],
  groupBy: 'category', groupMeasures: ['pending', 'avgPendingAge'], defaultPeriod: 'last30', defaultView: 'detailed', detailSort: { col: 'ageHours', dir: 'desc' }, columns: ['date', 'id', 'patient', 'test', 'category', 'facility', 'clinician', 'priority', 'status', 'ageHours', 'performedAt'],
})
R('laboratory', 'completed-tests', 'Completed Tests', 'Register', 'labs', 'Results released in the period with turnaround times.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['completed', 'avgTat', 'withinTarget'], trend: { measures: ['completed'], chart: 'bar' }, groupBy: 'test', groupMeasures: ['completed', 'avgTat'], defaultView: 'detailed',
})
R('laboratory', 'cancelled-tests', 'Cancelled Tests', 'Register', 'labs', 'Requests cancelled before processing, for wastage and billing review.', {
  where: oneOf('status', 'Cancelled'), whereLabel: 'Cancelled', kpis: ['cancelled'], breakdowns: [{ dim: 'test', measure: 'cancelled', chart: 'hbar' }], groupBy: 'clinician', groupMeasures: ['cancelled'], defaultPeriod: 'ytd', defaultView: 'detailed',
})
R('laboratory', 'turnaround-time', 'Turnaround Time', 'Analysis', 'labs', 'Request-to-result times against target for each test, with breaches.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['avgTat', 'medianTat', 'withinTarget', 'breaches'], trend: { measures: ['withinTarget'], chart: 'line', title: 'Within-target rate' },
  breakdowns: [{ dim: 'category', measure: 'avgTat', chart: 'hbar', title: 'Avg TAT by category' }, { dim: 'withinTarget', measure: 'completed', chart: 'donut' }], groupBy: 'test', groupMeasures: ['completed', 'avgTat', 'medianTat', 'withinTarget', 'breaches'], recommended: true,
})
R('laboratory', 'lab-workload', 'Laboratory Workload', 'Analysis', 'labs', 'Request volumes by hour and weekday to plan bench staffing.', {
  kpis: ['tests', 'urgent'], breakdowns: [{ dim: 'hour', measure: 'tests', chart: 'bar', title: 'Requests by hour' }, { dim: 'weekday', measure: 'tests', chart: 'bar', title: 'Requests by weekday' }], trend: { measures: ['tests'], chart: 'bar' }, groupBy: 'weekday', groupMeasures: ['tests', 'urgent'],
})
R('laboratory', 'lab-revenue', 'Laboratory Revenue', 'Analysis', 'labs', 'Charges for laboratory and imaging requests (excluding cancelled tests).', {
  kpis: ['revenue', 'tests'], breakdowns: [{ dim: 'category', measure: 'revenue', chart: 'donut' }, { dim: 'test', measure: 'revenue', chart: 'hbar' }], trend: { measures: ['revenue'], chart: 'bar' }, groupBy: 'test', groupMeasures: ['tests', 'revenue'],
})
R('laboratory', 'external-lab-referrals', 'External Laboratory Referrals', 'Analysis', 'labs', 'Samples referred to partner reference laboratories and their turnaround.', {
  where: (r) => r.performedAt.startsWith('External'), whereLabel: 'Performed externally', kpis: ['external', 'avgTat', 'withinTarget'], breakdowns: [{ dim: 'performedAt', measure: 'tests', chart: 'donut' }, { dim: 'test', measure: 'tests', chart: 'hbar' }], groupBy: 'performedAt', groupMeasures: ['tests', 'avgTat', 'revenue'], defaultPeriod: 'ytd',
})
R('laboratory', 'imaging-activity', 'Imaging Activity', 'Analysis', 'labs', 'X-ray and ultrasound requests, turnaround and charges.', {
  where: oneOf('category', 'Radiology'), whereLabel: 'Radiology', kpis: ['tests', 'avgTat', 'revenue'], breakdowns: [{ dim: 'test', measure: 'tests', chart: 'donut' }, { dim: 'facility', measure: 'tests', chart: 'hbar' }], groupBy: 'test', groupMeasures: ['tests', 'avgTat', 'revenue'],
})

// ============================================================ PHARMACY
const isMed = (r: Row) => r.kind === 'Medication'
R('pharmacy', 'pharmacy-activity-summary', 'Pharmacy Activity Summary', 'Summary', 'prescriptions', 'Prescriptions, fulfilment, sales and margin with stock-out impact.', {
  kpis: ['lines', 'fulfilment', 'units', 'revenue', 'margin', 'stockouts'], trend: { measures: ['revenue'], chart: 'bar', title: 'Pharmacy sales' }, breakdowns: [{ dim: 'category', measure: 'revenue', chart: 'donut' }, { dim: 'medication', measure: 'revenue', chart: 'hbar', title: 'Top medications by sales' }],
  groupBy: 'category', groupMeasures: ['lines', 'units', 'revenue', 'margin', 'fulfilment'], recommended: true, audience: 'Pharmacy',
})
R('pharmacy', 'medication-sales', 'Medication Sales', 'Analysis', 'prescriptions', 'Sales value and units by medication.', {
  kpis: ['revenue', 'units', 'items'], breakdowns: [{ dim: 'medication', measure: 'revenue', chart: 'hbar' }], trend: { measures: ['revenue'], chart: 'bar' }, groupBy: 'medication', groupMeasures: ['lines', 'units', 'revenue', 'margin'],
})
R('pharmacy', 'prescription-register', 'Prescription Register', 'Register', 'prescriptions', 'All prescription lines with quantities prescribed and dispensed.', {
  kpis: ['lines', 'prescriptions', 'fulfilment'], trend: { measures: ['lines'], chart: 'bar' }, groupBy: 'status', groupMeasures: ['lines'], defaultView: 'detailed',
})
R('pharmacy', 'prescription-fulfilment', 'Prescription Fulfilment', 'Exception', 'prescriptions', 'Lines not fully dispensed — stock-outs, partial fills and uncollected prescriptions.', {
  detailWhere: (r) => r.status !== 'Fully dispensed', detailWhereLabel: 'Records list shows unfilled lines only', kpis: ['fulfilment', 'stockouts', 'partial', 'notCollected'],
  breakdowns: [{ dim: 'status', measure: 'lines', chart: 'donut' }, { dim: 'medication', measure: 'stockouts', chart: 'hbar', title: 'Stock-outs by medication' }], trend: { measures: ['fulfilment'], chart: 'line' }, groupBy: 'facility', groupMeasures: ['lines', 'fulfilment', 'stockouts', 'partial'], recommended: true,
})
R('pharmacy', 'medication-dispensing', 'Medication Dispensing', 'Register', 'prescriptions', 'Medication dispensed to patients, by facility and dispensing department.', {
  where: (r) => r.qtyDispensed > 0, whereLabel: 'Dispensed', kpis: ['lines', 'units', 'revenue'], trend: { measures: ['units'], chart: 'bar' }, groupBy: 'facility', groupMeasures: ['lines', 'units', 'revenue'], defaultView: 'detailed',
})
R('pharmacy', 'drug-consumption', 'Drug Consumption', 'Analysis', 'movements', 'Units and cost of medication dispensed, from the stock ledger.', {
  where: (r) => isMed(r) && r.type === 'Dispensed', whereLabel: 'Medication · Dispensed', kpis: ['consumedUnits', 'consumption', 'items'], breakdowns: [{ dim: 'category', measure: 'consumption', chart: 'donut' }, { dim: 'item', measure: 'consumedUnits', chart: 'hbar' }], trend: { measures: ['consumption'], chart: 'bar' }, groupBy: 'item', groupMeasures: ['consumedUnits', 'consumption'],
})
R('pharmacy', 'pharmacy-stock-balance', 'Stock Balance', 'Snapshot', 'stock', 'Current medication stock on hand, value and days of cover.', {
  where: isMed, whereLabel: 'Medication', kpis: ['skus', 'units', 'value', 'low', 'out'], breakdowns: [{ dim: 'category', measure: 'value', chart: 'donut' }, { dim: 'status', measure: 'skus', chart: 'bar' }], groupBy: 'category', groupMeasures: ['skus', 'units', 'value', 'low'], defaultView: 'detailed',
})
R('pharmacy', 'pharmacy-stock-movement', 'Stock Movement', 'Register', 'movements', 'Medication receipts, dispensing, transfers and write-offs.', {
  where: isMed, whereLabel: 'Medication', kpis: ['movements', 'unitsIn', 'unitsOut', 'valueIn', 'valueOut'], breakdowns: [{ dim: 'type', measure: 'movements', chart: 'donut' }], trend: { measures: ['valueIn', 'valueOut'], chart: 'bar' }, groupBy: 'type', groupMeasures: ['movements', 'unitsIn', 'unitsOut'], defaultView: 'detailed',
})
R('pharmacy', 'pharmacy-stock-adjustments', 'Stock Adjustments', 'Register', 'movements', 'Count variances posted after cycle counts.', {
  where: (r) => isMed(r) && r.type === 'Adjustment', whereLabel: 'Medication · Adjustment', kpis: ['adjustCount', 'adjustNet'], groupBy: 'facility', groupMeasures: ['adjustCount', 'adjustNet'], defaultPeriod: 'ytd', defaultView: 'detailed',
})
R('pharmacy', 'pharmacy-low-stock', 'Low Stock', 'Exception', 'stock', 'Medicines at or below reorder level — reorder candidates.', {
  where: (r) => isMed(r) && r.status !== 'In stock', whereLabel: 'Medication at/below reorder level', kpis: ['skus', 'out', 'low'], breakdowns: [{ dim: 'facility', measure: 'skus', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['skus', 'out', 'low'], defaultView: 'detailed',
})
R('pharmacy', 'out-of-stock-items', 'Out-of-Stock Items', 'Exception', 'stock', 'Medicines with zero stock on hand at any facility.', {
  where: (r) => isMed(r) && r.status === 'Out of stock', whereLabel: 'Medication · Out of stock', kpis: ['skus'], groupBy: 'facility', groupMeasures: ['skus'], defaultView: 'detailed',
})
R('pharmacy', 'expiring-medication', 'Expiring Medication', 'Exception', 'stock', 'Batches expiring in the next 90 days, with value at risk.', {
  where: (r) => isMed(r) && r.expiringQty > 0, whereLabel: 'Medication expiring ≤ 90 days', kpis: ['expiring', 'expiringValue'], breakdowns: [{ dim: 'expiryBand', measure: 'expiringValue', chart: 'bar' }, { dim: 'facility', measure: 'expiringValue', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['expiring', 'expiringValue'], defaultView: 'detailed', recommended: true,
  columns: ['itemCode', 'item', 'facility', 'onHand', 'expiringQty', 'nearestExpiry', 'daysToExpiry', 'unitCost', 'avgDailyUse'],
})
R('pharmacy', 'expired-medication', 'Expired Medication', 'Register', 'movements', 'Medication written off on expiry, with value lost.', {
  where: (r) => isMed(r) && r.type === 'Expired', whereLabel: 'Medication · Expired write-off', kpis: ['wastage', 'wastageUnits', 'movements'], breakdowns: [{ dim: 'facility', measure: 'wastage', chart: 'hbar' }], groupBy: 'item', groupMeasures: ['wastageUnits', 'wastage'], defaultPeriod: 'last12', defaultView: 'detailed',
})
R('pharmacy', 'medication-returns', 'Medication Returns', 'Register', 'movements', 'Medication returned to the pharmacy by patients or wards.', {
  where: (r) => isMed(r) && r.type === 'Returned', whereLabel: 'Medication · Returned', kpis: ['movements', 'unitsIn', 'valueIn'], groupBy: 'item', groupMeasures: ['movements', 'unitsIn'], defaultPeriod: 'last12', defaultView: 'detailed',
})
R('pharmacy', 'pharmacy-procurement', 'Procurement', 'Register', 'purchaseOrders', 'Medication LPOs raised, delivered and paid.', {
  where: isMed, whereLabel: 'Medication', kpis: ['pos', 'value', 'delivered', 'onTimeRate'], trend: { measures: ['value'], chart: 'bar' }, groupBy: 'supplier', groupMeasures: ['pos', 'value', 'onTimeRate'], defaultView: 'detailed',
})
R('pharmacy', 'pharmacy-supplier-performance', 'Supplier Performance', 'Comparison', 'purchaseOrders', 'On-time delivery, fill rate and delays for medication suppliers.', {
  where: isMed, whereLabel: 'Medication', kpis: ['onTimeRate', 'fillRate', 'avgDelay', 'suppliers'], breakdowns: [{ dim: 'supplier', measure: 'onTimeRate', chart: 'hbar', title: 'On-time delivery' }], groupBy: 'supplier', groupMeasures: ['pos', 'value', 'onTimeRate', 'fillRate', 'avgDelay'], defaultPeriod: 'ytd',
})
R('pharmacy', 'pharmacy-revenue', 'Pharmacy Revenue', 'Analysis', 'prescriptions', 'Pharmacy sales by facility and payer type.', {
  kpis: ['revenue', 'margin', 'marginPct'], trend: { measures: ['revenue'], splitBy: 'facility', chart: 'bar' }, breakdowns: [{ dim: 'payerType', measure: 'revenue', chart: 'donut' }], groupBy: 'facility', groupMeasures: ['lines', 'revenue', 'margin', 'marginPct'],
})
R('pharmacy', 'medication-purchase-cost', 'Medication Purchase Cost', 'Analysis', 'purchaseOrders', 'Spend on medication purchases by therapeutic class and supplier.', {
  where: isMed, whereLabel: 'Medication', kpis: ['value', 'paid', 'payable'], breakdowns: [{ dim: 'category', measure: 'value', chart: 'donut' }, { dim: 'supplier', measure: 'value', chart: 'hbar' }], trend: { measures: ['value'], chart: 'bar' }, groupBy: 'category', groupMeasures: ['pos', 'value', 'paid'], defaultPeriod: 'ytd',
})
R('pharmacy', 'medication-margin', 'Medication Margin', 'Analysis', 'prescriptions', 'Sales, cost of goods and gross margin per medication.', {
  kpis: ['revenue', 'cost', 'margin', 'marginPct'], breakdowns: [{ dim: 'category', measure: 'margin', chart: 'hbar' }], groupBy: 'medication', groupMeasures: ['units', 'revenue', 'cost', 'margin', 'marginPct'],
})
R('pharmacy', 'pharmacy-consumption-by-department', 'Consumption by Department', 'Analysis', 'movements', 'Medication dispensed to each clinical department.', {
  where: (r) => isMed(r) && r.type === 'Dispensed', whereLabel: 'Medication · Dispensed', kpis: ['consumption', 'consumedUnits'], breakdowns: [{ dim: 'department', measure: 'consumption', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['consumedUnits', 'consumption'],
})
R('pharmacy', 'pharmacy-consumption-by-facility', 'Consumption by Facility', 'Comparison', 'movements', 'Medication consumption compared across facilities.', {
  where: (r) => isMed(r) && r.type === 'Dispensed', whereLabel: 'Medication · Dispensed', kpis: ['consumption', 'consumedUnits'], breakdowns: [{ dim: 'facility', measure: 'consumption', chart: 'bar' }], trend: { measures: ['consumption'], splitBy: 'facility', chart: 'line' }, groupBy: 'facility', groupMeasures: ['consumedUnits', 'consumption', 'items'],
})

// ============================================================ INVENTORY
R('inventory', 'inventory-summary', 'Inventory Summary', 'Snapshot', 'stock', 'Stock value, low-stock and expiry exposure across medicines and consumables.', {
  kpis: ['value', 'skus', 'low', 'out', 'expiring', 'expiringValue'], breakdowns: [{ dim: 'category', measure: 'value', chart: 'hbar', title: 'Value by category' }, { dim: 'facility', measure: 'value', chart: 'donut' }, { dim: 'status', measure: 'skus', chart: 'bar', title: 'Lines by status' }],
  groupBy: 'facility', groupMeasures: ['skus', 'units', 'value', 'low', 'out', 'expiringValue'], recommended: true, audience: 'Stores',
})
R('inventory', 'inventory-valuation', 'Inventory Valuation', 'Snapshot', 'stock', 'Stock at cost and retail value by category and facility.', {
  kpis: ['value', 'retailValue', 'units'], breakdowns: [{ dim: 'category', measure: 'value', chart: 'hbar' }, { dim: 'kind', measure: 'value', chart: 'donut' }], groupBy: 'category', groupMeasures: ['skus', 'units', 'value', 'retailValue'],
})
R('inventory', 'stock-movement-register', 'Stock Movement Register', 'Register', 'movements', 'Full stock ledger of receipts, issues, transfers, adjustments and write-offs.', {
  kpis: ['movements', 'valueIn', 'valueOut'], trend: { measures: ['valueIn', 'valueOut'], chart: 'bar' }, breakdowns: [{ dim: 'type', measure: 'movements', chart: 'donut' }], groupBy: 'type', groupMeasures: ['movements', 'unitsIn', 'unitsOut', 'valueIn', 'valueOut'], defaultView: 'detailed',
})
R('inventory', 'stock-consumption', 'Stock Consumption', 'Analysis', 'movements', 'Value and units consumed through dispensing and departmental issues.', {
  where: oneOf('type', 'Dispensed', 'Issued'), whereLabel: 'Dispensed & issued', kpis: ['consumption', 'consumedUnits', 'items'], trend: { measures: ['consumption'], splitBy: 'kind', chart: 'bar' }, breakdowns: [{ dim: 'category', measure: 'consumption', chart: 'hbar' }], groupBy: 'category', groupMeasures: ['consumedUnits', 'consumption'],
})
R('inventory', 'stock-adjustments', 'Stock Adjustments', 'Register', 'movements', 'Cycle-count adjustments for medicines and consumables.', {
  where: oneOf('type', 'Adjustment'), whereLabel: 'Adjustment', kpis: ['adjustCount', 'adjustNet'], breakdowns: [{ dim: 'facility', measure: 'adjustCount', chart: 'hbar' }], groupBy: 'category', groupMeasures: ['adjustCount', 'adjustNet'], defaultPeriod: 'ytd', defaultView: 'detailed',
})
R('inventory', 'stock-transfers', 'Stock Transfers', 'Register', 'movements', 'Inter-facility stock transfers raised to cover shortages.', {
  where: oneOf('type', 'Transfer in', 'Transfer out'), whereLabel: 'Transfers', kpis: ['transfers', 'unitsIn', 'unitsOut'], breakdowns: [{ dim: 'facility', measure: 'transfers', chart: 'hbar' }], groupBy: 'item', groupMeasures: ['transfers', 'unitsIn'], defaultPeriod: 'ytd', defaultView: 'detailed',
})
R('inventory', 'stock-reconciliation', 'Stock Reconciliation', 'Reconciliation', 'stockRecon', 'Opening + receipts + transfers − consumption − wastage ± adjustments = closing, per item.', {
  kpis: ['lines', 'balanced', 'consumedValue', 'closingValue', 'adjustUnits'], breakdowns: [{ dim: 'status', measure: 'lines', chart: 'donut' }], groupBy: 'category', groupMeasures: ['lines', 'balanced', 'consumedValue', 'closingValue'], defaultPeriod: 'last_month', defaultView: 'detailed',
})
R('inventory', 'inventory-low-stock', 'Low Stock', 'Exception', 'stock', 'All items (medicines and consumables) at or below reorder level.', {
  where: (r) => r.status !== 'In stock', whereLabel: 'At/below reorder level', kpis: ['skus', 'out', 'low'], breakdowns: [{ dim: 'kind', measure: 'skus', chart: 'donut' }, { dim: 'facility', measure: 'skus', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['skus', 'out', 'low'], defaultView: 'detailed',
})
R('inventory', 'expiring-expired-stock', 'Expiring & Expired Stock', 'Exception', 'stock', 'Stock expiring within 90 days across all stores.', {
  where: (r) => r.expiringQty > 0, whereLabel: 'Expiring ≤ 90 days', kpis: ['expiring', 'expiringValue'], breakdowns: [{ dim: 'expiryBand', measure: 'expiringValue', chart: 'bar' }, { dim: 'kind', measure: 'expiringValue', chart: 'donut' }], groupBy: 'category', groupMeasures: ['expiring', 'expiringValue'], defaultView: 'detailed',
})
R('inventory', 'damaged-stock', 'Damaged Stock', 'Register', 'movements', 'Breakages and damaged items written off.', {
  where: oneOf('type', 'Damaged'), whereLabel: 'Damaged', kpis: ['wastage', 'wastageUnits', 'movements'], breakdowns: [{ dim: 'category', measure: 'wastage', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['movements', 'wastage'], defaultPeriod: 'ytd', defaultView: 'detailed',
})
R('inventory', 'wastage', 'Wastage', 'Analysis', 'movements', 'Value lost to expiry and damage, by category and facility.', {
  where: oneOf('type', 'Damaged', 'Expired'), whereLabel: 'Damaged or expired', kpis: ['wastage', 'wastageUnits'], breakdowns: [{ dim: 'type', measure: 'wastage', chart: 'donut' }, { dim: 'category', measure: 'wastage', chart: 'hbar' }], trend: { measures: ['wastage'], chart: 'bar' }, groupBy: 'facility', groupMeasures: ['wastageUnits', 'wastage'], defaultPeriod: 'last12',
})
R('inventory', 'procurement-receiving', 'Procurement & Receiving', 'Analysis', 'purchaseOrders', 'LPOs raised and goods received for all stock items.', {
  kpis: ['pos', 'value', 'delivered', 'fillRate'], trend: { measures: ['value'], splitBy: 'kind', chart: 'bar' }, breakdowns: [{ dim: 'status', measure: 'pos', chart: 'donut' }], groupBy: 'facility', groupMeasures: ['pos', 'value', 'delivered', 'fillRate', 'open'],
})
R('inventory', 'supplier-reports', 'Supplier Reports', 'Comparison', 'purchaseOrders', 'Spend, delivery reliability and payables per supplier.', {
  kpis: ['suppliers', 'value', 'onTimeRate', 'payable'], breakdowns: [{ dim: 'supplier', measure: 'value', chart: 'hbar' }], groupBy: 'supplier', groupMeasures: ['pos', 'value', 'onTimeRate', 'fillRate', 'avgDelay', 'payable'], defaultPeriod: 'ytd',
})
R('inventory', 'stock-turnover', 'Stock Turnover', 'Analysis', 'stockRecon', 'How many times average stock was consumed in the period; slow movers flagged.', {
  kpis: ['turnover', 'slow', 'consumedValue', 'closingValue'], breakdowns: [{ dim: 'category', measure: 'turnover', chart: 'hbar', title: 'Median turnover by category' }], groupBy: 'category', groupMeasures: ['lines', 'turnover', 'slow', 'consumedValue'], defaultPeriod: 'last_quarter',
  columns: ['item', 'category', 'facility', 'opening', 'consumed', 'closing', 'turnover', 'closingValue'],
})
R('inventory', 'inventory-consumption-by-department', 'Consumption by Department', 'Analysis', 'movements', 'Stock issued and dispensed to each department or store.', {
  where: oneOf('type', 'Dispensed', 'Issued'), whereLabel: 'Dispensed & issued', kpis: ['consumption', 'consumedUnits'], breakdowns: [{ dim: 'department', measure: 'consumption', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['consumedUnits', 'consumption'],
})
R('inventory', 'inventory-consumption-by-facility', 'Consumption by Facility', 'Comparison', 'movements', 'Consumption value compared across facilities.', {
  where: oneOf('type', 'Dispensed', 'Issued'), whereLabel: 'Dispensed & issued', kpis: ['consumption', 'consumedUnits'], breakdowns: [{ dim: 'facility', measure: 'consumption', chart: 'bar' }], trend: { measures: ['consumption'], splitBy: 'facility', chart: 'line' }, groupBy: 'facility', groupMeasures: ['consumedUnits', 'consumption'],
})
R('inventory', 'consumption-by-item-category', 'Consumption by Item Category', 'Analysis', 'movements', 'Consumption value by therapeutic class and consumable category.', {
  where: oneOf('type', 'Dispensed', 'Issued'), whereLabel: 'Dispensed & issued', kpis: ['consumption', 'items'], breakdowns: [{ dim: 'category', measure: 'consumption', chart: 'donut' }], trend: { measures: ['consumption'], splitBy: 'category', chart: 'bar' }, groupBy: 'category', groupMeasures: ['consumedUnits', 'consumption', 'items'],
})

// ============================================================ PROCUREMENT
R('procurement', 'lpo-register', 'LPO Register', 'Register', 'purchaseOrders', 'All local purchase orders with approval, delivery and payment status.', {
  kpis: ['pos', 'value', 'open', 'delivered'], trend: { measures: ['pos'], chart: 'bar' }, breakdowns: [{ dim: 'status', measure: 'pos', chart: 'donut' }], groupBy: 'status', groupMeasures: ['pos', 'value'], defaultView: 'detailed',
})
R('procurement', 'paid-lpos', 'Paid LPOs', 'Register', 'purchaseOrders', 'Repository of LPOs paid to suppliers, with approval and payment dates.', {
  where: oneOf('status', 'Paid'), whereLabel: 'Status = Paid', kpis: ['pos', 'paid', 'suppliers'], trend: { measures: ['paid'], chart: 'bar' }, breakdowns: [{ dim: 'supplier', measure: 'paid', chart: 'hbar' }], groupBy: 'supplier', groupMeasures: ['pos', 'paid'], defaultView: 'detailed',
  columns: ['id', 'supplier', 'facility', 'item', 'approvalDate', 'approvedBy', 'paymentDate', 'amount', 'status'],
})
R('procurement', 'supplier-performance-scorecard', 'Supplier Performance Scorecard', 'Comparison', 'purchaseOrders', 'Supplier reliability: on-time delivery, fill rate and average delay.', {
  kpis: ['onTimeRate', 'fillRate', 'avgDelay', 'suppliers'], breakdowns: [{ dim: 'supplier', measure: 'onTimeRate', chart: 'hbar' }], groupBy: 'supplier', groupMeasures: ['pos', 'delivered', 'onTimeRate', 'fillRate', 'avgDelay', 'value'], defaultPeriod: 'ytd', recommended: true,
})
R('procurement', 'supplier-payables', 'Outstanding Supplier Payables', 'Aging', 'purchaseOrders', 'Delivered LPOs awaiting payment.', {
  where: oneOf('status', 'Delivered', 'Partially delivered'), whereLabel: 'Delivered, unpaid', kpis: ['payable', 'pos'], breakdowns: [{ dim: 'supplier', measure: 'payable', chart: 'hbar' }], groupBy: 'supplier', groupMeasures: ['pos', 'payable'], defaultPeriod: 'last12', defaultView: 'detailed',
})
R('procurement', 'late-deliveries', 'Late Deliveries', 'Exception', 'purchaseOrders', 'Orders delivered after the expected date, with days late.', {
  where: oneOf('onTime', 'No'), whereLabel: 'Delivered late', kpis: ['pos', 'avgDelay', 'value'], breakdowns: [{ dim: 'supplier', measure: 'pos', chart: 'hbar' }], groupBy: 'supplier', groupMeasures: ['pos', 'avgDelay'], defaultPeriod: 'ytd', defaultView: 'detailed',
})

// ============================================================ INSURANCE
R('insurance', 'insurance-activity-summary', 'Insurance Activity Summary', 'Summary', 'claims', 'HMO claims value through the pipeline — claimed, approved, paid and outstanding.', {
  kpis: ['claims', 'claimed', 'approved', 'paid', 'outstanding', 'rejectionRate'], trend: { measures: ['claimed', 'paid'], chart: 'bar' }, breakdowns: [{ dim: 'status', measure: 'claims', chart: 'donut' }, { dim: 'hmo', measure: 'claimed', chart: 'hbar' }],
  groupBy: 'hmo', groupMeasures: ['claims', 'claimed', 'approved', 'paid', 'outstanding', 'rejectionRate'], recommended: true, audience: 'Finance',
})
R('insurance', 'claims-register', 'Claims Register', 'Register', 'claims', 'Every HMO claim with enrollee, values, status and dates.', {
  kpis: ['claims', 'claimed', 'paid'], trend: { measures: ['claims'], chart: 'bar' }, groupBy: 'status', groupMeasures: ['claims', 'claimed'], defaultView: 'detailed',
})
R('insurance', 'claims-by-hmo', 'Claims by HMO', 'Comparison', 'claims', 'Claims value, approval ratio and payment speed per HMO.', {
  kpis: ['claimed', 'approvalRate', 'daysToPay'], breakdowns: [{ dim: 'hmo', measure: 'claimed', chart: 'bar' }], groupBy: 'hmo', groupMeasures: ['claims', 'claimed', 'approved', 'paid', 'approvalRate', 'daysToPay', 'outstanding'],
})
R('insurance', 'claims-by-facility', 'Claims by Facility', 'Comparison', 'claims', 'Claims generated and recovered by each facility.', {
  kpis: ['claimed', 'paid', 'outstanding'], breakdowns: [{ dim: 'facility', measure: 'claimed', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['claims', 'claimed', 'paid', 'outstanding', 'rejectionRate'],
})
R('insurance', 'submitted-claims', 'Submitted Claims', 'Register', 'claims', 'Claims submitted to HMOs and awaiting or past vetting.', {
  where: (r) => !!r.submittedDate, whereLabel: 'Submitted', kpis: ['submitted', 'claimed'], breakdowns: [{ dim: 'hmo', measure: 'claims', chart: 'hbar' }], groupBy: 'hmo', groupMeasures: ['claims', 'claimed'], defaultView: 'detailed',
})
R('insurance', 'approved-claims', 'Approved Claims', 'Register', 'claims', 'Claims approved in full or in part (including those since paid).', {
  where: oneOf('status', 'Approved', 'Partially approved', 'Paid'), whereLabel: 'Approved / part-approved / paid', kpis: ['claims', 'approved', 'approvalRate'], breakdowns: [{ dim: 'status', measure: 'approved', chart: 'donut' }], groupBy: 'hmo', groupMeasures: ['claims', 'claimed', 'approved'], defaultView: 'detailed',
})
R('insurance', 'rejected-claims', 'Rejected Claims', 'Exception', 'claims', 'Claims rejected by HMOs, with reasons — for resubmission or write-off.', {
  where: oneOf('status', 'Rejected'), whereLabel: 'Rejected', kpis: ['rejected', 'rejectedValue'], breakdowns: [{ dim: 'rejectionReason', measure: 'claims', chart: 'hbar' }, { dim: 'hmo', measure: 'rejectedValue', chart: 'donut' }], groupBy: 'rejectionReason', groupMeasures: ['claims', 'rejectedValue'], defaultPeriod: 'ytd', recommended: true,
})
R('insurance', 'pending-claims', 'Pending Claims', 'Exception', 'claims', 'Claims not yet decided — drafts, submitted and under review.', {
  where: oneOf('status', 'Draft', 'Submitted', 'Under review'), whereLabel: 'Draft / submitted / under review', kpis: ['pending', 'outstanding'], breakdowns: [{ dim: 'status', measure: 'claims', chart: 'donut' }, { dim: 'hmo', measure: 'outstanding', chart: 'hbar' }], groupBy: 'hmo', groupMeasures: ['claims', 'outstanding'], defaultPeriod: 'last12', defaultView: 'detailed',
})
R('insurance', 'outstanding-reimbursements', 'Outstanding Reimbursements', 'Aging', 'claims', 'Approved and undecided claim value not yet received, aged from service date.', {
  where: (r) => r.outstanding > 0, whereLabel: 'Outstanding > ₦0', kpis: ['outstanding', 'claims'], breakdowns: [{ dim: 'agingBucket', measure: 'outstanding', chart: 'bar' }, { dim: 'hmo', measure: 'outstanding', chart: 'hbar' }], groupBy: 'hmo', groupMeasures: ['claims', 'outstanding'], defaultPeriod: 'last12',
})
R('insurance', 'claims-adjustments', 'Claims Adjustments', 'Register', 'adjustments', 'HMO disallowances written off against invoices.', {
  where: oneOf('type', 'Claims Adjustment'), whereLabel: 'Claims adjustments', kpis: ['total', 'count'], breakdowns: [{ dim: 'reason', measure: 'total', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['count', 'total'], defaultPeriod: 'ytd', defaultView: 'detailed',
})
R('insurance', 'claims-payment-reconciliation', 'Claims Payment Reconciliation', 'Reconciliation', 'claims', 'Approved value versus remittances received, per HMO.', {
  where: (r) => !!r.vettedDate, whereLabel: 'Vetted claims', kpis: ['approved', 'paid', 'outstanding', 'approvalRate'], breakdowns: [{ dim: 'status', measure: 'approved', chart: 'donut' }], groupBy: 'hmo', groupMeasures: ['claims', 'claimed', 'approved', 'paid', 'outstanding'], defaultPeriod: 'ytd',
})
R('insurance', 'claims-aging', 'Claims Aging', 'Aging', 'claims', 'Unpaid claims by age band and HMO.', {
  where: (r) => r.outstanding > 0, whereLabel: 'Unpaid', kpis: ['outstanding', 'pending'], breakdowns: [{ dim: 'agingBucket', measure: 'claims', chart: 'bar', title: 'Claims by age' }], groupBy: 'agingBucket', groupMeasures: ['claims', 'outstanding'], defaultPeriod: 'last12',
})
R('insurance', 'insurance-revenue', 'Insurance Revenue', 'Analysis', 'invoices', 'Revenue billed to HMOs and collected through remittances.', {
  where: oneOf('payerType', 'HMO'), whereLabel: 'Payer type = HMO', kpis: ['net', 'paid', 'balance', 'collectionRate'], trend: { measures: ['net', 'paid'], chart: 'bar' }, breakdowns: [{ dim: 'payer', measure: 'net', chart: 'hbar' }], groupBy: 'payer', groupMeasures: ['count', 'net', 'paid', 'balance'],
})
R('insurance', 'tariff-pricing-variance', 'Tariff & Pricing Variance', 'Exception', 'claims', 'Claims billed above the HMO agreed tariff, and the variance value.', {
  where: (r) => r.tariff < r.claimed, whereLabel: 'Billed above tariff', kpis: ['varianceClaims', 'tariffVariance'], breakdowns: [{ dim: 'hmo', measure: 'tariffVariance', chart: 'hbar' }, { dim: 'department', measure: 'tariffVariance', chart: 'donut' }], groupBy: 'hmo', groupMeasures: ['claims', 'claimed', 'tariffVariance'],
  columns: ['serviceDate', 'id', 'hmo', 'patient', 'facility', 'department', 'claimed', 'tariff', 'approved', 'status'],
})
R('insurance', 'corporate-clients', 'Corporate Clients', 'Analysis', 'invoices', 'Billing and settlement by corporate retainership clients.', {
  where: oneOf('payerType', 'Corporate'), whereLabel: 'Payer type = Corporate', kpis: ['net', 'paid', 'balance'], breakdowns: [{ dim: 'payer', measure: 'net', chart: 'hbar' }], groupBy: 'payer', groupMeasures: ['count', 'net', 'paid', 'balance', 'collectionRate'],
})

// ============================================================ DOCTOR INTERFACE
R('doctor', 'doctor-activity', 'Doctor Activity', 'Summary', 'visits', 'Consultations, patients and documentation per doctor.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['completed', 'doctors', 'perDoctor', 'docRate'], breakdowns: [{ dim: 'doctor', measure: 'completed', chart: 'hbar' }], trend: { measures: ['completed'], chart: 'bar' }, groupBy: 'doctor', groupMeasures: ['completed', 'patients', 'avgConsult', 'docRate', 'fees'],
})
R('doctor', 'di-consultations-by-doctor', 'Consultations by Doctor', 'Analysis', 'visits', 'Booked versus completed consultations and no-shows per doctor.', {
  kpis: ['visits', 'completed', 'noShowRate'], breakdowns: [{ dim: 'doctor', measure: 'visits', chart: 'hbar' }], groupBy: 'doctor', groupMeasures: ['visits', 'completed', 'cancelled', 'noShowRate'],
})
R('doctor', 'di-consultation-type', 'Consultation Type', 'Analysis', 'visits', 'Mix of new, follow-up, review and referral consultations per doctor.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['completed', 'followUps', 'referralsIn'], breakdowns: [{ dim: 'type', measure: 'completed', chart: 'donut' }], groupBy: 'doctor', groupMeasures: ['completed', 'followUps', 'referralsIn', 'virtual'],
})
R('doctor', 'patient-load', 'Patient Load', 'Analysis', 'doctorUtilization', 'Patients per clinic day per doctor.', {
  kpis: ['perDay', 'seen', 'clinicDays'], breakdowns: [{ dim: 'doctor', measure: 'perDay', chart: 'hbar' }], groupBy: 'doctor', groupMeasures: ['clinicDays', 'seen', 'perDay'],
})
R('doctor', 'specialty-performance', 'Specialty Performance', 'Comparison', 'visits', 'Volumes, waits, consultation length and fees by specialty.', {
  kpis: ['completed', 'avgWait', 'fees'], breakdowns: [{ dim: 'specialty', measure: 'fees', chart: 'hbar' }], groupBy: 'specialty', groupMeasures: ['completed', 'patients', 'avgWait', 'avgConsult', 'docRate', 'fees'],
})
R('doctor', 'availability-utilization', 'Availability & Utilization', 'Analysis', 'doctorUtilization', 'Clinic days worked against working days, and slot utilization (16 slots per clinic day).', {
  kpis: ['availability', 'utilization', 'clinicians', 'capacity'], breakdowns: [{ dim: 'utilBand', measure: 'clinicians', chart: 'donut' }, { dim: 'department', measure: 'utilization', chart: 'hbar' }], groupBy: 'doctor', groupMeasures: ['clinicDays', 'availability', 'capacity', 'seen', 'utilization'], recommended: true,
})
R('doctor', 'di-clinical-documentation', 'Clinical Documentation', 'Analysis', 'visits', 'Notes completion per doctor.', {
  where: oneOf('status', 'Completed'), whereLabel: 'Completed', kpis: ['docRate', 'docIncomplete'], breakdowns: [{ dim: 'doctor', measure: 'docRate', chart: 'hbar' }], groupBy: 'doctor', groupMeasures: ['completed', 'docIncomplete', 'docRate'],
})
R('doctor', 'di-service-volume', 'Service Volume', 'Analysis', 'procedures', 'Procedures and services performed per clinician.', {
  kpis: ['completed', 'revenue'], breakdowns: [{ dim: 'clinician', measure: 'completed', chart: 'hbar' }], groupBy: 'clinician', groupMeasures: ['count', 'completed', 'revenue'],
})
R('doctor', 'prescribing-patterns', 'Prescribing Patterns', 'Analysis', 'prescriptions', 'Prescription lines and therapeutic classes per prescriber.', {
  kpis: ['lines', 'items', 'revenue'], breakdowns: [{ dim: 'category', measure: 'lines', chart: 'donut' }, { dim: 'doctor', measure: 'lines', chart: 'hbar' }], groupBy: 'doctor', groupMeasures: ['lines', 'items', 'revenue'],
})
R('doctor', 'lab-ordering-patterns', 'Laboratory Ordering Patterns', 'Analysis', 'labs', 'Test requests per clinician by category.', {
  kpis: ['tests', 'urgent'], breakdowns: [{ dim: 'clinician', measure: 'tests', chart: 'hbar' }, { dim: 'category', measure: 'tests', chart: 'donut' }], groupBy: 'clinician', groupMeasures: ['tests', 'urgent', 'revenue'],
})

// ============================================================ NURSE INTERFACE
R('nurse', 'nursing-activity', 'Nursing Activity', 'Summary', 'nursing', 'Shifts covered, patients cared for and care tasks completed across wards.', {
  kpis: ['shifts', 'patientShifts', 'completion', 'vitals', 'meds'], trend: { measures: ['completedTasks'], chart: 'bar' }, breakdowns: [{ dim: 'ward', measure: 'completedTasks', chart: 'hbar' }, { dim: 'shift', measure: 'completedTasks', chart: 'donut' }], groupBy: 'ward', groupMeasures: ['shifts', 'patientShifts', 'completedTasks', 'completion'], recommended: true, audience: 'Nursing',
})
R('nurse', 'patient-monitoring', 'Patient Monitoring', 'Analysis', 'nursing', 'Vital-sign observations and medication rounds recorded per ward.', {
  kpis: ['vitals', 'meds', 'patientShifts'], trend: { measures: ['vitals'], chart: 'line' }, breakdowns: [{ dim: 'ward', measure: 'vitals', chart: 'hbar' }], groupBy: 'ward', groupMeasures: ['patientShifts', 'vitals', 'meds'],
})
R('nurse', 'nursing-workload', 'Nursing Workload', 'Analysis', 'nursing', 'Patients and tasks per nurse in charge, per shift.', {
  kpis: ['perShift', 'nurses', 'scheduled'], breakdowns: [{ dim: 'nurse', measure: 'scheduled', chart: 'hbar' }], groupBy: 'nurse', groupMeasures: ['shifts', 'patientShifts', 'perShift', 'scheduled', 'completion'],
})
R('nurse', 'care-task-completion', 'Care Task Completion', 'Exception', 'nursing', 'Delayed and missed care tasks by ward and shift.', {
  detailWhere: (r) => r.tasksMissed > 0, detailWhereLabel: 'Records list shows shifts with missed tasks', kpis: ['completion', 'missed', 'delayed'], trend: { measures: ['completion'], chart: 'line' }, breakdowns: [{ dim: 'shift', measure: 'missed', chart: 'donut' }, { dim: 'ward', measure: 'missed', chart: 'hbar' }], groupBy: 'ward', groupMeasures: ['scheduled', 'completedTasks', 'delayed', 'missed', 'completion'],
})
R('nurse', 'ward-activity', 'Ward Activity', 'Analysis', 'wardDays', 'Admissions, discharges and occupancy for each ward.', {
  kpis: ['admissions', 'discharges', 'occupancy'], trend: { measures: ['admissions', 'discharges'], chart: 'bar' }, breakdowns: [{ dim: 'ward', measure: 'occupancy', chart: 'hbar' }], groupBy: 'ward', groupMeasures: ['admissions', 'discharges', 'avgOccupied', 'occupancy'],
})
R('nurse', 'nursing-department-activity', 'Department Activity', 'Analysis', 'nursing', 'Nursing care delivered by department.', {
  kpis: ['completedTasks', 'patientShifts'], breakdowns: [{ dim: 'department', measure: 'completedTasks', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['shifts', 'patientShifts', 'completedTasks', 'completion'],
})

// ============================================================ DENTAL
const isDental = (r: Row) => r.department === 'Dental'
R('dental', 'dental-consultations', 'Dental Consultations', 'Summary', 'visits', 'Dental clinic attendances, diagnoses and waiting times.', {
  where: isDental, whereLabel: 'Department = Dental', kpis: ['visits', 'completed', 'patients', 'avgWait'], trend: { measures: ['visits'], chart: 'bar' }, breakdowns: [{ dim: 'diagnosis', measure: 'completed', chart: 'hbar' }, { dim: 'facility', measure: 'visits', chart: 'donut' }], groupBy: 'doctor', groupMeasures: ['visits', 'completed', 'avgWait'],
})
R('dental', 'dental-procedures', 'Dental Procedures', 'Register', 'procedures', 'Dental procedures ordered, completed, scheduled and cancelled.', {
  where: isDental, whereLabel: 'Department = Dental', kpis: ['count', 'completed', 'scheduled', 'cancelled'], breakdowns: [{ dim: 'procedure', measure: 'count', chart: 'hbar' }], groupBy: 'procedure', groupMeasures: ['count', 'completed', 'revenue'], defaultView: 'detailed',
})
R('dental', 'treatments-delivered', 'Treatments Delivered', 'Analysis', 'procedures', 'Completed dental treatments by type and dentist.', {
  where: (r) => isDental(r) && r.status === 'Completed', whereLabel: 'Dental · Completed', kpis: ['completed', 'patients', 'revenue'], breakdowns: [{ dim: 'procedure', measure: 'completed', chart: 'donut' }, { dim: 'clinician', measure: 'completed', chart: 'hbar' }], groupBy: 'procedure', groupMeasures: ['completed', 'revenue'],
})
R('dental', 'dental-service-revenue', 'Dental Service Revenue', 'Analysis', 'invoiceLines', 'Gross dental revenue — consultations and procedures.', {
  where: isDental, whereLabel: 'Department = Dental', kpis: ['revenue', 'lines', 'avgLine'], breakdowns: [{ dim: 'service', measure: 'revenue', chart: 'hbar' }, { dim: 'payerType', measure: 'revenue', chart: 'donut' }], trend: { measures: ['revenue'], chart: 'bar' }, groupBy: 'service', groupMeasures: ['lines', 'revenue'],
})
R('dental', 'dental-appointment-activity', 'Appointment Activity', 'Analysis', 'visits', 'Booked versus walk-in dental attendances and no-shows.', {
  where: isDental, whereLabel: 'Department = Dental', kpis: ['visits', 'noShowRate', 'cancelRate'], breakdowns: [{ dim: 'booking', measure: 'visits', chart: 'donut' }, { dim: 'status', measure: 'visits', chart: 'donut' }], groupBy: 'facility', groupMeasures: ['visits', 'noShowRate', 'cancelRate'],
})
R('dental', 'dental-follow-ups', 'Patient Follow-ups', 'Analysis', 'visits', 'Dental review visits and follow-ups booked.', {
  where: (r) => isDental(r) && (r.type === 'Follow-up' || r.type === 'Review'), whereLabel: 'Dental follow-ups', kpis: ['visits', 'patients'], trend: { measures: ['visits'], chart: 'bar' }, groupBy: 'doctor', groupMeasures: ['visits', 'patients'], defaultPeriod: 'last_quarter',
})

// ============================================================ TEAM & ACCESS
R('team', 'staff-distribution', 'Staff Distribution', 'Snapshot', 'staff', 'Headcount of system users by job role and facility.', {
  kpis: ['users', 'active', 'invited', 'roles'], breakdowns: [{ dim: 'role', measure: 'users', chart: 'hbar' }, { dim: 'facility', measure: 'users', chart: 'donut' }], groupBy: 'role', groupMeasures: ['users', 'active'], recommended: true,
})
R('team', 'staff-by-department', 'Staff by Department', 'Snapshot', 'staff', 'Users grouped by department.', { kpis: ['users', 'active'], breakdowns: [{ dim: 'department', measure: 'users', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['users', 'active'] })
R('team', 'staff-by-facility', 'Staff by Facility', 'Snapshot', 'staff', 'Users per facility with active and pending accounts.', { kpis: ['users', 'active', 'invited'], breakdowns: [{ dim: 'facility', measure: 'users', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['users', 'active', 'invited', 'mfaRate'] })
R('team', 'user-activity', 'User Activity', 'Analysis', 'logins', 'Successful sign-ins per user over the period.', {
  where: oneOf('outcome', 'Success'), whereLabel: 'Successful sign-ins', kpis: ['success', 'users'], trend: { measures: ['users'], chart: 'line', title: 'Distinct users signing in' }, breakdowns: [{ dim: 'role', measure: 'success', chart: 'hbar' }], groupBy: 'user', groupMeasures: ['success'], defaultPeriod: 'last30',
})
R('team', 'role-assignments', 'Role Assignments', 'Snapshot', 'staff', 'Which access roles are assigned, to whom and where.', { kpis: ['roles', 'users'], breakdowns: [{ dim: 'accessRole', measure: 'users', chart: 'hbar' }], groupBy: 'accessRole', groupMeasures: ['users', 'active'], defaultView: 'detailed' })
R('team', 'account-status', 'Account Status', 'Snapshot', 'staff', 'Active, suspended, deactivated and invited accounts.', { kpis: ['active', 'inactive', 'invited'], breakdowns: [{ dim: 'status', measure: 'users', chart: 'donut' }, { dim: 'activity', measure: 'users', chart: 'donut' }], groupBy: 'status', groupMeasures: ['users'] })
R('team', 'login-activity', 'Login Activity', 'Trend', 'logins', 'Sign-in volumes by day and hour.', {
  kpis: ['attempts', 'success', 'failed', 'users'], trend: { measures: ['success', 'failed'], chart: 'bar' }, breakdowns: [{ dim: 'hour', measure: 'attempts', chart: 'bar' }, { dim: 'device', measure: 'attempts', chart: 'donut' }], groupBy: 'facility', groupMeasures: ['attempts', 'success', 'failed'], defaultPeriod: 'last30',
})
R('team', 'team-access-changes', 'Access Changes', 'Register', 'security', 'Facility access granted or revoked.', {
  where: oneOf('category', 'Access change'), whereLabel: 'Access changes', kpis: ['events', 'actors'], breakdowns: [{ dim: 'action', measure: 'events', chart: 'donut' }], groupBy: 'actor', groupMeasures: ['events'], defaultPeriod: 'last_quarter', defaultView: 'detailed',
})
R('team', 'user-management-audit', 'User Management Audit', 'Register', 'security', 'Invitations, deactivations, password resets, role and access changes.', {
  where: oneOf('category', 'Access change', 'Permission change', 'Account status'), whereLabel: 'User management events', kpis: ['events', 'high', 'actors'], breakdowns: [{ dim: 'action', measure: 'events', chart: 'hbar' }], groupBy: 'actor', groupMeasures: ['events', 'high'], defaultPeriod: 'last_quarter', defaultView: 'detailed',
})
R('team', 'mfa-adoption', 'MFA Adoption', 'Snapshot', 'staff', 'Multi-factor authentication take-up by facility and role.', { kpis: ['mfaRate', 'users'], breakdowns: [{ dim: 'mfa', measure: 'users', chart: 'donut' }, { dim: 'role', measure: 'mfaRate', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['users', 'mfaRate'] })
R('team', 'dormant-accounts', 'Dormant Accounts', 'Exception', 'staff', 'Active accounts with no sign-in in the last 30 days — review for deactivation.', {
  where: (r) => r.status === 'Active' && r.logins30d === 0, whereLabel: 'Active, no login in 30 days', kpis: ['users'], breakdowns: [{ dim: 'role', measure: 'users', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['users'], defaultView: 'detailed',
})

// ============================================================ SECURITY
R('security', 'authentication-events', 'Authentication Events', 'Summary', 'logins', 'All sign-in attempts with outcomes, devices and source addresses.', {
  kpis: ['attempts', 'success', 'failed', 'failRate', 'external'], trend: { measures: ['attempts'], chart: 'bar' }, breakdowns: [{ dim: 'outcome', measure: 'attempts', chart: 'donut' }, { dim: 'device', measure: 'attempts', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['attempts', 'failed', 'failRate'], defaultPeriod: 'last30', recommended: true, audience: 'IT & security',
})
R('security', 'failed-authentication', 'Failed Authentication Attempts', 'Exception', 'logins', 'Failed sign-ins with reasons and source IPs, highlighting bursts.', {
  where: oneOf('outcome', 'Failed'), whereLabel: 'Failed', kpis: ['failed', 'users', 'external'], trend: { measures: ['failed'], chart: 'bar' }, breakdowns: [{ dim: 'reason', measure: 'failed', chart: 'donut' }, { dim: 'ip', measure: 'failed', chart: 'hbar', title: 'Top source IPs' }], groupBy: 'user', groupMeasures: ['failed'], defaultPeriod: 'last30', defaultView: 'detailed',
})
R('security', 'security-access-changes', 'Access Changes', 'Register', 'security', 'Facility access granted and revoked across the organisation.', { where: oneOf('category', 'Access change'), whereLabel: 'Access changes', kpis: ['events'], breakdowns: [{ dim: 'action', measure: 'events', chart: 'donut' }], groupBy: 'facility', groupMeasures: ['events'], defaultPeriod: 'ytd', defaultView: 'detailed' })
R('security', 'permission-changes', 'Permission Changes', 'Register', 'security', 'Role and permission edits — high-risk changes needing review.', { where: oneOf('category', 'Permission change'), whereLabel: 'Permission changes', kpis: ['events', 'high'], breakdowns: [{ dim: 'action', measure: 'events', chart: 'donut' }], groupBy: 'actor', groupMeasures: ['events', 'high'], defaultPeriod: 'ytd', defaultView: 'detailed' })
R('security', 'administrative-activity', 'Administrative Activity', 'Register', 'security', 'Price-list updates, voided invoices, tariff uploads and similar.', { where: oneOf('category', 'Administrative'), whereLabel: 'Administrative', kpis: ['events', 'high'], breakdowns: [{ dim: 'action', measure: 'events', chart: 'hbar' }], groupBy: 'actor', groupMeasures: ['events'], defaultPeriod: 'last_quarter', defaultView: 'detailed' })
R('security', 'reporting-export-activity', 'Reporting & Export Activity', 'Register', 'security', 'Data exports by user — including sensitive patient list exports.', { where: oneOf('category', 'Report export'), whereLabel: 'Exports', kpis: ['exports', 'high'], breakdowns: [{ dim: 'actor', measure: 'events', chart: 'hbar' }], groupBy: 'actor', groupMeasures: ['events', 'high'], defaultPeriod: 'last_quarter', defaultView: 'detailed' })
R('security', 'security-event-history', 'Security Event History', 'Trend', 'security', 'All security and administrative events by severity over time.', { kpis: ['events', 'high', 'permissions', 'exports'], trend: { measures: ['events'], splitBy: 'severity', chart: 'bar' }, breakdowns: [{ dim: 'category', measure: 'events', chart: 'donut' }], groupBy: 'category', groupMeasures: ['events', 'high'], defaultPeriod: 'last12' })

// ============================================================ SERVICES
R('services', 'service-utilization', 'Service Utilization', 'Summary', 'procedures', 'Procedures and services ordered, completed and billed.', {
  kpis: ['count', 'completed', 'cancelRate', 'revenue', 'avgWait'], trend: { measures: ['count'], splitBy: 'category', chart: 'bar' }, breakdowns: [{ dim: 'category', measure: 'count', chart: 'donut' }, { dim: 'procedure', measure: 'count', chart: 'hbar' }], groupBy: 'procedure', groupMeasures: ['count', 'completed', 'cancelled', 'revenue'], recommended: true,
})
R('services', 'procedures-register', 'Procedures Register', 'Register', 'procedures', 'Line listing of every procedure order.', { kpis: ['count', 'completed', 'scheduled'], trend: { measures: ['count'], chart: 'bar' }, groupBy: 'status', groupMeasures: ['count'], defaultView: 'detailed' })
R('services', 'services-by-department', 'Services by Department', 'Analysis', 'procedures', 'Service volumes and revenue by ordering department.', { kpis: ['count', 'revenue'], breakdowns: [{ dim: 'department', measure: 'count', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['count', 'completed', 'revenue'] })
R('services', 'services-by-facility', 'Services by Facility', 'Comparison', 'procedures', 'Service delivery compared across facilities.', { kpis: ['count', 'revenue', 'cancelRate'], breakdowns: [{ dim: 'facility', measure: 'count', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['count', 'completed', 'cancelRate', 'revenue', 'avgWait'] })
R('services', 'services-revenue-by-service', 'Revenue by Service', 'Analysis', 'invoiceLines', 'Gross revenue from procedures, imaging and dental services.', {
  where: oneOf('category', 'Procedures', 'Imaging', 'Dental'), whereLabel: 'Procedures, imaging & dental', kpis: ['revenue', 'lines'], breakdowns: [{ dim: 'service', measure: 'revenue', chart: 'hbar' }, { dim: 'category', measure: 'revenue', chart: 'donut' }], groupBy: 'service', groupMeasures: ['lines', 'revenue', 'avgLine'],
})
R('services', 'service-volume-trends', 'Service Volume Trends', 'Trend', 'procedures', 'Twelve-month trend of service volumes by category.', { kpis: ['count', 'completed'], trend: { measures: ['count'], splitBy: 'category', chart: 'line' }, breakdowns: [{ dim: 'weekday', measure: 'count', chart: 'bar' }], groupBy: 'month', groupMeasures: ['count', 'completed', 'revenue'], defaultPeriod: 'last12' })
R('services', 'cancelled-services', 'Cancelled Services', 'Exception', 'procedures', 'Cancelled procedures with reasons.', { where: oneOf('status', 'Cancelled'), whereLabel: 'Cancelled', kpis: ['cancelled'], breakdowns: [{ dim: 'cancelReason', measure: 'count', chart: 'donut' }, { dim: 'procedure', measure: 'count', chart: 'hbar' }], groupBy: 'cancelReason', groupMeasures: ['count'], defaultPeriod: 'ytd', defaultView: 'detailed' })
R('services', 'service-waiting-time', 'Service Waiting Time', 'Analysis', 'procedures', 'Days from order to service delivery.', { kpis: ['avgWait', 'waited'], breakdowns: [{ dim: 'category', measure: 'avgWait', chart: 'hbar' }], groupBy: 'procedure', groupMeasures: ['count', 'waited', 'avgWait'] })

// ============================================================ FACILITIES
R('facilities', 'facility-performance-summary', 'Facility Performance Summary', 'Comparison', 'facilityScorecard', 'One-page scorecard comparing every facility on volume, revenue, quality and capacity.', {
  kpis: ['visits', 'revenue', 'collections', 'admissions', 'labs', 'pharmacySales'], breakdowns: [{ dim: 'facility', measure: 'revenue', chart: 'bar', title: 'Net billed by facility' }, { dim: 'facility', measure: 'visits', chart: 'donut', title: 'Share of visits' }],
  groupBy: 'facility', groupMeasures: ['visits', 'revenue', 'collections', 'outstanding', 'admissions', 'occupancy', 'avgWait'], recommended: true, audience: 'Executive',
})
R('facilities', 'facility-comparison', 'Facility Comparison', 'Comparison', 'facilityScorecard', 'Side-by-side comparison of all facility metrics, with leaders highlighted.', {
  kpis: ['visits', 'revenue', 'labs', 'admissions'], breakdowns: [{ dim: 'facility', measure: 'collections', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['visits', 'newPatients', 'revenue', 'collections', 'labs', 'rx', 'pharmacySales', 'admissions', 'claims', 'stockValue'], defaultView: 'detailed',
})
R('facilities', 'fac-revenue-by-facility', 'Revenue by Facility', 'Comparison', 'invoices', 'Net billed revenue per facility with monthly trend.', { kpis: ['net', 'count'], trend: { measures: ['net'], splitBy: 'facility', chart: 'line' }, breakdowns: [{ dim: 'facility', measure: 'net', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['count', 'net', 'avgInvoice'], defaultPeriod: 'ytd' })
R('facilities', 'collections-by-facility', 'Collections by Facility', 'Comparison', 'payments', 'Cash collections per facility by method.', { kpis: ['collected', 'receipts'], trend: { measures: ['collected'], splitBy: 'facility', chart: 'line' }, breakdowns: [{ dim: 'facility', measure: 'collected', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['receipts', 'collected', 'cashless'], defaultPeriod: 'ytd' })
R('facilities', 'patient-visits-by-facility', 'Patient Visits by Facility', 'Comparison', 'visits', 'Visits per facility per day, with waiting times.', { kpis: ['visits', 'perDay'], trend: { measures: ['visits'], splitBy: 'facility', chart: 'line' }, breakdowns: [{ dim: 'facility', measure: 'visits', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['visits', 'perDay', 'avgWait'] })
R('facilities', 'lab-activity-by-facility', 'Laboratory Activity by Facility', 'Comparison', 'labs', 'Test volumes and TAT per facility.', { kpis: ['tests', 'avgTat'], breakdowns: [{ dim: 'facility', measure: 'tests', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['tests', 'avgTat', 'withinTarget', 'revenue'] })
R('facilities', 'pharmacy-activity-by-facility', 'Pharmacy Activity by Facility', 'Comparison', 'prescriptions', 'Pharmacy sales and fulfilment per facility.', { kpis: ['revenue', 'fulfilment'], breakdowns: [{ dim: 'facility', measure: 'revenue', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['lines', 'fulfilment', 'revenue', 'margin'] })
R('facilities', 'inventory-by-facility', 'Inventory by Facility', 'Snapshot', 'stock', 'Stock value and exceptions held at each facility.', { kpis: ['value', 'low', 'expiringValue'], breakdowns: [{ dim: 'facility', measure: 'value', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['skus', 'value', 'low', 'out', 'expiringValue'] })
R('facilities', 'fac-admissions-by-facility', 'Admissions by Facility', 'Comparison', 'admissions', 'Admissions and ALOS per facility.', { kpis: ['admissions', 'alos'], breakdowns: [{ dim: 'facility', measure: 'admissions', chart: 'bar' }], groupBy: 'facility', groupMeasures: ['admissions', 'alos', 'billed'] })
R('facilities', 'department-comparison', 'Department Comparison', 'Comparison', 'departmentScorecard', 'Department scorecard across all facilities.', {
  kpis: ['visits', 'revenue', 'labs', 'rx'], breakdowns: [{ dim: 'department', measure: 'revenue', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['visits', 'newPatients', 'revenue', 'collections', 'labs', 'rx', 'admissions', 'avgWait'],
})
R('facilities', 'organization-wide-summary', 'Organisation-wide Summary', 'Summary', 'facilityScorecard', 'Group-level totals for the board pack, with each facility’s contribution.', {
  kpis: ['visits', 'newPatients', 'revenue', 'collections', 'outstanding', 'admissions', 'labs', 'pharmacySales', 'claims', 'stockValue'], breakdowns: [{ dim: 'facility', measure: 'revenue', chart: 'donut', title: 'Revenue contribution' }, { dim: 'facility', measure: 'visits', chart: 'hbar', title: 'Visits contribution' }],
  groupBy: 'facility', groupMeasures: ['visits', 'revenue', 'collections', 'admissions'], defaultPeriod: 'ytd', recommended: true, audience: 'Executive',
})

// ============================================================ INTEGRATIONS
R('integrations', 'integration-activity', 'Integration Activity', 'Summary', 'integrations', 'Sync runs and records exchanged with each connected system.', {
  kpis: ['runs', 'records', 'successRate', 'failedRuns'], trend: { measures: ['records'], splitBy: 'integration', chart: 'bar' }, breakdowns: [{ dim: 'integration', measure: 'records', chart: 'hbar' }], groupBy: 'integration', groupMeasures: ['runs', 'records', 'failedRecords', 'successRate', 'avgDuration'], defaultPeriod: 'last30',
})
R('integrations', 'synchronization-status', 'Synchronisation Status', 'Snapshot', 'integrations', 'Run outcomes per integration over the selected window.', { kpis: ['successRate', 'failedRuns', 'partialRuns'], breakdowns: [{ dim: 'status', measure: 'runs', chart: 'donut' }], groupBy: 'integration', groupMeasures: ['runs', 'successRate', 'failedRuns', 'partialRuns'], defaultPeriod: 'last7' })
R('integrations', 'failed-sync-events', 'Failed Synchronisation Events', 'Exception', 'integrations', 'Failed and partial runs needing re-processing.', { where: oneOf('status', 'Failed', 'Partial'), whereLabel: 'Failed or partial', kpis: ['runs', 'failedRecords'], breakdowns: [{ dim: 'integration', measure: 'runs', chart: 'hbar' }], groupBy: 'integration', groupMeasures: ['runs', 'failedRecords'], defaultPeriod: 'last30', defaultView: 'detailed' })
R('integrations', 'integration-errors', 'Integration Errors', 'Analysis', 'integrations', 'Error types by integration.', { where: (r) => r.error !== '—', whereLabel: 'Has error', kpis: ['runs', 'failedRecords'], breakdowns: [{ dim: 'error', measure: 'runs', chart: 'hbar' }], groupBy: 'error', groupMeasures: ['runs', 'failedRecords'], defaultPeriod: 'ytd' })
R('integrations', 'processing-volumes', 'Processing Volumes', 'Trend', 'integrations', 'Records processed per integration over time.', { kpis: ['records', 'recordSuccess'], trend: { measures: ['records'], splitBy: 'integration', chart: 'line' }, groupBy: 'integration', groupMeasures: ['records', 'failedRecords', 'recordSuccess'], defaultPeriod: 'last_quarter' })
R('integrations', 'reconciliation-results', 'Reconciliation Results', 'Reconciliation', 'integrations', 'Payment-gateway and general-ledger reconciliation outcomes.', { where: (r) => r.reconciled !== '—', whereLabel: 'Reconciling integrations', kpis: ['balanced', 'variances'], breakdowns: [{ dim: 'reconciled', measure: 'runs', chart: 'donut' }], groupBy: 'integration', groupMeasures: ['runs', 'balanced', 'variances'], defaultPeriod: 'last_quarter' })
R('integrations', 'integration-health-history', 'Integration Health History', 'Trend', 'integrations', 'Twelve-month run success rate per integration.', { kpis: ['successRate', 'failedRuns'], trend: { measures: ['successRate'], splitBy: 'integration', chart: 'line' }, groupBy: 'month', groupMeasures: ['runs', 'successRate', 'failedRuns'], defaultPeriod: 'last12' })

// ============================================================ TELEMEDICINE
const isVirtual = (r: Row) => r.channel === 'Virtual'
R('telemedicine', 'virtual-consultation-summary', 'Virtual Consultation Summary', 'Summary', 'visits', 'Telemedicine sessions, completion, call quality and tokens.', {
  where: isVirtual, whereLabel: 'Channel = Virtual', kpis: ['visits', 'completed', 'goodCalls', 'tokens', 'fees'], trend: { measures: ['visits'], chart: 'bar' }, breakdowns: [{ dim: 'department', measure: 'visits', chart: 'donut' }, { dim: 'callQuality', measure: 'visits', chart: 'donut' }], groupBy: 'facility', groupMeasures: ['visits', 'completed', 'tokens', 'fees'], recommended: true,
})
R('telemedicine', 'tele-consultations-by-type', 'Consultations by Type', 'Analysis', 'visits', 'Virtual follow-ups, reviews and referrals.', { where: isVirtual, whereLabel: 'Virtual', kpis: ['visits'], breakdowns: [{ dim: 'type', measure: 'visits', chart: 'donut' }, { dim: 'department', measure: 'visits', chart: 'hbar' }], groupBy: 'type', groupMeasures: ['visits', 'completed'] })
R('telemedicine', 'tele-consultations-by-doctor', 'Consultations by Doctor', 'Analysis', 'visits', 'Virtual sessions per clinician.', { where: isVirtual, whereLabel: 'Virtual', kpis: ['visits', 'doctors'], breakdowns: [{ dim: 'doctor', measure: 'visits', chart: 'hbar' }], groupBy: 'doctor', groupMeasures: ['visits', 'completed', 'tokens'] })
R('telemedicine', 'consultation-billing', 'Consultation Billing', 'Analysis', 'invoiceLines', 'Fees billed for virtual consultations.', { where: (r) => r.service.startsWith('Virtual consultation'), whereLabel: 'Virtual consultation fees', kpis: ['revenue', 'lines'], breakdowns: [{ dim: 'payerType', measure: 'revenue', chart: 'donut' }], trend: { measures: ['revenue'], chart: 'bar' }, groupBy: 'service', groupMeasures: ['lines', 'revenue'] })
R('telemedicine', 'consultation-completion', 'Consultation Completion', 'Analysis', 'visits', 'Completed, dropped and no-show virtual sessions with call quality.', { where: isVirtual, whereLabel: 'Virtual', kpis: ['completed', 'cancelRate', 'noShowRate', 'goodCalls'], breakdowns: [{ dim: 'status', measure: 'visits', chart: 'donut' }, { dim: 'callQuality', measure: 'visits', chart: 'donut' }], groupBy: 'facility', groupMeasures: ['visits', 'completed', 'cancelRate'] })
R('telemedicine', 'tele-doctor-utilization', 'Doctor Utilization', 'Analysis', 'visits', 'Share of each doctor’s consultations delivered virtually.', { kpis: ['virtual', 'visits'], breakdowns: [{ dim: 'channel', measure: 'visits', chart: 'donut' }], groupBy: 'doctor', groupMeasures: ['visits', 'virtual'] })
R('telemedicine', 'token-usage', 'Token Usage', 'Trend', 'visits', 'Telemedicine tokens consumed (one token per 15 minutes of session time).', { where: isVirtual, whereLabel: 'Virtual', kpis: ['tokens', 'tokensPerConsult', 'visits'], trend: { measures: ['tokens'], chart: 'bar' }, breakdowns: [{ dim: 'department', measure: 'tokens', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['visits', 'tokens', 'tokensPerConsult'], defaultPeriod: 'ytd' })

// ============================================================ QUALITY
R('quality', 'lab-tat-breaches', 'Laboratory TAT Breaches', 'Exception', 'labs', 'Results released after the turnaround target.', { where: oneOf('withinTarget', 'No'), whereLabel: 'Outside TAT target', kpis: ['breaches', 'avgTat'], breakdowns: [{ dim: 'test', measure: 'tests', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['tests', 'avgTat'], defaultView: 'detailed' })
R('quality', 'long-waits', 'Long Waits (> 60 min)', 'Exception', 'visits', 'Patients who waited over an hour to be seen.', { where: (r) => (r.status === 'Completed' || r.status === 'In progress') && r.waitMinutes > 60, whereLabel: 'Wait > 60 min', kpis: ['visits', 'avgWait'], breakdowns: [{ dim: 'hour', measure: 'visits', chart: 'bar' }, { dim: 'facility', measure: 'visits', chart: 'hbar' }], groupBy: 'department', groupMeasures: ['visits', 'avgWait'], defaultView: 'detailed' })
R('quality', 'incomplete-documentation', 'Incomplete Documentation', 'Exception', 'visits', 'Completed consultations without signed-off notes.', { where: (r) => r.status === 'Completed' && r.documentation === 'Incomplete', whereLabel: 'Incomplete notes', kpis: ['visits'], breakdowns: [{ dim: 'doctor', measure: 'visits', chart: 'hbar' }], groupBy: 'doctor', groupMeasures: ['visits'], defaultView: 'detailed' })
R('quality', 'ama-discharges', 'Discharges Against Medical Advice', 'Exception', 'discharges', 'Patients who left against medical advice.', { where: oneOf('dischargeType', 'Discharged against medical advice'), whereLabel: 'AMA', kpis: ['discharges'], breakdowns: [{ dim: 'ward', measure: 'discharges', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['discharges'], defaultPeriod: 'ytd', defaultView: 'detailed' })
R('quality', 'stockout-impact', 'Stock-out Impact on Patients', 'Exception', 'prescriptions', 'Prescriptions that could not be filled because of stock-outs.', { where: oneOf('status', 'Not dispensed – out of stock', 'Partially dispensed'), whereLabel: 'Unfilled due to stock', kpis: ['lines', 'stockouts', 'partial'], breakdowns: [{ dim: 'medication', measure: 'lines', chart: 'hbar' }], groupBy: 'facility', groupMeasures: ['lines', 'stockouts'], defaultPeriod: 'last_quarter', defaultView: 'detailed' })
R('quality', 'readmission-watchlist', 'Readmission Watch-list', 'Exception', 'admissions', 'Readmissions within 30 days for clinical review.', { where: oneOf('readmission', 'Yes'), whereLabel: 'Readmissions', kpis: ['admissions'], breakdowns: [{ dim: 'diagnosis', measure: 'admissions', chart: 'hbar' }], groupBy: 'ward', groupMeasures: ['admissions'], defaultPeriod: 'last_quarter', defaultView: 'detailed' })

export const REPORTS: ReportDef[] = reports
export const REPORT_BY_ID: Record<string, ReportDef> = Object.fromEntries(reports.map((r) => [r.id, r]))
export const MODULE_BY_ID: Record<string, ModuleDef> = Object.fromEntries(MODULES.map((m) => [m.id, m]))
