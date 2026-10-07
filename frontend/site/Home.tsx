import { useState } from 'react'
import { Link } from 'react-router-dom'
import { socials } from './config'
import { introduction, homeHonors } from './reportContent'

export default function Home() {
  const [photoUnavailable, setPhotoUnavailable] = useState(false)
  return <>
    <section className="home-hero" aria-labelledby="home-heading"><div className="container"><div className="hero-panel"><p className="eyebrow">UNSWCSA</p><h1 id="home-heading">新南学联</h1><p className="hero-caption">家，因为有你</p><Link className="button" to="/about">了解我们 <span aria-hidden="true">↗</span></Link></div></div></section>
    <div className="container">
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
    <section className="container social-section" aria-labelledby="social-heading"><div className="section-heading"><h2 id="social-heading">关注我们</h2><p className="muted">扫码关注我们，点击二维码可查看原图</p></div><ul className="social-grid">{socials.map(item => <li key={item.name}><a href={item.qr} target="_blank" rel="noopener noreferrer" aria-label={`查看${item.name}二维码原图（新窗口）`}><img src={item.qr} alt={`${item.name}关注二维码`} width="190" height="190" loading="lazy" /></a><span>{item.name}</span></li>)}</ul></section>
  </>
}
