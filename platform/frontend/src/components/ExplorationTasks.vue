<script setup lang="ts">
import { CheckCircle2, Circle, ArrowRight } from 'lucide-vue-next'
import { useStudyModules } from '../modules'
import { useFieldworkStore } from '../stores/fieldwork'

const store = useFieldworkStore()
const { observationDone, noteDone } = useStudyModules()
</script>

<template>
  <section class="exploration-tasks" aria-label="山地观察产出">
    <strong>本步产出<span>两项都要保存</span></strong>
    <RouterLink :to="{ path: '/explore', query: { node: store.lastNode } }">
      <CheckCircle2 v-if="observationDone" :size="17" /><Circle v-else :size="17" />
      <span>实景观察<small>{{ observationDone ? '已保存' : '待记录' }}</small></span><ArrowRight :size="14" />
    </RouterLink>
    <RouterLink to="/geography/tianmu?page=VE03">
      <CheckCircle2 v-if="noteDone" :size="17" /><Circle v-else :size="17" />
      <span>地带性课程笔记<small>{{ noteDone ? '已保存' : '待记录' }}</small></span><ArrowRight :size="14" />
    </RouterLink>
  </section>
</template>
