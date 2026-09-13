<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { buildTechGraph, layoutGraph } from '../data/techGraph.js'

const props = defineProps({
  projects: { type: Array, required: true },
})

const GRAPH_WIDTH = 1440
const GRAPH_HEIGHT = 580
const PROXIMITY = 110     // 鼠标离节点多近算"悬停"（比漂移半径小，避免刚靠近就被推开）
const DRIFT_RADIUS = 220  // 漂移影响半径：这个范围内的节点会绕开光标流动
const DRIFT_STRENGTH = 14 // 切向漂移的最大位移（画布单位）
const HOVER_SCALE = 1.5   // 悬停节点放大倍数
const NEIGHBOUR_SCALE = 1.14

// 数据与基准布局都是纯函数、结果确定，不会每次刷新都变——所以可以断言、可以截图比对。
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
const focusedNode = computed(() => graph.nodes.find(node => node.id === focusedId.value) || null)

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

// ── 动画层 ──────────────────────────────────────────────────────────────────
// 基准坐标（外层 <g> 的 transform 属性）永远不动，动画只写内层 <g>：
// 这样"图会不会动"与"布局是否确定"互不干扰，断言读基准坐标，不受动画影响。
const innerById = new Map()
const current = new Map()  // nodeId -> { dx, dy, scale }
const target = new Map()
let frame = null
let pointerX = null
let pointerY = null

function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && window.matchMedia
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

function ensureState() {
  for (const node of graph.nodes) {
    if (!current.has(node.id)) current.set(node.id, { dx: 0, dy: 0, scale: 1 })
    if (!target.has(node.id)) target.set(node.id, { dx: 0, dy: 0, scale: 1 })
  }
}

function writeInner(nodeId) {
  const element = innerById.get(nodeId)
  if (!element) return
  const state = current.get(nodeId)
  const moved = Math.abs(state.dx) > 0.01 || Math.abs(state.dy) > 0.01 || Math.abs(state.scale - 1) > 0.001
  element.setAttribute('transform', moved
    ? `translate(${state.dx.toFixed(2)} ${state.dy.toFixed(2)}) scale(${state.scale.toFixed(3)})`
    : '')
}

function tick() {
  ensureState()
  let unsettled = false
  for (const node of graph.nodes) {
    const now = current.get(node.id)
    const want = target.get(node.id)
    now.dx += (want.dx - now.dx) * 0.18
    now.dy += (want.dy - now.dy) * 0.18
    now.scale += (want.scale - now.scale) * 0.18
    if (Math.abs(want.dx - now.dx) > 0.05 || Math.abs(want.dy - now.dy) > 0.05 || Math.abs(want.scale - now.scale) > 0.002) {
      unsettled = true
    } else {
      now.dx = want.dx
      now.dy = want.dy
      now.scale = want.scale
    }
    writeInner(node.id)
  }
  if (unsettled || pointerX !== null) {
    frame = requestAnimationFrame(tick)
  } else {
    frame = null
  }
}

function startLoop() {
  if (frame === null) frame = requestAnimationFrame(tick)
}

function recomputeTargets() {
  ensureState()
  const focus = focusedId.value
  const neighbours = focus ? neighbourMap.value.get(focus) || new Set() : new Set()

  for (const node of graph.nodes) {
    const want = target.get(node.id)
    // 1) 悬停放大
    if (node.id === focus) want.scale = HOVER_SCALE
    else if (neighbours.has(node.id)) want.scale = NEIGHBOUR_SCALE
    else want.scale = 1

    want.dx = 0
    want.dy = 0

    if (pointerX === null || node.kind !== 'tech') continue

    const dx = node.x - pointerX
    const dy = node.y - pointerY
    const distance = Math.hypot(dx, dy)
    if (distance >= DRIFT_RADIUS || distance <= 1) continue
    const falloff = (1 - distance / DRIFT_RADIUS) ** 2

    // 2) 靠近光标的节点略微变大——强化"跟随鼠标"的纵深感
    //    悬停的那个节点不参与（它的倍数已经由上面决定，且不能变来变去）
    if (node.id !== focus) {
      want.scale = Math.max(want.scale, 1 + 0.38 * falloff)
    }

    // 3) 绕开光标流动。用**切向**而不是径向：
    //    径向会把节点推离光标，于是"想点的节点一直跑"，越靠近跑得越远（实际踩过的缺陷）。
    //    切向位移不改变节点到光标的距离，所以既有流动感，又一直点得到。
    if (node.id !== focus) {
      const push = falloff * DRIFT_STRENGTH
      want.dx = (-dy / distance) * push
      want.dy = (dx / distance) * push
    }
  }
}

function resetTargets() {
  ensureState()
  for (const want of target.values()) {
    want.dx = 0
    want.dy = 0
    want.scale = 1
  }
}

function toGraphCoords(event) {
  const rect = svgRef.value?.getBoundingClientRect()
  if (!rect || !rect.width || !rect.height) return null
  return {
    x: ((event.clientX - rect.left) / rect.width) * GRAPH_WIDTH,
    y: ((event.clientY - rect.top) / rect.height) * GRAPH_HEIGHT,
  }
}

