import { test } from 'node:test'
import assert from 'node:assert/strict'
import { generateKeyPair, SignJWT } from 'jose'
import { authenticate, createWorker } from '../src/worker.mjs'

const env = {
  ACCESS_ISSUER: 'https://example.cloudflareaccess.com', ACCESS_AUD: 'audience',
  ALLOWED_EMAILS: 'editor@example.com', ADMIN_ORIGIN: 'https://admin.example.com',
  PUBLIC_ORIGIN: 'https://site.example.com', CONTENT_REPO: 'org/private', CONTENT_BRANCH: 'main',
  CODE_REPO: 'org/code', CODE_BRANCH: 'main', GITHUB_APP_ID: '1', GITHUB_INSTALLATION_ID: '2', GITHUB_PRIVATE_KEY: 'test',
}
test('signed Access token requires correct issuer, audience, expiry and invited email', async () => {
  const { privateKey, publicKey } = await generateKeyPair('RS256')
  async function token({ email = 'editor@example.com', aud = env.ACCESS_AUD, issuer = env.ACCESS_ISSUER, expiry = '1h' } = {}) {
    return new SignJWT({ email }).setProtectedHeader({ alg: 'RS256' }).setSubject('test-user').setIssuedAt().setIssuer(issuer).setAudience(aud).setExpirationTime(expiry).sign(privateKey)
  }
  const req = jwt => new Request(env.ADMIN_ORIGIN, { headers: { 'Cf-Access-Jwt-Assertion': jwt } })
  assert.equal(await authenticate(req(await token()), env, publicKey), 'editor@example.com')
  await assert.rejects(authenticate(req(await token({ email: 'stranger@example.com' })), env, publicKey), { status: 403 })
  for (const options of [{ aud: 'wrong' }, { issuer: 'https://evil.example' }, { expiry: 1 }]) {
    await assert.rejects(authenticate(req(await token(options)), env, publicKey), { status: 401 })
  }
  await assert.rejects(authenticate(req('forged'), env, publicKey), { status: 401 })
  await assert.rejects(authenticate(new Request(env.ADMIN_ORIGIN), env, publicKey), { status: 401 })
})
test('missing configuration and unauthenticated asset/API requests fail closed', async () => {
  const worker = createWorker()
  for (const path of ['/admin', '/assets/app.js', '/api/content/draft', '/api/poc/login']) {
    const request = new Request(`${env.ADMIN_ORIGIN}${path}`)
    assert.equal((await worker.fetch(request, {})).status, 503)
    assert.equal((await worker.fetch(request, env)).status, 401)
  }
})
test('authenticated cross-origin writes, local login and arbitrary paths are rejected', async () => {
  const worker = createWorker({ authenticateUser: async () => 'editor@example.com', makeGithub: () => ({}) })
  function post(path, origin) { return new Request(`${env.ADMIN_ORIGIN}${path}`, { method: 'POST', headers: { Origin: origin, 'Content-Type': 'application/json' }, body: '{}' }) }
  assert.equal((await worker.fetch(post('/api/content/draft', 'https://evil.example'), env)).status, 403)
  assert.equal((await worker.fetch(post('/api/poc/login', env.ADMIN_ORIGIN), env)).status, 404)
  assert.equal((await worker.fetch(post('/api/content/anything', env.ADMIN_ORIGIN), env)).status, 404)
  const oversized = new Request(`${env.ADMIN_ORIGIN}/api/content/draft`, { method: 'POST', headers: { Origin: env.ADMIN_ORIGIN, 'Content-Type': 'application/json' }, body: 'x'.repeat(9000) })
  assert.equal((await worker.fetch(oversized, env)).status, 413)
})
