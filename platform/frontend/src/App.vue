<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ArrowRight, BookOpenCheck, Check, CheckCircle2, ChevronRight, Compass, Leaf, Menu, Mountain,
  PanelLeftClose, RotateCw, X,
} from 'lucide-vue-next'
import { useFieldworkStore } from './stores/fieldwork'
import { notice } from './notice'
import GuidePanel from './components/GuidePanel.vue'
import OnboardingTour from './components/OnboardingTour.vue'
import { focusIfActive } from './focus'
import { rememberStudyLocation, studyModules, studyTools, useStudyModules } from './modules'
import { start } from './onboarding'

const store = useFieldworkStore()
const route = useRoute()
const sidebarOpen = ref(false)
const sidebar = ref<HTMLElement>(), menuButton = ref<HTMLButtonElement>()
const { modules, completed, next } = useStudyModules()
const activeModule = computed(() => modules.value.find(item => item.matches(route.path)))
watch(sidebarOpen, async open => { await nextTick(); if (open) requestAnimationFrame(() => { if (sidebarOpen.value) focusIfActive(sidebar.value?.querySelector<HTMLAnchorElement>('a')) }); else focusIfActive(menuButton.value) })
function trapNavigation(event: KeyboardEvent) {
  if (!sidebarOpen.value) return
  if (event.key === 'Escape') { event.preventDefault(); sidebarOpen.value = false; return }
  if (event.key !== 'Tab') return
  const elements = sidebar.value?.querySelectorAll<HTMLElement>('a, button')
  if (!elements?.length) return
  const first = elements[0], last = elements[elements.length - 1]
  if (!sidebar.value?.contains(document.activeElement)) { event.preventDefault(); first?.focus(); return }
  if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last?.focus() }
  if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus() }
}
watch(() => route.fullPath, async () => {
  await nextTick()
  rememberStudyLocation(route.fullPath)
  if (sidebarOpen.value) sidebarOpen.value = false
}, { immediate: true })
onMounted(() => { store.initialize(); document.addEventListener('keydown', trapNavigation) })
onBeforeUnmount(() => document.removeEventListener('keydown', trapNavigation))
</script>

<template>
  <a href="#main-content" class="skip-link">跳到主要内容</a>
  <header class="app-header" :class="{ 'geography-header': route.path.startsWith('/geography') }">
    <div class="brand-wrap">
      <button ref="menuButton" class="icon-button mobile-menu" title="打开研学导航" aria-label="打开研学导航" :aria-expanded="sidebarOpen" aria-controls="study-navigation" @click="sidebarOpen = !sidebarOpen">
        <Menu :size="21" />
      </button>
      <RouterLink to="/" class="brand" aria-label="天目寻境，课程入口">
        <span class="brand-mark"><Mountain :size="37" :stroke-width="1.6" /><Leaf :size="17" class="brand-leaf" /></span>
        <span><strong>天目<span class="brand-dot">·</span>寻境</strong><small>西天目山自然地理研学</small></span>
      </RouterLink>
    </div>
    <span class="mobile-current-stage"><component :is="activeModule?.icon || Compass" :size="15" />{{ activeModule ? `${activeModule.number} ${activeModule.title}` : String(route.meta.title || '课程入口') }}</span>
    <div class="header-account"><div class="guide-header-slot"><GuidePanel /></div></div>
  </header>

  <div v-if="store.loading" class="app-status"><RotateCw class="spin" :size="28" /><h1>正在打开研学档案</h1></div>
  <div v-else-if="store.error" class="app-status" role="alert">
    <Mountain :size="40" /><h1>暂时无法打开档案</h1><p>{{ store.error }}</p>
    <button class="button primary" @click="store.initialize()"><RotateCw :size="16" />重新连接</button>
  </div>
  <div v-else class="app-layout">
    <div v-if="sidebarOpen" class="sidebar-backdrop" @click="sidebarOpen = false" />
    <aside id="study-navigation" ref="sidebar" class="study-sidebar" :class="{ open: sidebarOpen }" :role="sidebarOpen ? 'dialog' : undefined" :aria-modal="sidebarOpen || undefined" aria-label="研学导航">
      <div class="sidebar-heading"><span>研学路线</span><button class="icon-button mobile-menu" aria-label="收起研学导航" @click="sidebarOpen = false"><PanelLeftClose :size="18" /></button></div>
      <div class="course-label"><span class="tiny-label">FIELD STUDY / 01</span><h2>西天目山<br />自然地理考察</h2><span class="sidebar-course-tag">高中地理 · 个人研学</span></div>
      <nav class="journey-nav" aria-label="研学流程">
        <RouterLink v-for="item in modules" :key="item.id" :to="item.target"
          :class="{ active: item.matches(route.path), complete: item.done, recommended: next?.id === item.id }"
          :aria-current="item.matches(route.path) ? 'step' : undefined"
          @click="sidebarOpen = false">
          <span class="journey-number"><Check v-if="item.done" :size="15" /><template v-else>{{ item.number }}</template></span>
          <span class="journey-link-copy"><strong>{{ item.title }}</strong><small>{{ item.stateLabel }}</small></span><ChevronRight :size="14" class="journey-arrow" />
        </RouterLink>
      </nav>
      <div class="journey-progress">
        <div><span>基础任务</span><strong>{{ completed }}<small> / {{ studyModules.length }}</small></strong></div>
        <progress :value="completed" :max="studyModules.length" aria-label="已完成的基础学习任务" />
        <p>按已保存的学习产出更新</p>
      </div>
      <RouterLink v-if="next" :to="next.target" class="sidebar-next" @click="sidebarOpen = false">
        <span>建议继续</span><strong>{{ next.title }}<ArrowRight :size="16" /></strong>
      </RouterLink>
      <div class="sidebar-tools">
        <span class="tiny-label">工具</span>
        <RouterLink v-for="tool in studyTools" :key="tool.path" :to="tool.path" :aria-current="route.path === tool.path ? 'page' : undefined" @click="sidebarOpen = false"><component :is="tool.icon" :size="17" />{{ tool.title }}<ChevronRight :size="14" /></RouterLink>
        <button type="button" class="sidebar-tour" @click="sidebarOpen = false; start()"><BookOpenCheck :size="17" />新手引导<ChevronRight :size="14" /></button>
      </div>
    </aside>

    <main id="main-content" class="main-content" :inert="sidebarOpen">
      <div class="context-bar"><span><span class="context-dot" />西天目山<span class="context-separator">/</span>{{ route.meta.title }}</span><span>高中地理 · 个人研学</span></div>
      <RouterView />
      <footer class="page-footer"><span><Leaf :size="13" />天目·寻境</span></footer>
    </main>
  </div>
  <OnboardingTour />
  <Transition name="toast">
    <div v-if="notice" class="toast-notice" :class="{ error: notice.error }" role="status" aria-live="polite">
      <X v-if="notice.error" :size="18" /><CheckCircle2 v-else :size="18" /><span>{{ notice.text }}</span>
      <button class="icon-button" aria-label="关闭提示" @click="notice = null"><X :size="16" /></button>
    </div>
  </Transition>
</template>
