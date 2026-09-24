# Club System Plus

> 文档范围（2026-09-24）：本文保留旧完整平台的说明、规划或历史记录，不作为新版需求及实施进度依据。新版以 [context 文档入口](context/README.md) 为准，六个页面方案已确认；第二阶段需求冻结已完成；新版采用自建 /admin、GitHub 内容文件与自动构建发布，Eventbrite 独立提供活动，草稿私有保存、预览和未发布新图片受保护，下一步进行数据源 PoC；最新进度见 context/project-status.md。

## 快速使用

### 本地开发

后端默认使用 `dev` profile，直接运行即可：

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

前端本地开发：

```powershell
cd frontend
npm install
npm run dev
```

本地 Docker Compose 演示：

```powershell
Copy-Item .env.example .env
# 如需继续使用旧的本地演示端口，可以把 .env 里的 HTTP_PORT 改为 5173
docker compose up -d --build
```

本地默认访问：

```text
前端: http://localhost:${HTTP_PORT}
后端: 由前端 Nginx 反向代理到 /api
Swagger: http://localhost:${HTTP_PORT}/api/swagger-ui.html
```

### 服务器使用

服务器使用 `prod` profile。先准备数据库表结构和必要环境变量，再启动后端：

```powershell
$env:SPRING_PROFILES_ACTIVE="prod"
$env:APP_JWT_SECRET="replace-with-a-production-secret-at-least-32-chars"
$env:APP_EMAIL_CODE_SECRET="replace-with-a-production-secret-at-least-32-chars"
$env:MYSQL_URL="jdbc:mysql://mysql:3306/club_system_plus?useUnicode=true&characterEncoding=utf8&connectionCollation=utf8mb4_unicode_ci&serverTimezone=Asia/Shanghai&allowPublicKeyRetrieval=true&useSSL=false"
$env:MYSQL_USERNAME="root"
$env:MYSQL_PASSWORD="replace-with-real-password"
$env:MAIL_HOST="smtp.example.com"
$env:MAIL_USERNAME="replace-with-mail-user"
$env:MAIL_PASSWORD="replace-with-mail-password"
cd backend
.\mvnw.cmd spring-boot:run
```

如果服务器使用 Docker Compose，将 `.env` 中的 `SPRING_PROFILES_ACTIVE` 改为 `prod`：

```text
SPRING_PROFILES_ACTIVE=prod
APP_JWT_SECRET=replace-with-a-production-secret-at-least-32-chars
APP_EMAIL_CODE_SECRET=replace-with-a-production-secret-at-least-32-chars
```

生产 profile 会关闭 Swagger 和 SQL 自动初始化。服务器首次启动前必须先建好表；线上入口建议只暴露 Nginx/HTTPS，MySQL、Redis、RabbitMQ、MinIO 不要直接暴露到公网。

### Flyway 数据库迁移

项目已经接入 Flyway，数据库结构由下面目录管理：

```text
backend/src/main/resources/db/migration/
```

当前初始化脚本：

```text
V1__init_schema.sql
```

启动后端时 Flyway 会自动创建 `flyway_schema_history` 表，并按版本执行还没执行过的 SQL。以后改表不要直接改已经执行过的 `V1`，而是新增新文件：

```text
V2__add_xxx_column.sql
V3__create_xxx_table.sql
```

生产环境如果已有旧数据库，`baseline-on-migrate=true` 会允许 Flyway 接管历史库；新数据库会直接执行 `V1__init_schema.sql`。

### 生产 `.env` 要点

服务器 `.env` 不要使用默认账号密码，至少需要改成类似下面这样：

