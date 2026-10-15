<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Bookmark, Check, CircleHelp, Compass, Lightbulb, Search, Sprout } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { notify, reportError } from '../notice'

const store = useFieldworkStore()
const themeId = ref('cryptomeria')
const theme = computed(() => store.catalog!.themes.find((item) => item.id === themeId.value)!)
const questionId = ref('symptoms')
const question = computed(() => theme.value.questions.find((item) => item.id === questionId.value) || theme.value.questions[0])
const collecting = ref('')
async function collect(id: string) {
  collecting.value = id
  try { await store.collect(id); notify('资料已加入发现收藏。') }
  catch (cause) { reportError(cause) }
  finally { collecting.value = '' }
}
</script>

<template>
  <div class="page-heading"><div><span class="eyebrow">THEMATIC INQUIRY</span><h1>专题探究</h1><p>把一个大问题，转化为可以查证的小问题。</p></div></div>
  <div class="theme-tabs" role="tablist" aria-label="研究专题"><button v-for="item in store.catalog?.themes" :key="item.id" role="tab" :aria-selected="themeId === item.id" :class="{ active: themeId === item.id }" @click="themeId = item.id"><Sprout :size="18" /><span>{{ item.title }}</span><small>{{ item.status === 'prototype' ? '专题样板' : '待补资料' }}</small></button></div>
  <section class="question-band"><span class="eyebrow">DRIVING QUESTION</span><h2>{{ theme.question }}</h2><p>{{ theme.subtitle }}</p></section>
  <template v-if="theme.status === 'prototype'">
    <div class="inquiry-layout"><aside class="question-list"><div class="section-title"><CircleHelp :size="20" /><h2>问题链</h2></div><button v-for="(item, index) in theme.questions" :key="item.id" :class="{ active: question?.id === item.id }" @click="questionId = item.id"><span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ item.title }}</strong><ArrowRight :size="15" /></button></aside><section class="question-content"><span class="status-tag green">{{ question?.title }}</span><h2>{{ question?.prompt }}</h2><div class="method-note"><Lightbulb :size="21" /><p>先区分直接可见的事实与需要验证的解释，再检查现有资料能支持哪一步判断。</p></div><div class="question-actions"><RouterLink to="/explore" class="button primary"><Compass :size="17" />观察实景<ArrowRight :size="16" /></RouterLink><RouterLink :to="`/archive?tab=workbench&question=${question?.id}`" class="button secondary"><Search :size="16" />整理证据</RouterLink></div><p class="muted small">当前照片用于练习观察与证据分析，不作为柳杉衰退成因的预设结论。</p></section></div>
    <section class="section-band"><div class="section-heading"><div><span class="eyebrow">SOURCE MATERIALS</span><h2>从原始资料开始</h2></div><span class="muted small">{{ theme.resource_ids.length }} 份团队实拍资料</span></div><div class="resource-grid"><article v-for="id in theme.resource_ids" :key="id" class="resource-card"><RouterLink :to="`/explore?node=${store.resource(id).node_id}`" class="resource-image"><img :src="store.resource(id).thumbnail" :alt="store.resource(id).title" loading="lazy" /><span class="media-tag">实景照片</span></RouterLink><div class="resource-content"><h3>{{ store.resource(id).title }}</h3><p>{{ store.resource(id).focus }}</p><span class="resource-source">团队提供 · {{ store.resource(id).filename }}</span><div class="resource-actions"><RouterLink :to="`/explore?node=${store.resource(id).node_id}`" class="text-link">查看原始资料<ArrowRight :size="14" /></RouterLink><button class="icon-button" :title="store.isFavorite(id) ? '已收藏' : '收藏资料'" :aria-label="`${store.isFavorite(id) ? '已收藏' : '收藏'}${store.resource(id).title}`" :disabled="!!collecting || store.isFavorite(id)" @click="collect(id)"><Check v-if="store.isFavorite(id)" :size="18" /><Bookmark v-else :size="18" /></button></div></div></article></div></section>
  </template>
  <section v-else class="empty-state theme-empty"><Sprout :size="40" :stroke-width="1.3" /><h2>专题课程资料待补充</h2><p>尚未配置经地理组核验的问题链、调查数据和教学资料。<br />可先进入柳杉专题体验研究流程。</p><button class="button secondary" @click="themeId = 'cryptomeria'">进入柳杉专题<ArrowRight :size="16" /></button></section>
</template>
