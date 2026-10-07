# Eventbrite 独立 PoC

更新：2026-09-29。用户已验证本地真实活动读取并反馈功能测试完成，云端截图确认活动标题与图片展示；完整特殊情况、云端恢复及 React 整合尚未完成。证据与剩余验收以 [项目状态](../../context/project-status.md) 为准。

- 测试站：https://csa-events.unswcsa-exec.workers.dev
- `GET /api/events` 返回公开活动；`GET /api/events/:id` 仅返回同一公开集合内的详情。
- 页面 `/` 是列表，`/events/:id` 是详情。标题、简短介绍、图片、时间、地点、状态及报名链接来自 Eventbrite；完整介绍通过外链查看，不渲染上游 HTML。
- 排除其他组织、未公开、仅邀请、草稿及系列父活动；未提供完整重复场次或延期处理的验收结论。
- 分页全部成功才返回结果，最多 20 页；分页失败、超限、配置或请求错误均返回 503。成功零条才显示空状态，未公开或不存在的详情返回 404。
- 凭据只在服务端读取，响应采用字段白名单；诊断日志仅输出固定错误分类，不输出原始上游响应和凭据。

## 本地配置

在 `cloud` 目录执行下列命令。查询组织 ID 的命令适用于 macOS zsh，读取输入时不回显：

```sh
read -s "eventbrite_token?Eventbrite Private Token: "
printf '%s' "$eventbrite_token" | node events/organizations.mjs
unset eventbrite_token
```

把对应 CSA 的组织 ID（不是 organizer profile ID）及 Private Token 写入 `cloud/events/.dev.vars`：

```dotenv
EVENTBRITE_PRIVATE_TOKEN=replace-with-private-token
EVENTBRITE_ORGANIZATION_ID=replace-with-organization-id
```

该文件由 Git 忽略，不提交、截图或发送 Token。启动和检查：

```sh
npm run dev:events
npm test
npm run check:events
```

`check:events` 只打包不部署。兼容日期为 `2026-09-28`，适配当前本地运行时；不要直接改为超过运行时支持范围的日期。

## 云端部署

```sh
npm run deploy:events
```

部署目标是独立 `csa-events`，不覆盖内容后台。随后在该 Worker 的 Production 环境中设置普通变量 `EVENTBRITE_ORGANIZATION_ID` 和 Secret `EVENTBRITE_PRIVATE_TOKEN`，保存并部署。本地 `.dev.vars` 不自动上传；`keep_vars` 保留 Dashboard 普通变量。公开活动 Worker 不需要内容后台的 Access 登录。

代码仓库的现有 Actions 不部署此 Worker。向 main 推送 `cloud/**` 修改会触发原内容 Pages 发布流程（启用发布开关时）；它使用已发布内容，不发布私有草稿。

## 自动刷新及验收边界

页面每 60 秒请求一次，返回前台时也请求；Worker 按需读取，不运行后台 Cron。实例内成功缓存 30 秒、失败缓存 10 秒，并合并并发读取；不跨实例共享，不保证全局请求频率。成功缓存过期后读取失败不继续返回旧数据。上游分页读取设 20 秒超时，页面请求超时 25 秒；休眠标签、网络等会影响实际恢复时间，尚未承诺恢复 SLA。

- 已验证：本地真实读取、用户反馈的本地功能测试、独立 Worker 云端展示。
- 自动测试：私有数据过滤、分页与失败、并发读取、空结果区分、缓存过期后的失败恢复。
- 待验证：云端列表/详情/筛选/跳转逐项确认、取消/延期/缺图/缺地点/重复场次、夏令时、真实故障自动恢复、配额及内容发布隔离。
- 待实现/设计：React Event Source 与六页官网整合、详情 SEO/分享方案；该原生 JS 测试页不是正式官网。

故障演练可在页面骨架之后集中完成，但正式上线前要补齐；已知凭据或隐私问题立即处理。项目仍处于 Step 3，不把云端展示成功等同于完整 PoC 验收。

2026-10-05：新版 React 全部活动已通过同源代理接入本 Worker 的公开列表接口，详见 `../../frontend/site/README.md`。本站原生 JS PoC 与详情端点保留，新官网不使用站内详情。本轮未部署或修改本 Worker。
