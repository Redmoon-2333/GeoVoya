<script setup lang="ts">
import { ref, watch } from 'vue'
const props = defineProps<{ src: string; alt: string }>()
const failed = ref(false), retry = ref(0)
watch(() => props.src, () => { failed.value = false; retry.value = 0 })
</script>
<template><img v-if="!failed" :src="retry ? `${src}?retry=${retry}` : src" :alt="alt" @error="failed = true"/><div v-else class="course-image-error" role="alert"><p>这张图片暂时无法加载。</p><button class="button secondary compact" @click="retry++; failed = false">重试图片</button></div></template>
