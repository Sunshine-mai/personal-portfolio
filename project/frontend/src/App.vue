<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'

const fallbackProjects = [
  { id: 1, slug: 'ai-translator', title: 'LexiFlow', summary: '面向英语学习者的无广告翻译与生词学习工具，把一次翻译延展为可持续的学习闭环。', background: '翻译、收藏、复习和统计共同组成学习闭环。', outcome: '已实现核心闭环，等待补齐正式发布证据。', role: '产品设计、全栈开发、部署与验证规划', projectType: 'AI 产品 / 学习工具', project_type: 'INDEPENDENT', status: '已实现 · 待补正式发布证据', tags: ['FastAPI', 'Vue 3', '学习闭环'], image: '/assets/v5/translator-home.png', visualKind: 'screenshot', evidence: '3 张已核验截图 · 引擎降级提示的证据待补', gallery: [{ src: '/assets/v5/translator-home.png', step: 'STEP 01 / 入口', caption: '首页「每日一词」。把工具的入口前置成每天可以回访的学习动作，而不是一次性的翻译框。' }, { src: '/assets/v5/lexiflow-translate-result.png', step: 'STEP 02 / 核心链路', caption: '真实翻译结果。输入一句英文，模型返回中文译文，下方列出可继续查词的高频词。截图取自本地实跑，不是设计稿。' }, { src: '/assets/v5/lexiflow-quota-limit.png', step: 'STEP 03 / 边界处理', caption: '匿名游客每日 3 次免费翻译，用完后不静默失败，而是引导登录。配额按匿名标识独立计数，登录用户不受限。' }] },
  { id: 2, slug: 'ai-second-brain', title: 'AI Second Brain', summary: '从文档解析到 SSE 对话的个人知识库系统，让私有资料真正参与日常问答。', background: '把文档上传、切片、检索和流式对话连接起来。', outcome: '已完成独立项目闭环，正在整理公开版本证据。', role: '产品建模、Java 全栈开发、测试与部署', projectType: 'AI 产品 / 知识库 RAG', project_type: 'SOLO', status: '已实现 · 发布前复核', tags: ['RAG', 'Spring Boot', 'SSE'], image: '/assets/v5/brain-chat.png', visualKind: 'screenshot', evidence: '2 张已核验截图 · 文档管理内页需本地启动 MySQL 与后端后补截', gallery: [{ src: '/assets/v5/secondbrain-login.png', step: 'STEP 01 / 身份入口', caption: '登录页。系统区分管理员与普通用户，文档、会话与模型配置按账号隔离，不共用同一份数据。' }, { src: '/assets/v5/brain-chat.png', step: 'STEP 02 / 核心链路', caption: '知识库对话。上传的文档经解析、切片、向量化后进入检索，回答以 SSE 流式返回并标注来源片段。' }] },
  { id: 3, slug: 'zhiheng-teaching', title: '高中个性化教学平台 · 知衡', summary: '围绕题库、考试、掌握度、错题和练习构建三角色教学分析闭环。', background: '用清晰的数据流连接管理员、老师和学生的日常工作。', outcome: '高保真原型，尚未进入正式开发。', role: '产品定义、信息架构、交互原型与验收设计', projectType: '业务原型 / 教学分析', project_type: 'PROTOTYPE', status: '高保真原型 · 未进入开发', tags: ['原型', '三角色', '数据闭环'], image: '/assets/v5/teaching-home.png', visualKind: 'screenshot', evidence: '2 张原型截图 · 三角色视图与掌握度分析的证据待补', gallery: [{ src: '/assets/v5/teaching-home.png', step: 'STEP 01 / 管理员视角', caption: '题库管理看板：题目总数、已录入知识点、待审题目与最近录入。覆盖管理员、老师、学生三种角色的入口差异。' }, { src: '/assets/v5/teaching-knowledge.png', step: 'STEP 02 / 数据基础', caption: '知识点学习路径。把知识点组织成可追踪的路径，作为掌握度、错题与练习推荐的数据基础。' }] },
  { id: 4, slug: 'university-news', title: '大学新闻网', summary: 'PC 管理端、移动 Web 与微信小程序共享后端 API 的校园新闻系统。', background: '合作项目，覆盖内容管理、多端展示和文件存储。', outcome: '已授权展示，个人贡献边界待补充。', role: '个人负责范围待确认；此处仅记录团队项目能力', projectType: '内容平台 / 多端体验', project_type: 'COLLABORATIVE', status: '已授权展示 · 贡献边界待补充', tags: ['合作', '多端', '内容管理'], image: '/assets/v5/news-cover.png', visualKind: 'layout', evidence: '当前仅有设计版式 · 截图需先确认团队授权与贡献边界', gallery: [{ src: '/assets/v5/news-cover.png', step: 'STEP 01 / 展示边界', caption: '这一张是设计版式，不是系统截图。合作项目在取得团队授权前，不使用学校实景与具体新闻内容，个人贡献边界同样待确认。' }] },
]

