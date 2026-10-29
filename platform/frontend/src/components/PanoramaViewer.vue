<script setup lang="ts">
import { onBeforeUnmount, onMounted, ref } from 'vue'
import { ChevronLeft, ChevronRight, Maximize2, Minus, Plus, RotateCcw } from 'lucide-vue-next'
const canvas = ref<HTMLCanvasElement>(), container = ref<HTMLElement>()
const scene = ref(0), loading = ref(true), error = ref('')
const sources = ['CAM_20260818103558_0030_D.JPG', 'CAM_20260818103703_0032_D.JPG', 'CAM_20260818103812_0034_D.JPG']
let gl: WebGLRenderingContext | null = null, program: WebGLProgram | null = null, texture: WebGLTexture | null = null
let yaw = 0, pitch = 0, fov = 1.35, drag: { x: number; y: number } | null = null, observer: ResizeObserver | undefined, image: HTMLImageElement | undefined, disposed = false
function draw() {
  if (!gl || !program || !canvas.value) return
  const c = canvas.value, size = c.getBoundingClientRect(), scale = Math.min(devicePixelRatio, 2)
  c.width = Math.max(1, size.width * scale); c.height = Math.max(1, size.height * scale)
  gl.viewport(0, 0, c.width, c.height)
  gl.uniform2f(gl.getUniformLocation(program, 'angles'), yaw, pitch)
  gl.uniform2f(gl.getUniformLocation(program, 'lens'), c.width / c.height, Math.tan(fov / 2))
  gl.drawArrays(gl.TRIANGLES, 0, 6)
}
function load(index: number) {
  if (!gl || !texture) { loading.value = false; error.value = '当前设备不支持全景渲染，可查看原始展开图。'; return }
  scene.value = index; loading.value = true; error.value = ''; yaw = 0; pitch = 0
  if (image) { image.onload = null; image.onerror = null }
  image = new Image()
  image.onload = () => {
    if (disposed || !gl || !texture) return
    gl.bindTexture(gl.TEXTURE_2D, texture)
    gl.pixelStorei(gl.UNPACK_FLIP_Y_WEBGL, true)
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image!)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE)
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE)
    loading.value = false; draw()
  }
  image.onerror = () => { loading.value = false; error.value = '全景素材未就绪，请先运行素材准备脚本。' }
  image.src = `/media/panorama-${index + 1}.webp`
}
function move(event: PointerEvent) {
  if (!drag) return
  yaw -= (event.clientX - drag.x) * .005; pitch = Math.max(-1.3, Math.min(1.3, pitch + (event.clientY - drag.y) * .005))
  drag = { x: event.clientX, y: event.clientY }; draw()
}
function zoom(delta: number) { fov = Math.max(.5, Math.min(2, fov + delta)); draw() }
function key(event: KeyboardEvent) {
  if (!['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown', '+', '-'].includes(event.key)) return
  event.preventDefault()
  if (event.key === 'ArrowLeft') yaw -= .12
  if (event.key === 'ArrowRight') yaw += .12
  if (event.key === 'ArrowUp') pitch = Math.min(1.3, pitch + .12)
  if (event.key === 'ArrowDown') pitch = Math.max(-1.3, pitch - .12)
  if (event.key === '+') zoom(-.1)
  if (event.key === '-') zoom(.1)
  draw()
}
async function fullscreen() {
  try { if (document.fullscreenElement) await document.exitFullscreen(); else await container.value?.requestFullscreen() }
  catch { error.value = '当前浏览器无法进入全屏，可继续在页面中观察。' }
}
onMounted(() => {
  gl = canvas.value!.getContext('webgl', { preserveDrawingBuffer: true })
  if (!gl) { loading.value = false; error.value = '当前设备不支持全景渲染，可查看下方原始展开图。'; return }
  function shader(type: number, source: string) {
    const s = gl!.createShader(type)!; gl!.shaderSource(s, source); gl!.compileShader(s)
    if (!gl!.getShaderParameter(s, gl!.COMPILE_STATUS)) throw new Error('全景渲染器初始化失败。')
    return s
  }
  try {
    const vertex = shader(gl.VERTEX_SHADER, 'attribute vec2 pos; varying vec2 uv; void main(){uv=pos;gl_Position=vec4(pos,0.,1.);}')
    const fragment = shader(gl.FRAGMENT_SHADER, `precision mediump float; varying vec2 uv; uniform sampler2D photo; uniform vec2 angles; uniform vec2 lens;
      void main(){vec3 d=normalize(vec3(uv.x*lens.x*lens.y,uv.y*lens.y,1.));float cp=cos(angles.y),sp=sin(angles.y);d=vec3(d.x,d.y*cp+d.z*sp,-d.y*sp+d.z*cp);float cy=cos(angles.x),sy=sin(angles.x);d=vec3(d.x*cy+d.z*sy,d.y,-d.x*sy+d.z*cy);vec2 p=vec2(atan(d.x,d.z)/6.2831853+.5,asin(clamp(d.y,-1.,1.))/3.14159265+.5);gl_FragColor=texture2D(photo,p);}`)
    program = gl.createProgram()!; gl.attachShader(program, vertex); gl.attachShader(program, fragment); gl.linkProgram(program)
    gl.deleteShader(vertex); gl.deleteShader(fragment)
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error('全景渲染器初始化失败。')
    gl.useProgram(program)
    const buffer = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, buffer)
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1,1,-1,-1,1,-1,1,1,-1,1,1]), gl.STATIC_DRAW)
    const position = gl.getAttribLocation(program, 'pos'); gl.enableVertexAttribArray(position); gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0)
    texture = gl.createTexture(); observer = new ResizeObserver(draw); observer.observe(canvas.value!); load(0)
  } catch (cause) { loading.value = false; error.value = (cause as Error).message }
})
onBeforeUnmount(() => { disposed = true; observer?.disconnect(); if (image) { image.onload = null; image.onerror = null } gl?.getExtension('WEBGL_lose_context')?.loseContext() })
</script>

