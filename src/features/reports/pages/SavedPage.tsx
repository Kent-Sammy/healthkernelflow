import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bookmark, Pencil, Play, SlidersHorizontal, Trash2 } from 'lucide-react'
import { Modal } from '@/components/ui/Dialog'
import { useUiStore } from '@/state/uiStore'
import { MODULE_BY_ID, REPORT_BY_ID } from '../engine/catalogue'
import { SOURCES } from '../engine/sources'
import { configPeriod, periodApplies } from '../engine/run'
import { configToSearch } from '../engine/url'
import { PERIOD_OPTIONS } from '../engine/period'
import { fmtDateTime } from '../engine/format'
import { useReportsStore, type SavedReport } from '../state/reportsStore'
import { DemoNotice, HkButton, ModuleIcon, PageHeader, Panel, TypeBadge } from '../components/ui'

export function SavedPage() {
  const saved = useReportsStore((s) => s.saved)
  const rename = useReportsStore((s) => s.renameSaved)
  const remove = useReportsStore((s) => s.deleteSaved)
  const touch = useReportsStore((s) => s.touchSaved)
  const toast = useUiStore((s) => s.showToast)
  const navigate = useNavigate()
  const [renaming, setRenaming] = useState<SavedReport | null>(null)
  const [name, setName] = useState('')
  const [deleting, setDeleting] = useState<SavedReport | null>(null)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Saved Reports"
        subtitle="Report configurations you have saved. Opening one regenerates it with the latest data. Saved in this browser."
        eyebrow={<DemoNotice />}
        actions={
          <Link to="/reports/catalogue">
            <HkButton variant="primary">
              <Bookmark /> Save a new report
            </HkButton>
          </Link>
        }
      />
      {saved.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-neutral-300 bg-white px-6 py-16 text-center">
          <Bookmark className="size-6 text-neutral-400" />
          <p className="font-semibold">No saved reports yet</p>
          <p className="max-w-md text-[13px] text-neutral-500">Generate any report, then choose “Save” to keep its period and filters for one-click access.</p>
          <Link to="/reports/catalogue">
            <HkButton>Browse reports</HkButton>
          </Link>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
          {saved.map((s) => {
            const def = REPORT_BY_ID[s.config.reportId]
            if (!def) return null
            const src = SOURCES[def.source]
            const filters = Object.entries(s.config.filters).filter(([, v]) => v && v !== 'all')
            const open = () => {
              touch(s.id)
              navigate(`/reports/view${configToSearch(s.config)}`)
            }
            return (
              <Panel key={s.id} bodyClassName="p-0">
                <div className="flex items-start gap-3 p-4">
                  <ModuleIcon module={def.module} />
                  <div className="min-w-0 flex-1">
                    <button type="button" onClick={open} className="text-left text-[15px] font-semibold text-neutral-900 hover:text-brand-700">
                      {s.name}
                    </button>
                    <p className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[12.5px] text-neutral-500">
                      {def.name} <TypeBadge type={def.type} />
                    </p>
                  </div>
                </div>
                <dl className="grid grid-cols-2 gap-x-4 gap-y-2 border-t border-[#edf3f2] px-4 py-3 text-[12.5px]">
                  <dt className="text-neutral-500">Module</dt>
                  <dd className="truncate font-medium">{MODULE_BY_ID[def.module].label}</dd>
                  <dt className="text-neutral-500">Period</dt>
                  <dd className="font-medium">{periodApplies(def, src) ? (s.config.period === 'custom' ? `${configPeriod(s.config).from} → ${configPeriod(s.config).to}` : PERIOD_OPTIONS.find((p) => p.value === s.config.period)?.label) : 'Snapshot'}</dd>
                  <dt className="text-neutral-500">Filters</dt>
                  <dd className="truncate font-medium" title={filters.map(([k, v]) => `${k}: ${v}`).join(', ')}>
                    {filters.length ? filters.map(([, v]) => v).join(', ') : 'None'}
                  </dd>
                  <dt className="text-neutral-500">Last opened</dt>
                  <dd className="font-medium">{fmtDateTime(s.lastOpened)}</dd>
                </dl>
                <div className="flex flex-wrap items-center gap-1.5 border-t border-[#edf3f2] px-3 py-2.5">
                  <HkButton size="sm" variant="outline" onClick={open}>
                    <Play /> Open
                  </HkButton>
                  <HkButton size="sm" variant="ghost" onClick={() => navigate(`/reports/builder${configToSearch(s.config)}`)}>
                    <SlidersHorizontal /> Edit
                  </HkButton>
                  <HkButton size="sm" variant="ghost" onClick={() => (setRenaming(s), setName(s.name))}>
                    <Pencil /> Rename
                  </HkButton>
                  <HkButton size="sm" variant="ghost" className="ml-auto text-danger-700 hover:bg-danger-50" onClick={() => setDeleting(s)}>
                    <Trash2 /> Remove
                  </HkButton>
                </div>
              </Panel>
            )
          })}
        </div>
      )}

      <Modal
        open={!!renaming}
        onOpenChange={(o) => !o && setRenaming(null)}
        title="Rename saved report"
        footer={
          <>
            <HkButton variant="ghost" onClick={() => setRenaming(null)}>
              Cancel
            </HkButton>
            <HkButton
              variant="primary"
              disabled={!name.trim()}
              onClick={() => {
                rename(renaming!.id, name.trim())
                setRenaming(null)
                toast({ title: 'Report renamed', variant: 'success' })
              }}
            >
              Save name
            </HkButton>
          </>
        }
      >
        <input autoFocus value={name} onChange={(e) => setName(e.target.value)} maxLength={80} className="h-10 w-full rounded-lg border border-neutral-300 px-3 text-[13.5px] focus:border-brand-600 focus:outline-none focus:ring-2 focus:ring-brand-600/30" aria-label="Name" />
      </Modal>
      <Modal
        open={!!deleting}
        onOpenChange={(o) => !o && setDeleting(null)}
        title="Remove saved report?"
        description={deleting ? `“${deleting.name}” will be removed from Saved Reports. Report history is not affected.` : ''}
        footer={
          <>
            <HkButton variant="ghost" onClick={() => setDeleting(null)}>
              Cancel
            </HkButton>
            <HkButton
              variant="danger"
              onClick={() => {
                remove(deleting!.id)
                setDeleting(null)
                toast({ title: 'Saved report removed', variant: 'default' })
              }}
            >
              Remove
            </HkButton>
          </>
        }
      />
    </div>
  )
}
