import { useEffect, useState, type ReactNode } from 'react'
import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom'
import {
  Bell, Bookmark, CalendarClock, ChartPie, ClipboardList, Contact, EllipsisVertical, Landmark, LayoutDashboard, LayoutGrid, LibraryBig, Menu, PackageSearch, PanelLeftClose, PanelLeftOpen,
  RotateCcwClock, ScanSearch, ScrollText, ShoppingBasket, SlidersHorizontal, Truck, Users, X, type LucideIcon,
} from 'lucide-react'
import { cn } from '@/lib/cn'
import { HkMark } from './Logo'
import { CURRENT_USER, useReportsStore } from '../state/reportsStore'
import { ORG_NAME } from '../data/reference'
import { fmtDateTime } from '../engine/format'

interface NavItem {
  label: string
  icon: LucideIcon
  to?: string
  end?: boolean
}

const REPORT_NAV: NavItem[] = [
  { label: 'Overview', icon: ChartPie, to: '/reports', end: true },
  { label: 'All Reports', icon: LibraryBig, to: '/reports/catalogue' },
  { label: 'Report Builder', icon: SlidersHorizontal, to: '/reports/builder' },
  { label: 'Saved Reports', icon: Bookmark, to: '/reports/saved' },
  { label: 'Report History', icon: RotateCcwClock, to: '/reports/history' },
  { label: 'Scheduled Reports', icon: CalendarClock, to: '/reports/scheduled' },
  { label: 'Regulatory & Compliance', icon: Landmark, to: '/reports/regulatory' },
  { label: 'Audit Trail', icon: ScrollText, to: '/reports/audit' },
]

const STATIC_SECTIONS: { title: string; items: NavItem[] }[] = [
  { title: 'Point of care', items: [{ label: 'Patients', icon: Users }, { label: 'Consultations', icon: ShoppingBasket }, { label: 'Queue Displays', icon: ScanSearch }, { label: 'Chat', icon: Contact }] },
  { title: 'Inventory & procurement', items: [{ label: 'Products', icon: PackageSearch }, { label: 'Services', icon: ShoppingBasket }, { label: 'Inventory', icon: ClipboardList }, { label: 'Suppliers', icon: Truck }] },
]

const DISABLED_TIP = 'Outside the reporting prototype — only Reports & Analytics is interactive'

function SideItem({ item, collapsed, onNavigate }: { item: NavItem; collapsed: boolean; onNavigate?: () => void }) {
  const Icon = item.icon
  const inner = (
    <>
      <Icon className="size-[19px] shrink-0" strokeWidth={1.8} aria-hidden="true" />
      {!collapsed && <span className="truncate">{item.label}</span>}
    </>
  )
  const base = cn('flex h-10 items-center gap-3 rounded-lg text-[14.5px] font-semibold transition', collapsed ? 'justify-center px-0' : 'px-3')
  if (!item.to)
    return (
      <span className={cn(base, 'cursor-not-allowed text-white/55')} title={DISABLED_TIP} aria-disabled="true">
        {inner}
      </span>
    )
  return (
    <NavLink to={item.to} end={item.end} onClick={onNavigate} title={collapsed ? item.label : undefined} className={({ isActive }) => cn(base, isActive ? 'bg-white/[0.16] text-white shadow-[inset_3px_0_0_#fff]' : 'text-white/90 hover:bg-white/10 hover:text-white')}>
      {inner}
    </NavLink>
  )
}

