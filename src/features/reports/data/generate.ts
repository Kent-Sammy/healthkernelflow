/**
 * Deterministic demo-data simulation for the reporting prototype.
 *
 * The dataset is produced by walking day-by-day through twelve months of
 * fictional hospital activity, so related records stay consistent:
 * visits create lab orders, prescriptions and invoices; prescriptions draw
 * down simulated stock, which triggers LPOs and deliveries; HMO invoices
 * become claims whose remittances become payments; admissions occupy real
 * beds, which drives the ward census and nursing workload.
 *
 * ALL PEOPLE, FACILITIES AND ORGANISATIONS ARE FICTIONAL.
 */
import { createRng } from './rng'
import {
  ALL_ITEMS,
  CONSUMABLES,
  CONSULT_FEE,
  CORPORATES,
  DEPARTMENTS,
  DEPT_LAB_TESTS,
  DEPT_MEDS,
  DEPT_WEIGHT,
  DIAGNOSES,
  DOCTORS,
  EXTERNAL_LABS,
  FACILITIES,
  FEMALE_FIRST,
  HMOS,
  INTEGRATIONS,
  LAB_TESTS,
  MALE_FIRST,
  PROCEDURES,
  SPECIALTY,
  SUPPLIERS,
  SURNAMES,
  WARDS,
  type Department,
  type StockItemDef,
} from './reference'
import type {
  Adjustment,
  Admission,
  Claim,
  CreditFacility,
  CreditLedgerTxn,
  CreditTxn,
  DepositAccount,
  DepositTxn,
  Db,
  IntegrationRun,
  Invoice,
  InvoiceLine,
  LabRecord,
  LoginEvent,
  Movement,
  NursingShift,
  Patient,
  PayerType,
  Payment,
  Prescription,
  ProcedureRec,
  PurchaseOrder,
  SecurityEvent,
  StaffMember,
  StockBatch,
  StockLine,
  Transfer,
  Visit,
  WardDay,
} from './types'
import {
  DATA_START,
  NOW_MIN,
  TODAY_NUM,
  ageBand,
  agingBucket,
  dayNum,
  dowOf,
  endOfMonth,
  isoDay,
  stampFromMin,
} from '../engine/dates'

const BASE_VISITS_PER_DAY = 44

const pad = (n: number, w = 6) => String(n).padStart(w, '0')

