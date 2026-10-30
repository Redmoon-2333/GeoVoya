<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Check, ClipboardCheck, Download, NotebookPen, Save } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { request } from '../api'
import { notify, reportError } from '../notice'
import { useUnsaved } from '../useUnsaved'
import { localState } from '../localState'
import { methods, type MethodProgress } from '../course/methods'

const store = useFieldworkStore()
const bandNotes = localState<Record<string, string>>('band-notes', {})
const bandAttempts = localState<number>('band-attempts', 0)
const bandCheck = localState<boolean | null>('band-last-check', null)
const methodProgress = localState<MethodProgress>('methods-v3', { visited_card_ids: [], completed_question_ids: [], attempt_count: {} })
const text = ref(store.data?.reflection?.text || '')
const baseline = ref(text.value)
const dirty = computed(() => text.value !== baseline.value)
const saving = ref(false)
const saveError = ref('')
useUnsaved(dirty)
async function save() {
  saving.value = true
  saveError.value = ''
  const value = text.value
  try {
    await request('/reflection', { method: 'PUT', body: JSON.stringify({ text: value }) })
    await store.refresh()
    baseline.value = value
    notify('学习反思已保存。')
  } catch (cause) { saveError.value = cause instanceof Error ? cause.message : '保存未完成，请重试。'; reportError(cause) }
  finally { saving.value = false }
}
</script>

<template>
  <div class="page-heading"><div><span class="eyebrow">LEARNING REFLECTION</span><h1>学习反馈</h1></div><a href="/api/v1/report/export" class="button secondary" download><Download :size="16" />导出过程记录</a></div>
  <div class="feedback-summary"><span class="feedback-icon"><ClipboardCheck :size="30" /></span><div><span class="eyebrow">MY LEARNING JOURNEY</span><h2>已有 <strong>{{ store.feedback?.completed_steps }}</strong> 个环节留下学习材料</h2></div><div class="feedback-total"><strong>{{ store.feedback?.completed_steps }}<small> / 5</small></strong><span>环节已记录</span></div></div>
  <section class="common-feedback"><div><h2>望闻问切 · 方法学习</h2><p>入门任务 {{ methods.default_route.filter(id => methodProgress.completed_question_ids.includes(id)).length }} / {{ methods.default_route.length }} · 已阅读 {{ methodProgress.visited_card_ids.length }} 张知识卡</p></div><RouterLink to="/methods" class="text-link">回到方法学习<ArrowRight :size="16"/></RouterLink></section>
  <section class="common-feedback"><div><span class="eyebrow">COMMON FIELD STUDY</span><h2>共同考察 · 垂直地带性</h2><p>{{ Object.values(bandNotes).filter(n => n.trim()).length }} 个海拔带留有笔记 · 带谱检查 {{ bandAttempts }} 次</p></div><span class="status-tag" :class="{ green: bandCheck === true, amber: bandCheck === false }">{{ bandCheck === true ? '最近提交顺序正确' : bandCheck === false ? '带谱待修正' : '待提交检查' }}</span><RouterLink to="/explore?view=profile" class="text-link">回到带谱<ArrowRight :size="16"/></RouterLink></section>
  <section class="section-band"><div class="section-heading"><h2>我的研学过程</h2><span class="muted small">依据已保存材料更新</span></div><div class="feedback-steps"><RouterLink v-for="(step, index) in store.feedback?.steps" :key="step.id" :to="step.href" :class="{ done: step.done }"><span class="path-index"><Check v-if="step.done" :size="17" /><template v-else>{{ index + 1 }}</template></span><div><h3>{{ step.title }}</h3><p>{{ step.description }}</p></div><span class="status-tag" :class="{ green: step.done }">{{ step.done ? '已有记录' : '待补充' }}</span><ArrowRight :size="17" /></RouterLink></div></section>
  <div class="feedback-content"><section class="section-band dimension-section"><div class="section-heading"><h2>学习维度回看</h2></div><div v-for="item in store.feedback?.dimensions.filter(item => item.title !== '合作探究')" :key="item.title" class="dimension-row"><div><h3>{{ item.title }}</h3><p>{{ item.note }}</p></div><span class="status-tag">{{ item.status }}</span></div></section></div>
  <section class="section-band reflection-section"><form @submit.prevent="save"><div class="section-heading"><div class="section-title"><NotebookPen :size="21" /><h2>我的学习反思</h2></div><span v-if="dirty" class="status-tag amber">未保存</span></div><label class="reflection-prompt" for="reflection-text">哪一份证据改变了你的想法？还有什么问题值得继续调查？</label><textarea id="reflection-text" v-model="text" rows="5" maxlength="5000" :disabled="saving" placeholder="回看自己的观察、解释与变化……" /><p v-if="saveError" class="form-error" role="alert">{{ saveError }} 输入已保留，可再次保存。</p><div class="form-actions"><button type="submit" class="button primary" :disabled="saving"><Save :size="16" />保存反思</button><span class="muted small">{{ text.length }} / 5000</span></div></form></section>
</template>
