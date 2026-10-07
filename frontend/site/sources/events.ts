import type { ReadOptions, ReadResult } from './content'

export const EVENT_TIME_ZONE = 'Australia/Sydney'
export const EVENT_LOAD_ERROR = '活动信息暂时无法加载，请稍后重试'

export type EventStatus = 'upcoming' | 'ongoing' | 'ended' | 'cancelled'
export type EventbriteStatus = 'live' | 'started' | 'ended' | 'completed' | 'canceled'

/** Normalized public Worker payload; contains no credentials or attendee data. */
export interface PublicEvent {
  id: string
  title: string
  summary: string
  image: string | null
  url: string
  /** ISO 8601 timestamps with explicit timezone offset or Z. */
  start: string
  end: string
  hideStart: boolean
  hideEnd: boolean
  status: EventbriteStatus
  venue: string
}

/** Client-side filtering by start date in Australia/Sydney. */
export interface EventFilter {
  year?: number
  month?: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10 | 11 | 12
}

/** Compute against current time; do not persist a derived status in content. */
export type ResolveEventStatus = (event: PublicEvent, now: Date) => EventStatus

export interface EventSource {
  /** Success with [] is empty; failed or partial pagination is an error. */
  readEvents(options?: ReadOptions): Promise<ReadResult<PublicEvent[]>>
}

export function isEventbriteUrl(value: string): boolean {
  try {
    const url = new URL(value)
    return url.protocol === 'https:' && !url.username && !url.password && /(^|\.)eventbrite\.(com|com\.au)$/.test(url.hostname)
  } catch { return false }
}
function isHttps(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try { const url = new URL(value); return url.protocol === 'https:' && !url.username && !url.password } catch { return false }
}
export function parseEvents(payload: unknown): PublicEvent[] {
  if (!payload || typeof payload !== 'object' || !('events' in payload) || !Array.isArray(payload.events)) throw new Error('Invalid events')
  const seen = new Set<string>()
  return payload.events.map((value: unknown) => {
    if (!value || typeof value !== 'object') throw new Error('Invalid event')
    const e = value as Record<string, unknown>
    const timestamp = (v: unknown) => typeof v === 'string' && /(?:Z|[+-]\d{2}:\d{2})$/.test(v) && Number.isFinite(Date.parse(v))
    if (typeof e.id !== 'string' || !/^\d+$/.test(e.id) || seen.has(e.id) ||
      typeof e.title !== 'string' || !e.title.trim() || typeof e.summary !== 'string' ||
      typeof e.url !== 'string' || !isEventbriteUrl(e.url) || !timestamp(e.start) || !timestamp(e.end) ||
      Date.parse(e.end as string) < Date.parse(e.start as string) || typeof e.hideStart !== 'boolean' || typeof e.hideEnd !== 'boolean' ||
      typeof e.venue !== 'string' || !['live', 'started', 'ended', 'completed', 'canceled'].includes(String(e.status)) ||
      !(e.image === null || isHttps(e.image))) throw new Error('Invalid event')
    seen.add(e.id)
    return { id: e.id, title: e.title, summary: e.summary, url: e.url, image: e.image,
      start: e.start, end: e.end, hideStart: e.hideStart, hideEnd: e.hideEnd, status: e.status, venue: e.venue } as PublicEvent
  }).sort((a, b) => Date.parse(b.start) - Date.parse(a.start))
}
export const eventSource: EventSource = {
  async readEvents(options = {}) {
    const controller = new AbortController()
    const cancel = () => controller.abort()
    options.signal?.addEventListener('abort', cancel, { once: true })
    if (options.signal?.aborted) cancel()
    const timeout = setTimeout(cancel, 25000)
    try {
      const response = await fetch('/api/events', { signal: controller.signal, cache: 'no-store', credentials: 'omit' })
      if (!response.ok) throw new Error('Event request failed')
      return { status: 'success', data: parseEvents(await response.json()) }
    } catch (error) {
      if (options.signal?.aborted) throw error
      return { status: 'error', message: EVENT_LOAD_ERROR, retryable: true }
    } finally {
      clearTimeout(timeout)
      options.signal?.removeEventListener('abort', cancel)
    }
  },
}
const dateParts = new Intl.DateTimeFormat('en', { timeZone: EVENT_TIME_ZONE, year: 'numeric', month: 'numeric' })
export function eventYearMonth(event: PublicEvent) {
  const parts = dateParts.formatToParts(new Date(event.start))
  return { year: Number(parts.find(p => p.type === 'year')!.value), month: Number(parts.find(p => p.type === 'month')!.value) }
}
export function matchesFilter(event: PublicEvent, year: string, month: string) {
  if (!year && !month) return true
  if (event.hideStart) return false
  const date = eventYearMonth(event)
  return (!year || date.year === Number(year)) && (!month || date.month === Number(month))
}
export const resolveEventStatus: ResolveEventStatus = (event, now) =>
  event.status === 'canceled' ? 'cancelled' : ['ended', 'completed'].includes(event.status) || now.getTime() >= Date.parse(event.end) ? 'ended' : now.getTime() >= Date.parse(event.start) ? 'ongoing' : 'upcoming'
