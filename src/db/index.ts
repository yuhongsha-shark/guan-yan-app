import Dexie, { type Table } from 'dexie'
import type { PerformanceRecord } from '@/types/record'
import type { ScoreDimension } from '@/types/dimension'
import type { RankingSnapshot } from '@/types/ranking'
import { DB_NAME } from '@/config/constants'

/** 类别表 */
export interface CategoryRow {
  id?: number
  name: string
  order: number
}

/** 设置表 */
export interface SettingRow {
  key: string
  value: unknown
}

class GuanYanDB extends Dexie {
  records!: Table<PerformanceRecord, number>
  dimensions!: Table<ScoreDimension, number>
  categories!: Table<CategoryRow, number>
  snapshots!: Table<RankingSnapshot, number>
  settings!: Table<SettingRow, string>

  constructor() {
    super(DB_NAME)

    this.version(1).stores({
      records: '++id, name, year, category, price, createdAt',
      dimensions: '++id, &key, order',
      categories: '++id, &name, order',
      snapshots: '++id, createdAt',
      settings: '&key',
    })

    // v2: year → date（演出日期字符串）
    this.version(2).stores({
      records: '++id, name, date, category, price, createdAt',
      dimensions: '++id, &key, order',
      categories: '++id, &name, order',
      snapshots: '++id, createdAt',
      settings: '&key',
    }).upgrade(async tx => {
      const recs = await tx.table('records').toArray()
      for (const r of recs) {
        if (!r.date) {
          const oldYear = (r as any).year || new Date().getFullYear()
          r.date = `${oldYear}.01.01`
        }
        delete (r as any).year
        await tx.table('records').put(r)
      }
    })
  }
}

export const db = new GuanYanDB()