<template>
  <div ref="container" class="panorama-stage">
    <canvas ref="canvas" tabindex="0" aria-label="360度全景，拖动或使用方向键观察，按加减键缩放" @keydown="key" @pointerdown="drag = { x: $event.clientX, y: $event.clientY }; canvas?.setPointerCapture($event.pointerId)" @pointermove="move" @pointerup="drag = null" @pointercancel="drag = null" @wheel.prevent="zoom($event.deltaY * .001)" />
    <div class="panorama-caption"><span class="live-dot" />团队实拍 · 360° 全景 <span>{{ scene + 1 }} / 3</span></div>
    <div v-if="loading" class="viewer-message" role="status">正在加载全景…</div>
    <div v-if="error" class="viewer-message" role="alert"><p>{{ error }}</p><a :href="`/media/panorama-${scene + 1}.webp`" target="_blank" rel="noopener" class="button light">查看展开图</a><button class="button light" @click="load(scene)">重新加载</button></div>
    <div class="panorama-hint">拖动环视 · 滚轮缩放 · 方向键观察</div>
    <div class="panorama-controls"><button class="icon-button" aria-label="缩小全景" @click="zoom(.15)"><Minus :size="18" /></button><button class="icon-button" aria-label="放大全景" @click="zoom(-.15)"><Plus :size="18" /></button><button class="icon-button" aria-label="重置全景视角" @click="yaw = 0; pitch = 0; fov = 1.35; draw()"><RotateCcw :size="18" /></button><button class="icon-button" aria-label="全屏全景" @click="fullscreen"><Maximize2 :size="18" /></button></div>
  </div>
  <div class="viewer-bottom"><button class="button secondary compact" :disabled="scene === 0" @click="load(scene - 1)"><ChevronLeft :size="16" />上一处影像</button><span>素材序号不代表地理路线</span><button class="button secondary compact" :disabled="scene === 2" @click="load(scene + 1)">下一处影像<ChevronRight :size="16" /></button></div>
  <details class="source-details"><summary>全景来源与点位说明</summary><p>团队素材 / 天目山全景图片-202608 / CAM_001 / {{ sources[scene] }}</p><p>本地全景播放器；采集点、海拔和植被带归属待核验。当前不与下方普通照片绑定，也不读取 720 云内部事件。</p></details>
</template>
