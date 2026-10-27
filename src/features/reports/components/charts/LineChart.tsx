import { useState } from 'react'
import { formatValue, type Fmt } from '../../engine/format'
import { colorFor, niceMax } from './colors'
import { Legend } from './Legend'
import { ChartTooltip, TooltipRow } from './Tooltip'
import { useWidth } from './useWidth'

export interface Series {
  id: string
  label: string
  values: number[]
  color?: string
}

interface Props {
  labels: string[]
  series: Series[]
  fmt: Fmt
  height?: number
  area?: boolean
  onPointClick?: (index: number) => void
}

const PAD = { l: 56, r: 12, t: 12, b: 28 }

export function LineChart({ labels, series, fmt, height = 240, area, onPointClick }: Props) {
  const [ref, width] = useWidth<HTMLDivElement>()
  const [hover, setHover] = useState<number | null>(null)
  const n = labels.length
  const isPct = fmt === 'percent'
  const rawMax = Math.max(0, ...series.flatMap((s) => s.values))
  const max = isPct ? Math.min(1, niceMax(rawMax * 1.05)) : niceMax(rawMax * 1.05)
  const w = Math.max(200, width)
  const iw = w - PAD.l - PAD.r
  const ih = height - PAD.t - PAD.b
  const x = (i: number) => PAD.l + (n <= 1 ? iw / 2 : (i * iw) / (n - 1))
  const y = (v: number) => PAD.t + ih - (v / max) * ih
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((t) => t * max)
  const every = Math.max(1, Math.ceil(n / Math.max(2, Math.floor(iw / 64))))
  const colors = series.map((s, i) => s.color ?? colorFor(s.label, i))

  return (
    <div className="flex flex-col gap-2">
      <Legend items={series.map((s, i) => ({ key: s.label, color: colors[i] }))} />
      <div ref={ref} className="relative w-full" onMouseLeave={() => setHover(null)}>
        <svg width={w} height={height} role="img" aria-label={`Line chart: ${series.map((s) => s.label).join(', ')}`}>
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.l} x2={w - PAD.r} y1={y(t)} y2={y(t)} stroke="#e8eef0" strokeDasharray={t === 0 ? undefined : '3 4'} />
              <text x={PAD.l - 8} y={y(t) + 4} textAnchor="end" className="fill-neutral-400 text-[11px]">
                {formatValue(t, fmt, true)}
              </text>
            </g>
          ))}
          {labels.map((l, i) =>
            (i % every === 0 && n - 1 - i >= every) || i === n - 1 ? (
              <text key={i} x={x(i)} y={height - 8} textAnchor={i === 0 ? 'start' : i === n - 1 ? 'end' : 'middle'} className="fill-neutral-400 text-[11px]">
                {i === n - 1 || i % every === 0 ? l : ''}
              </text>
            ) : null,
          )}
          {series.map((s, si) => {
            const d = s.values.map((v, i) => `${i ? 'L' : 'M'}${x(i)},${y(v)}`).join(' ')
            return (
              <g key={s.id}>
                {area && series.length === 1 && <path d={`${d} L${x(n - 1)},${y(0)} L${x(0)},${y(0)} Z`} fill={colors[si]} opacity={0.1} />}
                <path d={d} fill="none" stroke={colors[si]} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
                {n <= 16 && s.values.map((v, i) => <circle key={i} cx={x(i)} cy={y(v)} r={3} fill="#fff" stroke={colors[si]} strokeWidth={2} />)}
              </g>
            )
          })}
          {hover !== null && (
            <g>
              <line x1={x(hover)} x2={x(hover)} y1={PAD.t} y2={PAD.t + ih} stroke="#94a3b8" strokeDasharray="3 3" />
              {series.map((s, si) => (
                <circle key={s.id} cx={x(hover)} cy={y(s.values[hover])} r={4.5} fill={colors[si]} stroke="#fff" strokeWidth={2} />
              ))}
            </g>
          )}
          <rect
            x={PAD.l}
            y={PAD.t}
            width={iw}
            height={ih}
            fill="transparent"
            style={{ cursor: onPointClick ? 'pointer' : 'default' }}
            onMouseMove={(e) => {
              const rect = (e.currentTarget as SVGRectElement).getBoundingClientRect()
              const rel = (e.clientX - rect.left) / rect.width
              setHover(Math.max(0, Math.min(n - 1, Math.round(rel * (n - 1)))))
            }}
            onClick={() => hover !== null && onPointClick?.(hover)}
          />
        </svg>
        {hover !== null && (
          <ChartTooltip x={x(hover)} y={PAD.t} width={w}>
            <div className="mb-1 font-semibold text-neutral-900">{labels[hover]}</div>
            {series.map((s, si) => (
              <TooltipRow key={s.id} color={colors[si]} label={s.label} value={formatValue(s.values[hover], fmt)} />
            ))}
          </ChartTooltip>
        )}
      </div>
    </div>
  )
}
