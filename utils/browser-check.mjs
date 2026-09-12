// 浏览器验收脚本：用 Chrome DevTools Protocol 驱动无头 Chrome，验证真实交互而不只是渲染。
//
// 用法：node utils/browser-check.mjs [http://127.0.0.1:1001/]
// 退出码：0 = 全部通过；1 = 有失败项。
//
// 覆盖：首页列表与筛选、卡片为真实链接、点击进入详情页、深链直接访问、
// 未知 slug 的 404 状态、详情页图组与键盘切换、上一个/下一个导航、移动端菜单。
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { existsSync, writeFileSync, mkdirSync } from 'node:fs'

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]
const baseUrl = (process.argv[2] || 'http://127.0.0.1:1001/').replace(/\/$/, '')
const debugPort = 9333
const shotDir = 'gui-test-screenshots'

const chromePath = CHROME_CANDIDATES.find(candidate => existsSync(candidate))
if (!chromePath) {
  console.error('找不到 Chrome 或 Edge，无法执行浏览器验收。')
  process.exit(1)
}

const results = []
function check(name, actual, expected) {
  const ok = typeof expected === 'function' ? expected(actual) : actual === expected
  results.push({ name, ok, actual })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}  ->  ${JSON.stringify(actual)}`)
}

const chrome = spawn(chromePath, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${process.env.TEMP}\\pf-cdp-${Date.now()}`,
  '--window-size=1440,1100',
  `${baseUrl}/`,
], { stdio: 'ignore' })

let target = null
for (let attempt = 0; attempt < 40 && !target; attempt++) {
  await sleep(500)
  try {
    const list = await (await fetch(`http://127.0.0.1:${debugPort}/json/list`)).json()
    target = list.find(item => item.type === 'page' && item.webSocketDebuggerUrl)
  } catch { /* devtools 还没起来 */ }
}
if (!target) {
  console.error('无法连接 Chrome DevTools，验收中止。')
  chrome.kill()
  process.exit(1)
}

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(resolve => socket.addEventListener('open', resolve, { once: true }))

