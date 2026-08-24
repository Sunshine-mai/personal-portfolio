# API 契约草案

> 技术栈确认后再固化具体路径和字段类型。本文件先锁定接口职责、权限和错误语义。

## 1. 统一响应

```json
{
  "code": 200,
  "message": "success",
  "data": {},
  "requestId": "..."
}
```

业务失败由统一异常处理器返回稳定错误码，不返回堆栈、SQL、密钥或本机路径。

## 2. 公开接口

- `GET /api/public/projects`
- `GET /api/public/projects/{slug}`
- `GET /api/public/knowledge/nodes`
- `GET /api/public/knowledge/graph`
- `GET /api/public/learning-summaries`
- `GET /api/public/methods`
- `GET /api/public/links/{id}/status`

公开接口只能读取已发布内容，必须限制分页、图谱深度和返回数量。

## 3. 管理接口

- `POST /api/admin/auth/login`
- `POST /api/admin/auth/logout`
- `GET /api/admin/projects`
- `POST /api/admin/projects`
- `PUT /api/admin/projects/{id}`
- `POST /api/admin/projects/{id}/submit-review`
- `POST /api/admin/revisions/{id}/approve`
- `POST /api/admin/revisions/{id}/reject`
- `POST /api/admin/revisions/{id}/publish`
- `POST /api/admin/projects/{id}/unpublish`
- `GET /api/admin/publications`
- `GET /api/admin/audit-events`

所有管理写操作需要管理员会话、输入校验、状态校验、资源归属校验和审计记录。

## 4. 错误码

- `VALIDATION_ERROR`
- `AUTHENTICATION_REQUIRED`
- `ACCESS_DENIED`
- `RESOURCE_NOT_FOUND`
- `REVISION_CONFLICT`
- `INVALID_STATE_TRANSITION`
- `REVIEW_REQUIRED`
- `PUBLICATION_GATE_FAILED`
- `EXTERNAL_RESOURCE_UNAVAILABLE`
- `PUBLICATION_FAILED`

## 5. 幂等与并发

- 发布支持幂等键。
- 编辑使用修订号或乐观锁。
- 审核期间内容变更会使原审核失效。
- 重复发布同一修订返回已有结果，不重复创建发布记录。
