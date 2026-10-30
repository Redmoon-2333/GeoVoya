<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowRight, BookOpen, Check, CheckCircle2, ChevronRight, Compass, FileText,
  FolderOpen, Leaf, Map, Menu, Mountain, PanelLeftClose, RotateCw,
  Sprout, X,
} from 'lucide-vue-next'
import { useFieldworkStore } from './stores/fieldwork'
import { notice } from './notice'
import GuidePanel from './components/GuidePanel.vue'
import { focusIfActive } from './focus'

const store = useFieldworkStore()
const route = useRoute()
const router = useRouter()
const sidebarOpen = ref(false)
const sidebar = ref<HTMLElement>(), menuButton = ref<HTMLButtonElement>()
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
const navigation = [
  { path: '/', title: '项目总览', icon: Compass },
  { path: '/explore', title: '空间探索', icon: Map },
  { path: '/inquiry', title: '专题探究', icon: Sprout },
  { path: '/archive', title: '科考档案馆', icon: FolderOpen },
  { path: '/outcomes', title: '成果交流', icon: FileText },
  { path: '/feedback', title: '学习反馈', icon: BookOpen },
]
const currentStep = computed(() => store.feedback?.steps.find((step) => !step.done))
function isActiveStep(href: string) {
  const target = router.resolve(href)
  if (route.path !== target.path) return false
  if (route.path !== '/archive') return true
  const tab = ['workbench', 'board'].includes(String(route.query.tab)) ? String(route.query.tab) : 'collection'
  return tab === (target.query.tab || 'collection')
}
onMounted(() => { store.initialize(); document.addEventListener('keydown', trapNavigation) })
onBeforeUnmount(() => document.removeEventListener('keydown', trapNavigation))
</script>

<template>
  <a href="#main-content" class="skip-link">跳到主要内容</a>
  <header class="app-header">
    <div class="brand-wrap">
      <button ref="menuButton" class="icon-button mobile-menu" title="打开研学导航" aria-label="打开研学导航" :aria-expanded="sidebarOpen" aria-controls="study-navigation" @click="sidebarOpen = !sidebarOpen">
        <Menu :size="21" />
      </button>
      <RouterLink to="/" class="brand" aria-label="天目寻境，项目总览">
        <span class="brand-mark"><Mountain :size="37" :stroke-width="1.6" /><Leaf :size="17" class="brand-leaf" /></span>
        <span><strong>天目<span class="brand-dot">·</span>寻境</strong><small>西天目山自然地理研学</small></span>
      </RouterLink>
    </div>
    <nav class="main-nav" aria-label="主要导航">
      <RouterLink v-for="item in navigation" :key="item.path" :to="item.path" :class="{ selected: route.path === item.path }">
        <component :is="item.icon" :size="16" /><span>{{ item.title }}</span>
      </RouterLink>
    </nav>
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
      <div class="sidebar-heading"><span>我的研学旅程</span><button class="icon-button mobile-menu" aria-label="收起研学导航" @click="sidebarOpen = false"><PanelLeftClose :size="18" /></button></div>
      <div class="course-label"><span class="tiny-label">FIELD STUDY / 01</span><h2>西天目山<br />自然地理考察</h2><span class="sidebar-course-tag">高中地理 · 个人研学</span></div>
      <nav class="mobile-section-nav" aria-label="页面导航"><RouterLink v-for="item in navigation" :key="item.path" :to="item.path" :class="{ active: route.path === item.path }" @click="sidebarOpen = false"><component :is="item.icon" :size="17"/>{{ item.title }}<ChevronRight :size="14"/></RouterLink></nav>
      <nav class="journey-nav" aria-label="研学流程">
        <RouterLink v-for="(step, index) in store.feedback?.steps" :key="step.id" :to="step.href"
          :class="{ active: isActiveStep(step.href), complete: step.done }"
          @click="sidebarOpen = false">
          <span class="journey-number"><Check v-if="step.done" :size="15" /><template v-else>{{ String(index + 1).padStart(2, '0') }}</template></span>
          <span>{{ step.title }}</span><ChevronRight :size="14" class="journey-arrow" />
        </RouterLink>
      </nav>
      <div class="journey-progress">
        <div><span>考察足迹</span><strong>{{ store.feedback?.completed_steps }}<small> / 5</small></strong></div>
        <progress :value="store.feedback?.completed_steps" max="5" aria-label="已记录的学习环节" />
        <p>按已保存的学习材料更新</p>
      </div>
      <RouterLink v-if="currentStep" :to="currentStep.href" class="sidebar-next" @click="sidebarOpen = false">
        <span>下一步</span><strong>{{ currentStep.title }}<ArrowRight :size="16" /></strong>
      </RouterLink>
      <div class="sidebar-utilities"><RouterLink to="/methods" @click="sidebarOpen = false"><Sprout :size="17"/>望闻问切<ChevronRight :size="14"/></RouterLink><RouterLink to="/library" @click="sidebarOpen = false"><BookOpen :size="17"/>课程资料库<ChevronRight :size="14"/></RouterLink></div>
    </aside>

    <main id="main-content" class="main-content" :inert="sidebarOpen">
      <div class="context-bar"><span><span class="context-dot" />西天目山<span class="context-separator">/</span>{{ route.meta.title }}</span><span>高中地理 · 个人研学</span></div>
      <RouterView />
      <footer class="page-footer"><span><Leaf :size="13" />天目·寻境</span></footer>
    </main>
  </div>
  <Transition name="toast">
    <div v-if="notice" class="toast-notice" :class="{ error: notice.error }" role="status" aria-live="polite">
      <X v-if="notice.error" :size="18" /><CheckCircle2 v-else :size="18" /><span>{{ notice.text }}</span>
      <button class="icon-button" aria-label="关闭提示" @click="notice = null"><X :size="16" /></button>
    </div>
  </Transition>
</template>
