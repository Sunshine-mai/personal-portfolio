# Personal Portfolio 阶段复盘

> 只记录本项目中值得长期复用的工程经验；详细学习过程继续放在 `ai-dev-lab/REFLECTION.md`。

## 当前阶段

- 正式前端为 Vue 3 + Vite；项目详情已由侧边抽屉改为真实路由页面（`/projects/:slug`），可直达、可分享、可刷新。
- 案例共 5 个：LexiFlow、Folio、知衡教学平台、大学新闻网（合作）、LexiFlow 练习区（练习与实验，内容未完整）。
- Java 后端已完成公开读取、管理员会话、草稿创建与送审；审核通过、发布、下线与审计事件仍缺，因此后端目前无法产出公开内容。
- 浏览器交互验收已可执行：`node utils/browser-check.mjs http://127.0.0.1:1001/`，当前 42 项全部通过。
- 对外展示名与仓库名分离：LexiFlow → `ai-translator`，Folio → `ai-second-brain`（ADR-013、ADR-014）。

## 各项目启动方式

各项目前端默认端口都是 5173，同时启动会互相抢占，因此下表使用互不冲突的端口，并统一加 `--strictPort`。
命令中的 `node node_modules\vite\bin\vite.js` 可替换为 `npx vite`。

| 项目 | 仓库 | 前端 | 后端 |
|---|---|---|---|
| 作品集 | `personal-portfolio` | 1001 | 2001 |
| LexiFlow | `ai-translator` | 5176 | 8000 |
| Folio | `ai-second-brain` | 5173 | 8090 |
| 知衡教学平台 | `teaching-platform` | 1002 | 2002 |
| 大学新闻网 | `xiangmu` | 5175 | 8080 |
| LexiFlow 练习区 | `ai-translator-vue-lab` | 5177 | 8001 |

```powershell
# 作品集（后端需要注入本地 MySQL 密码）
cd C:\maimai\Python\personal-portfolio\project\backend
$env:DB_PASSWORD='<本地密码>'; $env:DB_USERNAME='portfolio_app'; mvn -o spring-boot:run
cd ..\frontend ; node node_modules\vite\bin\vite.js --host 127.0.0.1 --strictPort --port 1001

# LexiFlow：必须用项目自带虚拟环境，裸 python 会命中 msys 的 Python（没有 fastapi / uvicorn）
cd C:\maimai\Python\ai-translator\backend ; .\.venv\Scripts\python.exe -m uvicorn app.main:app --port 8000
cd ..\frontend ; node node_modules\vite\bin\vite.js --strictPort --port 5176

# Folio：后端已由 8080 改为 8090，避开大学新闻网；前端代理随之后端一致
cd C:\maimai\Python\ai-second-brain\backend ; mvn -o spring-boot:run
cd ..\frontend ; node node_modules\vite\bin\vite.js --strictPort --port 5173

# 知衡教学平台
cd C:\maimai\Python\teaching-platform\project\backend ; mvn -o spring-boot:run -Dspring-boot.run.profiles=dev
cd ..\frontend ; node node_modules\vite\bin\vite.js --strictPort --port 1002

# 大学新闻网（后端固定 8080，前端代理写死指向它，不能随意改端口）
cd C:\maimai\javaee\xiangmu\backend ; mvn -o spring-boot:run
cd ..\fronted ; node node_modules\vite\bin\vite.js --strictPort --port 5175

# LexiFlow 练习区：没有虚拟环境，用系统 Python 3.10；前端代理指向 8001
cd C:\maimai\Python\ai-translator-vue-lab\backend ; C:\Python310\python.exe -m uvicorn app.main:app --port 8001
cd ..\frontend ; $env:VITE_API_PROXY_TARGET='http://localhost:8001'; node node_modules\vite\bin\vite.js --strictPort --port 5177
```

- 部分 Vite 服务只监听 IPv6（`[::1]`），用 `127.0.0.1` 访问会失败，改用 `localhost`。
- 启动后端可能对该项目的开发库执行迁移（知衡会跑 Flyway，Folio 与作品集连接各自 MySQL）。

## 重要经验

| 问题/决策 | 经验 |
|---|---|
| 已应用的迁移文件丢失 | 迁移一旦执行就必须与代码同批提交；文件丢失后库能跑但无法复现，是最隐蔽的缺口。 |
| 用配置掩盖失败 | `ignore-migration-patterns` 之类的兜底会让工具安静通过；让工具直接失败更有价值。 |
| 校验和可复现 | Flyway 校验和是逐行 CRC32，可独立复算，用于判断迁移文件是否被改动、事故是否波及既有迁移。 |
| 端口被占用时 Vite 会静默 +1 | 必须加 `--strictPort`；验证服务身份要**看页面标题**，只看 HTTP 状态码会把 A 项目当成 B 项目。 |
| 子串匹配做分类会误判 | `'COLLABORATIVE'.includes('LAB')` 为真，导致合作项目被归入练习场；分类一律精确匹配优先、子串兜底。 |
| 对外名称与仓库名 | 展示名必须与仓库名建立记录并显示在案例中，否则审查版本和贡献时无法核对。 |
| 改名要连界面一起改 | 作品集改名后截图里仍是旧名，会被当场拆穿；品牌文案在应用内往往有 5 至 7 处。 |
| 原型与运行页面不一致 | 原型确认后尽快迁移到真实前端，避免维护两套页面造成内容漂移。 |
| 作品集与实验平台 | 稳定展示域和可失败实验域必须独立，不能共用运行时与数据库。 |
| 项目展示 | 合作项目必须明确团队成果与个人贡献边界；分类错误与夸大完成度同样失真。 |
| 测试策略 | 页面能打开不等于交付完成；至少要覆盖单元、接口、构建与浏览器主流程。 |
| 任务收尾 | 完成度最高的改动最容易停在"没提交"这一步；每完成一个阶段立即提交并同步状态文档。 |

## 当前待办

1. 补齐 Java 后端审核发布链路（approve、reject、publish、unpublish、审计事件）；补齐前后端无法产出公开内容。
2. 修复公开知识节点接口未过滤 `published`、以及 revision number 硬编码为 1 的问题。
3. 补充数据库接口读写、事务失败回滚和测试数据库隔离验证。
4. 知衡考试分析页返回 500（工作台、题库、改卷三页正常），需要定位服务端异常。
5. 大学新闻网案例的图注与个人贡献边界待确认；项目已推送到自有仓库，团队仓库尚未同步。
6. 把 5 个案例录入 MySQL，让公开接口真正返回数据（当前表为空，页面走前端回退数据）。
7. 完成验证后推送作品集到 Gitee。

## 复利闭环

```text
ai-dev-lab 学概念
→ ai-translator / Java 项目精读和验证
→ personal-portfolio 用自己的话整理项目、决策和证据
→ 形成可展示、可复盘、可迁移的能力
```
