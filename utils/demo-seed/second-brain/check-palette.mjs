// 验证 Folio 上传区与文档卡片是否仍是白色背景。
// 注入一个占位 token 让路由守卫放行到 /documents，直接读取计算样式判断。
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const PORT = 9349

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}\\pf-palette-${Date.now()}`,
  '--window-size=1440,1040',
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
  await sleep(3500)

  console.log('=== 登录页：左侧品牌面板背景色 ===')
  console.log(await evaluate(`(() => {
    const panel = [...document.querySelectorAll('div')].find(d => /linear-gradient/.test(d.getAttribute('style') || ''))
    return panel ? getComputedStyle(panel).backgroundImage.slice(0, 90) : 'not-found'
  })()`))

  await evaluate(`localStorage.setItem('token', 'placeholder-for-style-check')`)
  await evaluate(`location.href = 'http://localhost:5173/documents'`)
  await sleep(4500)
  console.log('路径:', await evaluate(`location.pathname`))

  console.log('=== 上传区容器背景 ===')
  console.log(await evaluate(`(() => {
    const el = [...document.querySelectorAll('div')].find(d => d.textContent.trim().startsWith('上传文档') && d.className.includes('rounded-xl'))
    return el ? getComputedStyle(el).backgroundColor : 'not-found'
  })()`))

  console.log('=== Element Plus 拖拽区背景与边框 ===')
  console.log(await evaluate(`(() => {
    const d = document.querySelector('.el-upload-dragger')
    if (!d) return 'not-found'
    const s = getComputedStyle(d)
    return { background: s.backgroundColor, border: s.borderColor, borderStyle: s.borderStyle }
  })()`))

  console.log('=== 仍然使用白色背景的元素 ===')
  console.log(await evaluate(`[...document.querySelectorAll('*')]
    .filter(el => {
      const bg = getComputedStyle(el).backgroundColor
      return bg === 'rgb(255, 255, 255)'
    })
    .map(el => el.tagName + '.' + String(el.className).slice(0, 46))
    .slice(0, 12)`))
} catch (error) {
  console.error('check error:', error.message)
} finally {
  socket.close()
  chrome.kill()
}
