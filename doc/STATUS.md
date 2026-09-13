# 项目状态（单一状态源）

> 本文件是项目当前状态的**唯一权威来源**。其他文档只描述设计与历史，不复述进度；
> 需要判断"现在做到哪一步"时，以本文件为准。
>
> 维护规则：每次提交完成一个有意义的阶段后更新本文件，并在同一次提交中完成。
> 最后更新：2026-09-13

## 一句话状态

作品集**已交付**：真实路由详情页、五个案例、Netlify 部署与 SPA 回退齐备。本轮的实质工作是
**核验并修正对外内容**——案例四（大学新闻网）的三条图注原先与截图不符，已按截图实况改正，
并补入经确认的个人贡献边界。后端**未接入生产**，公开接口不产出内容，前端走内置已核验数据。

## 交付定性（本轮明确）

站点是**静态展示型作品集**，不需要后端即可完整运行。管理端发布链路（审核、发布、下线、审计）
虽已部分实现，但**没有任何前端界面调用它**，其完成度不影响访客看到的内容。因此后端标记为
**「未接入、冻结」**，不再作为阻断项，也不再继续投入；如将来需要在线编辑内容，应作为独立
需求重新立项，而不是把现有半成品推完。

## 部署

| 项 | 值 |
|---|---|
| 托管 | Netlify，站点 `taupe-chimera-547f35` |
| 部署目录 | `project/frontend/dist`（构建产物，勿手工修改） |
| 配置 | `netlify.toml`（构建与 SPA 回退）、`project/frontend/public/_redirects`（拖拽部署时生效） |
| 深链 | `/projects/:slug` 依赖 SPA 回退；已实测生产产物返回 200 |
| 后端依赖 | 无。静态托管下前端使用内置的已核验数据，状态行显示「静态展示 · 内容来自项目内置的已核验数据」 |

每次改动后需重新构建并重新部署；拖拽方式不会自动更新。
**本轮改动含前端文案（案例四），因此 dist 需重新构建、Netlify 需重新部署后才对外生效。**

## 案例状态

| 案例 | 展示名 / 仓库名 | 分类 | 完成度 | 证据 |
|---|---|---|---|---|
| 1 | LexiFlow / `ai-translator` | 独立开发 | 已实现核心闭环，待补正式发布证据 | 3 张实跑截图（入口 / 真实翻译 / 游客配额耗尽） |
| 2 | Folio / `ai-second-brain` | 独立开发 | 已实现，发布前复核 | 3 张演示账号截图（登录 / 文档管理 / 检索对话） |
| 3 | 知衡教学平台 / `teaching-platform` | 独立开发 | 教师端考试闭环已交付；学生端后端完成、前端未做 | 3 张真实系统截图（工作台 / 题库 / 逐题改卷） |
| 4 | 大学新闻网 / `xiangmu` | 合作项目 | 已授权展示，**贡献边界与图注已说明并核对** | 3 张**读者端**页面截图（成员提供），图注已按截图实况核对 |
| 5 | LexiFlow 练习区 / `ai-translator-vue-lab` | 练习与实验 | 持续练习中，内容未完整 | 2 张真实运行截图（练习区 / 实验载体） |

分类筛选：全部 / 独立开发 / 练习与实验 / 合作项目。
案例的展示名与仓库名必须成对出现，见 `doc/10-decision-log.md` 的 ADR-013、ADR-014。

### 案例四的修正记录（2026-09-13）

三张截图经逐张读图核验，**均为读者端（PC 前台）页面，没有一张是后台管理端**，原图注三条全部不符：

| 图片 | 原图注（错） | 实际内容 |
|---|---|---|
| `nanyang-1.png` | PC 内容管理端 | 读者端新闻首页（校庆轮播、栏目导航、搜索框） |
| `nanyang-2.png` | 内容管理环节 | 「学校概况 → 学校荣誉」栏目页，可见 `localhost:5175/#/school/honors` |
| `nanyang-3.png` | 移动端与小程序 | PC 读者端「校园快讯」分类筛选页（约 1912×948） |

已修正图注与 `evidence`（明确"后台管理端未提供截图"），并按项目成员口径写入个人贡献边界：
**双方共同参与，后端以搭档为主、前端 UI 以本人为主，搭档为项目发起者、整体贡献更多；
具体模块划分未逐项记录**——保留这一句是因为原始口径即为估算，写成精确分工反而失真。

## 仓库与命名

| 项目 | 本地目录 | 公开仓库 | 状态 |
|---|---|---|---|
| 作品集 | `personal-portfolio` | `personsal-pf` | 已推送 |
| LexiFlow | `ai-translator` | `my-translate` | 已推送，**仓库名与展示名不一致** |
| Folio | `ai-second-brain` | `folio` | **本轮首次推送完成**（发布前已移除硬编码密码） |
| LexiFlow 练习区 | `ai-translator-vue-lab` | 新建 `lexi-flow-practice`（空） | **尚未推送**，定位待确认 |

**待处理的命名问题**：已确认按作品集展示名对齐 Gitee 仓库名，即把 `my-translate` 改名为
`ai-translator`、把 `lexi-flow-practice` 改名为 `ai-translator-vue-lab`。改名为 Gitee 网页端操作，
需人工执行并在改名后更新本地 remote。

**凭据情况**：

- 作品集后端：`password: ${DB_PASSWORD:}`，环境变量注入，干净。
- Folio：本轮在首次推送前发现 `application-dev.yml` 含硬编码库密码，已改为 `${DB_PASSWORD}`
  写入 gitignore 的 `.env`，并 amend 唯一提交使其**不进入历史**（已用远端对象复核）。
