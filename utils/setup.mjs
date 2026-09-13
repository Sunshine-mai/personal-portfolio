// 一次性环境安装与自检。新人入职只需这一条命令。
//
//   node utils/setup.mjs
//
// 做三件事：
//   1. 把 git 钩子目录指向仓库内的 .githooks（钩子本身可以被版本控制、能被 clone 带走）
//   2. 检查工具链是否齐全，缺什么直接说清怎么装
//   3. 打印下一步该跑什么
import { spawnSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')

function git(args) {
  return spawnSync('git', ['-C', root, ...args], { encoding: 'utf8' })
}

console.log('=== 作品集环境安装与自检 ===\n')

// ── 1. 安装钩子 ──────────────────────────────────────────────────────────────
console.log('[1/3] 安装 git 钩子')
if (!existsSync(join(root, '.githooks', 'pre-push'))) {
  console.error('  ❌ 找不到 .githooks/pre-push，仓库可能不完整')
  process.exit(1)
}
const set = git(['config', 'core.hooksPath', '.githooks'])
if (set.status !== 0) {
  console.error(`  ❌ 设置 core.hooksPath 失败：${set.stderr.trim()}`)
  process.exit(1)
}
const current = git(['config', 'core.hooksPath']).stdout.trim()
console.log(`  ✅ core.hooksPath = ${current}`)
console.log('     未通过 utils/verify.mjs 的改动将被阻止推送')

// 让钩子在 Linux/macOS 上也可执行（Windows 不依赖该权限位）
git(['update-index', '--chmod=+x', '.githooks/pre-push'])

// ── 2. 工具链自检 ────────────────────────────────────────────────────────────
console.log('\n[2/3] 工具链自检')
const checks = [
  { name: 'Node.js', command: 'node', args: ['--version'], need: '构建前端与运行验收' },
  { name: 'Git', command: 'git', args: ['--version'], need: '版本控制与钩子' },
  { name: 'Java', command: 'java', args: ['-version'], need: '仅后端测试需要' },
  { name: 'Maven', command: 'mvn', args: ['-v'], need: '仅后端测试需要' },
]
const missing = []
for (const check of checks) {
  // shell 是必须的：Windows 上 mvn 是 mvn.cmd、java 也可能是包装脚本，
  // 不经过 shell 直接 spawn 会得到假的"未找到"。假警报会让自检失去信任。
  const result = spawnSync(check.command, check.args, {
    encoding: 'utf8',
    shell: process.platform === 'win32',
  })
  const found = !result.error && result.status === 0
  const version = found
    ? (result.stdout || result.stderr).split('\n')[0].trim().slice(0, 60)
    : ''
  console.log(`  ${found ? '✅' : '⚠️ '} ${check.name}${found ? ` — ${version}` : ` — 未找到（${check.need}）`}`)
  if (!found) missing.push(check.name)
}

// 前端依赖是跑构建与验收的前提，缺了会让人以为门禁坏了
const vite = join(root, 'project', 'frontend', 'node_modules', 'vite', 'bin', 'vite.js')
if (existsSync(vite)) {
  console.log('  ✅ 前端依赖已安装')
} else {
  console.log('  ⚠️  前端依赖未安装 — 请在 project/frontend 执行依赖安装')
  missing.push('前端依赖')
}

// ── 3. 下一步 ────────────────────────────────────────────────────────────────
console.log('\n[3/3] 下一步')
if (missing.length === 0) {
  console.log('  环境齐备。提交前跑一次门禁：')
  console.log('    node utils/verify.mjs')
} else {
  console.log(`  缺少：${missing.join('、')}`)
  console.log('  只改前端时可以跳过后端测试：')
  console.log('    node utils/verify.mjs --no-backend')
  if (missing.includes('Java') || missing.includes('Maven')) {
    console.log('  说明：后端按「未接入、冻结」处理，日常开发不需要 Java 与 Maven。')
  }
}
