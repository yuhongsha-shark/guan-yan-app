import { ref, computed } from 'vue'
import { db } from '@/db/index'
import type { ScoreDimension } from '@/types/dimension'

export function useDimensions() {
  const dimensions = ref<ScoreDimension[]>([])
  const loading = ref(false)

  /** 加载全部维度（按order排序） */
  async function fetchAll(): Promise<ScoreDimension[]> {
    loading.value = true
    try {
      dimensions.value = await db.dimensions.orderBy('order').toArray()
      return dimensions.value
    } finally {
      loading.value = false
    }
  }

  /** 活跃的维度 */
  const activeDimensions = computed(() =>
    dimensions.value.filter(d => d.active)
  )

  /** 创建维度 */
  async function create(dim: Omit<ScoreDimension, 'id' | 'createdAt'>): Promise<number> {
    return db.dimensions.add({ ...dim, createdAt: new Date() })
  }

  /** 更新维度 */
  async function update(id: number, changes: Partial<ScoreDimension>): Promise<void> {
    await db.dimensions.update(id, changes)
  }

  /** 删除维度（仅非内置） */
  async function remove(id: number): Promise<void> {
    const dim = await db.dimensions.get(id)
    if (dim && !dim.builtIn) {
      await db.dimensions.delete(id)
    }
  }

  /** 切换激活状态 */
  async function toggleActive(id: number): Promise<void> {
    const dim = await db.dimensions.get(id)
    if (dim) {
      await db.dimensions.update(id, { active: !dim.active })
    }
  }

  /** 更新权重 */
  async function setWeight(id: number, weight: number): Promise<void> {
    await db.dimensions.update(id, { weight: Math.max(0, Math.min(100, weight)) })
  }

  /** 获取归一化的权重映射 */
  const normalizedWeights = computed(() => {
    const active = activeDimensions.value
    const total = active.reduce((sum, d) => sum + d.weight, 0) || 1
    const map: Record<string, number> = {}
    for (const d of active) {
      map[d.key] = active.length ? d.weight / total : 1 / active.length
    }
    return map
  })

  return {
    dimensions,
    loading,
    activeDimensions,
    normalizedWeights,
    fetchAll,
    create,
    update,
    remove,
    toggleActive,
    setWeight,
  }
}
