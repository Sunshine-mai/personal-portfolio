# Personal Portfolio 阶段复盘

> 只记录本项目中值得长期复用的工程经验；详细学习过程继续放在 `ai-dev-lab/REFLECTION.md`。

## 当前阶段

- 正式前端为 Vue 3 + Vite；项目详情已由侧边抽屉改为真实路由页面（`/projects/:slug`），可直达、可分享、可刷新。
- 案例共 5 个：LexiFlow、Folio、知衡教学平台、大学新闻网（合作）、LexiFlow 练习区（练习与实验，内容未完整）。
- Java 后端已完成公开读取、管理员会话、草稿创建与送审；审核通过、发布、下线与审计事件仍缺。
  经确认前端**没有任何界面调用管理端**，其完成度不影响访客看到的内容，故后端按「未接入、冻结」处理。
- 案例四的图注原先与截图不符（把读者端前台写成后台管理端、把 PC 页面写成移动端与小程序），
  已于 2026-09-13 按截图实况逐条改正，并补入经项目成员确认的个人贡献边界。
- 浏览器交互验收已可执行：`node utils/browser-check.mjs <url>`。本轮修正案例四文案后，已对 `vite preview` 服务的生产产物复跑，42/42 通过。
- 对外展示名与仓库名分离：LexiFlow → `ai-translator`，Folio → `ai-second-brain`（ADR-013、ADR-014）。
- 已具备 Netlify 部署条件：`netlify.toml` 与 `public/_redirects` 提供 SPA 回退，
  对生产产物（`vite preview` 服务的 dist）验收 42 项全过，深链返回 200 而非 404。
  站点：https://app.netlify.com/projects/taupe-chimera-547f35/overview
- 尚未排期的两个方向见 `doc/22-future-directions.md`：网状知识图谱、可复用的技术栈试用平台。
  其中后者按章程必须**独立立项**，不能并入作品集。

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
| 首次提交前必查 | 无历史的仓库要先 `add -A --dry-run` 看清单：本轮据此拦下硬编码的真实 API Key、受版权保护的电子书、以及项目规则声明不上传的规范文件。密钥一旦进历史就无法真正移除。 |
| 密钥与便捷性的折中 | 去掉源码里的硬编码密钥后，用 `spring.config.import` 读取已被 gitignore 的 `.env`，可同时保住"密钥不进仓库"和"启动命令不变"。 |
| 静态部署的前端状态文案 | 静态托管没有后端属于预期，不要向访客显示"后端不可用"，那看起来像站点故障；改为说明内容来源即可，同样诚实。 |
| 首次推送前的秘密扫描 | 又救了一次：Folio 首次公开前扫出 `application-dev.yml` 里的真实库密码。而 LexiFlow 因为已经推过，同样的错误只能靠**轮换**补救——推送前扫描是唯一真正挽救得了的时机，事后一律只能改密码。 |
| 迁移改到一半最危险 | Folio 的 `application-dev.yml` 已经用 `spring.config.import` 从 gitignore 的 `.env` 注入 `DEEPSEEK_API_KEY`，却把数据库密码留成硬编码。同一文件里两种写法并存，说明"改了一部分"比"完全没改"更容易漏，收尾时必须按同一标准通篇复核。 |
| 只有一个未推送提交时才能真删密钥 | 密钥进了历史就删不掉；但**从未推送的单一提交**可以 amend 掉，再用 `git grep` 扫全部历史复核即可确认干净。这个窗口只开一次。 |
| 分支不是独立仓库 | 练习区仓库的 origin 指向本地路径、根提交与 LexiFlow 完全相同，33 个提交里 26 个属于产品本身。把它当"独立练习仓库"推出去，等于把产品代码和历史复制一份，还顺带复制了已泄露的密码。拆独立仓库要连历史一起重建。 |
| 验证必须盯住对象本身 | 核对推送结果时漏写 `-C <仓库>`，`ls-remote` 查的其实是另一个仓库，差点把作品集的 SHA 当成 Folio 的；另一处用空 ref 做 grep，无命中就报了"安全"。**核查命令要显式指定目标，无命中时还要确认不是因为 ref 取空了**。 |
| 脚本的成功输出要能被证伪 | 一次 `Add-Content` 已被沙箱拒绝，PowerShell 仍继续往下执行并打印"已追加"。写操作后必须回读确认，或设 `$ErrorActionPreference='Stop'`；否则日志会替你对人说谎。 |
| 受限环境的子进程边界 | 后端测试需补 `-Djdk.attach.allowAttachSelf=true`（Mockito 注入 agent 要起外部进程）；Vite 构建、浏览器验收、git 联网同样依赖子进程。沙箱禁止管道捕获子进程输出时会出现 `spawn EPERM`、`couldn't create signal pipe`，这是环境边界而非代码缺陷，不要据此改代码。 |

## 当前待办

作品集已交付，交付定性为**静态展示型站点**；后端按「未接入、冻结」处理，原清单里的后端项据此降级。

1. 重新构建 `dist` 并重新部署 Netlify，让案例四（大学新闻网）的文案修正对外生效，随后复跑 42 项浏览器验收。
2. Gitee 仓库改名：`my-translate` → `ai-translator`、`lexi-flow-practice` → `ai-translator-vue-lab`。改名是网页端操作，改名后需更新本地 remote。
3. 轮换 LexiFlow 已公开的 Postgres 密码（`docker-compose.yml`，且遍布全部历史），并改为环境变量注入；删除文件无效。
4. 确认 LexiFlow 练习区仓库的定位后再决定是否推送——它当前包含整个 LexiFlow 代码库并与产品共用历史。
5. 知衡考试分析页返回 500（工作台、题库、改卷三页正常），需要定位服务端异常。
6. 仅在解冻后端时才做：修复公开知识节点未过滤 `published`、revision number 硬编码；补数据库读写与事务回滚验证；把 5 个案例录入 MySQL。

## 后续方向

- `doc/22-future-directions.md`：网状知识图谱、可复用的技术栈试用平台。
- 进入实施前的第一步：按 `doc/00` 的章程判断归属——属于作品集，还是应另立项目。
  技术栈试用平台按章程必须独立立项，作品集只呈现结果与证据、不承载执行。

## 复利闭环

```text
ai-dev-lab 学概念
→ ai-translator / Java 项目精读和验证
→ personal-portfolio 用自己的话整理项目、决策和证据
→ 形成可展示、可复盘、可迁移的能力
```
