// 案例数据与归一化逻辑。
// 首页列表页与项目详情页共用，避免两处各写一份导致数据漂移。
import { ref } from 'vue'

export const fallbackProjects = [
  { id: 1, slug: 'ai-translator', title: 'LexiFlow', repoName: 'ai-translator', summary: '面向英语学习者的无广告翻译与生词学习工具，把一次翻译延展为可持续的学习闭环。', background: '翻译、收藏、复习和统计共同组成学习闭环。', outcome: '已实现核心闭环，等待补齐正式发布证据。', role: '产品设计、全栈开发、部署与验证规划', projectType: '语言学习 / 翻译工具', project_type: 'INDEPENDENT', status: '已实现 · 待补正式发布证据', tags: ['翻译', '生词复习', 'FastAPI'], image: '/assets/v5/translator-home.png', visualKind: 'screenshot', evidence: '3 张已核验截图 · 引擎降级提示的证据待补', gallery: [{ src: '/assets/v5/translator-home.png', step: 'STEP 01 / 入口', caption: '首页「每日一词」。把工具的入口前置成每天可以回访的学习动作，而不是一次性的翻译框。' }, { src: '/assets/v5/lexiflow-translate-result.png', step: 'STEP 02 / 核心链路', caption: '真实翻译结果。输入一句英文，模型返回中文译文，下方列出可继续查词的高频词。截图取自本地实跑，不是设计稿。' }, { src: '/assets/v5/lexiflow-quota-limit.png', step: 'STEP 03 / 边界处理', caption: '匿名游客每日 3 次免费翻译，用完后不静默失败，而是引导登录。配额按匿名标识独立计数，登录用户不受限。' }] },
  { id: 2, slug: 'ai-second-brain', title: 'Folio', repoName: 'ai-second-brain', summary: '把文档整理、切片检索与问答连成一条链路，回答只依据上传的资料，并标注来源。', background: '把文档上传、切片、检索和流式对话连接起来。', outcome: '已完成独立项目闭环，正在整理公开版本证据。', role: '产品建模、Java 全栈开发、测试与部署', projectType: '知识库 / 检索问答', project_type: 'SOLO', status: '已实现 · 发布前复核', tags: ['文档检索', '引用溯源', 'Spring Boot'], image: '/assets/v5/folio-cover-login.png', visualKind: 'screenshot', evidence: '3 张已核验截图 · 均为独立演示账号采集，不含真实资料', gallery: [{ src: '/assets/v5/secondbrain-login.png', step: 'STEP 01 / 身份入口', caption: '登录页。左侧说明产品定位，右侧为登录表单。系统区分管理员与普通用户，文档、会话与模型配置按账号隔离。' }, { src: '/assets/v5/brain-documents.png', step: 'STEP 02 / 文档管理', caption: '文档上传与处理状态。上传后经过解析、递归切片和本地 BGE 向量化，页面上显示每个文档的切片数量。截图为演示账号，未包含真实资料。' }, { src: '/assets/v5/brain-chat-cited.png', step: 'STEP 03 / 核心链路', caption: '知识库对话。回答基于检索到的片段生成，并给出引用片段与相似度分数；这份材料只覆盖了问题的一部分，回答就明确说明缺失，而不是编造补全。' }] },
  { id: 3, slug: 'zhiheng-teaching', title: '高中个性化教学平台 · 知衡', summary: '围绕题库、考试、掌握度、错题和练习构建三角色教学分析闭环。', background: '用清晰的数据流连接管理员、老师和学生的日常工作。', outcome: '补齐学生端与管理员端页面、知识点建表与知识图谱，然后处理部署。当前为单机演示数据，未压测、未部署。', role: '产品定义、信息架构、Java 后端与 Vue 前端开发、测试与验收', projectType: '教育产品 / 全栈应用', project_type: 'INDEPENDENT', status: '教师端考试闭环已交付 · 学生端后端完成、前端待补', tags: ['Spring Boot', 'Vue 3', '三角色'], image: '/assets/v5/zhiheng-dashboard.png', visualKind: 'screenshot', evidence: '真实前后端与数据库 · 8 次版本化迁移 · 51 项后端测试 · 考试分析页存在接口缺陷待修', gallery: [{ src: '/assets/v5/zhiheng-dashboard.png', step: 'STEP 01 / 教师工作台', caption: '教师工作台。班级平均掌握度、待批改考试、需关注学生与可用题目数都由最近一次真实考试的结果聚合得出，数据来自后端接口而非写死的演示值。' }, { src: '/assets/v5/zhiheng-questions.png', step: 'STEP 02 / 题库管理', caption: '题库管理：支持单选、多选、判断、填空、解答五种题型，可维护知识点、难度与分值，也支持按模板 Excel 批量导入。' }, { src: '/assets/v5/zhiheng-grading.png', step: 'STEP 03 / 逐题改卷', caption: '逐题改卷。按学生逐题录入得分，前端限制分数不得超过该题满分，左侧实时显示每位学生的录入进度。这是线下考试闭环里最关键的一步。' }] },
  { id: 4, slug: 'university-news', title: '大学新闻网', summary: 'PC 管理端、移动 Web 与微信小程序共享后端 API 的校园新闻系统。', background: '合作项目，覆盖内容管理、多端展示和文件存储。', outcome: '已按团队口径说明个人贡献边界，公开范围限于读者端页面截图。', role: '合作项目，双方共同参与：后端以搭档为主，前端 UI 以我为主；搭档为项目发起者，整体贡献多于我。具体模块划分未逐项记录。', projectType: '内容平台 / 多端体验', project_type: 'COLLABORATIVE', status: '已授权展示 · 贡献边界已说明', tags: ['合作', '多端', '内容管理'], image: '/assets/v5/nanyang-1.png', visualKind: 'screenshot', evidence: '3 张读者端页面截图（由项目成员提供） · 图注已按截图实况核对 · 后台管理端未提供截图', gallery: [{ src: '/assets/v5/nanyang-1.png', step: 'STEP 01 / 读者端首页', caption: '读者端新闻首页（PC）。顶部是栏目导航与登录入口，中间为校庆主题轮播，下方是内容检索入口。这是面向师生的呈现层：截图里没有管理端的表格、增删改按钮或发布状态列。' }, { src: '/assets/v5/nanyang-2.png', step: 'STEP 02 / 栏目页', caption: '「学校概况 → 学校荣誉」栏目页。左侧是栏目导航，右侧是荣誉条目卡片。地址栏显示该页运行在本地开发端口 5175，属于本机实跑截图而非设计稿。' }, { src: '/assets/v5/nanyang-3.png', step: 'STEP 03 / 分类筛选', caption: '「校园快讯」分类筛选结果页。按分类与学院筛选后以卡片列表呈现新闻摘要，并支持重置筛选。同样是 PC 读者端页面，不是移动端或小程序。' }] },
  { id: 5, slug: 'ai-translator-vue-lab', title: 'LexiFlow 练习区', repoName: 'ai-translator-vue-lab', summary: '沿用 LexiFlow 的技术栈搭的练习场：把课程知识拆成章节，在真实项目里动手改造，而不是只记 API。', background: '练习场与正式产品共用同一套技术栈，减少重复搭建的成本；但两者边界清晰，练习产物不影响正式产品。', outcome: '把课程章节继续补完，并让每章的练习结果回流到 LexiFlow。', role: '课程结构设计、练习环境搭建、章节内容编写', projectType: '练习场 / 技术试验', project_type: 'LAB', status: '持续练习中 · 内容未完整', tags: ['Vue 3', '课程章节', '练习环境'], image: '/assets/v5/lab-playground.png', visualKind: 'screenshot', evidence: '2 张真实运行截图 · 练习内容仍在补充中', gallery: [{ src: '/assets/v5/lab-playground.png', step: 'STEP 01 / 练习区', caption: '练习区首页。把学习拆成有目标的章节：先理解概念、运行示例、动手改造，再回到真实项目里找到它。当前已开课 8 个 Vue 实战章节。' }, { src: '/assets/v5/lab-home.png', step: 'STEP 02 / 可运行的载体', caption: '练习需要一个能跑起来的真实项目，而不是孤立的代码片段。练习区直接复用 LexiFlow 的词典与翻译页面作为实验载体。' }] },
]