const projectFilters = [{ key: 'all', label: '全部' }, { key: 'independent', label: '独立开发' }, { key: 'prototype', label: '原型方案' }, { key: 'collab', label: '合作项目' }]
const methods = [
  ['01', '定义问题', '目标、用户、数据流和明确不做的范围。'],
  ['02', '记录取舍', '比较方案，说明选择、限制与后续代价。'],
  ['03', '多层验证', '单元、接口、浏览器和部署检查共同形成证据。'],
  ['04', '发布复盘', '保留版本、隐私边界、回滚方式和下一步。'],
]
const projects = ref([])
const activeFilter = ref('all')
const selectedProject = ref(null)
const menuOpen = ref(false)
const loading = ref(true)
const apiStatus = ref('正在连接后端…')
const toastMessage = ref('')
const galleryIndex = ref(0)
let toastTimer

const filteredProjects = computed(() => projects.value.filter(project => activeFilter.value === 'all' || project.filter === activeFilter.value))
const publishedProjects = computed(() => projects.value.filter(project => project.project_type === 'INDEPENDENT' || project.filter === 'independent'))
const gallerySlides = computed(() => selectedProject.value?.gallery?.length ? selectedProject.value.gallery : (selectedProject.value?.image ? [{ src: selectedProject.value.image, step: 'STEP 01 / 封面', caption: selectedProject.value.summary }] : []))
const currentSlide = computed(() => gallerySlides.value[galleryIndex.value] || null)

async function getJson(path) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}
function normalizeProject(project, index) {
  const fallback = fallbackProjects[index % fallbackProjects.length]
  const machineType = String(project.project_type || project.projectType || fallback.project_type).toUpperCase()
  const filter = machineType.includes('PROTOTYPE') ? 'prototype' : machineType.includes('COLLAB') ? 'collab' : 'independent'
  return {
    ...fallback,
    ...project,
    projectType: project.project_type ? project.projectType : fallback.projectType,
    project_type: machineType,
    filter,
    tags: project.tags && project.tags.length ? project.tags : fallback.tags,
    gallery: project.gallery && project.gallery.length ? project.gallery : fallback.gallery,
    visualKind: project.visualKind || fallback.visualKind,
    evidence: project.evidence || fallback.evidence,
  }
}
async function loadProjects() {
  loading.value = true
  try {
    const response = await getJson('/api/public/projects')
    const published = Array.isArray(response.data) ? response.data : []
    if (published.length) {
      projects.value = published.map(normalizeProject)
      apiStatus.value = `后端已连接 · ${published.length} 个已发布项目来自公开 API`
    } else {
      projects.value = fallbackProjects.map(normalizeProject)
      apiStatus.value = '后端已连接但暂无已发布内容 · 当前显示安全静态回退数据'
    }
  } catch {
    projects.value = fallbackProjects.map(normalizeProject)
    apiStatus.value = '后端不可用 · 当前显示安全静态回退数据'
  } finally { loading.value = false }
}
async function openProject(project) {
  galleryIndex.value = 0
  try { selectedProject.value = (await getJson(`/api/public/projects/${project.slug}`)).data || project } catch { selectedProject.value = project }
  if (!selectedProject.value.gallery || !selectedProject.value.gallery.length) selectedProject.value = { ...project, ...selectedProject.value, gallery: project.gallery, visualKind: project.visualKind, evidence: project.evidence }
  document.body.style.overflow = 'hidden'
}
function closeProject() { selectedProject.value = null; document.body.style.overflow = '' }
function showToast(message) { toastMessage.value = message; clearTimeout(toastTimer); toastTimer = setTimeout(() => { toastMessage.value = '' }, 2400) }
async function copyEmail() {
  try { await navigator.clipboard.writeText('hello@crow5.studio'); showToast('邮箱已复制') } catch { showToast('联系邮箱：hello@crow5.studio') }
}
function closeMenu() { menuOpen.value = false }
function galleryPrev() { const total = gallerySlides.value.length; if (total < 2) return; galleryIndex.value = (galleryIndex.value - 1 + total) % total }
function galleryNext() { const total = gallerySlides.value.length; if (total < 2) return; galleryIndex.value = (galleryIndex.value + 1) % total }
function onKeydown(event) {
  if (event.key === 'Escape') { closeProject(); closeMenu() }
  if (!selectedProject.value) return
  if (event.key === 'ArrowLeft') galleryPrev()
  if (event.key === 'ArrowRight') galleryNext()
}
onMounted(() => { loadProjects(); window.addEventListener('keydown', onKeydown) })
onUnmounted(() => { window.removeEventListener('keydown', onKeydown); document.body.style.overflow = '' })
</script>

