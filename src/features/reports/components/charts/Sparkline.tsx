export function Sparkline({ values, color = '#0f9488', width = 96, height = 28 }: { values: number[]; color?: string; width?: number; height?: number }) {
  if (values.length < 2) return null
  const max = Math.max(...values)
  const min = Math.min(...values)
  const span = max - min || 1
  const pts = values.map((v, i) => `${(i / (values.length - 1)) * width},${height - 2 - ((v - min) / span) * (height - 4)}`).join(' ')
  return (
    <svg width={width} height={height} aria-hidden="true" className="overflow-visible">
      <polyline points={`0,${height} ${pts} ${width},${height}`} fill={color} opacity={0.08} stroke="none" />
      <polyline points={pts} fill="none" stroke={color} strokeWidth={1.75} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  )
}
