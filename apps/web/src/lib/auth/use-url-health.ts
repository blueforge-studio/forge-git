'use client'

import { useEffect, useState } from 'react'

export type HealthStatus = 'idle' | 'checking' | 'ok' | 'unreachable'

export function useUrlHealth(url: string): HealthStatus {
  const [status, setStatus] = useState<HealthStatus>('idle')

  useEffect(() => {
    if (!url) {
      setStatus('idle')
      return
    }

    let cancelled = false
    const controller = new AbortController()

    setStatus('checking')
    const timer = setTimeout(async () => {
      try {
        await fetch(`${url}/api/v1/version`, { method: 'GET', signal: controller.signal })
        if (!cancelled) setStatus('ok')
      } catch (err) {
        if (cancelled) return
        if (err instanceof DOMException && err.name === 'AbortError') return
        setStatus('unreachable')
      }
    }, 400)

    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [url])

  return status
}
