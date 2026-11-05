import { computed, ref, watch, type Component } from 'vue'
import { useRoute } from 'vue-router'
import { BookOpen, CircleHelp, FileText, FolderOpen, Library, Map, Sprout } from 'lucide-vue-next'
import { useFieldworkStore } from './stores/fieldwork'
import { methods, type MethodProgress } from './course/methods'

export interface StudyModule {
  id: 'methods' | 'explore' | 'inquiry' | 'outcomes' | 'feedback'
  number: string
  title: string
  path: string
  task: string
  icon: Component
  matches: (path: string) => boolean
}

export interface StudyTool {
  title: string
  path: string
  icon: Component
}

export const studyModules: StudyModule[] = [
  { id: 'methods', number: '01', title: '望闻问切', path: '/methods', task: '练习望、闻、问、切，用多种线索核验植物判断。', icon: Sprout, matches: path => path === '/methods' },
  { id: 'explore', number: '02', title: '空间探索', path: '/explore', task: '在实景、全景与沙盘中观察山地环境，留下自己的记录。', icon: Map, matches: path => path === '/explore' || path.startsWith('/geography') },
  { id: 'inquiry', number: '03', title: '专题探究', path: '/inquiry', task: '把观察变成问题，用证据工作台和论证板组织解释。', icon: CircleHelp, matches: path => path === '/inquiry' },
  { id: 'outcomes', number: '04', title: '成果交流', path: '/outcomes', task: '用倡议书、研究总结或调查报告整理并归档成果。', icon: FileText, matches: path => path === '/outcomes' },
  { id: 'feedback', number: '05', title: '学习反馈', path: '/feedback', task: '回看五个环节的进度，保存自己的学习反思。', icon: BookOpen, matches: path => path === '/feedback' },
]

export const studyTools: StudyTool[] = [
  { title: '科考档案馆', path: '/archive', icon: FolderOpen },
  { title: '课程资料库', path: '/library', icon: Library },
]

function readCompletedQuestions(): string[] {
  try {
    const raw = localStorage.getItem('geovoya:methods-v3')
    if (!raw) return []
    const saved = JSON.parse(raw) as Partial<MethodProgress>
    return Array.isArray(saved.completed_question_ids) ? saved.completed_question_ids : []
  } catch {
    // Unreadable progress is treated as not started.
    return []
  }
}

export function useStudyModules() {
  const store = useFieldworkStore()
  const route = useRoute()
  const completedQuestions = ref<string[]>(readCompletedQuestions())
  watch(() => route.fullPath, () => { completedQuestions.value = readCompletedQuestions() })
  const done = computed<Record<StudyModule['id'], boolean>>(() => ({
    methods: methods.default_route.every(id => completedQuestions.value.includes(id)),
    explore: store.observations.length > 0,
    inquiry: store.board.length > 0,
    outcomes: store.artifacts.some(item => item.status === 'archived'),
    feedback: !!store.data?.reflection?.text?.trim(),
  }))
  const modules = computed(() => studyModules.map(item => ({ ...item, done: done.value[item.id] })))
  const completed = computed(() => modules.value.filter(item => item.done).length)
  const next = computed(() => modules.value.find(item => !item.done))
  function status(id: StudyModule['id']) {
    if (done.value[id]) return '已完成'
    return next.value?.id === id ? '进行中' : '未开始'
  }
  return { modules, completed, next, status }
}
