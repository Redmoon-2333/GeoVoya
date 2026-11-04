import { computed, ref } from 'vue'
import pages from './geography-pages.json'

export const geographyPages = pages
export interface GeographyState {
  schema_version: number
  module_id: string
  ui_version: string
  data_version: string
  saved: string[]
  notes: Record<string, { text: string; updated_at: string | null }>
  visited: string[]
}

const storageKey = 'geovoya:tianmu-causes-v9'
const emptyState: GeographyState = {
  schema_version: 1, module_id: 'tianmu-causes', ui_version: '9.0.0', data_version: '9.0.0',
  saved: [], notes: {}, visited: [],
}
function readState(): GeographyState {
  try {
    const value = JSON.parse(localStorage.getItem(storageKey) || 'null')
    if (value && Array.isArray(value.saved) && Array.isArray(value.visited) && value.notes && typeof value.notes === 'object') return value
  } catch { /* An unavailable browser store must not prevent opening a lesson. */ }
  return emptyState
}
export const geographyState = ref<GeographyState>(readState())
export const geographyRecords = computed(() => pages
  .filter(page => geographyState.value.saved.includes(page.id) || geographyState.value.notes[page.id]?.text)
  .map(page => ({ ...page, saved: geographyState.value.saved.includes(page.id), note: geographyState.value.notes[page.id] })))

export interface TianmuInstance {
  ready: Promise<TianmuInstance>
  setPage(id: string): boolean
  getState(): GeographyState & { page_id: string }
  destroy(): void
}
interface TianmuLibrary {
  mount(root: HTMLElement, options: {
    embedded: boolean; hashRouting: boolean; autoTour: boolean; page: string; assetBase: string; profileKey: string
    data: unknown; diagrams: unknown
    storageAdapter: { load(): GeographyState; save(state: GeographyState): void }
    onPageChange(page: { page_id: string }): void
  }): TianmuInstance
}
declare global {
  interface Window {
    TianmuStudy?: TianmuLibrary
    TIANMU_OFFLINE_ASSETS?: Record<string, string>
  }
}
let loading: Promise<{ library: TianmuLibrary; data: unknown; diagrams: unknown }> | undefined

function loadFile(url: string, stylesheet = false) {
  return new Promise<void>((resolve, reject) => {
    const element = stylesheet ? document.createElement('link') : document.createElement('script')
    if (element instanceof HTMLLinkElement) { element.rel = 'stylesheet'; element.href = url }
    else element.src = url
    element.onload = () => resolve()
    element.onerror = () => { element.remove(); reject(new Error('课程资源暂时无法加载，请重试。')) }
    document.head.append(element)
  })
}
async function loadJSON(url: string) {
  const response = await fetch(url)
  if (!response.ok) throw new Error('课程资料暂时无法加载，请重试。')
  return response.json()
}
export function loadTianmu() {
  loading ??= (async () => {
    const [data, diagrams, assets] = await Promise.all([
      loadJSON('/lessons/tianmu/data.json'),
      loadJSON('/lessons/tianmu/diagrams.json'),
      loadJSON('/lessons/tianmu/assets.json'),
    ])
    window.TIANMU_OFFLINE_ASSETS = assets
    await loadFile('/lessons/tianmu/study.css', true)
    if (!window.TianmuStudy) await loadFile('/lessons/tianmu/study.js')
    if (!window.TianmuStudy) throw new Error('课程没有完成初始化，请重试。')
    return { library: window.TianmuStudy, data, diagrams }
  })().catch(error => { loading = undefined; throw error })
  return loading
}
export function saveGeographyState(state: GeographyState) {
  localStorage.setItem(storageKey, JSON.stringify(state))
  geographyState.value = state
}
