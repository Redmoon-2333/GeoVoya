import { ref, watch } from 'vue'
import { notify } from './notice'

export function localState<T>(key: string, fallback: T) {
  let initial = fallback
  try { const raw = localStorage.getItem(`geovoya:${key}`); if (raw) initial = JSON.parse(raw) as T } catch { /* Keep usable defaults if storage is unavailable or corrupt. */ }
  const state = ref<T>(initial)
  watch(state, value => {
    try { localStorage.setItem(`geovoya:${key}`, JSON.stringify(value)) }
    catch { notify('浏览器存储不可用，这次修改未保存。请导出记录。', true) }
  }, { deep: true, flush: 'sync' })
  return state
}
