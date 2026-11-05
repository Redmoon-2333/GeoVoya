<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowRight, Bookmark, Check, ChevronDown, CircleHelp, Compass, FileStack, Lightbulb, Search, Sprout, NotebookPen, X, Download } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { notify, reportError } from '../notice'
import { topicDrafts, downloadText } from '../curriculum'
import { localState } from '../localState'
import EvidenceWorkbench from '../components/EvidenceWorkbench.vue'
import ArgumentBoard from '../components/ArgumentBoard.vue'

const store = useFieldworkStore()
const route = useRoute(), router = useRouter()
const themeId = computed(() => store.catalog!.themes.some(item => item.id === route.query.theme) ? String(route.query.theme) : 'cryptomeria')
function setTab(value: string) { router.replace({ query: { ...route.query, tab: value } }) }
const theme = computed(() => store.catalog!.themes.find((item) => item.id === themeId.value)!)
const tab = computed(() => theme.value.status === 'prototype' && ['workbench', 'board'].includes(String(route.query.tab)) ? String(route.query.tab) : 'questions')
const draft = computed(() => topicDrafts[themeId.value]!)
const draftIndex = ref(0)
const plans = localState<Record<string, string>>('research-plans', {})
const ideas = localState<Record<string, string>>('question-ideas', {})
const plan = ref<HTMLDialogElement>()
const question = computed(() => theme.value.questions.find(item => item.id === route.query.question) || theme.value.questions[0])
const collecting = ref('')
watch(themeId, () => { draftIndex.value = 0 })
function selectQuestion(id: string) { router.replace({ query: { ...route.query, question: id } }) }
async function collect(id: string) {
  collecting.value = id
  try { await store.collect(id); notify('资料已加入发现收藏。') }
  catch (cause) { reportError(cause) }
  finally { collecting.value = '' }
}
</script>

