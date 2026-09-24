# JMeter API 测试计划

> 文档范围（2026-09-24）：本文保留旧完整平台的说明、规划或历史记录，不作为新版需求及实施进度依据。新版以 [context 文档入口](../context/README.md) 为准，六个页面方案已确认；第二阶段需求冻结已完成；新版采用自建 /admin、GitHub 内容文件与自动构建发布，Eventbrite 独立提供活动，草稿私有保存、预览和未发布新图片受保护，下一步进行数据源 PoC；最新进度见 context/project-status.md。

本文档用于配置 JMeter 压力测试 / QPS 测试。所有接口路径基于当前后端实际 Controller。

基础地址：

```text
http://localhost:8080/api
```

建议在 JMeter 的 `User Defined Variables` 中配置：

| 变量名 | 示例值 | 说明 |
|---|---|---|
| `protocol` | `http` | 协议 |
| `host` | `localhost` | 后端地址 |
| `port` | `8080` | 后端端口 |
| `basePath` | `/api` | 后端 context path |
| `token` | 空 | 登录后提取 |
| `activityId` | `1` | 活动 ID |
| `batchId` | `1` | 优惠券批次 ID |
| `departmentId` | `1` | 部门 ID |
| `userId` | `2` | 用户 ID |
| `userCouponId` | `1` | 用户优惠券 ID |

HTTP Request Defaults：

| 字段 | 值 |
|---|---|
| Protocol | `${protocol}` |
| Server Name or IP | `${host}` |
| Port Number | `${port}` |
| Path | 留空，单个请求里写完整 `${basePath}/xxx` |
| Connect Timeout | `5000` |
| Response Timeout | `15000` |

## 通用消息头

### 无请求体接口

用于 GET、无 body 的 PATCH/POST/DELETE：

| Name | Value |
|---|---|
| `Accept` | `application/json` |

### JSON 请求体接口

用于 POST/PUT/PATCH 且 Body Data 是 JSON：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |

### 需要登录的接口

额外增加：

| Name | Value |
|---|---|
| `Authorization` | `Bearer ${token}` |

如果 token 来自 setUp Thread Group 并写入 JMeter property：

| Name | Value |
|---|---|
| `Authorization` | `Bearer ${__property(token)}` |

## 获取 Token

接口：

| 项 | 值 |
|---|---|
| Method | `POST` |
| Path | `${basePath}/auth/login` |
| Headers | `Accept: application/json`, `Content-Type: application/json;charset=UTF-8` |

Body Data：

```json
{
  "username": "root",
  "password": "12345678"
}
```

JSON Extractor：

| 字段 | 值 |
|---|---|
| Names of created variables | `token` |
| JSON Path expressions | `$.data.accessToken` |
| Match No. | `1` |

如果要跨线程组共享 token，添加 JSR223 PostProcessor：

```groovy
props.put('token', vars.get('token'))
```

后续接口的 Authorization 写：

```text
Bearer ${__property(token)}
```

## Activities 接口

### 1. 公开活动列表

| 项 | 值 |
|---|---|
| 接口 | 活动列表 |
| Method | `GET` |
| Path | `${basePath}/activities` |
| 是否登录 | 否 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |

Query 参数：

| 参数名 | 是否必填 | 示例 | 说明 |
|---|---|---|---|
| `keyword` | 否 | `AI` | 标题/简介关键词 |
| `category` | 否 | `technology` | 活动分类 |
| `sort` | 否 | `upcoming` | 排序，默认 `upcoming` |
| `page` | 否 | `1` | 页码 |
| `size` | 否 | `10` | 每页数量 |

JMeter Path 示例：

```text
${basePath}/activities?keyword=&category=&sort=upcoming&page=1&size=10
```

Body：

```text
无
```

断言：

| 类型 | 配置 |
|---|---|
| Response Code | `200` |
| JSON Assertion | `$.code == 0` |
| JSON Assertion | `$.data.records` 存在 |

压测建议：

| 参数 | 建议值 |
|---|---:|
| Threads | `100` |
| Ramp-up | `60s` |
| Duration | `5-10m` |
| Throughput | `3000/min` |

### 2. 公开活动详情

