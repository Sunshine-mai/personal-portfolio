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
    if (to.hash) return { el: to.hash, behavior: 'smooth' }
    return { top: 0 }
  },
})

export default router
