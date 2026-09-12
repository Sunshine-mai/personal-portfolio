// 采集 Second Brain 登录页截图，用于替换风格不一致的旧图。视口与其他截图保持一致。
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { writeFileSync, mkdirSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9347
const OUT = 'gui-test-screenshots'

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}\\pf-login-${Date.now()}`,
  '--window-size=1440,1000',
  'http://localhost:5173/login',
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

try {
  await send('Runtime.enable')
  await send('Page.enable')
  await sleep(4000)
  console.log('路径:', await evaluate(`location.pathname`))
  console.log('标题:', await evaluate(`document.title`))
  console.log('是否为登录页:', await evaluate(`!!document.querySelector('input[placeholder="请输入用户名"]')`))
  console.log('页面文案:', await evaluate(`document.body.innerText.replace(/\\n+/g, ' | ').slice(0, 220)`))

  mkdirSync(OUT, { recursive: true })
  const res = await send('Page.captureScreenshot', { format: 'png' })
  writeFileSync(`${OUT}/v12-brain-login.png`, Buffer.from(res.result.data, 'base64'))
  console.log(`SHOT  ${OUT}/v12-brain-login.png`)
} catch (error) {
  console.error('capture error:', error.message)
} finally {
  socket.close()
  chrome.kill()
}
