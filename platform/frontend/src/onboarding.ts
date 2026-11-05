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
    route: '/', target: '.main-nav',
    title: '顶部导航：五个研学板块',
    body: '这一排是课程入口和五个研学板块。点任意一个就能直接跳过去，不必按顺序完成。',
  },
  {
    route: '/', target: '.journey-nav', mobileTarget: '.module-grid',
    title: '研学路线：随时看进度',
    body: '研学路线按 01 到 05 排列，完成的环节会打勾。首页的「五个研学板块」卡片也能进入同样的页面。',
  },
  {
    route: '/', target: '.intro-video-grid',
    title: '先看一看，再出发',
    body: '导览视频介绍西天目山的背景。看完再进入实景观察，你会更容易找到值得追问的现象。',
  },
  {
    route: '/methods', target: '.method-task',
    title: '望闻问切：先练习判断',
    body: '这里给出植物观察任务。先看照片和记录，再选择答案并点“检查答案”；答错可以继续尝试。',
    example: '先看叶形、叶缘，再对照枝条和果苞，最后才下判断。',
  },
  {
    route: '/explore', target: '.tab-bar',
    title: '切换四种观察视图',
    body: '实景照片、360° 全景、数字沙盘和山地剖面都在这里切换，它们展示的是同一片山地。',
  },
  {
    route: '/explore', target: '.observation-panel',
    title: '把看到的写下来',
    body: '在观察表单里写清你直接看到的事实，可以再补充分辨依据和自己的疑问，然后保存。',
    example: '事实：画面中部有一根倒木；依据：树皮纹理和断口形状。',
  },
  {
    route: '/explore', target: '.module-subnav',
    title: '三个空间板块',
    body: '「实地观察」记录照片见闻，「垂直地带性」比较不同海拔的植被，「星球植被图鉴」提供全球视角。',
  },
  {
    route: '/inquiry?tab=questions', target: '.inquiry-tabs',
    title: '专题探究：先读问题链',
    body: '专题探究分三步：问题链、证据工作台、研究论证板。先在这里读懂要研究的问题和子问题。',
  },
  {
    route: '/inquiry?tab=workbench', target: '.workbench-layout, .empty-state',
    title: '证据工作台：把资料变成证据',
    body: '在收藏的资料上写清观察、研究含义和仍需补充的资料，就能把它变成一条证据。',
    example: '观察：照片中古道旁有几株柳杉树冠稀疏 → 含义：可能与柳杉衰退有关 → 仍需：同一地点不同年份的照片或调查记录。',
  },
  {
    route: '/inquiry?tab=board', target: '.board-heading',
    title: '研究论证板：组织解释',
    body: '加入论证板的证据会按角色排列，你能看到哪些支持自己的解释、哪些可能削弱它。',
  },
  {
    route: '/outcomes', target: '.template-actions',
    title: '成果交流：选一个模板',
    body: '倡议书、研究总结或调查报告，选一种就会得到对应的写作提纲，再填入自己的证据。',
    example: '倡议书会先写「我们观察到的现象」，再写证据依据和倡议内容。',
  },
  {
    route: '/feedback', target: '.module-progress-list',
    title: '学习反馈：回看完成情况',
    body: '这里汇总五个板块的进度，方便你知道还差哪一步，也能看到每个环节的完成依据。',
  },
  {
    route: '/feedback', target: '#reflection-text',
    title: '写下自己的反思',
    body: '保存前想一想：哪一份证据改变了你的想法？还有哪个问题值得继续调查？',
  },
  {
    route: '/', target: '.sidebar-tools', mobileTarget: '.module-tools',
    title: '工具和小目导学',
    body: '「工具」分组里可以打开科考档案馆和课程资料库；页面上的「小目」导学助手会依据课程资料回答问题，并注明出处。',
  },
  {
    route: '/', target: '.overview-banner',
    title: '准备好了，开始研学',
    body: '整个流程就是：先学方法，再观察、探究、写成果，最后回看反思。随时可以从顶部导航或研学路线回来。',
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
