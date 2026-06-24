/** 自定义字段 */
export interface CustomField {
  key: string
  value: string | number
}

/** 演出记录 */
export interface PerformanceRecord {
  id?: number
  name: string
  date: string           // 演出日期，如 "2026.06.06 19:30"
  category: string
  venue: string
  purchaseChannel: string // 购买渠道
  price: number
  seat: string            // 座位
  status: string          // 现状（如：已看、未看、已出票等）
  scores: Record<string, number> // 维度key → 评分值
  customFields: CustomField[]
  notes: string
  createdAt: Date
  updatedAt: Date
}

/** 从日期字符串提取年份 */
export function extractYear(date: string): number {
  const match = date.match(/^(\d{4})/)
  return match ? parseInt(match[1]) : new Date().getFullYear()
}

/** 创建记录的输入（不含自动字段） */
export type CreateRecordInput = Omit<PerformanceRecord, 'id' | 'createdAt' | 'updatedAt'>

/** 更新记录的输入 */
export type UpdateRecordInput = Partial<CreateRecordInput>
