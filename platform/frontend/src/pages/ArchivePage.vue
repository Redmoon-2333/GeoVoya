<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onBeforeRouteUpdate, useRoute, useRouter } from 'vue-router'
import { ArrowRight, Bookmark, Check, ClipboardList, ExternalLink, FileStack, FolderOpen, NotebookPen, Save, Search } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { formatDate } from '../api'
import { notify, reportError } from '../notice'
import { useUnsaved } from '../useUnsaved'
import type { AnalysisFields } from '../types'

const store = useFieldworkStore()
const route = useRoute()
const router = useRouter()
const tab = ref('collection')
const selectedId = ref('')
const search = ref('')
const saving = ref(false)
const saveError = ref('')
const form = reactive<AnalysisFields>({ favorite_id: '', theme_id: 'cryptomeria', question_id: 'symptoms', observed: '', meaning: '', missing: '', role: 'uncertain', scope: '', on_board: false })
const baseline = ref(JSON.stringify(form))
const dirty = computed(() => JSON.stringify(form) !== baseline.value)
const confirmLeave = useUnsaved(dirty)
const selected = computed(() => store.favorites.find((item) => item.id === selectedId.value))
const source = computed(() => selected.value ? store.resource(selected.value.resource_id) : undefined)
const complete = computed(() => !!(form.observed.trim() && form.meaning.trim() && form.missing.trim()))
const filtered = computed(() => store.favorites.filter((item) => store.resource(item.resource_id).title.includes(search.value.trim())))
const roles = { uncertain: '暂不判断', support: '支持解释', weaken: '削弱解释', background: '背景资料' }

function load(id: string) {
  selectedId.value = id
  const existing = store.analyses.find((item) => item.favorite_id === id)
  const queryQuestion = typeof route.query.question === 'string' && store.theme!.questions.some((item) => item.id === route.query.question) ? route.query.question : 'symptoms'
  Object.assign(form, { favorite_id: id, theme_id: 'cryptomeria', question_id: existing?.question_id || queryQuestion, observed: existing?.observed || '', meaning: existing?.meaning || '', missing: existing?.missing || '', role: existing?.role || 'uncertain', scope: existing?.scope || '', on_board: existing?.on_board || false })
  baseline.value = JSON.stringify(form)
}
watch(() => route.query, () => {
  tab.value = ['workbench', 'board'].includes(String(route.query.tab)) ? String(route.query.tab) : 'collection'
  const resourceId = typeof route.query.resource === 'string' ? route.query.resource : ''
  load(store.favorites.find((item) => item.resource_id === resourceId)?.id || selectedId.value || store.favorites[0]?.id || '')
}, { immediate: true })
onBeforeRouteUpdate(() => confirmLeave())
function select(id: string) { if (!saving.value && confirmLeave()) load(id) }
function setTab(value: string) { router.replace({ query: { ...route.query, tab: value } }) }
function edit(id: string) { router.replace({ query: { tab: 'workbench', resource: id } }) }
async function save(onBoard: boolean) {
  const values = { ...form, on_board: onBoard }
  saving.value = true
  saveError.value = ''
  try {
    await store.saveAnalysis(values)
    form.on_board = onBoard
    baseline.value = JSON.stringify(values)
    notify(onBoard ? '证据分析已保存并加入论证板。' : '分析草稿已保存。')
  } catch (cause) { saveError.value = cause instanceof Error ? cause.message : '保存未完成，请重试。'; reportError(cause) }
  finally { saving.value = false }
}
</script>

