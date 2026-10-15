<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, Check, Compass, FileStack, FolderOpen, NotebookPen, Sprout } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { formatDate } from '../api'

const store = useFieldworkStore()
const next = computed(() => store.feedback?.steps.find((step) => !step.done))
const stats = computed(() => [
  { title: '观察记录', value: store.observations.length, icon: NotebookPen, href: '/explore' },
  { title: '发现收藏', value: store.favorites.length, icon: FolderOpen, href: '/archive' },
  { title: '论证板证据', value: store.board.length, icon: FileStack, href: '/archive?tab=board' },
])
</script>

<template>
  <section class="overview-banner">
    <img src="/media/forest-floor.webp" alt="团队拍摄的天目山林下植被、树干与地表" />
    <div class="overview-banner-content">
      <span class="overline">西天目山 · 自然地理考察</span>
      <h1>走进森林，寻找证据</h1>
      <p>柳杉衰退、群落变化与自然环境之间，<br class="desktop-break" />有怎样值得追问的联系？</p>
      <RouterLink :to="`/explore?node=${store.lastNode}`" class="button light"><Compass :size="17" />{{ store.observations.length ? '继续我的考察' : '开始实景观察' }}<ArrowRight :size="17" /></RouterLink>
    </div>
    <span class="photo-credit">团队实拍 · 普通照片</span>
  </section>
  <div class="overview-title"><div><span class="eyebrow">MY FIELD NOTES</span><h2>我的研学工作台</h2></div><span class="muted small">个人试学 · 本机保存</span></div>
  <div class="stats-row">
    <RouterLink v-for="stat in stats" :key="stat.title" :to="stat.href" class="stat-item"><span class="stat-icon"><component :is="stat.icon" :size="22" /></span><div><strong>{{ stat.value }}<small> 条</small></strong><span>{{ stat.title }}</span></div><ArrowRight :size="17" /></RouterLink>
  </div>
  <section class="section-band">
    <div class="section-heading"><div><span class="eyebrow">STUDY PATH</span><h2>从观察走向解释</h2></div><RouterLink to="/feedback" class="text-link">查看学习记录<ArrowRight :size="15" /></RouterLink></div>
    <div class="path-grid"><RouterLink v-for="(step, index) in store.feedback?.steps" :key="step.id" :to="step.href" class="path-step" :class="{ done: step.done }"><span class="path-index"><Check v-if="step.done" :size="17" /><template v-else>{{ String(index + 1).padStart(2, '0') }}</template></span><h3>{{ step.title }}</h3><p>{{ step.description }}</p><span class="path-state">{{ step.done ? '已有记录' : '待记录' }}<ArrowRight :size="14" /></span></RouterLink></div>
    <div class="next-action"><Compass :size="22" /><div><strong>{{ next ? `下一步 · ${next.title}` : '回看并完善你的解释' }}</strong><p>{{ next?.description || '检查证据与结论的关系，记录解释的变化。' }}</p></div><RouterLink :to="next?.href || '/feedback'" class="button secondary">前往<ArrowRight :size="16" /></RouterLink></div>
  </section>
  <section class="section-band">
    <div class="section-heading"><div><span class="eyebrow">RESEARCH TOPICS</span><h2>发现一个值得研究的问题</h2></div><span class="status-tag">1 个专题样板</span></div>
    <div class="topic-grid">
      <article v-for="(theme, index) in store.catalog?.themes" :key="theme.id" class="topic-card" :class="{ 'topic-pending': theme.status !== 'prototype' }">
        <span class="topic-number">0{{ index + 1 }}</span><Sprout :size="23" /><h3>{{ theme.title }}</h3><p>{{ theme.subtitle }}</p>
        <RouterLink v-if="theme.status === 'prototype'" to="/inquiry" class="text-link">进入专题<ArrowRight :size="15" /></RouterLink><span v-else class="muted small">课程资料待补充</span>
      </article>
    </div>
  </section>
  <section v-if="store.observations.length" class="section-band recent-notes"><div class="section-heading"><h2>最近的观察</h2><RouterLink to="/archive" class="text-link">全部档案<ArrowRight :size="15" /></RouterLink></div><RouterLink v-for="item in store.observations.slice(0, 2)" :key="item.id" :to="`/explore?node=${item.node_id}`" class="note-row"><NotebookPen :size="20" /><div><h3>{{ store.node(item.node_id).title }}</h3><p>{{ item.fact }}</p></div><time>{{ formatDate(item.updated_at) }}</time><ArrowRight :size="16" /></RouterLink></section>
</template>
