/**
 * 排名引擎 — 完整排名流水线
 * 从观演红黑榜 demo 移植并增强
 */

import type { PerformanceRecord } from '@/types/record'
import { extractYear } from '@/types/record'
import type { ScoreDimension } from '@/types/dimension'
import type { RankedResult, RankClass, RankingFilters } from '@/types/ranking'
import {
  groupRecords,
  computeDimensionStats,
  computeZScores,
  weightedZSum,
  computeCpZ,
  findBenchmark,
} from './scoring'
import { RED_PERCENTILE, BLACK_PERCENTILE } from '@/config/constants'

export interface RankingParams {
  records: PerformanceRecord[]
  dimensions: ScoreDimension[]
  normalizedWeights: Record<string, number>
  filters: RankingFilters
  benchmarkMethod?: 'median' | 'mean'
  redThreshold?: number
  blackThreshold?: number
  priceSensitivity?: number  // 价格敏感度，默认 0.5
}

/**
 * 完整排名流水线
 *
 * 1. 按年份+类别分组
 * 2. 组内计算各维度的 mean/std
 * 3. 每条记录计算Z-score
 * 4. 加权求和得到 perfZ
 * 5. 计算 cpZ = perfZ - log(price/benchmark)
 * 6. 全局排序
 * 7. 按分位阈值分类红/黑/灰榜
 * 8. cpZ映射到用户选择的制式
 */
export function computeRanking(params: RankingParams): RankedResult[] {
  const {
    records,
    dimensions,
    normalizedWeights,
    filters,
    benchmarkMethod = 'median',
    redThreshold = RED_PERCENTILE,
    blackThreshold = BLACK_PERCENTILE,
    priceSensitivity = 0.5,
  } = params

  if (records.length === 0 || dimensions.length === 0) return []

  const dimKeys = dimensions.map(d => d.key)

  // 1. 分组
  const groups = groupRecords(records)

  // 2-5. 逐组计算
  const allResults: RankedResult[] = []

  for (const group of groups) {
    // 2. 组内统计
    const stats = computeDimensionStats(group.records, dimKeys)

    // 基准价格
    const prices = group.records.map(r => r.price)
    const benchmark = findBenchmark(prices, benchmarkMethod)

    // 3-5. 逐条记录
    for (const record of group.records) {
      const zScores = computeZScores(record, dimKeys, stats)
      const perfZ = weightedZSum(zScores, normalizedWeights)
      const cpZ = computeCpZ(perfZ, record.price, benchmark, priceSensitivity)

      allResults.push({
        recordId: record.id!,
        name: record.name,
        date: record.date,
        year: extractYear(record.date),
        category: record.category,
        price: record.price,
        benchmark,
        perfZ,
        cpZ,
        mappedScore: 0, // 暂定，后续统一映射
        rankClass: 'gray',
        rankIndex: 0,
        dimensionZScores: zScores,
        dimensionValues: { ...record.scores },
      })
    }
  }

  // 6. 全局按cpZ降序排序
  allResults.sort((a, b) => b.cpZ - a.cpZ)

  // 7. 映射到制式 [scale*0.1, scale]（用全局 min/max 保持分数一致性）
  const cpZValues = allResults.map(r => r.cpZ)
  const cpMin = Math.min(...cpZValues)
  const cpMax = Math.max(...cpZValues)
  const { scale } = filters

  for (let i = 0; i < allResults.length; i++) {
    const r = allResults[i]
    r.rankIndex = i + 1
    if (cpMax === cpMin) {
      r.mappedScore = scale * 0.55
    } else {
      r.mappedScore = ((r.cpZ - cpMin) / (cpMax - cpMin)) * (scale * 0.9) + scale * 0.1
    }
  }

  // 8. 先按年份/类别筛选
  console.log('[引擎] 全局结果:', allResults.length, '条, 筛选条件:', { year: filters.year, cat: filters.category })
  console.log('[引擎] 各年份:', [...new Set(allResults.map(r => r.year))], '各类别:', [...new Set(allResults.map(r => r.category))])

  let filtered = allResults.filter(r => {
    if (filters.year !== 'all' && String(r.year) !== String(filters.year)) return false
    if (filters.category !== 'all' && r.category !== filters.category) return false
    return true
  })

  console.log('[引擎] 筛选后:', filtered.length, '条')

  // 9. 筛选后的结果内部重新排序
  filtered.sort((a, b) => b.cpZ - a.cpZ)

  // 10. 在筛选后的集合内按分位阈值分类红/黑/灰
  if (filtered.length > 0) {
    const qH = filtered[Math.floor(filtered.length * redThreshold)]?.cpZ ?? 0
    const qL = filtered[Math.floor(filtered.length * (1 - blackThreshold))]?.cpZ ?? 0

    for (const r of filtered) {
      if (r.cpZ >= qH) r.rankClass = 'red'
      else if (r.cpZ <= qL) r.rankClass = 'black'
      else r.rankClass = 'gray'
    }
  }

  // 重新编号
  filtered.forEach((r, i) => { r.rankIndex = i + 1 })

  return filtered
}

/**
 * 格式化得分为展示文本
 */
export function formatScore(score: number, scale: number): string {
  if (scale === 100) return score.toFixed(0)
  return score.toFixed(1)
}
