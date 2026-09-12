// Capture AI Second Brain screenshots with a safety gate:
// the chat screenshot is only written if every retrieved reference belongs to the demo account.
import { spawn } from 'node:child_process'
import { setTimeout as sleep } from 'node:timers/promises'
import { writeFileSync, mkdirSync } from 'node:fs'

const CHROME = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
const BASE = 'http://localhost:5173'
const PORT = 9346
const OUT = 'gui-test-screenshots'
const QUESTION = 'RAG 的四个核心环节分别解决什么问题？'
const ALLOWED_REFS = ['RAG Workflow Notes', 'Knowledge Base Guidelines']

const chrome = spawn(CHROME, [
  '--headless=new', '--disable-gpu', '--no-first-run', '--no-default-browser-check',
  `--remote-debugging-port=${PORT}`,
  `--user-data-dir=${process.env.TEMP}\\pf-brain-${Date.now()}`,
  '--window-size=1440,1100',
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

try {
  await send('Runtime.enable')
  await send('Page.enable')
  await sleep(3500)

  console.log('=== 登录 ===')
  console.log('登录页输入框:', await evaluate(`!!document.querySelector('input[placeholder="请输入用户名"]')`))
  await evaluate(`(() => {
    const set = (sel, val) => {
      const el = document.querySelector(sel)
      const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value').set
      setter.call(el, val)
      el.dispatchEvent(new Event('input', { bubbles: true }))
    }
    set('input[placeholder="请输入用户名"]', 'demo_showcase')
    set('input[placeholder="请输入密码"]', 'DemoShowcase2026')
    return true
  })()`)
  await sleep(500)
  await evaluate(`[...document.querySelectorAll('button')].find(b => b.textContent.trim() === '登录').click()`)
  await sleep(4000)
  console.log('登录后路径:', await evaluate(`location.pathname`))
  console.log('token 存在:', await evaluate(`!!localStorage.getItem('token')`))

  console.log('=== 文档管理页 ===')
  await evaluate(`location.href = '/documents'`)
  await sleep(4500)
  const docTitles = await evaluate(`[...document.querySelectorAll('h3')].map(el => el.textContent.trim())`)
  console.log('页面上的文档标题:', JSON.stringify(docTitles))
  await capture('v9-brain-documents.png')

  console.log('=== 对话页 ===')
  await evaluate(`location.href = '/chat'`)
  await sleep(4500)
  console.log('输入框:', await evaluate(`!!document.querySelector('textarea[placeholder="输入你的问题…"]')`))
  await evaluate(`(() => {
    const el = document.querySelector('textarea[placeholder="输入你的问题…"]')
    const setter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set
    setter.call(el, ${JSON.stringify(QUESTION)})
    el.dispatchEvent(new Event('input', { bubbles: true }))
    return el.value
  })()`)
  await sleep(600)
  const sent = await evaluate(`(() => {
    const el = document.querySelector('textarea[placeholder="输入你的问题…"]')
    if (!el) return 'no-textarea'
    el.focus()
    const ev = new KeyboardEvent('keydown', { key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true })
    el.dispatchEvent(ev)
    return 'enter-dispatched'
  })()`)
  console.log('发送方式:', sent)

  let answer = ''
  for (let i = 0; i < 60; i++) {
    await sleep(1500)
    answer = await evaluate(`(() => {
      const nodes = [...document.querySelectorAll('div, p')]
        .filter(el => el.children.length === 0)
        .map(el => el.textContent.trim())
        .filter(t => t.length > 40)
      return nodes[nodes.length - 1] || ''
    })()`)
    if (answer && !/生成中|思考中|\.\.\./.test(answer)) break
  }
  console.log('回答长度:', answer.length)
  console.log('回答前 200 字:', answer.slice(0, 200))

  console.log('=== 展开引用并校验 ===')
  const toggled = await evaluate(`(() => {
    const btn = [...document.querySelectorAll('button')].find(b => /查看引用/.test(b.textContent))
    if (!btn) return 'no-toggle'
    btn.click()
    return btn.textContent.trim()
  })()`)
  console.log('引用按钮:', toggled)
  await sleep(1500)

  const pageText = await evaluate(`document.body.innerText`)

  // 内容级校验：这些短语只出现在他人文档里，一旦命中说明检索带进了别人的资料
  const FOREIGN_MARKERS = ['MyBatis-Plus', 'Apache Tika', "Let's Encrypt", '智源研究院', 'Sa-Token（角色权限']
  const hits = FOREIGN_MARKERS.filter(marker => pageText.includes(marker))

  // 正向校验：页面里应当出现我自己文档的内容
  const OWN_MARKERS = ['检索增强生成', '相似度', '切片']
  const ownFound = OWN_MARKERS.filter(marker => pageText.includes(marker))

  console.log('他人文档特征命中:', JSON.stringify(hits))
  console.log('自身文档特征命中:', JSON.stringify(ownFound))
  console.log('引用面板是否展开:', toggled !== 'no-toggle')

  if (hits.length > 0) {
    console.log('!!! 检索结果包含他人文档内容，拒绝写入对话截图')
  } else if (ownFound.length === 0) {
    console.log('!!! 未确认到自身文档内容，拒绝写入对话截图')
  } else {
    await capture('v10-brain-chat.png')
  }

  console.log('=== 对话页全文（供人工核对）===')
  console.log(pageText.slice(0, 2000))
} catch (error) {
  console.error('capture error:', error.message)
} finally {
  socket.close()
  chrome.kill()
}
