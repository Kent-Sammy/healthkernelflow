export type PayerType = 'Self-pay' | 'HMO' | 'Corporate'

export interface Patient {
  id: string
  name: string
  gender: 'Male' | 'Female'
  dob: string
  age: number
  ageBand: string
  facility: string
  city: string
  payerType: PayerType
  payer: string
  registeredOn: string
  channel: 'Walk-in' | 'Online booking' | 'Referral' | 'Corporate enrolment'
}

export interface Visit {
  id: string
  date: string // YYYY-MM-DD HH:mm
  patientId: string
  patient: string
  gender: string
  ageBand: string
  facility: string
  department: string
  specialty: string
  doctor: string
  type: 'New' | 'Follow-up' | 'Referral' | 'Emergency' | 'Review'
  channel: 'In-person' | 'Virtual'
  booking: 'Scheduled' | 'Walk-in'
  status: 'Completed' | 'Cancelled' | 'No-show' | 'In progress'
  isNewPatient: boolean
  waitMinutes: number
  consultMinutes: number
  diagnosisCode: string
  diagnosis: string
  secondaryCode: string
  secondaryDiagnosis: string
  codingFlag: 'OK' | 'Missing code' | 'Unspecified code' | 'Symptom code only'
  documentation: 'Complete' | 'Incomplete'
  referralSource: string
  referredOut: string
  followUp: 'Scheduled' | 'Not required'
  payerType: PayerType
  payer: string
  fee: number
  // Telemedicine
  tokens: number
  callQuality: string
  invoiceNo: string
}

export interface LabRecord {
  id: string
  date: string
  facility: string
  department: string
  clinician: string
  patient: string
  test: string
  category: string
  price: number
  status: 'Completed' | 'Pending' | 'In progress' | 'Cancelled'
  priority: 'Routine' | 'Urgent'
  tatHours: number
  targetTat: number
  withinTarget: 'Yes' | 'No' | '—'
  resultAt: string
  performedAt: string
  ageHours: number
}

export interface Prescription {
  id: string
  date: string
  facility: string
  department: string
  doctor: string
  patient: string
  payerType: PayerType
  itemCode: string
  medication: string
  category: string
  qtyPrescribed: number
  qtyDispensed: number
  unitPrice: number
  unitCost: number
  revenue: number
  cost: number
  status: 'Fully dispensed' | 'Partially dispensed' | 'Not dispensed – out of stock' | 'Not collected' | 'Cancelled'
}

export interface ProcedureRec {
  id: string
  date: string
  facility: string
  department: string
  clinician: string
  patient: string
  procedure: string
  category: string
  price: number
  status: 'Completed' | 'Cancelled' | 'Scheduled'
  waitDays: number
  cancelReason: string
}

export interface InvoiceLine {
  service: string
  category: string
  qty: number
  amount: number
}

export interface Invoice {
  id: string
  date: string
  dueDate: string
  source: 'Outpatient' | 'Inpatient'
  patientId: string
  patient: string
  facility: string
  department: string
  payerType: PayerType
  payer: string
  lines: InvoiceLine[]
  gross: number
  discount: number
  net: number
  credits: number
  paid: number
  refunded: number
  writtenOff: number
  balance: number
  status: 'Paid' | 'Part-paid' | 'Unpaid' | 'Overdue' | 'Written off'
  ageDays: number
  agingBucket: string
  lastPayment: string
  onCredit: boolean
}

export interface Payment {
  id: string
  date: string
  invoiceNo: string
  patient: string
  facility: string
  department: string
  payerType: PayerType
  payer: string
  method: string
  amount: number
  cashier: string
  reconciliation: 'Matched' | 'Unmatched' | 'Pending review'
  reference: string
}

export interface Adjustment {
  id: string
  date: string
  invoiceNo: string
  patient: string
  facility: string
  department: string
  type: 'Discount' | 'Waiver' | 'Credit Note' | 'Refund' | 'Write-off' | 'Claims Adjustment'
  reason: string
  amount: number
  approvedBy: string
  payerType: PayerType
}

export interface CreditTxn {
  id: string
  date: string
  accountId: string
  patient: string
  facility: string
  creditType: 'Wallet top-up' | 'Promotional credit' | 'Refund to wallet'
  action: 'Issued' | 'Utilized' | 'Adjusted' | 'Reversed'
  amount: number
  balanceAfter: number
  reference: string
  by: string
}

export interface Admission {
  id: string
  admitDate: string
  dischargeDate: string
  expectedDischarge: string
  patientId: string
  patient: string
  gender: string
  ageBand: string
  facility: string
  ward: string
  wardId: string
  bed: string
  department: string
  doctor: string
  source: 'Emergency' | 'Outpatient' | 'External referral' | 'Elective'
  diagnosis: string
  diagnosisCode: string
  los: number
  status: 'Admitted' | 'Discharged'
  dischargeType: string
  readmission: 'Yes' | 'No'
  dischargeDelayHours: number
  delayReason: string
  payerType: PayerType
  payer: string
  invoiceNo: string
  billed: number
  deposit: number
}

export interface Transfer {
  id: string
  date: string
  patient: string
  facility: string
  fromWard: string
  toWard: string
  reason: string
  admissionId: string
}

export interface WardDay {
  id: string
  date: string
  facility: string
  ward: string
  department: string
  beds: number
  occupied: number
  admissions: number
  discharges: number
}

export interface NursingShift {
  id: string
  date: string
  facility: string
  ward: string
  department: string
  shift: 'Day' | 'Night'
  nurse: string
  patients: number
  tasksScheduled: number
  tasksCompleted: number
  tasksDelayed: number
  tasksMissed: number
  vitalsRecorded: number
  medsAdministered: number
}

