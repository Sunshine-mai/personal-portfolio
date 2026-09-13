// 首页技术网络图的数据与布局。纯函数，不依赖 DOM，方便单独验证。
//
// 设计依据见 doc/26-tech-graph-design.md。两条关键决定写在这里备查：
//
// 1. 用二部图（项目 ↔ 技术），不画"技术↔技术"的线。
//    两个技术同现于一个项目就连线，会变成给每个项目生成一个完全图：
//    5 个项目约 225 条边、密度约 29%，必然成为毛线球。二部图约 65 条边、密度约 8%。
//    而且二部图的每条边都是可直接核验的事实（"Folio 用了 MySQL"），
//    不是推断（"MySQL 和 Redis 相关"）——后者容易变成夸大的暗示。
//
// 2. 数据从各案例的 stack 派生，不单独维护一份图数据。
//    这样不存在"图里的数据和案例里的数据不一致"，加一个案例图就自动更新。

// 把项目里众多的层名归并成四类，只用于配色。
function layerGroup(layer) {
  if (/前端|移动|小程序/.test(layer)) return 'frontend'
  if (/后端|检索|模型/.test(layer)) return 'backend'
  if (/数据|存储/.test(layer)) return 'data'
  if (/运行/.test(layer)) return 'runtime'
  return 'other'
}

