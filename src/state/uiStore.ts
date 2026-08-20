import { create } from 'zustand'
import { generateId } from '@/lib/id'

/**
 * Transient, NOT persisted — toasts and modal state shouldn't survive a
 * page refresh. Deliberately a separate store from the domain data in
 * `store.ts` so persistence middleware never has to know about UI-only
 * state.
 */
export type ToastVariant = 'default' | 'success' | 'warning' | 'danger' | 'info'

export interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
  durationMs: number
}

interface UiState {
  toasts: ToastItem[]
  showToast: (toast: Omit<ToastItem, 'id' | 'durationMs'> & { durationMs?: number }) => string
  dismissToast: (id: string) => void
}

export const useUiStore = create<UiState>()((set) => ({
  toasts: [],

  showToast: ({ durationMs = 5000, ...toast }) => {
    const id = generateId('toast')
    set((state) => ({ toasts: [...state.toasts, { ...toast, id, durationMs }] }))
    return id
  },

  dismissToast: (id) => set((state) => ({ toasts: state.toasts.filter((t) => t.id !== id) })),
}))
