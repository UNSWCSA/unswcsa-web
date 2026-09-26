import { HttpError } from './github.mjs'

export function validateInput(input, action) {
  const keys = action === 'draft' ? ['revision', 'introduction'] : ['revision']
  if (!input || typeof input !== 'object' || Array.isArray(input) || Object.keys(input).some(key => !keys.includes(key))) throw new HttpError(400, '包含不允许的字段。')
  if (!/^[a-f0-9]{40}$/.test(input.revision || '')) throw new HttpError(400, '版本号无效。')
  if (action === 'draft' && (typeof input.introduction !== 'string' || !input.introduction.trim() || input.introduction.length > 600)) throw new HttpError(400, '简介必须为 1–600 个字符。')
}

export async function changeContent(github, action, input) {
  validateInput(input, action)
  const current = await github.read()
  if (input.revision !== current.revision) throw new HttpError(409, '内容已更新，请先复制当前输入，再重新加载。')
  const state = structuredClone(current.state)
  if (action === 'draft') {
    state.draft = { introduction: input.introduction.trim() }
    return github.write(current.revision, state, 'content: save home draft')
  }
  if (action === 'retry') {
    if (!state.release) throw new HttpError(400, '没有可重试的发布。')
    await github.dispatch(state.release.id)
    return current
  }
  if (action !== 'publish') throw new HttpError(404, '接口不存在。')
  // Freeze only the selected content, never publish the complete private file.
  const codeSha = await github.codeHead()
  state.release = { id: crypto.randomUUID(), content: { introduction: state.draft.introduction }, codeSha, requestedAt: new Date().toISOString() }
  const saved = await github.write(current.revision, state, `content: request release ${state.release.id}`)
  try { await github.dispatch(state.release.id) }
  catch { return { ...saved, dispatchFailed: true } }
  return saved
}

export async function releaseStatus(github, release, publicOrigin, fetcher = fetch) {
  if (!release) return { status: 'none' }
  try {
    const response = await fetcher(`${publicOrigin}/published.json?release=${release.id}`, { cache: 'no-store', signal: AbortSignal.timeout(8000) })
    if (response.ok && (await response.json()).releaseId === release.id) return { status: 'live', id: release.id }
  } catch { /* A network failure is not evidence that deployment failed. */ }
  const runs = await github.runs()
  const matching = runs.filter(run => run.display_title === `content-${release.id}`)
  if (matching.some(run => run.status !== 'completed')) return { status: 'publishing', id: release.id }
  if (matching.some(run => run.conclusion === 'success')) return { status: 'verifying', id: release.id }
  if (matching.length) return { status: 'failed', id: release.id }
  return { status: 'not-started', id: release.id }
}
