<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { ArrowLeftRight, ArrowRight, Bookmark, Check, ChevronLeft, ChevronRight, Image, Info, Layers, MapPin, Maximize2, Mountain, Route, X } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { notify, reportError } from '../notice'
import { useUnsaved } from '../useUnsaved'
import ObservationForm from '../components/ObservationForm.vue'

const store = useFieldworkStore()
const route = useRoute()
const router = useRouter()
const dirty = ref(false)
const confirmLeave = useUnsaved(dirty)
const selectedId = ref(store.lastNode || store.nodes[0]!.id)
const node = computed(() => store.node(selectedId.value))
const resource = computed(() => store.resource(node.value.resource_id))
const mode = ref<'photo' | 'terrain' | 'profile'>('photo')
const comparing = ref(false)
const comparisonId = ref(store.resources[1]!.id)
const comparison = computed(() => store.resource(comparisonId.value))
const collecting = ref(false)
const zoom = ref<HTMLDialogElement>()
const index = computed(() => store.nodes.findIndex((item) => item.id === selectedId.value))

watch(() => route.query.node, (id) => {
  if (typeof id === 'string' && store.nodes.some((item) => item.id === id)) selectedId.value = id
}, { immediate: true })
watch(selectedId, (id) => {
  dirty.value = false
  if (comparisonId.value === node.value.resource_id) comparisonId.value = store.resources.find((item) => item.id !== node.value.resource_id)!.id
  store.rememberNode(id).catch(reportError)
}, { immediate: true })
onBeforeRouteUpdate((to, from) => to.query.node === from.query.node || confirmLeave())

function select(id: string) {
  if (id !== selectedId.value) router.replace({ query: { ...route.query, node: id } })
}
async function collect() {
  collecting.value = true
  try { await store.collect(resource.value.id); notify('已加入发现收藏，来源一并保留。') }
  catch (cause) { reportError(cause) }
  finally { collecting.value = false }
}
</script>

<template>
  <div class="page-heading"><div><span class="eyebrow">SPATIAL EXPLORATION</span><h1>空间探索</h1><p>从眼前的实景出发，留下可以追溯的观察。</p></div><RouterLink to="/inquiry" class="button secondary">专题探究<ArrowRight :size="16" /></RouterLink></div>
  <div class="explore-layout">
    <section class="explore-main">
      <div class="tab-bar" role="tablist" aria-label="空间视图"><button role="tab" :aria-selected="mode === 'photo'" :class="{ active: mode === 'photo' }" @click="mode = 'photo'"><Image :size="17" />实景观察</button><button role="tab" :aria-selected="mode === 'terrain'" :class="{ active: mode === 'terrain' }" @click="mode = 'terrain'"><Mountain :size="17" />地形沙盘<span class="tab-note">待接入</span></button><button role="tab" :aria-selected="mode === 'profile'" :class="{ active: mode === 'profile' }" @click="mode = 'profile'"><Route :size="17" />海拔剖面<span class="tab-note">待接入</span></button></div>
      <template v-if="mode === 'photo'">
        <div class="photo-toolbar"><div><span class="status-tag green">素材 {{ node.code }}</span><h2>{{ node.title }}</h2></div><div class="toolbar-actions"><button class="icon-button" :class="{ 'is-active': comparing }" :aria-pressed="comparing" title="并排对比照片" aria-label="并排对比照片" @click="comparing = !comparing"><ArrowLeftRight :size="18" /></button><button class="icon-button" title="放大照片" aria-label="放大照片" @click="zoom?.showModal()"><Maximize2 :size="18" /></button></div></div>
        <div class="photo-viewer" :class="{ comparing }">
          <figure><img :src="resource.image" :alt="resource.title" /><figcaption>{{ resource.title }}<span>普通照片</span></figcaption></figure>
          <figure v-if="comparing"><img :src="comparison.image" :alt="comparison.title" /><figcaption><select v-model="comparisonId" aria-label="选择对比照片"><option v-for="item in store.resources.filter((item) => item.id !== resource.id)" :key="item.id" :value="item.id">{{ item.title }}</option></select></figcaption></figure>
        </div>
        <div class="viewer-bottom"><span><MapPin :size="15" />采集点与海拔待核验</span><button class="button secondary compact" :disabled="collecting || store.isFavorite(resource.id)" @click="collect"><Check v-if="store.isFavorite(resource.id)" :size="16" /><Bookmark v-else :size="16" />{{ store.isFavorite(resource.id) ? '已收藏' : '收藏这份资料' }}</button></div>
        <div class="focus-note"><Info :size="19" /><p>{{ resource.focus }}</p></div>
        <details class="source-details"><summary>资料来源与适用范围</summary><p>{{ resource.source }}</p><p>{{ resource.scope }}</p><span class="muted small">素材版本：{{ resource.source_version }}</span></details>
        <div class="section-heading node-heading"><h2>观察素材</h2><span class="muted small">素材编号不代表地理路线顺序</span></div>
        <div class="node-strip"><button v-for="item in store.nodes" :key="item.id" :class="{ selected: item.id === selectedId }" @click="select(item.id)"><img :src="store.resource(item.resource_id).thumbnail" :alt="item.title" /><span><small>{{ item.code }}</small>{{ item.title }}<Check v-if="store.observations.some((observation) => observation.node_id === item.id)" :size="15" /></span></button></div>
        <div class="node-pagination"><button class="button subtle compact" :disabled="index === 0" @click="select(store.nodes[index - 1]!.id)"><ChevronLeft :size="16" />上一份</button><span>{{ index + 1 }} / {{ store.nodes.length }}</span><button class="button subtle compact" :disabled="index === store.nodes.length - 1" @click="select(store.nodes[index + 1]!.id)">下一份<ChevronRight :size="16" /></button></div>
      </template>
      <div v-else class="spatial-empty empty-state"><Layers :size="40" :stroke-width="1.3" /><h2>{{ mode === 'terrain' ? '地形沙盘待接入' : '海拔剖面待接入' }}</h2><p>{{ mode === 'terrain' ? '尚未确认沙盘平台、地形数据及点位。' : '尚未提供核验后的高程数据与研学路线。' }}<br />当前不展示模拟地形或虚构海拔。</p><button class="button secondary" @click="mode = 'photo'"><Image :size="16" />回到实景观察</button></div>
    </section>
    <aside class="observation-panel"><ObservationForm :node-id="selectedId" @dirty="dirty = $event" /><RouterLink to="/archive" class="text-link archive-shortcut">进入科考档案馆<ArrowRight :size="16" /></RouterLink></aside>
  </div>
  <dialog ref="zoom" class="photo-dialog" @click="($event.target === zoom) && zoom?.close()"><div class="dialog-toolbar"><h2>{{ resource.title }}</h2><button class="icon-button" aria-label="关闭放大照片" @click="zoom?.close()"><X :size="22" /></button></div><img :src="resource.image" :alt="resource.title" /><p>{{ resource.filename }} · 普通照片</p></dialog>
</template>
