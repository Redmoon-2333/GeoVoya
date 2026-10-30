import { demoCatalog, demoGuideCards } from './demoCatalog'
import type { Analysis, Artifact, Attachment, Bootstrap, Favorite, Observation } from './types'
import { downloadText } from './curriculum'

export const demoMode = new URLSearchParams(location.search).get('demo') === '1' || import.meta.env.VITE_DEMO_MODE === 'true'
interface DemoData {
  observations: Observation[]; favorites: Favorite[]; analyses: Analysis[]; artifacts: Artifact[]
  revisions: (Artifact & { artifact_id: string; snapshots?: { title: string; filename: string; observed: string; meaning: string; missing: string }[] })[]; attachments: (Attachment & { data: string })[]
  progress: Bootstrap['progress']; reflection: { text: string } | null
}
const key = 'geovoya:demo:v1'
function read(): DemoData {
  try { const raw = localStorage.getItem(key); if (raw) return JSON.parse(raw) as DemoData } catch { /* Recover to an empty demonstration. */ }
  return { observations: [], favorites: [], analyses: [], artifacts: [], revisions: [], attachments: [], progress: null, reflection: null }
}
function feedback(d: DemoData): Bootstrap['feedback'] {
  const board = d.analyses.filter(a => a.on_board)
  const definitions = [
    ['observe', '观察与记录', !!d.observations.length, '保存至少一条对实景的独立观察', '/explore'],
    ['collect', '收藏发现', !!d.favorites.length, '收藏资料并保留原始出处', '/archive'],
    ['analyze', '整理证据', d.analyses.some(a => a.observed && a.meaning && a.missing), '写清观察、含义和仍需补充的资料', '/archive?tab=workbench'],
    ['argue', '组织解释', !!board.length, '把分析加入论证板，保留局限', '/archive?tab=board'],
    ['create', '形成成果', d.artifacts.some(a => a.status === 'archived'), '完成带有证据引用的个人成果', '/outcomes'],
  ] as const
  const steps = definitions.map(([id, title, done, description, href]) => ({ id, title, done, description, href }))
  return { steps, completed_steps: steps.filter(s => s.done).length, counts: { observations: d.observations.length, favorites: d.favorites.length, analyses: d.analyses.length, board: board.length, artifacts: d.artifacts.length }, teacher_status: 'not_connected', dimensions: ['信息搜集与处理', '实践观察', '合作探究', '分析解释', '成果表达'].map((title, i) => ({ title, status: i === 2 ? '暂无记录' : steps[i]?.done ? '已有过程材料' : '待补充', note: i === 2 ? '暂无合作记录' : '依据已保存的学习材料' })) }
}
function record<T extends { id: string; created_at: string; updated_at: string }>(items: T[], values: object, id: string) {
  const old = items.find(i => i.id === id)
  const result = { ...old, ...values, id, created_at: old?.created_at || new Date().toISOString(), updated_at: new Date().toISOString() } as T
  if (old) items.splice(items.indexOf(old), 1, result); else items.unshift(result)
  return result
}
export async function demoRequest(path: string, options: RequestInit = {}): Promise<unknown> {
  const d = read(), method = options.method || 'GET'
  const body = typeof options.body === 'string' ? JSON.parse(options.body) : {}
  const [, kind, id, child] = path.split('/')
  let result: unknown
  if (path === '/bootstrap') return { ...d, catalog: demoCatalog, feedback: feedback(d) }
  if (path === '/feedback') return feedback(d)
  if (path === '/guide/ask') {
    const text = String(body.question || '').trim()
    const ranked = demoGuideCards.map(card => ({ card, score: card.keywords.filter(key => text.toLowerCase().includes(key.toLowerCase())).length })).sort((a, b) => b.score - a.score)
    const card = ranked[0]?.score ? ranked[0].card : undefined
    return { mode: 'knowledge_pack', question: text, answer: card?.answer || '当前课程资料没有匹配到这个问题，请尝试垂直地带性、植物观察、柳杉研究或沙盘。', sources: card?.sources || ['课程资料'], matched_card_id: card?.id || null, page: body.page, node_id: body.node_id, theme_id: body.theme_id }
  }
  if (kind === 'progress') { d.progress = body; result = body }
  else if (kind === 'reflection') { d.reflection = body; result = body }
  else if (kind === 'observations' && method === 'PUT') {
    if (!body.fact?.trim()) throw new Error('请填写观察到的事实。')
    result = record(d.observations, body, id!)
  } else if (kind === 'favorites' && method === 'POST') {
    const r = demoCatalog.resources.find(r => r.id === body.resource_id)
    if (!r) throw new Error('资料不存在。')
    result = d.favorites.find(f => f.resource_id === r.id) || record(d.favorites, { resource_id: r.id, source: r.source, source_version: r.source_version }, r.id)
  } else if (kind === 'analyses' && method === 'PUT') {
    if (body.on_board && !(body.observed?.trim() && body.meaning?.trim() && body.missing?.trim())) throw new Error('请补齐事实、研究含义和待补证据。')
    result = record(d.analyses, body, id!)
  } else if (kind === 'artifacts' && child === 'versions') return d.revisions.filter(r => r.artifact_id === id)
  else if (kind === 'artifacts' && child === 'attachments') {
    if (method === 'GET') return d.attachments.filter(a => a.artifact_id === id)
    const file = (options.body as FormData).get('file') as File
    if (!file?.size || file.size > 10 * 1024 * 1024) throw new Error('请选择非空附件，大小不超过 10 MB。')
    if (!/\.(pdf|png|jpe?g|webp|md|txt|docx|pptx)$/i.test(file.name)) throw new Error('请选择 PDF、图片、文本、DOCX 或 PPTX 文件。')
    const data = await new Promise<string>((resolve, reject) => { const reader = new FileReader(); reader.onload = () => resolve(String(reader.result)); reader.onerror = reject; reader.readAsDataURL(file) })
    result = record(d.attachments, { artifact_id: id, filename: file.name, size: file.size, data }, crypto.randomUUID())
  } else if (kind === 'artifacts' && (method === 'PUT' || method === 'POST')) {
    if (!body.title?.trim()) throw new Error('请填写成果标题。')
    if (body.status === 'archived' && (!body.content?.trim() || !body.evidence_ids?.length)) throw new Error('归档前请补充正文和证据。')
    const version = (d.artifacts.find(a => a.id === id)?.version || 0) + 1
    result = record(d.artifacts, { ...body, version }, id || crypto.randomUUID())
    const snapshots = body.evidence_ids.map((evidenceId: string) => {
      const evidence = d.analyses.find(e => e.id === evidenceId)
      if (!evidence?.on_board) throw new Error('引用的证据已移出论证板，请重新选择。')
      const source = demoCatalog.resources.find(r => r.id === evidence.favorite_id)!
      return { title: source.title, filename: source.filename, observed: evidence.observed, meaning: evidence.meaning, missing: evidence.missing }
    })
    d.revisions.unshift({ ...(result as Artifact), artifact_id: (result as Artifact).id, snapshots })
  } else throw new Error('操作未完成，请重试。')
  try { localStorage.setItem(key, JSON.stringify(d)) } catch { throw new Error('浏览器存储空间不足，未保存。请缩小附件或导出已有成果。') }
  return result
}
export function handleDemoDownload(event: MouseEvent) {
  if (!demoMode) return
  const anchor = (event.target as HTMLElement).closest<HTMLAnchorElement>('a[href^="/api/v1/"]')
  if (!anchor) return
  event.preventDefault()
  const d = read(), parts = anchor.getAttribute('href')!.split('/')
  if (parts[3] === 'attachments') {
    const attachment = d.attachments.find(a => a.id === parts[4]); if (!attachment) return
    const a = document.createElement('a'); a.href = attachment.data; a.download = attachment.filename; a.click(); return
  }
  if (parts[3] === 'artifacts') {
    const a = d.artifacts.find(a => a.id === parts[4]); if (!a) return
    const revision = d.revisions.find(r => r.artifact_id === a.id && r.version === a.version)
    const snapshots = revision?.snapshots || a.evidence_ids.map(id => { const e = d.analyses.find(e => e.id === id); const r = demoCatalog.resources.find(r => r.id === e?.favorite_id); return { title: r?.title || '', filename: r?.filename || '', observed: e?.observed || '', meaning: e?.meaning || '', missing: e?.missing || '' } })
    downloadText('天目寻境-成果.md', `# ${a.title}\n\n版本 v${a.version}\n\n${revision?.summary ?? a.summary}\n\n${revision?.content ?? a.content}\n\n## 证据引用\n${snapshots.map(e => `### ${e.title}\n${e.filename}\n${e.observed}\n${e.meaning}\n局限：${e.missing}`).join('\n\n')}`)
  } else downloadText('天目寻境-过程记录.md', `# 个人研学过程记录\n\n\n\n${d.observations.map(o => `## ${demoCatalog.nodes.find(n => n.id === o.node_id)?.title}\n${o.fact}\n${o.evidence}\n${o.question}`).join('\n\n')}\n\n## 我的反思\n${d.reflection?.text || ''}`)
}
