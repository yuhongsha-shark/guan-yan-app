<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { Download, FileJson, FileSpreadsheet, Upload, Search, ClipboardList, Database, Star } from '@lucide/vue'
import { exportJSON, exportExcel, importJSON, getDataStats, parsePastedText, autoMapColumns, detectScoreColumns, importParsedData, type ParsedExcelData } from '@/composables/useBackup'
import { db } from '@/db/index'

const stats = ref({ recordCount: 0, dimCount: 0, snapCount: 0, lastBackup: null as Date | null, lastBackupLabel: '从未备份' })
const importMode = ref<'merge' | 'replace'>('merge')
const statusMsg = ref(''); const statusType = ref<'success' | 'error' | ''>('')
const pasteText = ref(''); const parsedData = ref<ParsedExcelData | null>(null)
const columnMapping = ref<Record<string, string>>({})
const scoreMapping = ref<Record<string, string>>({})
const pasteImporting = ref(false)
const dimensionNames = ref<{ key: string; name: string }[]>([])

const parsedRowCount = computed(() => parsedData.value?.rows.length ?? 0)
const previewRows = computed(() => parsedData.value?.rows.slice(0, 5) ?? [])
const fieldLabels: Record<string, string> = { name: '演出名称', date: '演出日期', category: '类别', venue: '场馆/地址', price: '价格' }

// 导入预检：检查关键字段是否匹配
const mappingWarning = computed(() => {
  if (!parsedData.value) return ''
  const headers = parsedData.value.headers.map(h => h.toLowerCase())
  const issues: string[] = []
  if (!headers.some(h => h.includes('名') || h.includes('name') || h.includes('演出'))) issues.push('未检测到"演出名称"列')
  if (!headers.some(h => h.includes('日') || h.includes('date') || h.includes('时间'))) issues.push('未检测到"日期"列')
  if (!columnMapping.value.name) issues.push('请手动映射演出名称列')
  return issues.join('；')
})

// 硬编码兜底维度（防止 DB 数据未就绪）
const FALLBACK_DIMS = [
  { key: 'performance', name: '表演' },
  { key: 'visual', name: '视觉' },
  { key: 'sound', name: '听觉' },
  { key: 'atmosphere', name: '氛围' },
]

async function loadDimensions() {
  try {
    const dims = await db.dimensions.where('active').equals(true).toArray()
    if (dims.length > 0) {
      dimensionNames.value = dims.map(d => ({ key: d.key, name: d.name }))
    } else {
      dimensionNames.value = FALLBACK_DIMS
    }
  } catch {
    dimensionNames.value = FALLBACK_DIMS
  }
  console.log('[备份页] 加载维度:', dimensionNames.value.length, '个', dimensionNames.value.map(d => d.name))
}

onMounted(async () => {
  stats.value = await getDataStats()
  await loadDimensions()
})

function setStatus(msg: string, type: 'success' | 'error') { statusMsg.value = msg; statusType.value = type; setTimeout(() => { statusMsg.value = ''; statusType.value = '' }, 4000) }
async function handleExportJSON() { try { await exportJSON(); setStatus('导出成功！', 'success'); stats.value = await getDataStats() } catch { setStatus('导出失败', 'error') } }
async function handleExportExcel() { try { await exportExcel(); setStatus('导出成功！', 'success') } catch { setStatus('导出失败', 'error') } }
async function handleImportJSON(e: Event) { const file = (e.target as HTMLInputElement).files?.[0]; if (!file) return; try { await importJSON(file, importMode.value); setStatus('导入成功！', 'success'); stats.value = await getDataStats() } catch { setStatus('导入失败', 'error') }; (e.target as HTMLInputElement).value = '' }

async function handleParsePaste() {
  const r = parsePastedText(pasteText.value)
  if (!r) { setStatus('解析失败', 'error'); return }
  parsedData.value = r
  columnMapping.value = autoMapColumns(r.headers)

  // 确保维度就绪
  if (dimensionNames.value.length === 0) await loadDimensions()

  // 日志：列出所有列头
  console.log('[解析] Excel列头:', r.headers)
  console.log('[解析] 基本映射:', columnMapping.value)
  console.log('[解析] 可用维度:', dimensionNames.value.map(d => d.name))

  // 自动检测评分列
  const detected = detectScoreColumns(r.headers, dimensionNames.value)
  scoreMapping.value = detected
  console.log('[解析] 评分映射结果:', detected)
}

