/**
 * 评分引擎 — 纯函数
 * 从观演红黑榜 demo 移植并增强
 */

import type { PerformanceRecord } from '@/types/record'
import { extractYear } from '@/types/record'

export interface GroupedRecords {
  key: string   // "年份_类别"
  records: PerformanceRecord[]
}

export interface DimensionStats {
  mean: number
  std: number
}

/** 从日期提取年份 */
function getYear(record: PerformanceRecord): number {
  return extractYear(record.date)
}

/**
 * 按年份+类别分组（年份从日期字符串自动识别）
 */
export function groupRecords(records: PerformanceRecord[]): GroupedRecords[] {
  const groups = new Map<string, PerformanceRecord[]>()
  for (const r of records) {
    const key = `${getYear(r)}_${r.category}`
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key)!.push(r)
  }
  return Array.from(groups.entries()).map(([key, records]) => ({ key, records }))
}

/**
 * 计算组内每个维度的均值和标准差（总体标准差，与demo一致：除以N）
 */
export function computeDimensionStats(
  records: PerformanceRecord[],
  dimensionKeys: string[]
): Record<string, DimensionStats> {
  const stats: Record<string, DimensionStats> = {}

  for (const key of dimensionKeys) {
    const vals = records
      .map(r => r.scores[key])
      .filter((v): v is number => v != null && !isNaN(v))

    if (vals.length === 0) {
      stats[key] = { mean: 0, std: 1 }
      continue
    }

    const mean = vals.reduce((a, b) => a + b, 0) / vals.length
    const variance = vals.reduce((a, b) => a + (b - mean) ** 2, 0) / vals.length
    const std = Math.sqrt(variance) || 1 // 避免除以0

    stats[key] = { mean, std }
  }

  return stats
}

/**
 * 计算单条记录在各维度的Z-score
 * z = (value - mean) / std
 * 缺失值视为z=0（中性）
 */
export function computeZScores(
  record: PerformanceRecord,
  dimensionKeys: string[],
  stats: Record<string, DimensionStats>
): Record<string, number> {
  const zScores: Record<string, number> = {}

  for (const key of dimensionKeys) {
    const val = record.scores[key]
    if (val == null || isNaN(val)) {
      zScores[key] = 0 // 缺失值：中性
    } else {
      const s = stats[key]
      if (!s) {
        zScores[key] = 0
      } else {
        zScores[key] = (val - s.mean) / s.std
      }
    }
  }

  return zScores
}

/**
 * 加权Z-score求和并归一化
 * perfZ = Σ(z_i × normWeight_i)
 * normWeight = weight / totalWeight（自动归一化）
 */
export function weightedZSum(
  zScores: Record<string, number>,
  normalizedWeights: Record<string, number>
): number {
  let sum = 0
  for (const [key, z] of Object.entries(zScores)) {
    const w = normalizedWeights[key] ?? 0
    sum += z * w
  }
  return sum
}

/**
 * 计算性价比CP值
 * cpZ = perfZ - sensitivity × ln(price / benchmark)
 *
 * sensitivity 控制价格对排名的影响程度：
 *   0    = 价格完全不影响（纯质量排名）
 *   0.5  = 温和（高价有惩罚但不至于直接黑榜，推荐）
 *   1.0  = 标准（与原始demo一致）
 *   2.0  = 激进（价格主导排名）
 *
 * 边界处理：
 * - price = 0: 用benchmark/10替代
 * - benchmark = 0: 直接返回perfZ
 * - 单记录组(price=benchmark): ln(1)=0 不影响
 */
export function computeCpZ(
  perfZ: number,
  price: number,
  benchmark: number,
  sensitivity: number = 0.5
): number {
  if (benchmark <= 0) return perfZ
  const effectivePrice = price > 0 ? price : benchmark / 10
  return perfZ - sensitivity * Math.log(effectivePrice / benchmark)
}

/**
 * 找组内基准价格
 * @param method 'median' | 'mean'
 */
export function findBenchmark(
  prices: number[],
  method: 'median' | 'mean' = 'median'
): number {
  const valid = prices.filter(p => p > 0).sort((a, b) => a - b)
  if (valid.length === 0) return 0

  if (method === 'median') {
    const mid = Math.floor(valid.length / 2)
    return valid.length % 2 === 0
      ? (valid[mid - 1] + valid[mid]) / 2
      : valid[mid]
  }

  // mean
  return valid.reduce((a, b) => a + b, 0) / valid.length
}