export const projectFilters = [
  { key: 'all', label: '全部' },
  { key: 'independent', label: '独立开发' },
  { key: 'lab', label: '练习与实验' },
  { key: 'collab', label: '合作项目' },
]

export const methods = [
  ['01', '定义问题', '目标、用户、数据流和明确不做的范围。'],
  ['02', '记录取舍', '比较方案，说明选择、限制与后续代价。'],
  ['03', '多层验证', '单元、接口、浏览器和部署检查共同形成证据。'],
  ['04', '发布复盘', '保留版本、隐私边界、回滚方式和下一步。'],
]

// 机器值到筛选分类的映射。
// 必须先精确匹配再退化到子串匹配：'COLLABORATIVE' 的子串里含 'LAB'
//（COLL|AB|ORATIVE），直接用 includes('LAB') 会把合作项目误判成练习场。
const FILTER_BY_EXACT_TYPE = {
  LAB: 'lab',
  PROTOTYPE: 'prototype',
  COLLABORATIVE: 'collab',
  COLLAB: 'collab',
  INDEPENDENT: 'independent',
  SOLO: 'independent',
}

export function filterOf(machineType) {
  const type = String(machineType || '').toUpperCase()
  if (FILTER_BY_EXACT_TYPE[type]) return FILTER_BY_EXACT_TYPE[type]
  if (type.includes('COLLAB')) return 'collab'
  if (type.includes('PROTOTYPE')) return 'prototype'
  if (type.includes('LAB')) return 'lab'
  return 'independent'
}

