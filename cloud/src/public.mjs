export function publicPayload(release, codeSha) {
  if (!/^[a-f0-9-]{36}$/.test(release.releaseId || '') || !/^[a-f0-9]{40}$/.test(codeSha || '')) throw new Error('Invalid release or code version')
  const introduction = release.content?.introduction
  if (typeof introduction !== 'string' || !introduction.trim() || introduction.length > 600) throw new Error('Invalid introduction')
  if (typeof release.publishedAt !== 'string' || !Number.isFinite(Date.parse(release.publishedAt))) throw new Error('Invalid publication time')
  return { releaseId: release.releaseId, content: { introduction }, publishedAt: release.publishedAt, codeSha }
}
