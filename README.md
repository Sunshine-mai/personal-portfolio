# Personal Portfolio Platform

个人工程作品集平台：展示已审查、可追溯、可复现的项目成果、技术决策、验证证据和精选学习摘要。

## 项目边界

- 本项目只负责稳定的成果展示、内容审核与发布。
- 不执行任意项目代码，不承载 Skill 测试或实验运行。
- `ai-translator` 是主项目案例；`ai-dev-lab` 是独立学习与复盘空间。
- 测试/实验平台属于未来独立项目，不与本平台共享运行时、数据库或部署进程。

## 当前状态

V2 产品与工程蓝图、高保真交互原型和项目证据台账已完成；当前等待站点所有者确认原型，业务开发暂缓。

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
- `doc/14-portfolio-v2-evidence-inventory.md`：V2 项目证据台账
- `doc/15-portfolio-v2-product-and-engineering-blueprint.md`：V2 产品与工程蓝图
- `prototype/portfolio-v2.html`：V2 高保真交互原型

## 重要约束

技术栈、端口和数据库配置已记录；V2 原型尚待确认。现有代码已实现公开项目读取、知识节点、学习摘要，以及 JWT 管理认证和项目草稿→送审→通过→发布基础链路，但不代表 V2 业务范围已经开始迁移。

## 已知缺口

- 真实项目资料、贡献边界、证据和授权尚未人工确认，当前不写入真实内容，界面使用空状态或安全占位文案。
- 浏览器自动化仍需在具备浏览器验证工具的环境中执行；当前已补齐兼容迁移、项目更新、拒绝和下线接口及核心接口测试。V2 原型还需要浏览器级交互和响应式验收记录。
- 不执行旧项目源码；`ai-translator` 与未来实验平台保持运行时和数据库隔离。
