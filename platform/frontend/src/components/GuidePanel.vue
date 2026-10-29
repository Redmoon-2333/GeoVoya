<script setup lang="ts">
import { computed, nextTick, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, Bot, ChevronDown, Compass, Lightbulb, MessageCircle, Send, X } from 'lucide-vue-next'
import { knowledge } from '../curriculum'

const open = ref(false)
const expanded = ref(false)
const route = useRoute()
const input = ref(''), questionInput = ref<HTMLInputElement>(), launcher = ref<HTMLButtonElement>()
const answers = ref<{ question: string; text: string; source: string }[]>([])
async function show() { open.value = true; await nextTick(); questionInput.value?.focus() }
async function close() { open.value = false; await nextTick(); launcher.value?.focus() }
function ask(value = input.value) {
  const text = value.trim(); if (!text) return
  const matches = knowledge.map(item => ({ item, score: item.tags.reduce((n, tag) => n + (text.includes(tag) ? 2 : 0), 0) + (text.includes(item.category) ? 1 : 0) })).sort((a, b) => b.score - a.score)
  const item = matches[0]?.score ? matches[0].item : undefined
  answers.value.push({ question: text, text: item?.text || '当前课程资料没有匹配到这个问题。可以尝试“海拔与带谱”“土壤含水率”或“怎样记录观察”，也可以把问题加入研究计划，请地理组补充资料。', source: item?.source || '' }); input.value = ''
  nextTick(() => { questionInput.value?.focus(); questionInput.value?.scrollIntoView({ block: 'nearest' }) })
}
const hint = computed(() => {
  switch (route.path) {
    case '/explore': return ['先记录你在画面中能直接看到的内容，再把推测放进“疑问”。', '比较两张照片时，留意拍摄方向、光照与范围是否相同。画面差异不一定代表真实的环境变化。']
    case '/inquiry': return ['把驱动性问题拆成能观察、能比较、能查证的小问题。', '先提出一种可能解释，再写出：如果解释成立，应该找到什么资料？也要寻找可能反驳它的证据。']
    case '/archive': return ['收藏是研究的起点。想把资料用作证据，还需要说明它与问题的关系。', '分别写清“看到了什么”“能说明什么”“还缺什么”。不确定时可以保留判断，无需强行选择支持或削弱。']
    case '/outcomes': return ['把问题、证据、推理和局限连起来，让读者能顺着出处回到原始资料。', '检查正文是否超出证据范围。照片可以支持可见现象，变化趋势和成因还需要对照、时间序列或其他资料。']
    case '/feedback': return ['回看一条观察，看看你的解释因哪些资料发生了变化。', '过程提示帮助发现缺漏，不代替科学评价。优先补充与你的核心解释直接相关的材料。']
    default: return ['从一张实景照片开始，留下你的独立观察。', '先观察，再收藏，随后把资料组织成有依据的解释。每一步都可以回来修改。']
  }
})
</script>

<template>
  <button v-if="!open" ref="launcher" class="guide-launcher" title="打开小天课程提示" aria-label="打开小天课程提示" @click="show"><Bot :size="21" /><span>小天</span><span class="guide-launch-label">研学助手</span></button>
  <section v-else class="guide-panel" aria-label="小天课程提示" role="dialog" @keydown.esc.stop="close">
    <div class="guide-panel-head"><span class="guide-avatar"><Bot :size="24" /></span><div><h2>小天 · 研学助手</h2><p>本地资料问答 / 固定脚本导学</p></div><button class="icon-button" aria-label="收起小天" @click="close"><X :size="19" /></button></div>
    <div class="guide-message"><Lightbulb :size="20" /><p>{{ hint[0] }}</p></div>
    <p v-if="expanded" class="guide-detail">{{ hint[1] }}</p>
    <button class="button subtle full" @click="expanded = !expanded"><MessageCircle :size="16" />{{ expanded ? '收起方法提示' : '展开方法提示' }}<ChevronDown :size="15" /></button>
    <div class="guide-suggestions"><button v-for="q in ['海拔与带谱', '土壤含水率', '怎样记录观察']" :key="q" @click="ask(q)">{{ q }}<ArrowRight :size="12"/></button></div><div class="guide-conversation" aria-live="polite"><div v-for="(answer, i) in answers" :key="i" class="guide-answer"><strong>{{ answer.question }}</strong><p>{{ answer.text }}</p><small v-if="answer.source">资料来源：{{ answer.source }}</small></div></div><form class="guide-input" @submit.prevent="ask()"><label for="guide-question">向课程资料提问</label><div><input id="guide-question" ref="questionInput" v-model="input" maxlength="200" placeholder="例如：海拔与植被有什么关系？"/><button type="submit" class="icon-button" aria-label="提交课程问题" :disabled="!input.trim()"><Send :size="18"/></button></div></form><p class="guide-boundary">依据资料关键词返回摘要，尚未接入生成式模型。</p><RouterLink to="/explore" class="text-link" @click="open = false"><Compass :size="16" />回到实景观察<ArrowRight :size="16" /></RouterLink>
  </section>
</template>
