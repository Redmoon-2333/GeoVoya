<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { RotateCw } from 'lucide-vue-next'
import { geographyPages, geographyState, loadTianmu, saveGeographyState, type TianmuInstance } from '../course/geography'
import { useUnsaved } from '../useUnsaved'

const route = useRoute(), router = useRouter()
const host = ref<HTMLElement>()
const loading = ref(true), error = ref(''), dirty = ref(false)
useUnsaved(dirty)
let instance: TianmuInstance | undefined, disposed = false
function requestedPage() {
  return geographyPages.some(page => page.id === route.query.page) ? String(route.query.page) : 'CL01'
}
async function open() {
  loading.value = true
  error.value = ''
  try {
    const { library, data, diagrams } = await loadTianmu()
    if (disposed || !host.value) return
    const initial = JSON.parse(JSON.stringify(geographyState.value))
    instance = library.mount(host.value, {
      embedded: true, hashRouting: false, autoTour: false, page: requestedPage(),
      assetBase: '/lessons/tianmu/', profileKey: 'geovoya', data, diagrams,
      storageAdapter: {
        load: () => initial,
        save: state => { saveGeographyState(state); dirty.value = false },
      },
      onPageChange: ({ page_id }) => {
        if (!disposed && route.query.page !== page_id) router.replace({ query: { ...route.query, page: page_id } })
      },
    })
    await instance.ready
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '课程暂时无法打开。'
  } finally { loading.value = false }
}
watch(() => route.query.page, () => {
  const page = requestedPage()
  if (instance && instance.getState().page_id !== page) instance.setPage(page)
})
function onInput(event: Event) {
  if ((event.target as HTMLElement).matches('[data-slot="note-text"]')) dirty.value = true
}
function onClose(event: Event) {
  if ((event.target as HTMLElement).matches('[data-dialog="note"]')) dirty.value = false
}
onMounted(open)
onBeforeUnmount(() => { disposed = true; instance?.destroy() })
</script>

<template>
  <div v-if="loading" class="lesson-status" role="status"><RotateCw class="spin" :size="25" />正在打开山地资料…</div>
  <div v-if="error" class="lesson-status" role="alert"><p>{{ error }}</p><button class="button secondary" @click="open"><RotateCw :size="16" />重新加载课程</button></div>
  <div ref="host" class="tianmu-lesson" :aria-busy="loading" @input="onInput" @close.capture="onClose" />
</template>
