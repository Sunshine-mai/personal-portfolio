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
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
// 标签字号从被检验的源码里导入，而不是在断言里另写一份：
// 两处各写一份会漂移，而"布局按一个字号排、断言按另一个字号查"会得出错误结论。
import { TECH_LABEL_SIZE, PROJECT_LABEL_SIZE } from '../project/frontend/src/data/techGraph.js'

const CHROME_CANDIDATES = [
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe',
]
const baseUrl = (process.argv[2] || 'http://127.0.0.1:1001/').replace(/\/$/, '')
const debugPort = 9333
// 截图目录固定按脚本所在的仓库根解析，而不是按当前工作目录。
// 否则从 project/frontend 等目录运行时，同一份验收产物会散落到第二处，
// 让人误读旧截图（本目录曾经因此被读错过两次）。
const shotDir = join(dirname(fileURLToPath(import.meta.url)), '..', 'gui-test-screenshots')

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
  writeFileSync(join(shotDir, name), Buffer.from(response.result.data, 'base64'))
  console.log(`SHOT  ${shotDir}/${name}`)
}

try {
  await send('Runtime.enable')
  await send('Page.enable')
  await sleep(2800)

  // ===== 首页 =====
  check('首屏独立项目统计已渲染', await evaluate(`document.querySelector('.hero-facts div:nth-child(2) strong')?.textContent.trim() || ''`), value => /个独立项目$/.test(value))
  check('项目卡片数量', await evaluate(`document.querySelectorAll('.project-card').length`), 5)
  check('API 状态行已渲染', await evaluate(`!!document.querySelector('.api-status')`), true)

  const labels = await evaluate(`[...document.querySelectorAll('.visual-label')].map(el => el.textContent.trim())`)
  check('设计版式标签已不再出现（已换成真实系统截图）', labels.filter(item => item === '设计版式').length, 0)
  check('公开截图标签出现五次', labels.filter(item => item === '公开截图').length, 5)

  // 卡片必须是真实链接，而不是打开抽屉的按钮
  check('卡片是链接元素', await evaluate(`document.querySelectorAll('a.project-card').length`), 5)
  check('卡片链接指向详情路由', await evaluate(`document.querySelector('a.project-card')?.getAttribute('href') || ''`), value => /^\/projects\//.test(value))
  check('页面内不再有抽屉元素', await evaluate(`!document.querySelector('.drawer')`), true)

  // 页内锚点：顶部导航吸顶 72px。
  // 必须走**点导航链接**这条路径：之前只测了 scrollIntoView，而
  // scrollIntoView 会遵守 CSS 的 scroll-margin-top，Vue Router 不会。
  // 结果是断言通过、点导航时标题却被盖住——测了另一条路径，等于没测。
  // 上限同样要断言：之前只查下限，编号落到 160px（空隙太大）也照样通过。
  const NAV_TARGETS = {
    代表项目: 'projects',
    技术栈: 'stack',
    视觉与剪辑: 'edit-works',
    工程方法: 'method',
    关于我: 'about',
  }
  for (const [label, id] of Object.entries(NAV_TARGETS)) {
    await evaluate(`
      [...document.querySelectorAll('.nav-links a')].find(a => a.textContent.trim() === '${label}')?.click()
    `)
    await sleep(1500)
    check(`点「${label}」后编号落位合适（80~120px）`, await evaluate(`
      (() => {
        const top = Math.round(document.querySelector('#${id} .eyebrow').getBoundingClientRect().top)
        // 最后一节（关于我）无论怎么滚都到不了 96px：页面已到底，无法再往上顶。
        // 这是文档长度的物理限制，不是缺陷。所以断言写成"要么落位合适，要么已到底"，
        // 而不是把最后一节直接排除——那样会掩盖真正的问题。
        const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2
        return { top, atBottom }
      })()
    `), v => v.top >= 80 && (v.top <= 120 || v.atBottom))
  }
  await evaluate(`window.scrollTo(0, 0)`)
  await sleep(600)

  // ===== 首页技术网络图 =====
  // 分节编号必须唯一且连续。加网络图那一节时我把新的写成 02，
  // 而"视觉与剪辑"本来就是 02，于是出现两个 02、后面编号全部错位。
  // 这是纯人工维护的数字，所以需要断言守着。
  check('首页分节编号唯一且连续', await evaluate(`
    [...document.querySelectorAll('.eyebrow')]
      .map(el => (el.textContent.match(/^(\\d+)\\s*\\//) || [])[1])
      .filter(Boolean)
      .join(',')
  `), '01,02,03,04,05')

  check('技术网络图：项目节点数', await evaluate(`document.querySelectorAll('.graph-node.is-project').length`), 5)
  check('技术网络图：技术节点数', await evaluate(`document.querySelectorAll('.graph-node.is-tech').length`), 36)
  check('技术网络图：连线数', await evaluate(`document.querySelectorAll('.graph-edge').length`), 67)
  check('技术网络图：初始无高亮', await evaluate(`document.querySelectorAll('.graph-node.is-lit').length`), 0)

  // 邻近高亮：把指针移到某个技术节点上（模拟真实 pointermove，不是直接改状态）
  await evaluate(`
    (() => {
      const dot = document.querySelector('.graph-node.is-tech .node-dot')
      const svg = document.querySelector('.graph-canvas')
      const rect = dot.getBoundingClientRect()
      svg.dispatchEvent(new PointerEvent('pointermove', {
        clientX: rect.left + rect.width / 2,
        clientY: rect.top + rect.height / 2,
        bubbles: true,
      }))
      return true
    })()
  `)
  await sleep(300)
  check('技术网络图：邻近高亮生效', await evaluate(`
    (() => {
      const lit = document.querySelectorAll('.graph-node.is-lit').length
      const total = document.querySelectorAll('.graph-node').length
      return lit > 0 && lit < total
    })()
  `), true)

  // 悬停放大：动画写在节点内层，基准坐标不动，所以这里量的是内层 transform 里的 scale
  check('技术网络图：悬停会放大节点', await evaluate(`
    (() => {
      let max = 0
      document.querySelectorAll('.graph-node.is-lit .node-inner').forEach(el => {
        const m = /scale\\(([0-9.]+)\\)/.exec(el.getAttribute('transform') || '')
        if (m) max = Math.max(max, Number(m[1]))
      })
      return Number(max.toFixed(2))
    })()
  `), scale => scale > 1.05)

  // 悬停的那个节点必须停在原地。曾经用径向漂移（把节点推离光标），
  // 结果是"想点的节点一直跑"——越靠近跑得越远，根本点不到。
  // 改成切向漂移后距离不变，但这仍然需要断言守住，否则很容易又改回径向。
  check('技术网络图：悬停的节点不会被推开（点得到）', await evaluate(`
    (() => {
      const node = document.querySelector('.graph-node.is-focused .node-inner')
      const t = node?.getAttribute('transform') || ''
      const m = /translate\\(([-0-9.]+) ([-0-9.]+)\\)/.exec(t)
      if (!m) return 0
      return Number(Math.max(Math.abs(Number(m[1])), Math.abs(Number(m[2]))).toFixed(2))
    })()
  `), offset => offset <= 0.5)

  // 3D 感：整张图随鼠标倾斜。量的是容器上的实际计算样式，不是"有没有写这段代码"。
  check('技术网络图：容器随鼠标倾斜（3D 感）', await evaluate(`
    (() => {
      const t = getComputedStyle(document.querySelector('.graph-canvas')).transform
      return !!t && t !== 'none'
    })()
  `), true)

  // 移出后高亮应清除，且动画要停下来——不动的图不该持续占用 CPU
  await evaluate(`document.querySelector('.graph-canvas').dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))`)
  await sleep(1400)
  check('技术网络图：移出后高亮清除', await evaluate(`document.querySelectorAll('.graph-node.is-lit').length`), 0)
  check('技术网络图：静止后动画归零（不持续占用）', await evaluate(`
    [...document.querySelectorAll('.node-inner')].every(el => (el.getAttribute('transform') || '') === '')
  `), true)

  // 文字版与图必须等价：既保证图挂了不丢信息，也防止两处数据漂移
  check('技术网络图：文字版与图等价', await evaluate(`
    (() => {
      const inGraph = new Set([...document.querySelectorAll('.graph-node.is-tech .graph-label')].map(e => e.textContent.trim()))
      const inText = new Set()
      document.querySelectorAll('.graph-outline .outline-group p').forEach(p => {
        p.textContent.split('·').forEach(part => { const v = part.trim(); if (v) inText.add(v) })
      })
      if (inGraph.size !== inText.size) return 'size ' + inGraph.size + ' vs ' + inText.size
      for (const tech of inGraph) if (!inText.has(tech)) return 'missing ' + tech
      return true
    })()
  `), true)

  // 可访问性：每个节点都要有非空 aria-label，且可被 Tab 聚焦
  check('技术网络图：节点均有 aria-label', await evaluate(`
    [...document.querySelectorAll('.graph-node')].every(n => (n.getAttribute('aria-label') || '').trim().length > 0)
  `), true)
  check('技术网络图：节点可被 Tab 聚焦', await evaluate(`
    [...document.querySelectorAll('.graph-node')].every(n => n.getAttribute('tabindex') === '0')
  `), true)

  // 把"看起来会不会挤成一团"变成可测量的判据，不靠肉眼看图。
  // 判据不是节点间距而是**标签框重叠量**：两个节点横向相距 40px、纵向同高时，
  // 节点间距看着够，标签却必然压在一起。返回最严重的一处重叠像素，期望为 0。
  check('技术网络图：标签互不重叠', await evaluate(`
    (() => {
      const items = [...document.querySelectorAll('.graph-node')].map(node => {
        const m = /translate\\(([-0-9.]+) ([-0-9.]+)\\)/.exec(node.getAttribute('transform') || '')
        const label = node.querySelector('.graph-label')?.textContent || ''
        const size = node.classList.contains('is-project') ? ${PROJECT_LABEL_SIZE} : ${TECH_LABEL_SIZE}
        let width = 0
        for (const ch of label) width += /[\\u4e00-\\u9fff\\uff00-\\uffef]/.test(ch) ? size * 1.06 : size * 0.62
        return m ? { x: Number(m[1]), y: Number(m[2]), halfW: Math.max(width / 2, 16), halfH: 15 } : null
      }).filter(Boolean)
      let worst = 0
      for (let i = 0; i < items.length; i += 1) {
        for (let j = i + 1; j < items.length; j += 1) {
          const overlapX = items[i].halfW + items[j].halfW - Math.abs(items[i].x - items[j].x)
          const overlapY = items[i].halfH + items[j].halfH - Math.abs(items[i].y - items[j].y)
          if (overlapX > 0 && overlapY > 0) worst = Math.max(worst, Math.min(overlapX, overlapY))
        }
      }
      return Math.round(worst)
    })()
  `), 0)

  check('技术网络图：节点都在画布内', await evaluate(`
    [...document.querySelectorAll('.graph-node')].every(node => {
      const m = /translate\\(([-0-9.]+) ([-0-9.]+)\\)/.exec(node.getAttribute('transform') || '')
      if (!m) return false
      const x = Number(m[1])
      const y = Number(m[2])
      return x >= 0 && x <= 1440 && y >= 0 && y <= 580
    })
  `), true)

  // 留存视觉证据
  await evaluate(`document.getElementById('stack')?.scrollIntoView({ block: 'start' })`)
  await sleep(800)
  await capture('v15-home-tech-graph.png')
  await evaluate(`window.scrollTo(0, 0)`)
  await sleep(400)

  // ===== 点击进入详情页 =====
  await evaluate(`document.querySelectorAll('a.project-card')[0].click()`)
  await sleep(2600)
  check('点击后进入详情页', await evaluate(`location.pathname`), '/projects/ai-translator')
  check('详情页标题已渲染', await evaluate(`document.querySelector('.detail-hero h1')?.textContent.trim() || ''`), '词流 LexiFlow')
  check('详情页有返回链接', await evaluate(`!!document.querySelector('.detail-back')`), true)
  check('首屏事实清单已渲染（状态/角色/仓库名/证据）', await evaluate(`document.querySelectorAll('.detail-facts dd').length`), 4)
  check('图组缩略图数量', await evaluate(`document.querySelectorAll('.gallery-thumbs button').length`), 3)
  check('图组计数文案', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '1 / 3')
  // 证据（含迁移次数、测试数等硬数字）已提到首屏事实清单，二级页面不再重复展示，避免同一信息出现两次。
  check('首屏证据事实施已渲染', await evaluate(`(document.querySelector('.detail-facts .fact-evidence dd')?.textContent || '').trim().length > 10`), true)
  // 技术栈与项目结构（试点：LexiFlow 与 Folio 两个独立项目）
  check('技术栈分层已渲染', await evaluate(`document.querySelectorAll('.stack-row').length`), 4)
  check('技术栈首层为前端', await evaluate(`document.querySelector('.stack-layer')?.textContent.trim() || ''`), '前端')
  check('项目结构树已渲染', await evaluate(`document.querySelectorAll('.tree-list li').length`), 14)
  check('目录树带脱敏声明', await evaluate(`(document.querySelector('.tree-legend')?.textContent || '').includes('脱敏摘要')`), true)
  // IA 顺序：先看结果（截图）再看解释（技术栈与代码结构）。
  // 这是设计决定而不是排版细节，用 DOM 顺序把它固定住，避免以后被无意改回去。
  check('截图区在技术栈之前（先看结果再看解释）', await evaluate(`
    (() => {
      const body = document.querySelector('.detail-body')
      const anatomy = document.querySelector('.detail-anatomy')
      if (!body || !anatomy) return false
      return !!(body.compareDocumentPosition(anatomy) & Node.DOCUMENT_POSITION_FOLLOWING)
    })()
  `), true)
  await capture('v11-detail-lexiflow.png')
  // 技术栈与项目结构在首屏之下，单独截一张作为这两块的留存证据。
  await evaluate(`document.querySelector('.detail-anatomy')?.scrollIntoView({ block: 'start' })`)
  await sleep(700)
  await capture('v11-detail-anatomy.png')
  await evaluate(`window.scrollTo(0, 0)`)
  await sleep(400)

  // 图组翻页：左右箭头位于图片两侧
  check('左右箭头位于图片两侧', await evaluate(`document.querySelectorAll('.gallery-frame > .gallery-nav').length`), 2)
  await evaluate(`document.querySelector('.gallery-nav.is-next').click()`)
  await sleep(400)
  check('下一张按钮可用', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '2 / 3')
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))`)
  await sleep(400)
  check('右箭头前进', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '3 / 3')
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))`)
  await sleep(400)
  check('右箭头从末张循环回首张', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '1 / 3')

  // 点击图片放大
  check('放大层初始不存在', await evaluate(`!document.querySelector('.lightbox')`), true)
  await evaluate(`document.querySelector('.gallery-stage').click()`)
  await sleep(500)
  check('点击图片打开放大层', await evaluate(`!!document.querySelector('.lightbox')`), true)
  check('放大层显示说明文案', await evaluate(`!!document.querySelector('.lightbox-caption')`), true)
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'ArrowRight' }))`)
  await sleep(400)
  check('放大层内可继续翻页', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '2 / 3')
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
  await sleep(500)
  check('Escape 关闭放大层', await evaluate(`!document.querySelector('.lightbox')`), true)

  // ===== 深链：直接访问详情页 =====
  await goto('/projects/ai-second-brain')
  check('深链直达详情页', await evaluate(`document.querySelector('.detail-hero h1')?.textContent.trim() || ''`), '问册 Folio')
  check('深链下图组正常', await evaluate(`document.querySelectorAll('.gallery-thumbs button').length`), 3)
  check('展示名与仓库名分离', await evaluate(`!!document.querySelector('.detail-hero h1')`), true)

  // ===== 上一个 / 下一个 =====
  check('分页导航显示下一个项目', await evaluate(`document.querySelector('.pager-link.is-next strong')?.textContent.trim() || ''`), value => value.length > 0)
  await evaluate(`document.querySelector('.pager-link.is-next').click()`)
  await sleep(2400)
  check('点击下一个可跳转', await evaluate(`location.pathname`), '/projects/zhiheng-teaching')

  // ===== 未知 slug =====
  await goto('/projects/does-not-exist')
  check('未知项目显示 404 状态', await evaluate(`!!document.querySelector('.detail-loading h1')`), true)
  check('404 提供返回入口', await evaluate(`!!document.querySelector('.detail-loading a.button')`), true)

  // ===== 合作项目已换成真实系统截图 =====
  await goto('/projects/university-news')
  check('合作项目已使用真实截图', await evaluate(`document.querySelectorAll('.gallery-thumbs button').length`), 3)
  check('合作项目不再显示设计版式徽标', await evaluate(`!document.querySelector('.gallery-kind')`), true)
  check('合作项目图注已渲染', await evaluate(`(document.querySelector('.gallery-caption')?.textContent || '').length > 10`), true)
  // "挤"是可测量的：看每一层的标签换了几段。大学新闻网那一段内容最多
  // （后端一行 6 个标签），列宽如果按内容最少的案例来定，这里就会挤成一团。
  check('合作项目技术栈没有挤成一团（每层标签最多 3 段）', await evaluate(`
    Math.max(...[...document.querySelectorAll('.stack-row')].map(row => {
      const tops = new Set([...row.querySelectorAll('.stack-item')].map(el => Math.round(el.getBoundingClientRect().top)))
      return tops.size
    }))
  `), segments => segments <= 3)
  await capture('v11-detail-collab.png')

  // ===== 返回首页并验证筛选 =====
  await goto('/')
  // ===== 分类筛选：逐个分类验证数量与归属 =====
  // 这里曾出过 bug：'COLLABORATIVE' 的子串含 'LAB'，导致合作项目被误判成练习场。
  // 因此不只验证数量，还验证每个分类里的项目标题。
  const pickTab = label => evaluate(`[...document.querySelectorAll('[role="tab"]')].find(b => b.textContent.includes(${JSON.stringify(label)})).click()`)

  for (const [label, expected] of [['独立开发', 3], ['练习与实验', 1], ['合作项目', 1], ['全部', 5]]) {
    await pickTab(label)
    await sleep(400)
    check(`筛选数量：${label}`, await evaluate(`document.querySelectorAll('.project-card').length`), expected)
  }

  await pickTab('练习与实验')
  await sleep(400)
  check('练习与实验只含练习场项目', await evaluate(`document.querySelector('.project-card h3')?.textContent.trim() || ''`), '词流练习区')

  await pickTab('合作项目')
  await sleep(400)
  check('合作项目只含大学新闻网', await evaluate(`document.querySelector('.project-card h3')?.textContent.trim() || ''`), '大学新闻网')

  await pickTab('独立开发')
  await sleep(400)
  check('独立开发不含练习场与合作项目', await evaluate(`[...document.querySelectorAll('.project-card h3')].map(h => h.textContent.trim())`), titles => titles.length === 3 && !titles.includes('词流练习区') && !titles.includes('大学新闻网'))

  await evaluate(`[...document.querySelectorAll('[role="tab"]')].find(b => b.textContent.trim() === '全部').click()`)
  await sleep(400)

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
