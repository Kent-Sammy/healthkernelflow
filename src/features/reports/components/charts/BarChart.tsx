import { useState } from 'react'
import { formatValue, type Fmt } from '../../engine/format'
import { colorFor, niceMax } from './colors'
import { Legend } from './Legend'
import { ChartTooltip, TooltipRow } from './Tooltip'
import { useWidth } from './useWidth'
import type { Series } from './LineChart'

interface Props {
  labels: string[]
  series: Series[]
  fmt: Fmt
  stacked?: boolean
  height?: number
  onBarClick?: (index: number) => void
}

const PAD = { l: 56, r: 8, t: 12, b: 28 }

/** Rounded top corners only, anchored to the baseline. */
function barPath(x: number, y: number, w: number, h: number, r: number) {
  if (h <= 0) return ''
  const rr = Math.min(r, w / 2, h)
  return `M${x},${y + h} L${x},${y + rr} Q${x},${y} ${x + rr},${y} L${x + w - rr},${y} Q${x + w},${y} ${x + w},${y + rr} L${x + w},${y + h} Z`
}

export function BarChart({ labels, series, fmt, stacked, height = 240, onBarClick }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const n = labels.length
  const w = Math.max(200, width)
  const iw = w - PAD.l - PAD.r
  const ih = height - PAD.t - PAD.b
  const totals = labels.map((_, i) => series.reduce((a, s) => a + Math.max(0, s.values[i] || 0), 0))
  const rawMax = stacked ? Math.max(0, ...totals) : Math.max(0, ...series.flatMap((s) => s.values))
  const max = fmt === 'percent' ? Math.min(1, niceMax(rawMax * 1.05)) : niceMax(rawMax * 1.05)
  const y = (v: number) => (v / max) * ih
  const slot = iw / Math.max(1, n)
  const groupW = Math.min(56, slot * 0.72)
  const grouped = !stacked && series.length > 1
  const barW = grouped ? Math.max(2, (groupW - (series.length - 1) * 2) / series.length) : groupW
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 58))))
  const colors = series.map((s, i) => s.color ?? colorFor(s.label, i))
  const maxChars = Math.max(6, Math.floor((slot * every) / 6.8))

  return (
    <div className="flex flex-col gap-2">
      <Legend items={series.map((s, i) => ({ key: s.label, color: colors[i] }))} />
      <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
        <svg width={w} height={height} role="img" aria-label={`Bar chart: ${series.map((s) => s.label).join(', ')}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={w - PAD.r} y1={PAD.t + ih - y(t)} y2={PAD.t + ih - y(t)} stroke="#e8eef0" strokeDasharray={t === 0 ? undefined : '3 4'} />
              <text x={PAD.l - 8} y={PAD.t + ih - y(t) + 4} textAnchor="end" className="fill-neutral-400 text-[11px]">
                {formatValue(t, fmt, true)}
              </text>
            </g>
          ))}
          {labels.map((l, i) => {
            const cx = PAD.l + slot * i + slot / 2
            const x0 = cx - groupW / 2
            let acc = 0
            return (
              <g key={i} opacity={hover === null || hover === i ? 1 : 0.55}>
                {series.map((s, si) => {
                  const v = Math.max(0, s.values[i] || 0)
                  const h = y(v)
                  if (stacked) {
                    const top = PAD.t + ih - acc - h
                    acc += h
                    const isTop = si === series.length - 1 || series.slice(si + 1).every((t) => !(t.values[i] > 0))
                    return isTop ? <path key={s.id} d={barPath(x0, top, groupW, Math.max(0, h - (si ? 0 : 0)), 4)} fill={colors[si]} /> : <rect key={s.id} x={x0} y={top + 1} width={groupW} height={Math.max(0, h - 2)} fill={colors[si]} />
                  }
                  const bx = grouped ? x0 + si * (barW + 2) : x0
                  return <path key={s.id} d={barPath(bx, PAD.t + ih - h, barW, h, 4)} fill={colors[si]} />
                })}
                {((i % every === 0 && n - 1 - i >= every) || i === n - 1) && (
                  <text x={cx} y={height - 8} textAnchor="middle" className="fill-neutral-400 text-[11px]">
                    {l.length > maxChars ? `${l.slice(0, maxChars - 1)}…` : l}
                  </text>
                )}
                <rect
                  x={PAD.l + slot * i}
                  y={PAD.t}
                  width={slot}
                  height={ih}
                  fill="transparent"
                  style={{ cursor: onBarClick ? 'pointer' : 'default' }}
                  onMouseEnter={() => setHover(i)}
                  onClick={() => onBarClick?.(i)}
                />
              </g>
            )
          })}
        </svg>
        {hover !== null && (
          <ChartTooltip x={PAD.l + slot * hover + slot / 2} y={PAD.t} width={w}>
            <div className="mb-1 font-semibold text-neutral-900">{labels[hover]}</div>
            {series.map((s, si) => (
              <TooltipRow key={s.id} color={series.length > 1 ? colors[si] : undefined} label={s.label} value={formatValue(s.values[hover], fmt)} />
            ))}
            {stacked && series.length > 1 && <TooltipRow label="Total" value={formatValue(totals[hover], fmt)} />}
          </ChartTooltip>
        )}
      </div>
    </div>
  )
}
