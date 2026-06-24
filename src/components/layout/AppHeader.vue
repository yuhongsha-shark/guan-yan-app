<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ArrowLeft, Music } from '@lucide/vue'

const route = useRoute()
const router = useRouter()

function scrollToTop() {
  window.scrollTo({ top: 0, behavior: 'smooth' })
}

const isDark = ref(false)
function toggleDark() {
  isDark.value = !isDark.value
  document.documentElement.classList.toggle('dark', isDark.value)
  localStorage.setItem('dark-mode', isDark.value ? '1' : '0')
}
// 恢复暗色模式偏好
const saved = localStorage.getItem('dark-mode')
if (saved === '1') {
  isDark.value = true
  document.documentElement.classList.add('dark')
}
</script>

<template>
  <header class="sticky top-0 z-40 border-b-2 border-black/10 bg-white select-none" @dblclick="scrollToTop">
    <div class="flex items-center justify-between px-5 py-3">
      <div class="flex items-center gap-3">
        <button
          v-if="(route.meta as any).parent === 'records'"
          @click="router.back()"
          class="text-black/40 hover:text-black transition-colors p-1"
        >
          <ArrowLeft :size="18" :stroke-width="2" />
        </button>
        <div class="flex items-center gap-2">
          <Music :size="18" :stroke-width="2" class="text-black" />
          <h1 class="text-sm font-black text-black tracking-tight">
            {{ (route.meta as any).title || '观演红黑榜' }}
          </h1>
        </div>
      </div>
      <div class="flex items-center gap-2">
        <button class="text-xs font-black text-black/30 hover:text-black transition-colors px-2 py-1" @click="toggleDark" :title="isDark ? '亮色模式' : '暗色模式'">
          {{ isDark ? '☀' : '☾' }}
        </button>
        <slot name="actions" />
      </div>
    </div>
  </header>
</template>
