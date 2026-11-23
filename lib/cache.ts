// lib/cache.ts
type Entry<T> = { value: T; expiresAt: number }

const store = new Map<string, Entry<any>>()
const inflight = new Map<string, Promise<any>>()

export function cacheGet<T>(key: string): T | undefined {
  const e = store.get(key)
  if (!e) return undefined
  if (e.expiresAt < Date.now()) {
    store.delete(key)
    return undefined
  }
  return e.value as T
}

export function cacheSet<T>(key: string, value: T, ttlMs: number): void {
  store.set(key, { value, expiresAt: Date.now() + ttlMs })
  if (store.size > 500) {
    const now = Date.now()
    for (const [k, v] of store) {
      if (v.expiresAt < now) store.delete(k)
    }
  }
}

export async function cached<T>(
  key: string,
  ttlMs: number,
  fn: () => Promise<T>
): Promise<T> {
  const fresh = cacheGet<T>(key)
  if (fresh !== undefined) return fresh

  const existing = inflight.get(key) as Promise<T> | undefined
  if (existing) return existing

  const p = (async () => {
    try {
      const value = await fn()
      cacheSet(key, value, ttlMs)
      return value
    } catch (err) {
      const stale = store.get(key)
      if (stale) return stale.value as T
      throw err
    } finally {
      inflight.delete(key)
    }
  })()

  inflight.set(key, p)
  return p
}

export function cacheInvalidate(prefix: string): void {
  for (const k of store.keys()) {
    if (k.startsWith(prefix)) store.delete(k)
  }
}