# Club System Plus 任务与数据库设计规划

> 文档范围（2026-09-24）：本文保留旧完整平台的说明、规划或历史记录，不作为新版需求及实施进度依据。新版以 [context 文档入口](../context/README.md) 为准，六个页面方案已确认；第二阶段需求冻结已完成；新版采用自建 /admin、GitHub 内容文件与自动构建发布，Eventbrite 独立提供活动，草稿私有保存、预览和未发布新图片受保护，下一步进行数据源 PoC；最新进度见 context/project-status.md。

## 1. 文档目标

本文用于指导 Club System Plus 的开发落地，重点说明：

- 开发任务顺序和阶段交付目标
- 前后端、数据库、中间件的技术选型
- 核心数据库表设计
- 为什么要拆分这些表，以及后续哪些表适合继续拆分或归档

本文不是 PRD 的替代，而是从工程实现角度把需求拆成可执行任务。

## 2. 总体开发原则

1. 先完成 MVP，再做高并发和运营增强。
2. 先做认证、权限、组织结构，再做活动、报名、审核。
3. 数据库先保证结构清晰和约束正确，后期再按访问量做缓存、归档和分库分表。
4. 前端先完成可用流程，不急于做复杂动画和视觉效果。
5. 所有管理类接口都必须做后端权限校验，前端隐藏按钮不能作为安全边界。

## 3. 任务顺序规划

### Phase 0：项目基础设施

目标：让项目可以稳定启动、连接数据库，并具备统一开发规范。

任务：

- 初始化后端基础结构：`controller`、`service`、`mapper`、`entity`、`dto`、`vo`、`common`。
- 配置 MySQL 数据源。
- 引入统一响应结构，例如 `Result<T>`。
- 引入全局异常处理。
- 配置 OpenAPI 文档。
- 初始化前端 Vue 3 + TypeScript + Vite。
- 配置 Axios 请求封装和路由结构。
- 准备 Docker Compose，至少包含 MySQL 和 Redis。

交付标准：

- 后端应用可以启动。
- 可以访问健康检查接口。
- 数据库连接正常。
- 前端可以启动并访问首页。

### Phase 1：认证与用户系统

目标：完成用户注册、登录、JWT 鉴权和基础用户资料。

任务：

- 用户注册。
- 用户登录。
- 密码加密存储。
- JWT 生成和校验。
- 登录用户信息查询。
- 用户状态控制：正常、禁用、删除。
- 前端登录页、注册页、登录状态持久化。

交付标准：

- 用户可以注册和登录。
- 登录后接口可识别当前用户。
- 未登录用户访问受保护接口时返回 401。

### Phase 2：RBAC 权限系统

目标：完成角色、权限和接口访问控制。

任务：

- 设计并初始化角色：注册用户、普通成员、部门负责人、社长、系统维护者。
- 设计权限编码，例如 `activity:create`、`activity:review`、`member:manage`。
- 用户与角色绑定。
- 角色与权限绑定。
- 后端接口按权限控制访问。
- 前端根据角色和权限控制菜单、按钮。

交付标准：

- 不同角色看到不同菜单。
- 后端接口能拦截无权限请求。
- 权限数据可以通过数据库维护。

### Phase 3：部门与成员管理

目标：建立社团组织结构，为活动审核和权限范围打基础。

任务：

- 部门创建、编辑、停用。
- 成员加入部门。
- 成员状态管理。
- 部门负责人任命和移除。
- 部门负责人只能管理本部门成员。
- 社长和系统维护者可以管理全部部门和成员。

交付标准：

- 一个用户可以成为社团成员。
- 成员必须能关联到部门。
- 部门负责人权限范围能按部门限制。

### Phase 4：官网展示

目标：完成公开页面，让游客能浏览社团信息和活动信息。

任务：

- 首页。
- 社团介绍。
- 部门展示。
- 重要成员展示。
- 活动列表。
- 活动详情。

交付标准：

- 未登录用户可以访问公开页面。
- 活动列表支持分页和筛选。
- 后续可由后台维护展示内容。

### Phase 5：活动核心流程

目标：完成活动创建、发布、列表、详情、报名。

任务：

- 活动基础 CRUD。
- 活动状态机：草稿、待审核、已发布、已取消、已结束。
- 活动报名规则校验。
- 活动名额控制。
- 用户报名记录查询。
- 用户取消报名。

交付标准：

