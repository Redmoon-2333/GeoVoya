<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { isNavigationFailure, NavigationFailureType, useRoute, useRouter } from 'vue-router'
import { ArrowLeft, ArrowRight, BookOpenCheck, X } from 'lucide-vue-next'
import { onboarding, onboardingActive, onboardingSteps, next, prev, skip, finish } from '../onboarding'

interface Rect { top: number; left: number; width: number; height: number }

const route = useRoute(), router = useRouter()
const box = ref<HTMLElement>()
const target = ref<HTMLElement | null>(null)
const rect = ref<Rect | null>(null)
const boxHeight = ref(0)
const note = ref('')
const viewport = ref({ width: window.innerWidth, height: window.innerHeight })
const step = computed(() => onboardingSteps[onboarding.value.step]!)
const total = onboardingSteps.length
const isFirst = computed(() => onboarding.value.step === 0)
const isLast = computed(() => onboarding.value.step === total - 1)
const mobile = computed(() => viewport.value.width <= 760)
const titleId = 'onboarding-step-title'

let attempt = 0, ticker = 0, returnFocus: HTMLElement | null = null
let boxObserver: ResizeObserver | null = null

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

function hasSize(element: HTMLElement) {
  const box = element.getBoundingClientRect()
  if (box.width < 2 || box.height < 2) return false
  const style = getComputedStyle(element)
  return style.visibility !== 'hidden' && style.display !== 'none' && Number(style.opacity) > 0
}
function onScreen(element: HTMLElement) {
  if (!hasSize(element)) return false
  const box = element.getBoundingClientRect()
  // Elements in the closed mobile drawer sit outside the viewport horizontally and cannot be highlighted.
  return box.right > 0 && box.left < window.innerWidth
}
function isVisible(element: HTMLElement) {
  if (!onScreen(element)) return false
  const box = element.getBoundingClientRect()
  return box.bottom > 0 && box.top < window.innerHeight
}
function findTarget(selector: string) {
  for (const part of selector.split(',')) {
    const element = document.querySelector<HTMLElement>(part.trim())
    if (element && onScreen(element)) return element
  }
  return null
}
function selectorForStep() {
  return mobile.value && step.value.mobileTarget ? step.value.mobileTarget : step.value.target
}
function measure() {
  const panel = box.value?.getBoundingClientRect()
  if (panel) boxHeight.value = panel.height
  const element = target.value
  if (!element?.isConnected || !hasSize(element)) { rect.value = null; return }
  const bounds = element.getBoundingClientRect()
  // A target scrolled out of view no longer frames anything, so fall back to the centred box.
  const top = Math.max(bounds.top, 0), left = Math.max(bounds.left, 0)
  const bottom = Math.min(bounds.bottom, window.innerHeight), right = Math.min(bounds.right, window.innerWidth)
  rect.value = bottom - top > 8 && right - left > 8 ? { top, left, width: right - left, height: bottom - top } : null
}
function watchBox() {
  boxObserver?.disconnect()
  boxObserver = null
  if (!box.value) return
  // The panel's height decides where it is anchored, so keep it current as step copy changes.
  boxObserver = new ResizeObserver(() => { if (box.value) boxHeight.value = box.value.getBoundingClientRect().height })
  boxObserver.observe(box.value)
}
function startTicker() { if (!ticker) ticker = window.setInterval(measure, 200) }
function stopTicker() { if (ticker) { window.clearInterval(ticker); ticker = 0 } }
function focusBox() { box.value?.focus({ preventScroll: true }) }

async function locate() {
  const mine = ++attempt
  rect.value = null
  target.value = null
  note.value = ''
  const selector = selectorForStep()
  const deadline = Date.now() + 3000
  while (Date.now() < deadline) {
    if (mine !== attempt) return
    const element = findTarget(selector)
    if (element) {
      target.value = element
      element.scrollIntoView({ block: 'center', inline: 'nearest', behavior: 'auto' })
      await delay(120)
      if (mine !== attempt) return
      measure()
      await nextTick()
      // Re-measure once the new step's text is in the DOM so the panel can be clamped to the viewport.
      measure()
      watchBox()
      focusBox()
      return
    }
    await delay(120)
  }
  if (mine !== attempt) return
  await nextTick()
  focusBox()
}

function parseRoute(value: string) {
  const [path, search] = value.split('?')
  const query: Record<string, string> = {}
  new URLSearchParams(search || '').forEach((item, key) => { query[key] = item })
  return { path: path || '/', query }
}

async function navigateTo(index: number) {
  const { path, query } = parseRoute(onboardingSteps[index]!.route)
  const tab = query.tab
  if (route.path === path && (!tab || String(route.query.tab || '') === tab)) return true
  const failure = await router.push({ path, query })
  if (isNavigationFailure(failure, NavigationFailureType.aborted)) {
    note.value = '当前页面还有未保存的内容。先保存或确认离开，再点“下一步”继续。'
    return false
  }
  return true
}

async function gotoStep() {
  if (await navigateTo(onboarding.value.step)) await locate()
}

function close() { skip() }

async function goPrev() {
  if (isFirst.value) return
  if (await navigateTo(onboarding.value.step - 1)) prev()
}
async function goNext() {
  if (!isLast.value) {
    if (await navigateTo(onboarding.value.step + 1)) next()
    return
  }
  finish()
}

const spotlightStyle = computed(() => rect.value ? {
  top: `${rect.value.top - 4}px`, left: `${rect.value.left - 4}px`,
  width: `${rect.value.width + 8}px`, height: `${rect.value.height + 8}px`,
} : undefined)

