import type { DimensionPreset } from '@/types/dimension'

/** 预设评分维度 */
export const PRESET_DIMENSIONS: DimensionPreset[] = [
  { name: '表演', key: 'performance', weight: 50, active: true },
  { name: '视觉', key: 'visual', weight: 40, active: true },
  { name: '听觉', key: 'sound', weight: 40, active: true },
  { name: '氛围', key: 'atmosphere', weight: 40, active: true },
]

/** 预设演出类别 */
export const PRESET_CATEGORIES: string[] = [
  'Live',
  '音乐节',
  '演唱会',
  '话剧',
  '音乐剧',
  '舞蹈',
  '戏曲',
  '其他',
]

/** 评分制式选项 */
export const SCALE_OPTIONS = [
  { value: 5, label: '五星制 (0-5)' },
  { value: 10, label: '十分制 (0-10)' },
  { value: 100, label: '百分制 (0-100)' },
] as const

/** 默认评分制式 */
export const DEFAULT_SCALE = 5 as const
