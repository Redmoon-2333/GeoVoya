import { ref } from 'vue'

export const notice = ref<{ text: string; error: boolean } | null>(null)
let timer: ReturnType<typeof setTimeout>

export function notify(text: string, error = false) {
  clearTimeout(timer)
  notice.value = { text, error }
  timer = setTimeout(() => { notice.value = null }, error ? 6500 : 3500)
}

export function reportError(cause: unknown) {
  notify(cause instanceof Error ? cause.message : '操作未完成，请重试。', true)
}