<template>
  <div class="portfolio-shell" id="home">
    <header class="topbar"><div class="shell nav-wrap">
      <a class="brand" href="#home"><span class="brand-mark">C5</span><span>个人作品集</span></a>
      <nav class="nav-links" :class="{ open: menuOpen }" aria-label="主导航"><a href="#projects" @click="closeMenu">代表项目</a><a href="#edit-works" @click="closeMenu">视觉与剪辑</a><a href="#method" @click="closeMenu">工程方法</a><a href="#about" @click="closeMenu">关于我</a></nav>
      <div class="nav-tools"><button class="icon-button" type="button" aria-label="复制邮箱" @click="copyEmail">@</button><button class="menu-button" type="button" :aria-expanded="menuOpen" aria-label="打开导航" @click="menuOpen = !menuOpen">☰</button></div>
    </div></header>

    <main>
      <section class="hero-section" id="hero"><div class="shell hero-grid"><div class="hero-copy-block"><p class="eyebrow">SOFTWARE DEVELOPMENT / AI APPLICATIONS</p><h1>把复杂的问题，<br /><em>做成可以使用的产品。</em></h1><p class="hero-copy">这里记录我做过的产品、技术选择和验证过程。先看结果，再往下看我怎么定义、实现和交付。</p><div class="hero-actions"><a class="button primary" href="#projects">查看代表项目 <span>↗</span></a><a class="text-link" href="#method">了解我的工作方式</a></div></div><div class="hero-facts"><div><span>FOCUS</span><strong>AI 应用 / 全栈开发</strong></div><div><span>PROJECTS</span><strong>{{ publishedProjects.length || 2 }} 个独立项目</strong></div><div><span>STACK</span><strong>Java · Python · Vue</strong></div><div><span>STATUS</span><strong class="warm">开放合作</strong></div></div></div></section>

      <section class="content-section projects-section" id="projects"><div class="shell"><div class="section-heading"><div><p class="eyebrow">01 / REPRESENTATIVE PROJECTS</p><h2>做过的项目，<br /><em>按真实状态呈现。</em></h2></div><p>不把原型写成已上线，不把团队成果写成个人战绩。每个案例都保留完成度、角色和下一步。</p></div><div class="filter-row" role="tablist" aria-label="项目筛选"><button v-for="filter in projectFilters" :key="filter.key" type="button" :class="{ active: activeFilter === filter.key }" role="tab" :aria-selected="activeFilter === filter.key" @click="activeFilter = filter.key">{{ filter.label }}</button></div><p v-if="loading" class="api-status">正在读取已发布内容…</p><p v-else class="api-status">{{ apiStatus }}</p><div class="project-list"><article v-for="(project, index) in filteredProjects" :key="project.slug || project.id" class="project-card"><div class="project-card-body"><span class="project-index">0{{ index + 1 }} / PROJECT</span><span class="project-meta">{{ project.projectType }}</span><h3>{{ project.title }}</h3><p>{{ project.summary }}</p><div class="tag-list"><span v-for="tag in project.tags" :key="tag">{{ tag }}</span></div><button class="card-link" type="button" @click="openProject(project)">查看案例 <span>↗</span></button></div><div class="project-visual" :class="{ 'has-image': project.image }" :style="project.image ? { backgroundImage: `url(${project.image})` } : {}"><span v-if="!project.image">VISUAL<br />EVIDENCE</span><span v-else class="visual-label">{{ project.visualKind === 'layout' ? '设计版式' : '公开截图' }}</span></div></article></div></div></section>

      <section class="content-section edit-section" id="edit-works"><div class="shell"><div class="section-heading"><div><p class="eyebrow">02 / VISUAL &amp; EDITING</p><h2>视觉和剪辑，<br /><em>真实素材整理中。</em></h2></div><p>这里会放经过授权的剪辑练习与视觉实验。当前只保留方向和结构，不用虚构作品填满版面。</p></div><div class="holding-row"><span>EDIT 01 / MATERIAL HOLD</span><div><h3>一条信息的三种节奏</h3><p>等待经授权的真实片段截图，补充片长、版本和发布链接。</p></div><span class="hold-status">待补真实素材</span></div></div></section>

      <section class="content-section method-section" id="method"><div class="shell"><div class="section-heading"><div><p class="eyebrow">03 / HOW I WORK</p><h2>从想法到可以交付，<br /><em>每一步都留下证据。</em></h2></div><p>我会先定义问题和边界，再小步实现，用测试和发布记录确认结果。</p></div><div class="method-list"><article v-for="method in methods" :key="method[0]"><span>{{ method[0] }}</span><h3>{{ method[1] }}</h3><p>{{ method[2] }}</p></article></div></div></section>

      <section class="content-section about-section" id="about"><div class="shell about-grid"><div><p class="eyebrow">04 / ABOUT</p><h2>一个持续构建，<br /><em>也持续校准的人。</em></h2></div><div class="about-copy"><p>我在产品、代码和内容之间工作。喜欢把模糊的问题拆成清晰的界面，也喜欢把一次交付里的判断，沉淀成下一次可以复用的方法。</p><dl><div><dt>BASE</dt><dd>中国 · 远程协作</dd></div><div><dt>FOCUS</dt><dd>AI / 产品体验 / 内容</dd></div><div><dt>STACK</dt><dd>Java · Python · Vue</dd></div></dl><button class="button primary" type="button" @click="copyEmail">联系我 <span>↗</span></button></div></div></section>
    </main>

    <footer class="site-footer"><div class="shell footer-wrap"><span>C5 个人作品集<span class="dot">.</span></span><span>BUILD WITH INTENT</span><a href="#home">回到开头 ↑</a></div></footer>
    <div v-if="selectedProject" class="drawer-backdrop" role="presentation" @click.self="closeProject"><aside class="drawer" role="dialog" aria-modal="true" aria-label="项目详情"><div class="drawer-head"><span>PROJECT DETAIL</span><button class="close-button" type="button" aria-label="关闭详情" @click="closeProject">×</button></div><div v-if="currentSlide" class="gallery"><figure class="gallery-stage"><img :src="currentSlide.src" :alt="selectedProject.title + ' ' + currentSlide.step" /></figure><div class="gallery-bar"><button type="button" :disabled="gallerySlides.length &lt; 2" aria-label="上一张截图" @click="galleryPrev">←</button><span>{{ galleryIndex + 1 }} / {{ gallerySlides.length }}</span><button type="button" :disabled="gallerySlides.length &lt; 2" aria-label="下一张截图" @click="galleryNext">→</button></div><div class="gallery-copy"><p class="gallery-step">{{ currentSlide.step }}<span v-if="selectedProject.visualKind === 'layout'" class="gallery-kind">设计版式 · 非截图</span></p><p class="gallery-caption">{{ currentSlide.caption }}</p></div><div v-if="gallerySlides.length > 1" class="gallery-thumbs" role="tablist" aria-label="案例截图列表"><button v-for="(slide, index) in gallerySlides" :key="slide.src" type="button" role="tab" :class="{ active: index === galleryIndex }" :aria-selected="index === galleryIndex" :aria-label="'查看第 ' + (index + 1) + ' 张截图'" @click="galleryIndex = index"><img :src="slide.src" alt="" /></button></div><p class="gallery-hint">← → 切换截图 · Esc 关闭</p><p v-if="selectedProject.evidence" class="gallery-evidence">证据状态：{{ selectedProject.evidence }}</p></div><p class="eyebrow">{{ selectedProject.projectType }}</p><h2>{{ selectedProject.title }}</h2><p class="drawer-summary">{{ selectedProject.summary }}</p><dl><div><dt>状态</dt><dd>{{ selectedProject.status || selectedProject.outcome }}</dd></div><div><dt>我的角色</dt><dd>{{ selectedProject.role }}</dd></div></dl><h3>问题与边界</h3><p>{{ selectedProject.background }}</p><h3>下一步</h3><p>{{ selectedProject.outcome }}</p><button class="button primary" type="button" @click="showToast('已记录重点案例'); closeProject()">标记为重点案例</button></aside></div>
    <div v-if="toastMessage" class="toast" role="status">{{ toastMessage }}</div>
  </div>
</template>
