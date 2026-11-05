<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, FolderOpen, NotebookPen, Search } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { formatDate } from '../api'
import GeographyRecords from '../components/GeographyRecords.vue'

const store = useFieldworkStore()
const search = ref('')
const filtered = computed(() => store.favorites.filter((item) => store.resource(item.resource_id).title.includes(search.value.trim())))
</script>

<template>
  <div class="page-heading"><div><span class="eyebrow">TOOL · FIELDWORK ARCHIVE</span><h1>科考档案馆</h1></div><RouterLink to="/explore" class="button secondary">继续观察<ArrowRight :size="16" /></RouterLink></div>
  <GeographyRecords />
  <section class="section-band"><div class="section-heading"><h2>我的发现收藏</h2><label class="search-field"><Search :size="17" /><input v-model="search" aria-label="搜索收藏" placeholder="搜索资料名称" /></label></div>
    <div v-if="filtered.length" class="resource-grid"><article v-for="item in filtered" :key="item.id" class="resource-card"><RouterLink :to="`/explore?node=${store.resource(item.resource_id).node_id}`" class="resource-image"><img :src="store.resource(item.resource_id).thumbnail" :alt="store.resource(item.resource_id).title" /><span class="media-tag">实景照片</span></RouterLink><div class="resource-content"><span class="status-tag" :class="{ green: store.analyses.some((analysis) => analysis.favorite_id === item.id) }">{{ store.analyses.some((analysis) => analysis.favorite_id === item.id) ? '已有分析' : '等待分析' }}</span><h3>{{ store.resource(item.resource_id).title }}</h3><p class="resource-source">{{ item.source }}</p><div class="resource-actions"><span class="muted small">{{ formatDate(item.created_at) }}</span><RouterLink :to="`/inquiry?tab=workbench&resource=${item.resource_id}`" class="text-link">分析资料<ArrowRight :size="15" /></RouterLink></div></div></article></div>
    <div v-else class="empty-state"><FolderOpen :size="38" :stroke-width="1.3" /><h3>{{ search ? '没有匹配的收藏' : '发现收藏还是空的' }}</h3><p>{{ search ? '试试另一个资料名称。' : '从实景照片中发现值得研究的细节。' }}</p><RouterLink v-if="!search" to="/explore" class="button primary">前往实景观察<ArrowRight :size="16" /></RouterLink></div>
  </section>
  <section class="section-band"><div class="section-heading"><h2>我的观察记录</h2><span class="muted small">{{ store.observations.length }} 条</span></div><div v-if="!store.observations.length" class="inline-empty"><NotebookPen :size="22" /><span>尚无独立观察记录</span></div><RouterLink v-for="item in store.observations" :key="item.id" :to="`/explore?node=${item.node_id}`" class="note-row"><NotebookPen :size="21" /><div><h3>{{ store.node(item.node_id).title }}</h3><p>{{ item.fact }}</p><span class="muted small">{{ item.question ? `疑问：${item.question}` : '尚未记录疑问' }}</span></div><time>{{ formatDate(item.updated_at) }}</time><ArrowRight :size="16" /></RouterLink></section>
</template>
