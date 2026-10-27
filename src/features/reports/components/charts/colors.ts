/** Categorical palette (validated for CVD separation; brand teal first). */
export const SERIES = ['#0f9488', '#eb6834', '#2a78d6', '#eda100', '#6250d6', '#e87ba4', '#008300', '#e34948']
export const OTHER = '#94a3b8'

/** Colour follows the entity, not its rank, for entities that recur across charts. */
const FIXED: Record<string, string> = {
  'Crestfield Lekki': SERIES[0],
  'Crestfield Ikeja': SERIES[1],
  'Crestfield Abuja (Wuse)': SERIES[2],
  'Crestfield Port Harcourt': SERIES[3],
  'Self-pay': SERIES[0],
  HMO: SERIES[2],
  Corporate: SERIES[1],
}

export function colorFor(key: string, i: number): string {
  if (key.startsWith('Other')) return OTHER
  return FIXED[key] ?? SERIES[i % SERIES.length]
}

export function niceMax(v: number): number {
  if (!Number.isFinite(v) || v <= 0) return 1
  const exp = Math.pow(10, Math.floor(Math.log10(v)))
  const f = v / exp
  const step = f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10
  return step * exp
}