- 已发布活动可以报名。
- 不允许重复报名。
- 不允许超过人数上限。
- 不符合角色限制的用户不能报名。

### Phase 6：活动审核工作流

目标：普通成员提交活动变更申请，由负责人或社长审核后生效。

任务：

- 新增活动申请。
- 修改活动申请。
- 取消活动申请。
- 审核通过、拒绝、撤回。
- 审核日志记录。
- 审核通过后把变更应用到正式活动表。

交付标准：

- 普通成员不能直接发布或修改正式活动。
- 部门负责人只能审核本部门申请。
- 社长和系统维护者可以审核全部申请。
- 所有审核动作可追踪。

### Phase 7：优惠券与限量领取

目标：完成优惠券批次、用户券包和基础领取能力。

任务：

- 优惠券批次创建。
- 设置库存、领取时间、过期时间、可领取角色。
- 用户领取优惠券。
- 用户券包查询。
- 优惠券使用和核销记录。

交付标准：

- 同一用户不能重复领取同一批次优惠券。
- 优惠券库存不能超发。
- 用户可以查看自己的券包。

### Phase 8：Redis 抢票 / 秒杀增强

目标：处理限量活动票和优惠券高并发领取。

任务：

- 活动票或优惠券库存预热到 Redis。
- 使用 Lua 脚本原子校验库存和重复参与。
- 成功请求进入异步处理队列。
- 异步写入 MySQL。
- 增加补偿任务，处理 Redis 成功但数据库写入失败的情况。

交付标准：

- 高并发下不超卖。
- 同一用户不能重复抢同一活动票或优惠券。
- 数据最终能落库并可查询。

### Phase 9：后台数据面板与日志

目标：让管理者能看到系统运行和业务数据。

任务：

- 用户总数、成员总数、部门数。
- 活动数、报名数。
- 优惠券领取数。
- API 访问日志。
- 操作日志。
- 基础图表展示。

交付标准：

- 社长和系统维护者可访问数据面板。
- 系统能记录关键操作。
- 高频日志支持后续归档。

### Phase 10：部署与优化

目标：项目具备部署、演示和持续优化能力。

任务：

- Docker Compose 一键启动。
- Nginx 前端静态资源和反向代理。
- 数据库索引优化。
- Redis 缓存热点数据。
- 接口限流。
- 关键业务集成测试。

交付标准：

- 新环境能按文档启动。
- 常用接口响应稳定。
- 数据库慢查询有优化方向。

## 4. 技术选型

### 4.1 后端

| 技术 | 选择 | 原因 |
| --- | --- | --- |
| Java | Java 17 | 稳定、生态成熟，适合 Spring Boot 项目 |
| Web 框架 | Spring Boot | 快速构建 REST API，生态完整 |
| Web 模块 | Spring MVC | 当前项目已引入 Web MVC，适合传统 REST 服务 |
| ORM | MyBatis / MyBatis-Plus | SQL 可控，适合课程项目展示表设计和复杂查询 |
| 安全 | Spring Security + JWT | 适合前后端分离，便于 RBAC 权限控制 |
| API 文档 | Springdoc OpenAPI | 当前项目已引入，便于前后端联调 |
| 参数校验 | Hibernate Validator | 统一处理请求参数合法性 |
| 构建工具 | Maven | 当前后端已使用 Maven |

说明：

- 当前 `pom.xml` 已有 Spring Boot、MyBatis、MySQL、Springdoc、Lombok，可在此基础上继续扩展。
- 如果项目想减少复杂度，MVP 阶段可以先用 MyBatis，不急着引入消息队列。

### 4.2 前端

| 技术 | 选择 | 原因 |
| --- | --- | --- |
| 框架 | Vue 3 | 学习成本适中，适合管理后台和官网 |
| 语言 | TypeScript | 提升接口类型约束，减少联调错误 |
| 构建 | Vite | 启动快，配置简单 |
| 状态管理 | Pinia | Vue 3 推荐方案，用于用户状态和权限菜单 |
| 路由 | Vue Router | 管理公开页、用户中心、后台路由 |
| UI 组件 | Element Plus | 后台表格、表单、弹窗、分页实现效率高 |
| HTTP | Axios | 统一处理 token、错误码、接口前缀 |
| 图表 | ECharts | 后台数据面板使用 |

### 4.3 数据库与中间件

