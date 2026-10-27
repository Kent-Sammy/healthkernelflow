export function HkMark({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 40 40" className={className} aria-hidden="true">
      <rect x="5" y="5" width="6" height="30" rx="3" fill="#fff" />
      <rect x="17" y="5" width="6" height="30" rx="3" fill="#fff" />
      <rect x="8" y="17" width="12" height="6" rx="3" fill="#fff" />
      <path d="M23 20 L34 8" stroke="#f0543c" strokeWidth="4.5" strokeLinecap="round" />
      <path d="M23 20 L34 32" stroke="#f0543c" strokeWidth="4.5" strokeLinecap="round" />
      <circle cx="34" cy="8" r="3.4" fill="#fff" stroke="#f0543c" strokeWidth="2" />
      <circle cx="34" cy="32" r="3.4" fill="#fff" stroke="#f0543c" strokeWidth="2" />
    </svg>
  )
}
