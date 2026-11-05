<script setup lang="ts">
import { Play } from 'lucide-vue-next'
import type { IntroVideo } from '../course/introVideos'

defineProps<{ video: IntroVideo }>()
</script>

<template>
  <figure class="intro-video">
    <video v-if="video.src" controls preload="none" :poster="video.poster" :aria-label="video.title"><source :src="video.src" /></video>
    <div v-else class="intro-video-placeholder">
      <img :src="video.poster" :alt="`${video.title}封面`" loading="lazy" />
      <span class="media-tag"><Play :size="12" />视频整理中</span>
    </div>
    <figcaption><strong>{{ video.title }}</strong><span v-if="video.duration" class="muted small">{{ video.duration }}</span><p>{{ video.description }}</p></figcaption>
  </figure>
</template>