export function generateDb(): Db {
  const rng = createRng(20261027)
  const startN = dayNum(DATA_START)
  const endN = TODAY_NUM
  const totalW = FACILITIES.reduce((a, f) => a + f.weight, 0)

  // ---------------------------------------------------------------- people
  let patientSeq = 10000
  const patients: Patient[] = []
  const patientById = new Map<string, Patient>()
  const pools: Record<string, { kids: Patient[]; women: Patient[]; adults: Patient[] }> = {}
  FACILITIES.forEach((f) => (pools[f.id] = { kids: [], women: [], adults: [] }))

  const randomName = (gender: 'Male' | 'Female') =>
    `${rng.pick(gender === 'Male' ? MALE_FIRST : FEMALE_FIRST)} ${rng.pick(SURNAMES)}`

  function makePatient(facility: string, regDay: number, want?: 'kid' | 'woman' | 'adult'): Patient {
    let gender: 'Male' | 'Female' = rng.chance(0.47) ? 'Male' : 'Female'
    let age: number
    if (want === 'kid') age = rng.int(0, 14)
    else if (want === 'woman') {
      gender = 'Female'
      age = rng.int(18, 46)
    } else if (want === 'adult') age = rng.weighted([rng.int(15, 24), rng.int(25, 44), rng.int(45, 64), rng.int(65, 88)], [14, 40, 30, 16])
    else age = rng.weighted([rng.int(0, 4), rng.int(5, 14), rng.int(15, 24), rng.int(25, 44), rng.int(45, 64), rng.int(65, 88)], [11, 11, 12, 34, 22, 10])
    const payerType: PayerType = rng.weighted(['Self-pay', 'HMO', 'Corporate'] as PayerType[], [55, 33, 12])
    const payer = payerType === 'HMO' ? rng.weighted(HMOS, [24, 20, 14, 16, 12, 14]) : payerType === 'Corporate' ? rng.pick(CORPORATES) : 'Self'
    const birthYear = 2026 - age
    const fac = FACILITIES.find((x) => x.id === facility)!
    const p: Patient = {
      id: `HK-${patientSeq++}`,
      name: randomName(gender),
      gender,
      dob: `${birthYear}-${String(rng.int(1, 12)).padStart(2, '0')}-${String(rng.int(1, 28)).padStart(2, '0')}`,
      age,
      ageBand: ageBand(age),
      facility,
      city: fac.city,
      payerType,
      payer,
      registeredOn: isoDay(regDay),
      channel: payerType === 'Corporate' ? 'Corporate enrolment' : rng.weighted(['Walk-in', 'Online booking', 'Referral'] as const, [62, 24, 14]),
    }
    patients.push(p)
    patientById.set(p.id, p)
    const pool = pools[facility]
    if (age < 15) pool.kids.push(p)
    else {
      pool.adults.push(p)
      if (gender === 'Female' && age <= 46) pool.women.push(p)
    }
    return p
  }

  // Existing patient base registered before the data window.
  for (const f of FACILITIES) {
    const n = Math.round(1700 * f.weight)
    for (let i = 0; i < n; i++) makePatient(f.id, startN - rng.int(30, 2400))
  }

  const cashiers: Record<string, string[]> = {}
  const nurses: Record<string, string[]> = {}
  FACILITIES.forEach((f) => {
    cashiers[f.id] = Array.from({ length: f.weight > 0.6 ? 3 : 2 }, () => randomName(rng.chance(0.7) ? 'Female' : 'Male'))
    nurses[f.id] = Array.from({ length: Math.round(14 * f.weight) + 3 }, () => `Nurse ${randomName(rng.chance(0.85) ? 'Female' : 'Male')}`)
  })
  const financeApprovers = ['Tolu Adebayo', 'Ngozi Eze-Williams', 'Musa Danladi']

  // ------------------------------------------------------------- stock sim
  interface SState {
    facility: string
    def: StockItemDef
    batches: StockBatch[]
    ema: number
    openPO: boolean
    used: number
    supplier: string
    lead: number
  }
  const stockMap = new Map<string, SState>()
  const sKey = (f: string, code: string) => `${f}|${code}`
  const movements: Movement[] = []
  const purchaseOrders: PurchaseOrder[] = []
  const deliveries = new Map<number, PurchaseOrder[]>()
  let batchSeq = 1
  let mvSeq = 1
  let poSeq = 1

  const visitsPerDay = (fid: string, dept: Department) => {
    const fac = FACILITIES.find((f) => f.id === fid)!
    const dw = fac.departments.reduce((a, d) => a + DEPT_WEIGHT[d as Department], 0)
    return ((BASE_VISITS_PER_DAY * fac.weight) / totalW) * (DEPT_WEIGHT[dept] / dw) * 0.88
  }

  for (const f of FACILITIES) {
    for (const def of ALL_ITEMS) {
      let expected = 0
      if (def.kind === 'Medication') {
        for (const d of f.departments) {
          const meds = DEPT_MEDS[d as Department]
          if (meds.includes(def.code)) expected += (visitsPerDay(f.id, d as Department) * 1.25 * def.typicalQty * 1.5) / meds.length
        }
        if (def.category === 'IV Fluids') expected += 0.3 * f.weight
        if (expected === 0) continue
      } else {
        if (def.category === 'Dental Supplies' && !f.departments.includes('Dental')) continue
        if (def.category === 'Imaging Supplies' && !['LKI', 'ABJ'].includes(f.id)) continue
        expected = def.typicalQty * 0.22 * f.weight
      }
      const suppliers = SUPPLIERS.filter((s) => s.categories.includes(def.kind))
      const sup = suppliers[(def.code.charCodeAt(6) + f.id.charCodeAt(0)) % suppliers.length]
      const opening = Math.max(def.typicalQty * 6, Math.ceil(expected * rng.int(28, 45)))
      const st: SState = {
        facility: f.id,
        def,
        batches: [],
        ema: expected,
        openPO: false,
        used: 0,
        supplier: sup.name,
        lead: sup.leadDays,
      }
      // Two opening batches with staggered expiries.
      const firstQty = Math.ceil(opening * 0.4)
      st.batches.push({ batch: `B${pad(batchSeq++, 5)}`, qty: firstQty, expiry: isoDay(startN + rng.int(40, 330)) })
      st.batches.push({ batch: `B${pad(batchSeq++, 5)}`, qty: opening - firstQty, expiry: isoDay(startN + rng.int(300, 720)) })
      st.batches.sort((a, b) => a.expiry.localeCompare(b.expiry))
      stockMap.set(sKey(f.id, def.code), st)
    }
  }

  const onHand = (st: SState) => st.batches.reduce((a, b) => a + b.qty, 0)

  function consume(st: SState, qty: number): number {
    let left = qty
    for (const b of st.batches) {
      if (left <= 0) break
      const take = Math.min(b.qty, left)
      b.qty -= take
      left -= take
    }
    st.batches = st.batches.filter((b) => b.qty > 0)
    return qty - left
  }

  function addMovement(st: SState, day: number, minute: number, type: Movement['type'], qty: number, department: string, reference: string, by: string) {
    movements.push({
      id: `MV-${pad(mvSeq++, 7)}`,
      date: stampFromMin(day * 1440 + minute),
      facility: st.facility,
      itemCode: st.def.code,
      item: st.def.name,
      kind: st.def.kind,
      category: st.def.category,
      type,
      qty,
      unitCost: st.def.unitCost,
      value: qty * st.def.unitCost,
      department,
      reference,
      by,
      balanceAfter: onHand(st),
    })
  }

  const storeKeeper = (fid: string) => (fid === 'LKI' ? 'Pharm. Kemi Adeleke' : fid === 'IKJ' ? 'Pharm. Uche Nnadi' : fid === 'ABJ' ? 'Pharm. Sadiq Bello' : 'Pharm. Ebiere Tamuno')

  function raisePO(st: SState, day: number) {
    const qty = Math.max(st.def.typicalQty * 10, Math.ceil(st.ema * rng.int(30, 40)))
    // Prefer an inter-facility transfer when a sister facility is well stocked.
    if (rng.chance(0.22)) {
      const donors = FACILITIES.filter((f) => f.id !== st.facility)
        .map((f) => stockMap.get(sKey(f.id, st.def.code)))
        .filter((d): d is SState => !!d && onHand(d) > Math.ceil(d.ema * (d.lead + 4)) * 3 + qty / 2)
      if (donors.length) {
        const donor = donors[0]
        const tq = Math.ceil(qty / 2)
        const expiry = donor.batches[0]?.expiry ?? isoDay(day + 300)
        consume(donor, tq)
        const ref = `TRF-${pad(mvSeq, 6)}`
        addMovement(donor, day, 15 * 60, 'Transfer out', -tq, 'Pharmacy', `${ref} → ${st.facility}`, storeKeeper(donor.facility))
        st.batches.push({ batch: `B${pad(batchSeq++, 5)}`, qty: tq, expiry })
        st.batches.sort((a, b) => a.expiry.localeCompare(b.expiry))
        addMovement(st, day, 17 * 60, 'Transfer in', tq, 'Pharmacy', `${ref} ← ${donor.facility}`, storeKeeper(st.facility))
        return
      }
    }
    const sup = SUPPLIERS.find((s) => s.name === st.supplier)!
    const approval = day + rng.int(0, 1)
    const expected = approval + sup.leadDays
    const onTime = rng.chance(sup.reliability)
    const delivered = onTime ? expected - rng.int(0, 1) : expected + rng.int(2, 9)
    const partial = rng.chance(0.06)
    const qtyReceived = partial ? Math.ceil(qty * (0.6 + rng.next() * 0.3)) : qty
    const po: PurchaseOrder = {
      id: `LPO-${pad(poSeq++, 5)}`,
      date: isoDay(day),
      approvalDate: approval <= endN ? isoDay(approval) : '',
      expectedDate: isoDay(expected),
      deliveredDate: delivered <= endN ? isoDay(delivered) : '',
      facility: st.facility,
      supplier: sup.name,
      itemCode: st.def.code,
      item: st.def.name,
      kind: st.def.kind,
      category: st.def.category,
      qtyOrdered: qty,
      qtyReceived: delivered <= endN ? qtyReceived : 0,
      amount: qty * st.def.unitCost,
      status: 'Approved',
      onTime: delivered <= endN ? (delivered <= expected ? 'Yes' : 'No') : '—',
      delayDays: delivered <= endN ? Math.max(0, delivered - expected) : 0,
      paymentDate: '',
      approvedBy: rng.pick(financeApprovers),
    }
    if (approval > endN) po.status = 'Pending approval'
    if (delivered <= endN) {
      po.status = partial ? 'Partially delivered' : 'Delivered'
      const payDay = delivered + rng.int(10, 40)
      if (payDay <= endN) {
        po.status = 'Paid'
        po.paymentDate = isoDay(payDay)
      }
      const list = deliveries.get(delivered) ?? []
      list.push(po)
      deliveries.set(delivered, list)
    }
    purchaseOrders.push(po)
    st.openPO = true
  }

  // ---------------------------------------------------------- finance sim
  const visits: Visit[] = []
  const labs: LabRecord[] = []
  const prescriptions: Prescription[] = []
  const procedures: ProcedureRec[] = []
  const invoices: Invoice[] = []
  const payments: Payment[] = []
  const adjustments: Adjustment[] = []
  const credits: CreditTxn[] = []
  const claims: Claim[] = []
  let invSeq = 1
  let paySeq = 1
  let adjSeq = 1
  let crSeq = 1
  let visitSeq = 1
  let labSeq = 1
  let rxSeq = 1
  let procSeq = 1
  let claimSeq = 1

  const wallets = new Map<string, { balance: number; facility: string; patient: string; type: CreditTxn['creditType'] }>()

  // Admission deposits and pay-later patient credit accounts
  const deposits: DepositAccount[] = []
  const depositTxns: DepositTxn[] = []
  let depSeq = 1
  let depTxnSeq = 1
  const creditLedger: CreditLedgerTxn[] = []
  let clSeq = 1
  const creditFacilities: CreditFacility[] = []
  const creditByPatient = new Map<string, CreditFacility>()
  const creditHolders = new Map<string, Patient[]>()
  {
    const schemes: CreditFacility['scheme'][] = ['Staff & dependants', 'Chronic care plan', 'Approved individual', 'Community scheme']
    for (const f of FACILITIES) {
      const pool = pools[f.id].adults.filter((p) => p.payerType === 'Self-pay')
      const n = Math.round(42 * f.weight)
      for (let i = 0; i < n; i++) {
        const p = pool[rng.int(0, pool.length - 1)]
        if (creditByPatient.has(p.id)) continue
        const scheme = rng.weighted(schemes, [30, 30, 28, 12])
        const acc: CreditFacility = {
          id: `CRA-${pad(creditFacilities.length + 1, 4)}`,
          patientId: p.id,
          patient: p.name,
          facility: f.id,
          scheme,
          limit: rng.pick(scheme === 'Chronic care plan' ? [150000, 250000, 300000] : scheme === 'Staff & dependants' ? [200000, 300000, 500000] : [50000, 100000, 150000]),
          openedOn: isoDay(startN - rng.int(10, 700)),
          approvedBy: rng.pick(financeApprovers),
          charged: 0,
          repaid: 0,
          owed: 0,
          available: 0,
          utilisation: 0,
          oldestUnpaidDays: 0,
          owedPastTerms: 0,
          lastActivity: '',
          status: 'Clear',
        }
        creditFacilities.push(acc)
        creditByPatient.set(p.id, acc)
        creditHolders.set(f.id, [...(creditHolders.get(f.id) ?? []), p])
      }
    }
  }
  const pendingReversals = new Map<number, { pid: string; amount: number }[]>()

  function creditTxn(day: number, minute: number, pid: string, action: CreditTxn['action'], amount: number, reference: string, by: string) {
    const w = wallets.get(pid)!
    w.balance += action === 'Issued' ? amount : action === 'Adjusted' ? amount : -amount
    credits.push({
      id: `CRT-${pad(crSeq++, 6)}`,
      date: stampFromMin(day * 1440 + minute),
      accountId: `WAL-${pid.slice(3)}`,
      patient: w.patient,
      facility: w.facility,
      creditType: w.type,
      action,
      amount,
      balanceAfter: w.balance,
      reference,
      by,
    })
  }

  const corpSettle = new Map<string, number | null>()
  const hmoProfile: Record<string, { speed: number; reject: number; partial: number }> = {
    'Crestview Health HMO': { speed: 1, reject: 0.07, partial: 0.15 },
    'Greenfield Care HMO': { speed: 1.2, reject: 0.09, partial: 0.18 },
    'Unity Shield Health': { speed: 1.9, reject: 0.15, partial: 0.22 },
    'Novalife HMO': { speed: 0.9, reject: 0.05, partial: 0.12 },
    'Sterling Path Health': { speed: 1.4, reject: 0.12, partial: 0.2 },
    'Harmony Care Plan': { speed: 1.1, reject: 0.08, partial: 0.16 },
  }
  const rejectionReasons = ['No pre-authorisation code', 'Service not covered under plan', 'Tariff above agreed rate', 'Duplicate claim', 'Enrollee not eligible on service date', 'Incomplete clinical notes']

  function pickMethod(): string {
    return rng.weighted(['Cash', 'POS / Card', 'Bank Transfer', 'USSD / Mobile'], [22, 40, 30, 8])
  }

  function addPayment(day: number, minute: number, inv: Invoice, amount: number, method: string, reference?: string) {
    if (amount <= 0) return
    const recent = day > endN - 3
    payments.push({
      id: `RCT-${pad(paySeq++, 7)}`,
      date: stampFromMin(day * 1440 + minute),
      invoiceNo: inv.id,
      patient: inv.patient,
      facility: inv.facility,
      department: inv.department,
      payerType: inv.payerType,
      payer: inv.payer,
      method,
      amount,
      cashier: method === 'HMO Remittance' || method === 'Corporate Remittance' ? 'Finance – Receivables' : rng.pick(cashiers[inv.facility]),
      reconciliation: method === 'Bank Transfer' && recent && rng.chance(0.45) ? 'Pending review' : 'Matched',
      reference: reference ?? (method === 'Cash' ? '—' : `TXN${rng.int(10000000, 99999999)}`),
    })
    inv.paid += amount
    inv.lastPayment = isoDay(day)
  }

  function createInvoice(day: number, minute: number, p: Patient, facility: string, department: string, lines: InvoiceLine[], source: 'Outpatient' | 'Inpatient', deposit?: DepositAccount): Invoice {
    const gross = lines.reduce((a, l) => a + l.amount, 0)
    const credit = p.payerType === 'Self-pay' && !deposit ? creditByPatient.get(p.id) : undefined
    const useCredit = !!credit && (credit.owed + gross <= credit.limit || rng.chance(0.15)) && rng.chance(0.75)
    let dueDay = useCredit ? day + 30 : day + 7
    if (p.payerType === 'HMO') dueDay = day + 45
    if (p.payerType === 'Corporate') dueDay = dayNum(endOfMonth(isoDay(day))) + 30
    const inv: Invoice = {
      id: `INV-${pad(invSeq++, 6)}`,
      date: stampFromMin(day * 1440 + minute),
      dueDate: isoDay(dueDay),
      source,
      patientId: p.id,
      patient: p.name,
      facility,
      department,
      payerType: p.payerType,
      payer: p.payer,
      lines,
      gross,
      discount: 0,
      net: gross,
      credits: 0,
      paid: 0,
      refunded: 0,
      writtenOff: 0,
      balance: 0,
      status: 'Unpaid',
      ageDays: endN - day,
      agingBucket: '',
      lastPayment: '',
      onCredit: useCredit,
    }
    // Discounts & waivers (self-pay only)
    if (p.payerType === 'Self-pay') {
      if (rng.chance(0.065)) {
        const pct = rng.pick([0.05, 0.1, 0.1, 0.15, 0.2])
        const amt = Math.round((gross * pct) / 50) * 50
        inv.discount += amt
        adjustments.push({
          id: `ADJ-${pad(adjSeq++, 6)}`,
          date: inv.date,
          invoiceNo: inv.id,
          patient: p.name,
          facility,
          department,
          type: 'Discount',
          reason: rng.pick(['Staff family discount', 'Loyalty discount', 'Management discretion', 'Senior citizen discount']),
          amount: amt,
          approvedBy: rng.pick(financeApprovers),
          payerType: p.payerType,
        })
      } else if (rng.chance(0.012) && lines[0]) {
        const amt = lines[0].amount
        inv.discount += amt
        adjustments.push({
          id: `ADJ-${pad(adjSeq++, 6)}`,
          date: inv.date,
          invoiceNo: inv.id,
          patient: p.name,
          facility,
          department,
          type: 'Waiver',
          reason: rng.pick(['Charity care – consultation waived', 'Service recovery waiver', 'Medical director approval']),
          amount: amt,
          approvedBy: rng.pick(financeApprovers),
          payerType: p.payerType,
        })
      }
    }
    inv.net = gross - inv.discount
    invoices.push(inv)

    // Settlement behaviour
    // Admission deposit is applied to the final bill first
    if (deposit) {
      const held = deposit.collected + deposit.topUps
      const applied = Math.min(held, inv.net)
      addPayment(day, minute + 5, inv, applied, 'Deposit Applied', deposit.id)
      depositTxns.push({ id: `DTX-${pad(depTxnSeq++, 6)}`, date: stampFromMin(day * 1440 + minute + 5), depositId: deposit.id, admissionId: deposit.admissionId, patient: p.name, facility, ward: deposit.ward, type: 'Applied to bill', amount: applied, method: inv.id, by: rng.pick(cashiers[facility]) })
      deposit.applied = applied
      deposit.billed = inv.net
      deposit.invoiceNo = inv.id
      const excess = held - applied
      if (excess > 0) {
        const rd = day + rng.int(0, 2)
        if (rd <= endN) {
          const toWallet = rng.chance(0.3)
          if (toWallet) {
            if (!wallets.has(p.id)) wallets.set(p.id, { balance: 0, facility, patient: p.name, type: 'Refund to wallet' })
            pendingCreditIssues.push({ day: rd, pid: p.id, amount: excess, ref: deposit.id })
            deposit.movedToWallet = excess
          } else deposit.refunded = excess
          depositTxns.push({ id: `DTX-${pad(depTxnSeq++, 6)}`, date: stampFromMin(rd * 1440 + 900), depositId: deposit.id, admissionId: deposit.admissionId, patient: p.name, facility, ward: deposit.ward, type: toWallet ? 'Moved to wallet' : 'Refunded', amount: excess, method: toWallet ? 'Patient wallet' : rng.pick(['Bank Transfer', 'Cash']), by: rng.pick(financeApprovers) })
        } else deposit.held = excess
      }
    }

    if (p.payerType === 'Self-pay' && useCredit) {
      // Charged to the patient's pay-later credit account; repaid later
      const acc = credit!
      creditLedger.push({ id: `CLG-${pad(clSeq++, 6)}`, date: inv.date, accountId: acc.id, patient: p.name, facility, scheme: acc.scheme, type: 'Charged to credit', amount: inv.net, invoiceNo: inv.id, balanceAfter: 0, dueDate: inv.dueDate })
      acc.owed += inv.net
      const r = rng.next()
      const repay = (d: number, amt: number) => {
        if (d > endN || amt <= 0) return
        acc.owed -= amt
        addPayment(d, rng.int(540, 1020), inv, amt, pickMethod(), `CR-REPAY-${acc.id}`)
        creditLedger.push({ id: `CLG-${pad(clSeq++, 6)}`, date: stampFromMin(d * 1440 + 600), accountId: acc.id, patient: p.name, facility, scheme: acc.scheme, type: 'Repayment', amount: amt, invoiceNo: inv.id, balanceAfter: 0, dueDate: inv.dueDate })
      }
      if (r < 0.62) repay(day + rng.int(10, 60), inv.net)
      else if (r < 0.84) {
        const part = Math.round((inv.net * (0.3 + rng.next() * 0.4)) / 100) * 100
        repay(day + rng.int(7, 35), part)
        if (rng.chance(0.45)) repay(day + rng.int(40, 90), inv.net - part)
      }
    } else if (p.payerType === 'Self-pay' && inv.net - inv.paid > 0) {
      const due = inv.net - inv.paid
      const r = rng.next()
      const payMin = minute + rng.int(5, 40)
      if (r < 0.85) {
        const w = wallets.get(p.id)
        const method = w && w.balance >= due && rng.chance(0.6) ? 'Patient Wallet' : pickMethod()
        addPayment(day, payMin, inv, due, method)
        if (method === 'Patient Wallet') creditTxn(day, payMin, p.id, 'Utilized', due, inv.id, rng.pick(cashiers[facility]))
        // Occasional credit note + refund on a paid invoice
        if (rng.chance(0.012)) {
          const amt = Math.round((inv.net * rng.pick([0.2, 0.3, 0.5])) / 50) * 50
          const rd = day + rng.int(1, 5)
          if (rd <= endN && amt > 0) {
            inv.credits += amt
            const reason = rng.pick(['Cancelled laboratory test', 'Service not rendered', 'Duplicate billing corrected', 'Price correction'])
            adjustments.push({ id: `ADJ-${pad(adjSeq++, 6)}`, date: stampFromMin(rd * 1440 + 600), invoiceNo: inv.id, patient: p.name, facility, department, type: 'Credit Note', reason, amount: amt, approvedBy: rng.pick(financeApprovers), payerType: p.payerType })
            const toWallet = rng.chance(0.35)
            inv.refunded += amt
            adjustments.push({ id: `ADJ-${pad(adjSeq++, 6)}`, date: stampFromMin(rd * 1440 + 660), invoiceNo: inv.id, patient: p.name, facility, department, type: 'Refund', reason: toWallet ? 'Refunded to patient wallet' : `Refunded via ${rng.pick(['bank transfer', 'cash', 'card reversal'])}`, amount: amt, approvedBy: rng.pick(financeApprovers), payerType: p.payerType })
            if (toWallet) {
              if (!wallets.has(p.id)) wallets.set(p.id, { balance: 0, facility, patient: p.name, type: 'Refund to wallet' })
              pendingCreditIssues.push({ day: rd, pid: p.id, amount: amt, ref: inv.id })
            }
          }
        }
      } else if (r < 0.93) {
        const first = Math.round((due * (0.4 + rng.next() * 0.4)) / 100) * 100
        addPayment(day, payMin, inv, first, pickMethod())
        if (rng.chance(0.6)) {
          const d2 = day + rng.int(2, 35)
          if (d2 <= endN) addPayment(d2, rng.int(540, 1020), inv, due - first, pickMethod())
        }
      } else if (rng.chance(0.62)) {
        const d2 = day + rng.int(1, 50)
        if (d2 <= endN) addPayment(d2, rng.int(540, 1020), inv, due, pickMethod())
      }
    } else if (p.payerType === 'Corporate') {
      const key = `${p.payer}|${isoDay(day).slice(0, 7)}`
      if (!corpSettle.has(key)) {
        const eom = dayNum(endOfMonth(isoDay(day)))
        corpSettle.set(key, rng.chance(0.9) ? eom + rng.int(18, 55) : null)
      }
      const sd = corpSettle.get(key)
      if (sd != null && sd <= endN) addPayment(sd, 660, inv, inv.net, 'Corporate Remittance', `REM-${p.payer.slice(0, 3).toUpperCase()}-${isoDay(day).slice(0, 7)}`)
    } else if (p.payerType === 'HMO') {
      // HMO claim lifecycle
      const prof = hmoProfile[p.payer]
      const submitted = day + rng.int(2, 12)
      const vetted = submitted + Math.round(rng.int(7, 20) * prof.speed)
      const paidDay = vetted + Math.round(rng.int(10, 32) * prof.speed)
      const willPay = rng.chance(0.95)
      const tariff = rng.chance(0.38) ? Math.round((inv.net * (0.86 + rng.next() * 0.12)) / 50) * 50 : inv.net
      const outcome = rng.next()
      let approved = inv.net
      let outcomeStatus: Claim['status'] = 'Approved'
      let reason = ''
      if (outcome < prof.reject) {
        approved = 0
        outcomeStatus = 'Rejected'
        reason = rng.pick(rejectionReasons)
      } else if (outcome < prof.reject + prof.partial || tariff < inv.net) {
        approved = tariff < inv.net ? tariff : Math.round((inv.net * (0.82 + rng.next() * 0.15)) / 50) * 50
        outcomeStatus = 'Partially approved'
        reason = tariff < inv.net ? 'Tariff above agreed rate' : rng.pick(['Drug quantity reduced', 'Investigation not justified', 'Tariff above agreed rate'])
      }
      let status: Claim['status'] = 'Draft'
      let paid = 0
      if (submitted <= endN) status = endN - submitted > 6 ? 'Under review' : 'Submitted'
      if (vetted <= endN) status = outcomeStatus
      if (vetted <= endN && outcomeStatus !== 'Rejected' && willPay && paidDay <= endN) {
        status = 'Paid'
        paid = approved
        addPayment(paidDay, 600, inv, approved, 'HMO Remittance', `RMT-${p.payer.split(' ')[0].toUpperCase()}-${isoDay(paidDay).replace(/-/g, '')}`)
      }
      const decided = vetted <= endN
      const outstanding = status === 'Paid' || status === 'Rejected' ? 0 : decided ? approved : inv.net
      // Claims adjustment / write-off of the disallowed portion
      const disallowed = decided ? inv.net - approved : 0
      if (disallowed > 0 && rng.chance(0.6)) {
        const ad = vetted + rng.int(5, 20)
        if (ad <= endN) {
          inv.writtenOff += disallowed
          adjustments.push({ id: `ADJ-${pad(adjSeq++, 6)}`, date: stampFromMin(ad * 1440 + 720), invoiceNo: inv.id, patient: p.name, facility, department, type: 'Claims Adjustment', reason: `HMO disallowance – ${reason || 'tariff variance'}`, amount: disallowed, approvedBy: rng.pick(financeApprovers), payerType: p.payerType })
        }
      }
      const age = endN - day
      claims.push({
        id: `CLM-${pad(claimSeq++, 6)}`,
        invoiceNo: inv.id,
        hmo: p.payer,
        enrolleeId: `${p.payer.slice(0, 3).toUpperCase()}/${p.id.slice(3)}/${rng.int(10, 99)}`,
        patient: p.name,
        facility,
        department,
        serviceDate: isoDay(day),
        submittedDate: submitted <= endN ? isoDay(submitted) : '',
        vettedDate: decided ? isoDay(vetted) : '',
        paidDate: status === 'Paid' ? isoDay(paidDay) : '',
        claimed: inv.net,
        tariff,
        approved: decided ? approved : 0,
        paid,
        outstanding,
        status,
        rejectionReason: reason,
        ageDays: age,
        agingBucket: agingBucket(age),
        preAuth: rng.chance(0.9) ? `PA-${rng.int(100000, 999999)}` : '—',
      })
    }
    return inv
  }

  const pendingCreditIssues: { day: number; pid: string; amount: number; ref: string }[] = []

  // -------------------------------------------------------- admissions sim
  interface BedState {
    freeAt: number[]
  }
  const beds = new Map<string, BedState>()
  WARDS.forEach((w) => beds.set(w.id, { freeAt: Array(w.beds).fill(0) }))
  const admissions: Admission[] = []
  const depositOf = new Map<string, DepositAccount>()
  const transfers: Transfer[] = []
  let admSeq = 1
  const recentDischarges = new Map<string, { pid: string; day: number }[]>()
  const wardLos: Record<string, number> = { MED: 5, SUR: 4.4, MAT: 2.4, PAE: 3.4, ICU: 6.5, GEN: 3.2 }
  const wardRate: Record<string, number> = { MED: 38000, SUR: 42000, MAT: 32000, PAE: 30000, ICU: 125000, GEN: 28000 }

  // ------------------------------------------------------------- day loop
  const hours = [8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18]
  const hourW = [9, 14, 15, 13, 10, 9, 9, 8, 6, 4, 3]
  const docsBy = new Map<string, typeof DOCTORS>()
  DOCTORS.forEach((d) => {
    const k = `${d.facility}|${d.department}`
    docsBy.set(k, [...(docsBy.get(k) ?? []), d])
  })
  const docCompletion = new Map<string, number>()
  DOCTORS.forEach((d, i) => docCompletion.set(d.name, 0.8 + ((i * 37) % 19) / 100))

  for (let day = startN; day <= endN; day++) {
    const iso = isoDay(day)
    const month = Number(iso.slice(5, 7))
    const dow = dowOf(day)
    const isToday = day === endN
    const dowF = [0.42, 1.18, 1.08, 1.04, 1.02, 0.98, 0.66][dow]
    const season = month >= 6 && month <= 10 ? 1.12 : month === 12 ? 0.86 : 1
    const growth = 0.9 + 0.2 * ((day - startN) / (endN - startN))
    const maxMin = isToday ? NOW_MIN - day * 1440 : 24 * 60

    // Deliveries arriving today
    for (const po of deliveries.get(day) ?? []) {
      const st = stockMap.get(sKey(po.facility, po.itemCode))!
      const shortDated = rng.chance(0.07)
      st.batches.push({ batch: `B${pad(batchSeq++, 5)}`, qty: po.qtyReceived, expiry: isoDay(day + (shortDated ? rng.int(50, 140) : rng.int(240, 900))) })
      st.batches.sort((a, b) => a.expiry.localeCompare(b.expiry))
      st.openPO = false
      addMovement(st, day, 10 * 60 + rng.int(0, 240), 'Received', po.qtyReceived, 'Pharmacy', po.id, storeKeeper(po.facility))
    }

    // Expiry write-offs
    for (const st of stockMap.values()) {
      const expired = st.batches.filter((b) => b.expiry < iso)
      if (expired.length) {
        const q = expired.reduce((a, b) => a + b.qty, 0)
        st.batches = st.batches.filter((b) => b.expiry >= iso)
        if (q > 0) addMovement(st, day, 8 * 60, 'Expired', -q, 'Pharmacy', `WO-EXP-${expired[0].batch}`, storeKeeper(st.facility))
      }
    }

    // Credit wallet deposits / promos / scheduled reversals
    for (const pc of pendingCreditIssues.filter((x) => x.day === day)) {
      creditTxn(day, 680, pc.pid, 'Issued', pc.amount, pc.ref, 'Finance – Receivables')
    }
    const walletTopUps = rng.poisson(1.1)
    for (let i = 0; i < walletTopUps; i++) {
      const f = rng.weighted(FACILITIES, FACILITIES.map((x) => x.weight))
      const pool = pools[f.id].adults
      const p = pool[rng.int(0, pool.length - 1)]
      if (p.payerType !== 'Self-pay') continue
      if (!wallets.has(p.id)) wallets.set(p.id, { balance: 0, facility: f.id, patient: p.name, type: 'Wallet top-up' })
      const amt = rng.pick([20000, 30000, 50000, 50000, 100000, 150000, 200000])
      creditTxn(day, rng.int(540, 960), p.id, 'Issued', amt, `DEP-${pad(crSeq, 6)}`, rng.pick(cashiers[f.id]))
      if (rng.chance(0.03)) {
        const rd = day + rng.int(1, 10)
        pendingReversals.set(rd, [...(pendingReversals.get(rd) ?? []), { pid: p.id, amount: amt }])
      }
    }
    if (iso.endsWith('-01')) {
      for (let i = 0; i < 12; i++) {
        const f = rng.pick(FACILITIES)
        const p = pools[f.id].adults[rng.int(0, pools[f.id].adults.length - 1)]
        if (p.payerType !== 'Self-pay' || wallets.has(p.id)) continue
        wallets.set(p.id, { balance: 0, facility: f.id, patient: p.name, type: 'Promotional credit' })
        creditTxn(day, 540, p.id, 'Issued', rng.pick([5000, 7500, 10000]), `PROMO-${iso.slice(0, 7)}`, 'Marketing – Patient Experience')
      }
    }
    for (const rv of pendingReversals.get(day) ?? []) {
      const w = wallets.get(rv.pid)
      if (w && w.balance >= rv.amount) creditTxn(day, 700, rv.pid, 'Reversed', rv.amount, 'Deposit refunded on request', rng.pick(financeApprovers))
    }
    if (rng.chance(0.08) && wallets.size) {
      const keys = [...wallets.keys()]
      const pid = keys[rng.int(0, keys.length - 1)]
      const w = wallets.get(pid)!
      const amt = rng.pick([-2500, -1000, 500, 1000, 2000])
      if (w.balance + amt >= 0) creditTxn(day, 720, pid, 'Adjusted', amt, 'Balance correction', rng.pick(financeApprovers))
    }

    // ----- Outpatient visits
    for (const f of FACILITIES) {
      const lambda = ((BASE_VISITS_PER_DAY * f.weight) / totalW) * dowF * season * growth * (isToday ? 0.58 : 1)
      const n = rng.poisson(lambda)
      for (let i = 0; i < n; i++) {
        const dept = rng.weighted(f.departments, f.departments.map((d) => DEPT_WEIGHT[d as Department])) as Department
        const docs = docsBy.get(`${f.id}|${dept}`)!
        const doc = rng.pick(docs)
        let minute = rng.weighted(hours, hourW) * 60 + rng.int(0, 59)
        if (isToday && minute > maxMin - 10) minute = rng.int(8 * 60, maxMin - 10)
        const want = dept === 'Paediatrics' ? 'kid' : dept === 'Obstetrics & Gynaecology' ? 'woman' : ['General Outpatient', 'Emergency', 'Dental', 'Ophthalmology'].includes(dept) && rng.chance(0.12) ? 'kid' : 'adult'
        const isNew = rng.chance(0.23)
        let p: Patient
        if (isNew) p = makePatient(f.id, day, want)
        else {
          const pool = want === 'kid' ? pools[f.id].kids : want === 'woman' ? pools[f.id].women : pools[f.id].adults
          p = pool[rng.int(0, pool.length - 1)]
          const holders = creditHolders.get(f.id) ?? []
          if (want === 'adult' && holders.length && rng.chance(0.11)) p = rng.pick(holders)
        }
        const virtual = !isNew && ['General Outpatient', 'Internal Medicine', 'Paediatrics', 'Cardiology', 'Obstetrics & Gynaecology'].includes(dept) && rng.chance(0.08)
        const type: Visit['type'] = dept === 'Emergency' ? 'Emergency' : isNew ? (rng.chance(0.2) ? 'Referral' : 'New') : rng.weighted(['Follow-up', 'Review', 'Referral', 'New'] as const, [46, 30, 10, 14])
        const booking: Visit['booking'] = dept === 'Emergency' ? 'Walk-in' : virtual || rng.chance(0.45) ? 'Scheduled' : 'Walk-in'
        let status: Visit['status'] = 'Completed'
        const r = rng.next()
        if (booking === 'Scheduled' && r < 0.055) status = 'No-show'
        else if (r > 0.97) status = 'Cancelled'
        if (isToday && minute > maxMin - 75 && status === 'Completed') status = 'In progress'
        const peak = minute >= 600 && minute < 780 ? 1.3 : 1
        const baseWait = { LKI: 36, IKJ: 30, ABJ: 25, PHC: 21 }[f.id] ?? 28
        const wait = dept === 'Emergency' ? Math.max(2, Math.round(rng.normal(11, 5))) : Math.max(4, Math.round(rng.normal(baseWait * peak * (dow === 1 ? 1.2 : 1) * (booking === 'Scheduled' ? 0.7 : 1), baseWait * 0.35)))
        const dxList = DIAGNOSES[dept]
        const dxW = dxList.map((d, k) => (1 / (k + 1.5)) * (d.code === 'B54' && month >= 6 && month <= 10 ? 1.7 : 1))
        const dx = rng.weighted(dxList, dxW)
        const sec = rng.chance(0.3) ? rng.pick(dxList.filter((d) => d.code !== dx.code)) : undefined
        let codingFlag: Visit['codingFlag'] = 'OK'
        let code = dx.code
        if (rng.chance(0.025)) {
          codingFlag = 'Missing code'
          code = ''
        } else if (code.startsWith('R')) codingFlag = 'Symptom code only'
        else if (code.endsWith('.9') && rng.chance(0.22)) codingFlag = 'Unspecified code'
        const fee = Math.round(CONSULT_FEE[dept] * (virtual ? 0.8 : 1))
        const visit: Visit = {
          id: `VST-${pad(visitSeq++, 6)}`,
          date: stampFromMin(day * 1440 + minute),
          patientId: p.id,
          patient: p.name,
          gender: p.gender,
          ageBand: p.ageBand,
          facility: f.id,
          department: dept,
          specialty: SPECIALTY[dept],
          doctor: doc.name,
          type,
          channel: virtual ? 'Virtual' : 'In-person',
          booking,
          status,
          isNewPatient: isNew,
          waitMinutes: status === 'Completed' || status === 'In progress' ? wait : 0,
          consultMinutes: status === 'Completed' ? Math.max(6, Math.round(rng.normal(dept === 'General Outpatient' ? 13 : 19, 5))) : 0,
          diagnosisCode: status === 'Completed' ? code : '',
          diagnosis: status === 'Completed' ? dx.name : '',
          secondaryCode: status === 'Completed' && sec ? sec.code : '',
          secondaryDiagnosis: status === 'Completed' && sec ? sec.name : '',
          codingFlag: status === 'Completed' ? codingFlag : 'OK',
          documentation: status === 'Completed' ? (rng.chance(docCompletion.get(doc.name)!) ? 'Complete' : 'Incomplete') : 'Incomplete',
          referralSource: type === 'Referral' ? rng.weighted(['External clinic', 'HMO referral', 'Internal – GOPD', 'Self-referral'], [35, 25, 30, 10]) : '—',
          referredOut: status === 'Completed' && rng.chance(0.035) ? rng.pick(['Teaching hospital', 'Specialist centre (external)', 'Internal – Surgery', 'Internal – Cardiology', 'Internal – Physiotherapy']) : '—',
          followUp: status === 'Completed' && rng.chance(0.38) ? 'Scheduled' : 'Not required',
          payerType: p.payerType,
          payer: p.payer,
          fee: status === 'Completed' || status === 'In progress' ? fee : 0,
          tokens: virtual && status !== 'Cancelled' ? rng.int(1, 3) : 0,
          callQuality: virtual ? (status === 'Completed' ? rng.weighted(['Good', 'Fair', 'Poor'], [76, 18, 6]) : status === 'Cancelled' ? 'Dropped' : '—') : '—',
          invoiceNo: '',
        }
        visits.push(visit)
        if (status === 'Cancelled' || status === 'No-show') continue

        const lines: InvoiceLine[] = [{ service: virtual ? `Virtual consultation – ${SPECIALTY[dept]}` : `Consultation – ${SPECIALTY[dept]}`, category: 'Consultation', qty: 1, amount: fee }]

        // Lab orders
        const labMean: Record<Department, number> = { 'General Outpatient': 0.95, 'Internal Medicine': 1.2, Paediatrics: 0.9, 'Obstetrics & Gynaecology': 1.05, Surgery: 0.85, Emergency: 1.35, Dental: 0.05, Ophthalmology: 0.12, Cardiology: 1.3, Orthopaedics: 0.45 }
        const nLabs = virtual ? rng.poisson(0.3) : rng.poisson(labMean[dept])
        const tests = [...new Set(Array.from({ length: nLabs }, () => rng.pick(DEPT_LAB_TESTS[dept])))]
        for (const tName of tests) {
          const t = LAB_TESTS.find((x) => x.name === tName)!
          const reqMin = day * 1440 + minute + rng.int(15, 45)
          const external = t.category === 'Histopathology' ? rng.chance(0.6) : t.category === 'Microbiology' ? rng.chance(0.1) : rng.chance(0.012)
          let tat = t.typicalTat * Math.exp(rng.normal(0, 0.33))
          if (rng.chance(0.06)) tat *= 2 + rng.next()
          if (external) tat += 48
          tat = Math.round(tat * 10) / 10
          const resMin = reqMin + Math.round(tat * 60)
          let lStatus: LabRecord['status'] = 'Completed'
          if (rng.chance(0.025)) lStatus = 'Cancelled'
          else if (resMin > NOW_MIN) lStatus = NOW_MIN - reqMin > 40 ? 'In progress' : 'Pending'
          else if (rng.chance(0.003)) lStatus = 'Pending'
          const done = lStatus === 'Completed'
          labs.push({
            id: `LAB-${pad(labSeq++, 6)}`,
            date: stampFromMin(reqMin),
            facility: f.id,
            department: dept,
            clinician: doc.name,
            patient: p.name,
            test: t.name,
            category: t.category,
            price: t.price,
            status: lStatus,
            priority: dept === 'Emergency' || rng.chance(0.12) ? 'Urgent' : 'Routine',
            tatHours: done ? tat : 0,
            targetTat: t.targetTat + (external ? 48 : 0),
            withinTarget: done ? (tat <= t.targetTat + (external ? 48 : 0) ? 'Yes' : 'No') : '—',
            resultAt: done ? stampFromMin(resMin) : '',
            performedAt: external ? `External – ${rng.pick(EXTERNAL_LABS)}` : 'In-house',
            ageHours: done || lStatus === 'Cancelled' ? 0 : Math.round((NOW_MIN - reqMin) / 6) / 10,
          })
          if (lStatus !== 'Cancelled') lines.push({ service: t.name, category: t.category === 'Radiology' ? 'Imaging' : 'Laboratory', qty: 1, amount: t.price })
        }

        // Prescriptions
        const rxMean = dept === 'Dental' ? 0.8 : dept === 'Ophthalmology' ? 0.9 : 1.3
        const nRx = rng.poisson(rxMean)
        const meds = [...new Set(Array.from({ length: nRx }, () => rng.pick(DEPT_MEDS[dept])))]
        for (const code of meds) {
          const st = stockMap.get(sKey(f.id, code))
          const def = ALL_ITEMS.find((x) => x.code === code)!
          const qty = def.typicalQty * rng.int(1, 2)
          let disp = 0
          let rxStatus: Prescription['status']
          const rr = rng.next()
          if (rr < 0.02) rxStatus = 'Cancelled'
          else if (rr < 0.06 || !st) rxStatus = 'Not collected'
          else {
            disp = consume(st, qty)
            st.used += disp
            rxStatus = disp === qty ? 'Fully dispensed' : disp > 0 ? 'Partially dispensed' : 'Not dispensed – out of stock'
            if (disp > 0) addMovement(st, day, Math.min(minute + 40, 1439), 'Dispensed', -disp, dept, `RX-${pad(rxSeq, 6)}`, storeKeeper(f.id))
            if (disp > 0 && rng.chance(0.004)) {
              st.batches.push({ batch: `B${pad(batchSeq++, 5)}`, qty: 1, expiry: st.batches[0]?.expiry ?? isoDay(day + 200) })
              st.batches.sort((a, b) => a.expiry.localeCompare(b.expiry))
              addMovement(st, day, Math.min(minute + 120, 1439), 'Returned', 1, dept, `RX-${pad(rxSeq, 6)} return`, storeKeeper(f.id))
            }
          }
          prescriptions.push({
            id: `RX-${pad(rxSeq++, 6)}`,
            date: stampFromMin(day * 1440 + minute + 25),
            facility: f.id,
            department: dept,
            doctor: doc.name,
            patient: p.name,
            payerType: p.payerType,
            itemCode: code,
            medication: def.name,
            category: def.category,
            qtyPrescribed: qty,
            qtyDispensed: disp,
            unitPrice: def.unitPrice,
            unitCost: def.unitCost,
            revenue: disp * def.unitPrice,
            cost: disp * def.unitCost,
            status: rxStatus,
          })
          if (disp > 0) lines.push({ service: def.name, category: 'Pharmacy', qty: disp, amount: disp * def.unitPrice })
        }

        // Procedures
        const procP: Record<Department, number> = { Dental: 0.78, Ophthalmology: 0.6, Orthopaedics: 0.38, Cardiology: 0.42, 'Obstetrics & Gynaecology': 0.3, Emergency: 0.3, Surgery: 0.26, Paediatrics: 0.16, 'General Outpatient': 0.05, 'Internal Medicine': 0.08 }
        if (!virtual && rng.chance(procP[dept])) {
          const opts = PROCEDURES.filter((x) => x.departments.includes(dept))
          const pr = rng.pick(opts)
          const wait = ['Physiotherapy', 'Dental', 'Imaging'].includes(pr.category) && rng.chance(0.35) ? rng.int(1, 12) : 0
          let pStatus: ProcedureRec['status'] = 'Completed'
          let cancelReason = ''
          if (rng.chance(0.05)) {
            pStatus = 'Cancelled'
            cancelReason = rng.pick(['Patient did not show', 'Equipment downtime', 'Clinician unavailable', 'Patient declined cost'])
          } else if (day + wait > endN) pStatus = 'Scheduled'
          procedures.push({ id: `PRC-${pad(procSeq++, 6)}`, date: stampFromMin(day * 1440 + minute + 30), facility: f.id, department: dept, clinician: doc.name, patient: p.name, procedure: pr.name, category: pr.category, price: pr.price, status: pStatus, waitDays: wait, cancelReason })
          if (pStatus === 'Completed') lines.push({ service: pr.name, category: pr.category === 'Dental' ? 'Dental' : pr.category === 'Imaging' ? 'Imaging' : 'Procedures', qty: 1, amount: pr.price })
        }

        if (status === 'Completed') {
          const inv = createInvoice(day, Math.min(minute + 60, 1439), p, f.id, dept, lines, 'Outpatient')
          visit.invoiceNo = inv.id
        }
      }

      // Consumable issues on Mondays and Thursdays
      if (dow === 1 || dow === 4) {
        for (const def of CONSUMABLES) {
          const st = stockMap.get(sKey(f.id, def.code))
          if (!st) continue
          const q = rng.poisson(st.ema * 3.5)
          if (q <= 0) continue
          const got = consume(st, q)
          st.used += got
          const dept = def.category === 'Laboratory Supplies' ? 'Laboratory' : def.category === 'Dental Supplies' ? 'Dental' : def.category === 'Imaging Supplies' ? 'Radiology' : rng.pick(['Emergency', 'General Outpatient', 'Wards', 'Theatre', 'Wards'])
          if (got > 0) addMovement(st, day, 9 * 60 + rng.int(0, 120), 'Issued', -got, dept, `REQ-${f.id}-${pad(mvSeq, 6)}`, storeKeeper(f.id))
        }
      }
      // Occasional damage
      if (rng.chance(0.035)) {
        const keys = [...stockMap.values()].filter((s) => s.facility === f.id && onHand(s) > 2)
        const st = rng.pick(keys)
        const q = consume(st, rng.int(1, 2))
        addMovement(st, day, 14 * 60, 'Damaged', -q, 'Pharmacy', `DMG-${pad(mvSeq, 6)}`, storeKeeper(f.id))
      }
    }

    // ----- Admissions
    for (const w of WARDS) {
      const kind = w.id.split('-')[1]
      const los = wardLos[kind]
      const arrivals = rng.poisson(((w.beds * 0.8) / los) * (season > 1 ? 1.08 : 1) * (isToday ? 0.5 : 1))
      const bs = beds.get(w.id)!
      for (let a = 0; a < arrivals; a++) {
        const admitMin = day * 1440 + rng.int(isToday ? 7 * 60 : 0, isToday ? maxMin - 30 : 23 * 60 + 30)
        const bedIdx = bs.freeAt.findIndex((t) => t <= admitMin)
        if (bedIdx < 0) continue
        const stayDays = Math.max(1, Math.round(los * Math.exp(rng.normal(-0.08, 0.45))))
        const orderMin = (Math.floor(admitMin / 1440) + stayDays) * 1440 + rng.int(9 * 60, 12 * 60)
        const delayH = rng.weighted([rng.next() * 2, 2 + rng.next() * 4, 6 + rng.next() * 14], [70, 20, 10])
        const dischargeMin = orderMin + Math.round(delayH * 60)
        bs.freeAt[bedIdx] = dischargeMin + 90
        const fac = FACILITIES.find((x) => x.id === w.facility)!
        const recent = (recentDischarges.get(w.facility) ?? []).filter((x) => day - x.day <= 30)
        let p: Patient
        let readmission: Admission['readmission'] = 'No'
        if (recent.length && rng.chance(0.07)) {
          const pid = rng.pick(recent).pid
          p = patientById.get(pid)!
          readmission = 'Yes'
        } else {
          const want = kind === 'PAE' ? 'kid' : kind === 'MAT' ? 'woman' : 'adult'
          p = rng.chance(0.3) ? makePatient(w.facility, day, want) : rng.pick(want === 'kid' ? pools[w.facility].kids : want === 'woman' ? pools[w.facility].women : pools[w.facility].adults)
        }
        const deptDocs = docsBy.get(`${w.facility}|${w.department}`) ?? docsBy.get(`${w.facility}|General Outpatient`)!
        const dx = kind === 'MAT' ? rng.pick(DIAGNOSES['Obstetrics & Gynaecology'].filter((d) => ['O80', 'O14.9', 'O99.0'].includes(d.code))) : rng.pick(DIAGNOSES[w.department as Department].slice(0, 5))
        const discharged = dischargeMin <= NOW_MIN
        const dischargeDay = Math.floor(dischargeMin / 1440)
        const losActual = Math.max(1, dischargeDay - Math.floor(admitMin / 1440))
        const adm: Admission = {
          id: `ADM-${pad(admSeq++, 5)}`,
          admitDate: stampFromMin(admitMin),
          dischargeDate: discharged ? stampFromMin(dischargeMin) : '',
          expectedDischarge: isoDay(Math.floor(orderMin / 1440)),
          patientId: p.id,
          patient: p.name,
          gender: p.gender,
          ageBand: p.ageBand,
          facility: w.facility,
          ward: `${w.name} (${fac.short})`,
          wardId: w.id,
          bed: `${w.id.split('-')[1]}-${String(bedIdx + 1).padStart(2, '0')}`,
          department: w.department,
          doctor: rng.pick(deptDocs).name,
          source: kind === 'MAT' ? rng.weighted(['Elective', 'Emergency', 'Outpatient'] as const, [50, 30, 20]) : rng.weighted(['Emergency', 'Outpatient', 'External referral', 'Elective'] as const, [42, 30, 14, 14]),
          diagnosis: dx.name,
          diagnosisCode: dx.code,
          los: discharged ? losActual : Math.max(1, day - Math.floor(admitMin / 1440)),
          status: discharged ? 'Discharged' : 'Admitted',
          dischargeType: discharged ? rng.weighted(['Routine discharge', 'Discharged against medical advice', 'Referred to higher centre', 'Transferred to sister facility'], [92, 3, 3, 2]) : '—',
          readmission,
          dischargeDelayHours: discharged ? Math.round(delayH * 10) / 10 : 0,
          delayReason: discharged && delayH > 4 ? rng.pick(['Awaiting billing clearance', 'Awaiting HMO authorisation', 'Discharge medication (TTO) pending', 'Awaiting family / transport', 'Consultant review pending']) : '—',
          payerType: p.payerType,
          payer: p.payer,
          invoiceNo: '',
          billed: 0,
          deposit: 0,
        }
        if (p.payerType === 'Self-pay' && rng.chance(0.86)) {
          const base: Record<string, number> = { MED: 150000, SUR: 400000, MAT: dx.code === 'O80' ? 200000 : 450000, PAE: 100000, ICU: 500000, GEN: 100000 }
          const collected = Math.round((base[kind] * rng.pick([1, 1, 1.5, 2])) / 50000) * 50000
          const dep: DepositAccount = { id: `DEP-${pad(depSeq++, 5)}`, admissionId: adm.id, patientId: p.id, patient: p.name, facility: w.facility, ward: adm.ward, department: w.department, collectedOn: stampFromMin(admitMin + 25), collected, topUps: 0, applied: 0, refunded: 0, movedToWallet: 0, held: 0, billed: 0, balanceDue: 0, status: 'Held – patient admitted', invoiceNo: '' }
          const method = rng.weighted(['POS / Card', 'Bank Transfer', 'Cash'], [45, 40, 15])
          depositTxns.push({ id: `DTX-${pad(depTxnSeq++, 6)}`, date: dep.collectedOn, depositId: dep.id, admissionId: adm.id, patient: p.name, facility: w.facility, ward: adm.ward, type: 'Collected', amount: collected, method, by: rng.pick(cashiers[w.facility]) })
          const topDay = Math.floor(admitMin / 1440) + 3
          if (stayDays >= 5 && rng.chance(0.45) && topDay * 1440 + 600 <= NOW_MIN) {
            const top = rng.pick([50000, 100000, 150000])
            dep.topUps = top
            depositTxns.push({ id: `DTX-${pad(depTxnSeq++, 6)}`, date: stampFromMin(topDay * 1440 + 600), depositId: dep.id, admissionId: adm.id, patient: p.name, facility: w.facility, ward: adm.ward, type: 'Top-up', amount: top, method: rng.pick(['POS / Card', 'Bank Transfer']), by: rng.pick(cashiers[w.facility]) })
          }
          adm.deposit = dep.collected + dep.topUps
          deposits.push(dep)
          depositOf.set(adm.id, dep)
        }
        admissions.push(adm)
        if (rng.chance(0.06) && discharged && losActual >= 2) {
          const others = WARDS.filter((x) => x.facility === w.facility && x.id !== w.id)
          if (others.length) {
            const to = rng.pick(others)
            transfers.push({ id: `TRN-${pad(transfers.length + 1, 4)}`, date: stampFromMin(admitMin + rng.int(1, losActual - 1) * 1440 + rng.int(0, 600)), patient: p.name, facility: w.facility, fromWard: w.name, toWard: to.name, reason: rng.pick(['Step-down from ICU', 'Clinical deterioration', 'Specialist care required', 'Bed management']), admissionId: adm.id })
          }
        }
        if (discharged) {
          recentDischarges.set(w.facility, [...(recentDischarges.get(w.facility) ?? []).slice(-40), { pid: p.id, day: dischargeDay }])
          const lines: InvoiceLine[] = [
            { service: `Bed & accommodation – ${w.name}`, category: 'Inpatient Services', qty: losActual, amount: losActual * wardRate[kind] },
            { service: 'Nursing care (per day)', category: 'Inpatient Services', qty: losActual, amount: losActual * 12000 },
            { service: 'Inpatient drugs & consumables', category: 'Inpatient Services', qty: 1, amount: Math.round((losActual * rng.int(9000, 26000)) / 100) * 100 },
            { service: 'Inpatient investigations package', category: 'Inpatient Services', qty: 1, amount: rng.pick([15000, 25000, 35000, 45000]) },
          ]
          if (kind === 'MAT') lines.push(dx.code === 'O80' ? { service: 'Normal vaginal delivery', category: 'Procedures', qty: 1, amount: 180000 } : { service: 'Caesarean section', category: 'Procedures', qty: 1, amount: 650000 })
          if (kind === 'SUR') lines.push(rng.pick([{ service: 'Appendicectomy', category: 'Procedures', qty: 1, amount: 450000 }, { service: 'Herniorrhaphy', category: 'Procedures', qty: 1, amount: 380000 }, { service: 'Laparoscopic cholecystectomy', category: 'Procedures', qty: 1, amount: 900000 }, { service: 'Excision biopsy', category: 'Procedures', qty: 1, amount: 220000 }]))
          if (kind === 'ICU') lines.push({ service: 'Critical care monitoring', category: 'Inpatient Services', qty: losActual, amount: losActual * 45000 })
          const inv = createInvoice(dischargeDay, dischargeMin - dischargeDay * 1440, p, w.facility, w.department, lines, 'Inpatient', depositOf.get(adm.id))
          adm.invoiceNo = inv.id
          adm.billed = inv.net
        }
      }
    }

    // Unmatched bank transfers
    const unmatched = rng.poisson(0.22)
    for (let u = 0; u < unmatched; u++) {
      const f = rng.weighted(FACILITIES, FACILITIES.map((x) => x.weight))
      payments.push({
        id: `RCT-${pad(paySeq++, 7)}`,
        date: stampFromMin(day * 1440 + rng.int(480, 1080)),
        invoiceNo: '—',
        patient: rng.chance(0.5) ? randomName(rng.chance(0.5) ? 'Male' : 'Female') : 'Unidentified depositor',
        facility: f.id,
        department: '—',
        payerType: 'Self-pay',
        payer: 'Self',
        method: 'Bank Transfer',
        amount: rng.pick([5000, 10000, 15000, 25000, 40000, 75000, 120000]),
        cashier: 'Finance – Receivables',
        reconciliation: 'Unmatched',
        reference: `TXN${rng.int(10000000, 99999999)}`,
      })
    }

    // Reorder checks + EMA update
    for (const st of stockMap.values()) {
      st.ema = st.ema * 0.94 + st.used * 0.06
      st.used = 0
      const rl = Math.max(st.def.typicalQty * 3, Math.ceil(st.ema * (st.lead + 4)))
      if (!st.openPO && onHand(st) <= rl && day < endN) raisePO(st, day)
    }

    // Month-end stock counts
    if (isoDay(day + 1).endsWith('-01')) {
      for (const st of stockMap.values()) {
        if (!rng.chance(0.08) || onHand(st) < 4) continue
        const delta = rng.pick([-3, -2, -1, -1, 1, 2])
        if (delta < 0) consume(st, -delta)
        else if (st.batches[0]) st.batches[0].qty += delta
        else continue
        addMovement(st, day, 17 * 60, 'Adjustment', delta, 'Pharmacy', `CNT-${iso.slice(0, 7)}`, storeKeeper(st.facility))
      }
    }
  }

  // ---------------------------------------------------- invoice finalise
  const invById = new Map(invoices.map((i) => [i.id, i]))
  for (const inv of invoices) {
    const invDay = dayNum(inv.date)
    let balance = inv.net - inv.credits - inv.writtenOff - (inv.paid - inv.refunded)
    // Bad-debt write-off for long-outstanding self-pay balances
    if (balance > 0 && inv.payerType === 'Self-pay' && TODAY_NUM - invDay > 120 && rng.chance(0.35)) {
      const wd = invDay + 120 + rng.int(0, 30)
      if (wd <= TODAY_NUM) {
        inv.writtenOff += balance
        adjustments.push({ id: `ADJ-${pad(adjSeq++, 6)}`, date: stampFromMin(wd * 1440 + 900), invoiceNo: inv.id, patient: inv.patient, facility: inv.facility, department: inv.department, type: 'Write-off', reason: 'Bad debt – uncollectable after 120 days', amount: balance, approvedBy: rng.pick(financeApprovers), payerType: inv.payerType })
        balance = 0
      }
    }
    inv.balance = Math.max(0, balance)
    inv.ageDays = TODAY_NUM - invDay
    inv.agingBucket = inv.balance > 0 ? agingBucket(inv.ageDays) : '—'
    const overdue = inv.balance > 0 && inv.dueDate < isoDay(TODAY_NUM)
    if (inv.balance <= 0) inv.status = inv.writtenOff > 0 && inv.paid === 0 ? 'Written off' : 'Paid'
    else if (overdue) inv.status = 'Overdue'
    else if (inv.paid > 0) inv.status = 'Part-paid'
    else inv.status = 'Unpaid'
  }
  void invById

  // ------------------------------------------------- deposits & credit
  for (const d of deposits) {
    const held = d.collected + d.topUps
    if (!d.invoiceNo) d.held = held
    const inv = d.invoiceNo ? invById.get(d.invoiceNo) : undefined
    d.balanceDue = inv ? inv.balance : 0
    d.status = !d.invoiceNo ? 'Held – patient admitted' : d.held > 0 ? 'Applied – refund pending' : d.refunded + d.movedToWallet > 0 ? 'Applied – excess refunded' : (inv?.net ?? 0) > held ? 'Applied – balance due' : 'Applied – fully used'
  }
  for (const inv of invoices) {
    if (!inv.onCredit || inv.writtenOff <= 0) continue
    const acc = creditByPatient.get(inv.patientId)
    const wo = adjustments.find((a) => a.invoiceNo === inv.id && a.type === 'Write-off')
    if (acc && wo) creditLedger.push({ id: `CLG-${pad(clSeq++, 6)}`, date: wo.date, accountId: acc.id, patient: acc.patient, facility: acc.facility, scheme: acc.scheme, type: 'Written off', amount: wo.amount, invoiceNo: inv.id, balanceAfter: 0, dueDate: inv.dueDate })
  }
  creditLedger.sort((a, b) => a.date.localeCompare(b.date))
  for (const acc of creditFacilities) {
    acc.charged = 0
    acc.repaid = 0
  }
  const accById = new Map<string, CreditFacility & { written?: number }>(creditFacilities.map((a) => [a.id, a]))
  for (const t of creditLedger) {
    const a = accById.get(t.accountId)!
    if (t.type === 'Charged to credit') a.charged += t.amount
    else if (t.type === 'Repayment') a.repaid += t.amount
    else a.written = (a.written ?? 0) + t.amount
    t.balanceAfter = a.charged - a.repaid - (a.written ?? 0)
    a.lastActivity = t.date
  }
  for (const a of creditFacilities) {
    // Owed = open balances on the account's credit invoices (after any write-offs)
    const open = invoices.filter((i) => i.onCredit && i.patientId === a.patientId && i.balance > 0)
    a.owed = open.reduce((x, i) => x + i.balance, 0)
    a.available = Math.max(0, a.limit - a.owed)
    a.utilisation = a.owed / a.limit
    a.owedPastTerms = open.filter((i) => i.dueDate < isoDay(TODAY_NUM)).reduce((x, i) => x + i.balance, 0)
    a.oldestUnpaidDays = open.length ? Math.max(...open.map((i) => i.ageDays)) : 0
    a.status = a.owed === 0 ? 'Clear' : a.owed > a.limit ? 'Over limit' : a.utilisation >= 0.8 ? 'Near limit' : 'Within limit'
  }
  depositTxns.sort((a, b) => a.date.localeCompare(b.date))

  // ------------------------------------------------------ ward census
  const wardDays: WardDay[] = []
  const occ = new Map<string, number[]>()
  const admCount = new Map<string, number[]>()
  const disCount = new Map<string, number[]>()
  const span = endN - startN + 1
  WARDS.forEach((w) => {
    occ.set(w.id, Array(span).fill(0))
    admCount.set(w.id, Array(span).fill(0))
    disCount.set(w.id, Array(span).fill(0))
  })
  for (const a of admissions) {
    const ad = dayNum(a.admitDate) - startN
    const dd = a.dischargeDate ? dayNum(a.dischargeDate) - startN : span
    admCount.get(a.wardId)![ad]++
    if (a.dischargeDate) disCount.get(a.wardId)![dd]++
    for (let d = ad; d < Math.min(dd, span); d++) occ.get(a.wardId)![d]++
    if (!a.dischargeDate) occ.get(a.wardId)![span - 1] = occ.get(a.wardId)![span - 1]
  }
  // Today's census counts current inpatients
  const nursing: NursingShift[] = []
  let wdSeq = 1
  for (const w of WARDS) {
    const fac = FACILITIES.find((x) => x.id === w.facility)!
    for (let d = 0; d < span; d++) {
      const occupied = Math.min(w.beds, occ.get(w.id)![d])
      const date = isoDay(startN + d)
      wardDays.push({ id: `WD-${pad(wdSeq++, 6)}`, date, facility: w.facility, ward: `${w.name} (${fac.short})`, department: w.department, beds: w.beds, occupied, admissions: admCount.get(w.id)![d], discharges: disCount.get(w.id)![d] })
      if (occupied === 0) continue
      for (const shift of ['Day', 'Night'] as const) {
        if (startN + d === endN && shift === 'Night') continue
        const sched = occupied * (shift === 'Day' ? 9 : 5)
        const missed = rng.poisson(sched * 0.012)
        const delayed = rng.poisson(sched * 0.05)
        nursing.push({
          id: `NS-${pad(nursing.length + 1, 6)}`,
          date: `${date} ${shift === 'Day' ? '08:00' : '20:00'}`,
          facility: w.facility,
          ward: `${w.name} (${fac.short})`,
          department: w.department,
          shift,
          nurse: rng.pick(nurses[w.facility]),
          patients: occupied,
          tasksScheduled: sched,
          tasksCompleted: Math.max(0, sched - missed),
          tasksDelayed: Math.min(delayed, sched - missed),
          tasksMissed: Math.min(missed, sched),
          vitalsRecorded: Math.max(0, occupied * (shift === 'Day' ? 3 : 2) - rng.poisson(0.3)),
          medsAdministered: Math.max(0, occupied * (shift === 'Day' ? 3 : 2) - rng.poisson(0.2)),
        })
      }
    }
  }

  // --------------------------------------------------------- stock lines
  const stock: StockLine[] = []
  const expiryLimit = isoDay(TODAY_NUM + 90)
  for (const st of stockMap.values()) {
    const qty = onHand(st)
    const rl = Math.max(st.def.typicalQty * 3, Math.ceil(st.ema * (st.lead + 4)))
    const nearest = st.batches[0]?.expiry ?? ''
    const expiringQty = st.batches.filter((b) => b.expiry <= expiryLimit).reduce((a, b) => a + b.qty, 0)
    stock.push({
      id: `${st.facility}-${st.def.code}`,
      facility: st.facility,
      itemCode: st.def.code,
      item: st.def.name,
      kind: st.def.kind,
      category: st.def.category,
      unit: st.def.unit,
      onHand: qty,
      reorderLevel: rl,
      unitCost: st.def.unitCost,
      unitPrice: st.def.unitPrice,
      value: qty * st.def.unitCost,
      nearestExpiry: nearest,
      daysToExpiry: nearest ? dayNum(nearest) - TODAY_NUM : 0,
      expiringQty,
      status: qty === 0 ? 'Out of stock' : qty <= rl ? 'Low stock' : 'In stock',
      supplier: st.supplier,
      avgDailyUse: Math.round(st.ema * 10) / 10,
      daysOfCover: st.ema > 0 ? Math.round(qty / st.ema) : 999,
      batches: st.batches.map((b) => ({ ...b })),
    })
  }

  // -------------------------------------------------------------- staff
  const staff: StaffMember[] = []
  let staffSeq = 1
  const accessRoleOf: Record<string, string> = { Doctor: 'Clinician', Dentist: 'Clinician', Nurse: 'Nursing', Pharmacist: 'Pharmacy', 'Laboratory Scientist': 'Laboratory', Cashier: 'Billing', 'Records Officer': 'Front Desk', Radiographer: 'Diagnostics', 'Facility Admin': 'Facility Administrator', Accountant: 'Finance' }
  const addStaff = (name: string, role: string, department: string, facility: string) => {
    const status = rng.weighted(['Active', 'Suspended', 'Deactivated', 'Invited'] as const, [90, 2, 5, 3])
    staff.push({
      id: `USR-${pad(staffSeq++, 4)}`,
      name,
      role,
      accessRole: accessRoleOf[role] ?? 'Staff',
      department,
      facility,
      status,
      createdOn: isoDay(startN - rng.int(-200, 900)),
      lastLogin: '',
      mfa: rng.chance(0.68) ? 'Enabled' : 'Not enabled',
      logins30d: 0,
    })
  }
  DOCTORS.forEach((d) => addStaff(d.name, d.department === 'Dental' ? 'Dentist' : 'Doctor', d.department, d.facility))
  FACILITIES.forEach((f) => {
    nurses[f.id].forEach((n) => addStaff(n, 'Nurse', rng.pick(['Wards', 'Emergency', 'General Outpatient', 'Paediatrics', 'Obstetrics & Gynaecology']), f.id))
    cashiers[f.id].forEach((c) => addStaff(c, 'Cashier', 'Finance', f.id))
    const extra: [string, number, string][] = [['Pharmacist', 2, 'Pharmacy'], ['Laboratory Scientist', 3, 'Laboratory'], ['Records Officer', 2, 'Front Desk'], ['Radiographer', 1, 'Radiology'], ['Facility Admin', 1, 'Administration']]
    extra.forEach(([role, k, dept]) => {
      const n = Math.max(1, Math.round(k * (f.weight + 0.3)))
      for (let i = 0; i < n; i++) addStaff(randomName(rng.chance(0.55) ? 'Female' : 'Male'), role, dept, f.id)
    })
  })
  ;['Tolu Adebayo', 'Ngozi Eze-Williams', 'Musa Danladi'].forEach((n) => addStaff(n, 'Accountant', 'Finance', 'LKI'))

  // -------------------------------------------------------------- logins
  const logins: LoginEvent[] = []
  const devices = ['Chrome on Windows', 'Edge on Windows', 'Chrome on Android', 'Safari on iPad', 'Chrome on macOS']
  for (let day = endN - 89; day <= endN; day++) {
    const dow = dowOf(day)
    for (const s of staff) {
      if (s.status !== 'Active') continue
      if (Number(s.id.slice(4)) % 17 === 3 && endN - day < 40) continue
      if (!rng.chance(dow === 0 ? 0.25 : dow === 6 ? 0.45 : 0.82)) continue
      const minute = rng.int(7 * 60, 19 * 60)
      if (day === endN && minute > NOW_MIN - endN * 1440) continue
      const failed = rng.chance(0.035)
      logins.push({
        id: `LGN-${pad(logins.length + 1, 6)}`,
        date: stampFromMin(day * 1440 + minute),
        user: s.name,
        role: s.role,
        facility: s.facility,
        outcome: failed ? 'Failed' : 'Success',
        reason: failed ? rng.weighted(['Incorrect password', 'MFA code rejected', 'Account locked', 'Expired password'], [70, 15, 8, 7]) : '—',
        device: rng.pick(devices),
        ip: `10.${FACILITIES.findIndex((f) => f.id === s.facility) + 10}.${rng.int(1, 40)}.${rng.int(2, 250)}`,
      })
      if (!failed) {
        s.lastLogin = stampFromMin(day * 1440 + minute)
        if (endN - day < 30) s.logins30d++
      }
    }
  }
  // A suspicious burst of failures
  for (let k = 0; k < 9; k++) {
    logins.push({ id: `LGN-${pad(logins.length + 1, 6)}`, date: stampFromMin((endN - 3) * 1440 + 22 * 60 + 10 + k * 2), user: 'Pharmacist (unknown username)', role: '—', facility: 'IKJ', outcome: 'Failed', reason: 'Unknown user', device: 'Chrome on Windows', ip: '197.210.54.18' })
  }
  logins.sort((a, b) => a.date.localeCompare(b.date))

  // ------------------------------------------------------ security events
  const security: SecurityEvent[] = []
  const admins = staff.filter((s) => s.role === 'Facility Admin' || s.role === 'Accountant')
  const secTemplates: { category: SecurityEvent['category']; action: string; severity: SecurityEvent['severity']; w: number }[] = [
    { category: 'Access change', action: 'Facility access granted', severity: 'Medium', w: 10 },
    { category: 'Access change', action: 'Facility access revoked', severity: 'Medium', w: 5 },
    { category: 'Permission change', action: 'Role changed', severity: 'High', w: 7 },
    { category: 'Permission change', action: 'Permission added to role', severity: 'High', w: 4 },
    { category: 'Permission change', action: 'Permission removed from role', severity: 'Medium', w: 3 },
    { category: 'Account status', action: 'User invited', severity: 'Low', w: 8 },
    { category: 'Account status', action: 'User deactivated', severity: 'Medium', w: 4 },
    { category: 'Account status', action: 'Password reset', severity: 'Low', w: 12 },
    { category: 'Administrative', action: 'Price list updated', severity: 'Medium', w: 6 },
    { category: 'Administrative', action: 'Invoice voided', severity: 'High', w: 4 },
    { category: 'Administrative', action: 'HMO tariff uploaded', severity: 'Medium', w: 3 },
    { category: 'Report export', action: 'Report exported (CSV)', severity: 'Low', w: 14 },
    { category: 'Report export', action: 'Patient list exported', severity: 'High', w: 3 },
  ]
  for (let day = startN; day <= endN; day++) {
    const n = rng.poisson(1.8)
    for (let k = 0; k < n; k++) {
      const t = rng.weighted(secTemplates, secTemplates.map((x) => x.w))
      const actor = rng.pick(admins)
      const target = rng.pick(staff)
      security.push({
        id: `SEC-${pad(security.length + 1, 5)}`,
        date: stampFromMin(day * 1440 + rng.int(8 * 60, 18 * 60)),
        actor: actor.name,
        facility: actor.facility,
        category: t.category,
        action: t.action,
        target: t.category === 'Report export' ? rng.pick(['Billing Summary', 'Claims Register', 'Stock Balance', 'Patient Visits', 'Outstanding Balances']) : t.category === 'Administrative' ? rng.pick(['Lekki price list', 'Invoice INV-0' + rng.int(10000, 99999), 'Crestview HMO tariff 2026']) : `${target.name} (${target.role})`,
        severity: t.severity,
        details: t.action === 'Role changed' ? `${rng.pick(['Billing', 'Front Desk', 'Nursing'])} → ${rng.pick(['Finance', 'Facility Administrator', 'Pharmacy'])}` : t.action === 'Facility access granted' ? `Granted ${rng.pick(FACILITIES).name}` : '—',
      })
    }
  }

  // --------------------------------------------------------- integrations
  const integrations: IntegrationRun[] = []
  const integErrors: Record<string, string[]> = {
    'HMO Claims Exchange': ['HMO endpoint timeout', 'Invalid enrollee ID format', 'Batch rejected – schema mismatch'],
    'Payment Gateway': ['Webhook signature mismatch', 'Settlement file delayed'],
    'Lab Analyzer Interface (LIS)': ['Analyzer offline', 'Unmapped test code'],
    'SMS & WhatsApp Notifications': ['Provider rate limit', 'Invalid phone number'],
    'General Ledger Export': ['Account mapping missing', 'Period locked in ledger'],
    'PACS Imaging Archive': ['DICOM store failed', 'Storage quota warning'],
  }
  const visitsByDay = new Map<string, number>()
  visits.forEach((v) => visitsByDay.set(v.date.slice(0, 10), (visitsByDay.get(v.date.slice(0, 10)) ?? 0) + 1))
  for (let day = startN; day <= endN; day++) {
    const vol = visitsByDay.get(isoDay(day)) ?? 20
    for (const ig of INTEGRATIONS) {
      const records = Math.round(vol * ({ 'HMO Claims Exchange': 0.35, 'Payment Gateway': 0.9, 'Lab Analyzer Interface (LIS)': 1.1, 'SMS & WhatsApp Notifications': 2.4, 'General Ledger Export': 1.6, 'PACS Imaging Archive': 0.12 }[ig.name] ?? 1) * (0.85 + rng.next() * 0.3))
      const r = rng.next()
      const status: IntegrationRun['status'] = r < (ig.name === 'HMO Claims Exchange' ? 0.05 : 0.02) ? 'Failed' : r < 0.1 ? 'Partial' : 'Success'
      const failed = status === 'Failed' ? records : status === 'Partial' ? Math.max(1, Math.round(records * (0.02 + rng.next() * 0.08))) : 0
      integrations.push({
        id: `INT-${pad(integrations.length + 1, 5)}`,
        date: stampFromMin(day * 1440 + (ig.name === 'General Ledger Export' ? 23 * 60 : rng.int(60, 22 * 60))),
        integration: ig.name,
        direction: ig.direction,
        facility: 'All facilities',
        records,
        failed,
        status,
        durationSec: Math.round(5 + records * (0.2 + rng.next() * 0.4)),
        error: status === 'Success' ? '—' : rng.pick(integErrors[ig.name]),
        reconciled: ig.name === 'General Ledger Export' || ig.name === 'Payment Gateway' ? (status === 'Success' ? (rng.chance(0.95) ? 'Balanced' : 'Variance') : 'Variance') : '—',
      })
    }
  }

  payments.sort((a, b) => a.date.localeCompare(b.date))
  adjustments.sort((a, b) => a.date.localeCompare(b.date))
  credits.sort((a, b) => a.date.localeCompare(b.date))
  movements.sort((a, b) => a.date.localeCompare(b.date))
  invoices.sort((a, b) => a.date.localeCompare(b.date))
  admissions.sort((a, b) => a.admitDate.localeCompare(b.admitDate))

  // Keep DEPARTMENTS referenced for tree-shaking clarity
  void DEPARTMENTS

  return {
    generatedAt: stampFromMin(NOW_MIN),
    patients,
    visits,
    labs,
    prescriptions,
    procedures,
    invoices,
    payments,
    adjustments,
    credits,
    deposits,
    depositTxns,
    creditFacilities,
    creditLedger,
    admissions,
    transfers,
    wardDays,
    nursing,
    stock,
    movements,
    purchaseOrders,
    claims,
    staff,
    logins,
    security,
    integrations,
  }
}

let cache: Db | null = null
export function getDb(): Db {
  if (!cache) cache = generateDb()
  return cache
}
