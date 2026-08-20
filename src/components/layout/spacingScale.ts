/**
 * Tailwind's JIT compiler only picks up class names that appear literally
 * in source — `gap-${n}` template strings would be invisible to it. These
 * lookup maps are how the layout primitives expose a numeric `gap`/`py`
 * prop while keeping every possible class name statically visible.
 */
export type SpaceValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 8 | 10 | 12 | 16 | 20 | 24

export const GAP_CLASSES: Record<SpaceValue, string> = {
  0: 'gap-0',
  1: 'gap-1',
  2: 'gap-2',
  3: 'gap-3',
  4: 'gap-4',
  5: 'gap-5',
  6: 'gap-6',
  8: 'gap-8',
  10: 'gap-10',
  12: 'gap-12',
  16: 'gap-16',
  20: 'gap-20',
  24: 'gap-24',
}

export const PY_CLASSES: Record<SpaceValue, string> = {
  0: 'py-0',
  1: 'py-1',
  2: 'py-2',
  3: 'py-3',
  4: 'py-4',
  5: 'py-5',
  6: 'py-6',
  8: 'py-8',
  10: 'py-10',
  12: 'py-12',
  16: 'py-16',
  20: 'py-20',
  24: 'py-24',
}
