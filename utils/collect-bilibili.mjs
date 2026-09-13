// 采集 B 站作品的元数据，供首页「视觉与剪辑」一节使用。
//
// 为什么只存 bvid：标题、时长、发布日期、封面全部能从接口取。手抄 15 份必然出错，
// 而且封面换了、标题改了，手抄的数据不会跟着动。
//
// 采集是**手动的一步**，不进构建、不进 pre-push 钩子：那会让"能不能发布"依赖
// B 站是否可达，把发布这件事卡在别人家的服务上。要挂也应该挂在别处。
//
// 三个实测出来的坑（都已在这里处理）：
//   1. 接口返回的封面是 http://，而站点是 HTTPS —— 混合内容会被浏览器拦掉，统一改写成 https。
//   2. B 站图床有防盗链：带外站 Referer 请求返回 403，不带则 200。
//      所以页面上必须给 <img> 加 referrerpolicy="no-referrer"，这条不加封面会全裂。
//   3. 风控：单条详情接口可用，但"按关键词搜索"和"列出某 UP 全部投稿"都被 412 拦死
//      （需要登录态/签名）。所以 bvid 只能人工提供，没有自动发现的路径。
//
// 用法：
//   node utils/collect-bilibili.mjs BV1YJTn6vEda BV1hSTy6AEAm
//   node utils/collect-bilibili.mjs --refresh-covers BV1YJTn6vEda
//
// 封面默认**下载到本地**（project/frontend/public/assets/edit-works/），而不是留在 B 站外链。
// 理由两条：
//   1. 外链会静默腐烂——视频下架、CDN 变动都不会有任何提交，线上封面就没了。
//      本地化之后封面进了版本控制，谁改了什么 git diff 看得见。
//   2. 访客打开首页时完全不碰第三方：不再向 B 站 CDN 发出请求。
// 外链地址仍记在 coverSource 字段里，保留出处，也便于 --refresh-covers 重新拉取。
import { writeFileSync, mkdirSync, existsSync } from 'node:fs'
import { extname, join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { setTimeout as sleep } from 'node:timers/promises'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const REQUEST_GAP_MS = 900 // 接口有风控，逐条之间留间隔，不要并发轰
const projectRoot = join(dirname(fileURLToPath(import.meta.url)), '..')
const coverDir = join(projectRoot, 'project', 'frontend', 'public', 'assets', 'edit-works')

const args = process.argv.slice(2)
const outIndex = args.indexOf('--out')
const outFile = outIndex >= 0 ? args[outIndex + 1] : null
const moduleIndex = args.indexOf('--module')
const moduleFile = moduleIndex >= 0 ? args[moduleIndex + 1] : null
const refreshCovers = args.includes('--refresh-covers')
const bvids = args.filter((a, i) =>
  !a.startsWith('--') && !(outIndex >= 0 && i === outIndex + 1) && !(moduleIndex >= 0 && i === moduleIndex + 1))

if (!bvids.length) {
  console.error('用法：node utils/collect-bilibili.mjs [--out 文件] BV号 [BV号 ...]')
  process.exit(1)
}

const bad = bvids.filter(id => !/^BV[0-9A-Za-z]{10}$/.test(id))
if (bad.length) {
  console.error(`这些不像 BV 号（应为 BV + 10 位）：${bad.join(', ')}`)
  process.exit(1)
}

function secondsToClock(total) {
  const s = Math.max(0, Math.round(total || 0))
  const m = Math.floor(s / 60)
  return `${String(m).padStart(2, '0')}:${String(s % 60).padStart(2, '0')}`
}

// 下载封面到本地。必须**不带 Referer**：实测 B 站图床带外站 Referer 返回 403。
async function downloadCover(bvid, coverUrl) {
  mkdirSync(coverDir, { recursive: true })
  const ext = extname(new URL(coverUrl).pathname) || '.jpg'
  const filename = `${bvid}${ext}`
  const dest = join(coverDir, filename)
  if (existsSync(dest) && !refreshCovers) return { filename, skipped: true }
  const response = await fetch(coverUrl, { headers: { 'User-Agent': UA } })
  if (!response.ok) throw new Error(`封面下载失败 HTTP ${response.status}`)
  const buffer = Buffer.from(await response.arrayBuffer())
  if (buffer.length < 1024) throw new Error(`封面体积异常（${buffer.length} 字节），可能不是图片`)
  writeFileSync(dest, buffer)
  return { filename, bytes: buffer.length, skipped: false }
}

const works = []
const failures = []

for (const bvid of bvids) {
  try {
    const response = await fetch(`https://api.bilibili.com/x/web-interface/view?bvid=${bvid}`, {
      headers: { 'User-Agent': UA, Referer: 'https://www.bilibili.com/' },
    })
    const payload = await response.json()
    if (payload.code !== 0) {
      failures.push({ bvid, reason: `code=${payload.code} ${payload.message}` })
    } else {
      const d = payload.data
      const coverSource = String(d.pic || '').replace(/^http:/, 'https:')
      const work = {
        bvid,
        title: d.title,
        duration: secondsToClock(d.duration),
        durationSeconds: d.duration,
        publishedAt: new Date(d.pubdate * 1000).toISOString().slice(0, 10),
        url: `https://www.bilibili.com/video/${bvid}/`,
        embed: `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0`,
        author: d.owner?.name || '',
        uid: d.owner?.mid || null,
        coverSource,
      }
      try {
        const saved = await downloadCover(bvid, coverSource)
        work.cover = `/assets/edit-works/${saved.filename}`
        if (!saved.skipped) work.coverBytes = saved.bytes
      } catch (error) {
        // 封面拿不到不能让整条记录丢失：退回外链，并在 stderr 里说清楚，
        // 否则线上会悄悄用回一个会腐烂的地址。
        work.cover = coverSource
        failures.push({ bvid, reason: `封面未本地化，退回外链：${error.message}` })
      }
      works.push(work)
    }
  } catch (error) {
    failures.push({ bvid, reason: error.message })
  }
  await sleep(REQUEST_GAP_MS)
}

// 按发布日期倒序：最新的排在最前，列表本身就有"持续在发"的信息。
works.sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1))

