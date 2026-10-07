// Cloudflare Pages advanced-mode entry. Only the public list endpoint is proxied.
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname !== '/api/events') return env.ASSETS.fetch(request)
    const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }
    if (request.method !== 'GET') return new Response('{"error":"Method not allowed"}', { status: 405, headers })
    try {
      const upstream = await fetch('https://csa-events.unswcsa-exec.workers.dev/api/events', { signal: AbortSignal.timeout(25000), redirect: 'error' })
      if (!upstream.ok) throw new Error('Upstream unavailable')
      return new Response(upstream.body, { headers })
    } catch {
      return new Response(JSON.stringify({ error: '活动信息暂时无法加载，请稍后重试' }), { status: 503, headers })
    }
  },
}
