import { ref } from 'vue'
import { db } from '@/db/index'
import type { PerformanceRecord, CreateRecordInput, UpdateRecordInput } from '@/types/record'
import { extractYear } from '@/types/record'

export function useRecords() {
  const records = ref<PerformanceRecord[]>([])
  const loading = ref(false)

  /** 加载全部记录 */
  async function fetchAll(): Promise<PerformanceRecord[]> {
    loading.value = true
    try {
      records.value = await db.records.orderBy('createdAt').reverse().toArray()
      return records.value
    } finally {
      loading.value = false
    }
  }

  /** 按年份筛选 */
  async function fetchByYear(year: number): Promise<PerformanceRecord[]> {
    return db.records.where('year').equals(year).toArray()
  }

  /** 按类别筛选 */
  async function fetchByCategory(category: string): Promise<PerformanceRecord[]> {
    return db.records.where('category').equals(category).toArray()
  }

  /** 搜索（名称模糊匹配） */
  async function search(query: string): Promise<PerformanceRecord[]> {
    const all = await db.records.toArray()
    const q = query.toLowerCase()
    return all.filter(r =>
      r.name.toLowerCase().includes(q) ||
      r.venue.toLowerCase().includes(q) ||
      r.category.toLowerCase().includes(q)
    )
  }

  /** 创建记录 */
  async function create(input: CreateRecordInput): Promise<number> {
    const now = new Date()
    return db.records.add({
      ...input,
      createdAt: now,
      updatedAt: now,
    })
  }

  /** 更新记录 */
  async function update(id: number, input: UpdateRecordInput): Promise<void> {
    await db.records.update(id, {
      ...input,
      updatedAt: new Date(),
    })
  }

  /** 删除记录 */
  async function remove(id: number): Promise<void> {
    await db.records.delete(id)
  }

  /** 获取单条记录 */
  async function getById(id: number): Promise<PerformanceRecord | undefined> {
    return db.records.get(id)
  }

  /** 批量创建 */
  async function bulkCreate(inputs: CreateRecordInput[]): Promise<number[]> {
    const now = new Date()
    const rows = inputs.map(input => ({ ...input, createdAt: now, updatedAt: now }))
    return db.records.bulkAdd(rows, { allKeys: true }) as Promise<number[]>
  }

  /** 清空全部记录 */
  async function clearAll(): Promise<void> {
    await db.records.clear()
  }

  /** 统计信息 */
  async function getStats() {
    const all = await db.records.toArray()
    const byCategory: Record<string, number> = {}
    const byYear: Record<string, number> = {}
    for (const r of all) {
      byCategory[r.category] = (byCategory[r.category] || 0) + 1
      byYear[String(extractYear(r.date))] = (byYear[String(extractYear(r.date))] || 0) + 1
    }
    return { total: all.length, byCategory, byYear }
  }

  return {
    records,
    loading,
    fetchAll,
    fetchByYear,
    fetchByCategory,
    search,
    create,
    update,
    remove,
    getById,
    bulkCreate,
    clearAll,
    getStats,
  }
}
