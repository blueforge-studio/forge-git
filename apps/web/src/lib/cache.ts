/**
 * Gitea API response cache — wraps @blueforge-studio/service-factory's cache service.
 *
 * Reduces load on the Gitea API by caching responses in Redis.
 * Typical TTLs: 30s for fast-changing data (PRs, issues), 300s for slow (repo lists).
 */

import { cache } from './services'

const DEFAULT_TTL = 30

export async function cachedGitea<T>(
  key: string,
  fetcher: () => Promise<T>,
  ttlSeconds = DEFAULT_TTL,
): Promise<T> {
  try {
    const cached = await cache.get<T>(key)
    if (cached !== null) return cached

    const fresh = await fetcher()
    await cache.set(key, fresh, ttlSeconds)
    return fresh
  } catch {
    // Cache miss or Redis down — fall back to direct fetch
    return fetcher()
  }
}

/** Invalidate a cached key (e.g., after webhook event) */
export async function invalidateCache(key: string): Promise<void> {
  try {
    await cache.delete(key)
  } catch {
    // Best-effort
  }
}

export { cache }
