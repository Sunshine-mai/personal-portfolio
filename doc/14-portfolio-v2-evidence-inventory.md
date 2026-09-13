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

---

## 2026-09-13 复核：技术栈逐项重核

本节的来历：为首页技术网络图准备数据时，发现**不能再直接引用上面的技术栈行**。
复核方式不是读文档，而是**逐个读各项目的依赖清单**：
`backend/pom.xml`、`backend/requirements.txt`、各端 `package.json`，另加必要的代码检索。

### 上一版台账的三类问题

| 类型 | 实例 |
|---|---|
| **把"计划"写成了"已有"** | 案例三（教学平台）的 `README.md` 技术栈表里写了 **ECharts**。核实：`frontend/package.json` 的**全部提交历史**中从未出现过 echarts，代码里也没有引用；它只出现在 `doc/04-decisions.md`（选型决策）、`doc/09-preview-plan.md`（计划项）、`PROJECT_HANDOFF.md`（分包设想）等**文档**里。**即：选型讨论过、计划里有，但没有成为依赖。** 而按计划使用它的"知识图谱展示"尚未实现（`knowledge_point`／`knowledge_edge` 表已在 V1 迁移中建好，但没有对应前端） |
| **层级过粗，漏掉整块** | 案例二（Folio）前端只写"Vue 3"，实际还有 Element Plus、Pinia、vue-router、Tailwind CSS、marked |
| **验证等级过期** | 案例四写成"原型／验证等级 P／未连接真实后端与数据库"，实际早已是可运行的完整系统：**8 个 Flyway 迁移、51 个 `@Test`**——与作品集对外显示的数字一致 |

案例五（LexiFlow 练习区）在上一版台账里**没有条目**。

### 复核后的已核验技术栈

选取标准：**列语言、框架、运行时服务、数据存储，以及决定工程结构的库**；
不列 Lombok、Axios、PostCSS、pytest 这类管道与工具类（它们不构成"技术选型"）。

| 案例 | 前端 | 后端 | 数据与检索 | 运行与其他 |
|---|---|---|---|---|
| 一 LexiFlow | Vue 3、Element Plus、Pinia、Tailwind CSS | Python 3.11+、FastAPI、SQLAlchemy、Alembic | SQLite（开发）／PostgreSQL（生产）、Redis | Docker Compose、Nginx |
| 二 Folio | Vue 3、Element Plus、Pinia、Tailwind CSS | Java 17、Spring Boot 3、Sa-Token、MyBatis-Plus | MySQL、LangChain4j、Apache Tika、BGE-Small-ZH 本地向量化 | Docker、Nginx、SpringDoc |
| 三 知衡 | Vue 3、TypeScript、Element Plus、Pinia、Vite | Java 17、Spring Boot 3、MyBatis-Plus、Sa-Token、Flyway | MySQL、H2（测试） | EasyExcel、Spring Security Crypto |
| 四 大学新闻网 | PC：Vue 3、Tailwind CSS、HeadlessUI、wangEditor、Swiper；移动：Vue 3、Vant；小程序：Vant Weapp | Java 17、Spring Boot 3、MyBatis、JPA、Sa-Token、PageHelper | MySQL、MinIO | SpringDoc、Spring Boot Admin、Actuator |
| 五 练习区 | Vue 3、Element Plus、Pinia、Tailwind CSS | FastAPI、SQLAlchemy、Alembic（与案例一同源） | PostgreSQL、Redis | Docker Compose、Nginx |

### 两条复核结论

1. **LexiFlow 与练习区的依赖清单逐字相同**（同为 `requirements.txt`），
   与作品集案例五"练习场与正式产品共用同一套技术栈"的说法一致——这不是巧合，是设计意图。
2. **案例一"SQLite 开发／PostgreSQL 生产分离"经复核成立**：
   `backend/app/config.py` 默认值为 `sqlite:///./translator.db`，`database.py` 中有按 URL 分支的同步／异步处理。

### 使用约束

- 上述技术栈**仍受各自的公开边界约束**：案例四（合作项目）只陈述已确认的项目级技术构成，
  不据此推断个人负责的模块。
- **凡引用技术栈，以本节为准，不再引用上文各案例行中的技术栈字段**（那几行保留原样，
  用于记录当时的判断，不作为当前事实来源）。
- 数字类陈述（迁移数、测试数）已用代码检索核对，可对外使用。