```env
SPRING_PROFILES_ACTIVE=prod
HTTP_PORT=127.0.0.1:8081

MYSQL_ROOT_PASSWORD=replace-with-strong-root-password
MYSQL_USERNAME=club_app
MYSQL_PASSWORD=replace-with-strong-app-password
REDIS_PASSWORD=replace-with-strong-redis-password
RABBITMQ_USERNAME=club_mq
RABBITMQ_PASSWORD=replace-with-strong-rabbitmq-password
MINIO_ROOT_USER=club_minio
MINIO_ROOT_PASSWORD=replace-with-strong-minio-password

APP_JWT_SECRET=replace-with-at-least-32-chars-secret
APP_EMAIL_CODE_SECRET=replace-with-at-least-32-chars-secret
```

HTTPS 推荐在服务器外层 Caddy/Nginx 处理，例如 Caddy：

```caddyfile
your-domain.com {
    reverse_proxy 127.0.0.1:8081
}
```

Club System Plus 是一个面向大学社团的网站系统，目标是把社团官网、活动报名、优惠券秒杀/抢券、成员管理和后台运营面板整合到一个完整项目中。整体技术风格参考“苍穹外卖”和“黑马点评”：后端以 Spring Boot 生态为主，结合 MySQL、Redis、JWT、权限控制、缓存、分布式锁/秒杀队列等能力；前端提供官网展示、用户端报名抢券、成员端活动编辑和管理后台。

## 项目定位

本项目不是单纯的展示型官网，而是一个“社团官网 + 活动运营系统 + 成员权限后台”。

核心目标：

- 对外展示社团背景、主要人员、组织结构和活动信息。
- 支持游客、普通注册用户、社团成员、部门负责人、社长/系统维护者的差异化权限。
- 支持活动报名、抢票、优惠券抢购/领取等高并发场景。
- 支持成员创建活动草稿，经过负责人审核后发布。
- 支持社长和维护者管理组织架构、成员、部门、负责人和系统运营数据。

## 推荐技术栈

### 后端

- Java 17
- Spring Boot 3.x
- Spring MVC
- Spring Security + JWT
- MyBatis-Plus
- MySQL 8
- Redis
- Redisson 或 Redis Lua 脚本
- RabbitMQ 或 Kafka，可在后期加入，用于异步报名、秒杀结果处理、通知等场景
- Knife4j / Swagger OpenAPI
- Maven

### 前端

- React 19
- TypeScript
- Vite
- React Router
- Axios
- 后期可加入 Zustand / Redux Toolkit，用于登录态、权限菜单和后台筛选条件等共享状态
- 后期可加入 Ant Design / Arco Design / shadcn/ui，用于后台管理页面
- ECharts，用于后台访问量和活动数据面板

### RAG 智能问答

- Spring AI，作为 Spring Boot 项目内的 LLM 与 RAG 集成层
- PDF 解析：Apache PDFBox 或 Apache Tika
- Embedding 模型：OpenAI `text-embedding-3-small` / `text-embedding-3-large`，或国产 `bge-m3`
- 大模型：OpenAI、DeepSeek、通义千问、智谱或 Azure OpenAI，可按部署环境替换
- 向量库：
  - 课程项目和中小规模部署优先使用 PostgreSQL + pgvector
  - 如果业务库继续使用 MySQL，则推荐额外接入 Milvus / Qdrant 作为独立向量库
- Redis，用于热门问题缓存、会话上下文缓存、接口限流
- RabbitMQ / Kafka，可在后期用于 PDF 导入后的异步解析、切块、向量化

### 基础设施

- Docker Compose
- MySQL
- Redis
- Nginx
- 后期可加入 Prometheus + Grafana，用于更真实的接口监控

## 当前工程结构与启动方式

当前仓库已经拆分为后端、前端和基础设施目录：

