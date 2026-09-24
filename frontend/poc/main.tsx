import { useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import { contentSource, RequestError, type DraftState, type PublicContent } from './api'
import './style.css'

function Introduction({ text }: { text: string }) {
  return <section className="intro"><p className="eyebrow">UNSW CHINESE STUDENT ASSOCIATION</p><h1>新南学联</h1><p className="introduction">{text}</p></section>
}

function PublicPage() {
  const [data, setData] = useState<PublicContent | null>(null)
  const [error, setError] = useState('')
  const load = () => { setError(''); contentSource.published().then(setData).catch(() => setError('简介暂时无法加载，请稍后重试。')) }
  useEffect(() => { load() }, [])
  return <>{error ? <p role="alert">{error}</p> : data ? <Introduction text={data.content.introduction} /> : <p role="status">正在加载简介…</p>}
    <div className="footnote"><span>本页仅展示本地已发布版本。</span><button className="secondary" onClick={load}>刷新内容</button></div></>
}

function Admin({ preview }: { preview: boolean }) {
  const [authenticated, setAuthenticated] = useState<boolean | null>(null)
  const [state, setState] = useState<DraftState | null>(null)
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [conflict, setConflict] = useState(false)
  const dirty = state !== null && text !== state.draft.introduction
  const unpublished = state !== null && state.draft.introduction !== state.published.introduction

  function accept(next: DraftState) { setState(next); setText(next.draft.introduction); setConflict(false) }
  async function run(action: () => Promise<void>) {
    setBusy(true); setError(''); setMessage('')
    try { await action() } catch (caught) {
      if (caught instanceof RequestError && caught.status === 401) setAuthenticated(false)
      if (caught instanceof RequestError && caught.status === 409) setConflict(true)
      setError(caught instanceof Error ? caught.message : '操作失败，请重试。')
    } finally { setBusy(false) }
  }
  useEffect(() => {
    void run(async () => {
      const session = await contentSource.session()
      setAuthenticated(session.authenticated)
      if (session.authenticated) accept(await contentSource.draft())
    })
  }, [])
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => { event.preventDefault(); event.returnValue = '' }
    window.addEventListener('beforeunload', warn)
    return () => window.removeEventListener('beforeunload', warn)
  }, [dirty])

  const notices = <><p role="status" className="status">{busy ? '正在处理…' : message}</p>{error && <p role="alert" className="error">{error}</p>}</>
  if (authenticated !== true) return <section className="panel login"><p className="eyebrow">CONTENT STUDIO · LOCAL</p><h1>内容管理</h1>
    <p>本地测试会话仅用于验证编辑流程，尚未接入受邀邮箱验证。请勿部署这个测试登录接口。</p>
    <button disabled={busy} onClick={() => void run(async () => { await contentSource.login(); setAuthenticated(true); accept(await contentSource.draft()) })}>进入本地测试会话</button>{notices}</section>
  if (!state) return <section className="panel">{notices}<button disabled={busy} onClick={() => void run(async () => accept(await contentSource.draft()))}>重新加载草稿</button></section>
  if (preview) return <><div className="preview-note">草稿预览 · 版本 {state.revision} · 尚不代表公开内容 <a href="/admin">返回编辑</a></div><Introduction text={state.draft.introduction} />{notices}</>

  return <><div className="heading"><div><p className="eyebrow">CONTENT STUDIO · LOCAL</p><h1>首页简介</h1><p>先保存草稿，预览确认后再发布。</p></div>
    <button className="secondary" disabled={busy || dirty} onClick={() => void run(async () => { await contentSource.logout(); setState(null); setAuthenticated(false) })}>退出会话</button></div>
    <div className="editor-grid"><section className="panel"><div className="section-title"><h2>编辑内容</h2><span className="badge">{dirty ? '未保存' : unpublished ? '草稿已保存' : '与公开版本一致'}</span></div>
      <label htmlFor="introduction">学联简介</label><textarea id="introduction" rows={9} maxLength={600} value={text} disabled={busy} onChange={event => setText(event.target.value)} aria-describedby="text-hint" />
      <p id="text-hint" className="hint">纯文字，最多 600 个字符。不会改变页面布局。<span>{text.length}/600</span></p>
      <div className="actions"><button disabled={busy || !dirty || !text.trim() || conflict} onClick={() => void run(async () => { accept(await contentSource.save(state.revision, text)); setMessage('草稿已保存。公开页面尚未改变。') })}>保存草稿</button>
        <a className="button secondary" href="/admin/preview" target="_blank" rel="noreferrer">预览已保存草稿 ↗</a></div>
      {conflict && <button className="secondary" disabled={busy} onClick={() => { if (window.confirm('重新加载会替换当前输入。请先复制需要保留的文字。')) void run(async () => accept(await contentSource.draft())) }}>重新加载最新版本</button>}
      {notices}</section>
      <aside className="panel"><h2>发布到本地展示页</h2><p className="hint">发布仅替换本地内容，不会提交 GitHub 或部署到互联网。</p>
        <p>当前版本：{state.revision}</p><p className="hint">{state.publishedAt ? `最近更新：${new Date(state.publishedAt).toLocaleString('zh-CN')}` : '尚未执行本地发布'}</p>
        <button disabled={busy || dirty || conflict || !unpublished} onClick={() => void run(async () => { accept(await contentSource.publish(state.revision)); setMessage('本地发布成功。打开或刷新展示页可查看。') })}>发布已保存草稿</button>
        {dirty && <p className="hint">请先保存修改。</p>}<a className="standalone" href="/" target="_blank" rel="noreferrer">查看公开展示页 ↗</a>
        <hr /><h3>恢复上一公开版本</h3><p className="hint">保留当前草稿，仅恢复公开内容。</p><button className="secondary" disabled={busy || dirty || conflict || !state.previous} onClick={() => { if (window.confirm('恢复上一公开版本？当前草稿将保留。')) void run(async () => { accept(await contentSource.restore(state.revision)); setMessage('上一公开版本已恢复，草稿保持不变。') }) }}>恢复上一版本</button>
      </aside></div></>
}

function App() {
  const path = window.location.pathname
  return <><div className="local-banner">本地 PoC · 测试内容 · 邮箱验证与 GitHub 自动部署尚未接入</div><header><a href="/" aria-label="新南学联展示页"><img src="/brand/logos/unswcsa-horizontal.png" alt="新南学联 UNSWCSA" /></a><nav aria-label="PoC 导航"><a href="/">展示页</a><a href="/admin">内容管理</a></nav></header>
    <main>{path === '/' ? <PublicPage /> : path === '/admin' || path === '/admin/preview' ? <Admin preview={path === '/admin/preview'} /> : <section><h1>页面不存在</h1><a href="/">返回展示页</a></section>}</main><footer>新南学联 · 首页简介发布流程验证</footer></>
}

createRoot(document.getElementById('root')!).render(<App />)