<template>
  <div class="page-heading"><div><span class="eyebrow">MODULE 03 · THEMATIC INQUIRY</span><h1>专题探究</h1><p>围绕一个问题，用资料组织可以检验的解释。</p></div><button class="button secondary" @click="plan?.showModal()"><NotebookPen :size="16"/>我的研究计划</button></div>
  <section class="question-band"><span class="eyebrow">DRIVING QUESTION</span><h2>{{ theme.question }}</h2><p>{{ theme.subtitle }}</p></section>
  <details class="topic-picker"><summary><span><strong>当前专题</strong>{{ theme.title }}</span><span>切换专题<ChevronDown :size="16" /></span></summary><div class="topic-grid"><RouterLink v-for="(item, index) in store.catalog?.themes" :key="item.id" :to="`/inquiry?theme=${item.id}`" class="topic-card" :class="{ 'topic-pending': item.status !== 'prototype', active: themeId === item.id }"><span class="topic-number">0{{ index + 1 }}</span><Sprout :size="21" /><span class="topic-state">{{ item.status === 'prototype' ? '完整实践路线' : '拓展草记' }}</span><h3>{{ item.title }}</h3><p>{{ item.subtitle }}</p><span class="text-link">{{ themeId === item.id ? '当前专题' : '进入专题' }}<ArrowRight :size="15" /></span></RouterLink></div></details>
  <div v-if="theme.status === 'prototype'" class="tab-bar inquiry-tabs" role="tablist" aria-label="专题探究步骤"><button role="tab" :aria-selected="tab === 'questions'" :class="{ active: tab === 'questions' }" @click="setTab('questions')"><CircleHelp :size="18" />问题链</button><button role="tab" :aria-selected="tab === 'workbench'" :class="{ active: tab === 'workbench' }" @click="setTab('workbench')"><Search :size="18" />证据工作台</button><button role="tab" :aria-selected="tab === 'board'" :class="{ active: tab === 'board' }" @click="setTab('board')"><FileStack :size="18" />研究论证板<span class="count-badge">{{ store.board.length }}</span></button></div>
  <template v-if="tab === 'questions'">
  <template v-if="theme.status === 'prototype'">
    <div class="inquiry-layout"><aside class="question-list"><div class="section-title"><CircleHelp :size="20" /><h2>问题链</h2></div><button v-for="(item, index) in theme.questions" :key="item.id" :class="{ active: question?.id === item.id }" @click="selectQuestion(item.id)"><span>{{ String(index + 1).padStart(2, '0') }}</span><strong>{{ item.title }}</strong><ArrowRight :size="15" /></button></aside><section class="question-content"><span class="status-tag green">{{ question?.title }}</span><h2>{{ question?.prompt }}</h2><div class="method-note"><Lightbulb :size="21" /><p>先区分直接可见的事实与需要验证的解释，再检查现有资料能支持哪一步判断。</p></div><div class="question-actions"><RouterLink :to="{ path: '/explore', query: { question: question?.id } }" class="button primary"><Compass :size="17" />观察实景<ArrowRight :size="16" /></RouterLink><RouterLink :to="`/inquiry?tab=workbench&question=${question?.id}`" class="button secondary"><Search :size="16" />整理证据</RouterLink></div><p class="muted small">当前照片用于练习观察与证据分析，不作为柳杉衰退成因的预设结论。</p><label class="field-label" for="question-idea">我的初步想法</label><textarea id="question-idea" v-model="ideas[`${themeId}:${question?.id}`]" rows="3" maxlength="2000" placeholder="目前的假设是什么？可以用哪些证据检验？"/></section></div>
    <section class="section-band"><div class="section-heading"><div><span class="eyebrow">SOURCE MATERIALS</span><h2>从原始资料开始</h2></div><span class="muted small">{{ theme.resource_ids.length }} 份团队实拍资料</span></div><div class="resource-grid"><article v-for="id in theme.resource_ids" :key="id" class="resource-card"><RouterLink :to="`/explore?node=${store.resource(id).node_id}`" class="resource-image"><img :src="store.resource(id).thumbnail" :alt="store.resource(id).title" loading="lazy" /><span class="media-tag">实景照片</span></RouterLink><div class="resource-content"><h3>{{ store.resource(id).title }}</h3><p>{{ store.resource(id).focus }}</p><span class="resource-source">团队提供 · {{ store.resource(id).filename }}</span><div class="resource-actions"><RouterLink :to="`/explore?node=${store.resource(id).node_id}`" class="text-link">查看原始资料<ArrowRight :size="14" /></RouterLink><button class="icon-button" :title="store.isFavorite(id) ? '已收藏' : '收藏资料'" :aria-label="`${store.isFavorite(id) ? '已收藏' : '收藏'}${store.resource(id).title}`" :disabled="!!collecting || store.isFavorite(id)" @click="collect(id)"><Check v-if="store.isFavorite(id)" :size="18" /><Bookmark v-else :size="18" /></button></div></div></article></div></section>
  </template>
  <section v-else class="draft-inquiry"><div class="inquiry-layout"><aside class="question-list"><h2>问题链</h2><button v-for="(title, index) in draft.questions" :key="title" :class="{ active: draftIndex === index }" @click="draftIndex = index"><span>0{{ index + 1 }}</span><strong>{{ title }}</strong><ArrowRight :size="15"/></button></aside><section class="question-content"><h2>{{ draft.questions[draftIndex] }}</h2><div class="method-note"><Lightbulb :size="21"/><p>需要的调查资料：{{ draft.needs }}。先明确比较对象和证据范围，再尝试提出解释。</p></div><label class="field-label" for="draft-idea">我的探究草记</label><textarea id="draft-idea" v-model="ideas[`${themeId}:${draftIndex}`]" rows="5" maxlength="2000" placeholder="记录观察计划、可能解释和需要补充的资料…"/><div class="form-actions"><RouterLink to="/library" class="button primary"><Search :size="16"/>查阅课程资料</RouterLink><button class="button secondary" @click="plan?.showModal()">制定研究计划<ArrowRight :size="16"/></button></div><p class="source-line">建议成果形式：{{ draft.product }}。</p></section></div></section>
  </template>
  <EvidenceWorkbench v-else-if="tab === 'workbench'" />
  <ArgumentBoard v-else @workbench="setTab('workbench')" @edit="resourceId => router.replace({ query: { ...route.query, tab: 'workbench', resource: resourceId } })" />
  <dialog ref="plan" class="standard-dialog" aria-labelledby="plan-title" @click="($event.target === plan) && plan?.close()"><div class="dialog-toolbar"><div><span class="eyebrow">RESEARCH PLAN</span><h2 id="plan-title">{{ theme.title }} · 我的研究计划</h2></div><button class="icon-button" aria-label="关闭研究计划" @click="plan?.close()"><X :size="20"/></button></div><p>建议成果：{{ draft.product }}</p><label class="field-label" for="research-plan">研究步骤、比较对象与资料分工</label><textarea id="research-plan" v-model="plans[themeId]" rows="8" maxlength="5000" placeholder="1. 我们想检验什么？&#10;2. 怎样选择比较对象？&#10;3. 需要哪些资料，由谁整理？&#10;4. 如何呈现解释与局限？"/><p class="save-caption">自动保存</p><div class="form-actions"><button class="button primary" @click="downloadText(`${theme.title}-研究计划.md`, `# ${theme.title}研究计划\n\n${plans[themeId] || '尚未填写'}`)"><Download :size="16"/>导出研究计划</button><button class="button secondary" @click="plan?.close()">完成</button></div></dialog>
</template>
