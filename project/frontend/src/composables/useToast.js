// 轻量的全局提示与邮箱复制。外壳负责渲染，任意视图可直接调用。
import { ref } from 'vue'

export const CONTACT_EMAIL = 'hello@crow5.studio'

const toastMessage = ref('')
let toastTimer

export function showToast(message) {
  toastMessage.value = message
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { toastMessage.value = '' }, 2400)
}

export async function copyEmail() {
  try {
    await navigator.clipboard.writeText(CONTACT_EMAIL)
    showToast('邮箱已复制')
  } catch {
    showToast(`联系邮箱：${CONTACT_EMAIL}`)
  }
}

export function useToast() {
  return { toastMessage, showToast, copyEmail }
}