| 项 | 值 |
|---|---|
| 接口 | 活动详情 |
| Method | `GET` |
| Path | `${basePath}/activities/${activityId}` |
| 是否登录 | 否 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |

Path 参数：

| 参数名 | 示例 | 说明 |
|---|---|---|
| `activityId` | `1` | 活动 ID |

Query 参数：

```text
无
```

Body：

```text
无
```

断言：

| 类型 | 配置 |
|---|---|
| Response Code | `200` |
| JSON Assertion | `$.code == 0` |
| JSON Assertion | `$.data.id` 存在 |

压测建议：

| 参数 | 建议值 |
|---|---:|
| Threads | `100` |
| Ramp-up | `60s` |
| Throughput | `3000/min` |

### 3. 管理活动列表

| 项 | 值 |
|---|---|
| 接口 | 管理活动列表 |
| Method | `GET` |
| Path | `${basePath}/activities/manage` |
| 是否登录 | 是 |
| 权限 | `activity:create` / `activity:update` / `activity:review` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

Query 参数：

| 参数名 | 是否必填 | 示例 | 说明 |
|---|---|---|---|
| `keyword` | 否 | `AI` | 关键词 |
| `category` | 否 | `technology` | 分类 |
| `status` | 否 | `PUBLISHED` | 活动状态 |
| `sort` | 否 | `latest` | 排序，默认 `latest` |
| `page` | 否 | `1` | 页码 |
| `size` | 否 | `10` | 每页数量 |

JMeter Path 示例：

```text
${basePath}/activities/manage?keyword=&category=&status=PUBLISHED&sort=latest&page=1&size=10
```

Body：

```text
无
```

断言：

| 类型 | 配置 |
|---|---|
| Response Code | `200` |
| JSON Assertion | `$.code == 0` |

### 4. 管理活动详情

| 项 | 值 |
|---|---|
| 接口 | 管理活动详情 |
| Method | `GET` |
| Path | `${basePath}/activities/manage/${activityId}` |
| 是否登录 | 是 |
| 权限 | `activity:create` / `activity:update` / `activity:review` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

Path 参数：

| 参数名 | 示例 |
|---|---|
| `activityId` | `1` |

Body：

```text
无
```

### 5. 创建活动

| 项 | 值 |
|---|---|
| 接口 | 创建活动 |
| Method | `POST` |
| Path | `${basePath}/activities` |
| 是否登录 | 是 |
| 权限 | `activity:create` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |
| `Authorization` | `Bearer ${token}` |

Query 参数：

```text
无
```

Body Data：

```json
{
  "title": "JMeter 压测活动 ${__time()}",
  "summary": "performance test activity",
  "detail": "created by jmeter",
  "category": "technology",
  "categoryName": "技术活动",
  "imageUrl": "https://example.com/activity.jpg",
  "location": "A101",
  "startTime": "2026-06-01T10:00:00",
  "endTime": "2026-06-01T12:00:00",
  "capacity": 100,
  "requiredRoleCode": null
}
```

Body 字段说明：

| 字段 | 类型 | 是否建议填写 | 示例 |
|---|---|---|---|
| `title` | string | 是 | `JMeter 压测活动` |
| `summary` | string | 是 | `performance test activity` |
| `detail` | string | 是 | `created by jmeter` |
| `category` | string | 是 | `technology` |
| `categoryName` | string | 是 | `技术活动` |
| `imageUrl` | string | 否 | `https://example.com/activity.jpg` |
| `location` | string | 是 | `A101` |
| `startTime` | datetime | 是 | `2026-06-01T10:00:00` |
| `endTime` | datetime | 是 | `2026-06-01T12:00:00` |
| `capacity` | number | 是 | `100` |
| `requiredRoleCode` | string/null | 否 | `CLUB_MEMBER` |

断言：

| 类型 | 配置 |
|---|---|
| Response Code | `200` |
| JSON Assertion | `$.code == 0` |
| JSON Assertion | `$.data.id` 存在 |

压测建议：

| 参数 | 建议值 |
|---|---:|
| Threads | `20` |
| Ramp-up | `20s` |
| Throughput | `300/min` |

注意：