- **LexiFlow（已公开）**：`docker-compose.yml` 含硬编码 Postgres 密码，且遍布全部历史
  （多处命中）。文件已公开，删除无效，需按 `doc/07` 第 4 节**轮换密码**。
- 练习区仓库的 `docker-compose.yml` 与 LexiFlow 逐字节相同，推送前必须先处理同一问题。

## 后端与数据库（未接入、冻结）

**Java 后端**（Spring Boot 3 + MyBatis-Plus + Sa-Token + Flyway，端口 2001）

已实现：健康检查、公开项目读取、公开内容读取、管理员登录/登出、项目草稿创建、修订快照、草稿送审、
公开知识节点与学习总结读取。

未实现：审核通过、驳回、发布、下线、审计事件、项目列表与更新。因无管理界面调用，**按冻结处理**。

**已知缺陷（冻结，暂不修）**

- 公开知识节点接口未过滤 `published`（`knowledge_nodes` 表甚至没有该列），违反 `doc/05`
  的"公开只读发布投影"。
- `ProjectService` 把 revision number 硬编码为 1，revision 2 不可表达。

两条都位于**当前无人调用的代码路径**（表为空、无管理界面），故不产生现时影响；
若将来解冻后端，必须与"公开读取发布投影"（ADR-003）一并修正。

**数据库**（本地 MySQL 8.0，库 `personal_portfolio`）

- Flyway 已从零执行 V1 → V2 → V3；校验和：V1 `1881988467`、V2 `318876657`、V3 `1707037090`。
- 业务表当前**全部为空**，因此 `/api/public/projects` 返回 `data: []`。
- V2 迁移曾丢失并复建，过程见 `doc/21-migration-incident-and-recovery.md`。
- 独立校验工具：`python utils/flyway-checksum.py <迁移文件>`。

## 前端

正式前端为 Vue 3 + Vite（端口 1001），详情页为真实路由页而非抽屉；
全部前端只有 3 个视图文件（`App.vue`、`HomeView.vue`、`ProjectView.vue`），
除两个公开 GET 外不调用任何后端接口。
结构与验收记录见 `doc/20-portfolio-vue-migration.md`。

未覆盖：Tab 焦点顺序、`focus-visible` 样式、屏幕阅读器语义、断网与重复点击。

## 验证设施与最近结果

| 工具 | 用途 | 最近结果 |
|---|---|---|
| `utils/browser-check.mjs` | CDP 驱动无头 Chrome 做真实交互，退出码可作门禁 | 42 项全部通过（**内容修正后尚未复跑**） |
| `utils/flyway-checksum.py` | 独立复算迁移校验和 | 三个迁移与库中记录一致 |
| `utils/demo-seed/` | 各项目的演示采集脚本 | Second Brain 含隔离公共文档并复原的完整流程 |

**运行注意**：后端测试在本机需补 `-Djdk.attach.allowAttachSelf=true`，否则 14 项全部报错
（Mockito 的 agent 注入依赖外部进程，受限沙箱禁止管道捕获子进程输出）。补该参数后 14/14 通过。
浏览器验收与 Vite 构建同样依赖子进程，受限环境下需放宽权限才能执行。

## 阻断与待办

**阻断**：无。作品集已具备交付条件。

**待办（按价值排序）**

1. 重新构建 `dist` 并重新部署 Netlify，让案例四修正对外生效；随后复跑 42 项浏览器验收。
2. Gitee 仓库改名：`my-translate` → `ai-translator`、`lexi-flow-practice` → `ai-translator-vue-lab`，
   改名后更新本地 remote。
3. 轮换 LexiFlow 已公开的 Postgres 密码，并把 `docker-compose.yml` 改为环境变量注入。
4. 确认 LexiFlow 练习区仓库的定位后再决定是否推送（当前它包含整个 LexiFlow 代码库）。
5. 知衡考试分析页返回 500（工作台、题库、改卷三页正常），需定位服务端异常。
6. 补数据库接口读写、事务失败回滚、测试数据库隔离验证（仅在解冻后端时才有意义）。

## 环境与端口

| 项目 | 仓库 | 前端 | 后端 |
|---|---|---|---|
| 作品集 | `personal-portfolio` | 1001 | 2001 |
| LexiFlow | `ai-translator` | 5176 | 8000 |
| Folio | `ai-second-brain` | 5173 | 8090 |
| 知衡教学平台 | `teaching-platform` | 1002 | 2002 |
| 大学新闻网 | `xiangmu` | 5175 | 8080 |
| LexiFlow 练习区 | `ai-translator-vue-lab` | 5177 | 8001 |

完整启动命令见 `self-reflection-lite.md` 的「各项目启动方式」。

## 文档地图

| 文档 | 定位 |
|---|---|
| `doc/STATUS.md`（本文件） | 当前状态，唯一权威 |
| `doc/00` 至 `doc/12` | 设计与工程方案：章程、PRD、信息架构、数据模型、接口契约、安全、测试、路线、决策 |
| `doc/10-decision-log.md` | 所有已确认决策（ADR） |
| `doc/13-current-work-archive.md` | 历史存档，不复述当前状态 |
| `doc/14`、`doc/15` | V2 证据台账与蓝图 |
| `doc/16` 至 `doc/19` | V3 至 V5 原型记录，历史 |
| `doc/20-portfolio-vue-migration.md` | 前端迁移与验收记录 |
| `doc/21-migration-incident-and-recovery.md` | V2 迁移事故与恢复 |
| `doc/22-future-directions.md` | 后续方向想法池（网状知识图谱、技术栈试用平台），未立项 |
| `self-reflection-lite.md` | 长期工程经验与各项目启动方式 |
