<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRecords } from '@/composables/useRecords'
import RecordForm from '@/components/records/RecordForm.vue'
import SlideOver from '@/components/common/SlideOver.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'
import type { PerformanceRecord, CreateRecordInput } from '@/types/record'

const { records, fetchAll, remove, create, update } = useRecords()

// 精确配色 — 草绿、天蓝、亮黄、中灰（循环）
// 配色策略：Full palette — 4 色分类 + 黑/白中性
// 全部使用 OKLCH，感知亮度均衡
const COLORS = [
  { bg: 'oklch(0.78 0.22 142)', text: '#000' },  // 翠绿 — vivid grass
  { bg: 'oklch(0.72 0.18 235)', text: '#000' },  // 宝蓝 — saturated sky（chroma 从 0.13 提到 0.18）
  { bg: 'oklch(0.88 0.19 105)', text: '#000' },  // 亮黄 — bright sun
  { bg: 'oklch(0.68 0.06 30)',  text: '#000' },  // 陶土 — muted clay（取代死灰 #b0b0b0）
  { bg: 'oklch(0.78 0.22 142)', text: '#000' },  // 循环
  { bg: 'oklch(0.72 0.18 235)', text: '#000' },
]

// 抽屉状态
const drawerOpen = ref(false)
const editingRecord = ref<PerformanceRecord | null>(null)

const drawerTitle = computed(() => editingRecord.value ? 'EDIT RECORD' : 'ADD RECORD')

function openAdd() {
  editingRecord.value = null
  drawerOpen.value = true
}

function openEdit(record: PerformanceRecord) {
  editingRecord.value = { ...record }
  drawerOpen.value = true
}

function closeDrawer() {
  drawerOpen.value = false
  editingRecord.value = null
}

async function handleSubmit(data: CreateRecordInput) {
  if (editingRecord.value?.id != null) {
    await update(editingRecord.value.id, data)
  } else {
    await create(data)
  }
  await fetchAll()
  closeDrawer()
}

// 删除确认
const showDeleteConfirm = ref(false)
const showBatchConfirm = ref(false)
const deleteTarget = ref<PerformanceRecord | null>(null)

// 撤销删除
const undoRecord = ref<PerformanceRecord | null>(null)
const undoTimer = ref<ReturnType<typeof setTimeout> | null>(null)

function requestDelete(record: PerformanceRecord) {
  deleteTarget.value = record
  showDeleteConfirm.value = true
}

async function confirmDelete() {
  if (deleteTarget.value?.id != null) {
    const deleted = { ...deleteTarget.value }
    await remove(deleteTarget.value.id)
    await fetchAll()
    // 显示撤销
    undoRecord.value = deleted
    undoTimer.value = setTimeout(() => { undoRecord.value = null }, 5000)
  }
  showDeleteConfirm.value = false
  deleteTarget.value = null
}

async function undoDelete() {
  if (!undoRecord.value) return
  const r = undoRecord.value
  await create({
    name: r.name,
    date: r.date,
    category: r.category,
    venue: r.venue,
    purchaseChannel: r.purchaseChannel || '',
    price: r.price || 0,
    seat: r.seat || '',
    status: r.status || '',
    scores: { ...r.scores },
    customFields: r.customFields ? [...r.customFields] : [],
    notes: r.notes || '',
  })
  await fetchAll()
  if (undoTimer.value) clearTimeout(undoTimer.value)
  undoRecord.value = null
}

// 移动端 tap 展开
const tapExpanded = ref<number | null>(null)
const poppingCol = ref<number | null>(null)

function onColClick(record: PerformanceRecord, idx: number) {
  poppingCol.value = idx
  setTimeout(() => { poppingCol.value = null }, 350)

  if (tapExpanded.value === idx) {
    tapExpanded.value = null
    setTimeout(() => openEdit(record), 100)
  } else if ('ontouchstart' in window || window.innerWidth < 768) {
    tapExpanded.value = idx
  } else {
    setTimeout(() => openEdit(record), 100)
  }
}

const totalCount = computed(() => records.value.length)

