// 浏览器验收脚本：用 Chrome DevTools Protocol 驱动无头 Chrome，验证交互而不只是渲染。
// 用法：node utils/browser-check.mjs [http://127.0.0.1:1001/]
// 退出码：0 = 全部通过；1 = 有失败项。
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]
const targetUrl = process.argv[2] || 'http://127.0.0.1:1001/'
const debugPort = 9333

const { existsSync, writeFileSync, mkdirSync } = await import('node:fs')
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
  '--headless=new',
  '--disable-gpu',
  '--no-first-run',
  '--no-default-browser-check',
  `--remote-debugging-port=${debugPort}`,
  `--user-data-dir=${process.env.TEMP}\\pf-cdp-check`,
  '--window-size=1440,1000',
  targetUrl,
], { stdio: 'ignore' })

let target = null
for (let attempt = 0; attempt < 40 && !target; attempt++) {
  await sleep(500)
  try {
    const response = await fetch(`http://127.0.0.1:${debugPort}/json/list`)
    const list = await response.json()
    target = list.find(item => item.type === 'page' && item.webSocketDebuggerUrl)
  } catch { /* devtools 还没起来，继续等 */ }
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
const shotDir = 'gui-test-screenshots'
async function capture(name) {
  mkdirSync(shotDir, { recursive: true })
  const response = await send('Page.captureScreenshot', { format: 'png' })
  const data = response.result?.data
  if (!data) {
    console.log(`SKIP  截图失败 ${name}`)
    return
  }
  writeFileSync(`${shotDir}/${name}`, Buffer.from(data, 'base64'))
  console.log(`SHOT  ${shotDir}/${name}`)
}

try {
  await send('Runtime.enable')
  await sleep(2500)

  // 1. 首屏与列表
  check('首屏独立项目统计', await evaluate(`document.querySelector('.hero-facts div:nth-child(2) strong').textContent.trim()`), '2 个独立项目')
  check('项目卡片数量', await evaluate(`document.querySelectorAll('.project-card').length`), 4)
  check('API 状态行已渲染', await evaluate(`!!document.querySelector('.api-status') && document.querySelector('.api-status').textContent.length > 0`), true)

  // 2. 卡片标签区分截图与设计版式
  const labels = await evaluate(`[...document.querySelectorAll('.visual-label')].map(el => el.textContent.trim())`)
  check('设计版式标签只出现一次', labels.filter(item => item === '设计版式').length, 1)
  check('公开截图标签出现三次', labels.filter(item => item === '公开截图').length, 3)

  // 3. 打开第一个案例，检查图组
  await evaluate(`document.querySelectorAll('.card-link')[0].click()`)
  await sleep(1200)
  check('抽屉已打开', await evaluate(`!!document.querySelector('.drawer')`), true)
  check('图组缩略图数量', await evaluate(`document.querySelectorAll('.gallery-thumbs button').length`), 2)
  check('图组计数文案', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '1 / 2')

  const firstStep = await evaluate(`document.querySelector('.gallery-step').textContent.trim()`)
  const firstCaption = await evaluate(`document.querySelector('.gallery-caption').textContent.trim()`)
  check('首张步骤标签非空', firstStep.length > 0, true)
  check('首张说明文案非空', firstCaption.length > 10, true)

  // 4. 点击下一张
  await evaluate(`document.querySelector('.gallery-bar button:last-child').click()`)
  await sleep(400)
  check('切换到第 2 张', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '2 / 2')
  const secondCaption = await evaluate(`document.querySelector('.gallery-caption').textContent.trim()`)
  check('说明文案随图切换', secondCaption !== firstCaption, true)

  // 5. 键盘右箭头循环回第一张
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))`)
  await sleep(400)
  check('右箭头循环回到第 1 张', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '1 / 2')

  // 6. 点击缩略图直接跳转
  await evaluate(`document.querySelectorAll('.gallery-thumbs button')[1].click()`)
  await sleep(400)
  check('缩略图可跳转到第 2 张', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '2 / 2')

  // 7. Escape 关闭抽屉
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
  await sleep(500)
  check('Escape 关闭抽屉', await evaluate(`!document.querySelector('.drawer')`), true)
  check('抽屉关闭后恢复滚动', await evaluate(`document.body.style.overflow === ''`), true)

  // 8. 合作项目卡片显示设计版式说明
  await evaluate(`[...document.querySelectorAll('.card-link')][3].click()`)
  await sleep(1200)
  check('合作项目显示设计版式徽标', await evaluate(`document.querySelector('.gallery-kind')?.textContent.trim() || ''`), '设计版式 · 非截图')
  check('合作项目只有一张图', await evaluate(`document.querySelectorAll('.gallery-thumbs button').length`), 0)
  check('证据状态行已渲染', await evaluate(`document.querySelector('.gallery-evidence')?.textContent.includes('证据状态') || false`), true)
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
  await sleep(400)

  // 9. 筛选
  await evaluate(`[...document.querySelectorAll('[role="tab"]')].find(b => b.textContent.includes('合作项目')).click()`)
  await sleep(400)
  check('筛选：合作项目', await evaluate(`document.querySelectorAll('.project-card').length`), 1)
  await evaluate(`[...document.querySelectorAll('[role="tab"]')].find(b => b.textContent.includes('原型方案')).click()`)
  await sleep(400)
  check('筛选：原型方案', await evaluate(`document.querySelectorAll('.project-card').length`), 1)
  await evaluate(`[...document.querySelectorAll('[role="tab"]')].find(b => b.textContent.trim() === '全部').click()`)
  await sleep(400)
  check('筛选：全部', await evaluate(`document.querySelectorAll('.project-card').length`), 4)

  // 10. 截图证据：抽屉图组的两步，以及合作项目的设计版式徽标
  await send('Page.enable')
  await evaluate(`document.querySelectorAll('.card-link')[0].click()`)
  await sleep(1200)
  await capture('v7-drawer-gallery-step1.png')
  await evaluate(`document.querySelector('.gallery-bar button:last-child').click()`)
  await sleep(500)
  await capture('v7-drawer-gallery-step2.png')
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
  await sleep(500)
  await evaluate(`document.querySelectorAll('.card-link')[3].click()`)
  await sleep(1200)
  await capture('v7-drawer-layout-badge.png')
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
  await sleep(500)

  // 11. 移动端菜单
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
