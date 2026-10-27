import { formatValue, type Fmt } from '../../engine/format'
import { cn } from '@/lib/cn'

interface Props {
  items: { key: string; value: number }[]
  fmt: Fmt
  onClick?: (key: string) => void
  color?: string
  highlight?: (key: string, value: number) => 'good' | 'bad' | undefined
}

/** Ranked horizontal bars — plain HTML so long labels wrap and it stays light. */
export function HBarList({ items, fmt, onClick, color = '#0f9488', highlight }: Props) {
  const max = Math.max(0, ...items.map((i) => i.value))
  return (
    <ul className="flex flex-col gap-2">
      {items.map((it) => {
        const pct = max > 0 ? Math.max(1.5, (it.value / max) * 100) : 0
        const h = highlight?.(it.key, it.value)
        return (
          <li key={it.key}>
            <button
              type="button"
              disabled={!onClick || it.key.startsWith('Other')}
              onClick={() => onClick?.(it.key)}
              className="group grid w-full grid-cols-[minmax(0,1fr)_auto] items-center gap-x-3 gap-y-1 rounded-md text-left disabled:cursor-default"
            >
              <span className="truncate text-[12.5px] text-neutral-700 group-enabled:group-hover:text-brand-700" title={it.key}>
                {it.key}
              </span>
              <span className={cn('text-[12.5px] font-semibold tabular-nums', h === 'good' ? 'text-success-700' : h === 'bad' ? 'text-danger-700' : 'text-neutral-900')}>{formatValue(it.value, fmt, true)}</span>
              <span className="col-span-2 h-2 rounded-full bg-neutral-100">
                <span className="block h-2 rounded-full transition-[width]" style={{ width: `${pct}%`, background: it.key.startsWith('Other') ? '#94a3b8' : color }} />
              </span>
            </button>
          </li>
        )
      })}
    </ul>
  )
}
