# Personal Portfolio Platform

个人工程作品集平台：展示已审查、可追溯、可复现的项目成果、技术决策、验证证据和精选学习摘要。

## 项目边界

- 本项目只负责稳定的成果展示、内容审核与发布。
- 不执行任意项目代码，不承载 Skill 测试或实验运行。
- `ai-translator` 是主项目案例；`ai-dev-lab` 是独立学习与复盘空间。
- 测试/实验平台属于未来独立项目，不与本平台共享运行时、数据库或部署进程。

## 当前状态

V5 深色画廊原型已完成并迁移到 `project/frontend/` 的 Vue 3 正式前端；Java 后端已完成公开读取、管理员会话、项目草稿创建和送审基础链路，并在本地 MySQL 8.0 上完成从零迁移验证。审核通过、发布、下线、审计事件及其余 V2 实体仍待实现，真实项目内容尚未录入数据库。

展示名与仓库名的对应关系见 `doc/10-decision-log.md` 的 ADR-013（AI Translator 对外展示名为 LexiFlow）。

## 开发配置

| 项目 | 配置 |
|---|---|
| 前端 | Vue 3 + Vite + Tailwind CSS |
| 后端目标 | Java 17 + Spring Boot 3 + MyBatis-Plus |
| 数据库 | MySQL 8 |
| 数据库迁移 | Flyway |
| 管理认证 | Sa-Token |
| 测试 | JUnit 5 + Mockito + MockMvc |
| 前端开发端口 | 1001 |
| 后端开发端口 | 2001 |

真实密码、Token 和数据库密码只通过环境变量注入，不写入 README。当前 `project/backend` 的 Python/FastAPI 代码是迁移前的旧实现和接口参考，Java 版本稳定后再处理旧实现的归档，不直接删除。

## 后端结构

Java 后端采用按职责分层的 Spring Boot 模块化单体：

```text
project/backend/src/main/java/com/crow5/portfolio/
├── controller/       # HTTP 接口，按 publicapi、admin 分组
├── service/          # 事务和业务规则
├── entity/           # 数据库实体
├── mapper/           # MyBatis-Plus 数据访问
├── dto/              # 请求对象
├── config/            # Sa-Token 等基础配置
└── common/            # 统一响应和异常处理
```

旧 Python/FastAPI 实现仍保留在 `project/backend/app/`、`project/backend/alembic/` 和 `project/backend/tests/`，仅用于迁移参考，不与 Java 源码混用。

## 启动方式

后端（PowerShell）：在 `project/backend` 执行 `mvn spring-boot:run`，服务端口为 `2001`；数据库连接通过环境变量配置。
前端（PowerShell）：`& C:\\nvm\\v22.19.0\\node.exe node_modules/vite/bin/vite.js --host 127.0.0.1 --port 1001`（工作目录为 `project/frontend`），访问 `http://localhost:1001`；构建使用 `& C:\\nvm\\v22.19.0\\node.exe node_modules/vite/bin/vite.js build`。

管理员登录使用环境变量注入的本地开发账号，认证由 Sa-Token 管理。Java 版本使用 Flyway 自动执行 MySQL 迁移；旧 Python 版本的 SQLite 数据库仅作为参考，不直接接入 Java 服务，也不要删除。

## 文档

- `doc/00-project-charter.md`：项目章程与边界
- `doc/01-product-requirements.md`：产品需求
- `doc/02-information-architecture.md`：信息架构
- `doc/03-project-audit-and-publish.md`：项目审查与发布
- `doc/04-system-architecture.md`：系统架构
- `doc/05-data-model.md`：数据模型
- `doc/06-api-contract.md`：接口契约
- `doc/07-security-and-privacy.md`：安全与隐私
- `doc/08-test-and-acceptance.md`：测试与验收
- `doc/09-delivery-roadmap.md`：交付路线
- `doc/10-decision-log.md`：决策存证
- `doc/11-skill-workflow.md`：技能协作流程
- `doc/12-learning-compound-loop.md`：复利学习闭环
- `doc/13-current-work-archive.md`：当前工作存档
- `doc/14-portfolio-v2-evidence-inventory.md`：V2 项目证据台账
- `doc/15-portfolio-v2-product-and-engineering-blueprint.md`：V2 产品与工程蓝图
- `doc/16-portfolio-v3-prototype.md`：V3 作品优先原型
- `doc/17-portfolio-v4-scroll-story.md`：V4 滚动叙事原型
- `doc/18-portfolio-v5-premium-gallery.md`：V5 深色画廊原型
- `doc/19-portfolio-v5-optimization-plan.md`：V5 信息架构收敛优化
- `doc/20-portfolio-vue-migration.md`：V5 正式前端迁移记录
- `doc/21-migration-incident-and-recovery.md`：V2 迁移丢失事故与恢复记录
- `prototype/portfolio-v5.html`：V5 高保真交互原型（V2 至 V4 原型保留为回滚基线）

## 重要约束

技术栈、端口和数据库配置已记录。Java 版本当前已实现健康检查、公开项目读取、管理员会话、项目草稿创建、修订快照和草稿送审基础链路；批准、驳回、发布快照、下线、审计事件及其余 V2 实体仍在后续阶段实现，因此在补齐发布链路前，Java 后端无法产出任何公开内容。

迁移文件一经应用即视为不可变资产：必须与代码同批提交，不得使用 `ignore-migration-patterns` 之类的配置掩盖迁移状态不一致（见 ADR-012 与 `doc/21`）。

## 已知缺口

- 真实项目资料、贡献边界、证据和授权尚未人工确认，当前不写入真实内容，界面使用空状态或安全占位文案。
- 公开前端在数据库为空时使用前端内置的安全回退数据；`/api/public/projects` 当前返回空数组。
- 审核通过、发布、下线和审计事件接口尚未实现，公开内容目前无法通过接口产生。
- 浏览器交互验收已可执行：`node utils/browser-check.mjs http://127.0.0.1:1001/`（需先启动前后端，本机需安装 Chrome 或 Edge），当前 25 项全部通过，详见 `doc/20`。
- 尚未覆盖的浏览器证据：Tab 焦点顺序、`focus-visible` 样式、屏幕阅读器语义，以及后端审核发布链路的浏览器路径（该链路尚未实现）。
- 案例素材目前是前端展示增强字段，未写入后端数据库；截图故事线只覆盖「入口」与「核心链路」，边界与异常证据仍待补。
- `prototype/assets/v5/` 与 `project/frontend/public/assets/v5/` 是两处截图副本，正式部署前需确认以哪一处为准。
- 不执行旧项目源码；`ai-translator` 与未来实验平台保持运行时和数据库隔离。