<template>
  <div class="page-heading"><div><span class="eyebrow">FIELDWORK ARCHIVE</span><h1>科考档案馆</h1><p>从发现到证据，再到有依据的解释。</p></div><RouterLink to="/explore" class="button secondary">继续观察<ArrowRight :size="16" /></RouterLink></div>
  <div class="archive-tabs tab-bar" role="tablist" aria-label="档案馆分区"><button role="tab" :aria-selected="tab === 'collection'" :class="{ active: tab === 'collection' }" @click="setTab('collection')"><Bookmark :size="18" />发现收藏<span class="count-badge">{{ store.favorites.length }}</span></button><button role="tab" :aria-selected="tab === 'workbench'" :class="{ active: tab === 'workbench' }" @click="setTab('workbench')"><ClipboardList :size="18" />证据工作台</button><button role="tab" :aria-selected="tab === 'board'" :class="{ active: tab === 'board' }" @click="setTab('board')"><FileStack :size="18" />研究论证板<span class="count-badge">{{ store.board.length }}</span></button></div>
  <template v-if="tab === 'collection'">
    <section class="section-band"><div class="section-heading"><h2>我的发现收藏</h2><label class="search-field"><Search :size="17" /><input v-model="search" aria-label="搜索收藏" placeholder="搜索资料名称" /></label></div>
      <div v-if="filtered.length" class="resource-grid"><article v-for="item in filtered" :key="item.id" class="resource-card"><RouterLink :to="`/explore?node=${store.resource(item.resource_id).node_id}`" class="resource-image"><img :src="store.resource(item.resource_id).thumbnail" :alt="store.resource(item.resource_id).title" /><span class="media-tag">实景照片</span></RouterLink><div class="resource-content"><span class="status-tag" :class="{ green: store.analyses.some((analysis) => analysis.favorite_id === item.id) }">{{ store.analyses.some((analysis) => analysis.favorite_id === item.id) ? '已有分析' : '等待分析' }}</span><h3>{{ store.resource(item.resource_id).title }}</h3><p class="resource-source">{{ item.source }}</p><div class="resource-actions"><span class="muted small">{{ formatDate(item.created_at) }}</span><button class="text-link" @click="edit(item.resource_id)">分析资料<ArrowRight :size="15" /></button></div></div></article></div>
      <div v-else class="empty-state"><FolderOpen :size="38" :stroke-width="1.3" /><h3>{{ search ? '没有匹配的收藏' : '发现收藏还是空的' }}</h3><p>{{ search ? '试试另一个资料名称。' : '从实景照片中发现值得研究的细节。' }}</p><RouterLink v-if="!search" to="/explore" class="button primary">前往实景观察<ArrowRight :size="16" /></RouterLink></div>
    </section>
    <section class="section-band"><div class="section-heading"><h2>我的观察记录</h2><span class="muted small">{{ store.observations.length }} 条</span></div><div v-if="!store.observations.length" class="inline-empty"><NotebookPen :size="22" /><span>尚无独立观察记录</span></div><RouterLink v-for="item in store.observations" :key="item.id" :to="`/explore?node=${item.node_id}`" class="note-row"><NotebookPen :size="21" /><div><h3>{{ store.node(item.node_id).title }}</h3><p>{{ item.fact }}</p><span class="muted small">{{ item.question ? `疑问：${item.question}` : '尚未记录疑问' }}</span></div><time>{{ formatDate(item.updated_at) }}</time><ArrowRight :size="16" /></RouterLink></section>
  </template>
  <template v-else-if="tab === 'workbench'">
    <div v-if="!store.favorites.length" class="empty-state"><ClipboardList :size="40" :stroke-width="1.3" /><h2>先选择一份研究资料</h2><p>尚无收藏资料，证据工作台等待你的第一份发现。</p><RouterLink to="/explore" class="button primary">前往观察并收藏<ArrowRight :size="16" /></RouterLink></div>
    <div v-else class="workbench-layout"><aside class="workbench-sources"><h2>待分析的资料</h2><button v-for="item in store.favorites" :key="item.id" :class="{ active: selectedId === item.id }" :disabled="saving" @click="select(item.id)"><img :src="store.resource(item.resource_id).thumbnail" alt="" /><span><strong>{{ store.resource(item.resource_id).title }}</strong><small>{{ store.analyses.some((analysis) => analysis.favorite_id === item.id && analysis.on_board) ? '已加入论证板' : '证据分析' }}</small></span><Check v-if="selectedId === item.id" :size="16" /></button></aside>
      <form v-if="source" class="analysis-form" @submit.prevent="save(form.on_board)"><div class="section-heading"><div><span class="eyebrow">EVIDENCE WORKBENCH</span><h2>{{ source.title }}</h2></div><span v-if="dirty" class="status-tag amber">未保存</span></div><RouterLink :to="`/explore?node=${source.node_id}`" class="text-link small">回看原始照片<ExternalLink :size="14" /></RouterLink>
        <fieldset :disabled="saving"><label class="field-label" for="analysis-question">关联研究子问题</label><select id="analysis-question" v-model="form.question_id"><option v-for="item in store.theme?.questions" :key="item.id" :value="item.id">{{ item.title }}</option></select><label class="field-label" for="analysis-observed">01 <span>这份资料展示了什么？</span></label><textarea id="analysis-observed" v-model="form.observed" rows="3" maxlength="4000" placeholder="记录可以直接核查的事实……" /><label class="field-label" for="analysis-meaning">02 <span>它与研究问题有什么关系？</span></label><textarea id="analysis-meaning" v-model="form.meaning" rows="3" maxlength="4000" placeholder="区分资料本身与自己的推理……" /><label class="field-label" for="analysis-missing">03 <span>还缺少什么证据？</span></label><textarea id="analysis-missing" v-model="form.missing" rows="3" maxlength="4000" placeholder="哪些比较、时间信息或现场调查仍需补充？" /><div class="field-pair"><div><label class="field-label" for="analysis-role">在解释中的作用</label><select id="analysis-role" v-model="form.role"><option v-for="(title, value) in roles" :key="value" :value="value">{{ title }}</option></select></div><div><label class="field-label" for="analysis-scope">适用范围</label><input id="analysis-scope" v-model="form.scope" maxlength="4000" placeholder="如：仅适用于当前画面" /></div></div></fieldset>
        <p v-if="saveError" class="form-error" role="alert">{{ saveError }} 输入已保留，可再次保存。</p><p class="source-line">来源：{{ selected?.source }} · {{ selected?.source_version }}</p><div class="form-actions"><button type="submit" class="button secondary" :disabled="saving"><Save :size="16" />保存分析</button><button type="button" class="button primary" :disabled="saving || !complete" @click="save(true)"><FileStack :size="16" />{{ form.on_board ? '更新论证板证据' : '保存并加入论证板' }}</button><button v-if="form.on_board" type="button" class="text-link muted" :disabled="saving" @click="save(false)">移出论证板</button></div>
      </form></div>
  </template>
  <template v-else>
    <div class="section-heading board-heading"><div><span class="eyebrow">RESEARCH ARGUMENT BOARD</span><h2>柳杉衰退 · 我的证据链</h2></div><RouterLink v-if="store.board.length" to="/outcomes" class="button primary">形成成果<ArrowRight :size="16" /></RouterLink></div>
    <div v-if="!store.board.length" class="empty-state"><FileStack :size="40" :stroke-width="1.3" /><h2>还没有组织好的证据</h2><p>分析完成的资料会在这里与研究问题建立联系。</p><button class="button secondary" @click="setTab('workbench')">前往证据工作台<ArrowRight :size="16" /></button></div>
    <div v-else class="argument-list"><article v-for="item in store.board" :key="item.id" class="argument-item"><div class="argument-head"><img :src="store.resource(item.favorite_id).thumbnail" alt="" /><div><span class="status-tag" :class="{ green: item.role === 'support', amber: item.role === 'uncertain' }">{{ roles[item.role] }}</span><h3>{{ store.resource(item.favorite_id).title }}</h3><span class="muted small">{{ store.theme?.questions.find((question) => question.id === item.question_id)?.title }}</span></div><button class="text-link" @click="edit(item.favorite_id)">修改分析<ArrowRight :size="15" /></button></div><dl class="argument-details"><div><dt>可见事实</dt><dd>{{ item.observed }}</dd></div><div><dt>研究含义</dt><dd>{{ item.meaning }}</dd></div><div><dt>待补证据</dt><dd>{{ item.missing }}</dd></div></dl><p class="source-line">适用范围：{{ item.scope || '尚未单独说明' }} · {{ store.resource(item.favorite_id).filename }}</p></article></div>
  </template>
</template>
