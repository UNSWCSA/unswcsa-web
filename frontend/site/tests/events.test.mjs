import test from 'node:test'
import assert from 'node:assert/strict'
import { parseEvents, matchesFilter, resolveEventStatus, eventSource } from '../sources/events.ts'
import worker from '../../site-worker.js'
const event = { id: '123', title: 'Test', summary: '', image: null, url: 'https://www.eventbrite.com.au/e/test-123', start: '2026-09-30T14:30:00Z', end: '2026-09-30T16:00:00Z', hideStart: false, hideEnd: false, status: 'live', venue: '' }
test('validate complete payload; malformed or duplicate entries reject the entire list', () => {
  assert.deepEqual(parseEvents({ events: [] }), [])
  assert.equal(parseEvents({ events: [event] }).length, 1)
  for (const bad of [{ ...event, url: 'javascript:alert(1)' }, { ...event, start: '2026-10-01' }, { ...event, image: 'http://bad.test/a' }, { ...event, hideStart: 'false' }]) {
    assert.throws(() => parseEvents({ events: [event, bad] }))
  }
  assert.throws(() => parseEvents({ events: [event, event] }))
})
test('Sydney month boundary and hidden dates', () => {
  assert.equal(matchesFilter(event, '2026', '10'), true)
  assert.equal(matchesFilter(event, '2026', '9'), false)
  assert.equal(matchesFilter({ ...event, hideStart: true }, '', '10'), false)
  assert.equal(matchesFilter({ ...event, hideStart: true }, '', ''), true)
})
test('statuses update across start/end; cancellation takes precedence', () => {
  assert.equal(resolveEventStatus(event, new Date('2026-09-30T14:00Z')), 'upcoming')
  assert.equal(resolveEventStatus(event, new Date(event.start)), 'ongoing')
  assert.equal(resolveEventStatus(event, new Date(event.end)), 'ended')
  assert.equal(resolveEventStatus({ ...event, status: 'canceled' }, new Date(event.end)), 'cancelled')
})
test('source failure is not empty; a later request recovers; cancellation propagates', async () => {
  const original = globalThis.fetch
  try {
    globalThis.fetch = async () => new Response('unavailable', { status: 503 })
    assert.equal((await eventSource.readEvents()).status, 'error')
    globalThis.fetch = async () => Response.json({ events: [event] })
    assert.equal((await eventSource.readEvents()).status, 'success')
    globalThis.fetch = async () => Response.json({ events: [] })
    assert.deepEqual(await eventSource.readEvents(), { status: 'success', data: [] })
    globalThis.fetch = async () => { throw new DOMException('Aborted', 'AbortError') }
    await assert.rejects(eventSource.readEvents({ signal: AbortSignal.abort() }))
  } finally { globalThis.fetch = original }
})
test('production proxy uses service binding and never forwards visitor credentials', async () => {
  const env = { EVENTS: { async fetch(url, options) {
    assert.equal(url, 'https://csa-events.unswcsa-exec.workers.dev/api/events')
    assert.equal(options.headers, undefined)
    return Response.json({ events: [] })
  } } }
  const response = await worker.fetch(new Request('https://preview.test/api/events?target=evil', { headers: { Cookie: 'private', Authorization: 'Bearer private' } }), env)
  assert.equal(response.status, 200)
  assert.deepEqual(await response.json(), { events: [] })
  env.EVENTS.fetch = async () => new Response('private failure detail', { status: 503 })
  const failed = await worker.fetch(new Request('https://preview.test/api/events'), env)
  assert.equal(failed.status, 503)
  assert.equal((await failed.text()).includes('private failure detail'), false)
  const missing = await worker.fetch(new Request('https://preview.test/api/events'), {})
  assert.equal(missing.status, 503)
  assert.equal((await worker.fetch(new Request('https://preview.test/api/events', { method: 'POST' }), {})).status, 405)
  const asset = await worker.fetch(new Request('https://preview.test/team'), { ASSETS: { fetch: async () => new Response('page') } })
  assert.equal(await asset.text(), 'page')
})
