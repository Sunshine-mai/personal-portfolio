<script setup>
// 作品全集页。首页只放最新几条——首页的职责是"让人快速判断你做什么"，
// 不是作品仓库；19 条全放首页会把后面的工程方法和关于我压到很下面。
// 这里才是仓库，空间也够用。
import { computed, ref } from 'vue'
import { editWorks } from '../data/editWorks'
import EditWorkCard from '../components/EditWorkCard.vue'

// 一次只播一个：点另一条时，上一条的 iframe 会被卸载。
const playingBvid = ref(null)

const totalMinutes = computed(() => {
  const seconds = editWorks.reduce((sum, work) => {
    const [m, s] = work.duration.split(':').map(Number)
    return sum + m * 60 + s
  }, 0)
  return Math.round(seconds / 60)
})
</script>

<template>
  <div class="edit-page">
    <section v-reveal class="detail-hero">
      <div class="shell">
        <RouterLink class="detail-back" to="/">← 返回作品集</RouterLink>
        <div class="detail-hero-grid">
          <div>
            <div class="detail-hero-title">
              <p class="eyebrow">{{ String(editWorks.length).padStart(2, '0') }}</p>
              <h1>剪辑作品</h1>
            </div>
            <p class="detail-lead">
              全部是已发布的作品，按发布时间倒序。标题、时长与日期由脚本从平台接口读取，
              封面对应平台封面并已本地化。视频由平台托管播放，本站不存视频文件。
            </p>
          </div>
          <dl class="detail-facts">
            <div><dt>数量</dt><dd>{{ editWorks.length }} 条</dd></div>
            <div><dt>总时长</dt><dd>约 {{ totalMinutes }} 分钟</dd></div>
            <div><dt>发布平台</dt><dd>哔哩哔哩</dd></div>
            <div><dt>播放方式</dt><dd>点击封面在站内播放</dd></div>
          </dl>
        </div>
      </div>
    </section>

    <section class="content-section detail-body">
      <div class="shell">
        <div class="edit-grid">
          <EditWorkCard
            v-for="(work, index) in editWorks"
            :key="work.bvid"
            :work="work"
            :playing="playingBvid === work.bvid"
            v-reveal="Math.min(index + 1, 6)"
            @play="playingBvid = work.bvid"
          />
        </div>
      </div>
    </section>

    <nav class="content-section detail-pager" aria-label="返回导航">
      <div class="shell pager-grid">
        <RouterLink class="pager-link" to="/">
          <span>← 返回</span><strong>代表项目</strong>
        </RouterLink>
        <RouterLink class="pager-link is-next" to="/">
          <span>首页 →</span><strong>回到开头</strong>
        </RouterLink>
      </div>
    </nav>
  </div>
</template>
