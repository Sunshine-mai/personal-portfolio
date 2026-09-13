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
  // 首屏此前是固定 min-height:680px，与视口无关。实测 1440×900：
  // 导航 73 + 首屏 680 = 753，只填满导航以下的 82%，而下一节的编号落在 884px——
  // 正好在第一屏最底边露出一行。改成跟视口走之后两个问题同时消失，
  // 所以这两条必须一起断言：只测"铺满"会漏掉"漏出下一节"。
  check('首屏恰好填满导航以下的视口', await evaluate(`
    (() => {
      const hero = document.querySelector('.hero-section').getBoundingClientRect()
      const nav = document.querySelector('.topbar').getBoundingClientRect()
      return Math.abs(hero.height - (innerHeight - nav.height)) <= 1
    })()
  `), true)
  check('首屏不再漏出下一节的编号', await evaluate(`
    document.querySelector('#projects .eyebrow').getBoundingClientRect().top >= innerHeight
  `), true)
  // H1 曾经是 88px、恒定三行、269px 高（左栏只有 675px 宽，10 个汉字必须折行）。
  check('H1 压到两行以内', await evaluate(`
    (() => {
      const h1 = document.querySelector('h1')
      const size = parseFloat(getComputedStyle(h1).fontSize)
      return Math.round(h1.getBoundingClientRect().height / (size * 1.06))
    })()
  `), lines => lines <= 2)
  // 中文没有真斜体。<em> 自带浏览器默认斜体，只删 CSS 里的 font-style:italic 是没用的，
  // 必须显式写 normal——这条守着它不被"顺手"改回去。
  check('标题中文强调不是假斜体', await evaluate(`getComputedStyle(document.querySelector('h1 em')).fontStyle`), 'normal')
  // 字体必须由网页自己保证：Noto Serif SC 之前只写在 --serif 里却从未加载，
  // 装了这个字体的机器看着正常，访客机器会落到系统衬线体，两边字形不一致。
  check('标题中文衬线体已作为网页字体加载', await evaluate(`document.fonts.check('500 62px "Noto Serif SC"')`), true)
  check('首屏计数是实计数', await evaluate(`document.querySelector('.hero-foot-count')?.textContent.trim() || ''`), value => /个独立项目$/.test(value))

  // 首屏右列是 5 个真实项目的索引：既是内容也是导航。
  check('首屏项目索引行数', await evaluate(`document.querySelectorAll('.hero-index-row').length`), 5)
  // 首屏索引是**页内索引**，不是跳详情页的快捷方式：它指向下方 01 节的对应卡片。
  // 卡片才是"先看结果"的那一级（带截图与摘要）；直接跳二级等于把这一级整个跳过。
  check('首屏索引指向对应的项目卡片锚点', await evaluate(`
    [...document.querySelectorAll('.hero-index-row')].every(a => {
      const slug = (a.getAttribute('href') || '').split('#project-')[1]
      return !!slug && !!document.getElementById('project-' + slug)
    })
  `), true)
  check('每张项目卡片都有可锚定的 id', await evaluate(`
    [...document.querySelectorAll('.project-card')].filter(c => (c.id || '').startsWith('project-')).length
  `), 5)

  // 真的点一下：必须仍停在首页并落到那张卡片上，而不是跳到二级详情页。
  await evaluate(`document.querySelector('.hero-index-row').click()`)
  await sleep(1900)
  check('点首屏索引后停在首页并落到对应卡片', await evaluate(`
    (() => {
      const card = document.getElementById('project-ai-translator')
      return {
        path: location.pathname,
        hash: location.hash,
        cardTop: card ? Math.round(card.getBoundingClientRect().top) : null,
      }
    })()
  `), v => v.path === '/' && v.hash === '#project-ai-translator' && v.cardTop >= 80 && v.cardTop <= 120)

  // ===== 悬停动效 =====
  // 必须用**真实鼠标事件**（CDP Input）驱动：CSS 的 :hover 不响应 dispatchEvent，
  // 用合成事件测出来的"通过"是假的。断言也量的是最终形态（缩放倍数、位移量），
  // 不是"有没有这段代码"——上一次光斑出错就栽在只断言了"transform 变了"。
  const cardPoint = await evaluate(`
    (() => {
      const r = document.getElementById('project-ai-translator').getBoundingClientRect()
      return { x: Math.round(r.left + r.width * 0.25), y: Math.round(r.top + r.height * 0.5) }
    })()
  `)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: cardPoint.x, y: cardPoint.y })
  await sleep(900)
  check('项目卡片悬停：截图被推近', await evaluate(`
    (() => {
      const card = document.querySelector('.project-card:hover')
      if (!card) return null
      return +new DOMMatrixReadOnly(getComputedStyle(card.querySelector('.project-visual')).transform).a.toFixed(3)
    })()
  `), v => typeof v === 'number' && v > 1.02)
  check('项目卡片悬停：左侧强调线自上而下展开', await evaluate(`
    (() => {
      const card = document.querySelector('.project-card:hover')
      if (!card) return null
      return +new DOMMatrixReadOnly(getComputedStyle(card, ':before').transform).d.toFixed(3)
    })()
  `), v => typeof v === 'number' && v > 0.9)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 8, y: 8 })
  await sleep(800)
  check('指针离开后卡片恢复原状', await evaluate(`
    +new DOMMatrixReadOnly(getComputedStyle(document.getElementById('project-ai-translator').querySelector('.project-visual')).transform).a.toFixed(3)
  `), 1)

  // 方法清单整行位移
  await evaluate(`document.querySelector('#method').scrollIntoView({ behavior: 'instant', block: 'start' })`)
  await sleep(700)
  const methodPoint = await evaluate(`
    (() => {
      const r = document.querySelector('.method-list article').getBoundingClientRect()
      return { x: Math.round(r.left + r.width * 0.5), y: Math.round(r.top + r.height * 0.6) }
    })()
  `)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: methodPoint.x, y: methodPoint.y })
  await sleep(700)
  check('方法行悬停：整行右移', await evaluate(`
    (() => {
      const row = document.querySelector('.method-list article:hover')
      if (!row) return null
      return +new DOMMatrixReadOnly(getComputedStyle(row).transform).e.toFixed(2)
    })()
  `), v => typeof v === 'number' && v >= 5)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 8, y: 8 })
  await evaluate(`window.scrollTo(0, 0)`)
  await sleep(900)
  check('首屏索引默认不展开技术分层', await evaluate(`
    [...document.querySelectorAll('.hero-index-stack')].every(el => getComputedStyle(el).opacity === '0')
  `), true)

  // 悬停展开：走真实 pointerenter，而不是直接改状态。
  const heroRowRect = await evaluate(`
    (() => { const r = document.querySelector('.hero-index-name').getBoundingClientRect(); return { x: Math.round(r.left + 6), y: Math.round(r.top + 6) } })()
  `)
  await evaluate(`
    document.querySelector('.hero-index-row').dispatchEvent(new PointerEvent('pointerenter', {
      clientX: ${heroRowRect.x}, clientY: ${heroRowRect.y}, bubbles: false,
    }))
  `)
  await sleep(600)
  check('首屏索引悬停后展开该项目真实的技术分层', await evaluate(`
    (() => {
      const row = document.querySelector('.hero-index-row')
      const stack = row.querySelector('.hero-index-stack')
      return {
        active: row.classList.contains('is-active'),
        slug: row.dataset.slug,
        opacity: getComputedStyle(stack).opacity,
      }
    })()
  `), v => v.active === true && v.slug === 'ai-translator' && v.opacity === '1')
  // 展开的必须是与依赖清单一致的真实条目，而不是占位文字。
  // 期望值是逐层首项，写死在这里：它同时也是"这一列没有变成装饰"的证据。
  check('首屏索引展开项与依赖清单一致', await evaluate(`
    [...document.querySelector('.hero-index-row .hero-index-stack').querySelectorAll('span')].map(s => s.textContent.trim())
  `), tags => JSON.stringify(tags) === JSON.stringify(['Vue 3', 'Python 3.11+', 'SQLite', 'Docker Compose']))

  // 氛围层：光斑跟随指针、网格轻微位移。断言的是内层 transform 变了，
  // 基准布局由上面的几何断言守着——两者互不干扰（与技术网络图同一条原则）。
  const glowBefore = await evaluate(`document.querySelector('.hero-glow').style.transform || ''`)
  // 指针位置先算出来再原样回读：光斑中心必须**落在这一点上**。
  // 只断言"transform 变了"是不够的——CSS 的负 margin 已经居中过一次，
  // JS 里再减一次半径就会把光斑整体推到指针左上 430px，
  // 而"变了"的断言照样通过。这里量的才是它落在哪。
  const spot = await evaluate(`
    (() => {
      const r = document.querySelector('.hero-section').getBoundingClientRect()
      return { x: Math.round(r.left + r.width * 0.32), y: Math.round(r.top + r.height * 0.68) }
    })()
  `)
  await evaluate(`
    document.querySelector('.hero-section').dispatchEvent(new PointerEvent('pointermove', {
      clientX: ${spot.x}, clientY: ${spot.y}, bubbles: true,
    }))
  `)
  await sleep(900)
  check('首屏氛围层：光斑随指针位移', await evaluate(`
    (() => {
      const hero = document.querySelector('.hero-section')
      return {
        live: hero.classList.contains('is-live'),
        glow: document.querySelector('.hero-glow').style.transform || '',
        parallax: hero.style.getPropertyValue('--parallax-x') || '',
      }
    })()
  `), v => v.live === true && v.glow.startsWith('translate3d') && v.glow !== glowBefore && v.parallax !== '')
  // 光斑中心必须落在指针**上方**，而不是压在手底下。中心正落在指针处时热点压住内容，观感过强。
  // 这里断言的是性质（在指针上方、水平对齐），不是某个具体数值——上移多少属于可调观感，钉死反而碍事。
  check('首屏氛围层：光斑中心在指针上方（不压在手底下）', await evaluate(`
    (() => {
      const r = document.querySelector('.hero-glow').getBoundingClientRect()
      return { dx: Math.round(r.left + r.width / 2 - ${spot.x}), dy: Math.round(r.top + r.height / 2 - ${spot.y}) }
    })()
  `), v => v.dy <= -24 && Math.abs(v.dx) <= 8)
  // 光斑是环境光，不许成为画面里最亮的东西。峰值曾经给到 .17，
  // 那就是一张会动的亮块，把视线从标题上拽走（"抢主角风头"）。
  // 现在是 .04，离 .17 很远；上限留到 .05 是为了给"更深一点"留余量，
  // 同时仍然挡得住任何把亮度拉回亮块区间的改动。
  // 读的是渲染后的渐变色标，而不是源码——测的是实际生效的值。
  check('首屏氛围层：光斑峰值亮度受控（不抢标题）', await evaluate(`
    (() => {
      const bg = getComputedStyle(document.querySelector('.hero-glow')).backgroundImage
      const alphas = [...bg.matchAll(/rgba\\([^)]*?,\\s*([0-9.]+)\\)/g)].map(m => Number(m[1]))
      return alphas.length ? Math.max(...alphas) : null
    })()
  `), v => typeof v === 'number' && v > 0 && v <= 0.05)
  // 生动感必须来自**位移**而不是亮度：亮度是有预算的（标题必须最亮），位移没有。
  // 两个内容层朝相反方向移动才有纵深，同向会像整块在飘——所以这里断言的是"反向"，不只是"动了"。
  check('首屏内容层随指针产生反向视差', await evaluate(`
    (() => {
      const x = sel => +new DOMMatrixReadOnly(getComputedStyle(document.querySelector(sel)).transform).e.toFixed(2)
      return { copy: x('.hero-copy-block'), index: x('.hero-index') }
    })()
  `), v => Math.abs(v.copy) >= 1 && Math.abs(v.index) >= 1 && v.copy * v.index < 0)
  await evaluate(`document.querySelector('.hero-section').dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))`)
  // 等满过渡时长：--hero-x 是直接写入的（瞬时归零），但 transform 有 600ms 过渡。
  // 只等 400ms 会量到 -0.14 这种"快到了"的中间值——那是等待不足，不是没收回。
  await sleep(950)
  check('指针移出后首屏氛围层收回', await evaluate(`
    (() => {
      const hero = document.querySelector('.hero-section')
      return {
        live: hero.classList.contains('is-live'),
        parallax: hero.style.getPropertyValue('--parallax-x') || '',
        heroX: hero.style.getPropertyValue('--hero-x') || '',
        copyX: +new DOMMatrixReadOnly(getComputedStyle(document.querySelector('.hero-copy-block')).transform).e.toFixed(2),
      }
    })()
  `), v => v.live === false && v.parallax === '0px' && v.heroX === '0' && Math.abs(v.copyX) <= 0.3)

  check('项目卡片数量', await evaluate(`document.querySelectorAll('.project-card').length`), 5)
  check('API 状态行已渲染', await evaluate(`!!document.querySelector('.api-status')`), true)

  const labels = await evaluate(`[...document.querySelectorAll('.visual-label')].map(el => el.textContent.trim())`)
  check('设计版式标签已不再出现（已换成真实系统截图）', labels.filter(item => item === '设计版式').length, 0)
  check('公开截图标签出现五次', labels.filter(item => item === '公开截图').length, 5)

  // 卡片必须是真实链接，而不是打开抽屉的按钮
  check('卡片是链接元素', await evaluate(`document.querySelectorAll('a.project-card').length`), 5)
  check('卡片链接指向详情路由', await evaluate(`document.querySelector('a.project-card')?.getAttribute('href') || ''`), value => /^\/projects\//.test(value))
  check('页面内不再有抽屉元素', await evaluate(`!document.querySelector('.drawer')`), true)

  // ===== 首页 03 节：剪辑作品（外链方案）=====
  // 封面是第三方外链，所以有三条必须守住的，缺一条线上就会出问题：
  //   https —— 接口返回的是 http://，不改写会被浏览器的混合内容策略拦掉；
  //   referrerpolicy=no-referrer —— 实测 B 站图床带外站 Referer 返回 403，不加封面会全裂；
  //   不预先挂载三方播放器 —— 否则首屏就要为 4 个 iframe 付出代价。
  // 首页只放最新 6 条，全部 19 条在 /edit-works。首页那一节放满会把后面几节压到很下面。
  check('首页剪辑作品卡片只放最新 6 条', await evaluate(`document.querySelectorAll('.edit-card').length`), 6)
  check('首页有"查看全部作品"入口且指向全集页', await evaluate(`
    (() => {
      const link = document.querySelector('.edit-more')
      return { 文字: (link?.textContent || '').replace(/\\s+/g, ' ').trim(), 指向: link?.getAttribute('href') || '' }
    })()
  `), v => v.指向 === '/edit-works' && v.文字.includes('全部'))
  // 封面已从 B 站外链改为本地文件：外链会静默腐烂，且访客打开首页时会碰到第三方 CDN。
  check('封面已本地化，不再依赖 B 站外链', await evaluate(`
    [...document.querySelectorAll('.edit-cover')].every(img => (img.getAttribute('src') || '').startsWith('/assets/edit-works/'))
  `), true)
  // 光有路径不够——本地文件也可能缺失。滚到这一节让 lazy 图真正开始加载，
  // 再量 naturalWidth。只断言"属性写对了"等于没测封面到底能不能显示。
  // 19 张里只核对进入视野的那几张（lazy 的语义就是不全部加载）；
  // "19 个文件是否都在盘上"由采集脚本与包体积检查负责，那件事在浏览器里反而测不准。
  await evaluate(`document.querySelector('#edit-works').scrollIntoView({ behavior: 'instant', block: 'start' })`)
  await sleep(1600)
  check('进入视野的封面都真实加载了（不是裂图）', await evaluate(`
    (() => {
      const imgs = [...document.querySelectorAll('.edit-cover')]
      const loaded = imgs.filter(i => i.complete && i.naturalWidth > 0)
      return { 卡片数: imgs.length, 已加载: loaded.length }
    })()
  `), v => v.卡片数 === 6 && v.已加载 >= 3)
  await evaluate(`window.scrollTo(0, 0)`)
  await sleep(600)
  check('默认不预先挂载三方播放器', await evaluate(`document.querySelectorAll('.edit-player').length`), 0)
  check('卡片显示了时长与发布日期', await evaluate(`
    (() => {
      const card = document.querySelector('.edit-card')
      return {
        时长: card.querySelector('.edit-play span:last-child').textContent.trim(),
        元信息: card.querySelector('.edit-meta').textContent.trim(),
      }
    })()
  `), v => /^\d{2}:\d{2}$/.test(v.时长) && /\d{4}-\d{2}-\d{2}/.test(v.元信息))
  await evaluate(`document.querySelector('.edit-play').click()`)
  await sleep(600)
  check('点了封面才挂载播放器', await evaluate(`document.querySelectorAll('.edit-player').length`), 1)
  await evaluate(`[...document.querySelectorAll('.edit-play')][0].click()`)
  await sleep(600)
  check('同时只挂载一个播放器', await evaluate(`document.querySelectorAll('.edit-player').length`), 1)

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
  // 编号现在是光秃秃的 `01`（曾经写成 `01 / 5 PROJECTS`，那种长串要 148px 才放得下，
  // 会把标题挤开、窄屏还会折行），所以只取开头的数字。
  check('首页分节编号唯一且连续', await evaluate(`
    [...document.querySelectorAll('.eyebrow')]
      .map(el => (el.textContent.match(/^(\\d+)/) || [])[1])
      .filter(Boolean)
      .join(',')
  `), '01,02,03,04,05')
  // 编号必须与标题并排，任何宽度都不能塌成上下堆叠：
  // 首屏的索引行是"01 | 项目名"并排的，分节标题如果不一致就会显得没做完。
  // 收尾区块（关于我）自成一套两栏布局，所以单独一并纳入——它是 05，
  // 之前漏掉它就成了唯一一个把编号压在标题上方的例外。
  check('分节编号与标题并排（同一水平线）', await evaluate(`
    (() => {
      const heads = [...document.querySelectorAll('.section-heading, .about-title')]
      const bad = heads.filter(head => {
        const no = head.querySelector('.eyebrow').getBoundingClientRect()
        const h2 = head.querySelector('h2').getBoundingClientRect()
        return !(Math.abs(no.top - h2.top) < 24 && no.right <= h2.left)
      }).length
      return { count: heads.length, bad }
    })()
  `), v => v.count === 5 && v.bad === 0)
  // 编号栏只占 36px。给"关于我"那节加宽左栏就是为了这个：
  // 栏宽不够时"也持续校准的人。"会多折一行，标题从两行变三行。
  check('分节标题都是两行（没被编号栏挤到折行）', await evaluate(`
    [...document.querySelectorAll('.section-heading h2, .about-title h2')].map(h => {
      const size = parseFloat(getComputedStyle(h).fontSize)
      return Math.round(h.getBoundingClientRect().height / (size * 1.05))
    })
  `), lines => lines.length === 5 && lines.every(n => n === 2))

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
  check('首屏事实清单已渲染（状态/类型/角色/仓库名/证据）', await evaluate(`document.querySelectorAll('.detail-facts dd').length`), 5)
  // 二级页面的编号也必须与标题并排——和首页五个分节同一规则。
  // 编号压在标题上方时，读者要多扫一行才知道自己在第几个案例。
  check('二级页面编号与标题并排', await evaluate(`
    (() => {
      const t = document.querySelector('.detail-hero-title')
      const no = t.querySelector('.eyebrow').getBoundingClientRect()
      const h1 = t.querySelector('h1').getBoundingClientRect()
      return { 同线: Math.abs(no.top - h1.top) < 24, 在左: no.right <= h1.left }
    })()
  `), v => v.同线 === true && v.在左 === true)

  // 二级页面首屏与首页共用同一套氛围层（同一份 composable，不是抄一份）。
  // 断言的性质与首页保持一致：光斑中心在指针上方、两个内容层反向视差。
  const detailSpot = await evaluate(`
    (() => {
      const r = document.querySelector('.detail-hero').getBoundingClientRect()
      return { x: Math.round(r.left + r.width * 0.3), y: Math.round(r.top + r.height * 0.7) }
    })()
  `)
  await evaluate(`
    document.querySelector('.detail-hero').dispatchEvent(new PointerEvent('pointermove', {
      clientX: ${detailSpot.x}, clientY: ${detailSpot.y}, bubbles: true,
    }))
  `)
  await sleep(950)
  check('二级页面首屏氛围层：光斑中心在指针上方', await evaluate(`
    (() => {
      const hero = document.querySelector('.detail-hero')
      const r = document.querySelector('.detail-hero .hero-glow').getBoundingClientRect()
      return {
        live: hero.classList.contains('is-live'),
        dx: Math.round(r.left + r.width / 2 - ${detailSpot.x}),
        dy: Math.round(r.top + r.height / 2 - ${detailSpot.y}),
      }
    })()
  `), v => v.live === true && v.dy <= -24 && Math.abs(v.dx) <= 8)
  check('二级页面首屏内容层反向视差', await evaluate(`
    (() => {
      const x = sel => +new DOMMatrixReadOnly(getComputedStyle(document.querySelector(sel)).transform).e.toFixed(2)
      return { near: x('.detail-hero-grid > *:first-child'), far: x('.detail-facts') }
    })()
  `), v => Math.abs(v.near) >= 1 && Math.abs(v.far) >= 1 && v.near * v.far < 0)
  await evaluate(`document.querySelector('.detail-hero').dispatchEvent(new PointerEvent('pointerleave', { bubbles: true }))`)
  await sleep(950)
  check('图组缩略图数量', await evaluate(`document.querySelectorAll('.gallery-thumbs button').length`), 3)
  check('图组计数文案', await evaluate(`document.querySelector('.gallery-bar span').textContent.trim()`), '1 / 3')
  // 证据（含迁移次数、测试数等硬数字）已提到首屏事实清单，二级页面不再重复展示，避免同一信息出现两次。
  check('首屏证据事实施已渲染', await evaluate(`(document.querySelector('.detail-facts .fact-evidence dd')?.textContent || '').trim().length > 10`), true)
  // 技术栈与项目结构（试点：LexiFlow 与 Folio 两个独立项目）
  check('技术栈分层已渲染', await evaluate(`document.querySelectorAll('.stack-row').length`), 4)
  check('技术栈首层为前端', await evaluate(`document.querySelector('.stack-layer')?.textContent.trim() || ''`), '前端')
  check('项目结构树已渲染', await evaluate(`document.querySelectorAll('.tree-list li').length`), 14)
  check('目录树带脱敏声明', await evaluate(`(document.querySelector('.tree-legend')?.textContent || '').includes('脱敏摘要')`), true)

  // 页内跳转：条目按实际存在的小节渲染（LexiFlow 有 stack 也有 structure，所以是 4 条），
  // 点一下要真的落到那一节——不走偏，也不能被 72px 吸顶栏盖住。
  check('二级页面页内跳转条目按存在的小节渲染', await evaluate(`
    [...document.querySelectorAll('.detail-toc a')].map(a => a.textContent.trim())
  `), tags => tags.length === 4 && tags[0] === '过程证据' && tags.includes('技术栈') && tags.includes('项目结构'))
  await evaluate(`[...document.querySelectorAll('.detail-toc a')].find(a => a.textContent.trim() === '技术栈').click()`)
  await sleep(1700)
  check('点页内跳转后技术栈落位合适（80~120px）', await evaluate(`
    Math.round(document.getElementById('detail-stack').getBoundingClientRect().top)
  `), v => v >= 80 && v <= 120)

  // 二级页面的悬停反馈。CSS 的 :hover 不响应 dispatchEvent，必须走真实鼠标事件；
  // 断言的也仍是最终形态（位移量），不是"有没有这段样式"。
  await evaluate(`document.querySelector('.stack-row').scrollIntoView({ behavior: 'instant', block: 'center' })`)
  await sleep(600)
  const stackPoint = await evaluate(`
    (() => {
      const r = document.querySelector('.stack-row').getBoundingClientRect()
      return { x: Math.round(r.left + r.width * 0.6), y: Math.round(r.top + r.height * 0.5) }
    })()
  `)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: stackPoint.x, y: stackPoint.y })
  await sleep(700)
  check('二级页面：技术栈行悬停整行右移', await evaluate(`
    (() => {
      const row = document.querySelector('.stack-row:hover')
      if (!row) return null
      return +new DOMMatrixReadOnly(getComputedStyle(row).transform).e.toFixed(2)
    })()
  `), v => typeof v === 'number' && v >= 4)

  await evaluate(`document.querySelector('.tree-list li').scrollIntoView({ behavior: 'instant', block: 'center' })`)
  await sleep(600)
  const treePoint = await evaluate(`
    (() => {
      const r = document.querySelector('.tree-list li').getBoundingClientRect()
      return { x: Math.round(r.left + r.width * 0.5), y: Math.round(r.top + r.height * 0.5) }
    })()
  `)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: treePoint.x, y: treePoint.y })
  await sleep(700)
  check('二级页面：目录树节点悬停整行右移', await evaluate(`
    (() => {
      const row = document.querySelector('.tree-list li:hover')
      if (!row) return null
      return +new DOMMatrixReadOnly(getComputedStyle(row).transform).e.toFixed(2)
    })()
  `), v => typeof v === 'number' && v >= 3)
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 8, y: 8 })
  await sleep(300)
  // 悬停测试把页面滚到了目录树，而下面那张留存截图是按当前视口截的。
  // 不显式滚回来的话，截到的就是目录树那块——不报错，但截错了东西（实际发生过一次：
  // v11-detail-lexiflow.png 从 334KB 掉到 93KB）。截图必须自己决定看到什么，
  // 不能依赖前面测试遗留的滚动位置。
  await evaluate(`window.scrollTo(0, 0)`)
  await sleep(500)
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

  // 灯箱内换图此前是硬切，而放大看图恰恰最需要连贯。断言与图组同一条：
  // 过渡中必须同时存在两张图（换成 out-in 或退回硬切都只会有 1 张）。
  check('灯箱内换图也是交叉淡入（过渡中同时存在两张图）', await evaluate(`
    (async () => {
      document.querySelector('.lightbox .gallery-nav.is-next').click()
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      return document.querySelectorAll('.lightbox-stage img').length
    })()
  `), 2)
  await evaluate(`window.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }))`)
  await sleep(500)
  check('Escape 关闭放大层', await evaluate(`!document.querySelector('.lightbox')`), true)

  // 图组换图必须是交叉淡入，不是硬切。过渡中同时存在两张图才算交叉淡入——
  // 换 src 或者用 <Transition mode="out-in"> 都只会有 1 张，那正是要防的回归
  // （out-in 中间还会闪一下空白，比硬切更糟）。
  // 点击与读取写在同一个 evaluate 里：CDP 往返会把这 350ms 的过渡等过去，量到的就是过渡后的状态。
  check('图组换图是交叉淡入（过渡中同时存在两张图）', await evaluate(`
    (async () => {
      const before = document.querySelector('.gallery-stage img').getAttribute('src')
      document.querySelector('.gallery-nav.is-next').click()
      await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)))
      const images = [...document.querySelectorAll('.gallery-stage img')]
      return { count: images.length, changed: images.some(img => img.getAttribute('src') !== before) }
    })()
  `), v => v.count === 2 && v.changed === true)
  await sleep(600)

  // 侧栏那两块原来和截图并排，右栏下方空出一大块。现在必须是顺序排列：
  // 卡片的左边缘要落在截图区左边缘上，并且在它下方。
  check('进度卡已移到截图下方，且只剩一张', await evaluate(`
    (() => {
      const main = document.querySelector('.detail-main').getBoundingClientRect()
      const aside = document.querySelector('.detail-aside').getBoundingClientRect()
      return {
        卡片数: document.querySelectorAll('.detail-card').length,
        在下方: Math.round(aside.top) >= Math.round(main.bottom),
        左对齐: Math.abs(aside.left - main.left) <= 2,
      }
    })()
  `), v => v.卡片数 === 1 && v.在下方 === true && v.左对齐 === true)

  // 截图与下方卡片必须同宽。曾经截图限宽 880px 而卡片是全宽 1160px，
  // 两者版心不一致，截图右边空出 280px——"空"就是这么来的。
  check('截图区与卡片同宽（右边不留空）', await evaluate(`
    (() => {
      const gallery = document.querySelector('.gallery').getBoundingClientRect()
      const card = document.querySelector('.detail-card').getBoundingClientRect()
      return { 差: Math.abs(Math.round(gallery.width) - Math.round(card.width)) }
    })()
  `), v => v.差 <= 2)

  // 用户的要求：整张截图要看得见（不裁切），且换图时不能跳动（固定高度）。
  // 固定高度下两者同时成立的唯一方式是居中 + contain，留白交给页面背景。
  // 所以断言量两条：填充方式是 contain；换到下一张后框高不变。
  const stageBefore = await evaluate(`
    (() => {
      const stage = document.querySelector('.gallery-stage')
      const img = stage.querySelector('img')
      const box = stage.getBoundingClientRect()
      return { 高: Math.round(box.height), 填充方式: getComputedStyle(img).objectFit }
    })()
  `)
  check('整张截图可见（contain，不裁切）', stageBefore, v => v.填充方式 === 'contain' && v.高 > 200)
  await evaluate(`document.querySelector('.gallery-nav.is-next').click()`)
  await sleep(800)
  check('换图后展示框高度不变（不跳动）', await evaluate(`
    Math.round(document.querySelector('.gallery-stage').getBoundingClientRect().height)
  `), v => Math.abs(v - stageBefore.高) <= 1)

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

  // ===== 作品全集页 /edit-works =====
  await goto('/edit-works')
  await sleep(1200)
  check('作品全集页渲染全部作品', await evaluate(`document.querySelectorAll('.edit-card').length`), 19)
  check('全集页作品按发布时间倒序', await evaluate(`
    [...document.querySelectorAll('.edit-meta')].map(m => m.textContent.trim().slice(0, 10))
  `), dates => dates.length === 19 && dates.every((d, i) => i === 0 || dates[i - 1] >= d))
  check('全集页封面全部本地化', await evaluate(`
    [...document.querySelectorAll('.edit-cover')].every(img => (img.getAttribute('src') || '').startsWith('/assets/edit-works/'))
  `), true)
  check('全集页有返回入口', await evaluate(`!!document.querySelector('.edit-page .detail-back')`), true)

  // ===== 移动端菜单 =====
  await send('Emulation.setDeviceMetricsOverride', { width: 390, height: 844, deviceScaleFactor: 1, mobile: true })
  await sleep(600)
  await evaluate(`document.querySelector('.menu-button').click()`)
  await sleep(400)
  check('移动端菜单可展开', await evaluate(`document.querySelector('.nav-links').classList.contains('open')`), true)

  // ===== 减少动效 =====
  // 首屏氛围层必须在这个偏好下彻底不动。只测"过渡变短"是测错了对象——
  // 这里要的是"完全没有动效"。reveal.js 在模块加载时读一次该偏好，所以要重新加载页面。
  await send('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1100, deviceScaleFactor: 1, mobile: false })
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] })
  await goto('/')
  await evaluate(`
    (() => {
      const hero = document.querySelector('.hero-section')
      const r = hero.getBoundingClientRect()
      hero.dispatchEvent(new PointerEvent('pointermove', {
        clientX: Math.round(r.left + r.width * 0.3), clientY: Math.round(r.top + r.height * 0.7), bubbles: true,
      }))
      return true
    })()
  `)
  await sleep(500)
  check('减少动效时首屏氛围层完全不跟指针动', await evaluate(`
    (() => {
      const hero = document.querySelector('.hero-section')
      const glow = document.querySelector('.hero-glow')
      return {
        live: hero.classList.contains('is-live'),
        glow: glow.style.transform || '',
        opacity: getComputedStyle(glow).opacity,
        parallax: hero.style.getPropertyValue('--parallax-x') || '',
        copy: getComputedStyle(document.querySelector('.hero-copy-block')).transform,
      }
    })()
  `), v => v.live === false && v.glow === '' && v.opacity === '0' && v.parallax === '' && v.copy === 'none')
  // 减少动效不等于把功能砍掉：状态切换要保留，只是不再有过渡。
  await evaluate(`document.querySelector('.hero-index-row').dispatchEvent(new PointerEvent('pointerenter', { bubbles: false }))`)
  await sleep(400)
  check('减少动效时索引展开仍然可用（只是没有过渡）', await evaluate(`
    (() => {
      const row = document.querySelector('.hero-index-row')
      return { active: row.classList.contains('is-active'), opacity: getComputedStyle(row.querySelector('.hero-index-stack')).opacity }
    })()
  `), v => v.active === true && v.opacity === '1')
  await send('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'no-preference' }] })
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
