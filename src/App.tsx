import { Routes, Route } from 'react-router-dom'
import { Toaster } from '@/components/ui/Toast'
import { ComponentShowcase } from '@/pages/dev/ComponentShowcase'
import { PricingPage } from '@/pages/pricing/PricingPage'
import { GetStartedPlaceholder } from '@/pages/placeholders/GetStartedPlaceholder'
import { CustomPlaceholder } from '@/pages/placeholders/CustomPlaceholder'
import { HelpMeChoosePlaceholder } from '@/pages/placeholders/HelpMeChoosePlaceholder'
import { PreviewCheck } from '@/pages/PreviewCheck'

/**
 * ROOT ROUTE IS TEMPORARILY A PLAIN PREVIEW CHECK.
 * ------------------------------------------------------------------------
 * While we're confirming the dev server / live preview pipeline itself
 * works, "/" renders a minimal, dependency-free page instead of
 * redirecting into the product. All Phase 1/2 work is untouched and still
 * reachable at its own routes below — once the preview is confirmed
 * working, swap the "/" element back to `<Navigate to="/pricing" replace />`
 * to resume normal behavior.
 */
export default function App() {
  return (
    <>
      <Routes>
        <Route path="/" element={<PreviewCheck />} />
        <Route path="/pricing" element={<PricingPage />} />
        <Route path="/get-started" element={<GetStartedPlaceholder />} />
        <Route path="/custom" element={<CustomPlaceholder />} />
        <Route path="/help-me-choose" element={<HelpMeChoosePlaceholder />} />
        <Route path="/dev/components" element={<ComponentShowcase />} />
      </Routes>
      <Toaster />
    </>
  )
}