function Sidebar({ collapsed, onToggle, onNavigate, mobile }: { collapsed: boolean; onToggle: () => void; onNavigate?: () => void; mobile?: boolean }) {
  return (
    <aside className={cn('hk-sidebar flex h-full flex-col text-white', collapsed ? 'w-[76px]' : 'w-[272px]')}>
      <div className={cn('flex h-[88px] shrink-0 items-center gap-2', collapsed ? 'justify-center px-2' : 'justify-between px-5')}>
        <div className="flex items-center gap-1.5">
          <HkMark className="size-9" />
          {!collapsed && <span className="text-[24px] font-medium tracking-tight">HealthKernel</span>}
        </div>
        {!collapsed && (
          <button type="button" onClick={onToggle} className="rounded-md border border-white/30 p-1 text-white/90 hover:bg-white/10" aria-label={mobile ? 'Close menu' : 'Collapse sidebar'}>
            {mobile ? <X className="size-4" /> : <PanelLeftClose className="size-4" />}
          </button>
        )}
      </div>
      {collapsed && (
        <button type="button" onClick={onToggle} className="mx-auto mb-2 rounded-md border border-white/30 p-1 text-white/90 hover:bg-white/10" aria-label="Expand sidebar">
          <PanelLeftOpen className="size-4" />
        </button>
      )}
      <nav className="hk-scroll flex-1 overflow-y-auto px-3 pb-4" aria-label="Main">
        <SideItem item={{ label: 'Dashboard', icon: LayoutDashboard }} collapsed={collapsed} />
        <div className="my-3 border-t border-white/15" />
        {!collapsed && <p className="px-3 pb-2 pt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-white/75">Reports & analytics</p>}
        <div className="flex flex-col gap-0.5">
          {REPORT_NAV.map((it) => (
            <SideItem key={it.label} item={it} collapsed={collapsed} onNavigate={onNavigate} />
          ))}
        </div>
        {STATIC_SECTIONS.map((s) => (
          <div key={s.title}>
            <div className="my-3 border-t border-white/15" />
            {!collapsed && <p className="px-3 pb-2 pt-1 text-[12px] font-bold uppercase tracking-[0.12em] text-white/60">{s.title}</p>}
            <div className="flex flex-col gap-0.5">
              {s.items.map((it) => (
                <SideItem key={it.label} item={it} collapsed={collapsed} />
              ))}
            </div>
          </div>
        ))}
      </nav>
      <div className={cn('flex shrink-0 items-center gap-3 border-t border-white/15 py-3.5', collapsed ? 'justify-center px-2' : 'px-4')}>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-neutral-900/60 text-[13px] font-semibold text-white ring-1 ring-white/20">{CURRENT_USER.initials}</span>
        {!collapsed && (
          <>
            <div className="min-w-0 flex-1">
              <p className="truncate text-[14.5px] font-semibold">{CURRENT_USER.name}</p>
              <p className="truncate text-[12.5px] text-white/70">{CURRENT_USER.role}</p>
            </div>
            <span className="cursor-not-allowed text-white/60" title={DISABLED_TIP}>
              <EllipsisVertical className="size-4" />
            </span>
          </>
        )}
      </div>
    </aside>
  )
}

