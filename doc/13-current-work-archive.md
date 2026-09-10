# 当前工作存档

## 2026-09-10 更新

以下内容为最新状态，覆盖本文件下方 2026-08-24 存档的"当前做到哪一步"部分；08-24 存档保留为历史记录，不原地改写。

### 当前做到哪一步

V5 深色画廊原型已完成，并已迁移到 `project/frontend/` 的 Vue 3 正式前端；Java 后端在本地 MySQL 8.0 上完成从零迁移验证。当前处于"补齐后端审核发布链路与录入真实内容"前。

### 本轮完成

- V5 信息架构收敛：主线改为代表项目，大学新闻网归入代表项目，去掉用占位卡凑数的剪辑作品。
- V5 原型迁移到 Vue 正式前端，截图迁入 `project/frontend/public/assets/v5/`。
- AI Translator 对外展示名改为 LexiFlow（ADR-013）。
- 修复 V2 迁移丢失事故：复建迁移文件、清空无数据的本地库并从零执行 V1 → V2 → V3，
  移除 `ignore-migration-patterns` 兜底。详见 `doc/21-migration-incident-and-recovery.md`。
- 停止跟踪 `project/frontend/dist/` 构建产物。

### 已验证

- 前端 `vite build` 通过，正确产出 4 张 v5 截图。
- 后端在无任何 ignore 配置下启动成功；Flyway 从零迁移、重复启动幂等（`No migration necessary`）。
- V1 校验和 `1881988467`、V3 校验和 `1707037090` 与事故前记录一致；重建后 schema 与重建前一致。
- `/api/health`、`/api/public/projects`、`/api/public/learning-summaries` 返回 200；管理员登录错误口令 401、空口令 400、无令牌写入 401。

### 待验证

- 后端审核发布链路尚未实现：approve、reject、publish、unpublish、审计事件。
- 公开知识节点接口未过滤 `published`；revision number 硬编码为 1。
- 数据库接口读写、事务回滚和测试库隔离尚未验证。
- 正式前端与 V5 原型的浏览器级交互和响应式验收记录待补。
- `projects` 表为空，公开页面当前使用前端回退数据，三个真实项目均未录入。
- 尚未推送远程仓库。

### 本地数据库

本地 MySQL 8.0 的 `personal_portfolio` 库已于 2026-09-10 由 Flyway 从零重建，7 张表，业务数据为空。
重建前的 schema 指纹与 Flyway 历史作为事故证据保留在 `doc/21`。

---

## 2026-08-24 存档

存档时间：2026-08-24

## 当前做到哪一步

项目已完成设计、原型和本地全栈基础纵向切片，当前处于“真实内容接入与浏览器验收”前。

作品集是稳定展示平台；未来测试/实验平台必须独立创建，不与作品集共享运行时、数据库或部署流程。

## 已完成

- 完成项目章程、PRD、信息架构、数据模型、安全、测试和交付路线文档。
- 完成并确认高保真原型，已迁移到实际 Vue 前端，不再以原型页面作为另一个运行入口。
- 前端使用 Vue 3 + Vite，开发端口为 `1001`。
- 后端使用 FastAPI + SQLAlchemy，开发端口为 `2001`。
- 开发环境使用 SQLite，已配置 Alembic；旧 SQLite 库采用 `stamp 0001_baseline` 后再 `upgrade head` 的非破坏性迁移策略。
- 实现公开项目、知识节点、学习摘要和健康检查接口。
- 实现 JWT 管理员登录、项目创建/编辑、修订、送审、通过、发布、下线和审计查询基础流程。
- 公开内容与草稿/管理内容分离，已发布内容不能被编辑操作直接覆盖。
- 后端自动化测试已通过 `8 passed`；前端 Vite 构建已通过；后端健康检查和公开项目接口 HTTP smoke 已通过。
- 前端默认项目顺序为：合作项目 → AI Second Brain → AI Translator。

## 当前本地版本

最近业务阶段提交：

```text
5e008cd feat: bring portfolio prototype into running app
0e7f695 feat: migrate portfolio prototype into Vue page
1bbc54c test: complete migration and workflow acceptance
7894f4c fix: preserve legacy sqlite during alembic upgrades
86fefd8 feat: add migrations audit logging and admin console
```

本次存档会额外生成一个本地 Git 提交，用于记录归档文档与数据库备份元数据。

## 已保存内容

- 前端源码：`project/frontend/src/`、`package.json`、`package-lock.json`、`vite.config.js`。
- 后端源码：`project/backend/app/`、`tests/`、`alembic/`、`requirements.txt`、`alembic.ini`。
- 设计与工程文档：`doc/`。
- 高保真原型：`prototype/index.html`。
- 本地数据库备份：`archive/backups/`，该目录被 Git 忽略，不能上传远程仓库。

## 数据库备份记录

来源数据库：`project/backend/portfolio.db`

```text
备份文件：archive/backups/portfolio-20260824-174933.db
备份方式：SQLite online backup API（非破坏性一致性备份）
文件大小：49152 bytes
SHA-256：998761694e83b34fbf4a3d5c710a8fe6adc453929eae3500eb8a3cda497d1715
```

备份文件已核验存在且摘要一致。该备份仅用于本地恢复，不纳入 Git。

## 待验证

- 使用真实浏览器完成首页、项目详情抽屉、知识节点、移动端菜单、管理端登录和发布流程验收。
- 录入真实项目前，逐个完成版本、授权、密钥、日志、截图、依赖、运行方式和贡献边界审查。
- 验证管理端页面的完整 CRUD、审核、发布和错误状态。
- 确认公开 API 使用真实已发布数据后，项目详情、知识网络与学习摘要的内容完整性。
- 完成 Gitee 推送前的秘密扫描、依赖扫描和最终人工检查。

## 已知风险

- 当前公开前端使用安全回退数据和空状态；三个真实项目尚未录入。
- `project/frontend/dist/` 是构建产物，已有历史跟踪文件会显示差异；它已被忽略，不应作为源码提交或手工删除。
- 默认管理员配置仅可用于本地开发；公开部署前必须用环境变量替换管理员密码和 JWT 密钥。
- 当前未完成生产部署、远程推送和浏览器自动化验收。

## 下一步建议

1. 先完成浏览器验收，修复页面内容密度、排序、响应式或交互问题。
2. 以合作项目为第一份归档材料，完成贡献边界和公开授权审查。
3. 建立每个旧项目的审查包，再录入真实项目详情、证据和运行说明。
4. 补齐管理端编辑体验与知识网络图谱/列表正式展示。
5. 通过测试和安全检查后，人工确认并推送到 Gitee。

## 本地运行

后端在 `project/backend` 启动：

```powershell
..\..\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 127.0.0.1 --port 2001
```

前端在 `project/frontend` 启动：

```powershell
C:\nvm\v22.19.0\node.exe node_modules\vite\bin\vite.js --host 127.0.0.1 --port 1001
```

访问：`http://127.0.0.1:1001`。
