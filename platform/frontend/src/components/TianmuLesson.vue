<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, BookOpen, CircleHelp, FolderOpen, List, RotateCw } from 'lucide-vue-next'
import { geographyPages, geographyState, loadTianmu, saveGeographyState, type TianmuInstance } from '../course/geography'
import { useUnsaved } from '../useUnsaved'

const route = useRoute(), router = useRouter()
const host = ref<HTMLElement>()
const loading = ref(true), error = ref(''), dirty = ref(false)
useUnsaved(dirty)
let instance: TianmuInstance | undefined, disposed = false
const readingRoute = [
  { page: 'VE03', title: '比较植被', group: 'VE' },
  { page: 'CL01', title: '查气候', group: 'CL' },
  { page: 'SO01', title: '查土壤', group: 'SO' },
  { page: 'SY01', title: '归纳联系', group: 'SY' },
]
const currentGroup = computed(() => requestedPage().slice(0, 2))
function openTool(action: string) { host.value?.querySelector<HTMLButtonElement>(`[data-action="${action}"]`)?.click() }
function requestedPage() {
  return geographyPages.some(page => page.id === route.query.page) ? String(route.query.page) : 'VE03'
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
  <div v-if="!error" class="lesson-navigation">
    <nav aria-label="资料学习顺序"><template v-for="(step, index) in readingRoute" :key="step.page"><ArrowRight v-if="index" :size="12" /><RouterLink :to="{ query: { ...route.query, page: step.page } }" :aria-current="currentGroup === step.group ? 'step' : undefined">{{ step.title }}</RouterLink></template></nav>
    <div class="lesson-tools"><button class="button secondary compact" :disabled="loading" @click="openTool('catalog')"><List :size="16" />完整目录</button><button class="icon-button" title="课程收藏与笔记" aria-label="课程收藏与笔记" :disabled="loading" @click="openTool('evidence')"><FolderOpen :size="17" /></button><button class="icon-button" title="课程参考文献" aria-label="课程参考文献" :disabled="loading" @click="openTool('bibliography')"><BookOpen :size="17" /></button><button class="icon-button" title="操作指引" aria-label="课程操作指引" :disabled="loading" @click="openTool('help')"><CircleHelp :size="17" /></button></div>
  </div>
  <div v-if="loading" class="lesson-status" role="status"><RotateCw class="spin" :size="25" />正在打开山地资料…</div>
  <div v-if="error" class="lesson-status" role="alert"><p>{{ error }}</p><button class="button secondary" @click="open"><RotateCw :size="16" />重新加载课程</button></div>
  <div ref="host" class="tianmu-lesson" :aria-busy="loading" @input="onInput" @close.capture="onClose" />
</template>
