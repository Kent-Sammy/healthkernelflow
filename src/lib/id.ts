import { nanoid } from 'nanoid'

/**
 * Realistic, prefixed, collision-resistant IDs — mirrors the shape a real
 * backend would hand back (e.g. Stripe-style `sub_...`, `cus_...`) so the
 * mock layer is indistinguishable from a real API at the data-shape level.
 */
const PREFIXES = {
  organization: 'org',
  user: 'usr',
  facility: 'fac',
  trial: 'trl',
  subscription: 'sub',
  customConfig: 'cfg',
  invoice: 'inv',
  toast: 'tst',
} as const

export type IdKind = keyof typeof PREFIXES

export function generateId(kind: IdKind): string {
  return `${PREFIXES[kind]}_${nanoid(14)}`
}

export function nowIso(): string {
  return new Date().toISOString()
}

export function addDays(date: Date | string, days: number): string {
  const base = typeof date === 'string' ? new Date(date) : date
  const result = new Date(base)
  result.setDate(result.getDate() + days)
  return result.toISOString()
}
