<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { Palette, Download, Image } from '@lucide/vue'
import { useRecords } from '@/composables/useRecords'
import { useDimensions } from '@/composables/useDimensions'
import { computeRanking } from '@/engine/ranking'
import { generatePoster, preparePosterResults } from '@/composables/usePoster'
import { POSTER_MAX_ITEMS, RED_PERCENTILE, BLACK_PERCENTILE } from '@/config/constants'
import { DEFAULT_SCALE } from '@/config/defaults'
import type { RankingFilters } from '@/types/ranking'
import EmptyState from '@/components/common/EmptyState.vue'

const { fetchAll: fetchRecords } = useRecords()
const { activeDimensions, normalizedWeights, fetchAll: fetchDimensions } = useDimensions()

const rankedResults = ref<any[]>([])
const computing = ref(true)

const filters = ref<RankingFilters>({ year: 'all', category: 'all', scale: DEFAULT_SCALE })

const posterType = ref<'red' | 'black'>('red')
const customTitle = ref('')
const customFooter = ref('')
const generating = ref(false)

const defaultTitle = computed(() => posterType.value === 'red' ? '年度性价比红榜' : '年度性价比黑榜')
const defaultSubtitle = computed(() => {
  const y = filters.value.year === 'all' ? '历年' : filters.value.year
  const c = filters.value.category === 'all' ? '全品类' : filters.value.category
  return `${y} · ${c}`
})
const displayTitle = computed(() => customTitle.value || defaultTitle.value)
const displayFooter = computed(() => customFooter.value || 'Powered by 观演红黑榜')
const posterResults = computed(() => preparePosterResults(rankedResults.value, posterType.value))

async function loadRanking() {
  computing.value = true
  try {
    const [recs] = await Promise.all([fetchRecords(), fetchDimensions()])
    if (recs.length === 0 || activeDimensions.value.length === 0) {
      rankedResults.value = []
      return
    }
    rankedResults.value = computeRanking({
      records: recs, dimensions: activeDimensions.value,
      normalizedWeights: normalizedWeights.value, filters: filters.value,
      benchmarkMethod: 'median', redThreshold: RED_PERCENTILE, blackThreshold: BLACK_PERCENTILE,
    })
  } catch (err) {
    console.error('海报排名出错:', err)
    rankedResults.value = []
  } finally {
    computing.value = false
  }
}

onMounted(loadRanking)

async function handleGenerate() {
  if (posterResults.value.length === 0) { alert('当前榜单无数据'); return }
  generating.value = true
  try {
    await generatePoster({
      type: posterType.value, title: displayTitle.value,
      subtitle: defaultSubtitle.value, footer: displayFooter.value,
      results: posterResults.value, maxItems: POSTER_MAX_ITEMS,
    })
  } catch (e: any) {
    console.error('海报生成失败:', e)
    alert('生成失败: ' + (e.message || '未知错误'))
  } finally { generating.value = false }
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-lg mx-auto">
    <h2 class="flex items-center gap-2 text-lg font-semibold text-[#2c2416] mb-4">
      <Palette :size="20" :stroke-width="1.5" class="text-[#8b7355]" />海报生成
    </h2>

    <div v-if="computing" class="text-center py-12 text-[#9c8e7c]">加载排名数据...</div>

    <div v-else-if="rankedResults.length === 0">
      <EmptyState :icon="Image" title="暂无排名数据" description="请先在榜单中确认有排名记录" />
    </div>

    <div v-else class="space-y-6">
      <div>
        <label class="block text-sm font-medium text-[#5b4a3f] mb-2">榜单类型</label>
        <div class="grid grid-cols-2 gap-3">
          <button class="btn border-2 rounded-xl" :class="posterType === 'red' ? 'border-[#b5343a] bg-[#fdf0ed] text-[#b5343a]' : 'border-[#e8e0d5] text-[#8b7355]'"
            @click="posterType = 'red'">红榜 ({{ rankedResults.filter(r => r.rankClass !== 'black').length }})</button>
          <button class="btn border-2 rounded-xl" :class="posterType === 'black' ? 'border-[#5b4a3f] bg-[#f5f0e8] text-[#5b4a3f]' : 'border-[#e8e0d5] text-[#8b7355]'"
            @click="posterType = 'black'">黑榜 ({{ rankedResults.filter(r => r.rankClass === 'black').length }})</button>
        </div>
      </div>

      <div>
        <label class="block text-sm font-medium text-[#5b4a3f] mb-2">自定义标题（可选）</label>
        <input v-model="customTitle" type="text" :placeholder="defaultTitle"
          class="input input-bordered w-full border-[#e0d8cc] bg-white text-[#2c2416] placeholder:text-[#c4b8a8]" />
        <p class="text-xs text-[#9c8e7c] mt-1">留空使用默认：{{ defaultTitle }}</p>
      </div>

      <div>
        <label class="block text-sm font-medium text-[#5b4a3f] mb-2">底部文字（可选）</label>
        <input v-model="customFooter" type="text" placeholder="Powered by 观演红黑榜"
          class="input input-bordered w-full border-[#e0d8cc] bg-white text-[#2c2416] placeholder:text-[#c4b8a8]" />
      </div>

      <div class="bg-[#faf7f2] rounded-xl p-4 border border-[#e8e0d5]">
        <h3 class="text-sm font-semibold text-[#5b4a3f] mb-2">预览 ({{ Math.min(posterResults.length, POSTER_MAX_ITEMS) }}条)</h3>
        <div class="text-xs space-y-1">
          <div v-for="(r, i) in posterResults.slice(0, 5)" :key="r.recordId" class="flex justify-between text-[#8b7355]">
            <span>{{ i + 1 }}. {{ r.name }}</span>
            <span class="font-medium text-[#5b4a3f]">¥{{ r.price.toFixed(2) }}</span>
          </div>
          <div v-if="posterResults.length > 5" class="text-center text-[#c4b8a8] py-1">... 还有 {{ posterResults.length - 5 }} 条</div>
        </div>
      </div>

      <button class="btn w-full rounded-xl text-white border-0"
        :class="posterType === 'red' ? 'bg-[#b5343a] hover:bg-[#8b2a30]' : 'bg-[#5b4a3f] hover:bg-[#3d2e24]'"
        :disabled="generating || posterResults.length === 0" @click="handleGenerate">
        <Download :size="16" :stroke-width="2" class="mr-1.5" />
        {{ generating ? '生成中...' : `下载${posterType === 'red' ? '红榜' : '黑榜'}海报` }}
      </button>
    </div>
  </div>
</template>
