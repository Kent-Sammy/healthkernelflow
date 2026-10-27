import { Route, Routes, Navigate } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import './reports.css'
import { DbContext, useLoadDb } from './data/useDb'
import { ReportsLayout } from './components/ReportsLayout'
import { OverviewPage } from './pages/OverviewPage'
import { CataloguePage } from './pages/CataloguePage'
import { BuilderPage } from './pages/BuilderPage'
import { ReportViewPage } from './pages/ReportViewPage'
import { SavedPage } from './pages/SavedPage'
import { HistoryPage } from './pages/HistoryPage'
import { ScheduledPage } from './pages/ScheduledPage'
import { RegulatoryPage } from './pages/RegulatoryPage'
import { AuditPage } from './pages/AuditPage'

function Preparing() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-32 text-center">
      <Loader2 className="size-8 animate-spin text-brand-600" />
      <p className="text-[15px] font-semibold text-neutral-800">Preparing reporting workspace…</p>
      <p className="max-w-sm text-[13px] text-neutral-500">Building twelve months of fictional demonstration activity across four facilities. This happens once per session.</p>
    </div>
  )
}

export default function ReportsApp() {
  const db = useLoadDb()
  if (!db)
    return (
      <ReportsLayout>
        <Preparing />
      </ReportsLayout>
    )
  return (
    <DbContext.Provider value={db}>
      <Routes>
        <Route element={<ReportsLayout />}>
          <Route index element={<OverviewPage />} />
          <Route path="catalogue" element={<CataloguePage />} />
          <Route path="builder" element={<BuilderPage />} />
          <Route path="view" element={<ReportViewPage />} />
          <Route path="saved" element={<SavedPage />} />
          <Route path="history" element={<HistoryPage />} />
          <Route path="scheduled" element={<ScheduledPage />} />
          <Route path="regulatory" element={<RegulatoryPage />} />
          <Route path="audit" element={<AuditPage />} />
          <Route path="*" element={<Navigate to="/reports" replace />} />
        </Route>
      </Routes>
    </DbContext.Provider>
  )
}
