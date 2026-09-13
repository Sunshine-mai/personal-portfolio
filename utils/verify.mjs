// 一条命令跑完全部门禁。团队与本机都用它，CI 以后接同一份命令即可。
//
//   node utils/verify.mjs               全部检查（含后端测试，需要 Java 与 Maven）
//   node utils/verify.mjs --no-backend   跳过后端测试（只改前端时用）
//   node utils/verify.mjs --no-browser   跳过浏览器验收（快速自检用）
//
// 退出码：0 = 全部通过；1 = 有任一步失败。任何一步失败立即中止，不产生"部分通过"。
//
// 设计取舍：
// - 子进程一律用 stdio:'inherit'，在受限沙箱下也能运行（管道捕获会被拒绝）。
// - 秘密扫描的对象是 git 跟踪的文件，因为那才是真正会被发布出去的东西；
//   光看工作目录会把 .env 这类已被忽略的文件也算进来，得出虚假的失败。
import { spawn, spawnSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { join, dirname, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const frontend = join(root, 'project', 'frontend')
const backend = join(root, 'project', 'backend')
const args = process.argv.slice(2)
const skipBackend = args.includes('--no-backend')
const skipBrowser = args.includes('--no-browser')

const PREVIEW_PORT = 1011
const PREVIEW_URL = `http://127.0.0.1:${PREVIEW_PORT}/`

let stepNo = 0
function step(title) {
  stepNo += 1
  console.log(`\n\u2501\u2501\u2501 [${stepNo}] ${title} \u2501\u2501\u2501`)
}
function fail(message) {
  console.error(`\n\u274c 门禁未通过：${message}`)
  process.exit(1)
}
function ok(message) {
  console.log(`\u2705 ${message}`)
}

function run(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: options.cwd || root,
    stdio: 'inherit',
    // Windows 上 mvn 实际是 mvn.cmd，不经过 shell 无法执行。不处理会得到一个
    // 假的"命令无法启动"，让门禁看起来是坏的——假警报和漏报一样有害。
    shell: options.shell === true,
  })
  if (result.error) fail(`${command} 无法启动：${result.error.message}`)
  if (result.status !== 0) fail(`${command} ${commandArgs.join(' ')} 退出码 ${result.status}`)
}