const result = { collectedAt: new Date().toISOString().slice(0, 10), count: works.length, works }
console.log(JSON.stringify(result, null, 2))

if (outFile) {
  writeFileSync(outFile, JSON.stringify(result, null, 2) + '\n', 'utf8')
  console.error(`已写入 ${outFile}`)
}

// 直接生成前端的数据模块：手抄 4 条字段就会抄错一处，15 条更不用说。
if (moduleFile) {
  const header = `// 首页「视觉与剪辑」一节的作品清单。
//
// ⚠ 这个文件由 utils/collect-bilibili.mjs 生成，**不要手改**。
//    增删作品的做法：把 bvid 加进下面的命令重跑，覆盖本文件。
//      node utils/collect-bilibili.mjs --module project/frontend/src/data/editWorks.js BV1xxxxxxxxx BV1yyyyyyyyy
//
// 封面是**本地文件**（public/assets/edit-works/），不是 B 站外链。两条理由：
//   1. 外链会静默腐烂——视频下架、CDN 变动都不会有任何提交，线上封面就没了；
//      本地化之后封面进了版本控制，改了什么 git diff 看得见。
//   2. 访客打开首页时完全不碰第三方：不再向 B 站 CDN 发请求。
//   出处仍记在 coverSource 里，便于追溯与 --refresh-covers 重新拉取。
//
// 视频本身仍是外链：站点不存视频文件，播放由 B 站托管。
// 播放器 iframe **点击才挂载**（见 HomeView），不点则零加载。
export const editWorks = [\n`
  const quote = value => `'${String(value).replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`
  const body = works.map(w => `  {
    bvid: ${quote(w.bvid)},
    title: ${quote(w.title)},
    duration: ${quote(w.duration)},
    publishedAt: ${quote(w.publishedAt)},
    cover: ${quote(w.cover)},
    coverSource: ${quote(w.coverSource)},
    url: ${quote(w.url)},
    embed: ${quote(w.embed)},
  },`).join('\n')
  writeFileSync(moduleFile, `${header}${body}\n]\n`, 'utf8')
  console.error(`已生成数据模块 ${moduleFile}（${works.length} 条）`)
}

if (failures.length) {
  console.error(`\n失败 ${failures.length} 条：`)
  for (const f of failures) console.error(`  ${f.bvid}  ${f.reason}`)
  process.exit(1)
}
