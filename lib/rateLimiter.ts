type Entry = { count: number; windowStart: number }
const store = new Map<string, Entry>()

export function rateLimit(key: string, limit = 5, windowMs = 5 * 60 * 1000) {
  const now = Date.now()
  const e = store.get(key)
  if (!e) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true }
  }
  if (now - e.windowStart > windowMs) {
    store.set(key, { count: 1, windowStart: now })
    return { allowed: true }
  }
  e.count += 1
  store.set(key, e)
  return { allowed: e.count <= limit, remaining: Math.max(0, limit - e.count) }
}
