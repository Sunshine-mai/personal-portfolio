<script setup>
import { computed, onMounted, ref } from 'vue'

const FALLBACK_PROJECTS = [
  { id: 1, slug: 'team-project', title: '协作项目', summary: '第一次真正进入团队开发。重点展示协作边界、负责模块、联调经验，以及从这里摸进编程门道的过程。', background: '在合作项目中理解需求拆解、前后端联调、模块边界和团队交付节奏。', outcome: '待完成公开授权、贡献边界和展示材料审查。', role: '明确个人负责模块，诚实区分团队成果与个人贡献。', project_type: 'COLLABORATIVE', status: 'PUBLISHED', published: true },
  { id: 2, slug: 'second-brain', title: 'AI Second Brain', summary: '第一个独立全栈项目：以 Java/Spring Boot 构建 RAG 知识库聊天系统，完整经历从 Demo 到部署。', background: '把文档上传、切片、检索和对话连接起来，让知识库能够被自然地查询。', outcome: '已完成独立项目闭环，正在整理公开版本与贡献证据。', role: '独立完成产品设计、服务分层、RAG 链路与部署。', project_type: 'SOLO', status: 'PUBLISHED', published: true },
  { id: 3, slug: 'translator', title: 'AI Translator', summary: '无广告 AI 翻译与英语学习工具。用 FastAPI、Vue 3、Redis 和 Docker，把翻译结果沉淀为可复习的学习闭环。', background: '为英语学习者提供没有广告干扰、可以沉淀生词并持续复习的翻译体验。', outcome: '已完成核心闭环，下一步是整理正式测试与公开版本审查。', role: '独立完成前后端实现、缓存策略、限流和学习闭环。', project_type: 'INDEPENDENT', status: 'PUBLISHED', published: true },
]
const FALLBACK_KNOWLEDGE = [
  { id: 'python', label: 'Python', category: '正在巩固', description: '当前主线：从 0 基础走向能读懂并改造真实项目。' },
  { id: 'translator', label: 'AI Translator', category: 'PROJECT 03', description: 'Python/FastAPI 实战案例：翻译、学习闭环、缓存、限流与部署。' },
  { id: 'fastapi', label: 'FastAPI', category: 'API architecture', description: '负责 API 路由、依赖注入、异常和健康检查。' },
  { id: 'rag', label: 'RAG', category: 'PROJECT 02', description: '在 AI Second Brain 中完成文档检索与知识库对话链路。' },
]
const FALLBACK_LEARNING = [
  { title: '从 Java 进入 Python', summary: '不是抛弃已有经验，而是用 Spring Boot 的调用链去理解 FastAPI 的路由、依赖注入和服务分层。' },
  { title: '把功能做成学习闭环', summary: '翻译不再止于结果：查词、收藏、复习和统计让产品真正服务英语学习。' },
  { title: '从验证脚本走向正式测试', summary: '继续补齐 pytest、接口测试和浏览器验证，把“我测试过”变成可重复的质量证据。' },
  { title: '三次复用才算理解', summary: '在 ai-dev-lab 学概念，在正式项目里落地，再在作品集里用自己的话说明取舍。' },
]

const projects = ref([])
const knowledge = ref([])
const summaries = ref([])
const activeNode = ref(null)
const detail = ref(null)
const menuOpen = ref(false)
const loading = ref(true)
const apiStatus = ref('正在连接后端…')
const toastMessage = ref('')
let toastTimer

const navItems = [
  { href: '#projects', label: '项目' }, { href: '#network', label: '知识网络' },
  { href: '#learning', label: '学习轨迹' }, { href: '#method', label: '交付方法' }, { href: '#about', label: '关于' },
]
const selectedNode = computed(() => activeNode.value || knowledge.value[1] || FALLBACK_KNOWLEDGE[1])

async function getJson(path) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
async function loadPublicData() {
  loading.value = true
  try {
    const [p, k, l] = await Promise.all([
      getJson('/api/public/projects'), getJson('/api/public/knowledge/nodes'), getJson('/api/public/learning-summaries'),
    ])
    projects.value = (p.data?.length ? p.data : FALLBACK_PROJECTS).slice().sort((a, b) => a.id - b.id)
    knowledge.value = k.data?.length ? k.data.map(node => ({ ...node, description: node.description || `${node.label}：公开知识节点。` })) : FALLBACK_KNOWLEDGE
    summaries.value = l.data?.length ? l.data : FALLBACK_LEARNING
    apiStatus.value = '后端已连接 · 内容来自公开 API'
  } catch {
    projects.value = FALLBACK_PROJECTS
    knowledge.value = FALLBACK_KNOWLEDGE
    summaries.value = FALLBACK_LEARNING
    apiStatus.value = '后端不可用 · 当前显示安全静态回退数据'
  } finally { loading.value = false }
}
async function checkHealth() {
  apiStatus.value = '正在检查后端…'
  try { await getJson('/api/health'); apiStatus.value = '后端已连接 · 健康检查通过' } catch { apiStatus.value = '后端未启动 · 当前仍可浏览静态内容' }
}
async function openProject(project) {
  try { detail.value = (await getJson(`/api/public/projects/${project.slug}`)).data || project } catch { detail.value = project }
  document.body.style.overflow = 'hidden'
}
function closeProject() { detail.value = null; document.body.style.overflow = '' }
function selectNode(node) { activeNode.value = node; showToast(`已定位知识节点：${node.label}`) }
async function copyEmail() {
  try { await navigator.clipboard.writeText('hello@portfolio.local'); showToast('联系邮箱已复制') } catch { showToast('联系邮箱：hello@portfolio.local') }
}
function showToast(message) { toastMessage.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastMessage.value = '' }, 2400) }
function closeMenu() { menuOpen.value = false }
onMounted(() => { loadPublicData(); window.addEventListener('keydown', event => { if (event.key === 'Escape') { closeProject(); closeMenu() } }) })
</script>

