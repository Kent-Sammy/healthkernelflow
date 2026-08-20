/**
 * Temporary root-route content used only to confirm the dev server /
 * live preview pipeline itself works, independent of the real app. Once
 * the preview is confirmed working, "/" goes back to redirecting into
 * the actual product (currently /pricing) — see App.tsx.
 */
export function PreviewCheck() {
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ textAlign: 'center' }}>
        <h1>HealthKernel</h1>
        <p>Frontend preview is working.</p>
      </div>
    </div>
  )
}
