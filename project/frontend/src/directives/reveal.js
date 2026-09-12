// 滚动展开动画：元素进入视口时淡入并轻微上移，形成"随滚动逐段展开"的节奏。
//
// 用法：
//   <section v-reveal>...</section>          普通展开
//   <article v-reveal="2">...</article>      带序号，按序错开延迟，形成序列感
//
// 该系统设置为「减少动效」时直接显示，不做位移与淡入。

const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

let observer = null

function ensureObserver() {
  if (observer || prefersReducedMotion || typeof IntersectionObserver === 'undefined') return observer
  observer = new IntersectionObserver(entries => {
    entries.forEach(entry => {
      if (!entry.isIntersecting) return
      entry.target.classList.add('is-visible')
      observer.unobserve(entry.target)
    })
  }, { rootMargin: '0px 0px -12% 0px', threshold: 0.08 })
  return observer
}

export const reveal = {
  mounted(el, binding) {
    if (prefersReducedMotion) {
      el.classList.add('is-visible')
      return
    }
    const order = Number(binding.value)
    if (Number.isFinite(order) && order > 0) {
      el.style.transitionDelay = `${Math.min(order, 6) * 90}ms`
    }
    el.classList.add('reveal')
    const instance = ensureObserver()
    if (instance) instance.observe(el)
    else el.classList.add('is-visible')
  },
  unmounted(el) {
    if (observer) observer.unobserve(el)
  },
}

export default reveal
