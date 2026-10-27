import { colorFor } from './colors'

export function Legend({ items }: { items: { key: string; color?: string }[] }) {
  if (items.length < 2) return null
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[12px] text-neutral-600">
      {items.map((it, i) => (
        <span key={it.key} className="inline-flex items-center gap-1.5">
          <span className="size-2.5 rounded-[3px]" style={{ background: it.color ?? colorFor(it.key, i) }} aria-hidden="true" />
          {it.key}
        </span>
      ))}
    </div>
  )
}
