import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReadState } from './sources/content'
import { eventSource, type PublicEvent } from './sources/events'

export function useEvents() {
  const [state, setState] = useState<ReadState<PublicEvent[]>>({ status: 'loading' })
  const [refreshing, setRefreshing] = useState(false)
  const [now, setNow] = useState(() => new Date())
  const refreshRef = useRef<() => void>(() => {})
  const retry = useCallback(() => refreshRef.current(), [])
  useEffect(() => {
    let active = true
    let request: AbortController | null = null
    const refresh = async () => {
      if (request) return
      const controller = new AbortController()
      request = controller
      setRefreshing(true)
      try {
        const result = await eventSource.readEvents({ signal: controller.signal })
        if (active) setState(result)
      } catch { /* Unmount cancellation is not a service failure. */ }
      finally { request = null; if (active) setRefreshing(false) }
    }
    refreshRef.current = refresh
    const visible = () => { if (!document.hidden) { setNow(new Date()); void refresh() } }
    void refresh()
    const poll = setInterval(refresh, 60000)
    const clock = setInterval(() => setNow(new Date()), 1000)
    document.addEventListener('visibilitychange', visible)
    return () => {
      active = false
      request?.abort()
      clearInterval(poll); clearInterval(clock)
      document.removeEventListener('visibilitychange', visible)
      refreshRef.current = () => {}
    }
  }, [])
  return { state, refreshing, now, retry }
}
