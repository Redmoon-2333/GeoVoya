<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, BookOpen, Globe2, Mountain, Search, X } from 'lucide-vue-next'
import { knowledge } from '../curriculum'
import { localState } from '../localState'
const search = ref(''), category = ref('全部')
const saved = localState<string[]>('reading-list', [])
const results = computed(() => knowledge.filter(item => (category.value === '全部' || item.category === category.value) && `${item.title} ${item.text} ${item.tags.join(' ')}`.includes(search.value.trim())))
function toggle(id: string) { saved.value = saved.value.includes(id) ? saved.value.filter(x => x !== id) : [...saved.value, id] }
</script>
<template>
  <div class="page-heading"><div><span class="eyebrow">COURSE REFERENCE LIBRARY</span><h1>课程资料库</h1></div><RouterLink to="/explore" class="button secondary">回到考察<ArrowRight :size="16"/></RouterLink></div>
  <section class="geography-entry" aria-label="交互资料"><RouterLink to="/geography/tianmu"><Mountain :size="24"/><div><h2>山地环境与植被</h2><p>26 项资料、气候与土壤图表、过程模型。</p></div><ArrowRight :size="17"/></RouterLink><RouterLink to="/geography/atlas"><Globe2 :size="24"/><div><h2>全球地域分异</h2><p>自然带、纬度、水分与典型地区比较。</p></div><ArrowRight :size="17"/></RouterLink></section>
  <div class="library-toolbar"><label class="search-field"><Search :size="19"/><input v-model="search" aria-label="检索课程资料" placeholder="搜索海拔、土壤、水热、证据…"/><button v-if="search" class="icon-button" aria-label="清空检索" @click="search = ''"><X :size="16"/></button></label><span class="muted small">{{ results.length }} 份摘要 · {{ saved.length }} 份待读</span></div>
  <div class="filter-chips" role="group" aria-label="资料分类"><button v-for="item in ['全部', '植被', '土壤', '气候', '方法']" :key="item" :aria-pressed="category === item" :class="{ active: category === item }" @click="category = item">{{ item }}</button></div>
  <div class="library-grid"><article v-for="item in results" :key="item.id" class="knowledge-card"><div class="section-heading"><span class="status-tag">{{ item.category }}</span><BookOpen :size="20"/></div><h2>{{ item.title }}</h2><p>{{ item.text }}</p><div class="keyword-row"><span v-for="tag in item.tags" :key="tag"># {{ tag }}</span></div><div class="knowledge-source">来源：{{ item.source }}</div><button class="text-link" :aria-pressed="saved.includes(item.id)" @click="toggle(item.id)">{{ saved.includes(item.id) ? '已加入待读 · 移除' : '加入我的待读' }}<ArrowRight :size="15"/></button></article></div>
  <div v-if="!results.length" class="empty-state"><Search :size="36"/><h2>没有匹配的资料</h2><p>换一个关键词，或清除分类筛选。</p><button class="button secondary" @click="search = ''; category = '全部'">清除筛选</button></div>
</template>
