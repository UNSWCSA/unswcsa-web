import { test } from 'node:test'
import assert from 'node:assert/strict'
import { mkdtemp, rm } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { createServer } from 'node:http'
import { createLocalApi, createStore } from './server.mjs'

async function fixture(t) {
  const dir = await mkdtemp(join(tmpdir(), 'csa-poc-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  return createStore(join(dir, 'content.json'))
}

test('private draft, publish, persistence and restoration are separate', async t => {
  const store = await fixture(t)
  const original = await store.read()
  const saved = await store.mutate('draft', { revision: 0, introduction: 'Private draft' })
  assert.equal(saved.published.introduction, original.published.introduction)
  assert.equal((await store.read()).draft.introduction, 'Private draft')
  const published = await store.mutate('publish', { revision: 1 })
  assert.equal(published.published.introduction, 'Private draft')
  const restored = await store.mutate('restore', { revision: 2 })
  assert.deepEqual(restored.published, original.published)
  assert.equal(restored.draft.introduction, 'Private draft')
})

test('concurrent saves and repeated publication cannot overwrite a newer version', async t => {
  const store = await fixture(t)
  const results = await Promise.allSettled([
    store.mutate('draft', { revision: 0, introduction: 'First' }),
    store.mutate('draft', { revision: 0, introduction: 'Second' }),
  ])
  assert.equal(results[0].status, 'fulfilled')
  assert.equal(results[1].reason.status, 409)
  await store.mutate('publish', { revision: 1 })
  await assert.rejects(store.mutate('publish', { revision: 1 }), { status: 409 })
  assert.equal((await store.read()).published.introduction, 'First')
})

test('invalid fields and failed writes preserve the published version', async t => {
  const store = await fixture(t)
  await assert.rejects(store.mutate('draft', { revision: 0, introduction: 'x', path: '../code' }), { status: 400 })
  await assert.rejects(store.mutate('draft', { revision: 0, introduction: ' ' }), { status: 400 })
  await assert.rejects(store.mutate('draft', { revision: 0, introduction: 'x'.repeat(601) }), { status: 400 })
  assert.equal((await store.read()).revision, 0)
  const dir = await mkdtemp(join(tmpdir(), 'csa-fail-'))
  t.after(() => rm(dir, { recursive: true, force: true }))
  const file = join(dir, 'content.json')
  const durable = createStore(file)
  await durable.mutate('draft', { revision: 0, introduction: 'Pending' })
  // A directory at the temporary-file path simulates a storage write failure.
  const { mkdir } = await import('node:fs/promises')
  await mkdir(`${file}.tmp`)
  await assert.rejects(durable.mutate('publish', { revision: 1 }))
  assert.notEqual((await durable.read()).published.introduction, 'Pending')
})

test('HTTP API protects drafts, rejects foreign origins and invalidates logout', async t => {
  const store = await fixture(t)
  const api = createLocalApi(store)
  const server = createServer((req, res) => api(req, res, () => { res.writeHead(404); res.end() }))
  await new Promise(resolve => server.listen(0, '127.0.0.1', resolve))
  t.after(() => new Promise(resolve => server.close(resolve)))
  const base = `http://127.0.0.1:${server.address().port}`
  const call = (path, options) => fetch(`${base}/api/poc/${path}`, options)
  const post = (body = {}, cookie = '', origin = base) => ({ method: 'POST', headers: { 'Content-Type': 'application/json', Origin: origin, Cookie: cookie }, body: JSON.stringify(body) })
  assert.equal((await call('draft')).status, 401)
  assert.equal((await call('publish', post({ revision: 0 }))).status, 401)
  assert.equal((await call('login', post({}, '', 'https://other.example'))).status, 403)
  const login = await call('login', post())
  const cookie = login.headers.get('set-cookie').split(';')[0]
  assert.match(login.headers.get('set-cookie'), /HttpOnly/)
  assert.equal((await call('draft', post({ revision: 0, introduction: 'Secret' }, cookie))).status, 200)
  const publicResponse = await call('published')
  const publicText = await publicResponse.text()
  assert.ok(!publicText.includes('Secret'))
  assert.ok(!publicText.includes('draft'))
  assert.equal(publicResponse.headers.get('cache-control'), 'no-store')
  assert.equal((await call('publish', post({ revision: 1 }, cookie))).status, 200)
  assert.equal((await (await call('published')).json()).content.introduction, 'Secret')
  assert.equal((await call('logout', post({}, cookie))).status, 200)
  assert.equal((await call('draft', { headers: { Cookie: cookie } })).status, 401)
})
