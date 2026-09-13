# 运行手册（RUNBOOK）

> 面向任何接手这个仓库的人——包括几个月后的你自己。
> 起点只需一节：**先读「快速开始」**。其余按需查阅。
>
> 最后更新：2026-09-13 · 对应路线阶段 0

## 快速开始

```bash
# 1. 安装 git 钩子并自检环境（只需一次）
node utils/setup.mjs

# 2. 安装前端依赖（只需一次）
cd project/frontend && npm install && cd ../..

# 3. 跑一次门禁，确认环境正常
node utils/verify.mjs
```

`node utils/setup.mjs` 会把 git 钩子目录指向仓库内的 `.githooks/`。**钩子随仓库走**——clone 下来执行一次安装即可，不需要各自复制脚本。

## 日常循环

```bash
# 改代码
node utils/verify.mjs      # 门禁：秘密扫描 → 构建 → 浏览器验收 → 后端测试
git commit -m "..."
git push                   # pre-push 钩子会再跑一次门禁，不通过就推不出去
```

**推送时的门禁范围由钩子自己判定**，不需要记参数：

| 本次推送触及 | 钩子执行 |
|---|---|
| `project/backend/` | 秘密扫描 → 构建 → 浏览器验收 → **后端测试** |
| 只动前端或文档 | 秘密扫描 → 构建 → 浏览器验收 |

钩子装在 `pre-push` 而不是 `pre-commit`：提交是廉价的本地动作，推送才是会把问题带给别人的动作。每次提交都跑完整门禁，只会让人学会用 `--no-verify`，那门禁就废了。

**确需跳过**：`git push --no-verify`。跳过表示你自行承担风险，请勿养成习惯；若因紧急情况跳过，请在提交信息里说明原因。

## 命令清单

| 命令 | 作用 | 耗时 |
|---|---|---|
| `node utils/setup.mjs` | 安装钩子 + 环境自检 | 数秒 |
| `node utils/verify.mjs` | 全部门禁 | 约 2–3 分钟 |
| `node utils/verify.mjs --no-backend` | 跳过后端测试 | 约 1 分钟 |
| `node utils/verify.mjs --no-browser` | 跳过浏览器验收（快速自检） | 约 1 分钟 |
| `node utils/browser-check.mjs <url>` | 只跑浏览器验收（47 项） | 约 40 秒 |
| `python utils/flyway-checksum.py <迁移文件>` | 独立复算 Flyway 迁移校验和 | 数秒 |

**浏览器验收的运行前提**：它需要无头 Chrome 或 Edge，并要求目标 URL 已在运行。`verify.mjs` 会自己启动预览服务（端口 1011）并在结束后关闭，不需要手工开服务。

## 本地开发

```bash
cd project/frontend
node node_modules/vite/bin/vite.js --host 127.0.0.1 --strictPort --port 1001
```

- 必须加 `--strictPort`：端口被占用时 Vite 会**静默 +1**，容易把 A 项目当成 B 项目。
- 部分环境只监听 IPv6，`127.0.0.1` 访问失败时改用 `localhost`。
- 验收截图固定写入仓库根的 `gui-test-screenshots/`（按脚本位置解析，不随当前目录漂移）。

## 环境变量

后端配置走环境变量注入，**不写入源码**。参照 `.env.example` 建立本地 `.env`：

```bash
cp .env.example .env    # 然后按需修改；.env 已被 gitignore
```

| 变量 | 用途 | 必要 |
|---|---|---|
| `DB_URL` / `DB_USERNAME` / `DB_PASSWORD` | 数据库连接 | 仅后端需要 |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | 管理员登录 | 仅后端需要 |
| `SERVER_PORT` | 后端端口（默认 2001） | 否 |
| `FRONTEND_ORIGIN` | 跨域来源 | 否 |

**规则：任何真实凭据都不得进入源码或文档。** `utils/verify.mjs` 的秘密扫描会检查 git 跟踪的文件，命中即阻止推送。

## 部署

**当前状态：推送即自动部署。** Netlify 站点 `taupe-chimera-547f35` 已关联 GitHub 仓库
`Sunshine-mai/personal-portfolio`，监听 `main` 分支。构建配置由 `netlify.toml` 提供。

```bash
git push github main      # 推送后 Netlify 自动拉取、构建、上线
```

