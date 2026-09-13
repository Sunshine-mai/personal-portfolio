// 首屏氛围层：跟随指针的光斑、网格视差、内容层反向视差。
//
// 抽成 composable 而不是在两个视图里各写一份：这套逻辑里有好几条"只能做一次"的约定
// （居中归 CSS 的负 margin、光斑中心要上移、归一化范围是 -1..1），
// 抄一份就多一处会漂移的地方——本项目已经在"标签字号写两遍"上踩过这个坑。
//
// 只写内层元素自己的 transform：底图与基准布局一律不动，
// 所以"画面会动"与"布局可断言"同时成立。
import { ref } from 'vue'

// 光斑中心刻意不落在指针上，而是上移一段：正落在指针处时热点恰好压在手底下的内容上，
// 观感明显过强（实测反馈两次）。上移之后亮度中心移到指针上方，指针附近落在衰减段里，
// 看起来像光从上方照下来。上移多少属于可调观感，所以浏览器验收断言的是
// "中心在指针上方"，不是某个具体数值。
export const HERO_GLOW_LIFT = 72

export function useHeroAmbience() {
  const rootRef = ref(null)
  const glowRef = ref(null)

  function prefersReducedMotion() {
    return typeof window !== 'undefined'
      && window.matchMedia
      && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  }

  function onPointerMove(event) {
    if (prefersReducedMotion()) return
    const root = rootRef.value
    const glow = glowRef.value
    if (!root || !glow) return
    const rect = root.getBoundingClientRect()
    if (!rect.width || !rect.height) return
    const x = event.clientX - rect.left
    const y = event.clientY - rect.top

    // 居中由 CSS 的负 margin 负责，这里只负责"移到指针上方"。
    // 曾经在这里又减过一次半径，而 CSS 已经减过一次——双重偏移，
    // 光斑整块落到指针左上 430px。居中只做一次，两处各做一半就是错。
    glow.style.transform = `translate3d(${x.toFixed(1)}px,${(y - HERO_GLOW_LIFT).toFixed(1)}px,0)`

    // 网格做一点反向位移形成极浅的景深。幅度必须小，再大就成了"页面在晃"。
    root.style.setProperty('--parallax-x', `${((x / rect.width - .5) * -14).toFixed(2)}px`)
    root.style.setProperty('--parallax-y', `${((y / rect.height - .5) * -10).toFixed(2)}px`)

    // 内容层的视差用 -1..1 的归一化值，具体位移量放在 CSS 里：
    // "移多少"是样式问题，改它不必碰逻辑，也便于按屏宽单独调。
    root.style.setProperty('--hero-x', ((x / rect.width - .5) * 2).toFixed(3))
    root.style.setProperty('--hero-y', ((y / rect.height - .5) * 2).toFixed(3))
    root.classList.add('is-live')
  }

  function onPointerLeave() {
    const root = rootRef.value
    if (!root) return
    root.classList.remove('is-live')
    root.style.setProperty('--parallax-x', '0px')
    root.style.setProperty('--parallax-y', '0px')
    root.style.setProperty('--hero-x', '0')
    root.style.setProperty('--hero-y', '0')
  }

  return { rootRef, glowRef, onPointerMove, onPointerLeave }
}
