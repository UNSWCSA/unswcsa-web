# 新南学联网站架构审计

审计日期：2026-09-21

## 审计结论

当前仓库是一个包含公开官网、用户系统、活动报名、优惠券、餐厅地图、AI 助手、组织管理和数据面板的完整平台。新版只保留轻量官网所需的前端基础，长期内容改由 CMS 提供，普通活动改由独立的 Eventbrite Event Source 提供。旧 Spring Boot 业务后端及其数据库和中间件不进入新版架构。

本文件中的分类含义：

- `KEEP`：可以继续作为新版基础使用，但仍可按新版规范整理。
- `REPLACE`：业务目标仍存在，但现有实现或数据来源不再适用。
- `REMOVE`：新版不需要；在第八阶段满足退役条件后删除。
- `UNKNOWN`：需要凭据、真实数据或正式品牌资料才能确定。

## Git 归档和功能冻结

- 旧完整系统正式归档分支：`legacy`。
- 本地和远端归档均指向提交：`5f7e65ca27d5461064b644b6364fbfe27746d719`。
- `legacy` 作为只读历史，不接收新版文档、品牌资产或后续简化改造。
- 新版工作在 `main` 或从 `main` 创建的分支进行。
- 旧登录、个人中心、报名、优惠券、地图、AI 助手、后台和数据面板停止新增业务功能。

## 前端盘点

| 范围 | 现状 | 分类 | 新版处理 |
| --- | --- | --- | --- |
| React、TypeScript、Vite | 当前前端基础 | `KEEP` | 继续使用 |
| React Router | 集中定义全部路由 | `KEEP` | 保留路由基础，重建新版公开路由 |
| `App.tsx` | 同时负责布局、登录状态、退出、后台入口、Toast 和 AI 助手 | `REPLACE` | 重建轻量公共布局、导航和页脚，解除认证与 AI 依赖 |
| `main.css` | 单一大型样式文件，公共页面与旧业务页面共用 | `REPLACE` | 先提取新版基础样式和品牌 Token；旧模块隔离后再删除遗留样式 |
| `HomeView` | 调用旧活动 API | `REPLACE` | 按首页范围重建；内容来自 CMS，活动入口来自 Event Source |
| `AboutView` | 旧静态介绍 | `REPLACE` | 内容迁移到 CMS，并把联系方式放在页面末尾 |
| `DepartmentsView`、`LeadersView` | 从 `publicContent.ts` 读取静态内容 | `REPLACE` | 合并为“部门与团队”，由 CMS 提供并按自然年归档 |
| `ActivitiesView`、`ActivityDetailView` | 依赖旧活动 API、权限和图片上传 | `REPLACE` | 改用独立 Event Source，报名跳转 Eventbrite |
| `JoinView` | 旧静态招新页面 | `REPLACE` | 改为 CMS 内容，只保留开放和关闭状态 |
| `publicContent.ts` | 部门和负责人硬编码数据 | `REPLACE` | 只作为内容迁移参考，不作为新版长期数据源 |
| `PageLoading` | 通用加载状态 | `KEEP` | 可继续使用，按新版视觉检查 |
| `http.ts`、Axios | 统一访问旧 `/api`，自动附加认证 | `REPLACE` | 建立互相独立的 Content Source 和 Event Source；不继承登录拦截器 |
| `toast.ts` | 旧交互提示工具 | `UNKNOWN` | 新版需要全局提示时再保留，否则移除 |
| 登录、忘记密码、个人中心和个人数据页面 | 依赖 JWT 和用户 API | `REMOVE` | 第四阶段先停用路由，第八阶段删除 |
| 优惠券页面和管理面板 | 依赖优惠券及登录系统 | `REMOVE` | 第四阶段先停用，第八阶段删除 |
| 餐厅地图 | 依赖 Leaflet、地图和餐厅 API | `REMOVE` | 同时移除 Leaflet 相关依赖 |
| AI 助手 | 全局挂载并依赖旧后端 | `REMOVE` | 从新版布局移除 |
| Admin、Dashboard、RBAC | 依赖认证、组织、活动、优惠券及统计 API | `REMOVE` | CMS 后台不在此 React 应用内重建 |

### 现有路由处理

| 路由 | 分类 | 处理 |
| --- | --- | --- |
| `/`、`/about`、`/join` | `REPLACE` | 使用新版页面替换 |
| `/departments`、`/leaders` | `REPLACE` | 合并为部门与团队页面，并为旧路径决定重定向 |
| `/activities`、`/activities/:activityId` | `REPLACE` | 改为 Eventbrite 活动列表和详情展示 |
| 品牌活动列表及详情 | `REPLACE` | 当前不存在，需要建立稳定路由和 slug 规则 |
| `/login`、`/forgot-password`、`/profile`、`/my*` | `REMOVE` | 停用后删除 |
| `/coupons`、`/food-map`、`/admin`、`/dashboard` | `REMOVE` | 停用后删除 |

## 后端、API 和基础设施盘点

