<script setup>
import { onMounted, onUnmounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useToast } from './composables/useToast'

const router = useRouter()
const { toastMessage, copyEmail } = useToast()
const menuOpen = ref(false)

function closeMenu() { menuOpen.value = false }
function onKeydown(event) { if (event.key === 'Escape') closeMenu() }
function backToTop() {
  if (router.currentRoute.value.path !== '/') router.push('/')
  window.scrollTo({ top: 0, behavior: 'smooth' })
}
onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <div class="portfolio-shell" id="top">
    <header class="topbar">
      <div class="shell nav-wrap">
        <RouterLink class="brand" to="/"><span class="brand-mark">C5</span><span>个人作品集</span></RouterLink>
        <nav class="nav-links" :class="{ open: menuOpen }" aria-label="主导航">
          <RouterLink :to="{ path: '/', hash: '#projects' }" @click="closeMenu">代表项目</RouterLink>
          <RouterLink :to="{ path: '/', hash: '#stack' }" @click="closeMenu">技术栈</RouterLink>
          <RouterLink :to="{ path: '/', hash: '#edit-works' }" @click="closeMenu">视觉与剪辑</RouterLink>
          <RouterLink :to="{ path: '/', hash: '#method' }" @click="closeMenu">工程方法</RouterLink>
          <RouterLink :to="{ path: '/', hash: '#about' }" @click="closeMenu">关于我</RouterLink>
        </nav>
        <div class="nav-tools">
          <button class="icon-button" type="button" aria-label="复制邮箱" @click="copyEmail">@</button>
          <button class="menu-button" type="button" :aria-expanded="menuOpen" aria-label="打开导航" @click="menuOpen = !menuOpen">☰</button>
        </div>
      </div>
    </header>

    <main>
      <RouterView />
    </main>

    <footer class="site-footer">
      <div class="shell footer-wrap">
        <span>C5 个人作品集<span class="dot">.</span></span>
        <span>BUILD WITH INTENT</span>
        <a href="#top" @click.prevent="backToTop">回到开头 ↑</a>
      </div>
    </footer>

    <div v-if="toastMessage" class="toast" role="status">{{ toastMessage }}</div>
  </div>
</template>
