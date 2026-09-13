<script setup>
import { computed, ref } from 'vue'
import { buildTechGraph, layoutGraph } from '../data/techGraph.js'

const props = defineProps({
  projects: { type: Array, required: true },
})

const GRAPH_WIDTH = 1000
const GRAPH_HEIGHT = 680
const PROXIMITY = 76 // 鼠标离节点多近算"靠近"，单位是 viewBox 坐标

// 数据与布局都是纯函数、结果确定：位置不会每次刷新都不一样，因此可以断言、可以截图比对。
const graph = buildTechGraph(props.projects)
const layout = layoutGraph(graph.nodes, graph.edges, {
  width: GRAPH_WIDTH,
  height: GRAPH_HEIGHT,
})

const svgRef = ref(null)
const hoverId = ref(null)
const lockedId = ref(null)

// 锁定的优先级高于悬停：点过之后移动鼠标不应改变高亮。
const focusedId = computed(() => lockedId.value ?? hoverId.value)
const focusedNode = computed(() =>
  graph.nodes.find(node => node.id === focusedId.value) || null
)

const neighbourMap = computed(() => {
  const map = new Map()
  for (const edge of graph.edges) {
    if (!map.has(edge.source)) map.set(edge.source, new Set())
    if (!map.has(edge.target)) map.set(edge.target, new Set())
    map.get(edge.source).add(edge.target)
    map.get(edge.target).add(edge.source)
  }
  return map
})

// null 表示"当前没有高亮"，此时所有节点都保持常态。
const litNodes = computed(() => {
  if (!focusedId.value) return null
  const set = new Set([focusedId.value])
  for (const other of neighbourMap.value.get(focusedId.value) || []) set.add(other)
  return set
})

const litEdges = computed(() => {
  if (!focusedId.value) return null
  const set = new Set()
  for (const edge of graph.edges) {
    if (edge.source === focusedId.value || edge.target === focusedId.value) {
      set.add(`${edge.source}|${edge.target}`)
    }
  }
  return set
})

const projectTitleBySlug = computed(() => {
  const map = new Map()
  for (const node of graph.nodes) {
    if (node.kind === 'project') map.set(node.slug, node.label)
  }
  return map
})

function focusText(node) {
  if (!node) return ''
  if (node.kind === 'project') {
    const techs = graph.edges
      .filter(edge => edge.source === node.id)
      .map(edge => graph.nodes.find(n => n.id === edge.target)?.label)
      .filter(Boolean)
    return `${node.label} 使用 ${techs.length} 项技术`
  }
  const projects = node.projects.map(slug => projectTitleBySlug.value.get(slug)).filter(Boolean)
  return `${node.label} · 用于 ${projects.join('、')}`
}

function onPointerMove(event) {
  if (lockedId.value) return
  const svg = svgRef.value
  if (!svg) return
  const rect = svg.getBoundingClientRect()
  if (!rect.width || !rect.height) return
  const x = ((event.clientX - rect.left) / rect.width) * GRAPH_WIDTH
  const y = ((event.clientY - rect.top) / rect.height) * GRAPH_HEIGHT

  let nearest = null
  let nearestDistance = PROXIMITY
  for (const node of graph.nodes) {
    const distance = Math.hypot(node.x - x, node.y - y)
    if (distance < nearestDistance) {
      nearestDistance = distance
      nearest = node
    }
  }
  hoverId.value = nearest ? nearest.id : null
}

function onPointerLeave() {
  if (!lockedId.value) hoverId.value = null
}

function toggleLock(nodeId) {
  lockedId.value = lockedId.value === nodeId ? null : nodeId
}

function clearAll() {
  lockedId.value = null
  hoverId.value = null
}

function onNodeKeydown(event, nodeId) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleLock(nodeId)
  }
  if (event.key === 'Escape') clearAll()
}

// 文字版：与图信息等价，供读屏用户与图渲染失败时使用。
const textOutline = computed(() =>
  props.projects
    .filter(project => Array.isArray(project.stack) && project.stack.length)
    .map(project => ({
      slug: project.slug,
      title: project.title,
      techs: [...new Set(project.stack.flatMap(row => row.items.flatMap(item => String(item).split('/').map(s => s.trim()).filter(Boolean))))],
    }))
)
</script>

<template>
  <div class="tech-graph">
    <svg
      ref="svgRef"
      class="graph-canvas"
      :viewBox="`0 0 ${GRAPH_WIDTH} ${GRAPH_HEIGHT}`"
      role="group"
      aria-label="技术网络图：项目与技术之间的使用关系，下方有等价的文字版清单"
      @pointermove="onPointerMove"
      @pointerleave="onPointerLeave"
      @click.self="clearAll"
    >
      <g class="graph-edges">
        <line
          v-for="edge in graph.edges"
          :key="`${edge.source}|${edge.target}`"
          class="graph-edge"
          :class="{
            'is-lit': litEdges && litEdges.has(`${edge.source}|${edge.target}`),
            'is-dim': litEdges && !litEdges.has(`${edge.source}|${edge.target}`),
          }"
          :x1="graph.nodes.find(n => n.id === edge.source)?.x"
          :y1="graph.nodes.find(n => n.id === edge.source)?.y"
          :x2="graph.nodes.find(n => n.id === edge.target)?.x"
          :y2="graph.nodes.find(n => n.id === edge.target)?.y"
        />
      </g>

      <g class="graph-nodes">
        <g
          v-for="node in graph.nodes"
          :key="node.id"
          class="graph-node"
          :class="[
            node.kind === 'project' ? 'is-project' : 'is-tech',
            node.kind === 'tech' ? `is-${node.group}` : '',
            node.kind === 'tech' && node.reuse > 1 ? 'is-shared' : '',
            { 'is-lit': litNodes && litNodes.has(node.id), 'is-dim': litNodes && !litNodes.has(node.id) },
          ]"
          tabindex="0"
          role="button"
          :aria-label="focusText(node)"
          :transform="`translate(${node.x} ${node.y})`"
          @click.stop="toggleLock(node.id)"
          @keydown="onNodeKeydown($event, node.id)"
          @focus="hoverId = node.id"
          @blur="onPointerLeave"
        >
          <circle v-if="node.kind === 'tech' && node.reuse > 1" class="node-halo" :r="node.reuse > 3 ? 13 : 11" />
          <circle class="node-dot" :r="node.kind === 'project' ? 9 : (node.reuse > 1 ? 5.5 : 4)" />
          <text class="graph-label" :y="node.kind === 'project' ? -16 : -10">{{ node.kind === 'project' ? node.shortLabel : node.label }}</text>
        </g>
      </g>
    </svg>

    <p class="graph-status" aria-live="polite">
      <template v-if="focusedNode">{{ focusText(focusedNode) }}</template>
      <template v-else>鼠标移到节点上看它用在哪里；点击可锁定，再点空白取消</template>
    </p>

    <details class="graph-outline">
      <summary>文字版清单（与上图等价）</summary>
      <div v-for="group in textOutline" :key="group.slug" class="outline-group">
        <h3>{{ group.title }}</h3>
        <p>{{ group.techs.join(' · ') }}</p>
      </div>
    </details>
  </div>
</template>
