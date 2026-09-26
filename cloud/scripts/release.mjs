import { appendFile, mkdir, readFile, writeFile } from 'node:fs/promises'
import { githubClient } from '../src/github.mjs'
import { publicPayload } from '../src/public.mjs'
import { fileURLToPath } from 'node:url'

const artifact = fileURLToPath(new URL('../../frontend/dist-site/', import.meta.url))
const env = process.env
const github = githubClient(env)
const isContent = env.RELEASE_KIND === 'workflow_dispatch'
const sha = env.GITHUB_SHA
function assert(condition, message) { if (!condition) throw new Error(message) }
async function publicVersion() {
  const response = await fetch(`${env.PUBLIC_ORIGIN}/published.json?t=${Date.now()}`, { signal: AbortSignal.timeout(15000), cache: 'no-store' })
  assert(response.ok, 'Cannot read the deployed version. Bootstrap by publishing from the admin first.')
  return response.json()
}
async function selectedRelease() {
  const { state } = await github.read()
  const release = state.release
  assert(release && release.id === env.RELEASE_ID, 'Release superseded or missing; do not deploy this job.')
  assert(release.codeSha === sha, 'Code changed after publication was requested. Publish again using current code.')
  return { releaseId: release.id, content: { introduction: release.content.introduction }, publishedAt: release.requestedAt, codeSha: sha }
}
if (process.argv[2] === 'prepare') {
  const release = isContent ? await selectedRelease() : { ...await publicVersion(), codeSha: sha }
  assert(/^[a-f0-9-]{36}$/.test(release.releaseId), 'Invalid release id')
  assert(typeof release.content?.introduction === 'string' && release.content.introduction.length > 0 && release.content.introduction.length <= 600, 'Invalid published introduction')
  // Explicit allowlist: private state, metadata and other drafts never enter dist.
  const payload = publicPayload(release, sha)
  await mkdir(artifact, { recursive: true })
  await writeFile(`${artifact}published.json`, JSON.stringify(payload))
  await writeFile(`${artifact}_headers`, '/published.json\n  Cache-Control: no-store\n  X-Content-Type-Options: nosniff\n')
} else if (process.argv[2] === 'guard') {
  assert(await github.codeHead() === sha, 'Newer code exists; refuse an out-of-order deployment.')
  const prepared = JSON.parse(await readFile(`${artifact}published.json`, 'utf8'))
  if (isContent) assert((await selectedRelease()).releaseId === prepared.releaseId, 'Release superseded')
  else assert((await publicVersion()).releaseId === prepared.releaseId, 'Published content changed; rebuild before deploying code.')
  let alreadyLive = false
  try {
    const live = await publicVersion()
    alreadyLive = live.releaseId === prepared.releaseId && live.codeSha === prepared.codeSha
  } catch { /* The first publication has no public version yet. */ }
  if (env.GITHUB_ENV) await appendFile(env.GITHUB_ENV, `CSA_ALREADY_LIVE=${alreadyLive}\n`)
} else if (process.argv[2] === 'verify') {
  const prepared = JSON.parse(await readFile(`${artifact}published.json`, 'utf8'))
  let verified = false
  for (let attempt = 0; attempt < 12; attempt++) {
    try {
      const live = await publicVersion()
      if (live.releaseId === prepared.releaseId && live.codeSha === prepared.codeSha) { verified = true; break }
    } catch { /* Allow time for deployment propagation. */ }
    await new Promise(resolve => setTimeout(resolve, 5000))
  }
  assert(verified, 'Deployment submitted but public version is not confirmed. Check Pages before retrying.')
} else { throw new Error('Expected prepare, guard or verify') }
