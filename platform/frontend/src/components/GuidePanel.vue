<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, Bot, ChevronDown, Compass, Lightbulb, LoaderCircle, MessageCircle, Send, X } from 'lucide-vue-next'
import { useFieldworkStore } from '../stores/fieldwork'
import { reportError } from '../notice'

const open = ref(false)
const expanded = ref(false)
const question = ref('')
const asking = ref(false)
const store = useFieldworkStore()
const route = useRoute()
const messages = ref<{ role: 'guide' | 'student'; text: string; sources?: string[] }[]>([])
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
const prompts = computed(() => store.catalog?.guide_prompts || [])

async function ask(value = question.value) {
  const text = value.trim()
  if (!text || asking.value) return
  question.value = ''
  messages.value.push({ role: 'student', text })
  asking.value = true
  try {
    const reply = await store.askGuide(text, route.path)
    messages.value.push({ role: 'guide', text: reply.answer, sources: reply.sources })
  } catch (cause) {
    reportError(cause)
  } finally {
    asking.value = false
  }
}
</script>

<template>
  <button v-if="!open" class="guide-launcher" title="打开小目导学" aria-label="打开小目导学" @click="open = true"><Bot :size="21" /><span>小目</span><span class="guide-launch-label">导学助手</span></button>
  <section v-else class="guide-panel" aria-label="小目导学助手">
    <div class="guide-panel-head"><span class="guide-avatar"><Bot :size="24" /></span><div><h2>小目</h2><p>本地知识包 · 可追溯回答</p></div><button class="icon-button" aria-label="收起小目" @click="open = false"><X :size="19" /></button></div>
    <div v-if="!messages.length" class="guide-message"><Lightbulb :size="20" /><p>{{ hint[0] }}</p></div>
    <div v-else class="guide-chat" aria-live="polite">
      <div v-for="(message, index) in messages" :key="`${message.role}-${index}`" class="guide-chat-message" :class="message.role">
        <span>{{ message.text }}</span>
        <small v-if="message.sources?.length">依据：{{ message.sources.join('；') }}</small>
      </div>
      <div v-if="asking" class="guide-chat-message guide"><LoaderCircle class="spin" :size="15" /><span>正在查阅本地知识包…</span></div>
    </div>
    <div v-if="!messages.length" class="guide-prompts">
      <button v-for="prompt in prompts" :key="prompt" class="guide-prompt" @click="ask(prompt)">{{ prompt }}</button>
    </div>
    <p v-if="expanded" class="guide-detail">{{ hint[1] }}</p>
    <form class="guide-input" @submit.prevent="ask()">
      <input v-model="question" maxlength="1200" placeholder="问一个与研学有关的问题…" aria-label="向小目提问" :disabled="asking" />
      <button class="icon-button" type="submit" title="发送问题" aria-label="发送问题" :disabled="asking || !question.trim()"><Send :size="16" /></button>
    </form>
    <button class="button subtle full" @click="expanded = !expanded"><MessageCircle :size="16" />{{ expanded ? '收起方法提示' : '展开方法提示' }}<ChevronDown :size="15" /></button>
    <RouterLink to="/explore" class="button primary full" @click="open = false"><Compass :size="16" />回到实景观察<ArrowRight :size="16" /></RouterLink>
  </section>
</template>
