/**
 * Thin, typed wrapper around localStorage.
 *
 * This is the ONLY module in the app that should call `window.localStorage`
 * directly. Everything else (Zustand `persist` middleware, services) goes
 * through here, so swapping the persistence backend later (e.g. IndexedDB,
 * or a real API) touches one file, not every call site.
 */

const NAMESPACE = 'healthkernel'

function namespacedKey(key: string): string {
  return `${NAMESPACE}:${key}`
}

export const storage = {
  get<T>(key: string): T | null {
    try {
      const raw = window.localStorage.getItem(namespacedKey(key))
      if (raw === null) return null
      return JSON.parse(raw) as T
    } catch {
      return null
    }
  },

  set<T>(key: string, value: T): void {
    try {
      window.localStorage.setItem(namespacedKey(key), JSON.stringify(value))
    } catch {
      // Storage can fail (private browsing, quota). The app should degrade
      // to in-memory-only state rather than crash.
    }
  },

  remove(key: string): void {
    try {
      window.localStorage.removeItem(namespacedKey(key))
    } catch {
      // no-op
    }
  },

  /**
   * A `StateStorage`-shaped adapter (getItem/setItem/removeItem, string
   * in/out) for Zustand's `persist` middleware, routed through the same
   * namespaced localStorage so `clearAll()` also wipes the app store.
   */
  zustandAdapter: {
    getItem: (name: string): string | null => {
      try {
        return window.localStorage.getItem(namespacedKey(name))
      } catch {
        return null
      }
    },
    setItem: (name: string, value: string): void => {
      try {
        window.localStorage.setItem(namespacedKey(name), value)
      } catch {
        // no-op — degrade to in-memory only
      }
    },
    removeItem: (name: string): void => {
      try {
        window.localStorage.removeItem(namespacedKey(name))
      } catch {
        // no-op
      }
    },
  },

  /** Clears every HealthKernel-namespaced key. Used by the dev reset tool. */
  clearAll(): void {
    try {
      const toRemove: string[] = []
      for (let i = 0; i < window.localStorage.length; i++) {
        const k = window.localStorage.key(i)
        if (k && k.startsWith(`${NAMESPACE}:`)) toRemove.push(k)
      }
      toRemove.forEach((k) => window.localStorage.removeItem(k))
    } catch {
      // no-op
    }
  },
}