let messageId = 0
const pending = new Map()
socket.addEventListener('message', event => {
  const message = JSON.parse(event.data)
  if (message.id && pending.has(message.id)) {
    pending.get(message.id)(message)
    pending.delete(message.id)
  }
})
function send(method, params = {}) {
  const id = ++messageId
  return new Promise(resolve => {
    pending.set(id, resolve)
    socket.send(JSON.stringify({ id, method, params }))
  })
}
async function evaluate(expression) {
  const response = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (response.result?.exceptionDetails) {
    throw new Error(response.result.exceptionDetails.exception?.description || 'evaluate failed')
  }
  return response.result?.result?.value
}
async function goto(path, waitMs = 2600) {
  await evaluate(`location.href = ${JSON.stringify(baseUrl + path)}`)
  await sleep(waitMs)
}
async function capture(name) {
  mkdirSync(shotDir, { recursive: true })
  const response = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${shotDir}/${name}`, Buffer.from(response.result.data, 'base64'))
  console.log(`SHOT  ${shotDir}/${name}`)
}

try {
  await send('Runtime.enable')
  await send('Page.enable')
  await sleep(2800)

  // ===== 首页 =====
  check('首屏独立项目统计已渲染', await evaluate(`document.querySelector('.hero-facts div:nth-child(2) strong')?.textContent.trim() || ''`), value => /个独立项目$/.test(value))
  check('项目卡片数量', await evaluate(`document.querySelectorAll('.project-card').length`), 4)
  check('API 状态行已渲染', await evaluate(`!!document.querySelector('.api-status')`), true)

  const labels = await evaluate(`[...document.querySelectorAll('.visual-label')].map(el => el.textContent.trim())`)
  check('设计版式标签只出现一次', labels.filter(item => item === '设计版式').length, 1)
  check('公开截图标签出现三次', labels.filter(item => item === '公开截图').length, 3)

  // 卡片必须是真实链接，而不是打开抽屉的按钮
  check('卡片是链接元素', await evaluate(`document.querySelectorAll('a.project-card').length`), 4)
  check('卡片链接指向详情路由', await evaluate(`document.querySelector('a.project-card')?.getAttribute('href') || ''`), value => /^\/projects\//.test(value))
  check('页面内不再有抽屉元素', await evaluate(`!document.querySelector('.drawer')`), true)

  // ===== 点击进入详情页 =====
  await evaluate(`document.querySelectorAll('a.project-card')[0].click()`)
  await sleep(2600)
  check('点击后进入详情页', await evaluate(`location.pathname`), '/projects/ai-translator')
  check('详情页标题已渲染', await evaluate(`document.querySelector('.detail-hero h1')?.textContent.trim() || ''`), 'LexiFlow')
  check('详情页有返回链接', await evaluate(`!!document.querySelector('.detail-back')`), true)
  check('详情页状态与角色已渲染', await evaluate(`document.querySelectorAll('.detail-facts dd').length`), 2)
  check('图组缩略图数量', await evaluate(`document.querySelectorAll('.gallery-thumbs button').length`), 3)
  check('图组计数文案', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '1 / 3')
  check('证据状态行已渲染', await evaluate(`document.querySelector('.gallery-evidence')?.textContent.includes('证据状态') || false`), true)
  await capture('v11-detail-lexiflow.png')

  // 图组翻页
  await evaluate(`document.querySelector('.gallery-bar button:last-child').click()`)
  await sleep(400)
  check('下一张按钮可用', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '2 / 3')
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))`)
  await sleep(400)
  check('右箭头前进', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '3 / 3')
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))`)
  await sleep(400)
  check('右箭头从末张循环回首张', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '1 / 3')

  // ===== 深链：直接访问详情页 =====
  await goto('/projects/ai-second-brain')
  check('深链直达详情页', await evaluate(`document.querySelector('.detail-hero h1')?.textContent.trim() || ''`), 'AI Second Brain')
  check('深链下图组正常', await evaluate(`document.querySelectorAll('.gallery-thumbs button').length`), 3)

  // ===== 上一个 / 下一个 =====
  check('分页导航显示下一个项目', await evaluate(`document.querySelector('.pager-link.is-next strong')?.textContent.trim() || ''`), value => value.length > 0)
  await evaluate(`document.querySelector('.pager-link.is-next').click()`)
  await sleep(2400)
  check('点击下一个可跳转', await evaluate(`location.pathname`), '/projects/zhiheng-teaching')

  // ===== 未知 slug =====
  await goto('/projects/does-not-exist')
  check('未知项目显示 404 状态', await evaluate(`!!document.querySelector('.detail-loading h1')`), true)
  check('404 提供返回入口', await evaluate(`!!document.querySelector('.detail-loading a.button')`), true)

  // ===== 设计版式徽标（合作项目） =====
  await goto('/projects/university-news')
  check('合作项目显示设计版式徽标', await evaluate(`document.querySelector('.gallery-kind')?.textContent.trim() || ''`), '设计版式 · 非截图')
  check('合作项目只有一张图', await evaluate(`document.querySelectorAll('.gallery-thumbs button').length`), 0)
  await capture('v11-detail-collab.png')

  // ===== 返回首页并验证筛选 =====
  await goto('/')
  await evaluate(`[...document.querySelectorAll('[role="tab"]')].find(b => b.textContent.includes('合作项目')).click()`)
  await sleep(400)
  check('筛选：合作项目', await evaluate(`document.querySelectorAll('.project-card').length`), 1)
  await evaluate(`[...document.querySelectorAll('[role="tab"]')].find(b => b.textContent.includes('原型方案')).click()`)
  await sleep(400)
  check('筛选：原型方案（当前无此类项目，应为 0 并给出空状态）', await evaluate(`document.querySelectorAll('.project-card').length`), 0)
  check('空状态文案已渲染', await evaluate(`!!document.querySelector('.project-empty')`), true)
  await evaluate(`[...document.querySelectorAll('[role="tab"]')].find(b => b.textContent.trim() === '全部').click()`)
  await sleep(400)
  check('筛选：全部', await evaluate(`document.querySelectorAll('.project-card').length`), 4)

  // ===== 移动端菜单 =====
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await sleep(600)
  await evaluate(`document.querySelector('.menu-button').click()`)
  await sleep(400)
  check('移动端菜单可展开', await evaluate(`document.querySelector('.nav-links').classList.contains('open')`), true)
} catch (error) {
  console.error('验收过程中出错：', error.message)
  results.push({ name: '执行异常', ok: false, actual: error.message })
} finally {
  const failed = results.filter(item => !item.ok)
  console.log(`\n合计 ${results.length} 项，通过 ${results.length - failed.length} 项，失败 ${failed.length} 项。`)
  socket.close()
  chrome.kill()
  process.exit(failed.length ? 1 : 0)
}
