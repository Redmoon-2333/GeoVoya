<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { CheckCircle2, NotebookPen, Save } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { formatDate } from '../api'
import { notify, reportError } from '../notice'

const props = defineProps<{ nodeId: string }>()
const emit = defineEmits<{ dirty: [value: boolean] }>()
const store = useFieldworkStore()
const fact = ref('')
const evidence = ref('')
const question = ref('')
const saving = ref(false)
const baseline = ref('')
const saved = computed(() => store.observations.find((item) => item.node_id === props.nodeId))
const snapshot = computed(() => JSON.stringify([fact.value, evidence.value, question.value]))
const dirty = computed(() => snapshot.value !== baseline.value)

watch(() => props.nodeId, () => {
  fact.value = saved.value?.fact || ''
  evidence.value = saved.value?.evidence || ''
  question.value = saved.value?.question || ''
  baseline.value = snapshot.value
}, { immediate: true })
watch(dirty, (value) => emit('dirty', value))

async function save() {
  saving.value = true
  const values = { node_id: props.nodeId, fact: fact.value, evidence: evidence.value, question: question.value }
  try {
    await store.saveObservation(values)
    if (props.nodeId === values.node_id) baseline.value = JSON.stringify([values.fact, values.evidence, values.question])
    notify('观察记录已保存，可继续补充。')
  } catch (cause) {
    reportError(cause)
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <form class="observation-form" @submit.prevent="save">
    <div class="section-title"><NotebookPen :size="20" /><h2>我的观察记录</h2><span v-if="dirty" class="status-tag amber">未保存</span></div>
    <p class="muted small form-intro">关联素材 · {{ store.node(nodeId).title }}</p>
    <fieldset :disabled="saving">
    <label class="field-label" for="observation-fact">01 <span>我观察到了什么？<span class="required-mark"> *</span></span></label>
    <textarea id="observation-fact" v-model="fact" rows="4" maxlength="4000" required placeholder="写下能在照片中直接看到的细节……" />
    <label class="field-label" for="observation-evidence">02 <span>我的观察依据</span></label>
    <textarea id="observation-evidence" v-model="evidence" rows="3" maxlength="4000" placeholder="在画面的哪个位置？有哪些可辨认特征？" />
    <label class="field-label" for="observation-question">03 <span>我的疑问与初步解释</span></label>
    <textarea id="observation-question" v-model="question" rows="3" maxlength="4000" placeholder="哪些还不能确定？想进一步比较什么？" />
    </fieldset>
    <button class="button primary full" type="submit" :disabled="saving || !fact.trim()"><Save :size="16" />{{ saving ? '保存中…' : '保存观察' }}</button>
    <p class="save-caption"><CheckCircle2 :size="14" /><span>{{ saved ? `上次保存 ${formatDate(saved.updated_at)}` : '保存后可在档案馆中回看' }}</span></p>
  </form>
</template>
