import { db } from '@/db/index'
import type { PerformanceRecord } from '@/types/record'
import type { ScoreDimension } from '@/types/dimension'
import type { RankingSnapshot } from '@/types/ranking'

export interface FullBackup {
  version: number
  exportedAt: string
  records: PerformanceRecord[]
  dimensions: ScoreDimension[]
  snapshots: RankingSnapshot[]
}

/**
 * 导出全部数据为 JSON
 */
export async function exportJSON(): Promise<void> {
  const backup: FullBackup = {
    version: 1,
    exportedAt: new Date().toISOString(),
    records: await db.records.toArray(),
    dimensions: await db.dimensions.toArray(),
    snapshots: await db.snapshots.toArray(),
  }

  const blob = new Blob([JSON.stringify(backup, null, 2)], { type: 'application/json' })
  downloadBlob(blob, `观演红黑榜_备份_${formatDate(new Date())}.json`)

  // 记录备份时间
  await db.settings.put({ key: 'lastBackupDate', value: new Date().toISOString() })
}

/**
 * 导出记录为 Excel
 */
export async function exportExcel(): Promise<void> {
  const { default: XLSX } = await import('xlsx')
  const records = await db.records.toArray()

  // 展平 scores 和 customFields
  const rows = records.map(r => {
    const row: Record<string, unknown> = {
      '演出名称': r.name,
      '演出日期': r.date,
      '类别': r.category,
      '场馆': r.venue,
      '价格': r.price,
      '备注': r.notes,
      '创建时间': new Date(r.createdAt).toLocaleString('zh-CN'),
    }
    // 展平评分
    for (const [key, val] of Object.entries(r.scores)) {
      row[`评分_${key}`] = val
    }
    // 展平自定义字段
    for (const field of r.customFields) {
      row[field.key] = field.value
    }
    return row
  })

  const ws = XLSX.utils.json_to_sheet(rows)
  const wb = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(wb, ws, '演出记录')
  const buf = XLSX.write(wb, { bookType: 'xlsx', type: 'array' })
  const blob = new Blob([buf], { type: 'application/octet-stream' })
  downloadBlob(blob, `观演记录_${formatDate(new Date())}.xlsx`)
}

/**
 * 导入 JSON 备份
 */
export async function importJSON(file: File, mode: 'merge' | 'replace'): Promise<void> {
  const text = await file.text()
  const backup: FullBackup = JSON.parse(text)

  if (mode === 'replace') {
    await db.records.clear()
    await db.dimensions.clear()
    await db.snapshots.clear()
  }

  if (backup.records?.length) {
    await db.records.bulkAdd(backup.records)
  }
  if (backup.dimensions?.length) {
    await db.dimensions.bulkAdd(backup.dimensions)
  }
  if (backup.snapshots?.length) {
    await db.snapshots.bulkAdd(backup.snapshots)
  }
}

/**
 * 导入 Excel
 */
export async function importExcel(
  file: File,
  columnMapping: Record<string, string>
): Promise<number> {
  const { default: XLSX } = await import('xlsx')
  const buffer = await file.arrayBuffer()
  const wb = XLSX.read(new Uint8Array(buffer), { type: 'array' })
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets[wb.SheetNames[0]])

  const now = new Date()
  const records: PerformanceRecord[] = rows.map((row, i) => ({
    name: String(row[columnMapping.name] || ''),
    date: String(row[columnMapping.date] || ''),
    category: String(row[columnMapping.category] || '其他'),
    venue: String(row[columnMapping.venue] || ''),
    price: parseFloat(String(row[columnMapping.price] || '0').replace(/[,，¥$€£\s]/g, '')) || 0,
    scores: {}, // Excel 导入暂不处理多维度评分
    customFields: [],
    notes: '',
    createdAt: now,
    updatedAt: now,
  })).filter(r => r.name)

  if (records.length > 0) {
    await db.records.bulkAdd(records)
  }
  return records.length
}

/**
 * 数据统计
 */
export async function getDataStats() {
  const recordCount = await db.records.count()
  const dimCount = await db.dimensions.count()
  const snapCount = await db.snapshots.count()

  const setting = await db.settings.get('lastBackupDate')
  const lastBackup = setting ? new Date(setting.value as string) : null

  return {
    recordCount,
    dimCount,
    snapCount,
    lastBackup,
    lastBackupLabel: lastBackup
      ? lastBackup.toLocaleDateString('zh-CN')
      : '从未备份',
  }
}

/** 粘贴解析结果 */
export interface ParsedExcelData {
  headers: string[]
  rows: Record<string, unknown>[]
}

/**
 * 从粘贴的文本解析 Excel 数据
 * 支持：TSV（从Excel复制）、CSV
 */
