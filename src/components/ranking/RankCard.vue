<script setup lang="ts">
import { computed } from 'vue'
import type { RankedResult } from '@/types/ranking'
import { formatScore } from '@/engine/ranking'

const props = defineProps<{
  result: RankedResult
  index: number
  scale?: number
}>()

function priceDiffTag(price: number, benchmark: number): { text: string; cls: string } {
  if (benchmark <= 0) return { text: '无基准', cls: '' }
  const diff = ((price - benchmark) / benchmark) * 100
  if (diff > 5) return { text: `溢价${diff.toFixed(0)}%`, cls: '' }
  if (diff < -5) return { text: `低${Math.abs(diff).toFixed(0)}%`, cls: '' }
  return { text: '平价', cls: '' }
}

const starDisplay = computed(() => {
  if (props.scale !== 5) return null
  const s = props.result.mappedScore
  const full = Math.floor(s)
  const half = s - full >= 0.25 ? 1 : 0
  const empty = 5 - full - half
  return { full, half, empty }
})

function toStars(val: number): string {
  return (Math.round(val / 10) / 2).toFixed(1)
}
</script>

<template>
  <div
    :id="'rank-card-' + result.recordId"
    class="flex items-center gap-4 py-3 px-4 border-2 transition-colors scroll-mt-20"
    :class="{
      'border-[#c0392b] bg-[#c0392b] text-white': result.rankClass === 'red',
      'border-black/10 hover:border-black/30': result.rankClass !== 'red',
      'opacity-60': result.rankClass === 'gray',
    }"
  >
    <!-- 排名数字 -->
    <div class="w-8 text-center flex-shrink-0">
      <span class="text-lg font-black tabular-nums leading-none">{{ index + 1 }}</span>
    </div>

    <!-- 主体信息 -->
    <div class="flex-1 min-w-0">
      <div class="flex items-center gap-2">
        <span class="text-sm font-black truncate uppercase tracking-tight">{{ result.name }}</span>
      </div>
      <div class="flex gap-2 mt-1.5 text-[10px] font-bold"
        :class="result.rankClass === 'red' ? 'text-white/60' : 'text-black/50'">
        <span>¥{{ result.price.toFixed(0) }}</span>
        <span>{{ result.date }}</span>
        <span>基准 ¥{{ result.benchmark.toFixed(0) }}
          <span>· {{ priceDiffTag(result.price, result.benchmark).text }}</span>
        </span>
      </div>
    </div>

    <!-- 评分 -->
    <div class="text-right flex-shrink-0 min-w-[56px]">
      <div v-if="starDisplay" class="text-base leading-none">
        <span v-for="i in starDisplay.full" :key="'f'+i" class="text-[#facc15]">★</span>
        <span v-if="starDisplay.half" class="text-[#facc15]/40">★</span>
        <span v-for="i in starDisplay.empty" :key="'e'+i"
          :class="result.rankClass === 'red' ? 'text-white/20' : 'text-black/10'">★</span>
      </div>
      <div v-else class="text-xl font-black leading-none"
        :class="result.rankClass === 'red' ? 'text-white' : 'text-black'">
        {{ formatScore(result.mappedScore, scale ?? 10) }}
      </div>
      <div class="text-[10px] font-black uppercase tracking-[.15em] mt-0.5"
        :class="result.rankClass === 'red' ? 'text-white/50' : 'text-black/30'">
        <span title="性价比综合评分，综合多维评分与价格计算，越高越值得">CP值</span>
      </div>
    </div>
  </div>
</template>