// 由 id 派生一个稳定的 0~1 数值，用作"深度"。
// 用哈希而不是随机数：深度每次构建必须相同，否则节点大小会变，
// 依赖几何的断言（标签不重叠、坐标在界内）就不再可靠。
function hash01(text) {
  let hash = 2166136261
  for (let index = 0; index < text.length; index += 1) {
    hash ^= text.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return ((hash >>> 0) % 1000) / 1000
}

// 一个技术项里可能写着两个技术（如 "SQLite / PostgreSQL"），拆开分别建节点。
// 不拆分会让同一类技术出现两个名字不同的节点，图上看不出它们是同类。
function splitItems(item) {
  return String(item)
    .split('/')
    .map(part => part.trim())
    .filter(Boolean)
}

/**
 * 从案例列表派生图数据。
 * @returns {{ nodes: Array, edges: Array }}
 */
export function buildTechGraph(projects) {
  const usable = projects.filter(p => Array.isArray(p.stack) && p.stack.length)
  const nodes = []
  const edges = []

  const techByLabel = new Map()

  for (const project of usable) {
    const projectId = `project:${project.slug}`
    nodes.push({
      id: projectId,
      kind: 'project',
      label: project.title,
      // 图上空间有限，长标题（如"高中个性化教学平台 · 知衡"）会溢出画布。
      // 图里用短名，完整名称出现在 aria-label 与文字版清单里。
      shortLabel: project.title.split(' · ')[0],
      slug: project.slug,
    })

    for (const row of project.stack) {
      for (const rawItem of row.items) {
        for (const label of splitItems(rawItem)) {
          let tech = techByLabel.get(label)
          if (!tech) {
            tech = { id: `tech:${label}`, kind: 'tech', label, projects: [], groups: new Set() }
            techByLabel.set(label, tech)
            nodes.push(tech)
          }
          if (!tech.projects.includes(project.slug)) tech.projects.push(project.slug)
          tech.groups.add(layerGroup(row.layer))
          edges.push({ source: projectId, target: tech.id })
        }
      }
    }
  }

  for (const tech of techByLabel.values()) {
    // 一个技术可能同时属于多个层（不同项目把它归在不同层）时，取第一个，保证结果稳定。
    tech.group = [...tech.groups][0]
    tech.reuse = tech.projects.length
    delete tech.groups
  }

  // 深度：用于点径与填充透明度，配合容器倾斜形成 3D 纵深感。
  // 项目节点固定在"最前"，它们是骨架，不该显得比技术节点远。
  for (const node of nodes) {
    node.depth = node.kind === 'project' ? 1 : 0.35 + hash01(node.id) * 0.65
  }

  return { nodes, edges }
}

// 固定种子的伪随机。用它而不是 Math.random，是为了让布局每次构建完全相同：
// 位置确定才能写断言、才能截图比对；否则"图变了"这件事无法自动发现。
function mulberry32(seed) {
  let state = seed >>> 0
  return function next() {
    state = (state + 0x6d2b79f5) >>> 0
    let t = Math.imul(state ^ (state >>> 15), 1 | state)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

// 估算标签占据的宽度（像素）。纯函数里量不到真实文字宽度，所以按字符类型估算：
// 中日韩字符约等于字号，其余字符约 0.62 倍字号。宁可估宽一点——估窄了会漏掉重叠。
function estimateLabelWidth(label, kind) {
  const size = kind === 'project' ? 12 : 10
  let width = 0
  for (const char of String(label)) {
    width += /[\u4e00-\u9fff\uff00-\uffef]/.test(char) ? size * 1.06 : size * 0.62
  }
  return width
}

/**
 * 确定性布局：项目节点钉在外圈，技术节点被拉向使用它的项目。
 * 同一生态的技术因此自然聚成簇；被多个项目共用的技术会落在它们之间——
 * 这个位置本身就是信息（"它是我跨项目复用的技术"）。
 *
 * 分离用的是**标签框**而不是节点间距：节点离得够远不代表标签不打架
 * （两个节点横向相距 40px、纵向同高时，标签必然重叠）。这一点是加了
 * "标签不重叠"断言之后才发现的——原来的节点间距判据只有 16px。
 */
export function layoutGraph(nodes, edges, options = {}) {
  const width = options.width ?? 1000
  const height = options.height ?? 680
  const seed = options.seed ?? 20260913
  const iterations = options.iterations ?? 260
  const padX = options.padX ?? 10
  const padY = options.padY ?? 6

  const random = mulberry32(seed)
  const centerX = width / 2
  const centerY = height / 2

  const projectNodes = nodes.filter(node => node.kind === 'project')
  const techNodes = nodes.filter(node => node.kind === 'tech')

  const neighbourIds = new Map()
  for (const edge of edges) {
    if (!neighbourIds.has(edge.source)) neighbourIds.set(edge.source, [])
    if (!neighbourIds.has(edge.target)) neighbourIds.set(edge.target, [])
    neighbourIds.get(edge.source).push(edge.target)
    neighbourIds.get(edge.target).push(edge.source)
  }
  const byId = new Map(nodes.map(node => [node.id, node]))
  const neighboursOf = id => (neighbourIds.get(id) || []).map(other => byId.get(other)).filter(Boolean)

  // 每个节点的标签框半宽/半高
  const boxes = new Map()
  for (const node of nodes) {
    const label = node.kind === 'project' ? node.shortLabel : node.label
    // 技术节点的标签在上方，节点本身很小；项目节点同理但更大。
    // 这里把"标签 + 节点"合并成一个矩形来防重叠。
    boxes.set(node.id, {
      halfWidth: Math.max(estimateLabelWidth(label, node.kind) / 2, node.kind === 'project' ? 26 : 16),
      halfHeight: node.kind === 'project' ? 16 : 12,
    })
  }

  const ringRadius = Math.min(width, height) * 0.34
  projectNodes.forEach((node, index) => {
    const angle = (index / Math.max(projectNodes.length, 1)) * Math.PI * 2 - Math.PI / 2
    node.x = centerX + Math.cos(angle) * ringRadius
    node.y = centerY + Math.sin(angle) * ringRadius
    node.pinned = true
  })

  for (const node of techNodes) {
    const neighbours = neighboursOf(node.id)
    const baseX = neighbours.length ? neighbours.reduce((sum, n) => sum + n.x, 0) / neighbours.length : centerX
    const baseY = neighbours.length ? neighbours.reduce((sum, n) => sum + n.y, 0) / neighbours.length : centerY
    node.x = baseX + (random() - 0.5) * 120
    node.y = baseY + (random() - 0.5) * 120
    node.pinned = false
  }

  function separatePair(a, b, strength) {
    const boxA = boxes.get(a.id)
    const boxB = boxes.get(b.id)
    const overlapX = boxA.halfWidth + boxB.halfWidth + padX - Math.abs(b.x - a.x)
    const overlapY = boxA.halfHeight + boxB.halfHeight + padY - Math.abs(b.y - a.y)
    if (overlapX <= 0 || overlapY <= 0) return
    // 沿"穿透更浅"的方向推开，位移最小
    if (overlapX / (boxA.halfWidth + boxB.halfWidth) < overlapY / (boxA.halfHeight + boxB.halfHeight)) {
      const push = (overlapX / 2 + 0.5) * strength * (b.x >= a.x ? 1 : -1)
      if (!a.pinned) a.x -= push
      if (!b.pinned) b.x += push
    } else {
      const push = (overlapY / 2 + 0.5) * strength * (b.y >= a.y ? 1 : -1)
      if (!a.pinned) a.y -= push
      if (!b.pinned) b.y += push
    }
  }

  for (let step = 0; step < iterations; step += 1) {
    for (let i = 0; i < nodes.length; i += 1) {
      for (let j = i + 1; j < nodes.length; j += 1) {
        separatePair(nodes[i], nodes[j], 0.55)
      }
    }

    for (const node of techNodes) {
      const neighbours = neighboursOf(node.id)
      if (!neighbours.length) continue
      const targetX = neighbours.reduce((sum, n) => sum + n.x, 0) / neighbours.length
      const targetY = neighbours.reduce((sum, n) => sum + n.y, 0) / neighbours.length
      node.x += (targetX - node.x) * 0.014
      node.y += (targetY - node.y) * 0.014

      const box = boxes.get(node.id)
      node.x = Math.max(box.halfWidth + 6, Math.min(width - box.halfWidth - 6, node.x))
      node.y = Math.max(box.halfHeight + 8, Math.min(height - box.halfHeight - 4, node.y))
    }
  }

  return { width, height }
}
