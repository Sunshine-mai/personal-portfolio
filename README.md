# Personal Portfolio Platform

个人工程作品集平台：展示已审查、可追溯、可复现的项目成果、技术决策、验证证据和精选学习摘要。

## 项目边界

- 本项目只负责稳定的成果展示、内容审核与发布。
- 不执行任意项目代码，不承载 Skill 测试或实验运行。
- `ai-translator` 是主项目案例；`ai-dev-lab` 是独立学习与复盘空间。
- 测试/实验平台属于未来独立项目，不与本平台共享运行时、数据库或部署进程。

## 当前状态

基础开发阶段已开始。原型已确认，业务代码正在搭建。

## 开发配置

| 项目 | 配置 |
|---|---|
| 前端 | Vue 3 + Vite + Tailwind CSS |
| 后端 | Python 3.11 + FastAPI + SQLAlchemy |
| 开发数据库 | SQLite |
| 生产数据库 | PostgreSQL |
| 管理认证 | JWT |
| Redis | 首期不接入 |
| 前端开发端口 | 1001 |
| 后端开发端口 | 2001 |

真实密码、JWT 密钥和数据库密码只通过环境变量注入，不写入 README。

> 当前开发机的 Git Bash `python` 可能指向 MSYS2 Python。建议使用已安装的 CPython 3.11/3.12 解释器创建虚拟环境；项目目标运行时仍为 Python 3.11+。

## 启动方式

开发命令将在基础骨架完成后补齐，并与实际可运行结果保持一致。

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

## 重要约束

原型确认、技术栈确认、端口确认和数据库配置确认之前，不开始编写业务代码。
