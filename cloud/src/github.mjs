import { importPKCS8, SignJWT } from 'jose'

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status }
}

export function encodeJson(value) {
  const bytes = new TextEncoder().encode(JSON.stringify(value, null, 2))
  return btoa(Array.from(bytes, byte => String.fromCharCode(byte)).join(''))
}
export function decodeJson(content) {
  return JSON.parse(new TextDecoder().decode(Uint8Array.from(atob(content.replace(/\s/g, '')), char => char.charCodeAt(0))))
}

export function githubClient(env, fetcher = fetch) {
  const tokens = new Map()
  async function raw(path, token, options = {}) {
    const response = await fetcher(`https://api.github.com${path}`, {
      ...options,
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}`, 'User-Agent': 'UNSWCSA-content-poc', 'X-GitHub-Api-Version': '2022-11-28', 'Content-Type': 'application/json' },
      signal: AbortSignal.timeout(15000),
    })
    if (!response.ok) {
      if (response.status === 409 || response.status === 422) throw new HttpError(409, '内容版本已变化或仓库规则拒绝写入，请重新加载后重试。')
      throw new HttpError(502, `GitHub 请求失败（${response.status}），请检查授权或稍后重试。`)
    }
    return response.status === 204 ? null : response.json()
  }
  async function token(repo, permissions) {
    const id = JSON.stringify([repo, permissions])
    if (!tokens.has(id)) {
      const key = await importPKCS8(env.GITHUB_PRIVATE_KEY.replace(/\\n/g, '\n'), 'RS256')
      const now = Math.floor(Date.now() / 1000)
      const jwt = await new SignJWT({}).setProtectedHeader({ alg: 'RS256' }).setIssuer(env.GITHUB_APP_ID).setIssuedAt(now - 60).setExpirationTime(now + 540).sign(key)
      const value = await raw(`/app/installations/${env.GITHUB_INSTALLATION_ID}/access_tokens`, jwt, {
        method: 'POST', body: JSON.stringify({ repositories: [repo.split('/')[1]], permissions }),
      })
      tokens.set(id, value.token)
    }
    return tokens.get(id)
  }
  async function call(repo, path, options = {}, permissions = { contents: 'read' }) {
    return raw(`/repos/${repo}${path}`, await token(repo, permissions), options)
  }
  async function read(ref = env.CONTENT_BRANCH) {
    const repo = await call(env.CONTENT_REPO, '')
    if (!repo.private) throw new HttpError(503, '内容仓库必须为私有仓库。')
    const file = await call(env.CONTENT_REPO, `/contents/content/state.json?ref=${encodeURIComponent(ref)}`)
    return { revision: file.sha, state: decodeJson(file.content) }
  }
  async function write(revision, state, message) {
    const result = await call(env.CONTENT_REPO, '/contents/content/state.json', {
      method: 'PUT', body: JSON.stringify({ branch: env.CONTENT_BRANCH, sha: revision, message, content: encodeJson(state) }),
    }, { contents: 'write' })
    return { revision: result.content.sha, commit: result.commit.sha, state }
  }
  async function codeHead() {
    const commit = await call(env.CODE_REPO, `/commits/${encodeURIComponent(env.CODE_BRANCH)}`)
    return commit.sha
  }
  async function dispatch(releaseId) {
    await call(env.CODE_REPO, '/actions/workflows/publish-content.yml/dispatches', {
      method: 'POST', body: JSON.stringify({ ref: env.CODE_BRANCH, inputs: { release_id: releaseId } }),
    }, { actions: 'write' })
  }
  async function runs() {
    const result = await call(env.CODE_REPO, '/actions/workflows/publish-content.yml/runs?event=workflow_dispatch&per_page=30', {}, { actions: 'read' })
    return result.workflow_runs
  }
  return { read, write, codeHead, dispatch, runs }
}
