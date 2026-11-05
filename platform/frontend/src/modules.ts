import { computed, ref, watch, type Component } from 'vue'
import { BookOpen, CircleHelp, FileText, FolderOpen, Library, Map, Sprout } from 'lucide-vue-next'
import { useFieldworkStore } from './stores/fieldwork'
import { demoMode } from './demo'
import { geographyPages, geographyState } from './course/geography'
import { methods, type MethodProgress } from './course/methods'
import { notify } from './notice'

export type ModuleState = 'not_started' | 'in_progress' | 'complete'

export interface StudyModule {
  id: 'methods' | 'explore' | 'inquiry' | 'outcomes' | 'feedback'
  number: string
  title: string
  path: string
  task: string
  output: string
  icon: Component
  matches: (path: string) => boolean
}

export interface StudyTool {
  title: string
  path: string
  icon: Component
}

export interface StudyModuleView extends StudyModule {
  done: boolean
  state: ModuleState
  stateLabel: string
  target: string
}

export const studyModules: StudyModule[] = [
  {
    id: 'methods', number: '01', title: '望闻问切', path: '/methods',
    task: '完成 10 道植物观察入门题。', output: '10 道入门题的作答记录',
    icon: Sprout, matches: path => path === '/methods',
  },
  {
    id: 'explore', number: '02', title: '空间探索', path: '/explore',
    task: '保存一条实景观察，并写一条地带性课程笔记。', output: '实景观察 + 课程笔记',
    icon: Map, matches: path => path === '/explore' || path.startsWith('/geography'),
  },
  {
    id: 'inquiry', number: '03', title: '专题探究', path: '/inquiry',
    task: '分析一份资料，并将它加入研究论证板。', output: '一条已归入论证板的证据',
    icon: CircleHelp, matches: path => path === '/inquiry',
  },
  {
    id: 'outcomes', number: '04', title: '成果交流', path: '/outcomes',
    task: '完成并归档一份引用研究证据的成果。', output: '一份已归档的研究成果',
    icon: FileText, matches: path => path === '/outcomes',
  },
  {
    id: 'feedback', number: '05', title: '学习反馈', path: '/feedback',
    task: '回看自己的证据与判断，保存一段反思。', output: '一段已保存的学习反思',
    icon: BookOpen, matches: path => path === '/feedback',
  },
]

export const studyTools: StudyTool[] = [
  { title: '科考档案馆', path: '/archive', icon: FolderOpen },
  { title: '课程资料库', path: '/library', icon: Library },
]

const emptyMethodProgress: MethodProgress = {
  visited_card_ids: [], completed_question_ids: [], attempt_count: {},
}

function readMethodProgress(): MethodProgress {
  try {
    const raw = localStorage.getItem('geovoya:methods-v3')
    if (!raw) return emptyMethodProgress
    const saved = JSON.parse(raw) as Partial<MethodProgress>
    return {
      visited_card_ids: Array.isArray(saved.visited_card_ids) ? saved.visited_card_ids : [],
      completed_question_ids: Array.isArray(saved.completed_question_ids) ? saved.completed_question_ids : [],
      attempt_count: saved.attempt_count && typeof saved.attempt_count === 'object' ? saved.attempt_count : {},
    }
  } catch {
    return emptyMethodProgress
  }
}

export const methodProgress = ref<MethodProgress>(readMethodProgress())
const savedMethodQuestionIds = ref([...methodProgress.value.completed_question_ids])
watch(methodProgress, value => {
  try {
    localStorage.setItem('geovoya:methods-v3', JSON.stringify(value))
    savedMethodQuestionIds.value = [...value.completed_question_ids]
  }
  catch { notify('浏览器存储不可用，作答记录未保存。请导出学习记录。', true) }
}, { deep: true, flush: 'sync' })

const locationKey = `geovoya:study-location:${demoMode ? 'demo' : 'service'}`
type StudyLocations = { last: string; paths: Partial<Record<StudyModule['id'], string>> }

