/** 评分维度 */
export interface ScoreDimension {
  id?: number
  name: string   // 显示名，如"表演"
  key: string    // 机器键，如"performance"
  weight: number // 0-100，计算时自动归一化
  active: boolean // 是否参与评分
  builtIn: boolean // 预设维度不可删除
  order: number  // 排序
  createdAt: Date
}

/** 维度预设定义 */
export interface DimensionPreset {
  name: string
  key: string
  weight: number
  active: boolean
}
