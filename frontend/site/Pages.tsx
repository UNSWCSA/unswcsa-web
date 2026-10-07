import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useEvents } from './useEvents'
import { introduction, departments, honors, services, history, joinReasons, reportTeams } from './reportContent'
import { EVENT_LOAD_ERROR, EVENT_TIME_ZONE, eventYearMonth, matchesFilter, resolveEventStatus, isEventbriteUrl } from './sources/events'

function PageHero({ title, subtitle, children }: { title: string; subtitle?: string; children?: ReactNode }) {
  return <section className="page-hero"><div className="container"><div className="page-hero-panel"><p className="eyebrow">UNSWCSA</p><h1>{title}</h1>{subtitle && <p className="muted">{subtitle}</p>}{children}</div></div></section>
}
function Photo({ portrait = false }: { portrait?: boolean }) {
  return <div className={`photo-slot${portrait ? ' portrait' : ''}`}><span>照片待提供</span></div>
}
function PreviewNote() {
  return <p className="preview-note">内容整理自新南学联 2024/25 · 2025/26 双年报</p>
}
function Departments() {
  return <div className="three-grid department-grid">{departments.map(name => <article className="content-card" key={name}><div className="content-card-copy"><h3>{name}</h3><p className="muted">部门职责介绍待补充。</p></div></article>)}</div>
}

export function About() {
  return <><PageHero title="关于我们" subtitle="新南威尔士大学中国学生学者联谊会"><p className="english-name">University of New South Wales Chinese Student Association</p></PageHero>
    <div className="container page-body"><PreviewNote />
      <section className="page-section"><h2>学联定位</h2><p className="muted">{introduction}</p></section>
      <section className="page-section"><h2>愿景与使命</h2><p className="muted">家，因为有你。我们希望学联成为同学们可以相遇、参与和找到归属的地方，让支持贯穿从入学适应到未来发展的不同阶段。</p><div className="two-grid">{services.map(item => <article className="info-panel" key={item.title}><h3>{item.title}</h3><p className="muted">{item.text}</p></article>)}</div></section>
      <section className="page-section"><h2>简短历史</h2><ol className="history-list">{history.map(item => <li key={item.year}><strong>{item.year}</strong><p className="muted">{item.text}</p></li>)}</ol><p className="muted">通过《UNSWCSA 学联手册》与品牌手册，我们持续整理活动策划、工作流程与换届经验，让一届届成员的积累得以传承。</p></section>
      <section className="page-section"><h2>组织联系</h2><p className="muted">在 2024/25 与 2025/26 两届工作中，学联与 UNSW、Arc 及校内相关服务团队开展合作，围绕朋辈互助、学生福祉、校园文化与社区建设获得项目支持。</p><p className="muted">从校友交流、企业参访到跨校项目，我们也持续连接校园与行业，让同学有机会接触不同的经验与视角。</p></section>
      <section className="page-section"><h2>荣誉与成果</h2><p className="muted">以下为双年报记录的社团荣誉与体育赛事成绩，每一份认可都属于共同投入的成员。</p><ul className="honors">{honors.map(([year, title]) => <li key={`${year}-${title}`}>{year} · {title}</li>)}</ul></section>
      <section className="page-section"><h2>联系我们</h2><div className="two-grid">{['一般咨询', '商务合作'].map(title => <article className="info-panel" key={title}><h3>{title}</h3><p className="muted">官方邮箱待补充。</p></article>)}</div></section>
    </div></>
}

function useYearMonth(includeMonth: boolean) {
  const [params, setParams] = useSearchParams()
  const rawYear = params.get('year') || ''
  const rawMonth = params.get('month') || ''
  const year = /^[1-9]\d{3}$/.test(rawYear) ? rawYear : ''
  const month = /^(?:[1-9]|1[0-2])$/.test(rawMonth) ? rawMonth : ''
  useEffect(() => {
    const next = new URLSearchParams(params)
    if (params.has('year') && !year) next.delete('year')
    if (includeMonth && params.has('month') && !month) next.delete('month')
    if (next.toString() !== params.toString()) setParams(next, { replace: true })
  }, [params, setParams, year, month, includeMonth])
  const update = (key: string, value: string) => {
    const next = new URLSearchParams(params)
    if (value) next.set(key, value)
    else next.delete(key)
    setParams(next, { preventScrollReset: true })
  }
  const clear = () => {
    const next = new URLSearchParams(params)
    next.delete('year'); next.delete('month')
    setParams(next, { preventScrollReset: true })
  }
  return { year, month, update, clear }
}

export function Team() {
  const { year, update } = useYearMonth(false)
  const team = reportTeams.find(item => item.year === (year || '2026'))
  return <><PageHero title="部门与团队" subtitle="UNSWCSA" /><div className="container page-body"><PreviewNote />
    <section className="page-section"><h2>部门介绍</h2><Departments /></section>
    <section className="page-section"><h2>{team ? `${team.term} 管理层` : '团队档案'}</h2>
      <div className="year-switch" role="group" aria-label="团队年份">{reportTeams.map(item => <button key={item.year} aria-pressed={team?.year === item.year} onClick={() => update('year', item.year)}>{item.year}</button>)}</div>
      <p className="muted" role="status">{team ? `展示 ${team.term} 届管理层，年份按任期结束年份标记。` : '暂无该年份的团队资料，请选择 2025 或 2026。'}</p>
      {team && <div className="three-grid member-grid">{team.members.map(member => <article className="member-card" key={member.name}><Photo portrait /><div><h3>{member.name}</h3><p className="muted">{member.role}</p></div></article>)}</div>}
    </section>
  </div></>
}

