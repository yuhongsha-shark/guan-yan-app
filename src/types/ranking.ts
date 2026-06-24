/** 排名分类 */
export type RankClass = 'red' | 'black' | 'gray'

/** 排名结果项 */
export interface RankedResult {
  recordId: number
  name: string
  date: string           // 演出日期
  year: number           // 派生年份（从date提取）
  category: string
  price: number
  benchmark: number
  perfZ: number
  cpZ: number
  mappedScore: number
  rankClass: RankClass
  rankIndex: number
  dimensionZScores: Record<string, number>
  dimensionValues: Record<string, number>
}

/** 排名筛选条件 */
export interface RankingFilters {
  year: string // "all" 或具体年份
  category: string // "all" 或具体类别
  scale: 5 | 10 | 100
}

/** 榜单快照（存入数据库） */
export interface RankingSnapshot {
  id?: number
  label: string
  filters: RankingFilters
  weights: Record<string, number>
  results: RankedResult[]
  createdAt: Date
}