const shades = computed(() => {
  const { width: w, height: h } = viewport.value
  const r = rect.value
  if (!r) return [{ top: 0, left: 0, width: w, height: h }]
  const top = Math.max(0, r.top), left = Math.max(0, r.left)
  const bottom = Math.min(h, r.top + r.height), right = Math.min(w, r.left + r.width)
  return [
    { top: 0, left: 0, width: w, height: Math.max(0, top) },
    { top: bottom, left: 0, width: w, height: Math.max(0, h - bottom) },
    { top, left: 0, width: Math.max(0, left), height: Math.max(0, bottom - top) },
    { top, left: right, width: Math.max(0, w - right), height: Math.max(0, bottom - top) },
  ].filter(panel => panel.width > 0 && panel.height > 0)
})

const boxStyle = computed(() => {
  if (mobile.value || !rect.value) return undefined
  const r = rect.value, { width: w, height: h } = viewport.value
  const width = 340, gap = 18, margin = 14
  const height = boxHeight.value || 250
  const clampTop = (value: number) => Math.min(Math.max(value, margin), Math.max(margin, h - height - margin))
  const top = clampTop(r.top + r.height / 2 - 70)
  if (r.left + r.width + gap + width <= w - margin) return { top: `${top}px`, left: `${r.left + r.width + gap}px` }
  if (r.left - gap - width >= margin) return { top: `${top}px`, left: `${r.left - gap - width}px` }
  const below = r.top + r.height + gap + height <= h - margin ? r.top + r.height + gap : clampTop(r.top - gap - height)
  return { top: `${below}px`, left: `${Math.min(Math.max(margin, r.left), w - width - margin)}px` }
})

function onKeydown(event: KeyboardEvent) {
  if (!onboardingActive.value) return
  if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); close(); return }
  if (event.key !== 'Tab' || !box.value) return
  const focusable = [...box.value.querySelectorAll<HTMLElement>('button:not(:disabled)')]
  if (!focusable.length) return
  const first = focusable[0], last = focusable[focusable.length - 1]
  const active = document.activeElement
  if (active && box.value.contains(active)) {
    if (event.shiftKey && active === first) { event.preventDefault(); last?.focus() }
    else if (!event.shiftKey && active === last) { event.preventDefault(); first?.focus() }
    return
  }
  event.preventDefault()
  first?.focus()
}

function onResize() {
  viewport.value = { width: window.innerWidth, height: window.innerHeight }
  measure()
}

watch(onboardingActive, async active => {
  if (active) {
    const previous = document.activeElement
    returnFocus = previous instanceof HTMLElement ? previous : null
    startTicker()
    await gotoStep()
  } else {
    stopTicker()
    attempt++
    rect.value = null
    target.value = null
    const previous = returnFocus
    returnFocus = null
    // The invitation card unmounts once the tour is skipped, so fall back to a visible restart control.
    const restart = mobile.value ? ['[aria-label="打开小目导学"]', '.sidebar-tour'] : ['.sidebar-tour', '[aria-label="打开小目导学"]']
    const fallback = restart
      .map(selector => document.querySelector<HTMLElement>(selector))
      .find(element => element && isVisible(element))
    const element = previous?.isConnected && isVisible(previous) ? previous : fallback
    element?.focus({ preventScroll: true })
  }
})

watch(() => onboarding.value.step, (value, old) => {
  if (!onboardingActive.value || value === old) return
  void gotoStep()
})

onMounted(() => {
  window.addEventListener('resize', onResize)
  document.addEventListener('keydown', onKeydown, true)
  if (onboardingActive.value) { startTicker(); void gotoStep() }
})
onBeforeUnmount(() => {
  stopTicker()
  boxObserver?.disconnect()
  attempt++
  window.removeEventListener('resize', onResize)
  document.removeEventListener('keydown', onKeydown, true)
})
</script>

<template>
  <div v-if="onboardingActive" class="tour-root">
    <div v-for="(panel, index) in shades" :key="index" class="tour-shade" aria-hidden="true"
      :style="{ top: `${panel.top}px`, left: `${panel.left}px`, width: `${panel.width}px`, height: `${panel.height}px` }" />
    <div v-if="rect" class="tour-spotlight" aria-hidden="true" :style="spotlightStyle" />
    <section ref="box" class="tour-box" :class="{ centered: !rect }" role="dialog" aria-modal="true" :aria-labelledby="titleId" tabindex="-1" :style="boxStyle">
      <div class="tour-head">
        <span class="tour-progress">步骤 {{ onboarding.step + 1 }} / {{ total }}</span>
        <button class="icon-button" aria-label="关闭新手引导" @click="close"><X :size="18" /></button>
      </div>
      <h2 :id="titleId">{{ step.title }}</h2>
      <p class="tour-body">{{ step.body }}</p>
      <div v-if="step.example" class="tour-example"><span>示例</span><p>{{ step.example }}</p></div>
      <p v-if="note" class="tour-note" aria-live="polite">{{ note }}</p>
      <div class="tour-actions">
        <button class="button subtle tour-prev" :disabled="isFirst" @click="goPrev"><ArrowLeft :size="16" />上一步</button>
        <button class="text-link tour-skip" @click="close">跳过引导</button>
        <button class="button primary tour-next" @click="goNext">
          {{ isLast ? '完成引导' : '我知道了，下一步' }}
          <component :is="isLast ? BookOpenCheck : ArrowRight" :size="16" />
        </button>
      </div>
    </section>
  </div>
</template>
