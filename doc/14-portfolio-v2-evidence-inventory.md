# 作品集 V2 项目证据台账

> 生成时间：2026-09-01。此台账只记录从本地项目说明、依赖清单、路由和测试结构中可核验的事实；不代表自动获得公开授权。

## 展示规则

- 每张公开案例必须标记 `验证等级`、`项目性质` 和 `最后核验日期`。
- 作品集只保存脱敏后的案例摘要、决策和证据索引，不复制旧项目源码、数据库、日志或环境文件。
- 合作项目在书面确认个人贡献和公开授权前，仅能展示为受限档案，不能写成独立完成。
- 原型项目必须明确标记原型边界，不能以已上线或已完成后端功能的口吻展示。

## 案例一：AI Translator

| 字段 | 已核验事实 |
|---|---|
| 项目性质 | 独立开发的 AI 翻译与英语学习工具 |
| 用户问题 | 面向英语学习者，将翻译、查词、生词本和复习连接为学习闭环 |
| 技术栈 | Python 3.11+、FastAPI、SQLAlchemy、Vue 3、Tailwind CSS、Element Plus、SQLite/PostgreSQL、Redis、Docker Compose、Nginx |
| 已实现能力 | 翻译引擎降级、游客配额、词典、生词本、复习、历史、CSV 导入导出、预置词库、学习统计、JWT 认证、健康检查 |
| 工程证据 | `README.md`、`backend/app/routers/`、`docker-compose.prod.yml`、`backend/requirements.txt`、`frontend/package.json` |
| 可讲决策 | SQLite 开发与 PostgreSQL 生产分离；Redis 不可用时服务降级；生产编排用 healthcheck 控制依赖启动顺序；前端多阶段构建后由 Nginx 托管 |
| 验证等级 | B：功能和部署配置可由代码结构核验；应补正式 pytest 报告、构建摘要和浏览器截图后升为 A |
| 公开边界 | 不公开 API Key、数据库、真实用户数据、历史部署地址和内部学习记录 |

## 案例二：AI Second Brain

| 字段 | 已核验事实 |
|---|---|
| 项目性质 | 独立开发的个人知识库 RAG 对话系统 |
| 用户问题 | 上传个人文档后，基于私有知识进行检索增强对话 |
| 技术栈 | Java 17、Spring Boot 3、MyBatis-Plus、MySQL、Sa-Token、LangChain4j、Apache Tika、Vue 3、Docker、Nginx |
| 已实现能力 | 多格式文档解析、递归切片、本地 BGE 向量化、余弦检索、SSE 流式对话、多轮会话、文档管理、角色权限、响应式界面 |
| 工程证据 | `README.md`、`backend/pom.xml`、`backend/src/main/java/com/aibrain/controller/`、`backend/src/test/java/com/aibrain/`、`deploy/` |
| 可讲决策 | 百至千级切片采用 Java 内存余弦检索，避免引入向量数据库；SSE 改用 fetch + ReadableStream 以支持认证头；单机资源受限时用异步任务而非消息队列 |
| 验证等级 | A-：结构化测试目录、核心路由、部署文件和公开项目说明均存在；对外发布前仍应复跑测试和核验线上链接 |
| 公开边界 | 不公开上传文档、用户会话、部署密码、模型 Key、服务器地址和未脱敏截图 |

## 案例三：大学新闻网

| 字段 | 已核验事实 |
|---|---|
| 项目性质 | 合作项目，现代化校园新闻管理与多端访问系统 |
| 用户问题 | 为校园师生提供 PC 管理、移动 Web 和微信小程序的新闻阅读与内容管理体验 |
| 技术栈 | Java 17、Spring Boot 3、MyBatis、MySQL、Sa-Token、Vue 3、Vant、微信小程序、MinIO、SpringDoc |
| 已实现能力 | 新闻检索与分类、后台内容管理、用户认证、收藏与历史同步、富文本编辑、多端导航、图片上传和 API 文档 |
| 工程证据 | `README.md`、`backend/pom.xml`、`backend/src/main/java/com/guducat/collegeWeb/controller/`、`fronted/`、`mobile-vant/`、`WeChatMiniProgram/` |
| 验证等级 | C：项目整体能力可核验；个人贡献边界已按成员口径记录（见下行），展示内容限于读者端页面截图 |
| 个人贡献边界 | 双方共同参与：后端以搭档为主、前端 UI 以本人为主；搭档为项目发起者、整体贡献更多。**该边界是成员口径的估算，模块归属未逐项记录**，不得对外表述为精确分工。三张截图均为读者端前台页面，与"前端 UI 为主"自洽 |
| 公开边界 | 必须在详情首屏标明“合作项目”；只陈述已确认的个人模块；不展示学校新闻数据、用户数据、`.env`、上传文件或未授权视觉资产 |

## 案例四：高中个性化教学平台

| 字段 | 已核验事实 |
|---|---|
| 项目性质 | 需求、架构与高保真业务流程原型 |
| 用户问题 | 让管理员、老师和学生围绕题库、考试、掌握度、错题和练习形成可操作的教学分析闭环 |
| 计划技术栈 | Java 17、Spring Boot 3、Sa-Token、MyBatis-Plus、MySQL、Flyway、Vue 3、Element Plus、Pinia、ECharts |
| 原型已覆盖 | 三角色工作台、题库导入校验、组卷发布、学生答题、自动判分、错题、掌握度、薄弱练习与知识图谱 |
| 工程证据 | `README.md`、`doc/00-scope.md`、`doc/04-decisions.md`、`doc/05-acceptance.md`、`prototype/` |
| 验证等级 | P：真实业务流程原型，明确未连接真实后端、数据库和文件存储 |
| 公开边界 | 使用演示角色和虚拟数据；不得写成生产系统或已具备真实权限隔离、真实判分与数据持久化 |

## 跨项目能力证据

| 能力主题 | 主要案例 | 可复用表达 |
|---|---|---|
| 双技术栈全栈交付 | AI Second Brain、AI Translator | 从 Java/Spring 到 Python/FastAPI，复用分层、认证、验证和部署思路 |
| AI 应用工程化 | AI Second Brain、AI Translator | RAG 检索、模型降级、配额、缓存、结构化服务边界与可观测性 |
| 多角色业务建模 | 大学新闻网、教学平台 | 从权限、数据归属到不同角色工作流，先定义边界再做界面 |
| 多端体验 | 大学新闻网、AI Translator | PC、移动 Web 与小程序/底部导航的差异化交互设计 |
| 可交付工程纪律 | 全部项目 | 设计先行、决策存证、环境隔离、测试验证、部署与复盘 |
