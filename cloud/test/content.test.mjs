import { test } from 'node:test'
import assert from 'node:assert/strict'
import { changeContent, releaseStatus } from '../src/content.mjs'
import { publicPayload } from '../src/public.mjs'
import { decodeJson, encodeJson, githubClient, HttpError } from '../src/github.mjs'
import { generateKeyPair, exportPKCS8 } from 'jose'

const sha = 'a'.repeat(40)
function fakeGithub() {
  let value = { revision: sha, state: { draft: { introduction: '初始草稿' }, release: null } }
  return {
    read: async () => structuredClone(value),
    write: async (revision, state) => {
      if (revision !== value.revision) throw new HttpError(409, 'conflict')
      value = { revision: 'b'.repeat(40), state: structuredClone(state) }; return structuredClone(value)
    },
    codeHead: async () => sha,
    dispatch: async () => {},
    runs: async () => [],
  }
}
test('draft save never changes release, and stale writes are rejected', async () => {
  const github = fakeGithub()
  const saved = await changeContent(github, 'draft', { revision: sha, introduction: '新草稿' })
  assert.equal(saved.state.release, null)
  assert.equal(saved.state.draft.introduction, '新草稿')
  await assert.rejects(changeContent(github, 'draft', { revision: sha, introduction: '旧浏览器' }), { status: 409 })
})
test('publish freezes content and code; dispatch failure remains retryable', async () => {
  const github = fakeGithub()
  github.dispatch = async () => { throw new Error('network') }
  const saved = await changeContent(github, 'publish', { revision: sha })
  assert.equal(saved.dispatchFailed, true)
  assert.equal(saved.state.release.codeSha, sha)
  assert.equal(saved.state.release.content.introduction, '初始草稿')
  let dispatched
  github.dispatch = async id => { dispatched = id }
  const retried = await changeContent(github, 'retry', { revision: saved.revision })
  assert.equal(dispatched, saved.state.release.id)
  assert.equal(retried.revision, saved.revision)
})
test('illegal fields, missing versions and oversized values are rejected', async () => {
  for (const input of [{ revision: sha, introduction: 'x', path: '.github/workflows/evil.yml' }, { introduction: 'x' }, { revision: sha, introduction: 'x'.repeat(601) }, { revision: sha, introduction: '' }]) {
    await assert.rejects(changeContent(fakeGithub(), 'draft', input), { status: 400 })
  }
})
test('GitHub Unicode encoding round-trips without corruption', () => {
  const content = { introduction: '新南学联 🌏\n第二段' }
  assert.deepEqual(decodeJson(encodeJson(content)), content)
})
test('public artifact contains only explicitly selected fields', () => {
  const input = { releaseId: crypto.randomUUID(), content: { introduction: '公开', privateNote: 'secret' }, publishedAt: new Date().toISOString(), draft: { introduction: 'secret' }, email: 'secret' }
  const result = publicPayload(input, sha)
  assert.ok(!JSON.stringify(result).includes('secret'))
  assert.deepEqual(Object.keys(result), ['releaseId', 'content', 'publishedAt', 'codeSha'])
  assert.throws(() => publicPayload({ ...input, content: { introduction: '' } }, sha))
})
test('only matching online manifest means live; build success alone is verifying', async () => {
  const github = fakeGithub(); const release = { id: crypto.randomUUID() }
  const manifest = id => async () => Response.json({ releaseId: id })
  assert.equal((await releaseStatus(github, release, 'https://site.example', manifest(release.id))).status, 'live')
  github.runs = async () => [{ display_title: `content-${release.id}`, status: 'completed', conclusion: 'success' }]
  assert.equal((await releaseStatus(github, release, 'https://site.example', manifest('old'))).status, 'verifying')
  github.runs = async () => [{ display_title: `content-${release.id}`, status: 'completed', conclusion: 'failure' }]
  assert.equal((await releaseStatus(github, release, 'https://site.example', manifest('old'))).status, 'failed')
})
test('GitHub adapter refuses public content repo and narrows installation token', async () => {
  const { privateKey } = await generateKeyPair('RS256', { extractable: true })
  const env = { GITHUB_PRIVATE_KEY: await exportPKCS8(privateKey), GITHUB_APP_ID: '123', GITHUB_INSTALLATION_ID: '456', CONTENT_REPO: 'org/content', CONTENT_BRANCH: 'main' }
  const calls = []
  const client = githubClient(env, async (url, options) => {
    calls.push([url, options])
    if (url.endsWith('access_tokens')) return Response.json({ token: 'test-token' })
    return Response.json({ private: false })
  })
  await assert.rejects(client.read(), { status: 503 })
  assert.deepEqual(JSON.parse(calls[0][1].body), { repositories: ['content'], permissions: { contents: 'read' } })
  assert.equal(calls.length, 2)
})
