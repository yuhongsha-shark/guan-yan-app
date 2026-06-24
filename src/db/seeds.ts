import { db } from './index'
import { PRESET_DIMENSIONS, PRESET_CATEGORIES } from '@/config/defaults'

/** 预设维度版本号 — 修改 PRESET_DIMENSIONS 后递增即可触发迁移 */
const PRESET_VERSION = 3
const SETTING_KEY = 'presetDimensionVersion'

/** 初始化默认数据，并自动迁移旧版预设维度 */
export async function seedDefaults(): Promise<void> {
  try {
    // --- 评分维度迁移 ---
    const currentVersion = await db.settings.get(SETTING_KEY)
    const existingVersion = (currentVersion?.value as number) ?? 0

    if (existingVersion < PRESET_VERSION) {
      const presetKeys = new Set(PRESET_DIMENSIONS.map(d => d.key))
      const now = new Date()

      // 用 bulkPut 写入最新预设（存在则更新，不存在则新增）
      await db.dimensions.bulkPut(
        PRESET_DIMENSIONS.map((d, i) => ({
          name: d.name,
          key: d.key,
          weight: d.weight,
          active: d.active,
          builtIn: true,
          order: i,
          createdAt: now,
        }))
      )

      // 删除旧的内置维度中 key 已不在预设中的（如旧的 audio → 新的 sound）
      const allDims = await db.dimensions.toArray()
      const allBuiltIns = allDims.filter(d => d.builtIn)
      for (const dim of allBuiltIns) {
        if (!presetKeys.has(dim.key)) {
          await db.dimensions.delete(dim.id!)
        }
      }

      // 记录版本号
      await db.settings.put({ key: SETTING_KEY, value: PRESET_VERSION })
    }

    // 兜底：确保至少有一个活跃维度
    const activeCount = (await db.dimensions.toArray()).filter(d => d.active).length
    if (activeCount === 0) {
      const now = new Date()
      await db.dimensions.bulkPut(
        PRESET_DIMENSIONS.map((d, i) => ({
          name: d.name,
          key: d.key,
          weight: d.weight,
          active: true,
          builtIn: true,
          order: i,
          createdAt: now,
        }))
      )
    }

    // --- 类别种子 ---
    const catCount = await db.categories.count()
    if (catCount === 0) {
      await db.categories.bulkAdd(
        PRESET_CATEGORIES.map((name, i) => ({ name, order: i }))
      )
    }
  } catch (err) {
    console.error('seedDefaults error:', err)
  }
}
