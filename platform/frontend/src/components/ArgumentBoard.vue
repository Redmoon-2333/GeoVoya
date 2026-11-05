<script setup lang="ts">
import { ArrowRight, FileStack } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'

const store = useFieldworkStore()
const emit = defineEmits<{ workbench: []; edit: [resourceId: string] }>()
const roles = { uncertain: '暂不判断', support: '支持解释', weaken: '削弱解释', background: '背景资料' }
</script>

<template>
  <div class="section-heading board-heading"><div><span class="eyebrow">RESEARCH ARGUMENT BOARD</span><h2>柳杉衰退 · 我的证据链</h2></div><RouterLink v-if="store.board.length" to="/outcomes" class="button primary">形成成果<ArrowRight :size="16" /></RouterLink></div>
  <div v-if="!store.board.length" class="empty-state"><FileStack :size="40" :stroke-width="1.3" /><h2>还没有组织好的证据</h2><p>分析完成的资料会在这里与研究问题建立联系。</p><button class="button secondary" @click="emit('workbench')">前往证据工作台<ArrowRight :size="16" /></button></div>
  <div v-else class="argument-list"><article v-for="item in store.board" :key="item.id" class="argument-item"><div class="argument-head"><img :src="store.resource(item.favorite_id).thumbnail" alt="" /><div><span class="status-tag" :class="{ green: item.role === 'support', amber: item.role === 'uncertain' }">{{ roles[item.role] }}</span><h3>{{ store.resource(item.favorite_id).title }}</h3><span class="muted small">{{ store.theme?.questions.find((question) => question.id === item.question_id)?.title }}</span></div><button class="text-link" @click="emit('edit', item.favorite_id)">修改分析<ArrowRight :size="15" /></button></div><dl class="argument-details"><div><dt>可见事实</dt><dd>{{ item.observed }}</dd></div><div><dt>研究含义</dt><dd>{{ item.meaning }}</dd></div><div><dt>待补证据</dt><dd>{{ item.missing }}</dd></div></dl><p class="source-line">适用范围：{{ item.scope || '尚未单独说明' }} · {{ store.resource(item.favorite_id).filename }}</p></article></div>
</template>
