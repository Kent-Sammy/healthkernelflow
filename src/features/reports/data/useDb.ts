import { createContext, useContext, useEffect, useState } from 'react'
import type { Db } from './types'
import { getDb } from './generate'

let promise: Promise<Db> | null = null
let ready: Db | null = null

function load(): Promise<Db> {
  if (!promise)
    promise = new Promise((resolve) => {
      // Let the loading screen paint before the one-off simulation runs.
      setTimeout(() => {
        ready = getDb()
        resolve(ready)
      }, 60)
    })
  return promise
}

export function useLoadDb(): Db | null {
  const [db, setDb] = useState<Db | null>(ready)
  useEffect(() => {
    if (!db) load().then(setDb)
  }, [db])
  return db
}

export const DbContext = createContext<Db | null>(null)

export function useDb(): Db {
  const db = useContext(DbContext)
  if (!db) throw new Error('Dataset not loaded')
  return db
}