| 技术 | 选择 | 原因 |
| --- | --- | --- |
| 主数据库 | MySQL 8 | 关系清晰，适合用户、角色、活动、报名等强一致数据 |
| 缓存 | Redis | 适合登录状态辅助、热点活动、库存预扣、限流 |
| 分布式锁 / 原子脚本 | Redis Lua 或 Redisson | 处理抢票、优惠券库存扣减和重复领取 |
| 消息队列 | RabbitMQ，后期引入 | 秒杀成功后的异步落库、通知、日志削峰 |
| 部署 | Docker Compose | 方便本地开发和演示 |
| 网关 / 静态资源 | Nginx | 部署前端静态文件并反向代理后端 |

### 4.4 不建议 MVP 阶段立即引入的技术

| 技术 | 暂缓原因 |
| --- | --- |
| Kafka | 项目体量偏小，运维成本高，RabbitMQ 更轻量 |
| Elasticsearch | 早期活动搜索用 MySQL 索引即可 |
| 微服务 | 单体分层足够，微服务会显著增加复杂度 |
| 分库分表中间件 | 当前数据量不需要，先设计好可迁移边界 |
| Kubernetes | 本地和课程演示阶段 Docker Compose 足够 |

## 5. 数据库设计原则

1. 所有业务表使用 `BIGINT` 主键，便于后期雪花 ID 或分布式 ID 扩展。
2. 所有核心表保留 `created_at`、`updated_at`。
3. 需要软删除的表增加 `deleted` 或 `deleted_at`。
4. 状态字段使用字符串编码或小整数编码，但必须在代码中用枚举统一维护。
5. 关系型数据使用关联表，不把多个 ID 拼成字符串存储。
6. 高频查询字段必须建立索引。
7. 金额、库存、名额等关键字段不能只依赖前端校验。
8. 正式数据和申请数据分表，避免审核中的草稿污染线上数据。

## 6. 核心数据库表设计

### 6.1 用户与权限

#### `sys_user`

用途：保存系统账号信息。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 用户 ID |
| username | VARCHAR(64) | 用户名，唯一 |
| email | VARCHAR(128) | 邮箱，唯一，可为空 |
| phone | VARCHAR(32) | 手机号，唯一，可为空 |
| password_hash | VARCHAR(255) | 加密后的密码 |
| nickname | VARCHAR(64) | 昵称 |
| avatar_url | VARCHAR(512) | 头像 |
| status | VARCHAR(32) | NORMAL、DISABLED |
| last_login_at | DATETIME | 最后登录时间 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| deleted | TINYINT | 逻辑删除 |

索引：

- `uk_user_username(username)`
- `uk_user_email(email)`
- `uk_user_phone(phone)`
- `idx_user_status(status)`

#### `sys_role`

用途：保存角色。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 角色 ID |
| code | VARCHAR(64) | 角色编码，唯一 |
| name | VARCHAR(64) | 角色名称 |
| description | VARCHAR(255) | 描述 |
| sort_order | INT | 排序 |
| status | VARCHAR(32) | NORMAL、DISABLED |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

建议角色编码：

- `REGISTERED_USER`
- `CLUB_MEMBER`
- `DEPARTMENT_LEADER`
- `PRESIDENT`
- `SYSTEM_ADMIN`

#### `sys_permission`

用途：保存权限点。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 权限 ID |
| code | VARCHAR(128) | 权限编码，唯一 |
| name | VARCHAR(64) | 权限名称 |
| module | VARCHAR(64) | 所属模块 |
| description | VARCHAR(255) | 描述 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### `sys_user_role`

用途：用户和角色多对多关系。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 主键 |
| user_id | BIGINT | 用户 ID |
| role_id | BIGINT | 角色 ID |
| created_at | DATETIME | 创建时间 |

索引：

- `uk_user_role(user_id, role_id)`
- `idx_user_role_role_id(role_id)`

#### `sys_role_permission`

用途：角色和权限多对多关系。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 主键 |
| role_id | BIGINT | 角色 ID |
| permission_id | BIGINT | 权限 ID |
| created_at | DATETIME | 创建时间 |

索引：

- `uk_role_permission(role_id, permission_id)`
- `idx_role_permission_permission_id(permission_id)`

拆表原因：

- 用户、角色、权限是典型 RBAC 三层模型，不能把角色或权限直接写进用户表。
- `sys_user_role` 和 `sys_role_permission` 单独成表，支持一个用户多个角色、一个角色多个权限。
- 后期如果权限点变多，只需要维护权限表和关联表，不需要改用户表结构。