```text
Club-system-plus/
  backend/                 Spring Boot 后端
    src/main/java/com/backend/sever/
      BackendApplication.java
      common/              统一响应结构
      config/              OpenAPI 等配置
      controller/          REST 接口
      exception/           业务异常与全局异常处理
      mapper/              MyBatis Mapper，后续业务表放这里
      service/             业务服务，后续模块按领域拆分
    src/main/resources/
      application.yml      通用配置，默认 context-path 为 /api
      application-dev.yml  开发环境 MySQL 配置
      API-design.md        接口设计文档
    pom.xml

  frontend/                React + Vite 前端
    src/
      api/                 Axios 封装与接口模块
      router/              React Router 路由
      styles/              全局样式
      views/               页面视图
    vite.config.ts         本地开发代理：/api -> http://localhost:8080
    package.json

  infra/                   后续放 Docker Compose、Nginx、数据库初始化脚本
```

后端默认配置：

- 服务端口：`8080`
- 后端接口前缀：`/api`
- Swagger UI：`http://localhost:8080/api/swagger-ui.html`
- OpenAPI JSON：`http://localhost:8080/api/v3/api-docs`
- 开发数据库：`club_system_plus`

启动后端：

```bash
cd backend
./mvnw spring-boot:run
```

Windows PowerShell 可使用：

```powershell
cd backend
.\mvnw.cmd spring-boot:run
```

启动前端：

```bash
cd frontend
npm install
npm run dev
```

前端开发地址：

```text
http://localhost:5173
```

前端通过 Vite 代理访问后端，浏览器请求 `/api/**` 时会转发到 `http://localhost:8080/api/**`。

## Docker Compose 部署

仓库根目录已提供 `docker-compose.yml`，会同时启动：

- MySQL 8.4：仅 Docker 内网访问
- Redis 7.4：仅 Docker 内网访问
- RabbitMQ 4 Management：仅 Docker 内网访问
- 后端 Spring Boot：仅 Docker 内网访问，由前端 Nginx 反向代理 `/api/**`
- 前端 Nginx：`http://localhost:${HTTP_PORT}`，默认 `HTTP_PORT=80`

首次启动前先创建 `.env`：

```bash
cp .env.example .env
```

Windows PowerShell 可使用：

```powershell
Copy-Item .env.example .env
```

然后修改 `.env` 中的真实密码和 `APP_JWT_SECRET`。`.env` 已加入 `.gitignore`，不要提交到仓库。

启动：

```bash
docker compose up -d --build
```

查看日志：

```bash
docker compose logs -f backend
docker compose logs -f frontend
```

停止：

```bash
docker compose down
```

如果需要清空 MySQL、Redis、RabbitMQ 数据卷：

```bash
docker compose down -v
```

默认账号：

```text
RabbitMQ: 使用 .env 中的 RABBITMQ_USERNAME / RABBITMQ_PASSWORD
系统 root 用户: root / Root@123456
```

容器部署使用 `application-docker.yml`：

- MySQL 连接到 `mysql:3306`
- Redis 连接到 `redis:6379`
- RabbitMQ 连接到 `rabbitmq:5672`
- 前端 Nginx 将 `/api/**` 反向代理到 `backend:8080/api/**`

## 用户角色设计

系统推荐使用 RBAC 权限模型：用户拥有角色，角色绑定权限；同时社团成员还需要绑定部门。

当前实现采用固定初始化管理员方案：

- 数据库初始化时创建固定账号 `root`，并绑定 `SYSTEM_MAINTAINER` 角色。
- `root` 初始密码为 `Root@123456`，首次启动后建议立即修改密码。
- 普通用户注册后默认绑定 `REGISTERED_USER` 角色。
- 管理员将用户加入部门后，系统会把用户从 `REGISTERED_USER` 升级为 `CLUB_MEMBER`。
- 用户后续变成部门负责人、社长或系统维护者，必须由已有 `SYSTEM_MAINTAINER` 通过 RBAC 管理接口调整角色。
- 后端判断权限不依赖用户 ID，而是依赖 `user_role -> role_permission` 查出的权限编码，例如 `system:maintain`、`dashboard:view`。

