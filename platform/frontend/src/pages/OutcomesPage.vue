<script setup lang="ts">
import { computed, reactive, ref } from 'vue'
import { Archive, ArrowRight, Check, Download, Eye, FilePlus2, FileText, History, Paperclip, Save, Upload, X } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { formatDate, request } from '../api'
import { notify, reportError } from '../notice'
import { useUnsaved } from '../useUnsaved'
import type { Artifact, ArtifactFields, Attachment } from '../types'

const store = useFieldworkStore()
const preview = ref<HTMLDialogElement>()
const selectedId = ref('')
const saving = ref(false)
const saveError = ref('')
const uploading = ref(false)
const detailsLoading = ref(false)
const detailsError = ref('')
const fileInput = ref<HTMLInputElement>()
const revisions = ref<Artifact[]>([])
const attachments = ref<Attachment[]>([])
const form = reactive<ArtifactFields>({ theme_id: 'cryptomeria', title: '', summary: '', content: '', evidence_ids: [], status: 'draft' })
const baseline = ref(JSON.stringify(form))
const dirty = computed(() => JSON.stringify(form) !== baseline.value)
const confirmLeave = useUnsaved(dirty)
const current = computed(() => store.artifacts.find((item) => item.id === selectedId.value))
const cited = computed(() => store.board.filter((item) => item.theme_id === form.theme_id))
const removedCitations = computed(() => form.evidence_ids.filter((id) => !cited.value.some((item) => item.id === id)))

async function loadDetails(id: string) {
  detailsLoading.value = true
  detailsError.value = ''
  try {
    const result = await Promise.all([request<Artifact[]>(`/artifacts/${id}/versions`), request<Attachment[]>(`/artifacts/${id}/attachments`)])
    if (selectedId.value === id) [revisions.value, attachments.value] = result
  } catch (cause) { if (selectedId.value === id) detailsError.value = cause instanceof Error ? cause.message : '附加资料读取失败。' }
  finally { if (selectedId.value === id) detailsLoading.value = false }
}
function load(item?: Artifact) {
  selectedId.value = item?.id || ''
  Object.assign(form, { theme_id: item?.theme_id || 'cryptomeria', title: item?.title || '', summary: item?.summary || '', content: item?.content || '', evidence_ids: [...(item?.evidence_ids || [])], status: item?.status || 'draft' })
  baseline.value = JSON.stringify(form)
  revisions.value = []; attachments.value = []; detailsError.value = ''; detailsLoading.value = false
  if (item) void loadDetails(item.id)
}
function select(item?: Artifact) { if (confirmLeave()) load(item) }
function previewSaved(item: Artifact) { if (confirmLeave()) { load(item); preview.value?.showModal() } }
if (store.artifacts[0]) load(store.artifacts[0])
async function save(status: 'draft' | 'archived') {
  saving.value = true
  saveError.value = ''
  const values = { ...form, evidence_ids: [...form.evidence_ids], status }
  try {
    const result = await store.saveArtifact(values, selectedId.value || undefined)
    selectedId.value = result.id
    form.status = status
    baseline.value = JSON.stringify(values)
    await loadDetails(result.id)
    notify(status === 'archived' ? '个人成果已归档，修订版本已保留。' : '成果草稿已保存。')
  } catch (cause) { saveError.value = cause instanceof Error ? cause.message : '保存未完成，请重试。'; reportError(cause) }
  finally { saving.value = false }
}
async function upload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !selectedId.value) return
  if (file.size > 10 * 1024 * 1024) { notify('附件不能超过 10 MB。', true); input.value = ''; return }
  uploading.value = true
  const id = selectedId.value
  try {
    const body = new FormData(); body.append('file', file)
    await request(`/artifacts/${id}/attachments`, { method: 'POST', body })
    if (selectedId.value === id) await loadDetails(id)
    notify('附件已保存在本机。')
  } catch (cause) { reportError(cause) }
  finally { uploading.value = false; input.value = '' }
}
</script>