// 把后端返回的扁平字段与前端展示字段合并。
// 分类必须取自 project_type 机器值，而不是展示文案，否则原型与合作项目会被误判为独立项目。
export function normalizeProject(project, fallback = {}) {
  const machineType = String(project.project_type || project.projectType || fallback.project_type || '').toUpperCase()
  return {
    ...fallback,
    ...project,
    projectType: project.project_type ? project.projectType : fallback.projectType,
    project_type: machineType,
    filter: filterOf(machineType),
    tags: project.tags && project.tags.length ? project.tags : fallback.tags,
    gallery: project.gallery && project.gallery.length ? project.gallery : fallback.gallery,
    visualKind: project.visualKind || fallback.visualKind,
    evidence: project.evidence || fallback.evidence,
  }
}

export function normalizeByIndex(project, index) {
  return normalizeProject(project, fallbackProjects[index % fallbackProjects.length])
}

export function galleryOf(project) {
  if (!project) return []
  if (project.gallery && project.gallery.length) return project.gallery
  return project.image ? [{ src: project.image, step: 'STEP 01 / 封面', caption: project.summary }] : []
}

export async function fetchJson(path) {
  const response = await fetch(path)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return response.json()
}

// 首页列表用的数据源：优先读取已发布内容，失败或为空时回退到内置安全数据。
export function useProjectList() {
  const projects = ref([])
  const loading = ref(true)
  const apiStatus = ref('正在连接后端…')

  async function load() {
    loading.value = true
    try {
      const response = await fetchJson('/api/public/projects')
      const published = Array.isArray(response.data) ? response.data : []
      if (published.length) {
        projects.value = published.map(normalizeByIndex)
        apiStatus.value = `后端已连接 · ${published.length} 个已发布项目来自公开 API`
      } else {
        projects.value = fallbackProjects.map(normalizeByIndex)
        apiStatus.value = '已连接后端，当前展示内容来自项目内置的已核验数据'
      }
    } catch {
      projects.value = fallbackProjects.map(normalizeByIndex)
      // 静态部署（如 Netlify）没有后端，这是预期情况而不是故障，
      // 因此说明内容来源，而不是显示"后端不可用"让人以为站点坏了。
      apiStatus.value = '静态展示 · 内容来自项目内置的已核验数据'
    } finally {
      loading.value = false
    }
  }

  return { projects, loading, apiStatus, load }
}

// 详情页用的数据源：按 slug 读取，找不到时回退到内置数据；两者都没有则判定为不存在。
export async function loadProjectBySlug(slug) {
  const local = fallbackProjects.find(item => item.slug === slug) || null
  let remote = null
  try {
    const response = await fetchJson(`/api/public/projects/${slug}`)
    remote = response.data && Object.keys(response.data).length ? response.data : null
  } catch {
    remote = null
  }
  if (!remote && !local) return null
  return normalizeProject(remote || {}, local || {})
}
