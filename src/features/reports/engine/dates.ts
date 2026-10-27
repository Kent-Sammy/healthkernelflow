/**
 * The demo dataset is anchored to a fixed "today" so every figure is
 * reproducible regardless of when the prototype is opened.
 */
export const DEMO_TODAY = '2026-10-27'
export const DEMO_NOW_MIN = 13 * 60 + 45 // 13:45
export const DATA_START = '2025-11-01'

const MS_DAY = 86400000

export function dayNum(iso: string): number {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  const d = Number(iso.slice(8, 10))
  return Math.round(Date.UTC(y, m - 1, d) / MS_DAY)
}

const isoCache = new Map<number, string>()
export function isoDay(n: number): string {
  let s = isoCache.get(n)
  if (s === undefined) {
    s = new Date(n * MS_DAY).toISOString().slice(0, 10)
    isoCache.set(n, s)
  }
  return s
}

export function addDays(iso: string, n: number): string {
  return isoDay(dayNum(iso) + n)
}

/** Absolute minutes → 'YYYY-MM-DD HH:mm'. */
export function stampFromMin(absMin: number): string {
  const day = Math.floor(absMin / 1440)
  const m = absMin - day * 1440
  const hh = String(Math.floor(m / 60)).padStart(2, '0')
  const mm = String(m % 60).padStart(2, '0')
  return `${isoDay(day)} ${hh}:${mm}`
}

export function minFromStamp(stamp: string): number {
  const day = dayNum(stamp)
  const hh = Number(stamp.slice(11, 13) || 0)
  const mm = Number(stamp.slice(14, 16) || 0)
  return day * 1440 + hh * 60 + mm
}

export const TODAY_NUM = dayNum(DEMO_TODAY)
export const NOW_MIN = TODAY_NUM * 1440 + DEMO_NOW_MIN

export function dowOf(n: number): number {
  return new Date(n * MS_DAY).getUTCDay()
}

export function monthKey(iso: string): string {
  return iso.slice(0, 7)
}

export function endOfMonth(iso: string): string {
  const y = Number(iso.slice(0, 4))
  const m = Number(iso.slice(5, 7))
  return new Date(Date.UTC(y, m, 0)).toISOString().slice(0, 10)
}

export function agingBucket(days: number): string {
  if (days <= 30) return '0–30 days'
  if (days <= 60) return '31–60 days'
  if (days <= 90) return '61–90 days'
  return '90+ days'
}

export const AGING_ORDER = ['0–30 days', '31–60 days', '61–90 days', '90+ days']

export function ageBand(age: number): string {
  if (age < 5) return '0–4'
  if (age < 15) return '5–14'
  if (age < 25) return '15–24'
  if (age < 45) return '25–44'
  if (age < 65) return '45–64'
  return '65+'
}

export const AGE_BAND_ORDER = ['0–4', '5–14', '15–24', '25–44', '45–64', '65+']
