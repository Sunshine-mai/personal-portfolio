// 采集知衡教学平台真实系统的教师端截图。
// 走真实登录、真实接口、真实数据库，不是业务原型的静态页面。
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { writeFileSync, mkdirSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://localhost:1002'
const PORT = 9348
const OUT = 'gui-test-screenshots'

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}\\pf-zhiheng-${Date.now()}`,
  '--window-size=1440,1040',
  `${BASE}/login`,
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
const text = () => evaluate(`document.body.innerText.replace(/\\n{2,}/g, '\\n').slice(0, 420)`)
const setInput = (selector, value) => evaluate(`(() => {
  const el = document.querySelector(${JSON.stringify(selector)})
  if (!el) return 'missing'
  const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
  setter.call(el, ${JSON.stringify(value)})
  el.dispatchEvent(new Event('input', { bubbles: true }))
  return el.value
})()`)

try {
  await send('Runtime.enable')
  await send('Page.enable')
  await sleep(4000)

  console.log('=== 登录 ===')
  console.log('账号框:', await setInput('input[placeholder="请输入账号"]', 'teacher1'))
  console.log('密码框:', await setInput('input[placeholder="请输入密码"]', 'teacher123'))
  await sleep(400)
  await evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b => /登\\s*录/.test(b.textContent))
    if (btn) btn.click()
    return !!btn
  })()`)
  await sleep(4000)
  console.log('登录后路径:', await evaluate(`location.pathname`))

  console.log('=== 教师工作台 ===')
  await evaluate(`location.href = ${JSON.stringify(BASE + '/teacher/dashboard')}`)
  await sleep(3800)
  console.log(await text())
  await capture('v13-zhiheng-dashboard.png')

  console.log('=== 题库管理 ===')
  await evaluate(`location.href = ${JSON.stringify(BASE + '/teacher/questions')}`)
  await sleep(3800)
  console.log(await text())
  await capture('v13-zhiheng-questions.png')

  console.log('=== 考试管理 ===')
  await evaluate(`location.href = ${JSON.stringify(BASE + '/teacher/exams')}`)
  await sleep(3800)
  console.log(await text())
  await capture('v13-zhiheng-exams.png')

  console.log('=== 考试分析（点击第一场考试的「查看分析」）===')
  const clickedAnalysis = await evaluate(`(() => {
    const btn = [...document.querySelectorAll('button, a')].find(el => el.textContent.trim() === '查看分析')
    if (!btn) return 'not-found'
    btn.click()
    return 'clicked'
  })()`)
  console.log('点击查看分析:', clickedAnalysis)
  await sleep(4200)
  console.log('路径:', await evaluate(`location.pathname`))
  console.log(await text())
  await capture('v13-zhiheng-analysis.png')

  console.log('=== 逐题改卷（回到考试列表点击第一场「开始改卷」）===')
  await evaluate(`location.href = ${JSON.stringify(BASE + '/teacher/exams')}`)
  await sleep(3600)
  const clickedGrading = await evaluate(`(() => {
    const btn = [...document.querySelectorAll('button, a')].find(el => el.textContent.trim() === '开始改卷')
    if (!btn) return 'not-found'
    btn.click()
    return 'clicked'
  })()`)
  console.log('点击开始改卷:', clickedGrading)
  await sleep(4200)
  console.log('路径:', await evaluate(`location.pathname`))
  console.log(await text())
  await capture('v13-zhiheng-grading.png')
} catch (error) {
  console.error('capture error:', error.message)
} finally {
  socket.close()
  chrome.kill()
}