### 6.2 组织与成员

#### `club_department`

用途：保存社团部门。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 部门 ID |
| name | VARCHAR(64) | 部门名称，唯一 |
| description | TEXT | 部门介绍 |
| parent_id | BIGINT | 上级部门，可为空 |
| status | VARCHAR(32) | ACTIVE、DISABLED |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

索引：

- `uk_department_name(name)`
- `idx_department_parent_id(parent_id)`

#### `club_member`

用途：保存用户的社团成员身份。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 成员 ID |
| user_id | BIGINT | 用户 ID |
| department_id | BIGINT | 所属部门 ID |
| member_no | VARCHAR(64) | 成员编号，可为空 |
| title | VARCHAR(64) | 职务名称 |
| join_date | DATE | 加入日期 |
| status | VARCHAR(32) | ACTIVE、LEFT、SUSPENDED |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

索引：

- `uk_member_user(user_id)`
- `idx_member_department(department_id)`

#### `club_department_leader`

用途：保存部门负责人关系。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 主键 |
| department_id | BIGINT | 部门 ID |
| user_id | BIGINT | 负责人用户 ID |
| assigned_by | BIGINT | 任命人 ID |
| assigned_at | DATETIME | 任命时间 |
| status | VARCHAR(32) | ACTIVE、REMOVED |

索引：

- `uk_department_leader(department_id, user_id)`
- `idx_department_leader_user(user_id)`

拆表原因：

- `sys_user` 是账号，`club_member` 是社团成员身份，二者生命周期不同。注册用户不一定是社团成员。
- 部门负责人不是简单字段，因为一个部门可能有多个负责人，一个人也可能负责多个部门，所以需要 `club_department_leader`。
- 部门表独立后，活动、成员、审核都可以按部门做数据范围控制。

### 6.3 活动

#### `activity`

用途：保存正式活动数据。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 活动 ID |
| title | VARCHAR(128) | 活动标题 |
| type | VARCHAR(64) | 活动类型 |
| cover_url | VARCHAR(512) | 封面图 |
| summary | VARCHAR(512) | 简介 |
| content | TEXT | 详情 |
| department_id | BIGINT | 所属部门 |
| creator_id | BIGINT | 创建人 |
| location | VARCHAR(255) | 地点 |
| start_time | DATETIME | 活动开始时间 |
| end_time | DATETIME | 活动结束时间 |
| registration_start_time | DATETIME | 报名开始时间 |
| registration_end_time | DATETIME | 报名结束时间 |
| capacity | INT | 人数上限 |
| registered_count | INT | 已报名人数 |
| visibility | VARCHAR(32) | PUBLIC、LOGIN_ONLY、MEMBER_ONLY |
| need_review | TINYINT | 是否需要审核 |
| status | VARCHAR(32) | DRAFT、PENDING、PUBLISHED、CANCELLED、ENDED |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |
| deleted | TINYINT | 逻辑删除 |

索引：

- `idx_activity_status_time(status, start_time)`
- `idx_activity_department(department_id)`
- `idx_activity_creator(creator_id)`
- `idx_activity_registration_time(registration_start_time, registration_end_time)`

#### `activity_registration`

用途：保存活动报名记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 报名 ID |
| activity_id | BIGINT | 活动 ID |
| user_id | BIGINT | 用户 ID |
| status | VARCHAR(32) | REGISTERED、CANCELLED、CHECKED_IN |
| registered_at | DATETIME | 报名时间 |
| cancelled_at | DATETIME | 取消时间 |
| check_in_at | DATETIME | 签到时间 |

索引：

- `uk_activity_user(activity_id, user_id)`
- `idx_registration_user(user_id)`
- `idx_registration_activity_status(activity_id, status)`

#### `activity_change_request`

用途：保存活动新增、修改、取消申请。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 申请 ID |
| request_type | VARCHAR(32) | CREATE、UPDATE、CANCEL |
| activity_id | BIGINT | 目标活动 ID，新增时可为空 |
| applicant_id | BIGINT | 申请人 |
| department_id | BIGINT | 所属部门 |
| change_snapshot | JSON | 申请变更内容快照 |
| reason | VARCHAR(512) | 申请原因 |
| status | VARCHAR(32) | PENDING、APPROVED、REJECTED、WITHDRAWN |
| reviewed_by | BIGINT | 审核人 |
| reviewed_at | DATETIME | 审核时间 |
| review_comment | VARCHAR(512) | 审核意见 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

