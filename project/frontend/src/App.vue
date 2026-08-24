<script setup>
import { ref } from 'vue'

const health = ref('未检查')

async function checkHealth() {
  health.value = '检查中...'
  try {
    const response = await fetch('/api/health')
    health.value = response.ok ? '后端已连接' : '后端响应异常'
  } catch {
    health.value = '后端未启动'
  }
}
</script>

<template>
  <main class="shell">
    <header class="topbar">
      <div class="brand"><span class="mark">C5</span><span>个人作品集</span></div>
      <span class="status">设计已确认 · 基础开发中</span>
    </header>
    <section class="hero">
      <p class="eyebrow">Software development / AI applications</p>
      <h1>我做过什么，<br />这里有完整记录。</h1>
      <p class="lead">这是个人作品集平台的第一条业务纵向切片。后续会加入项目、知识网络、学习摘要和发布审查。</p>
      <div class="actions">
        <button class="primary" type="button" @click="checkHealth">检查后端</button>
        <span class="health">{{ health }}</span>
      </div>
    </section>
    <section class="cards">
      <article><span>01</span><h2>项目展示</h2><p>展示三个真实项目的背景、贡献、技术栈和验证结果。</p></article>
      <article><span>02</span><h2>知识网络</h2><p>把 Java、Python、RAG、FastAPI 和项目实践建立关联。</p></article>
      <article><span>03</span><h2>交付记录</h2><p>保留版本、审查、测试、发布和复盘过程。</p></article>
    </section>
  </main>
</template>
