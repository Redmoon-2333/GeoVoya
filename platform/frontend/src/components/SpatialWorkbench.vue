<script setup lang="ts">
import { computed, ref } from 'vue'
import { ArrowDown, ArrowUp, ArrowRight, Check, RotateCcw } from 'lucide-vue-next'
import { bands, downloadText } from '../curriculum'
import { localState } from '../localState'
const props = defineProps<{ mode: 'terrain' | 'profile' }>()
const selected = ref(0), reveal = ref(false), submitted = ref(false), checked = ref(false)
const notes = localState<Record<string, string>>('band-notes', {})
const order = localState<string[]>('band-order', ['mixed', 'dwarf', 'evergreen', 'deciduous'])
const attempts = localState<number>('band-attempts', 0)
const lastCheck = localState<boolean | null>('band-last-check', null)
const correct = computed(() => order.value.every((id, i) => id === bands[i]?.id))
const points = [{ x: 180, y: 336 }, { x: 355, y: 252 }, { x: 520, y: 176 }, { x: 650, y: 108 }]
function move(index: number, delta: number) {
  const next = [...order.value]; [next[index], next[index + delta]] = [next[index + delta]!, next[index]!]; order.value = next; submitted.value = false; lastCheck.value = null
}
function submit() { attempts.value++; submitted.value = true; lastCheck.value = correct.value }
</script>

<template>
  <div class="spatial-heading"><div><span class="eyebrow">{{ props.mode === 'terrain' ? 'DIGITAL SANDBOX' : 'MOUNTAIN TRANSECT' }}</span><h2>{{ props.mode === 'terrain' ? '沿山地，寻找植被的变化' : '重建你理解的垂直带谱' }}</h2></div><span class="status-tag amber">教学示意 · 非实测地形</span></div>
  <div class="mountain-canvas" :class="{ profile: mode === 'profile' }">
    <svg viewBox="0 0 800 440" role="img" aria-label="四个植被带的海拔分布示意，非真实路线或DEM">
      <defs><linearGradient id="mountain-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#9db5a1"/><stop offset="1" stop-color="#2e6550"/></linearGradient><linearGradient id="sky-fill" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#e6efeb"/><stop offset="1" stop-color="#f8faf6"/></linearGradient></defs>
      <rect width="800" height="440" fill="url(#sky-fill)"/>
      <path d="M0 275L80 220L135 250L228 145L290 185L405 100L500 177L600 65L690 135L800 104V440H0Z" fill="#c7d6cc"/>
      <path d="M0 350L85 305L180 320L262 266L355 235L420 209L520 159L584 132L650 75L716 120L800 180V440H0Z" fill="url(#mountain-fill)"/>
      <g fill="none" stroke="#ffffff" opacity=".22"><path v-for="n in 8" :key="n" :d="`M0 ${350 + n*12}Q160 ${350+n*8} 350 ${240+n*12}T650 ${92+n*13}L800 ${180+n*18}`"/></g>
      <g v-if="mode === 'profile'" stroke="#fff" stroke-dasharray="5 5" opacity=".55"><path d="M80 320H760M80 235H760M80 159H760M80 75H760"/></g>
      <path d="M180 336Q240 300 355 252T520 176T650 108" fill="none" stroke="#f5db9b" stroke-width="3" stroke-dasharray="7 7"/>
      <g fill="#245141" font-size="14"><text x="28" y="45">海拔带示意</text><text x="620" y="395">由低到高 · 不按比例</text></g>
    </svg>
    <button v-for="(point, i) in points" :key="i" class="mountain-node" :class="{ selected: selected === i }" :style="{ left: `${point.x/8}%`, top: `${point.y/4.4}%` }" :aria-pressed="selected === i" :aria-label="`选择第${i+1}海拔带`" @click="selected = i"><span>{{ String(i + 1).padStart(2, '0') }}</span><small>{{ bands[i]?.range }}</small></button>
    <span class="map-legend"><i />示意样带 <i class="outlined" />可选观察带</span>
  </div>
  <div class="band-detail"><span class="status-tag green">观察带 {{ selected + 1 }}</span><div><h3>{{ reveal ? bands[selected]?.title : '先观察，再判断植被类型' }}</h3><p>{{ bands[selected]?.range }} · {{ bands[selected]?.note }}</p></div><button class="text-link" :aria-expanded="reveal" @click="reveal = !reveal">{{ reveal ? '隐藏参考名称' : '查看参考名称' }}</button></div>
  <p class="source-line">依据《天目山土壤与气候的垂直地带性》§1。700–850 m 按过渡区理解；边界并非骤变。节点仅表示教学海拔带，不对应现有照片的采集位置。</p>
  <label class="field-label" :for="`band-note-${mode}`">我的带谱笔记 · 浏览器自动保存</label><textarea :id="`band-note-${mode}`" v-model="notes[bands[selected]!.id]" rows="3" maxlength="2000" placeholder="我依据哪些特征判断？还需要哪些观察？" />
  <div class="form-actions"><button class="button secondary" @click="downloadText('垂直带谱笔记.md', '# 我的垂直带谱笔记\n\n'+bands.map(b => `## ${b.range}\n${notes[b.id] || '尚无记录'}`).join('\n\n'))">导出带谱笔记</button><RouterLink to="/explore?view=panorama" class="text-link">去全景中观察<ArrowRight :size="16" /></RouterLink></div>
  <section class="band-challenge"><div class="section-heading"><div><span class="eyebrow">REBUILD THE VEGETATION BELTS</span><h2>共同任务 · 带谱重建</h2></div><span class="muted small">已提交 {{ attempts }} 次</span></div><p>按海拔由低到高排列；用上下按钮调整，键盘也可操作。</p><ol class="sort-list"><li v-for="(id, i) in order" :key="id"><span>{{ i + 1 }}</span><strong>{{ bands.find(b => b.id === id)?.title }}</strong><button class="icon-button" :disabled="i === 0" :aria-label="`上移${bands.find(b => b.id === id)?.title}`" @click="move(i, -1)"><ArrowUp :size="17" /></button><button class="icon-button" :disabled="i === 3" :aria-label="`下移${bands.find(b => b.id === id)?.title}`" @click="move(i, 1)"><ArrowDown :size="17" /></button></li></ol><div class="form-actions"><button class="button primary" @click="submit"><Check :size="16" />检查带谱</button><button class="button secondary" @click="order = ['mixed', 'dwarf', 'evergreen', 'deciduous']; submitted = false; lastCheck = null"><RotateCcw :size="16" />重新排列</button></div><div v-if="submitted" class="inline-feedback" :class="{ success: correct }" role="status">{{ correct ? '排列正确。继续思考：水热条件和坡向如何影响这个分布？' : '还有位置需要调整。先找出低海拔的常绿阔叶林与高海拔的落叶矮林，再判断中间两带。' }}</div>
    <details class="source-details"><summary>继续追问：带谱边界一定是清晰的线吗？</summary><p>植被分布具有过渡性；海拔还与坡向、母质及人类活动共同影响生境。课堂中的四带划分是概括，不能直接替代具体样地调查。</p><label class="check-row"><input v-model="checked" type="checkbox"/>我能区分教学带谱与真实样地的差异</label></details>
  </section>
</template>
