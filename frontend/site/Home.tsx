import { useState } from 'react'
import { Link } from 'react-router-dom'
import { socials } from './config'
import { introduction, homeHonors } from './reportContent'

export default function Home() {
  const [photoUnavailable, setPhotoUnavailable] = useState(false)
  return <>
    <section className="home-hero" aria-labelledby="home-heading"><div className="container"><div className="hero-panel"><p className="eyebrow">UNSWCSA</p><h1 id="home-heading">新南学联</h1><p className="hero-caption">家，因为有你</p><Link className="button" to="/about">了解我们 <span aria-hidden="true">↗</span></Link></div></div></section>
    <div className="container">
      <p className="preview-note">内容整理自新南学联 2024/25 · 2025/26 双年报</p>
      <div className="intro-grid section-space">
        <section aria-labelledby="intro-heading"><h2 id="intro-heading">学联简介</h2><p className="muted">{introduction}</p></section>
        <section aria-labelledby="honors-heading"><h2 id="honors-heading">荣誉与影响力</h2><ul className="honors">{homeHonors.map(([year, title]) => <li key={title}>{year} · {title}</li>)}</ul></section>
      </div>
      <div className="group-photo-section">
        <div className={photoUnavailable ? 'group-photo-placeholder' : undefined}>
          <img
            className="group-photo"
            src="/images/group_img.jpg"
            alt="新南学联合照"
            loading="lazy"
            hidden={photoUnavailable}
            onError={() => setPhotoUnavailable(true)}
          />
        </div>
      </div>
    </div>
    <section className="join-strip" aria-labelledby="join-heading"><div className="container join-inner"><div><p className="eyebrow">JOIN UNSWCSA</p><h2 id="join-heading">加入我们</h2><p className="muted">和我们一起把想法变成现实，在参与和协作中找到属于你的校园连接。</p></div><Link className="button button-red" to="/join">了解招新 <span aria-hidden="true">↗</span></Link></div></section>
    <section className="container social-section" aria-labelledby="social-heading"><div className="section-heading"><h2 id="social-heading">关注我们</h2><p className="muted">官方入口待确认</p></div><ul className="social-grid">{socials.map(item => <li key={item.name}><div><span>{item.name}</span><small>链接待补充</small></div></li>)}</ul></section>
  </>
}
