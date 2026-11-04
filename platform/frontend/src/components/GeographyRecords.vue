<script setup lang="ts">
import { ArrowRight, Bookmark, NotebookPen } from 'lucide-vue-next'
import { geographyRecords, geographyState } from '../course/geography'
import { downloadText } from '../curriculum'

function exportRecords() {
  downloadText('地带性探究记录.md', '# 我的地带性探究记录\n\n' + geographyRecords.value.map(record =>
    `## ${record.title}\n\n资料编号：${record.id} · ${record.group}\n\n${record.saved ? '已收藏\n\n' : ''}${record.note?.text || '尚无观察笔记'}\n\n回看：/geography/tianmu?page=${record.id}`,
  ).join('\n\n'))
}
</script>

<template>
  <section class="section-band geography-records">
    <div class="section-heading"><div><h2>地带性探究记录</h2><p class="muted small">已浏览 {{ geographyState.visited.length }} 项资料 · 当前浏览器保存</p></div><button v-if="geographyRecords.length" class="text-link" @click="exportRecords">导出探究记录<ArrowRight :size="15" /></button></div>
    <div v-if="!geographyRecords.length" class="inline-empty"><NotebookPen :size="22" /><span>在山地资料中收藏证据或记录观察后，可以在这里回看。</span><RouterLink to="/geography/tianmu" class="text-link">进入探究<ArrowRight :size="15" /></RouterLink></div>
    <RouterLink v-for="record in geographyRecords" :key="record.id" :to="`/geography/tianmu?page=${record.id}`" class="note-row"><Bookmark v-if="record.saved" :size="20" /><NotebookPen v-else :size="20" /><div><h3>{{ record.title }}</h3><p>{{ record.note?.text || `${record.group} · 已收藏资料` }}</p><span class="muted small">{{ record.id }} · {{ record.group }}</span></div><ArrowRight :size="16" /></RouterLink>
  </section>
</template>
