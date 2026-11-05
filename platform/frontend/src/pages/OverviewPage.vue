<script setup lang="ts">
import { computed } from 'vue'
import { ArrowRight, BookOpenCheck, Compass, FileStack, FolderOpen, NotebookPen } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { formatDate } from '../api'
import { introVideos } from '../course/introVideos'
import { studyModules, studyTools, useStudyModules } from '../modules'
import IntroVideo from '../components/IntroVideo.vue'
import { onboarding, skip, start } from '../onboarding'

const store = useFieldworkStore()
const { modules, completed, status } = useStudyModules()
const stats = computed(() => [
  { title: '观察记录', value: store.observations.length, icon: NotebookPen, href: '/explore' },
  { title: '发现收藏', value: store.favorites.length, icon: FolderOpen, href: '/archive' },
  { title: '论证板证据', value: store.board.length, icon: FileStack, href: '/inquiry?tab=board' },
])
</script>

<template>
  <section class="overview-banner">
    <img :src="'/media/forest-floor.webp'" alt="团队拍摄的天目山林下植被、树干与地表" />
    <div class="overview-banner-content">
      <span class="overline">西天目山 · 自然地理考察</span>
      <h1>走进森林，寻找证据</h1>
      <p>柳杉衰退、群落变化与自然环境之间，<br class="desktop-break" />有怎样值得追问的联系？</p>
      <RouterLink :to="`/explore?node=${store.lastNode}`" class="button light"><Compass :size="17" />{{ store.observations.length ? '继续我的考察' : '开始实景观察' }}<ArrowRight :size="17" /></RouterLink>
    </div>
    <span class="photo-credit">团队实拍 · 普通照片</span>
  </section>
  <section v-if="onboarding.status === 'new'" class="section-band welcome-card" aria-labelledby="welcome-title">
    <div class="welcome-icon"><BookOpenCheck :size="26" /></div>
    <div class="welcome-copy">
      <span class="eyebrow">FIRST VISIT</span>
      <h2 id="welcome-title">第一次来？跟着引导走一遍</h2>
      <p>用大约三分钟，依次看一看导航、观察、探究、成果和反馈这几个环节，先熟悉怎么操作，再自己开始研学。</p>
    </div>
    <div class="welcome-actions">
      <button class="button primary" @click="start()"><BookOpenCheck :size="17" />开始引导</button>
      <button class="button subtle" @click="skip()">以后再说</button>
    </div>
  </section>
  <section class="section-band intro-videos">
    <div class="section-heading"><div><span class="eyebrow">INTRO VIDEOS</span><h2>先看一看，再出发</h2></div><span class="muted small">视频整理中，封面来自团队实拍</span></div>
    <div class="intro-video-grid"><IntroVideo v-for="video in introVideos" :key="video.id" :video="video" /></div>
  </section>
  <section class="section-band">
    <div class="section-heading"><div><span class="eyebrow">STUDY ROUTE</span><h2>五个研学板块</h2></div><span class="muted small">已完成 {{ completed }} / {{ studyModules.length }}</span></div>
    <div class="module-grid">
      <RouterLink v-for="item in modules" :key="item.id" :to="item.path" class="module-card" :class="{ done: item.done }"><span class="module-number">{{ item.number }}</span><component :is="item.icon" :size="23" /><h3>{{ item.title }}</h3><p>{{ item.task }}</p><span class="module-footer"><span class="status-tag" :class="{ green: item.done }">{{ status(item.id) }}</span><span class="text-link">进入板块<ArrowRight :size="15" /></span></span></RouterLink>
    </div>
  </section>
  <section class="module-tools" aria-label="研学工具"><RouterLink v-for="tool in studyTools" :key="tool.path" :to="tool.path"><component :is="tool.icon" :size="21" /><span>{{ tool.title }}</span><ArrowRight :size="16" /></RouterLink></section>
  <div class="overview-title"><div><span class="eyebrow">MY FIELD NOTES</span><h2>我的研学工作台</h2></div><span class="muted small">个人试学 · 本机保存</span></div>
  <div class="stats-row">
    <RouterLink v-for="stat in stats" :key="stat.title" :to="stat.href" class="stat-item"><span class="stat-icon"><component :is="stat.icon" :size="22" /></span><div><strong>{{ stat.value }}<small> 条</small></strong><span>{{ stat.title }}</span></div><ArrowRight :size="17" /></RouterLink>
  </div>
  <section v-if="store.observations.length" class="section-band recent-notes"><div class="section-heading"><h2>最近的观察</h2><RouterLink to="/archive" class="text-link">全部档案<ArrowRight :size="15" /></RouterLink></div><RouterLink v-for="item in store.observations.slice(0, 2)" :key="item.id" :to="`/explore?node=${item.node_id}`" class="note-row"><NotebookPen :size="20" /><div><h3>{{ store.node(item.node_id).title }}</h3><p>{{ item.fact }}</p></div><time>{{ formatDate(item.updated_at) }}</time><ArrowRight :size="16" /></RouterLink></section>
</template>