| 角色 | 说明 | 核心权限 |
| --- | --- | --- |
| 游客 | 未登录用户 | 浏览公开页面、查看公开活动、参加允许游客参与的报名/抢票活动 |
| 注册用户 | 已注册但不是社团成员 | 登录、报名公开活动、参与非成员限制的抢券/抢票 |
| 社团普通成员 | 已加入社团并归属某个部门 | 参与全部活动、领取成员优惠券、提交活动新增/修改/取消申请 |
| 部门负责人 | 某部门负责人 | 管理本部门成员、审核本部门成员提交的活动编辑申请、创建和发布部门活动 |
| 社长 | 社团最高管理者 | 管理所有部门、负责人、成员、活动、审核规则、查看运营面板 |
| 系统开发/维护者 | 技术管理员 | 拥有系统级管理能力，查看接口访问量、异常日志、系统配置 |

建议权限粒度示例：

- `activity:view`
- `activity:create`
- `activity:update`
- `activity:cancel`
- `activity:review`
- `coupon:grab`
- `member:manage`
- `department:manage`
- `dashboard:view`
- `system:maintain`

## 主要功能模块

### 1. 官网展示模块

面向所有用户开放。

- 首页
- 社团背景介绍
- 重要人员介绍
- 组织结构介绍
- 部门介绍
- 活动列表
- 活动详情
- 公告栏

建议前端页面：

- `/`
- `/about`
- `/leaders`
- `/departments`
- `/activities`
- `/activities/:id`

### 2. 登录注册模块

基础能力：

- 用户注册
- 用户登录
- JWT 鉴权
- 刷新 token
- 退出登录
- 密码加密存储
- 用户资料维护

可选增强：

- 邮箱验证码
- 手机验证码
- OAuth 登录
- 忘记密码

### 3. 活动模块

活动分为两类：

- 常规活动：例会、训练、workshop、小型分享会。
- 大型活动：比赛、演出、迎新、年度晚会、大型公开活动。

活动核心字段：

- 活动标题
- 活动类型
- 活动封面
- 活动简介
- 活动详情
- 活动地点
- 开始/结束时间
- 报名开始/结束时间
- 人数限制
- 是否允许游客参加
- 是否仅限社团成员
- 是否需要审核
- 活动状态：草稿、待审核、已发布、已取消、已结束
- 创建人
- 所属部门
- 审核人

活动流程：

1. 社团普通成员创建活动草稿。
2. 提交给本部门负责人审核。
3. 部门负责人同意后发布。
4. 用户报名或抢票。
5. 活动结束后进入归档状态。

社长和维护者可以跳过部门审核，直接发布或取消活动。

### 4. 报名与抢票模块

报名适合普通容量控制，抢票适合限量、高并发场景。

报名规则：

- 判断登录状态。
- 判断活动是否开放报名。
- 判断用户角色是否满足限制。
- 判断是否重复报名。
- 判断剩余名额。
- 写入报名记录。

抢票规则：

- Redis 预扣库存。
- 使用 Lua 脚本保证扣减和重复参与检查的原子性。
- 抢票成功后异步写入数据库。
- 防止同一用户重复抢票。
- 后台任务补偿异常订单/报名记录。

### 5. 优惠券模块

优惠券可用于社团活动、周边、合作商家或内部福利。

优惠券类型：

- 普通领取券
- 限时秒杀券
- 仅社团成员可领取券
- 指定部门可领取券

核心能力：

- 创建优惠券批次
- 设置库存
- 设置领取时间
- 设置可领取角色
- 用户领取
- 用户券包
- 使用/核销
- 过期处理

### 6. 部门与成员管理模块

部门结构：

- 社长
- 多个部门
- 每个部门有一个或多个负责人
- 每个社团成员归属一个部门

普通成员：

- 查看自己部门信息。
- 查看成员身份。
- 创建活动申请。

部门负责人：

- 添加/移除本部门成员。
- 修改本部门成员信息。
- 审核本部门活动申请。

