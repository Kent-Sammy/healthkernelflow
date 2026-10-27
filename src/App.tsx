import { lazy, Suspense } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { Toaster } from '@/components/ui/Toast'
import { ComponentShowcase } from '@/pages/dev/ComponentShowcase'
import { PricingPage } from '@/pages/pricing/PricingPage'
import { GetStartedPlaceholder } from '@/pages/placeholders/GetStartedPlaceholder'
import { CustomPlaceholder } from '@/pages/placeholders/CustomPlaceholder'
import { HelpMeChoosePlaceholder } from '@/pages/placeholders/HelpMeChoosePlaceholder'

// Reports & Analytics prototype — lazy-loaded so the pricing bundle stays small.
const ReportsApp = lazy(() => import('@/features/reports/ReportsApp'))

/**
 * PHASE 2 (Pricing): the commercial surface starts at `/pricing`.
 * `/get-started`, `/custom` and `/help-me-choose` are placeholder
 * landing points for Phase 2's CTAs — the real signup/onboarding, Custom
 * configurator, and Help Me Choose quiz are built in their own phases and
 * will replace these routes' elements without changing the paths.
 */
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Navigate to="/pricing" replace />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/get-started" element={<GetStartedPlaceholder />} />
        <Route path="/custom" element={<CustomPlaceholder />} />
        <Route path="/help-me-choose" element={<HelpMeChoosePlaceholder />} />
        <Route path="/dev/components" element={<ComponentShowcase />} />
        <Route
          path="/reports/*"
          element={
            <Suspense fallback={<div className="flex h-dvh items-center justify-center text-sm text-neutral-500">Loading Reports &amp; Analytics…</div>}>
              <ReportsApp />
            </Suspense>
          }
        />
      </Routes>
      <Toaster />
    </>
  )
}
