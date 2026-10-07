// Cloudflare Pages advanced-mode entry. Only the public list endpoint is proxied.
export default {
  async fetch(request, env) {
    const url = new URL(request.url)
    if (url.pathname !== '/api/events') return env.ASSETS.fetch(request)
    const headers = { 'Cache-Control': 'no-store', 'Content-Type': 'application/json; charset=utf-8', 'X-Content-Type-Options': 'nosniff' }
    if (request.method !== 'GET') return new Response('{"error":"Method not allowed"}', { status: 405, headers })
    let diagnostic = 'EVENTS_FETCH_FAILED'
    try {
      if (!env.EVENTS || typeof env.EVENTS.fetch !== 'function') {
        diagnostic = 'EVENTS_BINDING_MISSING'
        throw new Error(diagnostic)
      }
      // Build a fresh request so visitor cookies and authorization are never forwarded.
      const upstream = await env.EVENTS.fetch('https://csa-events.unswcsa-exec.workers.dev/api/events', { signal: AbortSignal.timeout(25000), redirect: 'manual' })
      if (!upstream.ok) {
        diagnostic = `EVENTS_HTTP_${upstream.status}`
        throw new Error(diagnostic)
      }
      return new Response(upstream.body, { headers })
    } catch (error) {
      // Log only controlled classifications, never upstream bodies or credentials.
      console.error('[site-events]', diagnostic, ['TypeError', 'TimeoutError', 'AbortError'].includes(error?.name) ? error.name : 'Error')
      return new Response(JSON.stringify({ error: '活动信息暂时无法加载，请稍后重试' }), { status: 503, headers })
    }
  },
}
