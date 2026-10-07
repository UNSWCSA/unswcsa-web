import { useEffect, useRef, useState } from 'react'
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom'
import { navigation } from './config'

export default function Layout() {
  const [open, setOpen] = useState(false)
  const toggle = useRef<HTMLButtonElement>(null)
  const main = useRef<HTMLElement>(null)
  const location = useLocation()
  const previous = useRef(location.pathname)
  useEffect(() => {
    setOpen(false)
    const title = navigation.find(item => item.path === location.pathname)?.label || '页面预览'
    document.title = `${title} · 新南学联`
    if (previous.current !== location.pathname) {
      window.scrollTo(0, 0)
      main.current?.focus({ preventScroll: true })
      previous.current = location.pathname
    }
  }, [location.pathname])
  return <>
    <a className="skip-link" href="#main-content">跳至主要内容</a>
    <header className="site-header" onKeyDown={event => {
      if (event.key === 'Escape' && open) { setOpen(false); toggle.current?.focus() }
    }}>
      <div className="header-inner container">
        <Link className="logo-link" to="/" aria-label="新南学联首页"><img src="/brand/logos/unswcsa-horizontal.png" alt="新南学联 UNSWCSA" width="220" height="82" /></Link>
        <button className="menu-toggle" ref={toggle} aria-expanded={open} aria-controls="primary-navigation" onClick={() => setOpen(!open)}>{open ? '关闭菜单' : '菜单'} <span aria-hidden="true">{open ? '×' : '☰'}</span></button>
        <nav id="primary-navigation" className={open ? 'primary-nav is-open' : 'primary-nav'} aria-label="主导航">{navigation.map(item => <NavLink key={item.path} to={item.path} end={item.path === '/'} onClick={() => setOpen(false)}>{item.label}</NavLink>)}</nav>
      </div>
    </header>
    <main id="main-content" ref={main} tabIndex={-1}><Outlet /></main>
    <footer className="site-footer">
      <div className="container footer-top">
        <div><p className="footer-name">新南学联</p><p className="footer-abbreviation">UNSWCSA</p><p className="official-name">新南威尔士大学中国学生学者联谊会<br />University of New South Wales Chinese Student Association</p></div>
        <nav className="footer-nav" aria-label="页脚导航">{navigation.slice(1).map(item => <Link key={item.path} to={item.path}>{item.label}</Link>)}</nav>
      </div>
      <div className="container footer-bottom"><p>© {new Date().getFullYear()} UNSWCSA </p></div>
    </footer>
  </>
}
