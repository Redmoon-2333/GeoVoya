<script setup lang="ts">
import { computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import { ArrowRight, Bot, ChevronDown, Compass, Lightbulb, MessageCircle, X } from 'lucide-vue-next'

const open = ref(false)
const expanded = ref(false)
const route = useRoute()
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
  <button v-if="!open" class="guide-launcher" title="打开小天课程提示" aria-label="打开小天课程提示" @click="open = true"><Bot :size="21" /><span>小天</span><span class="guide-launch-label">课程提示</span></button>
  <section v-else class="guide-panel" aria-label="小天课程提示">
    <div class="guide-panel-head"><span class="guide-avatar"><Bot :size="24" /></span><div><h2>小天</h2><p>课程提示 · 固定脚本</p></div><button class="icon-button" aria-label="收起小天" @click="open = false"><X :size="19" /></button></div>
    <div class="guide-message"><Lightbulb :size="20" /><p>{{ hint[0] }}</p></div>
    <p v-if="expanded" class="guide-detail">{{ hint[1] }}</p>
    <button class="button subtle full" @click="expanded = !expanded"><MessageCircle :size="16" />{{ expanded ? '收起方法提示' : '展开方法提示' }}<ChevronDown :size="15" /></button>
    <RouterLink to="/explore" class="button primary full" @click="open = false"><Compass :size="16" />回到实景观察<ArrowRight :size="16" /></RouterLink>
  </section>
</template>
