/** Small seeded PRNG so the demo dataset is identical on every load. */
export function createRng(seed: number) {
  let s = seed >>> 0
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0
    let t = s
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  const int = (min: number, max: number) => Math.floor(next() * (max - min + 1)) + min
  const pick = <T,>(arr: readonly T[]): T => arr[Math.floor(next() * arr.length)]
  const chance = (p: number) => next() < p
  /** Pick by relative weights. */
  const weighted = <T,>(items: readonly T[], weights: readonly number[]): T => {
    const total = weights.reduce((a, b) => a + b, 0)
    let r = next() * total
    for (let i = 0; i < items.length; i++) {
      r -= weights[i]
      if (r <= 0) return items[i]
    }
    return items[items.length - 1]
  }
  /** Roughly normal (sum of uniforms). */
  const normal = (mean: number, sd: number) => {
    const u = next() + next() + next() + next() + next() + next() - 3
    return mean + u * sd
  }
  /** Poisson-ish count for small means. */
  const poisson = (lambda: number) => {
    const L = Math.exp(-lambda)
    let k = 0
    let p = 1
    do {
      k++
      p *= next()
    } while (p > L)
    return k - 1
  }
  return { next, int, pick, chance, weighted, normal, poisson }
}

export type Rng = ReturnType<typeof createRng>
