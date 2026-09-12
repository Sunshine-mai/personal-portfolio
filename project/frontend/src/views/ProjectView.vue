<script setup>
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { fallbackProjects, galleryOf, loadProjectBySlug } from '../data/projects'

const route = useRoute()
const project = ref(null)
const status = ref('loading')
const galleryIndex = ref(0)

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
      <section class="detail-hero">
        <div class="shell">
          <RouterLink class="detail-back" to="/">← 返回代表项目</RouterLink>
          <div class="detail-hero-grid">
            <div>
              <p class="eyebrow">{{ projectNumber }} / {{ project.projectType }}</p>
              <h1>{{ project.title }}</h1>
              <p class="detail-lead">{{ project.summary }}</p>
              <div class="tag-list detail-tags">
                <span v-for="tag in project.tags" :key="tag">{{ tag }}</span>
              </div>
            </div>
            <dl class="detail-facts">
              <div><dt>状态</dt><dd>{{ project.status || project.outcome }}</dd></div>
              <div><dt>我的角色</dt><dd>{{ project.role }}</dd></div>
            </dl>
          </div>
        </div>
      </section>

      <section class="content-section detail-body">
        <div class="shell detail-grid">
          <div class="detail-main">
            <h2 class="detail-heading">过程证据</h2>
            <p class="detail-note">按顺序看这里的设计与实现结果。每一张都是项目实际运行的截图，不是设计稿。</p>

            <div v-if="currentSlide" class="gallery">
              <figure class="gallery-stage">
                <img :src="currentSlide.src" :alt="`${project.title} ${currentSlide.step}`" />
              </figure>
              <div class="gallery-bar">
                <button type="button" :disabled="slides.length < 2" aria-label="上一张截图" @click="galleryPrev">←</button>
                <span>{{ galleryIndex + 1 }} / {{ slides.length }}</span>
                <button type="button" :disabled="slides.length < 2" aria-label="下一张截图" @click="galleryNext">→</button>
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
              <p class="gallery-hint">← → 切换截图</p>
              <p v-if="project.evidence" class="gallery-evidence">证据状态：{{ project.evidence }}</p>
            </div>
          </div>

          <aside class="detail-aside">
            <div class="detail-card">
              <h3>问题与边界</h3>
              <p>{{ project.background }}</p>
            </div>
            <div class="detail-card">
              <h3>下一步</h3>
              <p>{{ project.outcome }}</p>
            </div>
          </aside>
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
