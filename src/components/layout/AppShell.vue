<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRoute } from 'vue-router'
import { Trophy, List, Download } from '@lucide/vue'
import AppHeader from './AppHeader.vue'
import BottomTabBar from './BottomTabBar.vue'

const route = useRoute()

const isMobile = ref(window.innerWidth < 768)
window.addEventListener('resize', () => {
  isMobile.value = window.innerWidth < 768
})

const showBottomNav = computed(() => {
  const tabRoutes = ['/rankings', '/records', '/dimensions', '/poster', '/backup']
  return isMobile.value && tabRoutes.some(r => route.path.startsWith(r))
})
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <AppHeader />

    <div class="flex flex-1" v-if="!isMobile">
      <aside class="w-56 flex-shrink-0 border-r-2 border-black/10 bg-white p-5">
        <nav class="space-y-0.5 sticky top-20">
          <p class="px-3 text-[10px] font-black text-black/30 tracking-[.15em] mb-3">核心</p>
          <router-link
            v-for="item in [
              { to: '/rankings', label: '红黑榜单', icon: Trophy },
              { to: '/records', label: '演出记录', icon: List },
            ]"
            :key="item.to" :to="item.to"
            class="flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-colors duration-200"
            :class="route.path.startsWith(item.to)
              ? 'bg-black text-white'
              : 'text-black/40 hover:text-black hover:bg-black/[0.03]'"
          >
            <component :is="item.icon" :size="17" :stroke-width="1.5" />
            {{ item.label }}
          </router-link>

          <p class="px-3 text-[10px] font-black text-black/30 tracking-[.15em] mt-5 mb-3">数据</p>
          <router-link
            to="/backup"
            class="flex items-center gap-3 px-3 py-2.5 text-xs font-bold transition-colors duration-200"
            :class="route.path === '/backup'
              ? 'bg-black text-white'
              : 'text-black/40 hover:text-black hover:bg-black/[0.03]'"
          >
            <Download :size="17" :stroke-width="1.5" />
            数据备份
          </router-link>
        </nav>
      </aside>

      <main class="flex-1 flex flex-col overflow-auto">
        <router-view />
      </main>
    </div>

    <main class="flex-1 flex flex-col overflow-auto pb-16" v-else>
      <router-view />
    </main>

    <BottomTabBar v-if="showBottomNav" />
  </div>
</template>
