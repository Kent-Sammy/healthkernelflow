import * as ToastPrimitive from '@radix-ui/react-toast'
import { CheckCircle2, Info, TriangleAlert, XCircle, X } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useUiStore, type ToastVariant } from '@/state/uiStore'

const VARIANT_STYLES: Record<ToastVariant, string> = {
  default: 'border-neutral-200 bg-neutral-0',
  success: 'border-success-200 bg-success-50',
  warning: 'border-warning-200 bg-warning-50',
  danger: 'border-danger-200 bg-danger-50',
  info: 'border-info-200 bg-info-50',
}

const VARIANT_ICONS: Record<ToastVariant, typeof Info> = {
  default: Info,
  success: CheckCircle2,
  warning: TriangleAlert,
  danger: XCircle,
  info: Info,
}

const VARIANT_ICON_COLORS: Record<ToastVariant, string> = {
  default: 'text-neutral-500',
  success: 'text-success-600',
  warning: 'text-warning-600',
  danger: 'text-danger-600',
  info: 'text-info-600',
}

/**
 * Mounts once near the app root. Renders every toast currently in
 * `uiStore` — call `useUiStore.getState().showToast(...)` (or the
 * `useUiStore` hook) from anywhere to push a notification.
 */
export function Toaster() {
  const toasts = useUiStore((s) => s.toasts)
  const dismissToast = useUiStore((s) => s.dismissToast)

  return (
    <ToastPrimitive.Provider swipeDirection="right">
      {toasts.map((toast) => {
        const Icon = VARIANT_ICONS[toast.variant]
        return (
          <ToastPrimitive.Root
            key={toast.id}
            duration={toast.durationMs}
            onOpenChange={(open) => {
              if (!open) dismissToast(toast.id)
            }}
            className={cn(
              'flex items-start gap-3 rounded-lg border p-4 shadow-lg',
              'data-[state=open]:animate-in data-[state=open]:slide-in-from-bottom-2',
              'data-[state=closed]:animate-out data-[state=closed]:fade-out',
              VARIANT_STYLES[toast.variant],
            )}
          >
            <Icon className={cn('mt-0.5 size-5 shrink-0', VARIANT_ICON_COLORS[toast.variant])} aria-hidden="true" />
            <div className="flex flex-1 flex-col gap-0.5">
              <ToastPrimitive.Title className="text-body-sm font-semibold text-neutral-900">{toast.title}</ToastPrimitive.Title>
              {toast.description && (
                <ToastPrimitive.Description className="text-caption text-neutral-600">{toast.description}</ToastPrimitive.Description>
              )}
            </div>
            <ToastPrimitive.Close
              className="rounded-md p-1 text-neutral-400 hover:bg-neutral-950/5 hover:text-neutral-600"
              aria-label="Dismiss"
            >
              <X className="size-4" aria-hidden="true" />
            </ToastPrimitive.Close>
          </ToastPrimitive.Root>
        )
      })}
      <ToastPrimitive.Viewport className="fixed bottom-0 right-0 z-[100] flex w-full max-w-sm flex-col gap-2 p-4 outline-none" />
    </ToastPrimitive.Provider>
  )
}