社长/维护者：

- 创建新部门。
- 删除或停用部门。
- 任命部门负责人。
- 添加或移除任意部门成员。

当前后端已提供组织管理接口：

```text
GET    /api/organization/departments
POST   /api/organization/departments
PUT    /api/organization/departments/{departmentId}
PATCH  /api/organization/departments/{departmentId}/disable

GET    /api/organization/members?departmentId=
POST   /api/organization/members
PATCH  /api/organization/members/status

GET    /api/organization/leaders?departmentId=
POST   /api/organization/leaders
DELETE /api/organization/leaders
```

权限边界：

- `department:manage` 或 `system:maintain`：可以创建、编辑、停用全部部门，任命和移除部门负责人。
- `member:manage`：可以管理成员，但如果只是部门负责人，只能管理自己负责部门的成员。
- `department:manage` 或 `system:maintain`：拥有全局成员管理范围。
- 任命部门负责人时，系统会写入 `department_leader`，并绑定 `CLUB_MEMBER` 和 `DEPARTMENT_LEADER` 角色。
- 移除用户最后一个部门负责人身份时，系统会撤销 `DEPARTMENT_LEADER` 角色。

后台页面设计：

- “成员管理”和“权限管理”合并为“成员与权限”工作区。
- 每个成员行末尾提供“调整”按钮，用于修改成员部门、成员状态、负责人身份和角色。
- 部门负责人进入后台后，只能看到和管理自己负责部门的成员。
- 社长和系统维护者可以看到全部成员，并可以调整用户角色。
- “部门管理”只对社长和系统维护者开放，用于创建、编辑、停用部门。

### 7. 活动编辑审核模块

普通成员不应直接修改线上活动，而是提交编辑申请。

申请类型：

- 新增活动
- 修改活动
- 取消活动

审核状态：

- 待审核
- 已通过
- 已拒绝
- 已撤回

审核通过后，系统再把变更应用到正式活动表。

推荐做法：

- 正式活动存在 `activity` 表。
- 编辑申请存在 `activity_change_request` 表。
- 申请内容使用 JSON 保存变更快照，审核通过后再落到正式活动。

### 8. 后台数据面板

主要给社长和系统维护者使用。

第一阶段可以做基础统计：

- 用户总数
- 社团成员总数
- 部门数量
- 活动数量
- 报名人数
- 优惠券领取数量
- 今日接口访问量
- 最近 7 天访问趋势

后期增强：

- 热门接口排行
- 慢接口排行
- 异常日志排行
- 活动参与转化率
- 优惠券领取转化率
- 活跃用户排行

接口访问量可以先通过 Spring Interceptor 记录到数据库或 Redis，后期再接入专业监控。

### 9. RAG 智能课程与活动问答系统

RAG 问答模块采用“双知识源”设计：课程内容来自后台导入的 PDF 文件，社团信息来自系统内部业务数据和运营内容。两类知识源的处理方式不同，不能简单地全部塞进向量库。

```text
用户提问
  |
  v
问题路由 / 意图识别
  |
  |-- 课程内容问题 -> 检索 PDF 课程知识库
  |
  |-- 社团、活动、报名、权限问题 -> 查询系统业务数据 + 检索社团知识库
  |
  |-- 混合问题 -> 同时检索 PDF 知识库和系统数据
  |
  v
权限过滤 + 上下文组装
  |
  v
调用大模型生成答案
  |
  v
返回答案 + 引用来源
```

#### 课程 PDF 知识库

课程内容适合使用 RAG，因为 PDF 通常是非结构化或半结构化资料。导入流程建议如下：

```text
上传 PDF
  -> 保存原始文件
  -> 解析文本
  -> 清洗页眉、页脚、页码、重复空白
  -> 按章节、标题或固定 token 数切块
  -> 生成 embedding
  -> 写入向量库
  -> 保存课程、文件名、页码、章节等来源信息
```