| 模块 | 主要依赖 | 分类 | 说明 |
| --- | --- | --- | --- |
| Activity API | MySQL、缓存、用户和报名 | `REPLACE` | 普通活动改由 Eventbrite；历史代表性内容进入 CMS 品牌活动 |
| Organization API | MySQL、用户和 RBAC | `REPLACE` | 部门与历届团队改由 CMS 管理，不迁移管理接口 |
| File API 与 MinIO | 登录、对象存储 | `REPLACE` | CMS 负责长期内容图片；不保留通用上传后端 |
| Auth、User、JWT、邮件验证码 | MySQL、Redis、SMTP | `REMOVE` | 新版没有站内账号系统 |
| Coupon | MySQL、Redis、RabbitMQ、Caffeine | `REMOVE` | 新版不提供优惠券和抢券业务 |
| Restaurant、Geo | MySQL、Google Places、Leaflet | `REMOVE` | 新版不提供地图业务 |
| Assistant | AI API、Redis、认证 | `REMOVE` | 新版不提供 AI 助手 |
| Dashboard、RBAC、日志和限流 | MySQL、Redis、Sentinel、认证 | `REMOVE` | CMS 使用自身权限，不复刻旧管理系统 |
| Health API | Spring Boot | `REMOVE` | 随旧后端退役；新部署按平台提供健康检查 |
| Spring Boot 应用 | 上述全部模块 | `REMOVE` | 数据确认和新版稳定后在第八阶段退役 |
| MySQL | 用户、活动、组织、优惠券、餐厅等表 | `REMOVE` | 仅在发现需迁移的真实历史内容时临时读取 |
| Redis | 会话辅助、验证码、限流、缓存和抢券 | `REMOVE` | 新版不依赖 |
| RabbitMQ | 优惠券异步任务 | `REMOVE` | 新版不依赖 |
| MinIO | 旧图片上传 | `REMOVE` | 新版不依赖；先确认没有需保留对象 |
| SMTP、AI、Google Maps | 旧业务外部服务 | `REMOVE` | 撤销密钥安排在第八阶段 |
| Docker Compose、后端 Dockerfile | 部署完整旧平台 | `REMOVE` | 新部署形态在 PoC 后确定 |
| 前端 Dockerfile、Nginx | 静态托管并反向代理旧 `/api` | `REPLACE` | 是否保留容器部署由最终平台决定；不保留旧 API 代理 |

数据库迁移包含用户与权限、部门与成员、活动与报名、优惠券、AI FAQ、餐厅与评价等结构。只有活动、部门、团队和历史介绍可能具有内容迁移价值；用户、权限、报名、优惠券和餐厅业务数据不属于新版网站范围。

## 新旧依赖关系

- 当前 `App.tsx` 使所有公共页面间接依赖认证状态、退出逻辑和 AI 助手；新版布局必须先解除这些依赖。
- 首页和活动页面直接依赖旧 Activity API；不能在新版中简单复用，应替换为 Event Source。
- 部门和负责人页面依赖 `publicContent.ts`；其中内容可人工核对后迁移，代码结构不保留。
- 旧活动管理依赖通用文件上传、认证和权限；品牌活动应由 CMS 独立管理，不能复用这套接口。
- `main.css` 同时覆盖新旧页面；第四阶段只能逐步隔离，不能在新版骨架建立前整体删除。
- Nginx 将 `/api` 代理到 Spring Boot；数据源替换完成后需要重做部署配置。

## 数据和内容迁移结论

- 仓库中没有发现数据库 dump、MinIO 对象、上传目录或生产数据备份。
- 当前电脑没有发现该技术栈常用端口的运行实例；检查环境没有可用 Docker 命令，因此无法读取历史 Docker volumes。
- 项目负责人目前不知道存在运行中的生产数据库、MinIO 文件或仓库外历史图片。
- 当前结论是“没有已知生产数据需要导出”，不是对未知远程服务器的绝对证明。
- 如旧负责人确认从未正式部署，可将第一阶段的数据导出项记为“不适用”。如以后发现远程实例，必须在第八阶段退役前补做导出。
- `V4__seed_unsw_csa_activity_content.sql` 和 `publicContent.ts` 只能作为旧示例或迁移候选，正式使用前必须人工核对来源和时效。

## 图片和品牌资产

### `KEEP`

- `frontend/public/brand/logos/` 中的 UNSWCSA 和 Arc 正式 Logo。
- `frontend/public/brand/patterns/` 中的横版和竖版品牌背景。
- `frontend/public/brand/social/` 中的 Instagram、小红书、抖音和微信公众号图标。

### `REMOVE`

- 旧页面引用的 Unsplash 活动、餐厅和背景占位图。
- 旧页面引用的 Bing 头像占位图。
- `.DS_Store` 等系统文件。

### `UNKNOWN`

- 正式 favicon。
- 深色、黑白或其他批准的 Logo 版本。
- Logo 安全留白、最小尺寸及与 UNSW 联合展示的完整规则。
- 品牌展示字体的合法网页授权和字体文件。
- 后续使用的真实团队和活动照片。

未知品牌资料不阻塞架构和 PoC，但不得由 Codex自行重绘、裁切 Logo 或打包未经确认授权的字体。

## 配置和仓库卫生

- 根 `.gitignore` 已覆盖环境变量、IDE 目录、依赖、构建产物、日志、TypeScript 构建缓存、`.DS_Store`、测试输出和本地数据目录。
- `.idea/` 和 `frontend/*.tsbuildinfo` 已经被 Git 跟踪；应在后续清理时从新版分支的索引移除，归档分支保持不变。
- `application-dev.yml` 含硬编码数据库默认密码。新版不复用该配置；如果该密码曾用于真实数据库，必须更换。不要把新的凭据写入仓库。
- `frontend/public/brand/patterns/background.png` 约 10 MB，可作为品牌原始资产保存，但上线前需要生成适合网页的优化版本。

## 第一阶段收尾条件

技术审计、模块分类、依赖确认、旧系统归档和资产分类已经完成。第一阶段正式关闭前还需：

1. 提交并推送本审计文档及相应的项目状态更新；新版背景资料和品牌资产已通过 `b4af49b` 推送到 `origin/main`。
2. 尽可能向旧负责人确认是否存在未记录的远程部署；没有时把数据导出项正式记为“不适用”。
3. 将缺失品牌资料保留为明确待办；取得正式资料后再补充，不自行生成替代品。