function locationModule(path: string) {
  return studyModules.find(item => item.matches(path.split(/[?#]/, 1)[0] || '/'))
}

function readStudyLocations(): StudyLocations {
  try {
    const saved = localStorage.getItem(locationKey)
    if (saved?.startsWith('/')) {
      const module = locationModule(saved)
      if (module) return { last: saved, paths: { [module.id]: saved } }
    }
    const value = JSON.parse(saved || 'null') as StudyLocations | null
    if (value && typeof value.last === 'string' && value.paths) {
      return { last: value.last, paths: Object.fromEntries(Object.entries(value.paths).filter(([id, path]) => typeof path === 'string' && locationModule(path)?.id === id)) }
    }
  } catch { /* An unavailable or old browser record must not block learning. */ }
  return { last: '', paths: {} }
}

const studyLocations = ref(readStudyLocations())

export function rememberStudyLocation(path: string) {
  const module = locationModule(path)
  if (!module) return
  studyLocations.value = { last: path, paths: { ...studyLocations.value.paths, [module.id]: path } }
  try { localStorage.setItem(locationKey, JSON.stringify(studyLocations.value)) } catch { /* Resume remains available for this session. */ }
}

function validLocation(id: StudyModule['id'], store: ReturnType<typeof useFieldworkStore>) {
  const saved = studyLocations.value.paths[id]
  if (!saved) return ''
  const url = new URL(saved, location.origin)
  const checks: Record<string, (value: string) => boolean> = {
    node: value => store.nodes.some(item => item.id === value),
    resource: value => store.favorites.some(item => item.resource_id === value),
    page: value => geographyPages.some(item => item.id === value),
    question: value => id === 'methods' ? methods.questions.some(item => item.question_id === value) : !!store.theme?.questions.some(item => item.id === value),
    theme: value => !!store.catalog?.themes.some(item => item.id === value),
    artifact: value => value === 'new' || store.artifacts.some(item => item.id === value),
  }
  for (const [key, check] of Object.entries(checks)) {
    const value = url.searchParams.get(key)
    if (value && !check(value)) url.searchParams.delete(key)
  }
  url.searchParams.delete('demo')
  return `${url.pathname}${url.search}${url.hash}`
}

function moduleTarget(id: StudyModule['id'], observationDone: boolean, noteDone: boolean, store: ReturnType<typeof useFieldworkStore>) {
  const saved = validLocation(id, store)
  if (id === 'methods') {
    const question = methods.default_route.find(id => !methodProgress.value.completed_question_ids.includes(id))
    return saved || (question ? `/methods?question=${question}` : '/methods')
  }
  if (id === 'explore') {
    if (saved.startsWith('/geography/tianmu')) return saved
    if (!observationDone) return saved.startsWith('/explore') ? saved : `/explore?node=${encodeURIComponent(store.lastNode || '')}`
    if (!noteDone) return saved.startsWith('/geography/tianmu') ? saved : '/geography/tianmu?page=VE03'
    return saved || '/explore'
  }
  if (id === 'inquiry') {
    if (saved) return saved
    if (store.board.length) return '/inquiry?tab=board'
    if (store.favorites.length) return `/inquiry?tab=workbench&resource=${encodeURIComponent(store.favorites[0]!.resource_id)}`
    return '/inquiry'
  }
  if (id === 'outcomes') {
    const draft = store.artifacts.find(item => item.status === 'draft')
    return saved || (draft ? `/outcomes?artifact=${encodeURIComponent(draft.id)}` : '/outcomes')
  }
  return saved || '/feedback#reflection-text'
}

export function useStudyModules() {
  const store = useFieldworkStore()
  const methodCount = computed(() => methods.default_route.filter(id => savedMethodQuestionIds.value.includes(id)).length)
  const observationDone = computed(() => store.observations.some(item => item.fact.trim()))
  const lessonNotes = computed(() => geographyPages.flatMap(page => {
    const note = geographyState.value.notes[page.id]
    return note?.text.trim() ? [{ ...page, ...note }] : []
  }))
  const noteDone = computed(() => lessonNotes.value.length > 0)
  const views = computed<StudyModuleView[]>(() => {
    const facts: Record<StudyModule['id'], { complete: boolean; started: boolean }> = {
      methods: { complete: methodCount.value === methods.default_route.length, started: Object.keys(methodProgress.value.attempt_count).length > 0 || methodCount.value > 0 },
      explore: { complete: observationDone.value && noteDone.value, started: observationDone.value || noteDone.value },
      inquiry: { complete: store.board.some(item => !!(item.observed.trim() && item.meaning.trim() && item.missing.trim())), started: store.favorites.length > 0 || store.analyses.length > 0 },
      outcomes: { complete: store.artifacts.some(item => item.status === 'archived' && !!(item.title.trim() && item.content.trim() && item.evidence_ids.length)), started: store.artifacts.length > 0 },
      feedback: { complete: !!store.data?.reflection?.text?.trim(), started: false },
    }

    return studyModules.map(item => {
      const fact = facts[item.id]!
      const state: ModuleState = fact.complete ? 'complete' : fact.started || studyLocations.value.paths[item.id] ? 'in_progress' : 'not_started'
      const stateLabel = state === 'complete' ? '基础任务完成' : state === 'in_progress' ? '进行中' : '未开始'
      return {
        ...item,
        done: fact.complete,
        state,
        stateLabel,
        target: moduleTarget(item.id, observationDone.value, noteDone.value, store),
      }
    })
  })
  const completed = computed(() => views.value.filter(item => item.done).length)
  const next = computed(() => {
    const last = locationModule(studyLocations.value.last)
    return views.value.find(item => item.id === last?.id && item.state === 'in_progress')
      || views.value.find(item => item.state === 'in_progress')
      || views.value.find(item => !item.done)
  })
  const currentTask = computed(() => next.value || views.value[views.value.length - 1]!)

  function status(id: StudyModule['id']) {
    return views.value.find(item => item.id === id)?.stateLabel || '未开始'
  }

  return { modules: views, completed, next, currentTask, status, methodCount, observationDone, noteDone, lessonNotes }
}