// 搜索
const searchActive = ref(false)
const searchQuery = ref('')

const filteredRecords = computed(() => {
  if (!searchActive.value || !searchQuery.value.trim()) return records.value
  const q = searchQuery.value.toLowerCase()
  return records.value.filter(r =>
    r.name.toLowerCase().includes(q) ||
    r.venue.toLowerCase().includes(q) ||
    r.category.toLowerCase().includes(q) ||
    r.purchaseChannel?.toLowerCase().includes(q) ||
    r.seat?.toLowerCase().includes(q) ||
    r.status?.toLowerCase().includes(q) ||
    r.notes?.toLowerCase().includes(q)
  )
})

function openSearch() {
  searchActive.value = true
  searchQuery.value = ''
  setTimeout(() => {
    document.getElementById('records-search-input')?.focus()
  }, 100)
}

function closeSearch() {
  searchActive.value = false
  searchQuery.value = ''
}

// 批量删除搜索结果
const batchDeleting = ref(false)
async function batchDeleteFiltered() {
  batchDeleting.value = true
  try {
    const ids = filteredRecords.value.map(r => r.id).filter(Boolean) as number[]
    for (const id of ids) await remove(id)
    await fetchAll()
    tapExpanded.value = null
  } finally {
    batchDeleting.value = false
  }
}

// 格式化日期为 "YYYY.MM.DD" 风格
function fmtDate(d: string) {
  const parts = d.split(/[\s.]/)
  return parts[0] || d
}

onMounted(async () => {
  await fetchAll()
})
</script>

