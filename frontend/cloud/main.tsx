import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import '../poc/style.css'

declare const __ADMIN_BUILD__: boolean
type Content = { introduction: string }
type Release = { id: string; content: Content; codeSha: string; requestedAt: string }
type Document = { revision: string; state: { draft: Content; release: Release | null }; dispatchFailed?: boolean }
type Status = { status: 'none' | 'live' | 'publishing' | 'verifying' | 'failed' | 'not-started'; id?: string }
const publicOrigin = import.meta.env.VITE_PUBLIC_ORIGIN || ''
const adminOrigin = import.meta.env.VITE_ADMIN_ORIGIN || ''
const labels = { none: '尚未发布', live: '已上线', publishing: '构建发布中', verifying: '构建完成，等待线上确认', failed: '发布失败', 'not-started': '等待构建启动；长时间未启动可重试' }

async function api<T>(path: string, body?: unknown): Promise<T> {
  const response = await fetch(`/api/content/${path}`, { method: body === undefined ? 'GET' : 'POST', credentials: 'same-origin', cache: 'no-store', headers: body === undefined ? {} : { 'Content-Type': 'application/json' }, body: body === undefined ? undefined : JSON.stringify(body) })
  if (response.redirected || response.headers.get('content-type')?.includes('text/html')) throw new Error('登录可能已过期，请重新登录。')
  const value = await response.json()
  if (!response.ok) throw new Error(value.error || '请求失败。')
  return value
}
function Intro({ content }: { content: Content }) {
  return <section className="intro"><p className="eyebrow">UNSW CHINESE STUDENT ASSOCIATION</p><h1>新南学联</h1><p className="introduction">{content.introduction}</p></section>
}
function Public() {
  const [content, setContent] = useState<Content | null>(null)
  const [error, setError] = useState('')
  useEffect(() => { fetch('/published.json', { cache: 'no-store' }).then(async response => { if (!response.ok) throw new Error(); return response.json() }).then(value => setContent(value.content)).catch(() => setError('简介暂时无法加载，请稍后重试。')) }, [])
  if (window.location.pathname.startsWith('/admin')) return <section className="panel"><h1>内容管理</h1>{adminOrigin ? <a className="button" href={`${adminOrigin}/admin`}>通过邮箱验证进入后台</a> : <p>后台地址尚未配置。</p>}</section>
  return content ? <Intro content={content} /> : <p role={error ? 'alert' : 'status'}>{error || '正在加载…'}</p>
}
function Admin() {
  const [doc, setDoc] = useState<Document | null>(null)
  const [text, setText] = useState('')
  const [status, setStatus] = useState<Status>({ status: 'none' })
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)
  const [preview, setPreview] = useState(false)
  const dirty = doc !== null && doc.state.draft.introduction !== text
  async function run(action: () => Promise<void>) { setBusy(true); setError(''); setMessage(''); try { await action() } catch (e) { setError(e instanceof Error ? e.message : '请求失败，请重试。') } finally { setBusy(false) } }
  function accept(next: Document) { setDoc(next); setText(next.state.draft.introduction) }
  const refreshStatus = () => api<Status>('status').then(setStatus)
  useEffect(() => { void run(async () => { accept(await api<Document>('draft')); await refreshStatus() }) }, [])
  useEffect(() => {
    if (!doc?.state.release) return
    const timer = window.setInterval(() => { refreshStatus().catch(() => setError('发布状态暂时无法读取，稍后将自动重试。')) }, 15000)
    return () => clearInterval(timer)
  }, [doc?.state.release?.id])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])
  return <><div className="heading"><div><p className="eyebrow">CONTENT STUDIO</p><h1>首页简介</h1><p>保存私有草稿，确认后发布到官网。</p></div><a href="/cdn-cgi/access/logout">退出登录</a></div>
    {error && <p role="alert" className="error">{error} <a href="/admin">重新登录或加载</a></p>}<p role="status" className="status">{busy ? '正在处理…' : message}</p>
    {doc && <><div className="editor-grid"><section className="panel"><div className="section-title"><h2>编辑内容</h2><span className="badge">{dirty ? '未保存' : '草稿已保存'}</span></div>
      <label htmlFor="intro">学联简介</label><textarea id="intro" maxLength={600} rows={9} value={text} disabled={busy} onChange={e => { setText(e.target.value); setPreview(false) }} /><p className="hint">纯文字，最多 600 个字符。{text.length}/600</p>
      <div className="actions"><button disabled={busy || !dirty || !text.trim()} onClick={() => void run(async () => { accept(await api<Document>('draft', { revision: doc.revision, introduction: text })); setMessage('草稿已保存到私有仓库，官网未改变。') })}>保存草稿</button>
        <button className="secondary" disabled={busy || dirty} onClick={() => setPreview(!preview)}>{preview ? '收起预览' : '预览已保存草稿'}</button>
        <button className="secondary" disabled={busy} onClick={() => { if (!dirty || window.confirm('重新加载会替换当前输入，请先复制需要保留的文字。')) void run(async () => accept(await api<Document>('draft'))) }}>加载最新版本</button></div>
      <p className="hint">草稿版本：{doc.revision.slice(0, 8)}</p></section>
      <aside className="panel"><h2>发布状态</h2><p role="status">{labels[status.status]}</p><p className="hint">提交成功不代表已上线。系统每 15 秒核对线上版本。</p>
        <button disabled={busy || dirty} onClick={() => void run(async () => { const next = await api<Document>('publish', { revision: doc.revision }); accept(next); setStatus({ status: next.dispatchFailed ? 'not-started' : 'publishing', id: next.state.release?.id }); setMessage(next.dispatchFailed ? '发布请求已保存，但启动构建失败。请点击重试发布。' : '发布请求已提交，等待构建和线上确认。') })}>发布已保存草稿</button>
        {doc.state.release && status.status !== 'live' && <button className="secondary" disabled={busy || dirty} onClick={() => void run(async () => { accept(await api<Document>('retry', { revision: doc.revision })); await refreshStatus(); setMessage('已重新请求构建，同一发布版本不会被重复部署。') })}>重试发布</button>}
        <a className="standalone" href={publicOrigin} target="_blank" rel="noreferrer">查看官网 ↗</a><p className="hint">需要恢复时，由技术部通过 Git 历史与部署平台操作。</p></aside></div>
      {preview && <div style={{ marginTop: 24 }}><p className="preview-note">私有草稿预览 · {doc.revision.slice(0, 8)} · 尚未公开</p><Intro content={doc.state.draft} /></div>}</>}
  </>
}
function App() {
  return <><div className="local-banner">内容发布 PoC · 仅使用测试资料</div><header><a href={__ADMIN_BUILD__ ? publicOrigin : '/'}><img src="/brand/logos/unswcsa-horizontal.png" alt="新南学联 UNSWCSA" /></a>{__ADMIN_BUILD__ && <span>受邀管理层后台</span>}</header><main>{__ADMIN_BUILD__ ? <Admin /> : <Public />}</main><footer>新南学联 · 内容发布验证</footer></>
}
createRoot(document.getElementById('root')!).render(<App />)
