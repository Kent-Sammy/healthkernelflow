export type Fmt = 'number' | 'decimal' | 'currency' | 'percent' | 'hours' | 'minutes' | 'days' | 'text' | 'date' | 'datetime' | 'status'

const nf0 = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 0 })
const nf1 = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 1, minimumFractionDigits: 1 })
const nf2 = new Intl.NumberFormat('en-NG', { maximumFractionDigits: 2, minimumFractionDigits: 2 })
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']

export const naira = (n: number) => `${n < 0 ? '−' : ''}₦${nf2.format(Math.abs(n))}`
export const nairaWhole = (n: number) => `${n < 0 ? '−' : ''}₦${nf0.format(Math.abs(Math.round(n)))}`

export function nairaCompact(n: number): string {
  const a = Math.abs(n)
  const sign = n < 0 ? '−' : ''
  if (a >= 1e9) return `${sign}₦${(a / 1e9).toFixed(2)}B`
  if (a >= 1e6) return `${sign}₦${(a / 1e6).toFixed(a >= 1e8 ? 1 : 2)}M`
  if (a >= 1e3) return `${sign}₦${(a / 1e3).toFixed(a >= 1e5 ? 0 : 1)}K`
  return `${sign}₦${nf0.format(a)}`
}

export function numCompact(n: number): string {
  const a = Math.abs(n)
  if (a >= 1e6) return `${(n / 1e6).toFixed(1)}M`
  if (a >= 1e4) return `${(n / 1e3).toFixed(1)}K`
  return nf0.format(n)
}

export const num = (n: number) => nf0.format(n)

export function fmtDate(iso: string): string {
  if (!iso) return '—'
  const d = Number(iso.slice(8, 10))
  const m = MONTHS[Number(iso.slice(5, 7)) - 1]
  return `${String(d).padStart(2, '0')} ${m} ${iso.slice(0, 4)}`
}

export function fmtDateTime(stamp: string): string {
  if (!stamp) return '—'
  return stamp.length > 10 ? `${fmtDate(stamp)}, ${stamp.slice(11, 16)}` : fmtDate(stamp)
}

export function fmtMonth(key: string): string {
  return `${MONTHS[Number(key.slice(5, 7)) - 1]} ${key.slice(2, 4)}`
}

export function formatValue(v: unknown, fmt: Fmt = 'text', compact = false): string {
  if (v === null || v === undefined || v === '') return '—'
  if (typeof v === 'number' && !Number.isFinite(v)) return '—'
  switch (fmt) {
    case 'currency':
      return compact ? nairaCompact(Number(v)) : naira(Number(v))
    case 'number':
      return compact ? numCompact(Number(v)) : nf0.format(Number(v))
    case 'decimal':
      return nf1.format(Number(v))
    case 'percent':
      return `${nf1.format(Number(v) * 100)}%`
    case 'hours':
      return `${nf1.format(Number(v))} h`
    case 'minutes':
      return `${nf0.format(Number(v))} min`
    case 'days':
      return `${nf1.format(Number(v))} d`
    case 'date':
      return fmtDate(String(v))
    case 'datetime':
      return fmtDateTime(String(v))
    default:
      return String(v)
  }
}

/** Plain value for CSV export. */
export function csvValue(v: unknown, fmt: Fmt = 'text'): string {
  if (v === null || v === undefined) return ''
  if (fmt === 'percent') return (Number(v) * 100).toFixed(1)
  if (fmt === 'currency') return Number(v).toFixed(2)
  if (fmt === 'decimal' || fmt === 'hours' || fmt === 'days') return Number(v).toFixed(1)
  return String(v)
}
