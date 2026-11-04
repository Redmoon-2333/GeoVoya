<script setup lang="ts">
import { computed, defineAsyncComponent, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, Globe2, Maximize2, Minimize2, Mountain, RotateCw } from 'lucide-vue-next'
import { notify } from '../notice'

const TianmuLesson = defineAsyncComponent(() => import('../components/TianmuLesson.vue'))
const route = useRoute()
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
  <div class="page-heading"><div><span class="eyebrow">GEOGRAPHICAL ZONATION</span><h1>{{ atlas ? '星球植被图鉴' : '垂直地带性探究' }}</h1><p>{{ atlas ? '把森林放回全球，比较纬度与水分条件。' : '沿山地比较气候、土壤与植被，把观察连成解释。' }}</p></div><RouterLink to="/explore?view=terrain" class="button secondary">回到样带考察<ArrowRight :size="16" /></RouterLink></div>
  <nav class="lesson-tabs" aria-label="地带性课程">
    <RouterLink to="/geography/tianmu" :aria-current="!atlas ? 'page' : undefined"><Mountain :size="18" /><span>西天目山<span class="lesson-tab-detail">垂直地带性</span></span></RouterLink>
    <RouterLink to="/geography/atlas" :aria-current="atlas ? 'page' : undefined"><Globe2 :size="18" /><span>星球植被图鉴<span class="lesson-tab-detail">纬度与干湿度地带性</span></span></RouterLink>
  </nav>
  <section v-if="atlas" ref="workspace" class="atlas-workspace" aria-label="全球植被交互场景">
    <div class="atlas-toolbar"><span>全球自然带</span><button class="icon-button" :aria-label="expanded ? '退出图鉴全屏' : '全屏查看图鉴'" :title="expanded ? '退出全屏' : '全屏查看'" @click="toggleFullscreen"><Minimize2 v-if="expanded" :size="18" /><Maximize2 v-else :size="18" /></button></div>
    <div v-if="!ready" class="atlas-loading" role="status"><RotateCw class="spin" :size="24" />正在打开星球图鉴…</div>
    <iframe ref="frame" class="atlas-frame" src="/lessons/vegetation-atlas/index.html" title="星球植被图鉴：全球自然带、纬度与干湿度探究" allow="fullscreen" />
  </section>
  <TianmuLesson v-else />
  <div class="lesson-continuation"><RouterLink :to="atlas ? '/geography/tianmu?page=VE01' : '/geography/atlas'" class="text-link">{{ atlas ? '回到西天目山比较垂直变化' : '去全球图鉴比较地域分异' }}<ArrowRight :size="16" /></RouterLink><RouterLink to="/archive" class="text-link">回看科考档案<ArrowRight :size="16" /></RouterLink></div>
</template>