- 写接口会产生测试数据。
- 建议标题加入 `${__time()}` 或 `${__UUID()}`，避免重复数据难以识别。

### 6. 更新活动

| 项 | 值 |
|---|---|
| 接口 | 更新活动 |
| Method | `PUT` |
| Path | `${basePath}/activities/${activityId}` |
| 是否登录 | 是 |
| 权限 | `activity:update` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |
| `Authorization` | `Bearer ${token}` |

Path 参数：

| 参数名 | 示例 |
|---|---|
| `activityId` | `1` |

Body Data：

```json
{
  "title": "JMeter 更新活动 ${__time()}",
  "summary": "updated summary",
  "detail": "updated by jmeter",
  "category": "technology",
  "categoryName": "技术活动",
  "imageUrl": "https://example.com/activity.jpg",
  "location": "A102",
  "startTime": "2026-06-01T13:00:00",
  "endTime": "2026-06-01T15:00:00",
  "capacity": 120,
  "requiredRoleCode": null
}
```

注意：

- 不建议大量线程同时更新同一个 `activityId`，否则结果互相覆盖。
- 如果要压测更新能力，准备多个活动 ID，用 CSV 分配。

### 7. 提交审核

| 项 | 值 |
|---|---|
| 接口 | 提交活动审核 |
| Method | `PATCH` |
| Path | `${basePath}/activities/${activityId}/submit` |
| 是否登录 | 是 |
| 权限 | `activity:create` / `activity:update` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

Body：

```text
无
```

注意：

- 该接口受活动状态限制。
- 不适合对同一个活动重复高并发调用。

### 8. 发布活动

| 项 | 值 |
|---|---|
| 接口 | 发布活动 |
| Method | `PATCH` |
| Path | `${basePath}/activities/${activityId}/publish` |
| 是否登录 | 是 |
| 权限 | `activity:review` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

Body：

```text
无
```

### 9. 取消活动

| 项 | 值 |
|---|---|
| 接口 | 取消活动 |
| Method | `PATCH` |
| Path | `${basePath}/activities/${activityId}/cancel` |
| 是否登录 | 是 |
| 权限 | `activity:cancel` / `activity:review` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

Body：

```text
无
```

### 10. 结束活动

| 项 | 值 |
|---|---|
| 接口 | 结束活动 |
| Method | `PATCH` |
| Path | `${basePath}/activities/${activityId}/finish` |
| 是否登录 | 是 |
| 权限 | `activity:review` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

Body：

```text
无
```

### 11. 活动报名

| 项 | 值 |
|---|---|
| 接口 | 活动报名 |
| Method | `POST` |
| Path | `${basePath}/activities/${activityId}/registrations` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

Path 参数：

| 参数名 | 示例 | 说明 |
|---|---|---|
| `activityId` | `1` | 已发布活动 ID |

Body：

```text
无
```

断言：

| 类型 | 配置 |
|---|---|
| Response Code | `200` |
| JSON Assertion | `$.code == 0` |

压测建议：

| 参数 | 建议值 |
|---|---:|
| Threads | `50` |
| Ramp-up | `20s` |
| Throughput | `600/min` |

注意：

- 同一个用户对同一个活动只能报名一次。
- 压测报名接口必须准备多个用户 token。
- 活动容量要大于测试用户数，否则错误率会包含业务满员。

### 12. 取消报名

| 项 | 值 |
|---|---|
| 接口 | 取消当前用户报名 |
| Method | `DELETE` |
| Path | `${basePath}/activities/${activityId}/registrations` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

Body：

```text
无
```

### 13. 我的报名列表

| 项 | 值 |
|---|---|
| 接口 | 我的活动报名 |
| Method | `GET` |
| Path | `${basePath}/activities/registrations/me` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

Query 参数：

```text
无
```

Body：

```text
无
```

## Auth 接口

### 注册

| 项 | 值 |
|---|---|
| Method | `POST` |
| Path | `${basePath}/auth/register` |
| 是否登录 | 否 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |

Body：

```json
{
  "username": "test_${__time()}",
  "password": "12345678",
  "nickname": "测试用户",
  "email": "test_${__time()}@example.com"
}
```

### 登录