// 整张图随鼠标倾斜，形成 3D 纵深感。角度很小（±7°/±5°）——
// 再大就会影响读坐标、也会让标签看起来歪。
const tiltX = ref(0)
const tiltY = ref(0)
const svgStyle = computed(() => {
  if (prefersReducedMotion()) return {}
  if (tiltX.value === 0 && tiltY.value === 0) return {}
  return {
    transform: `perspective(1300px) rotateX(${tiltX.value.toFixed(2)}deg) rotateY(${tiltY.value.toFixed(2)}deg)`,
  }
})

// 点的大小与填充受"深度"影响，配合倾斜读出远近
function dotRadius(node) {
  const depth = node.depth ?? 0.6
  const base = node.kind === 'project' ? 14 : (node.reuse > 1 ? 8 : 6)
  return Number((base * (0.8 + 0.42 * depth)).toFixed(2))
}
function dotFillOpacity(node) {
  const depth = node.depth ?? 0.6
  return Number((0.5 + 0.5 * depth).toFixed(2))
}

function onPointerMove(event) {
  if (prefersReducedMotion()) return
  const point = toGraphCoords(event)
  if (!point) return
  pointerX = point.x
  pointerY = point.y

  if (!lockedId.value) {
    let nearest = null
    let nearestDistance = PROXIMITY
    for (const node of graph.nodes) {
      const distance = Math.hypot(node.x - point.x, node.y - point.y)
      if (distance < nearestDistance) {
        nearestDistance = distance
        nearest = node
      }
    }
    hoverId.value = nearest ? nearest.id : null
  }
  recomputeTargets()
  // 倾斜跟随鼠标在画布中的相对位置
  tiltY.value = (point.x / GRAPH_WIDTH - 0.5) * 14
  tiltX.value = -((point.y / GRAPH_HEIGHT - 0.5) * 10)
  startLoop()
}

function onPointerLeave() {
  pointerX = null
  pointerY = null
  if (!lockedId.value) hoverId.value = null
  tiltX.value = 0
  tiltY.value = 0
  resetTargets()
  startLoop()
}

function toggleLock(nodeId) {
  lockedId.value = lockedId.value === nodeId ? null : nodeId
  recomputeTargets()
  startLoop()
}

function clearAll() {
  lockedId.value = null
  hoverId.value = null
  onPointerLeave()
}

function onNodeKeydown(event, nodeId) {
  if (event.key === 'Enter' || event.key === ' ') {
    event.preventDefault()
    toggleLock(nodeId)
  }
  if (event.key === 'Escape') clearAll()
}

onMounted(() => {
  if (!svgRef.value) return
  svgRef.value.querySelectorAll('.graph-node').forEach((group) => {
    const inner = group.querySelector('.node-inner')
    if (inner) innerById.set(group.dataset.nodeId, inner)
  })
  ensureState()
})

onBeforeUnmount(() => {
  if (frame !== null) cancelAnimationFrame(frame)
  frame = null
})

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
    <!-- 只有 SVG 突破正文栏宽；状态行与清单留在栏内，与本页其它文字左对齐。
         （之前把整块都加宽，导致图下的文字跟着跑到宽版心边界，看着没对齐。） -->
    <div class="graph-bleed">
      <svg
        ref="svgRef"
        class="graph-canvas"
        :style="svgStyle"
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
          :data-node-id="node.id"
          :class="[
            node.kind === 'project' ? 'is-project' : 'is-tech',
            node.kind === 'tech' ? `is-${node.group}` : '',
            node.kind === 'tech' && node.reuse > 1 ? 'is-shared' : '',
            { 'is-focused': node.id === focusedId, 'is-lit': litNodes && litNodes.has(node.id), 'is-dim': litNodes && !litNodes.has(node.id) },
          ]"
          tabindex="0"
          role="button"
          :aria-label="focusText(node)"
          :transform="`translate(${node.x} ${node.y})`"
          @click.stop="toggleLock(node.id)"
          @keydown="onNodeKeydown($event, node.id)"
          @focus="hoverId = node.id; recomputeTargets(); startLoop()"
          @blur="onPointerLeave"
        >
          <!-- 动画只写这一层的 transform，外层基准坐标保持不变 -->
          <g class="node-inner">
            <circle v-if="node.kind === 'tech' && node.reuse > 1" class="node-halo" :r="node.reuse > 3 ? 18 : 15" />
            <circle class="node-dot" :r="dotRadius(node)" :fill-opacity="dotFillOpacity(node)" />
            <text class="graph-label" :y="node.kind === 'project' ? -20 : -13">{{ node.kind === 'project' ? node.shortLabel : node.label }}</text>
          </g>
        </g>
      </g>
      </svg>
    </div>

    <p class="graph-status" aria-live="polite">
      <template v-if="focusedNode">{{ focusText(focusedNode) }}</template>
      <template v-else>鼠标移到节点上会放大并高亮它用在哪里；附近其它节点绕开光标流动。点击可锁定，再点空白取消</template>
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