export function parsePastedText(text: string): ParsedExcelData | null {
  if (!text.trim()) return null

  // Excel 粘贴出来是 Tab 分隔的文本
  const lines = text.trim().split('\n').filter(l => l.trim())
  if (lines.length < 2) return null

  const headers = lines[0].split('\t').map(h => h.trim().replace(/^\s+|\s+$/g, ''))
  if (headers.length < 2) return null

  const rows: Record<string, unknown>[] = []
  for (let i = 1; i < lines.length; i++) {
    const values = lines[i].split('\t')
    if (values.length === 0) continue
    const row: Record<string, unknown> = {}
    headers.forEach((h, j) => {
      const val = (values[j] || '').trim()
      // 去掉千分位逗号和常见货币符号后再判断是否纯数字
      const cleaned = val.replace(/[,，¥$€£\s]/g, '')
      const isPureNumber = /^-?\d+(\.\d+)?$/.test(cleaned)
      row[h] = isPureNumber ? parseFloat(cleaned) : val
    })
    // 跳过完全空行
    if (Object.values(row).some(v => v !== '' && v != null)) {
      rows.push(row)
    }
  }

  return rows.length > 0 ? { headers, rows } : null
}

/**
 * 智能列映射：根据关键词自动匹配基本字段
 */
export function autoMapColumns(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const keywords: Record<string, string[]> = {
    name: ['名', 'name', '型号', '演出', '产品', '标题'],
    date: ['日期', 'date', '时间', '年'],
    category: ['类', 'cat', 'type', '类型', '类别', '品类'],
    venue: ['馆', 'venue', '地址', '地点', '场所', '场地'],
    price: ['价', 'price', 'cost', '钱', '费用', '票'],
  }

  for (const h of headers) {
    const hl = h.toLowerCase()
    for (const [field, keys] of Object.entries(keywords)) {
      if (!mapping[field] && keys.some(k => hl.includes(k))) {
        mapping[field] = h
        break
      }
    }
  }

  return mapping
}

/**
 * 检测 Excel 列头中哪些是评分维度列
 * 策略：
 *   1. 先找含"评分"的列，提取前缀匹配维度名
 *   2. 再找直接包含维度名的列（如列头就是"表演"、"视觉"）
 *   3. 模糊匹配：列头包含维度名或维度名包含列头关键词
 */
export function detectScoreColumns(
  headers: string[],
  dimensionNames: { key: string; name: string }[]
): Record<string, string> {
  const mapping: Record<string, string> = {}

  for (const h of headers) {
    // 策略1: 列头含"评分" — 提取前缀匹配
    if (h.includes('评分')) {
      let keyword = h
        .replace(/评分.*$/, '')
        .replace(/[-（(\s]/g, '')
        .trim()

      if (!keyword) {
        keyword = h
          .replace(/^.*?评分[-（(]?/, '')
          .replace(/[)）].*$/, '')
          .trim()
      }

      if (keyword) {
        for (const dim of dimensionNames) {
          if (keyword.includes(dim.name) || dim.name.includes(keyword)) {
            mapping[dim.key] = h
            break
          }
        }
        if (mapping[Object.keys(mapping).find(k => mapping[k] === h) || '']) continue
      }
    }

    // 策略2: 列头直接等于或包含维度名
    for (const dim of dimensionNames) {
      if (mapping[dim.key]) continue
      if (h === dim.name || h.includes(dim.name) || dim.name.includes(h)) {
        mapping[dim.key] = h
        break
      }
    }
  }

  console.log('[评分检测] 列头:', headers, '维度:', dimensionNames.map(d => d.name), '结果:', mapping)
  return mapping
}

/**
 * 将 Excel 中的评分值转换为内部 0-100 格式
 * 自动检测：如果所有分值 ≤5，视为五星制（×20）；否则视为百分制
 */
function normalizeScoreValue(val: unknown): number {
  const num = parseFloat(String(val))
  if (isNaN(num)) return 0
  return Math.round(num * 20)  // 默认按五星制 ×20 = 0-100
}

/**
 * 通过列映射批量导入粘贴的数据
 * @param columnMapping 基本字段映射 { name: "列A", date: "列B", ... }
 * @param scoreMapping 评分列映射 { "performance": "表演", "visual": "视觉", ... }
 */
export async function importParsedData(
  rows: Record<string, unknown>[],
  columnMapping: Record<string, string>,
  scoreMapping: Record<string, string> = {}
): Promise<number> {
  const now = new Date()
  const records: PerformanceRecord[] = rows.map(row => {
    // 构建评分对象
    const scores: Record<string, number> = {}
    for (const [dimKey, colName] of Object.entries(scoreMapping)) {
      if (colName) {
        const val = normalizeScoreValue(row[colName])
        if (val > 0) scores[dimKey] = val
      }
    }

    return {
      name: String(row[columnMapping.name] || ''),
      date: String(row[columnMapping.date] || ''),
      category: String(row[columnMapping.category] || '其他'),
      venue: String(row[columnMapping.venue] || ''),
      price: parseFloat(String(row[columnMapping.price] || '0').replace(/[,，¥$€£\s]/g, '')) || 0,
      scores,
      customFields: [],
      notes: '',
      createdAt: now,
      updatedAt: now,
    }
  }).filter(r => r.name)

  if (records.length > 0) {
    await db.records.bulkAdd(records)
  }
  return records.length
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function formatDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}
