<script setup>
import { computed, onMounted, ref } from 'vue'

const projects = ref([])
const knowledge = ref([])
const summaries = ref([])
const active = ref('home')
const health = ref('未检查')
const detail = ref(null)
const loading = ref(true)
const api = async (path) => (await fetch(path)).json()

async function load() {
  loading.value = true
  try {
    const [p, k, s] = await Promise.all([api('/api/public/projects'), api('/api/public/knowledge/nodes'), api('/api/public/learning-summaries')])
    projects.value = p.data || []; knowledge.value = k.data || []; summaries.value = s.data || []
  } finally { loading.value = false }
}
async function checkHealth() {
  health.value = '检查中…'
  try { health.value = (await api('/api/health')).code === 200 ? '后端已连接' : '响应异常' } catch { health.value = '后端未启动' }
}
async function openProject(project) { detail.value = (await api(`/api/public/projects/${project.slug}`)).data; active.value = 'projects' }
const navItems = [{ id: 'home', label: '首页' }, { id: 'projects', label: '项目成果' }, { id: 'knowledge', label: '知识网络' }, { id: 'learning', label: '学习摘要' }]
const pageTitle = computed(() => navItems.find(item => item.id === active.value)?.label || '首页')
onMounted(load)
</script>

<template>
  <div class="app-shell">
    <header class="topbar">
      <button class="brand" @click="active = 'home'; detail = null"><span class="mark">C5</span><span>PERSONAL / PORTFOLIO</span></button>
      <nav><button v-for="item in navItems" :key="item.id" :class="{ active: active === item.id }" @click="active = item.id; detail = null">{{ item.label }}</button></nav>
      <span class="availability"><i></i>可公开浏览</span>
    </header>
    <main>
      <section v-if="active === 'home'" class="hero page-enter">
        <div class="hero-copy"><p class="eyebrow">Software development · AI applications</p><h1>把复杂问题，<br /><em>做成可验证的成果。</em></h1><p class="lead">这里记录真实项目中的判断、实现与交付。每一项内容都经过版本核验，并以清晰的证据呈现。</p><div class="hero-actions"><button class="primary" @click="active = 'projects'">浏览项目成果 <span>↗</span></button><button class="text-button" @click="checkHealth">检查平台状态</button><span class="health">{{ health }}</span></div></div>
        <div class="hero-meta"><span>01 / 04</span><span>持续构建中</span></div>
      </section>
      <section v-else class="subpage page-enter"><p class="eyebrow">COLLECTION / {{ active.toUpperCase() }}</p><h1>{{ pageTitle }}</h1><p class="lead">以公开、可追溯、可复现为原则，整理工程实践与思考。</p></section>
      <section v-if="active === 'home' || active === 'projects'" class="content-section"><div class="section-heading"><div><p class="eyebrow">SELECTED WORK</p><h2>{{ active === 'home' ? '精选项目' : '项目成果库' }}</h2></div><span>{{ projects.length }} 项已发布</span></div><div v-if="loading" class="empty">正在读取已发布内容…</div><div v-else-if="!projects.length" class="empty">暂无已发布项目。管理端完成审核发布后，内容会出现在这里。</div><div v-else class="project-grid"><article v-for="project in projects" :key="project.id" class="project-card" @click="openProject(project)"><div class="project-top"><span class="project-index">{{ String(project.id).padStart(2, '0') }}</span><span>{{ project.project_type }}</span></div><h3>{{ project.title }}</h3><p>{{ project.summary }}</p><button class="link-button">查看项目详情 ↗</button></article></div></section>
      <section v-if="active === 'home'" class="principles"><article><span>01</span><h3>公开边界</h3><p>只展示经过审查的成果，不执行、不托管实验代码。</p></article><article><span>02</span><h3>版本意识</h3><p>以修订、审核、发布快照保证内容可追溯。</p></article><article><span>03</span><h3>工程复盘</h3><p>记录为什么这样做，也记录验证结果与代价。</p></article></section>
      <section v-if="active === 'knowledge'" class="content-section"><div class="section-heading"><div><p class="eyebrow">KNOWLEDGE GRAPH</p><h2>知识节点</h2></div></div><div class="tag-grid"><span v-for="node in knowledge" :key="node.id">{{ node.label }} <small>{{ node.category }}</small></span></div></section>
      <section v-if="active === 'learning'" class="content-section"><div class="section-heading"><div><p class="eyebrow">LEARNING NOTES</p><h2>学习摘要</h2></div></div><div class="learning-list"><article v-for="item in summaries" :key="item.title"><span>NOTE / 2026</span><h3>{{ item.title }}</h3><p>{{ item.summary }}</p></article></div></section>
      <div v-if="detail" class="modal-backdrop" @click.self="detail = null"><article class="modal"><button class="close" @click="detail = null">×</button><p class="eyebrow">PROJECT DETAIL</p><h2>{{ detail.title }}</h2><p>{{ detail.summary }}</p><dl><dt>我的角色</dt><dd>{{ detail.role || '独立完成 / 安全占位' }}</dd><dt>项目背景</dt><dd>{{ detail.background || '待补充经审查的真实项目资料。' }}</dd><dt>交付结果</dt><dd>{{ detail.outcome || '待补充经过核验的结果。' }}</dd></dl></article></div>
    </main>
    <footer><span>© 2026 Personal Portfolio</span><span>内容以发布快照为准 · 不承载实验运行</span></footer>
  </div>
</template>
