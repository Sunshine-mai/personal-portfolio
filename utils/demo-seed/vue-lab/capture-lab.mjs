// 采集 ai-translator-vue-lab（练习场）的截图，用于作品集的「练习与实验」案例。
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { writeFileSync, mkdirSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://localhost:5177'
const PORT = 9350
const OUT = 'gui-test-screenshots'

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}\\pf-lab-${Date.now()}`,
  '--window-size=1440,1040',
  `${BASE}/`,
], { stdio: 'ignore' })

let target = null
for (let i = 0; i < 40 && !target; i++) {
  await sleep(500)
  try {
    const list = await (await fetch(`http://127.0.0.1:${PORT}/json/list`)).json()
    target = list.find(t => t.type === 'page' && t.webSocketDebuggerUrl)
  } catch {}
}
if (!target) { console.error('no devtools'); chrome.kill(); process.exit(1) }

const socket = new WebSocket(target.webSocketDebuggerUrl)
await new Promise(r => socket.addEventListener('open', r, { once: true }))
let messageId = 0
const pending = new Map()
socket.addEventListener('message', event => {
  const msg = JSON.parse(event.data)
  if (msg.id && pending.has(msg.id)) { pending.get(msg.id)(msg); pending.delete(msg.id) }
})
const send = (method, params = {}) => new Promise(resolve => {
  const id = ++messageId
  pending.set(id, resolve)
  socket.send(JSON.stringify({ id, method, params }))
})
async function evaluate(expression) {
  const res = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true })
  if (res.result?.exceptionDetails) throw new Error(res.result.exceptionDetails.exception?.description || 'eval failed')
  return res.result?.result?.value
}
async function capture(name) {
  mkdirSync(OUT, { recursive: true })
  const res = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${OUT}/${name}`, Buffer.from(res.result.data, 'base64'))
  console.log(`SHOT  ${OUT}/${name}`)
}
const summary = () => evaluate(`document.body.innerText.replace(/\\n{2,}/g, '\\n').slice(0, 260)`)

try {
  await send('Runtime.enable')
  await send('Page.enable')
  await sleep(4000)

  console.log('=== 首页 ===')
  console.log('路径:', await evaluate(`location.pathname`), '标题:', await evaluate(`document.title`))
  console.log(await summary())
  await capture('v14-lab-home.png')

  // 找出所有可用的路由链接
  const routes = await evaluate(`[...new Set([...document.querySelectorAll('a[href^="/"]')].map(a => a.getAttribute('href')))].slice(0, 14)`)
  console.log('页面上的路由:', JSON.stringify(routes))

  for (const [path, name] of [['/playground', 'v14-lab-playground.png'], ['/translate', 'v14-lab-translate.png'], ['/stats', 'v14-lab-stats.png']]) {
    await evaluate(`location.href = ${JSON.stringify(BASE)} + ${JSON.stringify(path)}`)
    await sleep(3200)
    const current = await evaluate(`location.pathname`)
    if (current !== path) { console.log(`  ${path} -> 被重定向到 ${current}，跳过`); continue }
    console.log(`=== ${path} ===`)
    console.log(await summary())
    await capture(name)
  }
} catch (error) {
  console.error('capture error:', error.message)
} finally {
  socket.close()
  chrome.kill()
}
