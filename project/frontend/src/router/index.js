import { createRouter, createWebHistory } from 'vue-router'
import HomeView from '../views/HomeView.vue'
import ProjectView from '../views/ProjectView.vue'

const routes = [
  { path: '/', name: 'home', component: HomeView },
  { path: '/projects/:slug', name: 'project', component: ProjectView },
  { path: '/:pathMatch(.*)*', name: 'not-found', component: HomeView },
]

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
      const target = typeof document === 'undefined' ? null : document.querySelector(to.hash)
      const paddingTop = target ? parseFloat(getComputedStyle(target).paddingTop) || 0 : 0
      const EYEBROW_TOP = 96 // 吸顶栏 72 + 呼吸空间 24
      return { el: to.hash, top: EYEBROW_TOP - paddingTop, behavior: 'smooth' }
    }
    return { top: 0 }
  },
})

export default router
