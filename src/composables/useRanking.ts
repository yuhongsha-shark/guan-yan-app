import { ref, computed, watch } from 'vue'
import { useRecords } from './useRecords'
import { useDimensions } from './useDimensions'
import { computeRanking } from '@/engine/ranking'
import type { RankedResult, RankingFilters } from '@/types/ranking'
import { RANKING_DEBOUNCE_MS, RED_PERCENTILE, BLACK_PERCENTILE } from '@/config/constants'
import { DEFAULT_SCALE } from '@/config/defaults'

export function useRanking() {
  const { records, fetchAll: fetchRecords } = useRecords()
  const { activeDimensions, normalizedWeights, fetchAll: fetchDimensions } = useDimensions()

  const rankedResults = ref<RankedResult[]>([])
  const computing = ref(false)

  const filters = ref<RankingFilters>({
    year: 'all',
    category: 'all',
    scale: DEFAULT_SCALE,
  })

  // 派生列表
  const redList = computed(() => rankedResults.value.filter(r => r.rankClass === 'red'))
  const blackList = computed(() => rankedResults.value.filter(r => r.rankClass === 'black'))
  const grayList = computed(() => rankedResults.value.filter(r => r.rankClass === 'gray'))

  // 显示的列表（按排名号排序）
  const displayList = computed(() =>
    [...rankedResults.value].sort((a, b) => b.mappedScore - a.mappedScore)
  )

  /** 执行排名计算 */
  async function recompute() {
    if (records.value.length === 0) {
      rankedResults.value = []
      return
    }

    computing.value = true
    try {
      // 使用 setTimeout 让UI有机会更新loading状态
      await new Promise(resolve => setTimeout(resolve, 0))

      const results = computeRanking({
        records: records.value,
        dimensions: activeDimensions.value,
        normalizedWeights: normalizedWeights.value,
        filters: filters.value,
        benchmarkMethod: 'median',
        redThreshold: RED_PERCENTILE,
        blackThreshold: BLACK_PERCENTILE,
      })

      rankedResults.value = results
    } catch (err) {
      console.error('排名计算出错:', err)
      rankedResults.value = []
    } finally {
      computing.value = false
    }
  }

  /** 初始化 */
  async function init() {
    await Promise.all([fetchRecords(), fetchDimensions()])
    await recompute()
  }

  // 防抖监听数据变化
  let debounceTimer: ReturnType<typeof setTimeout> | null = null
  watch(
    [() => records.value.length, () => activeDimensions.value.length, normalizedWeights],
    () => {
      if (debounceTimer) clearTimeout(debounceTimer)
      debounceTimer = setTimeout(() => {
        recompute()
      }, RANKING_DEBOUNCE_MS)
    },
    { deep: true }
  )

  return {
    rankedResults,
    displayList,
    redList,
    blackList,
    grayList,
    computing,
    filters,
    init,
    recompute,
  }
}
