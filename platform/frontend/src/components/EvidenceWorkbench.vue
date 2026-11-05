<script setup lang="ts">
import { computed, reactive, ref, watch } from 'vue'
import { onBeforeRouteUpdate, useRoute } from 'vue-router'
import { ArrowRight, Check, ClipboardList, ExternalLink, FileStack, Save } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { notify, reportError } from '../notice'
import { useUnsaved } from '../useUnsaved'
import type { AnalysisFields } from '../types'

const store = useFieldworkStore()
const route = useRoute()
const selectedId = ref('')
const saving = ref(false)
const saveError = ref('')
const form = reactive<AnalysisFields>({ favorite_id: '', theme_id: 'cryptomeria', question_id: 'symptoms', observed: '', meaning: '', missing: '', role: 'uncertain', scope: '', on_board: false })
const baseline = ref(JSON.stringify(form))
const dirty = computed(() => JSON.stringify(form) !== baseline.value)
const confirmLeave = useUnsaved(dirty)
const selected = computed(() => store.favorites.find((item) => item.id === selectedId.value))
const source = computed(() => selected.value ? store.resource(selected.value.resource_id) : undefined)
const complete = computed(() => !!(form.observed.trim() && form.meaning.trim() && form.missing.trim()))
const roles = { uncertain: '暂不判断', support: '支持解释', weaken: '削弱解释', background: '背景资料' }

function load(id: string) {
  selectedId.value = id
  const existing = store.analyses.find((item) => item.favorite_id === id)
  const queryQuestion = typeof route.query.question === 'string' && store.theme!.questions.some((item) => item.id === route.query.question) ? route.query.question : 'symptoms'
  Object.assign(form, { favorite_id: id, theme_id: 'cryptomeria', question_id: existing?.question_id || queryQuestion, observed: existing?.observed || '', meaning: existing?.meaning || '', missing: existing?.missing || '', role: existing?.role || 'uncertain', scope: existing?.scope || '', on_board: existing?.on_board || false })
  baseline.value = JSON.stringify(form)
}
watch(() => route.query, (query, previous) => {
  const resourceChanged = query.resource !== previous?.resource
  const questionChanged = query.question !== previous?.question
  if (selectedId.value && !resourceChanged && !questionChanged) return
  const resourceId = typeof query.resource === 'string' ? query.resource : ''
  load(store.favorites.find((item) => item.resource_id === resourceId)?.id || selectedId.value || store.favorites[0]?.id || '')
}, { immediate: true })
onBeforeRouteUpdate(() => confirmLeave())
function select(id: string) { if (!saving.value && confirmLeave()) load(id) }
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
  <div v-if="!store.favorites.length" class="empty-state"><ClipboardList :size="40" :stroke-width="1.3" /><h2>先选择一份研究资料</h2><p>尚无收藏资料，证据工作台等待你的第一份发现。</p><RouterLink to="/explore" class="button primary">前往观察并收藏<ArrowRight :size="16" /></RouterLink></div>
  <div v-else class="workbench-layout"><aside class="workbench-sources"><h2>待分析的资料</h2><button v-for="item in store.favorites" :key="item.id" :class="{ active: selectedId === item.id }" :disabled="saving" @click="select(item.id)"><img :src="store.resource(item.resource_id).thumbnail" alt="" /><span><strong>{{ store.resource(item.resource_id).title }}</strong><small>{{ store.analyses.some((analysis) => analysis.favorite_id === item.id && analysis.on_board) ? '已加入论证板' : '证据分析' }}</small></span><Check v-if="selectedId === item.id" :size="16" /></button></aside>
    <form v-if="source" class="analysis-form" @submit.prevent="save(form.on_board)"><div class="section-heading"><div><span class="eyebrow">EVIDENCE WORKBENCH</span><h2>{{ source.title }}</h2></div><span v-if="dirty" class="status-tag amber">未保存</span></div><RouterLink :to="`/explore?node=${source.node_id}`" class="text-link small">回看原始照片<ExternalLink :size="14" /></RouterLink>
      <fieldset :disabled="saving"><label class="field-label" for="analysis-question">关联研究子问题</label><select id="analysis-question" v-model="form.question_id"><option v-for="item in store.theme?.questions" :key="item.id" :value="item.id">{{ item.title }}</option></select><label class="field-label" for="analysis-observed">01 <span>这份资料展示了什么？</span></label><textarea id="analysis-observed" v-model="form.observed" rows="3" maxlength="4000" placeholder="记录可以直接核查的事实……" /><label class="field-label" for="analysis-meaning">02 <span>它与研究问题有什么关系？</span></label><textarea id="analysis-meaning" v-model="form.meaning" rows="3" maxlength="4000" placeholder="区分资料本身与自己的推理……" /><label class="field-label" for="analysis-missing">03 <span>还缺少什么证据？</span></label><textarea id="analysis-missing" v-model="form.missing" rows="3" maxlength="4000" placeholder="哪些比较、时间信息或现场调查仍需补充？" /><div class="field-pair"><div><label class="field-label" for="analysis-role">在解释中的作用</label><select id="analysis-role" v-model="form.role"><option v-for="(title, value) in roles" :key="value" :value="value">{{ title }}</option></select></div><div><label class="field-label" for="analysis-scope">适用范围</label><input id="analysis-scope" v-model="form.scope" maxlength="4000" placeholder="如：仅适用于当前画面" /></div></div></fieldset>
      <p v-if="saveError" class="form-error" role="alert">{{ saveError }} 输入已保留，可再次保存。</p><p class="source-line">来源：{{ selected?.source }} · {{ selected?.source_version }}</p><div class="form-actions"><button type="submit" class="button secondary" :disabled="saving"><Save :size="16" />保存分析</button><button type="button" class="button primary" :disabled="saving || !complete" @click="save(true)"><FileStack :size="16" />{{ form.on_board ? '更新论证板证据' : '保存并加入论证板' }}</button><button v-if="form.on_board" type="button" class="text-link muted" :disabled="saving" @click="save(false)">移出论证板</button></div>
    </form></div>
</template>
