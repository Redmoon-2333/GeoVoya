import { computed, ref } from 'vue'
import { defineStore } from 'pinia'
import { request } from '../api'
import type { Analysis, AnalysisFields, Artifact, ArtifactFields, Bootstrap, Observation } from '../types'

export const useFieldworkStore = defineStore('fieldwork', () => {
  const data = ref<Bootstrap | null>(null)
  const loading = ref(true)
  const error = ref('')
  const catalog = computed(() => data.value?.catalog)
  const feedback = computed(() => data.value?.feedback)
  const resources = computed(() => catalog.value?.resources || [])
  const nodes = computed(() => catalog.value?.nodes || [])
  const observations = computed(() => data.value?.observations || [])
  const favorites = computed(() => data.value?.favorites || [])
  const analyses = computed(() => data.value?.analyses || [])
  const board = computed(() => analyses.value.filter((item) => item.on_board))
  const artifacts = computed(() => data.value?.artifacts || [])
  const theme = computed(() => catalog.value?.themes.find((item) => item.id === 'cryptomeria'))
  const lastNode = computed(() => data.value?.progress?.last_node || nodes.value[0]?.id)

  async function refresh() {
    data.value = await request<Bootstrap>('/bootstrap')
  }

  async function initialize() {
    loading.value = true
    error.value = ''
    try {
      await refresh()
    } catch (cause) {
      error.value = cause instanceof Error ? cause.message : '读取研学档案失败。'
    } finally {
      loading.value = false
    }
  }

  function resource(id: string) {
    return resources.value.find((item) => item.id === id)!
  }

  function node(id: string) {
    return nodes.value.find((item) => item.id === id)!
  }

  function isFavorite(id: string) {
    return favorites.value.some((item) => item.resource_id === id)
  }

  async function rememberNode(id: string) {
    const progress = await request<Bootstrap['progress']>('/progress', {
      method: 'PUT',
      body: JSON.stringify({ last_node: id, theme_id: 'cryptomeria' }),
    })
    if (data.value) data.value.progress = progress
  }

  async function saveObservation(values: Pick<Observation, 'node_id' | 'fact' | 'evidence' | 'question'>) {
    const result = await request<Observation>(`/observations/${values.node_id}`, {
      method: 'PUT',
      body: JSON.stringify(values),
    })
    await refresh()
    return result
  }

  async function collect(resourceId: string) {
    await request('/favorites', {
      method: 'POST',
      body: JSON.stringify({ resource_id: resourceId }),
    })
    await refresh()
  }

  async function saveAnalysis(values: AnalysisFields) {
    const result = await request<Analysis>(`/analyses/${values.favorite_id}`, {
      method: 'PUT',
      body: JSON.stringify(values),
    })
    await refresh()
    return result
  }

  async function saveArtifact(values: ArtifactFields, id?: string) {
    const result = await request<Artifact>(id ? `/artifacts/${id}` : '/artifacts', {
      method: id ? 'PUT' : 'POST',
      body: JSON.stringify(values),
    })
    await refresh()
    return result
  }

  return {
    data, loading, error, catalog, feedback, resources, nodes, observations, favorites, analyses,
    board, artifacts, theme, lastNode, initialize, refresh, resource, node, isFavorite, rememberNode,
    saveObservation, collect, saveAnalysis, saveArtifact,
  }
})