function Notifications() {
  const [open, setOpen] = useState(false)
  const navigate = useNavigate()
  const schedules = useReportsStore((s) => s.schedules)
  const returns = useReportsStore((s) => s.returns)
  const failed = schedules.filter((s) => s.lastStatus === 'Failed')
  const due = returns.filter((r) => r.submission === 'Not submitted' && r.dueDate <= '2026-10-31')
  const items: { title: string; body: string; to: string; tone: string }[] = [
    ...failed.map((s) => ({ title: 'Scheduled report failed', body: `${s.name} · last run ${fmtDateTime(s.lastRun)}`, to: '/reports/scheduled', tone: 'bg-danger-600' })),
    ...due.map((r) => ({ title: 'Regulatory return due', body: `${r.periodLabel} · due ${fmtDateTime(r.dueDate)}`, to: `/reports/regulatory?open=${r.id}`, tone: 'bg-warning-600' })),
    { title: 'Daily cash-up delivered', body: 'Sent to 2 recipients at 07:00 (simulated)', to: '/reports/scheduled', tone: 'bg-success-600' },
  ]
  return (
    <div className="relative">
      <button type="button" onClick={() => setOpen((o) => !o)} className="relative flex size-11 items-center justify-center rounded-xl bg-white text-brand-600 shadow-[0_2px_10px_rgba(15,148,136,0.18)] hover:text-brand-700" aria-label="Report notifications" aria-expanded={open}>
        <Bell className="size-5" fill="currentColor" />
        <span className="absolute right-2 top-2 flex size-4 items-center justify-center rounded-full bg-[#f0543c] text-[10px] font-bold text-white">{items.length}</span>
      </button>
      {open && (
        <>
          <button type="button" className="fixed inset-0 z-40 cursor-default" aria-label="Close notifications" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-13 z-50 w-[340px] rounded-xl border border-neutral-200 bg-white p-2 shadow-xl">
            <p className="px-3 pb-1 pt-2 text-[12px] font-semibold uppercase tracking-wide text-neutral-500">Reporting notifications</p>
            {items.map((n, i) => (
              <button
                key={i}
                type="button"
                onClick={() => {
                  setOpen(false)
                  navigate(n.to)
                }}
                className="flex w-full items-start gap-3 rounded-lg px-3 py-2.5 text-left hover:bg-[#f3faf9]"
              >
                <span className={cn('mt-1.5 size-2 shrink-0 rounded-full', n.tone)} />
                <span className="min-w-0">
                  <span className="block text-[13px] font-semibold text-neutral-900">{n.title}</span>
                  <span className="block truncate text-[12px] text-neutral-500">{n.body}</span>
                </span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

const TITLES: [RegExp, string][] = [
  [/^\/reports\/catalogue/, 'All Reports'],
  [/^\/reports\/builder/, 'Report Builder'],
  [/^\/reports\/view/, 'Generated Report'],
  [/^\/reports\/saved/, 'Saved Reports'],
  [/^\/reports\/history/, 'Report History'],
  [/^\/reports\/scheduled/, 'Scheduled Reports'],
  [/^\/reports\/regulatory/, 'Regulatory & Compliance'],
  [/^\/reports\/audit/, 'Audit Trail'],
  [/^\/reports/, 'Overview'],
]

export function ReportsLayout({ children }: { children?: ReactNode }) {
  const collapsed = useReportsStore((s) => s.sidebarCollapsed)
  const toggle = useReportsStore((s) => s.toggleSidebar)
  const [mobileOpen, setMobileOpen] = useState(false)
  const { pathname } = useLocation()
  const title = TITLES.find(([re]) => re.test(pathname))?.[1] ?? 'Reports'

  useEffect(() => {
    document.title = `${title} · Reports & Analytics · HealthKernel`
  }, [title])

  return (
    <div className="hk-reports flex h-dvh overflow-hidden bg-[#f4faf9]">
      <div className="hidden shrink-0 lg:block print:hidden">
        <Sidebar collapsed={collapsed} onToggle={toggle} />
      </div>
      {mobileOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <Sidebar collapsed={false} onToggle={() => setMobileOpen(false)} onNavigate={() => setMobileOpen(false)} mobile />
          <button type="button" aria-label="Close menu" className="flex-1 bg-neutral-950/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[76px] shrink-0 items-center justify-between gap-4 border-b border-[#e6efee] bg-white px-4 sm:px-8 print:hidden">
          <div className="flex min-w-0 items-center gap-3">
            <button type="button" onClick={() => setMobileOpen(true)} className="rounded-md p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden" aria-label="Open menu">
              <Menu className="size-5" />
            </button>
            <div className="min-w-0">
              <p className="truncate text-[12px] font-medium uppercase tracking-wide text-neutral-400">Reports & Analytics</p>
              <p className="truncate text-[16px] font-semibold text-neutral-900">{title}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <span className="hidden items-center gap-2 rounded-lg border border-[#e3eeec] bg-[#f6fbfa] px-3 py-2 text-[12.5px] font-medium text-neutral-600 md:inline-flex">
              <span className="size-2 rounded-full bg-success-600" />
              {ORG_NAME} · 4 facilities
            </span>
            <span className="flex size-11 cursor-not-allowed items-center justify-center rounded-xl bg-white text-brand-600 shadow-[0_2px_10px_rgba(15,148,136,0.18)]" title={DISABLED_TIP}>
              <LayoutGrid className="size-5" fill="currentColor" />
            </span>
            <Notifications />
          </div>
        </header>
        <main id="hk-main" className="hk-scroll min-w-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1440px] px-4 py-6 sm:px-8 sm:py-8">{children ?? <Outlet />}</div>
        </main>
      </div>
    </div>
  )
}