适合回答的问题：

- “这门 Java 课程第二章主要讲什么？”
- “这个 PDF 里有没有讲事务隔离级别？”
- “帮我总结一下第三周课程内容。”
- “这个课程适合零基础吗？”
- “这份课程资料里提到的作业要求是什么？”

回答时应尽量带上引用来源，例如：

```text
参考来源：
- 《Java 入门课程.pdf》第 12 页
- 《后端开发 Workshop.pdf》第 4 页
```

#### 系统内部社团信息

社团信息分为动态数据和静态/半静态内容：

```text
动态数据：
- 活动时间
- 活动地点
- 报名人数
- 剩余名额
- 活动状态
- 用户身份和报名状态

处理方式：
-> 优先查询 MySQL 业务表，保证答案实时准确。

静态/半静态内容：
- 社团介绍
- 部门介绍
- 加入流程
- 活动规则
- 报名规则
- 常见问题
- 后台使用说明

处理方式：
-> 可同步到知识库，进入向量检索。
```

适合回答的问题：

- “这周有哪些活动？”
- “我不是社团成员，可以参加 AI 讲座吗？”
- “技术部主要负责什么？”
- “如何加入社团？”
- “报名失败可能是什么原因？”
- “管理员怎么审核活动？”

其中“这周有哪些活动”“某活动还有没有名额”这类问题必须查业务数据库；“技术部负责什么”“报名规则是什么”这类问题可以走社团知识库。

#### 推荐接口设计

```text
POST /api/ai/chat
GET  /api/ai/sessions
GET  /api/ai/sessions/{sessionId}/messages

POST /api/admin/knowledge/pdf/upload
POST /api/admin/knowledge/pdf/{materialId}/reindex
GET  /api/admin/knowledge/materials
GET  /api/admin/knowledge/chunks

POST /api/admin/knowledge/system/sync
GET  /api/admin/knowledge/system/sources
```

#### 推荐后端服务拆分

```text
ai/
  controller/
    AiChatController
    KnowledgeImportController
  service/
    RagChatService
    PdfKnowledgeService
    SystemKnowledgeService
    EmbeddingService
    VectorSearchService
    QuestionRouterService
  model/
    dto/
    vo/
  repository/
```

各服务职责：

- `AiChatController`：提供聊天接口和会话查询接口。
- `KnowledgeImportController`：提供 PDF 上传、重新索引、知识库管理接口。
- `PdfKnowledgeService`：解析 PDF、切块、生成向量。
- `SystemKnowledgeService`：从活动、部门、公告、FAQ 等系统内部数据构造知识上下文。
- `QuestionRouterService`：判断问题应该查 PDF、系统数据，还是混合检索。
- `VectorSearchService`：屏蔽 Milvus、Qdrant、pgvector 等不同向量库实现。
- `RagChatService`：完成检索、权限过滤、Prompt 组装和大模型调用。

#### 权限与安全边界

RAG 模块必须继承系统原有权限模型：

- 游客只能查询公开课程资料、公开活动和公开社团介绍。
- 注册用户可以查询自己可见的报名、活动和课程内容。
- 社团成员可以查询成员可见课程、内部活动和部门信息。
- 部门负责人只能查询本部门管理范围内的内部数据。
- 社长和维护者可以查询管理后台允许范围内的数据。

检索阶段就要做权限过滤，不能先把不可见内容交给大模型再要求模型“不要泄露”。大模型不是权限系统，权限必须由后端代码保证。

## 推荐数据库设计

### 用户与权限

- `user`
- `role`
- `permission`
- `user_role`
- `role_permission`

### 社团组织

- `department`
- `club_member`
- `department_leader`

### 活动

- `activity`
- `activity_registration`
- `activity_ticket`
- `activity_change_request`
- `activity_review_log`

### 优惠券

- `coupon_batch`
- `user_coupon`
- `coupon_use_record`

