import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = dirname(fileURLToPath(import.meta.url))
const repoRoot = join(rootDir, '..', '..')

// 读取当前提交号。刻意不调用 git 子进程，直接读 .git/HEAD 与它指向的引用文件：
// 这样构建不依赖外部进程，在任何环境下都能拿到版本标识。
function readCommit() {
  if (process.env.BUILD_COMMIT) return process.env.BUILD_COMMIT
  try {
    const gitDir = join(repoRoot, '.git')
    const head = readFileSync(join(gitDir, 'HEAD'), 'utf8').trim()
    if (!head.startsWith('ref: ')) return head.slice(0, 7)
    return readFileSync(join(gitDir, head.slice(5)), 'utf8').trim().slice(0, 7)
  } catch {
    return 'unknown'
  }
}

const commit = readCommit()

// 把构建版本写进 HTML，让线上页面能自证是哪个提交构建的。
// 放在 meta 而不是只放页脚：这样用一次 HTTP GET 就能核对版本，不需要执行页面脚本。
// 占位缺失时直接让构建失败——静默丢掉版本标识比构建失败更糟。
function buildStamp() {
  return {
    name: 'build-stamp',
    transformIndexHtml(html) {
      if (!html.includes('<!--build-stamp-->')) {
        throw new Error('index.html 缺少 <!--build-stamp--> 占位，构建版本无法写入')
      }
      return html.replace('<!--build-stamp-->', `<meta name="build-commit" content="${commit}" />`)
    },
  }
}

export default defineConfig({
  plugins: [vue(), buildStamp()],
  server: {
    port: 1001,
    proxy: {
      '/api': 'http://127.0.0.1:2001',
    },
  },
})