索引：

- `idx_change_request_status_department(status, department_id)`
- `idx_change_request_applicant(applicant_id)`
- `idx_change_request_activity(activity_id)`

#### `activity_review_log`

用途：保存审核动作日志。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 日志 ID |
| request_id | BIGINT | 申请 ID |
| reviewer_id | BIGINT | 审核人 |
| action | VARCHAR(32) | APPROVE、REJECT、WITHDRAW |
| comment | VARCHAR(512) | 备注 |
| created_at | DATETIME | 创建时间 |

索引：

- `idx_review_log_request(request_id)`
- `idx_review_log_reviewer(reviewer_id)`

#### `activity_ticket_order`

用途：保存抢票类活动的票据结果。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 票据 ID |
| activity_id | BIGINT | 活动 ID |
| user_id | BIGINT | 用户 ID |
| order_no | VARCHAR(64) | 票据编号 |
| status | VARCHAR(32) | SUCCESS、CANCELLED、EXPIRED |
| source | VARCHAR(32) | NORMAL、SECKILL |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

索引：

- `uk_ticket_activity_user(activity_id, user_id)`
- `uk_ticket_order_no(order_no)`
- `idx_ticket_user(user_id)`

拆表原因：

- `activity` 保存正式线上活动，`activity_change_request` 保存待审核变更，避免草稿或待审核内容污染正式活动。
- `activity_registration` 独立出来，因为一个活动有大量报名记录，和活动主表是一对多关系。
- `activity_review_log` 独立出来，因为审核日志是追加型数据，不能覆盖申请表上的最终结果。
- `activity_ticket_order` 独立出来，便于抢票和普通报名分开扩展。后期票据量大时可以单独归档。

### 6.4 优惠券

#### `coupon_batch`

用途：保存优惠券批次。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 批次 ID |
| name | VARCHAR(128) | 优惠券名称 |
| type | VARCHAR(64) | 类型 |
| description | VARCHAR(512) | 描述 |
| total_stock | INT | 总库存 |
| remaining_stock | INT | 剩余库存 |
| per_user_limit | INT | 每人限领数量 |
| receive_start_time | DATETIME | 领取开始时间 |
| receive_end_time | DATETIME | 领取结束时间 |
| valid_start_time | DATETIME | 有效开始时间 |
| valid_end_time | DATETIME | 有效结束时间 |
| target_role | VARCHAR(64) | 可领取角色，可为空 |
| target_department_id | BIGINT | 可领取部门，可为空 |
| status | VARCHAR(32) | DRAFT、ACTIVE、OFFLINE、EXPIRED |
| created_by | BIGINT | 创建人 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

索引：

- `idx_coupon_batch_status_time(status, receive_start_time, receive_end_time)`
- `idx_coupon_batch_creator(created_by)`

#### `user_coupon`

用途：保存用户实际领取到的券。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 用户券 ID |
| batch_id | BIGINT | 批次 ID |
| user_id | BIGINT | 用户 ID |
| status | VARCHAR(32) | UNUSED、USED、EXPIRED |
| received_at | DATETIME | 领取时间 |
| used_at | DATETIME | 使用时间 |
| expired_at | DATETIME | 过期时间 |

索引：

- `uk_user_coupon_batch(user_id, batch_id)`
- `idx_user_coupon_status(user_id, status)`
- `idx_user_coupon_batch(batch_id)`

#### `coupon_use_record`

用途：保存优惠券使用或核销记录。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 记录 ID |
| user_coupon_id | BIGINT | 用户券 ID |
| user_id | BIGINT | 用户 ID |
| used_by | BIGINT | 核销人 |
| use_scene | VARCHAR(64) | 使用场景 |
| remark | VARCHAR(512) | 备注 |
| created_at | DATETIME | 创建时间 |

索引：

- `idx_coupon_use_user_coupon(user_coupon_id)`
- `idx_coupon_use_user(user_id)`
- `idx_coupon_use_time(created_at)`

拆表原因：

- `coupon_batch` 是发放规则和库存，`user_coupon` 是用户实际资产，不能混在一张表。
- `coupon_use_record` 是审计记录，必须追加保存，不能只在 `user_coupon` 上覆盖状态。
- 优惠券领取是高频写入场景，用户券表后期可以按时间或用户 ID 做归档。

