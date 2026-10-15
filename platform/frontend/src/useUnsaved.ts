import { onBeforeUnmount, onMounted, type Ref } from 'vue'
import { onBeforeRouteLeave } from 'vue-router'

export function useUnsaved(dirty: Ref<boolean>) {
  function confirmLeave() {
    return !dirty.value || window.confirm('有尚未保存的内容，确定离开并放弃这些修改吗？')
  }
  function beforeUnload(event: BeforeUnloadEvent) {
    if (dirty.value) {
      event.preventDefault()
      event.returnValue = ''
    }
  }
  onBeforeRouteLeave(confirmLeave)
  onMounted(() => window.addEventListener('beforeunload', beforeUnload))
  onBeforeUnmount(() => window.removeEventListener('beforeunload', beforeUnload))
  return confirmLeave
}