<template>
  <!-- 撤销提示 -->
  <Transition name="fade">
    <div v-if="undoRecord" class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black text-white px-4 py-2.5 shadow-lg" role="status" aria-live="polite">
      <span class="text-xs font-bold">已删除「{{ undoRecord.name }}」</span>
      <button class="text-xs font-black uppercase tracking-[.15em] text-[#facc15] hover:text-white transition-colors" @click="undoDelete">撤销</button>
      <button class="text-xs text-white/40 hover:text-white transition-colors ml-1" @click="undoRecord = null">✕</button>
    </div>
  </Transition>

  <!-- 搜索栏 -->
  <Transition name="fade">
    <div v-if="searchActive" class="flex items-center gap-2 px-4 py-2 border-b-2 border-black/10 bg-white">
      <input
        id="records-search-input"
        v-model="searchQuery"
        type="text"
        placeholder="搜索名称、场馆、类别..."
        class="flex-1 text-sm font-bold text-black placeholder:text-black/20 bg-transparent border-0 focus:outline-none py-1"
        @input="tapExpanded = null"
      />
      <span v-if="searchQuery" class="text-[10px] font-black text-black/20 tabular-nums">{{ filteredRecords.length }}条</span>
      <button v-if="searchQuery && filteredRecords.length > 0" class="text-[10px] font-black text-black/30 hover:text-black transition-colors px-2 py-1 border border-black/20" @click="showBatchConfirm = true" :disabled="batchDeleting">
        {{ batchDeleting ? '删除中...' : '批量删除' }}
      </button>
      <button class="text-black/30 hover:text-black transition-colors p-1" @click="closeSearch">
        <span class="text-lg leading-none">✕</span>
      </button>
    </div>
  </Transition>

  <div class="flex-1 min-h-0 flex overflow-hidden font-sans">
    <!-- ===== 横向风琴主体 ===== -->
    <div class="flex-1 flex overflow-x-auto overflow-y-hidden scrollbar-hide">
      <!-- 空状态 -->
      <div
        v-if="filteredRecords.length === 0"
        class="flex-1 flex flex-col items-center justify-center bg-white gap-4"
      >
        <p class="text-4xl font-black text-black/10 tracking-tighter">暂无记录</p>
        <div class="flex items-center gap-2 mt-3 text-[10px] font-bold text-black/30">
          <span class="border-2 border-black/10 px-2 py-1">① 添加评分维度</span>
          <span>→</span>
          <span class="border-2 border-black/10 px-2 py-1">② 点添加按钮</span>
          <span>→</span>
          <span class="border-2 border-black/10 px-2 py-1">③ 查看红黑榜</span>
        </div>
      </div>

      <!-- 风琴列 -->
      <div
        v-for="(record, idx) in filteredRecords"
        :key="record.id"
        class="accordion-col group relative flex flex-col cursor-pointer select-none overflow-hidden focus-visible:ring-2 focus-visible:ring-black focus-visible:z-10 focus-visible:outline-none"
        :class="{ 'is-tap-expanded': tapExpanded === idx, 'is-popping': poppingCol === idx }"
        :style="{
          flex: tapExpanded === idx ? '2.5 1 0%' : '1 1 0%',
          minWidth: '140px',
          backgroundColor: COLORS[idx % COLORS.length].bg,
          transition: 'flex 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
        }"
        tabindex="0"
        role="button"
        :aria-label="'查看 ' + record.name"
        @click="onColClick(record, idx)"
        @keydown.enter.prevent="onColClick(record, idx)"
        @keydown.space.prevent="onColClick(record, idx)"
        @mouseenter="
          tapExpanded = null;
          ($el as HTMLElement).style.flex = '2.5 1 0%';
          ($el as HTMLElement).style.minWidth = '260px'
        "
        @mouseleave="
          ($el as HTMLElement).style.flex = '1 1 0%';
          ($el as HTMLElement).style.minWidth = '140px'
        "
      >
        <!-- ===== 列内容（从上到下） ===== -->

        <!-- 1. 日期 — 顶部，小号粗体 -->
        <div class="px-4 md:px-6 pt-5 md:pt-7">
          <p class="text-xs font-bold text-black/80 uppercase tracking-wide leading-tight">
            {{ fmtDate(record.date) }}
          </p>
        </div>

        <!-- 2. 主标题 — 极大、极粗、黑色 -->
        <div class="px-4 md:px-6 mt-2">
          <h3
            class="text-xl md:text-3xl lg:text-4xl font-black text-black uppercase tracking-tighter leading-[1.08]"
            style="text-wrap: balance; word-break: break-word;"
          >
            {{ record.name }}
          </h3>
        </div>

        <!-- 3. 详细信息 — 中间，较小，正常/半粗 -->
        <div
          class="detail-panel px-4 md:px-6 mt-6 space-y-1"
          :class="{ 'is-visible': tapExpanded === idx }"
        >
          <p class="text-xs font-semibold text-black/70 leading-snug">{{ record.category }}</p>
          <p class="text-xs font-semibold text-black/70 leading-snug">{{ record.venue }}</p>
          <p v-if="record.purchaseChannel" class="text-xs font-semibold text-black/70 leading-snug">{{ record.purchaseChannel }}</p>
          <p v-if="record.seat" class="text-xs font-semibold text-black/70 leading-snug">{{ record.seat }}</p>
          <p class="text-xs font-bold text-black/80 leading-snug mt-2">¥{{ record.price.toFixed(0) }}</p>
          <p v-if="record.status" class="text-xs font-black uppercase tracking-[.15em] text-black/40 mt-2">
            {{ record.status }}
          </p>
        </div>

        <!-- 底部弹簧：把按钮推到底部 -->
        <div class="flex-1"></div>

        <!-- 4. 底部 CTA — hover/tap 显示 -->
        <div class="detail-panel px-4 md:px-6 pb-5 md:pb-7 mt-4" :class="{ 'is-visible': tapExpanded === idx }">
          <span
            class="inline-block bg-black text-white text-xs font-black uppercase tracking-[.15em] px-3 py-2 leading-none cursor-pointer hover:bg-black/80 transition-colors"
            @click.stop="openEdit(record)"
          >
            查看详情 →
          </span>
        </div>

        <!-- 删除按钮（hover/tap 可见） -->
        <button
          class="del-btn absolute top-3 right-3 w-6 h-6 bg-black/20 flex items-center justify-center hover:bg-black/40"
          @click.stop="requestDelete(record)"
          title="删除"
        >
          <span class="text-xs font-black text-white">✕</span>
        </button>
      </div>
    </div>

    <!-- ===== 右侧边栏 — 白底黑字 ===== -->
    <div class="w-14 md:w-16 flex-shrink-0 bg-white border-l-2 border-black/10 flex flex-col items-center justify-between py-6">
      <!-- 顶部按钮区 -->
      <div class="flex flex-col items-center gap-4">
        <button
          class="text-xs font-black text-black tracking-[.15em] hover:opacity-60 transition-opacity"
          @click="openAdd"
        >
          添加
        </button>
        <button
          class="text-xs font-black text-black/40 tracking-[.15em] hover:text-black transition-colors"
          @click="openSearch"
        >
          搜索
        </button>
      </div>

      <!-- 底部旋转大字标题 -->
      <div class="flex-1 flex items-center">
        <span
          class="text-xs font-black text-black tracking-[.25em] uppercase whitespace-nowrap leading-tight"
          style="writing-mode: vertical-rl; text-orientation: mixed;"
        >
          GUAN YAN · {{ searchActive ? filteredRecords.length : totalCount }}
        </span>
      </div>
    </div>

    <!-- ===== 侧边抽屉 ===== -->
    <SlideOver :show="drawerOpen" :title="drawerTitle" @close="closeDrawer">
      <RecordForm
        :key="editingRecord?.id ?? 'new'"
        :record="editingRecord"
        @submit="handleSubmit"
        @cancel="closeDrawer"
      />
    </SlideOver>

    <!-- ===== 删除确认 ===== -->
    <ConfirmDialog
      :show="showDeleteConfirm"
      title="确认删除"
      :message="`确定要删除「${deleteTarget?.name}」吗？删除后可撤销。`"
      confirm-text="删除"
      @confirm="confirmDelete"
      @cancel="showDeleteConfirm = false"
    />

    <!-- ===== 批量删除确认 ===== -->
    <ConfirmDialog
      :show="showBatchConfirm"
      title="批量删除"
      :message="`确定要删除当前搜索到的 ${filteredRecords.length} 条记录吗？此操作不可撤销。`"
      confirm-text="全部删除"
      @confirm="batchDeleteFiltered(); showBatchConfirm = false"
      @cancel="showBatchConfirm = false"
    />
  </div>