见“获取 Token”。

### 退出登录

| 项 | 值 |
|---|---|
| Method | `POST` |
| Path | `${basePath}/auth/logout` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

### 当前登录用户

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/auth/me` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

## Users 接口

### 当前用户资料

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/users/me` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

参数：

```text
无
```

### 更新用户资料

| 项 | 值 |
|---|---|
| Method | `PATCH` |
| Path | `${basePath}/users/me` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |
| `Authorization` | `Bearer ${token}` |

Body：

```json
{
  "nickname": "Perf User",
  "email": "perf@example.com"
}
```

### 修改密码

| 项 | 值 |
|---|---|
| Method | `PUT` |
| Path | `${basePath}/users/me/password` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |
| `Authorization` | `Bearer ${token}` |

Body：

```json
{
  "oldPassword": "12345678",
  "newPassword": "12345678"
}
```

## Coupons 接口

### 可领取优惠券列表

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/coupons/batches?keyword=&page=1&size=10` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

Query 参数：

| 参数名 | 示例 |
|---|---|
| `keyword` | 空 |
| `page` | `1` |
| `size` | `10` |

### 管理优惠券批次列表

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/coupons/batches/manage?keyword=&status=ACTIVE&page=1&size=10` |
| 是否登录 | 是 |
| 权限 | `coupon:manage` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

### 创建优惠券批次

| 项 | 值 |
|---|---|
| Method | `POST` |
| Path | `${basePath}/coupons/batches` |
| 是否登录 | 是 |
| 权限 | `coupon:manage` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |
| `Authorization` | `Bearer ${token}` |

Body：

```json
{
  "name": "JMeter 优惠券 ${__time()}",
  "description": "performance test coupon",
  "couponType": "BENEFIT",
  "benefitText": "活动物料券",
  "stock": 1000,
  "claimStartTime": "2026-05-01T00:00:00",
  "claimEndTime": "2026-12-31T23:59:59",
  "expireTime": "2027-01-31T23:59:59",
  "allowedRoleCodes": ["REGISTERED_USER", "CLUB_MEMBER", "DEPARTMENT_LEADER", "PRESIDENT"]
}
```

### 更新优惠券批次

| 项 | 值 |
|---|---|
| Method | `PUT` |
| Path | `${basePath}/coupons/batches/${batchId}` |
| 是否登录 | 是 |

消息头同创建优惠券批次。

### 领取优惠券

| 项 | 值 |
|---|---|
| Method | `POST` |
| Path | `${basePath}/coupons/batches/${batchId}/claim` |
| 是否登录 | 是 |
| 权限 | `coupon:grab` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

Body：

```text
无
```

注意：

- 同一用户同一批次只能领取一次。
- 抢券压测必须使用多用户 token。
- 批次库存要大于测试用户数，否则会产生正常业务失败。

### 我的优惠券

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/coupons/me` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

### 使用优惠券

| 项 | 值 |
|---|---|
| Method | `PATCH` |
| Path | `${basePath}/coupons/me/${userCouponId}/use` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |
| `Authorization` | `Bearer ${token}` |

Body：

```json
{
  "scene": "offline",
  "note": "jmeter use coupon"
}
```

### 我的核销记录

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/coupons/redemptions/me` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

## Organization 接口

### 部门列表

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/organization/departments` |
| 是否登录 | 是 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

### 创建部门

| 项 | 值 |
|---|---|
| Method | `POST` |
| Path | `${basePath}/organization/departments` |
| 权限 | `department:manage` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |
| `Authorization` | `Bearer ${token}` |

Body：

```json
{
  "name": "压测部门 ${__time()}",
  "description": "created by jmeter"
}
```

### 更新部门

| 项 | 值 |
|---|---|
| Method | `PUT` |
| Path | `${basePath}/organization/departments/${departmentId}` |

消息头同创建部门。

Body：

```json
{
  "name": "压测部门更新",
  "description": "updated by jmeter"
}
```

### 启停部门

| 接口 | Method | Path | 消息头 |
|---|---|---|---|
| 停用部门 | `PATCH` | `${basePath}/organization/departments/${departmentId}/disable` | `Accept`, `Authorization` |
| 启用部门 | `PATCH` | `${basePath}/organization/departments/${departmentId}/enable` | `Accept`, `Authorization` |

Body：

```text
无
```

### 成员列表

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/organization/members?departmentId=${departmentId}` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

