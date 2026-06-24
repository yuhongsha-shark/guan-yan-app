<script setup lang="ts">
import { useRouter, useRoute } from 'vue-router'
import { Trophy, List, Ellipsis } from '@lucide/vue'

const router = useRouter()
const route = useRoute()

const tabs = [
  { to: '/rankings', label: '榜单', icon: Trophy },
  { to: '/records', label: '记录', icon: List },
  { to: '/backup', label: '更多', icon: Ellipsis },
]

function isActive(tabTo: string): boolean {
  return route.path.startsWith(tabTo)
}
</script>

<template>
  <nav class="fixed bottom-0 left-0 right-0 z-50 md:hidden">
    <div class="flex justify-around items-center h-16 bg-white border-t-2 border-black/10">
      <button
        v-for="tab in tabs" :key="tab.to" @click="router.push(tab.to)"
        class="relative flex flex-col items-center justify-center flex-1 h-full transition-colors duration-200"
        :class="isActive(tab.to) ? 'text-black' : 'text-black/25 hover:text-black/50'">
        <component :is="tab.icon" :size="20" :stroke-width="isActive(tab.to) ? 2.5 : 1.5" />
        <span class="text-[10px] mt-0.5 font-black tracking-[.15em]">{{ tab.label }}</span>
      </button>
    </div>
  </nav>
</template>
