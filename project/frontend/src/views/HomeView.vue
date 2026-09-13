<script setup>
import { computed, onMounted, ref } from 'vue'
import { methods, projectFilters, useProjectList } from '../data/projects'
import TechGraph from '../components/TechGraph.vue'
import { copyEmail } from '../composables/useToast'
import { useHeroAmbience } from '../composables/useHeroAmbience'
import { editWorks } from '../data/editWorks'

const { projects, loading, apiStatus, load } = useProjectList()
const activeFilter = ref('all')

// 剪辑作品：正在站内播放的那一条，以及封面外链已失效的那几条。
// brokenCovers 用**重新赋值**而不是 push：ref 里的数组原地改不会触发更新。
const playingBvid = ref(null)
const brokenCovers = ref([])
function markCoverBroken(bvid) {
  if (!brokenCovers.value.includes(bvid)) brokenCovers.value = [...brokenCovers.value, bvid]
}

const filteredProjects = computed(() => projects.value.filter(project => activeFilter.value === 'all' || project.filter === activeFilter.value))
const independentCount = computed(() => projects.value.filter(project => project.filter === 'independent').length)

// 首屏索引里被悬停/聚焦的那一行。
const activeSlug = ref(null)

// 首屏指针氛围层（光斑 + 网格视差 + 内容层反向视差）。
// 逻辑放在 composable 里，二级页面首屏用同一份——两处各写一份，约定必然漂移。
const { rootRef: heroRef, glowRef, onPointerMove, onPointerLeave } = useHeroAmbience()

// 每层只取首项：一层的完整标签塞不进这一列，而"这一层主要用什么"才是扫读时要的。
// 取的是真实依赖清单里的原值，不做任何改写。
function stackTags(project) {
  const rows = Array.isArray(project.stack) ? project.stack : []
  return rows.slice(0, 6).map(row => String(row.items?.[0] || '').split('/')[0].trim()).filter(Boolean)
}

onMounted(load)
</script>

