<script setup lang="ts">
import type { RankedResult } from '@/types/ranking'
import RankCard from './RankCard.vue'

defineProps<{
  results: RankedResult[]
  scale?: number
}>()
</script>

<template>
  <div class="space-y-8">
    <!-- 红榜 -->
    <div id="rank-section-red" v-if="results.filter(r => r.rankClass === 'red').length > 0">
      <h3 class="text-xs font-black tracking-[.15em] text-black mb-3">
        红榜 · 高性价比 ({{ results.filter(r => r.rankClass === 'red').length }})
      </h3>
      <div class="space-y-1">
        <RankCard
          v-for="(r, i) in results.filter(r => r.rankClass === 'red')"
          :key="r.recordId" :result="r" :index="i" :scale="scale"
        />
      </div>
    </div>

    <!-- 灰榜 -->
    <div id="rank-section-grey" v-if="results.filter(r => r.rankClass === 'gray').length > 0">
      <h3 class="text-xs font-black uppercase tracking-[.15em] text-black/30 mb-3">
        灰榜 · 中等 ({{ results.filter(r => r.rankClass === 'gray').length }})
      </h3>
      <div class="space-y-1">
        <RankCard
          v-for="(r, i) in results.filter(r => r.rankClass === 'gray')"
          :key="r.recordId" :result="r"
          :index="results.filter(r => r.rankClass === 'red').length + i" :scale="scale"
        />
      </div>
    </div>

    <!-- 黑榜 -->
    <div id="rank-section-black" v-if="results.filter(r => r.rankClass === 'black').length > 0">
      <h3 class="text-xs font-black uppercase tracking-[.15em] text-black/50 mb-3">
        黑榜 · 低性价比 ({{ results.filter(r => r.rankClass === 'black').length }})
      </h3>
      <div class="space-y-1">
        <RankCard
          v-for="(r, i) in results.filter(r => r.rankClass === 'black')"
          :key="r.recordId" :result="r"
          :index="results.filter(r => r.rankClass !== 'black').length + i" :scale="scale"
        />
      </div>
    </div>
  </div>
</template>