export interface StockBatch {
  batch: string
  qty: number
  expiry: string
}

export interface StockLine {
  id: string
  facility: string
  itemCode: string
  item: string
  kind: 'Medication' | 'Consumable'
  category: string
  unit: string
  onHand: number
  reorderLevel: number
  unitCost: number
  unitPrice: number
  value: number
  nearestExpiry: string
  daysToExpiry: number
  expiringQty: number
  status: 'In stock' | 'Low stock' | 'Out of stock'
  supplier: string
  avgDailyUse: number
  daysOfCover: number
  batches: StockBatch[]
}

export interface Movement {
  id: string
  date: string
  facility: string
  itemCode: string
  item: string
  kind: 'Medication' | 'Consumable'
  category: string
  type: 'Received' | 'Dispensed' | 'Issued' | 'Transfer in' | 'Transfer out' | 'Adjustment' | 'Returned' | 'Damaged' | 'Expired'
  qty: number
  unitCost: number
  value: number
  department: string
  reference: string
  by: string
  balanceAfter: number
}

export interface PurchaseOrder {
  id: string
  date: string
  approvalDate: string
  expectedDate: string
  deliveredDate: string
  facility: string
  supplier: string
  itemCode: string
  item: string
  kind: 'Medication' | 'Consumable'
  category: string
  qtyOrdered: number
  qtyReceived: number
  amount: number
  status: 'Pending approval' | 'Approved' | 'Delivered' | 'Partially delivered' | 'Paid'
  onTime: 'Yes' | 'No' | '—'
  delayDays: number
  paymentDate: string
  approvedBy: string
}

export interface Claim {
  id: string
  invoiceNo: string
  hmo: string
  enrolleeId: string
  patient: string
  facility: string
  department: string
  serviceDate: string
  submittedDate: string
  vettedDate: string
  paidDate: string
  claimed: number
  tariff: number
  approved: number
  paid: number
  outstanding: number
  status: 'Draft' | 'Submitted' | 'Under review' | 'Approved' | 'Partially approved' | 'Rejected' | 'Paid'
  rejectionReason: string
  ageDays: number
  agingBucket: string
  preAuth: string
}

export interface StaffMember {
  id: string
  name: string
  role: string
  accessRole: string
  department: string
  facility: string
  status: 'Active' | 'Suspended' | 'Deactivated' | 'Invited'
  createdOn: string
  lastLogin: string
  mfa: 'Enabled' | 'Not enabled'
  logins30d: number
}

export interface LoginEvent {
  id: string
  date: string
  user: string
  role: string
  facility: string
  outcome: 'Success' | 'Failed'
  reason: string
  device: string
  ip: string
}

export interface SecurityEvent {
  id: string
  date: string
  actor: string
  facility: string
  category: 'Access change' | 'Permission change' | 'Administrative' | 'Report export' | 'Account status'
  action: string
  target: string
  severity: 'Low' | 'Medium' | 'High'
  details: string
}

export interface IntegrationRun {
  id: string
  date: string
  integration: string
  direction: string
  facility: string
  records: number
  failed: number
  status: 'Success' | 'Partial' | 'Failed'
  durationSec: number
  error: string
  reconciled: 'Balanced' | 'Variance' | '—'
}

export interface DepositAccount {
  id: string
  admissionId: string
  patientId: string
  patient: string
  facility: string
  ward: string
  department: string
  collectedOn: string
  collected: number
  topUps: number
  applied: number
  refunded: number
  movedToWallet: number
  held: number
  billed: number
  balanceDue: number
  status: 'Held – patient admitted' | 'Applied – fully used' | 'Applied – excess refunded' | 'Applied – refund pending' | 'Applied – balance due'
  invoiceNo: string
}

export interface DepositTxn {
  id: string
  date: string
  depositId: string
  admissionId: string
  patient: string
  facility: string
  ward: string
  type: 'Collected' | 'Top-up' | 'Applied to bill' | 'Refunded' | 'Moved to wallet'
  amount: number
  method: string
  by: string
}

export interface CreditFacility {
  id: string
  patientId: string
  patient: string
  facility: string
  scheme: 'Staff & dependants' | 'Chronic care plan' | 'Approved individual' | 'Community scheme'
  limit: number
  openedOn: string
  approvedBy: string
  charged: number
  repaid: number
  owed: number
  available: number
  utilisation: number
  oldestUnpaidDays: number
  owedPastTerms: number
  lastActivity: string
  status: 'Within limit' | 'Near limit' | 'Over limit' | 'Clear'
}

export interface CreditLedgerTxn {
  id: string
  date: string
  accountId: string
  patient: string
  facility: string
  scheme: string
  type: 'Charged to credit' | 'Repayment' | 'Written off'
  amount: number
  invoiceNo: string
  balanceAfter: number
  dueDate: string
}

export interface Db {
  generatedAt: string
  patients: Patient[]
  visits: Visit[]
  labs: LabRecord[]
  prescriptions: Prescription[]
  procedures: ProcedureRec[]
  invoices: Invoice[]
  payments: Payment[]
  adjustments: Adjustment[]
  credits: CreditTxn[]
  deposits: DepositAccount[]
  depositTxns: DepositTxn[]
  creditFacilities: CreditFacility[]
  creditLedger: CreditLedgerTxn[]
  admissions: Admission[]
  transfers: Transfer[]
  wardDays: WardDay[]
  nursing: NursingShift[]
  stock: StockLine[]
  movements: Movement[]
  purchaseOrders: PurchaseOrder[]
  claims: Claim[]
  staff: StaffMember[]
  logins: LoginEvent[]
  security: SecurityEvent[]
  integrations: IntegrationRun[]
}