**不需要任何额外命令。** `node utils/verify.mjs` 已由 pre-push 钩子自动执行，
门禁不通过就推不出去，坏提交进不了 Netlify。

**部署来源是 GitHub，不是 Gitee。** 原因：Netlify 官方只支持
GitHub / GitLab / Bitbucket / Azure DevOps，**不支持 Gitee**。
所以改完代码必须推到 `github` 这个远端；只推 Gitee 不会触发部署。

**怎么确认线上跑的是哪个版本**（不要靠"感觉已经上线了"）：

```bash
curl -s https://taupe-chimera-547f35.netlify.app/ | grep build-commit
# 输出里的 content 应等于你刚推的提交短号
```

构建时会把提交号写进 `<meta name="build-commit">`（见 `project/frontend/vite.config.js`），
取值优先级：`BUILD_COMMIT` > Netlify 注入的 `COMMIT_REF` > 本地 `.git/HEAD`。
**线上有它，就说明这次部署是从仓库构建的，而不是手工上传的产物。**

**失败时**：Netlify 构建失败会**保留上一次成功部署**，站点不会挂。
在 Netlify 面板的 `Deploys` 里看报错；确认无误后可用 `Trigger deploy → Clear cache and deploy site` 重试。

**回滚**：Netlify 面板 → `Deploys` → 选一个历史成功部署 → `Publish deploy`。

**深链** `/projects/:slug` 依赖 SPA 回退，由 `netlify.toml` 与 `project/frontend/public/_redirects` 提供。改动这两处后必须实测深链返回 200 而非 404。

> 注意：SPA 下未知路径也返回 200（服务器回退到 `index.html`），由前端显示 404 界面。
> 这是设计如此；真正的问题信号是深链返回 404。


## 出问题怎么办

| 现象 | 原因 | 处理 |
|---|---|---|
| `file access denied under workspace-write mode` | 受限沙箱只允许写工作区 | 环境边界，不是代码缺陷。需改工作区外的文件时必须显式申请放宽 |
| `spawn EPERM` / `couldn't create signal pipe` | 受限环境禁止以管道捕获子进程输出 | 环境边界。Vite 构建、无头 Chrome、Maven 测试都会撞到；换普通终端或放宽权限 |
| `failed to execute prompt script` / git 联网失败 | 沙箱禁止 git 的凭据 helper 起子进程 | 环境边界；换普通终端或放宽权限 |
| 钩子里报 `'mvn' is not recognized`，但终端里 `mvn -v` 正常 | 系统 PATH 中存在畸形条目（落单的引号）会让 `cmd.exe` 的可执行文件搜索失效 | 已在 `utils/verify.mjs` 用**绝对路径**调用 Maven 规避。其它工具若遇到，建议清理系统 PATH 中的异常条目 |
| 后端测试 14 项全报 `Could not self-attach to current VM` | 缺少 JVM 参数 | 该参数已配置在 `backend/pom.xml` 的 surefire 里，直接 `mvn test` 即可，不需要命令行传 |
| 门禁说某文件有硬编码口令 | 可能确实是凭据，也可能是误报 | 逐条确认；是凭据就改成环境变量注入，是误报就调整 `verify.mjs` 的判定规则（**不要直接关掉扫描**） |
| `Cannot connect to Chrome DevTools` | 找不到 Chrome/Edge，或它起不来 | 确认安装了 Chrome 或 Edge；受限环境下 Chrome 依赖命名管道而无法启动，需放宽权限 |
| 推送被钩子拦下 | 门禁未通过 | 看输出里失败的那一步；修好后重推。**不要习惯性用 `--no-verify`** |
| `git reset --hard` 之后修改不见了 | 该命令会丢弃未提交的改动 | 它只该用来回退已提交的临时内容；**回退前先确认工作区没有要保留的修改** |

## 相关文档

| 文档 | 用途 |
|---|---|
| `doc/STATUS.md` | 当前状态，唯一权威来源 |
| `doc/23-roadmap.md` | 实施路线：现在到完成要走的阶段 |
| `doc/10-decision-log.md` | 已确认的决策（ADR） |
| `doc/14-portfolio-v2-evidence-inventory.md` | 各项目已核验事实台账 |
| `CLAUDE.md` | 工程协作规范（公开面判定、安全约束） |