<template>
  <div>
    <section
      id="hero"
      ref="heroRef"
      v-reveal
      class="hero-section"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
    >
      <!-- 氛围层：网格 + 跟随指针的光斑。纯装饰，对读屏隐藏；
           两者都只写自己的 transform，基准布局与底图不动。 -->
      <div class="hero-layers" aria-hidden="true">
        <span class="hero-grid-lines"></span>
        <span ref="glowRef" class="hero-glow"></span>
      </div>

      <div class="shell hero-grid">
        <div class="hero-copy-block">
          <p class="eyebrow">SOFTWARE DEVELOPMENT / AI APPLICATIONS</p>
          <h1>把复杂的问题，<br /><em>做成可以使用的产品。</em></h1>
          <p class="hero-copy">这里记录我做过的产品、技术选择和验证过程。先看结果，再往下看我怎么定义、实现和交付。</p>
          <div class="hero-actions">
            <RouterLink class="button primary" :to="{ path: '/', hash: '#projects' }">查看代表项目 <span>↗</span></RouterLink>
            <RouterLink class="text-link" :to="{ path: '/', hash: '#method' }">了解我的工作方式</RouterLink>
          </div>
        </div>

        <!-- 右列原先是 4 条静态事实，405px 的宽度里靠 space-between 拉到两端，中间是空的。
             换成 5 个真实项目的索引：这一列既是内容也是导航，悬停展开该项目真实的技术分层首项。 -->
        <nav class="hero-index" aria-label="代表项目索引" @pointerleave="activeSlug = null">
          <RouterLink
            v-for="(project, index) in projects"
            :key="project.slug || project.id"
            class="hero-index-row"
            :class="{ 'is-active': activeSlug === project.slug }"
            :data-slug="project.slug"
            :to="{ path: '/', hash: `#project-${project.slug}` }"
            @pointerenter="activeSlug = project.slug"
            @focus="activeSlug = project.slug"
            @blur="activeSlug = null"
            @click="activeFilter = 'all'"
          >
            <span class="hero-index-no">0{{ index + 1 }}</span>
            <span class="hero-index-name">{{ project.title }}</span>
            <span class="hero-index-type">{{ project.projectType }}</span>
            <span class="hero-index-stack"><span v-for="tag in stackTags(project)" :key="tag">{{ tag }}</span></span>
          </RouterLink>
        </nav>
      </div>

      <!-- 首屏原本没有任何"下面还有内容"的提示。右侧两个数字都是实计数。 -->
      <div class="hero-foot">
        <div class="shell hero-foot-inner">
          <span class="hero-foot-scroll"><i></i>SCROLL ↓</span>
          <span class="hero-foot-count">{{ projects.length }} 个项目 · {{ independentCount }} 个独立项目</span>
        </div>
      </div>
    </section>

    <section class="content-section projects-section" id="projects">
      <div class="shell">
        <div class="section-heading" v-reveal>
          <span class="eyebrow">01</span><h2>做过的项目，<br /><em>按真实状态呈现。</em></h2>
          <p>不把原型写成已上线，不把团队成果写成个人战绩。每个案例都保留完成度、角色和下一步。</p>
        </div>
        <div class="filter-row" role="tablist" aria-label="项目筛选">
          <button v-for="filter in projectFilters" :key="filter.key" type="button" :class="{ active: activeFilter === filter.key }" role="tab" :aria-selected="activeFilter === filter.key" @click="activeFilter = filter.key">{{ filter.label }}</button>
        </div>
        <p v-if="loading" class="api-status">正在读取已发布内容…</p>
        <p v-else class="api-status">{{ apiStatus }}</p>
        <div class="project-list">
          <RouterLink v-for="(project, index) in filteredProjects" :key="project.slug || project.id" :id="`project-${project.slug}`" v-reveal="index + 1" class="project-card" :to="`/projects/${project.slug}`">
            <div class="project-card-body">
              <span class="project-index">0{{ index + 1 }} / PROJECT</span>
              <span class="project-meta">{{ project.projectType }}</span>
              <h3>{{ project.title }}</h3>
              <p>{{ project.summary }}</p>
              <div class="tag-list"><span v-for="tag in project.tags" :key="tag">{{ tag }}</span></div>
              <span class="card-link">查看案例 <span>↗</span></span>
            </div>
            <div class="project-visual" :class="{ 'has-image': project.image }" :style="project.image ? { backgroundImage: `url(${project.image})` } : {}">
              <span v-if="!project.image">VISUAL<br />EVIDENCE</span>
              <span v-else class="visual-label">{{ project.visualKind === 'layout' ? '设计版式' : '公开截图' }}</span>
            </div>
          </RouterLink>
          <p v-if="!filteredProjects.length" class="project-empty">这个分类下暂时没有项目。不为了填满版面而放没有完成度的内容。</p>
        </div>
      </div>
    </section>

    <section class="content-section stack-section" id="stack">
      <div class="shell">
        <div class="section-heading" v-reveal>
          <span class="eyebrow">02</span><h2>五个项目用到的<br /><em>全部技术。</em></h2>
          <p>图上的每条线都对应一个可核验的事实：某个项目用了某项技术。节点越大、越靠中心，说明它被更多项目复用。技术栈全部来自各项目的依赖清单，不列入「计划过但没用上」的技术。</p>
        </div>
        <!-- 突破版心的范围由组件内部控制：只有 SVG 更宽，
             状态行与文字版清单留在正文栏内，与本节标题左对齐。 -->
        <TechGraph v-if="projects.length" :projects="projects" v-reveal="1" />
      </div>
    </section>

    <section class="content-section edit-section" id="edit-works">
      <div class="shell">
        <div class="section-heading" v-reveal>
          <span class="eyebrow">03</span><h2>视觉和剪辑，<br /><em>作品都在这里。</em></h2>
          <p>全部是已发布的作品，标题、时长与发布日期由脚本从平台接口读取，不手抄。视频由平台托管播放，站点不存视频文件。点击封面播放。</p>
        </div>

        <!-- 封面外链 + 点击才挂载播放器。
             不预先渲染 iframe：那是三方播放器，4 个一起挂会拖慢首屏，
             也会在访客没点开之前就把他交给对方的脚本。点开才加载，是一次明确的选择。 -->
        <div class="edit-grid">
          <article
            v-for="(work, index) in editWorks"
            :key="work.bvid"
            class="edit-card"
            v-reveal="index + 1"
          >
            <div class="edit-stage">
              <iframe
                v-if="playingBvid === work.bvid"
                class="edit-player"
                :src="`${work.embed}&danmaku=0&high_quality=1`"
                :title="`播放《${work.title}》`"
                scrolling="no"
                frameborder="no"
                framespacing="0"
                allowfullscreen="true"
              ></iframe>
              <template v-else>
                <!-- 封面已本地化到 public/assets/edit-works/，所以不再需要
                     referrerpolicy="no-referrer"——那条是专门给 B 站图床的防盗链用的
                     （实测带外站 Referer 返回 403）。
                     onerror 兜底保留：本地文件也可能缺失，缺了就显示占位而不是裂图。 -->
                <img
                  v-if="!brokenCovers.includes(work.bvid)"
                  class="edit-cover"
                  :src="work.cover"
                  :alt="`《${work.title}》封面`"
                  loading="lazy"
                  @error="markCoverBroken(work.bvid)"
                />
                <!-- 外链会静默腐烂。挂了就显示占位，而不是留一个裂图在作品集上。 -->
                <span v-else class="edit-cover-fallback" aria-hidden="true">{{ work.title.slice(0, 1) }}</span>
                <button
                  type="button"
                  class="edit-play"
                  :aria-label="`播放《${work.title}》`"
                  @click="playingBvid = work.bvid"
                >
                  <span class="edit-play-icon" aria-hidden="true">▶</span>
                  <span>{{ work.duration }}</span>
                </button>
              </template>
            </div>
            <h3>{{ work.title }}</h3>
            <p class="edit-meta">
              {{ work.publishedAt }}
              <a :href="work.url" target="_blank" rel="noopener noreferrer">哔哩哔哩 ↗</a>
            </p>
          </article>
          <p v-if="!editWorks.length" class="project-empty">暂时没有已发布的作品。</p>
        </div>
      </div>
    </section>

    <section class="content-section method-section" id="method">
      <div class="shell">
        <div class="section-heading" v-reveal>
          <span class="eyebrow">04</span><h2>从想法到可以交付，<br /><em>每一步都留下证据。</em></h2>
          <p>我会先定义问题和边界，再小步实现，用测试和发布记录确认结果。</p>
        </div>
        <div class="method-list">
          <article v-for="method in methods" :key="method[0]" v-reveal="Number(method[0])"><span>{{ method[0] }}</span><h3>{{ method[1] }}</h3><p>{{ method[2] }}</p></article>
        </div>
      </div>
    </section>

    <section class="content-section about-section" id="about">
      <div class="shell about-grid">
        <div class="about-title" v-reveal><span class="eyebrow">05</span><h2>一个持续构建，<br /><em>也持续校准的人。</em></h2></div>
        <div class="about-copy" v-reveal="1">
          <p>我在产品、代码和内容之间工作。喜欢把模糊的问题拆成清晰的界面，也喜欢把一次交付里的判断，沉淀成下一次可以复用的方法。</p>
          <dl>
            <div><dt>BASE</dt><dd>中国 · 远程协作</dd></div>
            <div><dt>FOCUS</dt><dd>AI / 产品体验 / 内容</dd></div>
            <div><dt>STACK</dt><dd>Java · Python · Vue</dd></div>
          </dl>
          <button class="button primary" type="button" @click="copyEmail">联系我 <span>↗</span></button>
        </div>
      </div>
    </section>
  </div>
</template>