function handleClearPaste() {
  pasteText.value = ''; parsedData.value = null; columnMapping.value = {}; scoreMapping.value = {}
}

async function handlePasteImport() {
  if (!parsedData.value || !columnMapping.value.name) { setStatus('请至少映射演出名称列', 'error'); return }
  pasteImporting.value = true
  try {
    const count = await importParsedData(parsedData.value.rows, columnMapping.value, scoreMapping.value)
    setStatus(`成功导入 ${count} 条记录！`, 'success')
    stats.value = await getDataStats()
    handleClearPaste()
  } catch { setStatus('导入失败', 'error') }
  finally { pasteImporting.value = false }
}
</script>

<template>
  <div class="p-4 md:p-6 max-w-2xl mx-auto space-y-6">
    <h2 class="text-xl md:text-2xl font-black text-black tracking-tighter">数据备份与导入</h2>

    <!-- 数据概况 -->
    <div class="border-2 border-black/10 p-4">
      <h3 class="text-xs font-black tracking-[.15em] text-black/40 mb-3">数据概况</h3>
      <div class="grid grid-cols-2 gap-2 text-xs font-bold">
        <div class="text-black/40">演出记录 <span class="text-black">{{ stats.recordCount }}</span> 条</div>
        <div class="text-black/40">评分维度 <span class="text-black">{{ stats.dimCount }}</span> 个</div>
        <div class="text-black/40">上次备份 <span class="text-black">{{ stats.lastBackupLabel }}</span></div>
      </div>
    </div>

    <!-- 导出数据 -->
    <div class="border-2 border-black/10 p-4 space-y-3">
      <h3 class="text-xs font-black tracking-[.15em] text-black/40">导出数据</h3>
      <div class="grid grid-cols-2 gap-3">
        <button class="text-xs font-black tracking-[.15em] bg-black text-white px-4 py-2.5 hover:bg-black/80 transition-colors" @click="handleExportJSON">导出 JSON</button>
        <button class="text-xs font-black tracking-[.15em] border-2 border-black text-black px-4 py-2.5 hover:bg-black hover:text-white transition-colors" @click="handleExportExcel">导出 Excel</button>
      </div>
    </div>

    <!-- 导入数据 -->
    <div class="border-2 border-black/10 p-4 space-y-4">
      <h3 class="text-xs font-black tracking-[.15em] text-black/40">导入数据</h3>

      <!-- 粘贴导入 -->
      <div class="space-y-3">
        <p class="text-[10px] font-bold text-black/30">从 Excel 复制粘贴（第一行为表头）</p>
        <textarea v-model="pasteText"
          class="w-full h-24 text-xs font-mono text-black placeholder:text-black/20 bg-transparent border-2 border-black/20 focus:border-black focus:outline-none p-3 transition-colors resize-none"
          placeholder="Paste Excel content here...&#10;(First row = headers, tab-separated)" :disabled="!!parsedData" />
        <div class="flex gap-2">
          <button v-if="!parsedData" class="text-xs font-black tracking-[.15em] bg-black text-white px-4 py-2 hover:bg-black/80 transition-colors disabled:opacity-20" :disabled="!pasteText.trim()" @click="handleParsePaste">解析字段</button>
          <button v-else class="text-xs font-black tracking-[.15em] text-black/40 hover:text-black transition-colors px-2" @click="handleClearPaste">重新粘贴</button>
        </div>
      </div>

      <!-- 解析结果 -->
      <div v-if="parsedData" class="space-y-3 pt-3 border-t-2 border-black/10">
        <p class="text-xs font-bold text-black/40">已解析 <span class="text-black">{{ parsedRowCount }}</span> 行 · {{ parsedData.headers.length }} 列</p>
        <p v-if="mappingWarning" class="text-xs font-bold text-black/60 border-2 border-black/20 p-2 bg-black/[0.02]">⚠ {{ mappingWarning }}</p>
        <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div v-for="(label, field) in fieldLabels" :key="field">
            <label class="block text-[10px] font-black tracking-[.15em] text-black/40 mb-1">{{ label }} <span v-if="field === 'name'" class="text-black">*</span></label>
            <select v-model="columnMapping[field]" class="w-full text-xs font-bold text-black bg-transparent border-2 border-black/20 px-3 py-2 focus:border-black focus:outline-none transition-colors appearance-none">
              <option value="">--</option>
              <option v-for="h in parsedData.headers" :key="h" :value="h">{{ h }}</option>
            </select>
          </div>
        </div>
        <div class="border-2 border-black/10 p-3">
          <p class="text-[10px] font-black tracking-[.15em] text-black/40 mb-2">评分列映射</p>
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
            <div v-for="dim in dimensionNames" :key="dim.key" class="flex items-center gap-2">
              <label class="text-[10px] font-bold text-black w-12 flex-shrink-0">{{ dim.name }}</label>
              <select v-model="scoreMapping[dim.key]" class="flex-1 text-[10px] font-bold text-black bg-transparent border-2 border-black/20 px-2 py-1.5 focus:border-black focus:outline-none transition-colors appearance-none">
                <option value="">--</option>
                <option v-for="h in parsedData.headers" :key="h" :value="h">{{ h }}</option>
              </select>
            </div>
          </div>
        </div>
        <details class="text-xs">
          <summary class="cursor-pointer text-[10px] font-black tracking-[.15em] text-black/40 py-1">预览 ({{ Math.min(5, parsedRowCount) }}行)</summary>
          <div class="overflow-x-auto mt-2 border-2 border-black/10">
            <table class="w-full text-[10px]">
              <thead><tr><th v-for="h in parsedData.headers" :key="h" class="text-left p-2 font-black text-black/60 border-b-2 border-black/10">{{ h }}</th></tr></thead>
              <tbody><tr v-for="(row, i) in previewRows" :key="i"><td v-for="h in parsedData.headers" :key="h" class="p-2 font-bold text-black border-b border-black/5">{{ row[h] }}</td></tr></tbody>
            </table>
          </div>
        </details>
        <button class="text-xs font-black tracking-[.15em] bg-black text-white px-4 py-2.5 hover:bg-black/80 transition-colors disabled:opacity-20" :disabled="!columnMapping.name || pasteImporting" @click="handlePasteImport">
          {{ pasteImporting ? '导入中...' : `导入 ${parsedRowCount} 条记录` }}
        </button>
      </div>

      <!-- JSON 文件导入 -->
      <div class="pt-3 border-t-2 border-black/10 space-y-3">
        <p class="text-[10px] font-bold text-black/30">或从 JSON 备份文件导入</p>
        <div class="flex gap-4">
          <label class="flex items-center gap-2 text-xs font-bold text-black cursor-pointer"><input type="radio" v-model="importMode" value="merge" class="accent-black" />合并</label>
          <label class="flex items-center gap-2 text-xs font-bold text-black cursor-pointer"><input type="radio" v-model="importMode" value="replace" class="accent-black" />覆盖</label>
        </div>
        <div class="relative">
          <button class="w-full text-xs font-black tracking-[.15em] border-2 border-black text-black px-4 py-2.5 hover:bg-black hover:text-white transition-colors">选择 JSON 备份文件</button>
          <input type="file" accept=".json" @change="handleImportJSON" class="absolute inset-0 opacity-0 cursor-pointer" />
        </div>
        <p v-if="importMode === 'replace'" class="text-[10px] font-bold text-black/60 tracking-[.15em]">⚠ 覆盖模式将清空所有现有数据</p>
      </div>
    </div>

    <!-- 状态消息 -->
    <div v-if="statusMsg" class="border-2 p-3 text-xs font-black tracking-[.15em]" role="status" aria-live="polite"
      :class="statusType === 'success' ? 'border-black bg-black text-white' : 'border-black text-black'">{{ statusMsg }}</div>
  </div>
</template>
