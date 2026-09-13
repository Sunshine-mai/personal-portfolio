<script setup>
import { computed, onMounted, ref } from 'vue'
import { methods, projectFilters, useProjectList } from '../data/projects'
import TechGraph from '../components/TechGraph.vue'
import { copyEmail } from '../composables/useToast'

const { projects, loading, apiStatus, load } = useProjectList()
const activeFilter = ref('all')

const filteredProjects = computed(() => projects.value.filter(project => activeFilter.value === 'all' || project.filter === activeFilter.value))
const independentCount = computed(() => projects.value.filter(project => project.filter === 'independent').length)

onMounted(load)
</script>

<template>
  <div>
    <section v-reveal class="hero-section" id="hero">
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
        <div class="hero-facts">
          <div><span>FOCUS</span><strong>AI 应用 / 全栈开发</strong></div>
          <div><span>PROJECTS</span><strong>{{ independentCount || 2 }} 个独立项目</strong></div>
          <div><span>STACK</span><strong>Java · Python · Vue</strong></div>
          <div><span>STATUS</span><strong class="warm">开放合作</strong></div>
        </div>
      </div>
    </section>

    <section class="content-section projects-section" id="projects">
      <div class="shell">
        <div class="section-heading" v-reveal>
          <div><p class="eyebrow">01 / REPRESENTATIVE PROJECTS</p><h2>做过的项目，<br /><em>按真实状态呈现。</em></h2></div>
          <p>不把原型写成已上线，不把团队成果写成个人战绩。每个案例都保留完成度、角色和下一步。</p>
        </div>
        <div class="filter-row" role="tablist" aria-label="项目筛选">
          <button v-for="filter in projectFilters" :key="filter.key" type="button" :class="{ active: activeFilter === filter.key }" role="tab" :aria-selected="activeFilter === filter.key" @click="activeFilter = filter.key">{{ filter.label }}</button>
        </div>
        <p v-if="loading" class="api-status">正在读取已发布内容…</p>
        <p v-else class="api-status">{{ apiStatus }}</p>
        <div class="project-list">
          <RouterLink v-for="(project, index) in filteredProjects" :key="project.slug || project.id" v-reveal="index + 1" class="project-card" :to="`/projects/${project.slug}`">
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
          <div><p class="eyebrow">02 / TECH STACK</p><h2>五个项目用到的<br /><em>全部技术。</em></h2></div>
          <p>图上的每条线都对应一个可核验的事实：某个项目用了某项技术。节点越大、越靠中心，说明它被更多项目复用。技术栈全部来自各项目的依赖清单，不列入「计划过但没用上」的技术。</p>
        </div>
        <TechGraph v-if="projects.length" :projects="projects" v-reveal="1" />
      </div>
    </section>

    <section class="content-section edit-section" id="edit-works">
      <div class="shell">
        <div class="section-heading" v-reveal>
          <div><p class="eyebrow">02 / VISUAL &amp; EDITING</p><h2>视觉和剪辑，<br /><em>真实素材整理中。</em></h2></div>
          <p>这里会放经过授权的剪辑练习与视觉实验。当前只保留方向和结构，不用虚构作品填满版面。</p>
        </div>
        <div class="holding-row" v-reveal>
          <span>EDIT 01 / MATERIAL HOLD</span>
          <div><h3>一条信息的三种节奏</h3><p>等待经授权的真实片段截图，补充片长、版本和发布链接。</p></div>
          <span class="hold-status">待补真实素材</span>
        </div>
      </div>
    </section>

    <section class="content-section method-section" id="method">
      <div class="shell">
        <div class="section-heading" v-reveal>
          <div><p class="eyebrow">03 / HOW I WORK</p><h2>从想法到可以交付，<br /><em>每一步都留下证据。</em></h2></div>
          <p>我会先定义问题和边界，再小步实现，用测试和发布记录确认结果。</p>
        </div>
        <div class="method-list">
          <article v-for="method in methods" :key="method[0]" v-reveal="Number(method[0])"><span>{{ method[0] }}</span><h3>{{ method[1] }}</h3><p>{{ method[2] }}</p></article>
        </div>
      </div>
    </section>

    <section class="content-section about-section" id="about">
      <div class="shell about-grid">
        <div v-reveal><p class="eyebrow">04 / ABOUT</p><h2>一个持续构建，<br /><em>也持续校准的人。</em></h2></div>
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
