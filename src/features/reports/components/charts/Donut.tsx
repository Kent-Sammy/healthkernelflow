import { useState } from 'react'
import { formatValue, type Fmt } from '../../engine/format'
import { colorFor } from './colors'

interface Props {
  items: { key: string; value: number }[]
  fmt: Fmt
  centerLabel?: string
  onSliceClick?: (key: string) => void
  size?: number
}

export function Donut({ items, fmt, centerLabel = 'Total', onSliceClick, size = 160 }: Props) {
  const [hover, setHover] = useState<number | null>(null)
  const additive = fmt === 'number' || fmt === 'currency'
  const positive = items.filter((i) => i.value > 0)
  const total = positive.reduce((a, b) => a + b.value, 0)
  const r = size / 2 - 4
  const inner = r * 0.64
  const cx = size / 2
  let angle = -Math.PI / 2
  const arcs = positive.map((it, i) => {
    const frac = total ? it.value / total : 0
    const a0 = angle
    const a1 = angle + frac * Math.PI * 2
    angle = a1
    const gap = positive.length > 1 ? 0.012 : 0
    const s = a0 + gap
    const e = Math.max(s, a1 - gap)
    const large = e - s > Math.PI ? 1 : 0
    const p = (rad: number, a: number) => `${cx + rad * Math.cos(a)},${cx + rad * Math.sin(a)}`
    const d = frac >= 0.9999 ? `M${cx - r},${cx} a${r},${r} 0 1,0 ${r * 2},0 a${r},${r} 0 1,0 ${-r * 2},0 M${cx - inner},${cx} a${inner},${inner} 0 1,1 ${inner * 2},0 a${inner},${inner} 0 1,1 ${-inner * 2},0` : `M${p(r, s)} A${r},${r} 0 ${large} 1 ${p(r, e)} L${p(inner, e)} A${inner},${inner} 0 ${large} 0 ${p(inner, s)} Z`
    return { ...it, d, frac, color: colorFor(it.key, items.indexOf(it)), idx: i }
  })
  const focus = hover !== null ? arcs[hover] : null

  return (
    <div className="flex flex-wrap items-center justify-center gap-x-5 gap-y-4">
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} role="img" aria-label="Donut chart">
          {arcs.map((a, i) => (
            <path
              key={a.key}
              d={a.d}
              fill={a.color}
              fillRule="evenodd"
              opacity={hover === null || hover === i ? 1 : 0.45}
              style={{ cursor: onSliceClick ? 'pointer' : 'default', transition: 'opacity 120ms' }}
              onMouseEnter={() => setHover(i)}
              onMouseLeave={() => setHover(null)}
              onClick={() => onSliceClick?.(a.key)}
            />
          ))}
        </svg>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <span className="max-w-[90px] truncate text-[11px] text-neutral-500">{focus ? focus.key : centerLabel}</span>
          <span className="text-[15px] font-semibold tabular-nums text-neutral-900">{formatValue(focus ? focus.value : additive ? total : NaN, fmt, true)}</span>
          {focus && additive && <span className="text-[11px] text-neutral-500">{(focus.frac * 100).toFixed(1)}%</span>}
        </div>
      </div>
      <ul className="flex min-w-[200px] flex-1 flex-col gap-1.5">
        {items.map((it, i) => {
          const a = arcs.find((x) => x.key === it.key)
          return (
            <li key={it.key}>
              <button
                type="button"
                disabled={!onSliceClick}
                onClick={() => onSliceClick?.(it.key)}
                onMouseEnter={() => a && setHover(a.idx)}
                onMouseLeave={() => setHover(null)}
                className="flex w-full items-center gap-2 rounded-md px-1.5 py-1 text-left text-[12.5px] hover:bg-neutral-50 disabled:cursor-default"
              >
                <span className="size-2.5 shrink-0 rounded-[3px]" style={{ background: colorFor(it.key, i) }} />
                <span className="min-w-0 flex-1 truncate text-neutral-700">{it.key}</span>
                <span className="tabular-nums font-medium text-neutral-900">{formatValue(it.value, fmt, true)}</span>
                {additive && total > 0 && <span className="w-11 text-right tabular-nums text-neutral-500">{((it.value / total) * 100).toFixed(1)}%</span>}
              </button>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
