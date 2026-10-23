<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { Maximize2, MousePointer2, RotateCw } from 'lucide-vue-next'
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin'
import { Viewer } from '@photo-sphere-viewer/core'
import '@photo-sphere-viewer/core/index.css'
import '@photo-sphere-viewer/markers-plugin/index.css'
import type { PanoramaHotspot, PanoramaSample } from '../types'

const props = defineProps<{ panorama: PanoramaSample }>()
const emit = defineEmits<{ hotspot: [value: PanoramaHotspot] }>()
const container = ref<HTMLElement>()
const viewer = ref<Viewer>()
const selectedId = ref('')
const error = ref('')

function markers() {
  return props.panorama.hotspots.map((item) => ({
    id: item.id,
    html: `<span class="panorama-hotspot">${item.title}</span>`,
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
      caption: `${props.panorama.title} · 本地全景样例`,
      navbar: ['zoom', 'fullscreen', 'caption'],
      plugins: [MarkersPlugin.withConfig({ defaultHoverScale: true, markers: markers() })],
    })
    const plugin = viewer.value.getPlugin(MarkersPlugin)
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
      <span class="status-tag green">本地等距柱状全景</span>
      <span class="muted small"><MousePointer2 :size="14" />拖拽旋转 · 滚轮缩放</span>
      <span class="panorama-toolbar-spacer" />
      <span class="muted small"><Maximize2 :size="14" />支持全屏</span>
    </div>
    <div v-if="error" class="panorama-fallback empty-state">
      <RotateCw :size="34" :stroke-width="1.3" />
      <h3>全景播放器暂时不可用</h3>
      <p>{{ error }}<br />仍可使用下方热点提示和观察记录。</p>
    </div>
    <div v-else ref="container" class="panorama-container" aria-label="天目山本地全景观察器" />
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