</template>

<style scoped>
/* 撤销提示淡入淡出 */
.fade-enter-active { transition: opacity 0.3s ease; }
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }

/* 隐藏滚动条 */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar {
  display: none;
}

/* 列之间分隔线 */
.accordion-col {
  border-right: 1px solid rgba(0, 0, 0, 0.12);
}
.accordion-col:last-of-type {
  border-right: none;
}

/* 详细信息：hover/tap 可见 */
.detail-panel {
  opacity: 0;
  transition: opacity 0.3s ease;
}
.accordion-col:hover .detail-panel,
.detail-panel.is-visible {
  opacity: 1;
}

/* 删除按钮：hover/tap 可见 */
.accordion-col .del-btn {
  opacity: 0;
  transition: opacity 0.2s ease;
}
.accordion-col:hover .del-btn,
.accordion-col.is-tap-expanded .del-btn {
  opacity: 1;
}

/* reduced-motion: 禁用列宽过渡 */
@media (prefers-reduced-motion: reduce) {
  .accordion-col {
    transition: none !important;
  }
}

/* 列点击弹跳 */
.accordion-col.is-popping {
  animation: col-pop 0.35s cubic-bezier(0.22, 0.61, 0.36, 1);
  z-index: 2;
}
@keyframes col-pop {
  0%   { transform: scale(1); filter: brightness(1); }
  50%  { transform: scale(1.04); filter: brightness(1.12); }
  100% { transform: scale(1); filter: brightness(1); }
}

/* reduced-motion: 停用弹跳，改为瞬时高亮 */
@media (prefers-reduced-motion: reduce) {
  .accordion-col.is-popping {
    animation: none;
    filter: brightness(1.15);
  }
}

</style>