/** Only verified Eventbrite links should be supplied; absent links are never clickable. */
export function EventbriteLink({ url }: { url: string | null }) {
  const valid = isEventbriteUrl(url || '')
  return valid ? <a className="button" href={url!} target="_blank" rel="noopener noreferrer">前往 Eventbrite <span aria-hidden="true">↗</span><span className="sr-only">（新窗口打开）</span></a> : <span className="pending-link">Eventbrite 链接待补充</span>
}

const eventDate = new Intl.DateTimeFormat('zh-CN', { timeZone: EVENT_TIME_ZONE, dateStyle: 'medium', timeStyle: 'short' })
const statusLabels = { upcoming: '即将举行', ongoing: '进行中', ended: '已结束', cancelled: '已取消' }
function EventPhoto({ url, title }: { url: string | null; title: string }) {
  const [failed, setFailed] = useState(false)
  return url && !failed ? <img className="event-photo" src={url} alt={title} loading="lazy" onError={() => setFailed(true)} /> : <div className="photo-slot">暂无活动封面</div>
}
export function Activities() {
  const { year, month, update, clear } = useYearMonth(true)
  const { state, refreshing, now, retry } = useEvents()
  const events = state.status === 'success' ? state.data : []
  const years = [...new Set([...events.filter(e => !e.hideStart).map(e => String(eventYearMonth(e).year)), ...(year ? [year] : [])])].sort().reverse()
  const selected = events.filter(e => matchesFilter(e, year, month))
  return <><PageHero title="全部活动" subtitle="相聚于每一次活动" /><div className="container page-body">
    <div className="filter-bar"><label><span>年份</span><select aria-label="年份" value={year} onChange={e => update('year', e.target.value)}><option value="">全部年份</option>{years.map(value => <option key={value}>{value}</option>)}</select></label><label><span>月份</span><select aria-label="月份" value={month} onChange={e => update('month', e.target.value)}><option value="">全部月份</option>{Array.from({ length: 12 }, (_, i) => <option value={i + 1} key={i}>{i + 1} 月</option>)}</select></label><button className="filter-reset" disabled={!year && !month} onClick={clear}>清除筛选</button></div>
    <div className="filter-notice" role="status">{state.status === 'loading' ? '正在加载活动…' : state.status !== 'success' ? EVENT_LOAD_ERROR : selected.length ? `共 ${selected.length} 场活动 · 时间均为悉尼时间` : events.length ? '暂无符合条件的活动' : '暂无公开活动'}{state.status !== 'loading' && <button className="filter-reset" disabled={refreshing} onClick={retry}>{refreshing ? '正在刷新…' : state.status === 'success' ? '刷新活动' : '重试'}</button>}</div>
    {state.status === 'success' && <div className="two-grid event-grid">{selected.map(event => {
      const status = resolveEventStatus(event, now)
      return <article className="content-card" key={event.id}><div className="event-cover"><EventPhoto key={event.image} url={event.image} title={event.title} /><span className={`event-badge status-${status}`}>{statusLabels[status]}</span></div><div className="content-card-copy"><h2 className="card-title"><a href={event.url} target="_blank" rel="noopener noreferrer">{event.title}<span className="sr-only">（Eventbrite，新窗口打开）</span></a></h2><dl className="event-meta"><div><dt>时间</dt><dd>{event.hideStart ? '开始时间待公布' : eventDate.format(new Date(event.start))}{!event.hideEnd && <> — {eventDate.format(new Date(event.end))}</>}</dd></div><div><dt>地点</dt><dd>{event.venue || '地点待公布'}</dd></div></dl><p className="muted">{event.summary || '完整活动介绍请查看 Eventbrite。'}</p><EventbriteLink url={event.url} /></div></article>
    })}</div>}
  </div></>
}

export function Join() {
  return <><PageHero title="加入我们" subtitle="招新信息待确认"><p className="muted">开放时间、开放部门与申请入口将于确认后公布。</p><a className="button button-red" href="#join-faq">查看常见问题 <span aria-hidden="true">↓</span></a></PageHero>
    <div className="container page-body"><PreviewNote /><section className="page-section"><h2>为什么加入</h2><div className="two-grid">{joinReasons.map(item => <article className="info-panel" key={item.title}><h3>{item.title}</h3><p className="muted">{item.text}</p></article>)}</div></section>
      <section className="page-section"><div className="section-heading"><h2>部门简介</h2><Link className="text-link" to="/team">认识我们的团队 ↗</Link></div><Departments /></section>
      <section className="page-section"><h2>申请流程</h2><ol className="three-grid process-list">{['01', '02', '03'].map(number => <li className="info-panel" key={number}><span className="step-number" aria-hidden="true">{number}</span><div><h3>流程待补充</h3><p className="muted">正式申请步骤待确认。</p></div></li>)}</ol></section>
      <section className="page-section" id="join-faq"><h2>常见问题</h2><div className="faq-list">{['什么时候可以申请？', '有哪些部门开放招新？', '如何提交申请？'].map(question => <details key={question}><summary>{question}</summary><p>相关信息待确认，请以之后公布的正式招新信息为准。</p></details>)}</div></section>
    </div></>
}
