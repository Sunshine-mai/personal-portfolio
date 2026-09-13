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
//   node utils/collect-bilibili.mjs --out editWorks.json BV1YJTn6vEda
import { writeFileSync } from 'node:fs'
import { setTimeout as sleep } from 'node:timers/promises'

const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36'
const REQUEST_GAP_MS = 900 // 接口有风控，逐条之间留间隔，不要并发轰

const args = process.argv.slice(2)
const outIndex = args.indexOf('--out')
const outFile = outIndex >= 0 ? args[outIndex + 1] : null
const bvids = args.filter((a, i) => !a.startsWith('--') && !(outIndex >= 0 && i === outIndex + 1))

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
      works.push({
        bvid,
        title: d.title,
        duration: secondsToClock(d.duration),
        durationSeconds: d.duration,
        publishedAt: new Date(d.pubdate * 1000).toISOString().slice(0, 10),
        cover: String(d.pic || '').replace(/^http:/, 'https:'),
        url: `https://www.bilibili.com/video/${bvid}/`,
        embed: `https://player.bilibili.com/player.html?bvid=${bvid}&autoplay=0`,
        author: d.owner?.name || '',
        uid: d.owner?.mid || null,
      })
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

if (failures.length) {
  console.error(`\n失败 ${failures.length} 条：`)
  for (const f of failures) console.error(`  ${f.bvid}  ${f.reason}`)
  process.exit(1)
}
