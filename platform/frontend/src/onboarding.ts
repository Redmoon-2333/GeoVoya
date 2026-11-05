import { computed, ref } from 'vue'

export type OnboardingStatus = 'new' | 'active' | 'skipped' | 'done'

export interface OnboardingState {
  status: OnboardingStatus
  step: number
}

export interface OnboardingStep {
  route: string
  target: string
  mobileTarget?: string
  title: string
  body: string
  example?: string
}

export const onboardingSteps: OnboardingStep[] = [
  {
    route: '/', target: '#current-task',
    title: '先看当前任务',
    body: '这里会说明建议完成的动作和本步产出。保存后，入口会根据你的学习记录更新。',
  },
  {
    route: '/', target: '#study-route',
    title: '沿着五步路线展开研学',
    body: '从植物观察方法开始，接着记录山地现象、分析证据、形成成果，最后回看和反思。每一步都可以自由进入。',
  },
  {
    route: '/', target: '.sidebar-tools', mobileTarget: '#module-tools',
    title: '需要回看时，打开工具',
    body: '科考档案馆保存你的观察和发现，课程资料库收录课程摘要。需要帮助时，也可以打开小目导学。',
  },
]

export const ONBOARDING_KEY = 'geovoya:onboarding:v1'
const STATUSES: OnboardingStatus[] = ['new', 'active', 'skipped', 'done']

export function readOnboarding(): OnboardingState {
  try {
    const raw = localStorage.getItem(ONBOARDING_KEY)
    if (!raw) return { status: 'new', step: 0 }
    const saved = JSON.parse(raw) as Partial<OnboardingState> | null
    const status = STATUSES.includes(saved?.status as OnboardingStatus) ? saved!.status as OnboardingStatus : 'new'
    const stored = Number(saved?.step)
    const step = Number.isInteger(stored) ? Math.min(Math.max(stored, 0), onboardingSteps.length - 1) : 0
    return { status, step }
  } catch {
    // Unreadable tour progress restarts from the invitation card instead of blocking the page.
    return { status: 'new', step: 0 }
  }
}

export const onboarding = ref<OnboardingState>(readOnboarding())
export const onboardingActive = computed(() => onboarding.value.status === 'active')

function persist(value: OnboardingState) {
  onboarding.value = value
  try {
    localStorage.setItem(ONBOARDING_KEY, JSON.stringify(value))
  } catch {
    // Storage may be full or disabled; the tour still runs from the in-memory state.
    return onboarding.value
  }
  return onboarding.value
}

export function start() {
  return persist({ status: 'active', step: 0 })
}

export function next() {
  return persist({ status: 'active', step: Math.min(onboarding.value.step + 1, onboardingSteps.length - 1) })
}

export function prev() {
  return persist({ status: 'active', step: Math.max(onboarding.value.step - 1, 0) })
}

export function skip() {
  return persist({ status: 'skipped', step: 0 })
}

export function finish() {
  return persist({ status: 'done', step: 0 })
}
