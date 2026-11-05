<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowRight, Check, Download, NotebookPen, Save } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { request } from '../api'
import { notify, reportError } from '../notice'
import { useUnsaved } from '../useUnsaved'
import { useStudyModules } from '../modules'

const store = useFieldworkStore()
const { modules, completed, currentTask, methodCount, observationDone, noteDone, lessonNotes } = useStudyModules()
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
  <div class="page-heading"><div><span class="eyebrow">MODULE 05 · LEARNING REFLECTION</span><h1>学习反馈</h1><p>回看记录、证据与判断变化，决定下一步还要查什么。</p></div><a href="/api/v1/report/export" class="button secondary" download><Download :size="16" />导出过程记录</a></div>

  <section class="feedback-summary" aria-label="基础任务进度">
    <div><span class="eyebrow">STUDY ROUTE</span><h2>已完成 <strong>{{ completed }}</strong> / 5 个基础任务</h2><p>这些状态只表示学习产出已保存，不是能力评分。</p></div>
    <progress :value="completed" max="5" aria-label="已完成的基础学习任务" />
    <RouterLink v-if="completed < 5" :to="currentTask.target" class="button secondary">{{ currentTask.title }}<ArrowRight :size="16" /></RouterLink>
  </section>

  <section class="section-band reflection-section">
    <form @submit.prevent="save">
      <div class="section-heading"><div class="section-title"><NotebookPen :size="21" /><h2>我的学习反思</h2></div><span v-if="dirty" class="status-tag amber">未保存</span></div>
      <label class="reflection-prompt" for="reflection-text">哪一份证据改变了你的想法？还有什么问题值得继续调查？</label>
      <textarea id="reflection-text" v-model="text" rows="5" maxlength="5000" :disabled="saving" placeholder="回看自己的观察、解释与变化……" />
      <p v-if="saveError" class="form-error" role="alert">{{ saveError }} 输入已保留，可再次保存。</p>
      <div class="form-actions"><button type="submit" class="button primary" :disabled="saving || !text.trim()"><Save :size="16" />保存反思</button><span class="muted small">{{ text.length }} / 5000</span></div>
    </form>
  </section>

  <section class="section-band module-progress" aria-labelledby="feedback-route-title">
    <div class="section-heading"><div><span class="eyebrow">YOUR WORK</span><h2 id="feedback-route-title">五步学习产出</h2></div></div>
    <div class="module-progress-list">
      <RouterLink v-for="item in modules" :key="item.id" :to="item.target" :class="{ done: item.done, recommended: item.id === currentTask.id && completed < 5 }">
        <span class="journey-number"><Check v-if="item.done" :size="15" /><template v-else>{{ item.number }}</template></span>
        <div><h3>{{ item.title }}</h3><p>{{ item.task }}</p><small v-if="item.id === 'explore'">实景观察：{{ observationDone ? '已保存' : '待记录' }} · 课程笔记：{{ noteDone ? '已保存' : '待记录' }}</small><small v-else>产出：{{ item.output }}</small></div>
        <span class="status-tag" :class="{ green: item.done }">{{ item.stateLabel }}</span><ArrowRight :size="17" />
      </RouterLink>
    </div>
  </section>

  <section v-if="lessonNotes.length" class="section-band lesson-recap">
    <div class="section-heading"><h2>地带性课程笔记</h2><RouterLink to="/archive" class="text-link">全部课程记录<ArrowRight :size="16" /></RouterLink></div>
    <RouterLink v-for="note in lessonNotes" :key="note.id" :to="`/geography/tianmu?page=${note.id}`" class="note-row"><NotebookPen :size="19" /><div><h3>{{ note.title }}</h3><p>{{ note.text }}</p></div><ArrowRight :size="16" /></RouterLink>
  </section>

  <details class="process-details">
    <summary>证据整理过程与记录明细</summary>
    <p class="muted small">回看观察、收藏、分析与引用的保存情况。</p>
    <div class="feedback-steps"><RouterLink v-for="(step, index) in store.feedback?.steps" :key="step.id" :to="step.href" :class="{ done: step.done }"><span class="path-index"><Check v-if="step.done" :size="17" /><template v-else>{{ index + 1 }}</template></span><div><h3>{{ step.title }}</h3><p>{{ step.description }}</p></div><span class="status-tag" :class="{ green: step.done }">{{ step.done ? '已有记录' : '待补充' }}</span><ArrowRight :size="17" /></RouterLink></div>
    <div class="process-counts"><span>观察 {{ store.feedback?.counts.observations || 0 }}</span><span>收藏 {{ store.feedback?.counts.favorites || 0 }}</span><span>证据分析 {{ store.feedback?.counts.analyses || 0 }}</span><span>论证板 {{ store.feedback?.counts.board || 0 }}</span><span>成果 {{ store.feedback?.counts.artifacts || 0 }}</span><span>入门题 {{ methodCount }} / 10</span></div>
    <div class="dimension-list"><div v-for="item in store.feedback?.dimensions.filter(item => item.title !== '合作探究')" :key="item.title"><h3>{{ item.title }}</h3><p>{{ item.note }}</p><span class="status-tag">{{ item.status }}</span></div></div>
  </details>
</template>
