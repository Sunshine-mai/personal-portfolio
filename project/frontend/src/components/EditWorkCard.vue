<script setup>
// 剪辑作品卡片。首页（最新 6 条）与作品全集页共用同一个组件，
// 避免两处各写一份卡片标记——两处各写一份必然漂移。
//
// 播放器**点击才挂载**：那是三方 iframe。全部预先渲染的话，
// 访客一进页面就要为 19 个 iframe 付出下载、内存和隐私代价，
// 而其中绝大多数他根本不会看。不点 = 零加载。
//
// 封面是本地文件（public/assets/edit-works/），但 onerror 兜底仍然保留：
// 文件也可能缺失，缺了要显示占位，不能留一个裂图在作品集上。
import { ref } from 'vue'

defineProps({
  work: { type: Object, required: true },
  playing: { type: Boolean, default: false },
})
defineEmits(['play'])

const coverBroken = ref(false)
</script>

<template>
  <article class="edit-card">
    <div class="edit-stage">
      <iframe
        v-if="playing"
        class="edit-player"
        :src="`${work.embed}&danmaku=0&high_quality=1`"
        :title="`播放《${work.title}》`"
        scrolling="no"
        frameborder="no"
        framespacing="0"
        allowfullscreen="true"
      ></iframe>
      <template v-else>
        <img
          v-if="!coverBroken"
          class="edit-cover"
          :src="work.cover"
          :alt="`《${work.title}》封面`"
          loading="lazy"
          @error="coverBroken = true"
        />
        <span v-else class="edit-cover-fallback" aria-hidden="true">{{ work.title.slice(0, 1) }}</span>
        <button
          type="button"
          class="edit-play"
          :aria-label="`播放《${work.title}》`"
          @click="$emit('play')"
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
</template>