// ── 1. 秘密扫描：扫描 git 跟踪的文件，也就是真正会公开的那批 ──────────────────
function secretScan() {
  step('秘密扫描（对象：git 跟踪的文件）')

  const listed = spawnSync('git', ['-C', root, 'ls-files'], { encoding: 'utf8' })
  if (listed.status !== 0) fail('无法列出跟踪文件，请确认在 git 仓库内运行')
  const files = listed.stdout.split('\n').map(line => line.trim()).filter(Boolean)

  // 依赖目录与压缩产物不参与扫描：它们的命中都是误报，只会制造噪声。
  const skip = /node_modules|\/dist\/|\/target\/|package-lock|\.min\.js|swagger-ui|\.png$|\.jpe?g$|\.ico$|\.woff2?$/i

  // 只在"看起来是真实值"时报错。误报会让工具被忽略，而被忽略的扫描器等于不存在。
  const PLACEHOLDER = /change[-_]?me|please[-_]?change|placeholder|example|your[-_]|\*\*\*|x{3,}|dummy|sample|redacted|<[^>]+>/i
  // 裸值形式（DB_PASSWORD=040127）只在这些配置类文件里检查；放到代码文件里会大量误报
  // 变量赋值（this.adminPassword = adminPassword）与测试夹具（"ADMIN_PASSWORD=secret"）。
  const CONFIG_FILE = /(^|\/)(\.env|\.env\..+|[\w.-]+\.(env|ya?ml|properties|toml|ini|conf|cfg|sh|ps1|tf))$/i

  const checks = [
    { name: '私钥', re: /-----BEGIN [A-Z ]*PRIVATE KEY/ },
    { name: 'OpenAI 风格密钥', re: /sk-[A-Za-z0-9_-]{16,}/ },
    { name: 'Google API Key', re: /AIza[A-Za-z0-9_-]{20,}/ },
    { name: 'AWS Access Key', re: /AKIA[0-9A-Z]{12,}/ },
    { name: 'GitHub Token', re: /ghp_[A-Za-z0-9]{20,}/ },
    { name: '硬编码口令（带引号）', re: /(password|passwd|pwd)["']?\s*[:=]\s*["']([^"']{6,})["']/i, value: 2 },
    { name: '硬编码口令（配置文件）', re: /^\s*[\w.-]*(password|passwd|pwd)[\w.-]*\s*[:=]\s*([^\s"'#$]{6,})\s*$/i, value: 2, configOnly: true },
  ]

  let hits = 0
  for (const file of files) {
    if (skip.test(file)) continue
    const full = join(root, file)
    if (!existsSync(full)) continue
    let text
    try {
      text = readFileSync(full, 'utf8')
    } catch {
      continue // 二进制文件
    }
    text.split('\n').forEach((line, index) => {
      for (const check of checks) {
        if (check.configOnly && !CONFIG_FILE.test(file)) continue
        const match = check.re.exec(line)
        if (!match) continue
        // 文档里举例说明占位符写法属于正常内容。
        if (/占位|示例/.test(line)) continue
        if (check.value) {
          const value = match[check.value]
          if (!value || PLACEHOLDER.test(value)) continue
          // 右值仍是口令类变量名而非字面量（this.adminPassword = adminPassword），不是凭据。
          if (/(password|passwd|pwd)/i.test(value)) continue
        }
        console.log(`  \u26a0 ${file}:${index + 1} [${check.name}] ${line.trim().slice(0, 120)}`)
        hits += 1
      }
    })
  }

  if (hits > 0) fail(`秘密扫描命中 ${hits} 处，逐条确认后再提交（不确定就改成环境变量注入）`)
  ok(`已扫描 ${files.length} 个跟踪文件，未命中硬编码凭据`)
}

// ── 2. 前端构建 ──────────────────────────────────────────────────────────────
function buildFrontend() {
  step('前端构建')
  const vite = join(frontend, 'node_modules', 'vite', 'bin', 'vite.js')
  if (!existsSync(vite)) fail('未找到 vite，请先在 project/frontend 执行依赖安装')
  run(process.execPath, [vite, 'build'], { cwd: frontend })
  ok('构建完成')
}

// ── 3. 浏览器验收：对生产产物执行，不是对开发服务 ─────────────────────────────
async function browserAcceptance() {
  step(`浏览器验收（对象：vite preview 托管的生产产物 ${PREVIEW_URL}）`)
  const vite = join(frontend, 'node_modules', 'vite', 'bin', 'vite.js')

  const preview = spawn(process.execPath, [
    vite, 'preview', '--host', '127.0.0.1', '--strictPort', '--port', String(PREVIEW_PORT),
  ], { cwd: frontend, stdio: 'ignore' })

  let ready = false
  for (let attempt = 0; attempt < 40 && !ready; attempt += 1) {
    await new Promise(resolve => setTimeout(resolve, 500))
    try {
      const response = await fetch(PREVIEW_URL)
      ready = response.ok
    } catch { /* 还没起来 */ }
  }

  try {
    if (!ready) fail(`预览服务未在 ${PREVIEW_URL} 就绪`)
    const checked = spawnSync(process.execPath, [join(root, 'utils', 'browser-check.mjs'), PREVIEW_URL], {
      cwd: root,
      stdio: 'inherit',
    })
    if (checked.status !== 0) fail('浏览器验收未全部通过')
    ok('浏览器验收全部通过')
  } finally {
    preview.kill()
  }
}

// ── 4. 后端测试 ──────────────────────────────────────────────────────────────
function backendTests() {
  step('后端测试')
  // -Djdk.attach.allowAttachSelf=true 是必须的：Mockito 注入 agent 要起外部进程，
  // 缺这个参数时 14 项会全部报 "Could not self-attach to current VM"。
  run('mvn', ['-o', 'test', '-DargLine=-Djdk.attach.allowAttachSelf=true'], { cwd: backend, shell: true })
  ok('后端测试通过')
}

async function main() {
  console.log('作品集门禁：秘密扫描 → 构建 → 浏览器验收 → 后端测试')
  secretScan()
  buildFrontend()
  if (skipBrowser) {
    console.log('\n（已按 --no-browser 跳过浏览器验收）')
  } else {
    await browserAcceptance()
  }
  if (skipBackend) {
    console.log('\n（已按 --no-backend 跳过后端测试）')
  } else {
    backendTests()
  }
  console.log(`\n\u2705 全部门禁通过（${stepNo} 步）`)
}

main().catch(error => fail(error.stack || String(error)))
