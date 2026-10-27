import { useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ChevronLeft, ChevronRight, ChevronsUpDown, Search } from 'lucide-react'
import { cn } from '@/lib/cn'
import { formatValue, type Fmt } from '../engine/format'
import { StatusBadge } from './ui'

export interface TableColumn<R> {
  id: string
  label: string
  fmt?: Fmt
  get: (r: R) => unknown
  render?: (r: R) => ReactNode
  align?: 'left' | 'right'
  sortable?: boolean
  className?: string
}

interface Props<R> {
  columns: TableColumn<R>[]
  rows: R[]
  rowKey: (r: R, i: number) => string
  onRowClick?: (r: R) => void
  searchable?: boolean
  searchPlaceholder?: string
  pageSizes?: number[]
  initialSort?: { id: string; dir: 'asc' | 'desc' }
  footer?: ReactNode
  toolbar?: ReactNode
  empty?: ReactNode
  dense?: boolean
  totalsRow?: ReactNode
  highlight?: (r: R) => boolean
}

const numericFmts: Fmt[] = ['number', 'decimal', 'currency', 'percent', 'hours', 'minutes', 'days']

export function DataTable<R>({ columns, rows, rowKey, onRowClick, searchable = true, searchPlaceholder = 'Search records…', pageSizes = [25, 50, 100], initialSort, footer, toolbar, empty, dense, totalsRow, highlight }: Props<R>) {
  const [q, setQ] = useState('')
  const [sort, setSort] = useState<{ id: string; dir: 'asc' | 'desc' } | null>(initialSort ?? null)
  const [page, setPage] = useState(0)
  const [size, setSize] = useState(pageSizes[0])

  const filtered = useMemo(() => {
    if (!q.trim()) return rows
    const needle = q.trim().toLowerCase()
    return rows.filter((r) => columns.some((c) => String(c.get(r) ?? '').toLowerCase().includes(needle)))
  }, [rows, q, columns])

  const sorted = useMemo(() => {
    if (!sort) return filtered
    const col = columns.find((c) => c.id === sort.id)
    if (!col) return filtered
    const dir = sort.dir === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => {
      const va = col.get(a)
      const vb = col.get(b)
      if (typeof va === 'number' && typeof vb === 'number') return ((Number.isFinite(va) ? va : -Infinity) - (Number.isFinite(vb) ? vb : -Infinity)) * dir
      return String(va ?? '').localeCompare(String(vb ?? '')) * dir
    })
  }, [filtered, sort, columns])

  const pages = Math.max(1, Math.ceil(sorted.length / size))
  const p = Math.min(page, pages - 1)
  const slice = sorted.slice(p * size, p * size + size)

  const toggleSort = (id: string) => {
    setPage(0)
    setSort((s) => (s?.id === id ? (s.dir === 'desc' ? { id, dir: 'asc' } : null) : { id, dir: 'desc' }))
  }

  return (
    <div className="flex min-w-0 flex-col gap-3">
      {(searchable || toolbar) && (
        <div className="flex flex-wrap items-center gap-2.5">
          {searchable && (
            <label className="relative min-w-[220px] flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-neutral-400" aria-hidden="true" />
              <input
                value={q}
                onChange={(e) => {
                  setQ(e.target.value)
                  setPage(0)
                }}
                placeholder={searchPlaceholder}
                className="h-10 w-full rounded-lg border border-neutral-300 bg-white pl-9 pr-3 text-[13.5px] placeholder:text-neutral-400 focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30"
                aria-label="Search table"
              />
            </label>
          )}
          {toolbar}
        </div>
      )}
      <div className="hk-table-wrap overflow-x-auto rounded-lg border border-[#e3eeec]">
        <table className="w-full min-w-max border-collapse text-left">
          <thead>
            <tr className="bg-[#dcf1ed]">
              {columns.map((c) => {
                const numeric = c.align === 'right' || (c.fmt && numericFmts.includes(c.fmt))
                const active = sort?.id === c.id
                return (
                  <th key={c.id} scope="col" className={cn('whitespace-nowrap px-4 text-[12.5px] font-semibold text-neutral-800', dense ? 'py-2.5' : 'py-3', numeric && 'text-right')}>
                    {c.sortable === false ? (
                      c.label
                    ) : (
                      <button type="button" onClick={() => toggleSort(c.id)} className={cn('inline-flex items-center gap-1 hover:text-brand-800', numeric && 'flex-row-reverse')}>
                        {c.label}
                        {active ? sort!.dir === 'asc' ? <ArrowUp className="size-3.5 text-brand-700" /> : <ArrowDown className="size-3.5 text-brand-700" /> : <ChevronsUpDown className="size-3.5 text-neutral-400" />}
                      </button>
                    )}
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {slice.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-[13.5px] text-neutral-500">
                  {empty ?? 'No records match the current filters.'}
                </td>
              </tr>
            )}
            {slice.map((r, i) => (
              <tr
                key={rowKey(r, i)}
                onClick={onRowClick ? () => onRowClick(r) : undefined}
                className={cn('border-t border-[#edf3f2] transition-colors', onRowClick && 'cursor-pointer hover:bg-[#f3faf9]', highlight?.(r) && 'bg-warning-50/60')}
              >
                {columns.map((c) => {
                  const v = c.get(r)
                  const numeric = c.align === 'right' || (c.fmt && numericFmts.includes(c.fmt))
                  return (
                    <td key={c.id} className={cn('whitespace-nowrap px-4 text-[13px] text-neutral-800', dense ? 'py-2' : 'py-3', numeric && 'text-right tabular-nums', c.className)}>
                      {c.render ? c.render(r) : c.fmt === 'status' ? <StatusBadge value={String(v ?? '—')} /> : formatValue(v, c.fmt ?? 'text')}
                    </td>
                  )
                })}
              </tr>
            ))}
          </tbody>
          {totalsRow && <tfoot>{totalsRow}</tfoot>}
        </table>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3 text-[12.5px] text-neutral-600">
        <div className="flex items-center gap-3">
          <span>
            {sorted.length === 0 ? '0 records' : `Showing ${(p * size + 1).toLocaleString()}–${Math.min(sorted.length, (p + 1) * size).toLocaleString()} of ${sorted.length.toLocaleString()} records`}
            {q && rows.length !== sorted.length && <span className="text-neutral-400"> (filtered from {rows.length.toLocaleString()})</span>}
          </span>
          {footer}
        </div>
        {sorted.length > pageSizes[0] && (
          <div className="flex items-center gap-2">
            <label className="flex items-center gap-1.5">
              Rows
              <select value={size} onChange={(e) => (setSize(Number(e.target.value)), setPage(0))} className="h-8 rounded-md border border-neutral-300 bg-white px-2 text-[12.5px]">
                {pageSizes.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <button type="button" disabled={p === 0} onClick={() => setPage(p - 1)} className="rounded-md border border-neutral-300 p-1.5 hover:bg-neutral-50 disabled:opacity-40" aria-label="Previous page">
              <ChevronLeft className="size-4" />
            </button>
            <span className="tabular-nums">
              Page {p + 1} of {pages}
            </span>
            <button type="button" disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="rounded-md border border-neutral-300 p-1.5 hover:bg-neutral-50 disabled:opacity-40" aria-label="Next page">
              <ChevronRight className="size-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
