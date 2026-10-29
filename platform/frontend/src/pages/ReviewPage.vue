<script setup lang="ts">
import { Download, MessageSquare } from 'lucide-vue-next'
import { downloadText } from '../curriculum'
import { localState } from '../localState'
const items = [
  { id: 'nodes', title: '全景与采集点对应', status: '待提供', detail: '三处真实全景已可拖动观察；需要文件名、节点名、海拔带、植被类型、观察重点。' },
  { id: 'map', title: '数字沙盘与山地剖面', status: '待核验', detail: '当前为非实测教学示意。请确认四带边界、过渡区表达，并提供可使用的平面底图；真实剖面另需路线和高程数据。' },
  { id: 'season', title: '夏秋与叶片对照', status: '待补采', detail: '需要同地点、相近视角、明确拍摄时间的夏秋照片，以及有来源的叶片细节图。' },
  { id: 'course', title: '共同考察与四专题问题链', status: '待审阅', detail: '共同单元包含海拔带选择、笔记和带谱重建；柳杉样板保留完整取证流程，其余三专题为可编辑课程草案。' },
  { id: 'data', title: '资料摘要与调查数据', status: '待复核', detail: '已整理六份摘要。请核对出处、单位、调查年份、坡向与采样范围，避免把文献样地数据赋给照片节点。' },
  { id: 'guide', title: '知识问答与导学', status: '前端演示', detail: '支持本地资料检索问答及来源展示；真实模型、检索服务、语音与账号需后续接入。' },
  { id: 'outcome', title: '成果与评价', status: '待确认', detail: '可编辑、预览、归档、上传附件、保存修订和导出；确认必交成果形式、评价维度及教师反馈方式。' },
]
const notes = localState<Record<string, string>>('review-notes', {})
const confirmed = localState<string[]>('review-confirmed', [])
function exportReview() { downloadText('天目寻境-地理组对接记录.md', '# 天目·寻境 · 地理组对接记录\n\n'+items.map(item => `## ${confirmed.value.includes(item.id) ? '[已讨论]' : '[待讨论]'} ${item.title}\n\n当前状态：${item.status}\n\n${item.detail}\n\n讨论记录：${notes.value[item.id] || '尚未填写'}`).join('\n\n')) }
</script>
<template>
  <div class="page-heading"><div><span class="eyebrow">GEOGRAPHY × SOFTWARE</span><h1>地理组对接清单</h1><p>边体验边记录；讨论内容自动保存在当前浏览器。</p></div><button class="button primary" @click="exportReview"><Download :size="16"/>导出讨论记录</button></div><div class="review-intro"><MessageSquare :size="25"/><div><h2>先确认内容，再接入真实服务</h2><p>本页用于面对面讨论。勾选仅表示“已讨论”，不代表资料已提供或服务已接通。</p></div><span class="status-tag green">{{ confirmed.length }} / {{ items.length }} 已讨论</span></div><div class="review-list"><article v-for="(item, index) in items" :key="item.id"><div class="review-number">0{{ index + 1 }}</div><div><div class="section-heading"><h2>{{ item.title }}</h2><span class="status-tag amber">{{ item.status }}</span></div><p>{{ item.detail }}</p><label class="field-label" :for="`review-${item.id}`">讨论记录与负责人</label><textarea :id="`review-${item.id}`" v-model="notes[item.id]" rows="2" maxlength="3000" placeholder="记录意见、待补材料、负责人及预计时间…"/><label class="check-row"><input v-model="confirmed" type="checkbox" :value="item.id"/>本项已讨论</label></div></article></div>
</template>
