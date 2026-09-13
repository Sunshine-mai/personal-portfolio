// 首页「视觉与剪辑」一节的作品清单。
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
export const editWorks = [
  {
    bvid: 'BV1LJNH6qERY',
    title: '对不起，豪到你了...',
    duration: '00:32',
    publishedAt: '2026-07-10',
    cover: '/assets/edit-works/BV1LJNH6qERY.jpg',
    coverSource: 'https://i0.hdslb.com/bfs/archive/f7684975969d4134cfa7814f4aa31c1156fd125b.jpg',
    url: 'https://www.bilibili.com/video/BV1LJNH6qERY/',
    embed: 'https://player.bilibili.com/player.html?bvid=BV1LJNH6qERY&autoplay=0',
  },
  {
    bvid: 'BV1WUMg6fE9g',
    title: '答应你的，我做到了',
    duration: '00:30',
    publishedAt: '2026-07-08',
    cover: '/assets/edit-works/BV1WUMg6fE9g.jpg',
    coverSource: 'https://i0.hdslb.com/bfs/archive/8f84060545ade85735eb1d09b12395fc9448e182.jpg',
    url: 'https://www.bilibili.com/video/BV1WUMg6fE9g/',
    embed: 'https://player.bilibili.com/player.html?bvid=BV1WUMg6fE9g&autoplay=0',
  },
  {
    bvid: 'BV1hSTy6AEAm',
    title: '无法想象，我们竟然真的做到了',
    duration: '01:31',
    publishedAt: '2026-07-05',
    cover: '/assets/edit-works/BV1hSTy6AEAm.jpg',
    coverSource: 'https://i2.hdslb.com/bfs/archive/34165611ad14fb7548c8d9ba0c8b9055a0b06d1e.jpg',
    url: 'https://www.bilibili.com/video/BV1hSTy6AEAm/',
    embed: 'https://player.bilibili.com/player.html?bvid=BV1hSTy6AEAm&autoplay=0',
  },
  {
    bvid: 'BV1YJTn6vEda',
    title: '再进major决赛,我在考虑这是不是此生仅有的机会...',
    duration: '01:36',
    publishedAt: '2026-07-02',
    cover: '/assets/edit-works/BV1YJTn6vEda.jpg',
    coverSource: 'https://i1.hdslb.com/bfs/archive/29899548b5e55f3da2a685d12417909379e94037.jpg',
    url: 'https://www.bilibili.com/video/BV1YJTn6vEda/',
    embed: 'https://player.bilibili.com/player.html?bvid=BV1YJTn6vEda&autoplay=0',
  },
]
