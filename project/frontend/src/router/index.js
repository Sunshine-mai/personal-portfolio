import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProjectView from '../views/ProjectView.vue'
import EditWorksView from '../views/EditWorksView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/projects/:slug', name: 'project', component: ProjectView },
  { path: '/edit-works', name: 'edit-works', component: EditWorksView },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: HomeView },
]

// 累加 offsetTop，得到元素在文档里的**布局**位置。
// 关键：它不受 transform 影响。v-reveal 的元素在入场前带着 translateY(26px) scale(.988)，
// 用 getBoundingClientRect 去量会把这段位移算进去——而首屏索引点的卡片，
// 恰恰通常还在"未展开"状态（它在折叠线以下，IntersectionObserver 还没触发），
// 于是每一次点击都稳定偏低约 28px。实测就是 96 → 68。
function absoluteTop(element) {
  let top = 0
  for (let node = element; node; node = node.offsetParent) top += node.offsetTop
  return top
}

const router = createRouter({
  history: createWebHistory(),
  routes,
  // 详情页从顶部开始阅读；首页内的锚点跳转保持原有滚动定位
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) return savedPosition
    if (to.hash) {
      // 两点必须一起考虑，否则怎么调都不对：
      //
      // 1. Vue Router 自己算滚动位置，**不读 CSS 的 scroll-margin-top**。
      //    所以只写 [id]{scroll-margin-top:88px}，对"点导航链接"这条路径无效——
      //    实测过：直接 scrollIntoView 不被遮挡，点导航时标题却被吸顶栏盖住。
      //
      // 2. 锚点挂在**区块**上，而区块自带顶部内边距（普通节 104px，技术栈节 64px）。
      //    按区块顶算偏移，编号会落到 160~200px 处，看着空一大截。
      //    因此用区块自身的 padding-top 抵消，让编号稳定落在吸顶栏下方约 24px。
      //
      // 目标可能是分节区块，也可能是首屏索引指过来的**单张项目卡片**
      // （首屏的索引行是页内索引，不是跳详情页的快捷方式，所以它指向下方卡片）。
      // 卡片自身 padding-top 是 0，按同一公式正好落到 96px。
      //
      // 卡片不在时要退到"代表项目"整节，而不是什么都不做：
      // 点了没反应比落错位置更让人困惑。
      const resolved = typeof document === 'undefined'
        ? null
        : (document.querySelector(to.hash) || document.querySelector('#projects'))
      if (!resolved) return { top: 0 }
      const paddingTop = parseFloat(getComputedStyle(resolved).paddingTop) || 0
      const EYEBROW_TOP = 96 // 吸顶栏 72 + 呼吸空间 24
      // 自己算绝对位置，而不是把 { el } 交给 Vue Router 去量（原因见 absoluteTop 的注释）。
      return { top: absoluteTop(resolved) - (EYEBROW_TOP - paddingTop), behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

export default router
