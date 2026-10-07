import { Link, Navigate, createBrowserRouter } from 'react-router-dom'
import Layout from './Layout'
import Home from './Home'
import { About, Team, Activities, Join } from './Pages'

function Placeholder({ title, description = '本页面布局与内容将在后续阶段完成。' }: { title: string; description?: string }) {
  return <section className="container placeholder-page"><p className="eyebrow">新版官网 · 建设中</p><h1>{title}</h1><p className="muted">{description}</p><Link className="button" to="/">返回首页 <span aria-hidden="true">↗</span></Link></section>
}

export const router = createBrowserRouter([
  { path: '/', element: <Layout />, children: [
    { index: true, element: <Home /> },
    { path: 'about', element: <About /> },
    { path: 'team', element: <Team /> },
    { path: 'brand-events', element: <Navigate to="/activities" replace /> },
    { path: 'activities', element: <Activities /> },
    { path: 'join', element: <Join /> },
    { path: 'brand-events/:slug', element: <Navigate to="/activities" replace /> },
    { path: 'activities/:eventbriteId', element: <Navigate to="/activities" replace /> },
    { path: 'departments', element: <Navigate to="/team" replace /> },
    { path: 'leaders', element: <Navigate to="/team" replace /> },
    { path: 'admin', element: <Placeholder title="内容管理" description="新版后台入口尚未接入。此页面不提供登录、草稿读取或发布操作。" /> },
    { path: '*', element: <Placeholder title="页面不存在" description="请检查网址，或从导航选择要访问的页面。" /> },
  ] },
])
