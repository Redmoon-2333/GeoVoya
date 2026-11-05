<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, Maximize2, Minimize2, RotateCw } from 'lucide-vue-next'
import { notify } from '../notice'
import ModuleSubnav from '../components/ModuleSubnav.vue'
import ExplorationTasks from '../components/ExplorationTasks.vue'
import { useStudyModules } from '../modules'

const TianmuLesson = defineAsyncComponent(() => import('../components/TianmuLesson.vue'))
const route = useRoute()
const { observationDone, noteDone } = useStudyModules()
const atlas = computed(() => route.path.endsWith('/atlas'))
const frame = ref<HTMLIFrameElement>(), workspace = ref<HTMLElement>()
const ready = ref(false), expanded = ref(false)
watch(atlas, () => { ready.value = false })
function receive(event: MessageEvent) {
  if (event.origin === location.origin && event.source === frame.value?.contentWindow && event.data?.type === 'geovoya:atlas-ready') ready.value = true
}
async function toggleFullscreen() {
  try {
    if (document.fullscreenElement) await document.exitFullscreen()
    else await workspace.value?.requestFullscreen()
  } catch { notify('当前浏览器无法打开全屏。', true) }
}
function fullscreenChanged() { expanded.value = document.fullscreenElement === workspace.value }
onMounted(() => { window.addEventListener('message', receive); document.addEventListener('fullscreenchange', fullscreenChanged) })
onBeforeUnmount(() => { window.removeEventListener('message', receive); document.removeEventListener('fullscreenchange', fullscreenChanged) })
</script>

<template>
  <div class="page-heading"><div><span class="eyebrow">MODULE 02 · GEOGRAPHICAL ZONATION</span><h1>{{ atlas ? '星球植被图鉴' : '垂直地带性探究' }}</h1><p>{{ atlas ? '把森林放回全球，比较纬度与水分条件。' : '先看植被差异，再查气候与土壤资料，最后整理成因。' }}</p></div><RouterLink to="/explore?view=terrain" class="button secondary">回到样带考察<ArrowRight :size="16" /></RouterLink></div>
  <ModuleSubnav />
  <ExplorationTasks v-if="!atlas" />
  <section v-if="atlas" ref="workspace" class="atlas-workspace" aria-label="全球植被交互场景">
    <div class="atlas-toolbar"><span>全球自然带</span><button class="icon-button" :aria-label="expanded ? '退出图鉴全屏' : '全屏查看图鉴'" :title="expanded ? '退出全屏' : '全屏查看'" @click="toggleFullscreen"><Minimize2 v-if="expanded" :size="18" /><Maximize2 v-else :size="18" /></button></div>
    <div v-if="!ready" class="atlas-loading" role="status"><RotateCw class="spin" :size="24" />正在打开星球图鉴…</div>
    <iframe ref="frame" class="atlas-frame" src="/lessons/vegetation-atlas/index.html" title="星球植被图鉴：全球自然带、纬度与干湿度探究" allow="fullscreen" />
  </section>
  <TianmuLesson v-else />
  <div v-if="!atlas && noteDone" class="learning-entry"><div><h2>课程笔记已保存</h2><p>{{ observationDone ? '把环境差异与实景观察联系起来，继续整理研究证据。' : '再保存一条实景观察，完成山地观察的两项产出。' }}</p></div><RouterLink :to="observationDone ? '/inquiry' : '/explore'" class="button primary">{{ observationDone ? '进入专题探究' : '继续实景观察' }}<ArrowRight :size="16" /></RouterLink></div>
  <div class="lesson-continuation"><RouterLink :to="atlas ? '/geography/tianmu?page=VE01' : '/geography/atlas'" class="text-link">{{ atlas ? '回到西天目山比较垂直变化' : '去全球图鉴比较地域分异' }}<ArrowRight :size="16" /></RouterLink><RouterLink to="/archive" class="text-link">回看科考档案<ArrowRight :size="16" /></RouterLink></div>
</template>
