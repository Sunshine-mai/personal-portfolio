<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fallbackProjects, galleryOf, loadProjectBySlug } from '../data/projects'
import { useHeroAmbience } from '../composables/useHeroAmbience'

const route = useRoute()
const project = ref(null)
const status = ref('loading')
const galleryIndex = ref(0)
const zoomed = ref(false)

// 展示框高度由 CSS 固定（clamp(380px,50vh,600px)），
// 早先试过让框跟着截图比例撑开，那样换图时高度一直在变、下方内容跟着跳，已否。
// 固定高度下要整张图可见就只能居中并留白；留白是页面背景（框不画边框也不给底色），
// 所以看上去是呼吸空间而不是"空着的格子"。
//
// 二级页面首屏与首页同一套氛围层，共用同一份逻辑（见 composable 里的说明）。
const { rootRef: heroRef, glowRef, onPointerMove, onPointerLeave } = useHeroAmbience()

const slides = computed(() => galleryOf(project.value))
const currentSlide = computed(() => slides.value[galleryIndex.value] || null)
const orderedSlugs = fallbackProjects.map(item => item.slug)
const currentIndex = computed(() => orderedSlugs.indexOf(project.value?.slug || ''))
const previousProject = computed(() => (currentIndex.value > 0 ? fallbackProjects[currentIndex.value - 1] : null))
const nextProject = computed(() => (currentIndex.value >= 0 && currentIndex.value < fallbackProjects.length - 1 ? fallbackProjects[currentIndex.value + 1] : null))
const projectNumber = computed(() => (currentIndex.value >= 0 ? String(currentIndex.value + 1).padStart(2, '0') : '00'))

async function load(slug) {
  status.value = 'loading'
  galleryIndex.value = 0
  const found = await loadProjectBySlug(slug)
  if (found) {
    project.value = found
    status.value = 'ready'
  } else {
    project.value = null
    status.value = 'missing'
  }
}

function galleryPrev() {
  const total = slides.value.length
  if (total < 2) return
  galleryIndex.value = (galleryIndex.value - 1 + total) % total
}
function galleryNext() {
  const total = slides.value.length
  if (total < 2) return
  galleryIndex.value = (galleryIndex.value + 1) % total
}
function onKeydown(event) {
  if (event.key === 'Escape' && zoomed.value) {
    zoomed.value = false
    return
  }
  if (event.key === 'ArrowLeft') galleryPrev()
  if (event.key === 'ArrowRight') galleryNext()
}

onMounted(() => {
  load(route.params.slug)
  window.addEventListener('keydown', onKeydown)
})
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
watch(() => route.params.slug, slug => { if (slug) load(slug) })
</script>