<template>
  <div id="top" class="portfolio-shell">
    <header class="topbar"><div class="container nav">
      <a class="brand" href="#top"><span class="brand-mark">C5</span><span>工程档案馆</span></a>
      <nav class="nav-links" :class="{ open: menuOpen }" aria-label="主导航"><a v-for="item in navItems" :key="item.href" :href="item.href" @click="closeMenu">{{ item.label }}</a></nav>
      <div class="nav-actions"><button class="icon-btn" type="button" aria-label="复制联系邮箱" @click="copyEmail">@</button><button class="menu-btn" type="button" :aria-expanded="menuOpen" aria-label="打开菜单" @click="menuOpen = !menuOpen">☰</button></div>
    </div></header>

    <main>
      <section class="hero"><div class="container hero-grid"><div><p class="eyebrow">Software development / AI applications</p><h1>我做过什么，<br />这里有完整记录。</h1><p class="hero-copy">这是我的项目、技术选择和开发记录。你可以先看结果，也可以继续往下看我怎么做、怎么测试，以及哪里还在学习。</p><div class="hero-actions"><a class="btn btn-primary" href="#projects">查看代表项目 <span>↗</span></a><a class="btn btn-ghost" href="#method">了解我的交付方法</a></div></div><div class="fact-index"><div class="fact"><span>FOCUS</span><strong>AI 应用开发 / 全栈</strong></div><div class="fact"><span>PROJECTS</span><strong>03 个代表项目</strong></div><div class="fact"><span>STACKS</span><strong>Java → Python</strong></div><div class="fact"><span>WORKFLOW</span><strong>设计 · 实现 · 测试 · 交付</strong></div><div class="fact"><span>STATUS</span><strong class="status-open">开放合作</strong></div></div></div></section>

      <section id="projects" class="section"><div class="container"><div class="section-head"><div><p class="eyebrow">Projects / 01—03</p><h2 class="section-title">我做过的三个项目。</h2></div><p class="section-intro">从团队协作开始，后来独立完成 Java 项目，再用 Python 做了 AI Translator。每个项目都保留了当时的做法和结果。</p></div><p v-if="loading" class="api-notice">正在读取已发布内容…</p><p v-else class="api-notice">{{ apiStatus }}</p><div class="project-grid"><article v-for="(project, index) in projects" :key="project.slug" class="project-card" :class="{ featured: index === 2 }"><span class="project-number">PROJECT {{ String(index + 1).padStart(2, '0') }} · {{ project.project_type }}</span><h3>{{ project.title }}</h3><p>{{ project.summary }}</p><div class="tags"><span class="tag">{{ index === 0 ? 'Java' : index === 1 ? 'Spring Boot' : 'FastAPI' }}</span><span class="tag">{{ index === 0 ? 'Vue 3' : index === 1 ? 'RAG' : 'Vue 3' }}</span><span class="tag">{{ index === 0 ? 'Teamwork' : index === 1 ? 'Java' : 'Redis' }}</span></div><button class="project-link" type="button" @click="openProject(project)">查看案例 ↗</button></article></div></div></section>

      <section id="evidence" class="section"><div class="container"><div class="section-head"><div><p class="eyebrow">How I work</p><h2 class="section-title">我通常这样做项目。</h2></div><p class="section-intro">先把问题说清楚，再动手实现。过程中会记录取舍，并用实际测试确认结果。</p></div><div class="evidence-grid"><article class="evidence"><span>01 / PLAN</span><h3>先把问题拆开</h3><p>确认目标、范围、数据怎么流，以及这次不做什么。</p></article><article class="evidence"><span>02 / TEST</span><h3>做完以后再验证</h3><p>跑单元测试、接口测试和浏览器操作，不只看页面能不能打开。</p></article><article class="evidence"><span>03 / REVIEW</span><h3>把经验留下来</h3><p>遇到的问题、做过的取舍和下一步计划，都会写进记录。</p></article></div></div></section>

      <section id="network" class="section"><div class="container"><div class="section-head"><div><p class="eyebrow">Knowledge / relation map</p><h2 class="section-title">我正在学习什么。</h2></div><p class="section-intro">点击一个主题，可以看到它和哪些项目有关，以及我目前掌握到什么程度。</p></div><div class="network-layout"><div class="network" aria-label="可交互知识网络"><span class="network-line line-a"></span><span class="network-line line-b"></span><span class="network-line line-c"></span><button v-for="(node, index) in knowledge.slice(0, 4)" :key="node.id" class="node" :class="[`node-${String.fromCharCode(97 + index)}`, { selected: selectedNode.id === node.id }]" type="button" @click="selectNode(node)"><span>{{ node.label }}<small>{{ node.category }}</small></span></button></div><aside class="network-detail"><p class="eyebrow">Selected node</p><h3>{{ selectedNode.label }}</h3><p>{{ selectedNode.description }}</p><ul class="network-list"><li><span>USED IN</span> 翻译链路、缓存、限流、部署</li><li><span>DECISION</span> SQLite 开发降门槛，生产切 PostgreSQL</li><li><span>NEXT</span> 补强正式测试与原理理解</li></ul></aside></div></div></section>

      <section id="learning" class="section"><div class="container"><div class="section-head"><div><p class="eyebrow">Learning notes</p><h2 class="section-title">边做项目，边补基础。</h2></div><p class="section-intro">详细学习过程放在 ai-dev-lab，这里只展示和项目有关的几个阶段。</p></div><div class="timeline"><article v-for="(item, index) in summaries" :key="item.title" class="timeline-item"><span class="date">{{ index === 0 ? '2026.06' : index === 1 ? '2026.08' : index === 2 ? 'NEXT' : 'LAB' }}</span><div><h3>{{ item.title }}</h3><p>{{ item.summary }}</p></div></article></div></div></section>

      <section id="method" class="section"><div class="container"><div class="section-head"><div><p class="eyebrow">Project workflow</p><h2 class="section-title">从想法到可以交付。</h2></div><p class="section-intro">我会把工作拆成几步，每一步都有结果，不把问题留到最后一起处理。</p></div><div class="method-grid"><article v-for="item in [{ n: '01', t: '定义问题', d: '目标、用户、边界和不做什么。' }, { n: '02', t: '记录决策', d: '比较方案，解释选择与代价。' }, { n: '03', t: '小步实现', d: '每个功能独立可运行和可验证。' }, { n: '04', t: '多层验证', d: '单元、接口、浏览器和部署检查。' }, { n: '05', t: '交付复盘', d: '版本、隐私、证据、回滚和经验沉淀。' } ]" :key="item.n" class="method"><span>{{ item.n }}</span><b>{{ item.t }}</b><p>{{ item.d }}</p></article></div></div></section>

      <section id="about" class="section about"><div class="container"><p class="eyebrow">About me</p><h2 class="section-title">我还在学习，但不会只停在会用。</h2><p>我目前的方向是软件开发和 AI 应用开发。过去主要靠项目实践积累经验，现在一边维护已有项目，一边通过 ai-dev-lab 补 Python、Java 和大模型相关基础。</p><div class="hero-actions"><button class="btn btn-primary" type="button" @click="copyEmail">复制联系邮箱</button><button class="btn btn-ghost" type="button" @click="checkHealth">检查后端连接</button></div><p class="connection-status" role="status">{{ apiStatus }}</p></div></section>
    </main>
    <footer><div class="container footer-grid"><div><div class="brand"><span class="brand-mark">C5</span><span>工程档案馆</span></div><p>一个持续更新的个人工程作品集。内容以公开发布快照为准，不承载实验运行。</p></div><div class="footer-links"><a href="#projects">PROJECTS</a><a href="#network">KNOWLEDGE</a><a href="#about">CONTACT</a></div></div></footer>

    <div v-if="detail" class="drawer-backdrop" role="presentation" @click.self="closeProject"><aside class="drawer" role="dialog" aria-modal="true"><button class="drawer-close" aria-label="关闭项目详情" @click="closeProject">×</button><p class="eyebrow">PROJECT · {{ detail.project_type }}</p><h2>{{ detail.title }}</h2><p class="drawer-lead">{{ detail.summary }}</p><div class="drawer-section"><h3>问题与服务</h3><p>{{ detail.background }}</p></div><div class="drawer-section"><h3>关键证据</h3><ul class="network-list"><li>明确模块边界与交付责任</li><li>记录技术决策、测试和联调过程</li><li>以可复现结果支持公开展示</li></ul></div><div class="drawer-section"><h3>当前状态</h3><p>{{ detail.outcome }}</p></div><button class="btn btn-primary" type="button" @click="showToast('已标记：重点案例'); closeProject()">标记为重点案例</button></aside></div>
    <div v-if="toastMessage" class="toast" role="status">{{ toastMessage }}</div>
  </div>
</template>