### 系统与审计

- `api_access_log`
- `operation_log`
- `system_config`

### RAG 与知识库

- `course`
- `course_material`
- `knowledge_document`
- `knowledge_chunk`
- `ai_chat_session`
- `ai_chat_message`

建议字段：

```text
course_material
- id
- course_id
- file_name
- file_url
- file_size
- parser_status       uploaded / parsing / indexed / failed
- error_message
- created_by
- created_at
- updated_at

knowledge_document
- id
- source_type         course_pdf / club_info / department / activity / faq / manual
- source_id
- title
- visibility          public / registered / member / department / admin
- department_id
- status              draft / published / archived
- content_hash
- created_at
- updated_at

knowledge_chunk
- id
- document_id
- chunk_index
- title
- content
- page_number
- token_count
- embedding_ref       向量库中的向量 ID，或 pgvector 字段
- content_hash
- created_at

ai_chat_session
- id
- user_id
- title
- created_at
- updated_at

ai_chat_message
- id
- session_id
- role                user / assistant / system
- content
- retrieved_refs      JSON，记录引用的 chunk、活动、课程或部门
- created_at
```

## 推荐后端包结构

```text
backend/
  src/main/java/com/backend/sever/
    auth/
    user/
    role/
    permission/
    department/
    member/
    activity/
    coupon/
    ai/
      controller/
      service/
      repository/
      model/
    dashboard/
    common/
      config/
      exception/
      response/
      security/
      utils/
```

## 推荐前端结构

```text
frontend/
  src/
    api/
      modules/
    assets/
    components/
    layouts/
    router/
    hooks/
    views/
      public/
      auth/
      user/
      member/
      admin/
      ai/
```

## 权限矩阵草案

| 功能 | 游客 | 注册用户 | 普通成员 | 部门负责人 | 社长 | 维护者 |
| --- | --- | --- | --- | --- | --- | --- |
| 浏览官网 | 是 | 是 | 是 | 是 | 是 | 是 |
| 查看公开活动 | 是 | 是 | 是 | 是 | 是 | 是 |
| 报名公开活动 | 可选 | 是 | 是 | 是 | 是 | 是 |
| 报名成员活动 | 否 | 否 | 是 | 是 | 是 | 是 |
| 领取公开优惠券 | 否 | 是 | 是 | 是 | 是 | 是 |
| 领取成员优惠券 | 否 | 否 | 是 | 是 | 是 | 是 |
| 创建活动申请 | 否 | 否 | 是 | 是 | 是 | 是 |
| 审核活动申请 | 否 | 否 | 否 | 本部门 | 全部 | 全部 |
| 管理部门成员 | 否 | 否 | 否 | 本部门 | 全部 | 全部 |
| 管理部门 | 否 | 否 | 否 | 否 | 是 | 是 |
| 查看系统面板 | 否 | 否 | 否 | 可选 | 是 | 是 |
| 系统维护配置 | 否 | 否 | 否 | 否 | 否 | 是 |

## 开发阶段规划

### Phase 0：项目初始化

- 初始化 Spring Boot 后端。
- 初始化 React + Vite 前端。
- 编写 Docker Compose，提供 MySQL 和 Redis。
- 统一接口响应结构。
- 配置全局异常处理。
- 配置接口文档。

### Phase 1：认证与基础用户系统

- 用户注册、登录、退出。
- JWT 鉴权。
- 密码加密。
- 用户资料接口。
- RBAC 基础表和权限拦截。

交付标准：

- 用户可以注册登录。
- 前端可以根据登录状态切换菜单。
- 后端可以按角色限制接口访问。

### Phase 2：官网与组织结构

- 首页。
- 社团背景介绍。
- 重要人员介绍。
- 部门结构展示。
- 部门和成员基础管理。

交付标准：

- 未登录用户也能浏览官网主要内容。
- 社长/维护者可以维护部门和成员数据。

