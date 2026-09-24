import { randomBytes } from 'node:crypto'
import { mkdir, readFile, rename, writeFile } from 'node:fs/promises'
import { dirname } from 'node:path'

export class ApiError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

const initial = () => ({
  revision: 0,
  draft: { introduction: '这是用于验证编辑与发布流程的测试简介，正式内容稍后补充。' },
  published: { introduction: '这是用于验证编辑与发布流程的测试简介，正式内容稍后补充。' },
  previous: null,
  publishedAt: null,
})

// All mutations are serialized; one atomic file contains both draft and public version.
export function createStore(file) {
  let queue = Promise.resolve()
  async function read() {
    try { return JSON.parse(await readFile(file, 'utf8')) }
    catch (error) { if (error.code === 'ENOENT') return initial(); throw error }
  }
  function mutate(action, input) {
    const operation = queue.then(async () => {
      const state = await read()
      const allowed = action === 'draft' ? ['revision', 'introduction'] : ['revision']
      if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !allowed.includes(key))) {
        throw new ApiError(400, '请求包含不允许的字段。')
      }
      if (!Number.isInteger(input.revision) || input.revision !== state.revision) {
        throw new ApiError(409, '内容已更新，请重新加载后再编辑。当前输入尚未保存。')
      }
      if (action === 'draft') {
        if (typeof input.introduction !== 'string' || !input.introduction.trim() || input.introduction.length > 600) {
          throw new ApiError(400, '简介必须为 1–600 个字符。')
        }
        state.draft = { introduction: input.introduction.trim() }
      } else if (action === 'publish') {
        state.previous = state.published
        state.published = { ...state.draft }
        state.publishedAt = new Date().toISOString()
      } else if (action === 'restore') {
        if (!state.previous) throw new ApiError(400, '还没有可恢复的版本。')
        const previous = state.previous
        state.previous = state.published
        state.published = previous
        state.publishedAt = new Date().toISOString()
      } else { throw new ApiError(404, '接口不存在。') }
      state.revision += 1
      await mkdir(dirname(file), { recursive: true })
      await writeFile(`${file}.tmp`, JSON.stringify(state, null, 2), { mode: 0o600 })
      await rename(`${file}.tmp`, file)
      return state
    })
    queue = operation.catch(() => {})
    return operation
  }
  return { read, mutate }
}

export function createLocalApi(store) {
  const sessions = new Map()
  const cookieName = 'csa_poc_session'
  return async function handle(req, res, next) {
    const path = (req.url || '').split('?')[0]
    if (!path.startsWith('/api/poc/')) return next()
    const send = (status, body) => {
      res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' })
      res.end(JSON.stringify(body))
    }
    try {
      // Local-only adapter. Never install this middleware in a production server.
      const host = req.headers.host || ''
      if (!/^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)) throw new ApiError(403, '仅允许本机访问。')
      const method = req.method
      if (method !== 'GET' && method !== 'POST') throw new ApiError(405, '不支持此请求方式。')
      if (method === 'POST' && (req.headers.origin !== `http://${host}` || !req.headers['content-type']?.startsWith('application/json'))) {
        throw new ApiError(403, '请求来源无效。')
      }
      const token = (req.headers.cookie || '').split('; ').find(value => value.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1)
      for (const [id, expiry] of sessions) if (expiry < Date.now()) sessions.delete(id)
      const loggedIn = token && sessions.has(token)
      if (path === '/api/poc/published' && method === 'GET') {
        const state = await store.read()
        return send(200, { content: state.published, publishedAt: state.publishedAt })
      }
      if (path === '/api/poc/session' && method === 'GET') return send(200, { authenticated: Boolean(loggedIn), mode: 'local-only' })
      if (path === '/api/poc/login' && method === 'POST') {
        if (token) sessions.delete(token)
        const id = randomBytes(32).toString('hex')
        sessions.set(id, Date.now() + 60 * 60 * 1000)
        res.setHeader('Set-Cookie', `${cookieName}=${id}; HttpOnly; SameSite=Strict; Path=/api/poc; Max-Age=3600`)
        return send(200, { authenticated: true })
      }
      if (!loggedIn) throw new ApiError(401, '请先进入本地测试会话。')
      if (path === '/api/poc/logout' && method === 'POST') {
        sessions.delete(token)
        res.setHeader('Set-Cookie', `${cookieName}=; HttpOnly; SameSite=Strict; Path=/api/poc; Max-Age=0`)
        return send(200, { authenticated: false })
      }
      if (path === '/api/poc/draft' && method === 'GET') return send(200, await store.read())
      const action = path.slice('/api/poc/'.length)
      if (method !== 'POST' || !['draft', 'publish', 'restore'].includes(action)) throw new ApiError(404, '接口不存在。')
      let raw = ''
      for await (const chunk of req) {
        raw += chunk.toString()
        if (Buffer.byteLength(raw) > 8192) throw new ApiError(413, '请求内容过大。')
      }
      let body
      try { body = JSON.parse(raw) } catch { throw new ApiError(400, '请求格式无效。') }
      return send(200, await store.mutate(action, body))
    } catch (error) {
      if (!(error instanceof ApiError)) console.error('Local PoC API failed:', error.message)
      send(error instanceof ApiError ? error.status : 500, { error: error instanceof ApiError ? error.message : '保存或读取失败，请重试。已发布版本未被替换。' })
    }
  }
}