### 用户分页

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/organization/users?keyword=&departmentId=${departmentId}&page=1&size=10` |

消息头同成员列表。

### 分配成员到部门

| 项 | 值 |
|---|---|
| Method | `POST` |
| Path | `${basePath}/organization/members` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |
| `Authorization` | `Bearer ${token}` |

Body：

```json
{
  "userId": ${userId},
  "departmentId": ${departmentId}
}
```

### 修改成员状态

| 项 | 值 |
|---|---|
| Method | `PATCH` |
| Path | `${basePath}/organization/members/status` |

消息头同分配成员到部门。

Body：

```json
{
  "userId": ${userId},
  "status": "ACTIVE"
}
```

### 负责人列表

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/organization/leaders?departmentId=${departmentId}` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

### 任命负责人 / 移除负责人

| 接口 | Method | Path |
|---|---|---|
| 任命负责人 | `POST` | `${basePath}/organization/leaders` |
| 移除负责人 | `DELETE` | `${basePath}/organization/leaders` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |
| `Authorization` | `Bearer ${token}` |

Body：

```json
{
  "userId": ${userId},
  "departmentId": ${departmentId}
}
```

## RBAC 接口

### 角色列表

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/rbac/roles` |
| 权限 | `department:manage` / `system:maintain` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

### 权限列表

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/rbac/permissions` |
| 权限 | `system:maintain` |

消息头同角色列表。

### 分配用户角色

| 项 | 值 |
|---|---|
| Method | `POST` |
| Path | `${basePath}/rbac/users/roles` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Content-Type` | `application/json;charset=UTF-8` |
| `Authorization` | `Bearer ${token}` |

Body：

```json
{
  "userId": ${userId},
  "roleCodes": ["CLUB_MEMBER"]
}
```

### 分配角色权限

| 项 | 值 |
|---|---|
| Method | `POST` |
| Path | `${basePath}/rbac/roles/permissions` |
| 权限 | `system:maintain` |

消息头同分配用户角色。

Body：

```json
{
  "roleCode": "CLUB_MEMBER",
  "permissionCodes": ["activity:view", "coupon:grab"]
}
```

## Dashboard 接口

### 数据面板

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/dashboard/overview` |
| 是否登录 | 是 |
| 权限 | `PRESIDENT` / `SYSTEM_MAINTAINER` |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |
| `Authorization` | `Bearer ${token}` |

参数：

```text
无
```

说明：

- 该接口后端有 Redis 45 秒缓存。
- 趋势和排行查询汇总表。
- 测试时要区分冷缓存和热缓存。

## Health 接口

### 健康检查

| 项 | 值 |
|---|---|
| Method | `GET` |
| Path | `${basePath}/health` |
| 是否登录 | 否 |

消息头：

| Name | Value |
|---|---|
| `Accept` | `application/json` |

参数：

```text
无
```

## 通用断言

成功响应：

| 类型 | 配置 |
|---|---|
| Response Code | `200` |
| JSON Assertion | `$.code == 0` |

分页接口：

| 类型 | 配置 |
|---|---|
| JSON Assertion | `$.data.records` 存在 |
| JSON Assertion | `$.data.total` 存在 |

登录接口：

| 类型 | 配置 |
|---|---|
| JSON Assertion | `$.data.accessToken` 存在 |

## 压测注意事项

- GET 接口通常不需要 `Content-Type`。
- POST/PUT/PATCH 有 JSON Body 时必须加 `Content-Type: application/json;charset=UTF-8`。
- 需要登录的接口必须带 `Authorization: Bearer <token>`。
- 报名、领券、创建、更新类接口会改变数据库，不建议在生产数据上压测。
- 同一用户重复报名、重复领券会产生业务失败，这不是性能错误。
- 写接口高并发测试建议使用 CSV 准备多用户、多活动、多优惠券批次。
- 不要长时间开启 `View Results Tree`，会影响 JMeter 自身性能。