### 6.5 系统、日志与配置

#### `system_config`

用途：保存系统开关和配置。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 配置 ID |
| config_key | VARCHAR(128) | 配置键，唯一 |
| config_value | TEXT | 配置值 |
| description | VARCHAR(255) | 描述 |
| updated_by | BIGINT | 更新人 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

#### `assistant_faq`

用途：保存智能助手可检索的常见问题知识库，用于在 AI 不可用或需要可控答案时提供兜底回复和引用来源。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | FAQ ID |
| question | VARCHAR(255) | 问题 |
| answer | TEXT | 答案 |
| category | VARCHAR(50) | 分类，例如 membership、activity、coupon、rbac |
| enabled | TINYINT | 是否启用 |
| created_at | DATETIME | 创建时间 |
| updated_at | DATETIME | 更新时间 |

索引：

- `idx_assistant_faq_enabled_category(enabled, category)`

#### `operation_log`

用途：保存管理后台关键操作日志。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 日志 ID |
| user_id | BIGINT | 操作人 |
| module | VARCHAR(64) | 模块 |
| action | VARCHAR(64) | 动作 |
| target_id | BIGINT | 目标 ID |
| detail | JSON | 操作详情 |
| ip | VARCHAR(64) | IP |
| user_agent | VARCHAR(512) | User-Agent |
| created_at | DATETIME | 创建时间 |

索引：

- `idx_operation_log_user_time(user_id, created_at)`
- `idx_operation_log_module_time(module, created_at)`

#### `api_access_log`

用途：保存 API 访问日志，用于后台面板和排查问题。

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| id | BIGINT PK | 日志 ID |
| user_id | BIGINT | 用户 ID，可为空 |
| method | VARCHAR(16) | HTTP 方法 |
| path | VARCHAR(255) | 请求路径 |
| status_code | INT | 响应状态码 |
| cost_ms | INT | 耗时 |
| ip | VARCHAR(64) | IP |
| created_at | DATETIME | 创建时间 |

索引：

- `idx_api_access_time(created_at)`
- `idx_api_access_path_time(path, created_at)`
- `idx_api_access_user_time(user_id, created_at)`

拆表原因：

- `system_config` 是低频配置数据。
- `assistant_faq` 是智能助手知识库数据，和业务主表解耦，便于独立维护、启停和扩展分类。
- `operation_log` 是关键业务操作审计。
- `api_access_log` 是高频访问数据，增长速度远高于其他业务表，必须独立，后期适合按月归档。

## 7. 分表规划与原因

### 7.1 逻辑拆表

当前阶段主要做逻辑拆表，即按业务边界拆成多张关系表。

| 拆分方向 | 表 | 原因 |
| --- | --- | --- |
| 账号与成员身份拆分 | `sys_user`、`club_member` | 注册用户不一定是社团成员，生命周期不同 |
| 权限关系拆分 | `sys_user_role`、`sys_role_permission` | 支持多角色、多权限，避免用户表字段膨胀 |
| 正式活动与申请拆分 | `activity`、`activity_change_request` | 避免待审核内容影响线上活动 |
| 报名记录拆分 | `activity_registration` | 活动主表是一，报名记录是多，写入频率不同 |
| 审核日志拆分 | `activity_review_log` | 审核动作需要追加追踪，不能只保存最终状态 |
| 优惠券批次与用户资产拆分 | `coupon_batch`、`user_coupon` | 发放规则和用户持有记录生命周期不同 |
| 使用记录拆分 | `coupon_use_record` | 使用核销需要审计追踪 |
| 智能助手知识库拆分 | `assistant_faq` | FAQ 是可运营内容，不应硬编码在服务代码里 |
| 访问日志拆分 | `api_access_log` | 日志增长快，避免拖慢核心业务表 |

### 7.2 暂不做物理分库分表的原因

MVP 阶段不建议立刻做分库分表，原因：

- 项目早期数据量有限，单库单表可以支撑开发和演示。
- 过早分库分表会增加事务、查询、分页和联调复杂度。
- 当前更重要的是把表关系、索引、权限边界设计清楚。
- 后续可以通过归档、冷热分离、缓存和读写优化逐步扩展。

### 7.3 后期适合按时间归档或分表的表