### Phase 3：活动系统

- 活动创建。
- 活动列表和详情。
- 活动报名。
- 活动状态管理。
- 常规活动和大型活动区分。

交付标准：

- 用户可以查看活动。
- 满足权限的用户可以报名。
- 成员可以提交活动创建申请。

### Phase 4：审核工作流

- 活动新增/修改/取消申请。
- 部门负责人审核。
- 审核日志。
- 社长全局审核与强制发布/取消。

交付标准：

- 普通成员提交的活动变更不会直接上线。
- 负责人审核通过后正式发布。

### Phase 5：优惠券与抢券

- 优惠券批次管理。
- 用户领取优惠券。
- Redis 库存预扣。
- Lua 防止超卖和重复领取。
- 用户券包。

交付标准：

- 高并发下不会超卖。
- 同一用户不能重复领取同一批次优惠券。

### Phase 6：后台数据面板

- 用户统计。
- 活动统计。
- 报名统计。
- 优惠券统计。
- 接口访问量统计。

交付标准：

- 社长/维护者能看到基础运营数据。
- 系统能记录主要接口访问情况。

### Phase 7：RAG 智能课程与活动问答

- PDF 课程资料上传。
- PDF 文本解析、清洗、切块。
- 生成 embedding 并写入向量库。
- 系统内部社团信息同步到知识库。
- 活动、报名、名额等动态问题直接查询业务数据库。
- 智能问答接口。
- 前端聊天页面。
- 后台知识库管理页面。

交付标准：

- 管理员可以上传课程 PDF 并完成索引。
- 用户可以基于课程 PDF 提问，并看到答案来源。
- 用户可以询问社团、部门、活动和报名相关问题。
- 不同角色只能查询自己有权限访问的知识和业务数据。

### Phase 8：优化与部署

- Nginx 部署。
- Docker Compose 一键启动。
- 接口限流。
- 日志归档。
- 数据库索引优化。
- 前端权限路由优化。

## 优先级建议

建议先完成最小可用版本，而不是一开始就做完整秒杀和监控。

MVP 必须包含：

- 注册登录
- 角色权限
- 官网展示
- 部门与成员管理
- 活动发布
- 活动报名
- 活动审核

第二阶段再加入：

- 优惠券
- 抢券/抢票
- Redis 高并发控制
- 后台数据面板
- RAG 智能课程与活动问答的基础版本

第三阶段再加入：

- 消息队列
- 专业监控
- 通知系统
- 更完整的审计和日志
- RAG 异步索引、混合检索、问答质量评估和运营统计

## 关键技术难点

- RBAC 权限设计：角色不是简单的管理员/普通用户，还涉及部门范围权限。
- 活动审核：需要区分草稿、申请和正式发布数据。
- 抢券/抢票：需要 Redis 原子操作，避免超卖和重复抢。
- 后台统计：需要在不影响业务性能的情况下记录访问数据。
- 前端权限：不同角色看到的菜单和按钮不同，后端也必须再次校验权限。
- RAG 权限过滤：课程资料、内部活动、部门信息在检索阶段就必须按用户角色过滤。
- RAG 实时性：活动时间、名额、报名状态等动态信息不能只依赖向量库，必须查询业务数据库。
- PDF 解析质量：需要处理页眉页脚、表格、目录、分页和重复文本，否则会影响检索效果。

## 建议的开发顺序

1. 后端基础工程、数据库、Redis、统一响应。
2. 用户注册登录和 JWT。
3. RBAC 权限模型。
4. 前端登录页、首页和基础布局。
5. 部门、成员、角色管理。
6. 活动展示和报名。
7. 活动编辑审核。
8. 优惠券普通领取。
9. Redis 抢券/抢票。
10. 后台统计面板。
11. PDF 课程知识库导入和索引。
12. 系统内部社团信息同步知识库。
13. RAG 聊天接口和前端问答页面。
