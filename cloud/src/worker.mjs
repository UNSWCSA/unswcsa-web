import { createRemoteJWKSet, jwtVerify } from 'jose'
import { githubClient, HttpError } from './github.mjs'
import { changeContent, releaseStatus } from './content.mjs'

const jwksCache = new Map()
const required = ['ACCESS_ISSUER', 'ACCESS_AUD', 'ADMIN_ORIGIN', 'PUBLIC_ORIGIN', 'ALLOWED_EMAILS', 'CONTENT_REPO', 'CONTENT_BRANCH', 'CODE_REPO', 'CODE_BRANCH', 'GITHUB_APP_ID', 'GITHUB_INSTALLATION_ID', 'GITHUB_PRIVATE_KEY']
export async function authenticate(request, env, keySet) {
  const token = request.headers.get('Cf-Access-Jwt-Assertion')
  if (!token) throw new HttpError(401, '请通过 Cloudflare Access 邮箱验证后进入后台。')
  let payload
  try {
    const result = await jwtVerify(token, keySet, { issuer: env.ACCESS_ISSUER, audience: env.ACCESS_AUD, algorithms: ['RS256'], requiredClaims: ['exp', 'iat', 'sub', 'email'] })
    payload = result.payload
  } catch { throw new HttpError(401, '登录已失效，请重新验证邮箱。') }
  const allowed = env.ALLOWED_EMAILS.split(',').map(email => email.trim().toLowerCase()).filter(Boolean)
  if (typeof payload.email !== 'string' || !allowed.includes(payload.email.toLowerCase())) throw new HttpError(403, '此邮箱没有编辑权限。')
  return payload.email
}
function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' } })
}
export function createWorker({ authenticateUser = authenticate, makeGithub = githubClient } = {}) {
  return {
    async fetch(request, env) {
      try {
        if (required.some(key => !env[key])) throw new HttpError(503, '后台尚未完成安全配置。')
        const url = new URL(request.url)
        if (url.origin !== env.ADMIN_ORIGIN) throw new HttpError(403, '后台地址不匹配。')
        if (!/^https:\/\/[a-z0-9-]+\.cloudflareaccess\.com$/.test(env.ACCESS_ISSUER)) throw new HttpError(503, 'Access 配置无效。')
        if (!jwksCache.has(env.ACCESS_ISSUER)) jwksCache.set(env.ACCESS_ISSUER, createRemoteJWKSet(new URL(`${env.ACCESS_ISSUER}/cdn-cgi/access/certs`)))
        await authenticateUser(request, env, jwksCache.get(env.ACCESS_ISSUER))
        if (!['GET', 'HEAD', 'POST'].includes(request.method)) throw new HttpError(405, '请求方式不支持。')
        if (request.method === 'POST' && (request.headers.get('Origin') !== env.ADMIN_ORIGIN || !request.headers.get('Content-Type')?.startsWith('application/json'))) throw new HttpError(403, '请求来源无效。')
        if (!url.pathname.startsWith('/api/')) {
          if (request.method !== 'GET' && request.method !== 'HEAD') throw new HttpError(405, '请求方式不支持。')
          const response = await env.ASSETS.fetch(request)
          const secured = new Response(response.body, response)
          secured.headers.set('Cache-Control', 'no-store')
          secured.headers.set('X-Robots-Tag', 'noindex, nofollow')
          return secured
        }
        if (url.pathname === '/api/content/session' && request.method === 'GET') return json({ authenticated: true })
        const github = makeGithub(env)
        if (url.pathname === '/api/content/draft' && request.method === 'GET') return json(await github.read())
        if (url.pathname === '/api/content/status' && request.method === 'GET') {
          const { state } = await github.read()
          return json(await releaseStatus(github, state.release, env.PUBLIC_ORIGIN))
        }
        const action = url.pathname.replace('/api/content/', '')
        if (request.method !== 'POST' || !['draft', 'publish', 'retry'].includes(action)) throw new HttpError(404, '接口不存在。')
        // Enforce the limit while streaming, not just via an untrusted length header.
        const reader = request.body?.getReader()
        if (!reader) throw new HttpError(400, '缺少请求内容。')
        const chunks = []; let size = 0
        while (true) {
          const { done, value } = await reader.read()
          if (done) break
          size += value.byteLength
          if (size > 8192) { await reader.cancel(); throw new HttpError(413, '请求内容过大。') }
          chunks.push(value)
        }
        const bytes = new Uint8Array(size); let offset = 0
        for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
        let input
        try { input = JSON.parse(new TextDecoder().decode(bytes)) } catch { throw new HttpError(400, '请求格式无效。') }
        return json(await changeContent(github, action, input))
      } catch (error) {
        return json({ error: error instanceof HttpError ? error.message : '服务暂时不可用，请稍后重试。' }, error instanceof HttpError ? error.status : 503)
      }
    },
  }
}
export default createWorker()
