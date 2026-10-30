<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref, shallowRef } from 'vue'
import { Maximize2, MousePointer2, RotateCw } from 'lucide-vue-next'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { Viewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import type { PanoramaHotspot, PanoramaSample } from '../types'

const props = defineProps<{ panorama: PanoramaSample }>()
const emit = defineEmits<{ hotspot: [value: PanoramaHotspot] }>()
const container = ref<HTMLElement>()
const viewer = shallowRef<Viewer>()
const selectedId = ref('')
const error = ref('')
const loaded = ref(false)
const emitReady = () => { loaded.value = true; error.value = '' }
function retry() { error.value = ''; loaded.value = false; viewer.value?.setPanorama(props.panorama.image).catch(() => { error.value = '全景暂时无法加载，请重试或切换影像。' }) }

function markers() {
  return props.panorama.hotspots.map((item) => ({
    id: item.id,
    html: `<span class="panorama-hotspot">${item.title.replaceAll('&', '&amp;').replaceAll('<', '&lt;').replaceAll('>', '&gt;')}</span>`,
    position: { yaw: item.yaw, pitch: item.pitch },
    anchor: 'center center',
    tooltip: item.title,
    data: item,
  }))
}

function selectHotspot(id: string) {
  const item = props.panorama.hotspots.find((hotspot) => hotspot.id === id)
  if (!item) return
  selectedId.value = id
  viewer.value?.rotate({ yaw: item.yaw, pitch: item.pitch })
  emit('hotspot', item)
}

onMounted(() => {
  if (!container.value) return
  try {
    viewer.value = new Viewer({
      container: container.value,
      panorama: props.panorama.image,
      caption: props.panorama.title,
      navbar: ['zoom', 'fullscreen', 'caption'],
      keyboard: 'always',
      plugins: [MarkersPlugin.withConfig({ defaultHoverScale: true, markers: markers() })],
    })
    const plugin = viewer.value.getPlugin(MarkersPlugin)
    viewer.value.addEventListener('panorama-loaded', emitReady)
    viewer.value.addEventListener('panorama-error', () => { loaded.value = false; error.value = '全景暂时无法加载，请重试或切换影像。' })
    plugin?.addEventListener('select-marker', ({ marker }) => selectHotspot(marker.id))
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : '本地全景播放器初始化失败。'
  }
})

onBeforeUnmount(() => {
  viewer.value?.destroy()
  viewer.value = undefined
})
</script>

<template>
  <div class="local-panorama">
    <div class="panorama-toolbar">
      <span class="status-tag green">360° 全景</span>
      <span class="muted small"><MousePointer2 :size="14" />拖拽旋转 · 滚轮缩放</span>
      <span class="panorama-toolbar-spacer" />
      <span class="muted small"><Maximize2 :size="14" />支持全屏</span>
    </div>
    <div v-if="error" class="panorama-fallback empty-state" role="alert">
      <RotateCw :size="34" :stroke-width="1.3" />
      <h3>全景播放器暂时不可用</h3>
      <p>{{ error }}</p><button class="button secondary" @click="retry">重新加载</button>
    </div>
    <div ref="container" v-show="!error" class="panorama-container" tabindex="0" :data-loaded="loaded" aria-label="天目山本地全景观察器" />
    <div class="panorama-caption">
      <div>
        <strong>{{ panorama.title }}</strong>
        <p>{{ panorama.scope }}</p>
      </div>
      <span class="muted small">{{ panorama.filename }}</span>
    </div>
    <div class="panorama-hotspots" aria-label="全景观察热点">
      <button
        v-for="item in panorama.hotspots"
        :key="item.id"
        class="panorama-hotspot-button"
        :class="{ active: selectedId === item.id }"
        @click="selectHotspot(item.id)"
      >
        <MousePointer2 :size="15" />
        <span>{{ item.title }}</span>
      </button>
    </div>
  </div>
</template>