<template>
  <div class="detail-page">
    <div v-if="status === 'loading'" class="shell detail-loading">正在读取项目资料…</div>

    <div v-else-if="status === 'missing'" class="shell detail-loading">
      <p class="eyebrow">404 / NOT FOUND</p>
      <h1>没有找到这个项目</h1>
      <p class="detail-lead">链接可能已过期，或者这个项目还没有公开。</p>
      <RouterLink class="button primary" to="/">返回作品集 <span>↗</span></RouterLink>
    </div>

    <template v-else>
      <section
        v-reveal
        class="detail-hero"
        ref="heroRef"
        @pointermove="onPointerMove"
        @pointerleave="onPointerLeave"
      >
        <!-- 氛围层：网格 + 跟随指针的光斑，与首页同一份逻辑、同一套克制程度。
             纯装饰，对读屏隐藏；两者都只写自己的 transform。 -->
        <div class="hero-layers" aria-hidden="true">
          <span class="hero-grid-lines"></span>
          <span ref="glowRef" class="hero-glow"></span>
        </div>
        <div class="shell">
          <RouterLink class="detail-back" to="/">← 返回代表项目</RouterLink>
          <div class="detail-hero-grid">
            <div>
              <!-- 编号与标题并排，和首页五个分节同一规则：
                   编号压在标题上方时，读者要多扫一行才知道自己在第几个案例。 -->
              <div class="detail-hero-title">
                <p class="eyebrow">{{ projectNumber }}</p>
                <h1>{{ project.title }}</h1>
              </div>
              <p class="detail-lead">{{ project.summary }}</p>
              <div class="tag-list detail-tags">
                <span v-for="tag in project.tags" :key="tag">{{ tag }}</span>
              </div>
            </div>
            <dl class="detail-facts">
              <div><dt>状态</dt><dd>{{ project.status || project.outcome }}</dd></div>
              <div><dt>类型</dt><dd>{{ project.projectType }}</dd></div>
              <div><dt>我的角色</dt><dd>{{ project.role }}</dd></div>
              <div v-if="project.repoName"><dt>仓库名</dt><dd>{{ project.repoName }}</dd></div>
              <div v-if="project.evidence" class="fact-evidence"><dt>证据</dt><dd>{{ project.evidence }}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section class="content-section detail-body">
        <!-- 页内跳转。这一页最高的（Folio）约 2600px，此前没有任何锚点，想看技术栈只能一路滚。
             条目按实际存在的小节渲染：只有 LexiFlow 与 Folio 有「项目结构」，
             知衡／大学新闻网／练习区没有。
             用 RouterLink 而不是原生 <a href="#...">：走路由的滚动逻辑，
             与首页五个锚点共用同一套落位计算（offsetTop，不受 v-reveal 入场位移影响）。 -->
        <nav class="shell detail-toc" aria-label="本页小节">
          <RouterLink :to="{ path: route.path, hash: '#detail-evidence' }">过程证据</RouterLink>
          <RouterLink :to="{ path: route.path, hash: '#detail-progress' }">进度与下一步</RouterLink>
          <RouterLink v-if="project.stack" :to="{ path: route.path, hash: '#detail-stack' }">技术栈</RouterLink>
          <RouterLink v-if="project.structure" :to="{ path: route.path, hash: '#detail-structure' }">项目结构</RouterLink>
        </nav>
        <div class="shell detail-grid">
          <div class="detail-main" id="detail-evidence" v-reveal>
            <h2 class="detail-heading">过程证据</h2>
            <p class="detail-note">按顺序看这里的设计与实现结果。每一张都是项目实际运行的截图，不是设计稿。</p>

            <div v-if="currentSlide" class="gallery">
              <div class="gallery-frame">
                <button type="button" class="gallery-nav is-prev" :disabled="slides.length < 2" aria-label="上一张截图" @click="galleryPrev">←</button>
                <figure
                  class="gallery-stage"
                  role="button"
                  tabindex="0"
                  aria-label="点击放大查看截图"
                  @click="zoomed = true"
                  @keydown.enter.prevent="zoomed = true"
                  @keydown.space.prevent="zoomed = true"
                >
                  <!-- 交叉淡入，不是硬切。两张图同时在场靠绝对定位叠着，由透明度交接；
                       不要改成 mode="out-in"——那会在中间闪一下空白。 -->
                  <Transition name="gallery-fade">
                    <img :key="currentSlide.src" :src="currentSlide.src" :alt="`${project.title} ${currentSlide.step}`" />
                  </Transition>
                  <span class="gallery-zoom">点击放大</span>
                </figure>
                <button type="button" class="gallery-nav is-next" :disabled="slides.length < 2" aria-label="下一张截图" @click="galleryNext">→</button>
              </div>
              <div class="gallery-bar">
                <span>{{ galleryIndex + 1 }} / {{ slides.length }}</span>
              </div>
              <div class="gallery-copy">
                <p class="gallery-step">
                  {{ currentSlide.step }}
                  <span v-if="project.visualKind === 'layout'" class="gallery-kind">设计版式 · 非截图</span>
                </p>
                <p class="gallery-caption">{{ currentSlide.caption }}</p>
              </div>
              <div v-if="slides.length > 1" class="gallery-thumbs" role="tablist" aria-label="案例截图列表">
                <button
                  v-for="(slide, index) in slides"
                  :key="slide.src"
                  type="button"
                  role="tab"
                  :class="{ active: index === galleryIndex }"
                  :aria-selected="index === galleryIndex"
                  :aria-label="`查看第 ${index + 1} 张截图`"
                  @click="galleryIndex = index"
                >
                  <img :src="slide.src" alt="" />
                </button>
              </div>
            </div>

            <div v-if="zoomed && currentSlide" class="lightbox" role="dialog" aria-modal="true" aria-label="放大查看截图" @click.self="zoomed = false">
              <button type="button" class="lightbox-close" aria-label="关闭放大" @click="zoomed = false">×</button>
              <button type="button" class="gallery-nav is-prev" :disabled="slides.length < 2" aria-label="上一张截图" @click.stop="galleryPrev">←</button>
                            <div class="lightbox-stage">
                <!-- 与图组同一套交叉淡入。灯箱里换图此前是硬切，而放大看图恰恰是最需要连贯的操作。 -->
                <Transition name="gallery-fade">
                  <img :key="currentSlide.src" :src="currentSlide.src" :alt="`${project.title} ${currentSlide.step}`" />
                </Transition>
              </div>
              <button type="button" class="gallery-nav is-next" :disabled="slides.length < 2" aria-label="下一张截图" @click.stop="galleryNext">→</button>
              <p class="lightbox-caption"><strong>{{ currentSlide.step }}</strong>{{ currentSlide.caption }}</p>
            </div>
          </div>

          <aside class="detail-aside" id="detail-progress" v-reveal="1">
            <!-- 「它是怎么构成的」已删除：它引用的 background 与首屏 summary 语义重叠
                 （知衡的 summary 说"三角色…闭环"，background 说"连接管理员、老师和学生"），
                 同一页把同一件事说两遍。留下的这一张在知衡与练习区带着首屏没有的信息
                 （"未压测、未部署"、"让练习结果回流到词流"）。 -->
            <div class="detail-card">
              <h3>进度与下一步</h3>
              <p>{{ project.outcome }}</p>
            </div>
          </aside>
        </div>
      </section>

      <!-- 顺序：先看结果（截图），再看解释（技术栈与代码结构）。
           技术栈放在截图前面会让读者先消化一堆技术名词才看到产品，逻辑是反的。 -->
      <section v-if="project.stack || project.structure" class="content-section detail-anatomy">
        <div class="shell">
          <div v-if="project.stack" class="anatomy-block" id="detail-stack">
            <h2 class="detail-heading">技术栈</h2>
            <p class="detail-note">按一次请求经过的顺序排列，箭头表示调用方向。</p>
            <div class="stack-list">
              <div v-for="row in project.stack" :key="row.layer" class="stack-row">
                <span class="stack-layer">{{ row.layer }}</span>
                <span class="stack-items">
                  <span v-for="item in row.items" :key="item" class="stack-item">{{ item }}</span>
                </span>
                <span v-if="row.note" class="stack-note">{{ row.note }}</span>
              </div>
            </div>
          </div>

          <div v-if="project.structure" class="anatomy-block" id="detail-structure">
            <h2 class="detail-heading">项目结构</h2>
            <p class="detail-note">只展示有代表性的层级，用来说明代码如何组织，不是完整目录。</p>
            <div class="tree-card">
              <p class="tree-root">{{ project.structure.root }}</p>
              <ul class="tree-list">
                <li
                  v-for="node in project.structure.nodes"
                  :key="`${node.depth}-${node.name}`"
                  :style="{ paddingLeft: `${node.depth * 22 + 6}px` }"
                >
                  <span class="tree-name">{{ node.name }}</span>
                  <span v-if="node.note" class="tree-note">{{ node.note }}</span>
                </li>
              </ul>
              <p class="tree-legend">{{ project.structure.note }}</p>
            </div>
          </div>
        </div>
      </section>

      <nav class="content-section detail-pager" aria-label="项目导航">
        <div class="shell pager-grid">
          <RouterLink v-if="previousProject" class="pager-link" :to="`/projects/${previousProject.slug}`">
            <span>← 上一个</span><strong>{{ previousProject.title }}</strong>
          </RouterLink>
          <span v-else class="pager-link is-empty"><span>已经是第一个</span></span>
          <RouterLink v-if="nextProject" class="pager-link is-next" :to="`/projects/${nextProject.slug}`">
            <span>下一个 →</span><strong>{{ nextProject.title }}</strong>
          </RouterLink>
          <span v-else class="pager-link is-next is-empty"><span>已经是最后一个</span></span>
        </div>
      </nav>
    </template>
  </div>
</template>
