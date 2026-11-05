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
const { modules, completed, currentTask } = useStudyModules()
const availableVideos = introVideos.filter(video => !!video.src)
const allComplete = computed(() => completed.value === studyModules.length)
const taskAction = computed(() => {
  if (allComplete.value) return '回看学习反馈'
  const item = currentTask.value
  if (item.id === 'explore') return item.target.startsWith('/geography') ? '继续地带性学习' : item.state === 'in_progress' ? '继续实景观察' : '开始山地观察'
  if (item.id === 'inquiry' && !store.favorites.length) return '查看柳杉研究问题'
  if (item.id === 'inquiry') return '继续整理证据'
  if (item.id === 'outcomes' && store.artifacts.length) return '继续完善研究成果'
  if (item.id === 'methods') return item.state === 'in_progress' ? '继续方法学习' : '开始方法学习'
  return item.state === 'in_progress' ? `继续${item.title}` : `开始${item.title}`
})
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
    </div>
    <span class="photo-credit">团队实拍 · 普通照片</span>
  </section>

  <section v-if="onboarding.status === 'new'" class="welcome-strip" aria-labelledby="welcome-title">
    <div>
      <span class="eyebrow">FIRST VISIT</span>
      <h2 id="welcome-title">第一次来？三步熟悉研学路线和工具</h2>
    </div>
    <div class="welcome-actions">
      <button class="button secondary compact" @click="start()"><BookOpenCheck :size="16" />查看引导</button>
      <button class="text-link" @click="skip()">直接开始<ArrowRight :size="15" /></button>
    </div>
  </section>

  <section id="current-task" class="current-task" aria-labelledby="current-task-title">
    <div class="current-task-copy">
      <span class="eyebrow">{{ allComplete ? 'FIELD STUDY · REVIEW' : `FIELD STUDY · ${currentTask.number}` }}</span>
      <h2 id="current-task-title">{{ allComplete ? '五个基础任务都已完成' : currentTask.title }}</h2>
      <p>{{ allComplete ? '回看自己的记录、证据与判断变化。' : currentTask.task }}</p>
      <span class="current-task-output"><strong>本步产出</strong>{{ currentTask.output }}</span>
    </div>
    <RouterLink :to="allComplete ? '/feedback' : currentTask.target" class="button primary">
      <Compass :size="17" />{{ taskAction }}<ArrowRight :size="17" />
    </RouterLink>
  </section>

  <section class="section-band study-route" aria-labelledby="study-route-title">
    <div class="section-heading">
      <div><span class="eyebrow">STUDY ROUTE</span><h2 id="study-route-title">从观察到解释</h2></div>
      <span class="muted small">基础任务完成 {{ completed }} / {{ studyModules.length }}</span>
    </div>
    <div id="study-route" class="module-grid">
      <RouterLink v-for="item in modules" :key="item.id" :to="item.target" class="module-card"
        :class="{ done: item.done, recommended: !allComplete && currentTask.id === item.id }">
        <span class="module-number">{{ item.number }}</span>
        <component :is="item.icon" :size="21" />
        <h3>{{ item.title }}</h3>
        <p>{{ item.task }}</p>
        <span class="module-output">{{ item.output }}</span>
        <span class="module-footer"><span class="status-tag" :class="{ green: item.done }">{{ item.stateLabel }}</span><span class="text-link">查看<ArrowRight :size="15" /></span></span>
      </RouterLink>
    </div>
  </section>

  <section v-if="availableVideos.length" class="section-band intro-videos">
    <div class="section-heading"><div><span class="eyebrow">FIELD STUDY</span><h2>考察导览</h2></div></div>
    <div class="intro-video-grid"><IntroVideo v-for="video in availableVideos" :key="video.id" :video="video" /></div>
  </section>

  <nav id="module-tools" class="module-tools" aria-label="研学工具">
    <RouterLink v-for="tool in studyTools" :key="tool.path" :to="tool.path"><component :is="tool.icon" :size="19" /><span>{{ tool.title }}</span><ArrowRight :size="16" /></RouterLink>
  </nav>

  <div class="overview-title"><div><span class="eyebrow">MY FIELD NOTES</span><h2>我的研学记录</h2></div><span class="muted small">个人试学 · 本机保存</span></div>
  <div class="stats-row">
    <RouterLink v-for="stat in stats" :key="stat.title" :to="stat.href" class="stat-item"><span class="stat-icon"><component :is="stat.icon" :size="22" /></span><div><strong>{{ stat.value }}<small> 条</small></strong><span>{{ stat.title }}</span></div><ArrowRight :size="17" /></RouterLink>
  </div>
  <section v-if="store.observations.length" class="section-band recent-notes"><div class="section-heading"><h2>最近的观察</h2><RouterLink to="/archive" class="text-link">全部档案<ArrowRight :size="15" /></RouterLink></div><RouterLink v-for="item in store.observations.slice(0, 2)" :key="item.id" :to="`/explore?node=${item.node_id}`" class="note-row"><NotebookPen :size="20" /><div><h3>{{ store.node(item.node_id).title }}</h3><p>{{ item.fact }}</p></div><time>{{ formatDate(item.updated_at) }}</time><ArrowRight :size="16" /></RouterLink></section>
</template>