| 表 | 触发条件 | 分表或归档策略 |
| --- | --- | --- |
| `api_access_log` | 日志达到百万级或查询变慢 | 按月归档，例如 `api_access_log_2026_05` |
| `operation_log` | 审计日志长期累积 | 按季度或半年归档 |
| `activity_registration` | 报名记录增长明显 | 按活动 ID 范围或活动年份归档 |
| `user_coupon` | 用户券记录增长明显 | 按用户 ID 哈希或领取年份归档 |
| `coupon_use_record` | 核销记录增长明显 | 按月份归档 |
| `activity_ticket_order` | 抢票场景高频写入 | 按活动 ID 或时间分表 |

### 7.4 热点数据缓存策略

| 数据 | Redis Key 示例 | 原因 |
| --- | --- | --- |
| 活动详情 | `activity:detail:{activityId}` | 活动详情读多写少 |
| 活动剩余名额 | `activity:stock:{activityId}` | 报名和抢票需要快速扣减 |
| 用户是否报名 | `activity:registered:{activityId}:{userId}` | 防止重复报名 |
| 优惠券库存 | `coupon:stock:{batchId}` | 高并发领取时避免直接打 MySQL |
| 用户是否领券 | `coupon:received:{batchId}:{userId}` | 防止重复领取 |
| 登录用户权限 | `user:permissions:{userId}` | 减少每次鉴权查库 |

## 8. 推荐后端模块划分

```text
backend/src/main/java/com/backend/
  common/
    config/
    exception/
    response/
    security/
    util/
  auth/
  user/
  role/
  permission/
  department/
  member/
  activity/
  coupon/
  dashboard/
  assistant/
  log/
  system/
```

模块说明：

- `auth`：登录、注册、JWT、当前用户。
- `user`：用户资料和账号状态。
- `role`、`permission`：RBAC 权限管理。
- `department`、`member`：组织结构和成员身份。
- `activity`：活动、报名、抢票、审核。
- `coupon`：优惠券批次、领取、核销。
- `dashboard`：统计指标。
- `assistant`：智能助手、FAQ 检索、AI 兜底和使用限制。
- `log`：操作日志和访问日志。
- `system`：配置和系统维护。

## 9. 推荐前端页面顺序

1. `/login`、`/register`
2. `/`
3. `/activities`
4. `/activities/:id`
5. `/user/profile`
6. `/user/registrations`
7. `/admin`
8. `/admin/departments`
9. `/admin/members`
10. `/admin/activities`
11. `/admin/reviews`
12. `/admin/coupons`
13. `/admin/dashboard`

原因：

- 先做登录注册，前后端联调基础最早打通。
- 再做公开活动页，可以快速看到产品雏形。
- 最后做后台管理和数据面板，因为它们依赖前面的用户、权限、活动、报名数据。

## 10. MVP 最小数据库范围

如果时间有限，MVP 阶段至少完成以下表：

- `sys_user`
- `sys_role`
- `sys_permission`
- `sys_user_role`
- `sys_role_permission`
- `club_department`
- `club_member`
- `club_department_leader`
- `activity`
- `activity_registration`
- `activity_change_request`
- `activity_review_log`

优惠券、抢票、访问日志可以放到第二阶段。若启用智能助手功能，还必须同步创建 `assistant_faq` 表并初始化基础 FAQ 数据。

## 11. 风险与注意事项

1. 权限不要只按角色判断，还要考虑部门范围。例如部门负责人只能管理本部门数据。
2. 报名和抢票要用唯一索引防止重复参与，不能只靠代码判断。
3. 活动名额扣减需要事务保护，秒杀阶段再用 Redis Lua 做预扣。
4. 活动修改申请建议用 JSON 快照保存变更内容，但正式活动表仍然保持结构化字段。
5. 访问日志不要在请求主链路中做复杂统计，统计任务可以异步或定时执行。
6. 数据库字段状态值要和 Java 枚举保持一致，避免出现魔法字符串。
7. 新增功能表后必须保证初始化 SQL、Flyway 迁移文件和当前数据库状态一致，避免代码查询不存在的表。例如启用 Assistant 功能时必须执行 `V2__create_assistant_faq.sql`。

## 12. 建议下一步

1. 先根据本文创建数据库初始化 SQL，并统一通过 Flyway 执行迁移。
2. 补充后端统一响应、异常处理、基础包结构。
3. 实现 `sys_user` 注册登录。
4. 实现 RBAC 权限表和初始化数据。
5. 再进入部门、成员、活动模块。