<template>
  <div class="page-heading"><div><span class="eyebrow">RESEARCH OUTCOMES</span><h1>成果交流</h1></div><button class="button secondary" @click="preview?.showModal()"><Eye :size="16"/>预览作品</button></div>

  <section v-if="store.artifacts.length" class="outcome-showcase"><div class="section-heading"><div><span class="eyebrow">MY RESEARCH GALLERY</span><h2>我的研究作品</h2></div><span class="muted small">{{ store.artifacts.length }} 份作品 · 点击预览</span></div><div class="outcome-gallery"><button v-for="item in store.artifacts" :key="item.id" @click="previewSaved(item)"><div class="outcome-cover"><FileText :size="33" :stroke-width="1.2"/><span>RESEARCH / {{ String(item.version).padStart(2, '0') }}</span></div><div class="outcome-gallery-copy"><span class="status-tag" :class="{ green: item.status === 'archived' }">{{ item.status === 'archived' ? '个人归档' : '研究草稿' }}</span><h3>{{ item.title }}</h3><p>{{ item.summary || '尚未填写核心观点' }}</p><span>{{ item.evidence_ids.length }} 份证据 · v{{ item.version }}<ArrowRight :size="15"/></span></div></button></div></section>
  <div class="outcomes-layout"><aside class="outcome-list"><div class="section-heading"><h2>我的成果</h2><button class="icon-button" title="新建成果" aria-label="新建成果" :disabled="saving || uploading" @click="select()"><FilePlus2 :size="20" /></button></div><button v-for="item in store.artifacts" :key="item.id" class="outcome-list-item" :class="{ active: item.id === selectedId }" :disabled="saving || uploading" @click="select(item)"><FileText :size="19" /><span><strong>{{ item.title }}</strong><small>{{ item.status === 'archived' ? '个人归档' : '草稿' }} · v{{ item.version }} · {{ formatDate(item.updated_at) }}</small></span></button><div v-if="!store.artifacts.length" class="list-empty"><FileText :size="27" /><p>还没有保存的成果</p></div><button class="button subtle full" :disabled="saving || uploading" @click="select()"><FilePlus2 :size="16" />新建研究成果</button></aside>
    <section class="outcome-editor"><div class="section-heading"><div><span class="eyebrow">MY RESEARCH</span><h2>{{ current ? '完善研究成果' : '新的研究成果' }}</h2></div><span v-if="dirty" class="status-tag amber">未保存</span><span v-else-if="current" class="status-tag green"><Check :size="13" />v{{ current.version }} 已保存</span></div>
      <form @submit.prevent="save('draft')"><fieldset :disabled="saving"><label class="field-label" for="outcome-title">成果标题<span class="required-mark"> *</span></label><input id="outcome-title" v-model="form.title" required maxlength="120" placeholder="为你的研究拟一个明确的标题" /><label class="field-label" for="outcome-summary">核心观点</label><textarea id="outcome-summary" v-model="form.summary" rows="2" maxlength="500" placeholder="你目前的主要判断是什么？" /><label class="field-label" for="outcome-content">研究正文</label><textarea id="outcome-content" v-model="form.content" class="outcome-content" rows="12" maxlength="30000" placeholder="研究问题&#10;&#10;观察与证据&#10;&#10;解释与论证&#10;&#10;局限及进一步调查" />
        <div class="section-heading evidence-heading"><h3>关联论证板证据</h3><RouterLink to="/archive?tab=board" class="text-link small">回看论证板<ArrowRight :size="14" /></RouterLink></div><div v-if="!cited.length" class="inline-empty"><FileText :size="20" /><span>尚无论证板证据。草稿可先保存，归档前需关联证据。</span></div><label v-for="item in cited" :key="item.id" class="evidence-choice"><input v-model="form.evidence_ids" type="checkbox" :value="item.id" /><span><strong>{{ store.resource(item.favorite_id).title }}</strong><small>{{ item.observed }}</small></span></label><p v-if="form.evidence_ids.some((id) => !cited.some((item) => item.id === id))" class="validation-note">部分引用已移出论证板。再次保存前，请先在工作台恢复该证据。</p>
        <label v-for="id in removedCitations" :key="id" class="evidence-choice"><input v-model="form.evidence_ids" type="checkbox" :value="id" /><span><strong>{{ store.resource(id)?.title || id }}</strong><small>已移出论证板，可取消引用或回工作台恢复。</small></span></label>
      </fieldset><div class="form-actions outcome-actions"><button type="submit" class="button secondary" :disabled="saving || !form.title.trim()"><Save :size="16" />保存草稿</button><button type="button" class="button primary" :disabled="saving || !form.title.trim() || !form.content.trim() || !form.evidence_ids.length" @click="save('archived')"><Archive :size="16" />保存并归档</button><a v-if="current" :href="`/api/v1/artifacts/${current.id}/export`" class="button subtle" download><Download :size="16" />导出已保存版本</a></div><p v-if="saveError" class="form-error" role="alert">{{ saveError }} 输入已保留，可再次保存。</p><p class="save-caption">{{ current ? `上次保存 ${formatDate(current.updated_at)} · ${current.status === 'archived' ? '已归档' : '草稿'}` : '尚未保存' }}</p></form>
      <div v-if="current" class="outcome-extra"><section><div class="section-heading"><h3><Paperclip :size="17" />成果附件</h3><button class="text-link" :disabled="uploading" @click="fileInput?.click()"><Upload :size="15" />{{ uploading ? '上传中…' : '添加附件' }}</button><input ref="fileInput" type="file" hidden accept=".pdf,.png,.jpg,.jpeg,.webp,.md,.txt,.docx,.pptx" @change="upload" /></div><p v-if="detailsLoading" class="muted small">正在读取附件和修订记录…</p><p v-if="detailsError" class="validation-note">{{ detailsError }}<button class="text-link" @click="loadDetails(selectedId)">重试</button></p><p v-if="!attachments.length && !detailsLoading" class="muted small">暂无附件 · 单个文件不超过 10 MB</p><a v-for="item in attachments" :key="item.id" :href="`/api/v1/attachments/${item.id}`" class="attachment-row" download><Paperclip :size="15" /><span>{{ item.filename }}</span><small>{{ Math.max(1, Math.round(item.size / 1024)) }} KB</small><Download :size="15" /></a></section><section><div class="section-heading"><h3><History :size="17" />修订记录</h3><span class="muted small">{{ revisions.length }} 个已保存版本</span></div><details v-for="item in revisions" :key="item.version" class="revision-row"><summary><strong>v{{ item.version }}</strong><span>{{ item.title }}</span><time>{{ formatDate(item.updated_at) }}</time></summary><div class="revision-content"><p>{{ item.summary }}</p><p>{{ item.content || '该版本尚未填写正文。' }}</p><span class="muted small">{{ item.status === 'archived' ? '个人归档' : '草稿' }} · {{ item.evidence_ids.length }} 条证据引用</span></div></details></section></div>
    </section></div>
  <dialog ref="preview" class="standard-dialog outcome-preview" aria-labelledby="preview-title" @click="($event.target === preview) && preview?.close()"><div class="dialog-toolbar"><span class="eyebrow">RESEARCH / {{ current?.status === 'archived' ? '个人归档' : '草稿预览' }}</span><button class="icon-button" aria-label="关闭作品预览" @click="preview?.close()"><X :size="20"/></button></div><span class="status-tag green">柳杉衰退专题</span><h1 id="preview-title">{{ form.title || '尚未命名的研究成果' }}</h1><p class="preview-summary">{{ form.summary || '尚未填写核心观点。' }}</p><div class="preview-content">{{ form.content || '在编辑区写下研究问题、观察与证据、解释与论证、局限及进一步调查。' }}</div><section><h2>证据依据</h2><article v-for="item in cited.filter(e => form.evidence_ids.includes(e.id))" :key="item.id" class="preview-evidence"><img :src="store.resource(item.favorite_id).thumbnail" alt=""/><div><h3>{{ store.resource(item.favorite_id).title }}</h3><p>{{ item.observed }}</p><small>{{ store.resource(item.favorite_id).filename }}</small></div></article><p v-if="!form.evidence_ids.length" class="source-line">尚未关联论证板证据。</p></section><p class="source-line">当前编辑内容的预览。{{ dirty ? '有未保存修改。' : '与已保存版本一致。' }}</p></dialog>
</template>
