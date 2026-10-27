import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Toaster } from '@/components/ui/Toast'
import ReportsApp from '@/features/reports/ReportsApp'
import './index.css'

/**
 * Standalone demo entry: the Reports & Analytics prototype only, using hash
 * routing so the built file opens straight from disk (no server needed).
 */
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <HashRouter>
      <Routes>
        <Route path="/reports/*" element={<ReportsApp />} />
        <Route path="*" element={<Navigate to="/reports" replace />} />
      </Routes>
      <Toaster />
    </HashRouter>
  </StrictMode>,
)
