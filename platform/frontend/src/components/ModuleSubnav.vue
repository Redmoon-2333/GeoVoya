<script setup lang="ts">
import { useRoute } from 'vue-router'
import { Globe2, Map, Mountain } from 'lucide-vue-next'

const route = useRoute()
const links = [
  { path: '/explore', title: '实地观察', icon: Map },
  { path: '/geography/tianmu', title: '垂直地带性', icon: Mountain },
  { path: '/geography/atlas', title: '星球植被图鉴', icon: Globe2 },
]
</script>

<template>
  <nav class="module-subnav" aria-label="空间探索">
    <RouterLink v-for="item in links" :key="item.path" :to="item.path" :aria-current="route.path === item.path ? 'page' : undefined"><component :is="item.icon" :size="17" />{{ item.title }}</RouterLink>
  </nav>
</template>
