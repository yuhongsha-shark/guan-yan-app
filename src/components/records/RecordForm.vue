<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import type { PerformanceRecord, CreateRecordInput, CustomField } from '@/types/record'
import { useDimensions } from '@/composables/useDimensions'
import ScoreInput from './ScoreInput.vue'
import CustomFieldsEditor from './CustomFieldsEditor.vue'
import { db } from '@/db/index'

const props = defineProps<{ record?: PerformanceRecord | null }>()
const emit = defineEmits<{ submit: [data: CreateRecordInput]; cancel: [] }>()

const { activeDimensions, fetchAll } = useDimensions()

const DRAFT_KEY = 'record-form-draft'

// 如果是编辑已有记录则恢复，否则尝试恢复草稿
const savedDraft = !props.record ? tryLoadDraft() : null

function tryLoadDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

const name = ref(props.record?.name || savedDraft?.name || '')
const dateStr = ref(props.record?.date || savedDraft?.date || '')
const category = ref(props.record?.category || savedDraft?.category || '')
const venue = ref(props.record?.venue || savedDraft?.venue || '')
const purchaseChannel = ref(props.record?.purchaseChannel || savedDraft?.purchaseChannel || '')
const price = ref(props.record?.price ?? savedDraft?.price ?? 0)
const seat = ref(props.record?.seat || savedDraft?.seat || '')
const status = ref(props.record?.status || savedDraft?.status || '')
const scores = ref<Record<string, number>>(savedDraft?.scores || {})
const customFields = ref<CustomField[]>(props.record?.customFields ? [...props.record.customFields] : savedDraft?.customFields || [])
const notes = ref(props.record?.notes || savedDraft?.notes || '')
const categories = ref<{ name: string }[]>([])
const existingChannels = ref<string[]>([])
const existingStatuses = ref<string[]>([])
const existingVenues = ref<string[]>([])

// 按出现频率从高到低排序
function freqSort(arr: string[]): string[] {
  const counts = new Map<string, number>()
  for (const v of arr) { if (v) counts.set(v, (counts.get(v) || 0) + 1) }
  return [...counts.entries()].sort((a, b) => b[1] - a[1]).map(e => e[0])
}
const errors = ref<Record<string, string>>({})

// 自动保存草稿（新记录模式，每秒）
let saveTimer: ReturnType<typeof setInterval> | null = null
if (!props.record) {
  saveTimer = setInterval(() => {
    localStorage.setItem(DRAFT_KEY, JSON.stringify({
      name: name.value, date: dateStr.value, category: category.value,
      venue: venue.value, purchaseChannel: purchaseChannel.value,
      price: price.value, seat: seat.value, status: status.value,
      scores: scores.value, customFields: customFields.value, notes: notes.value,
    }))
  }, 1000)
}
onUnmounted(() => { if (saveTimer) clearInterval(saveTimer) })

function clearDraft() { localStorage.removeItem(DRAFT_KEY) }

onMounted(async () => {
  await fetchAll()
  const allRecords = await db.records.toArray()
  const cats = await db.categories.toArray()
  // 按记录中出现频率排序已有的类别
  const catFreq = freqSort(allRecords.map(r => r.category).filter(Boolean) as string[])
  categories.value = cats.sort((a, b) => {
    const ia = catFreq.indexOf(a.name), ib = catFreq.indexOf(b.name)
    if (ia === -1 && ib === -1) return 0
    if (ia === -1) return 1
    if (ib === -1) return -1
    return ia - ib
  })
  // 加载已有记录中的购买渠道和现状，用于自动补全
  existingChannels.value = freqSort(allRecords.map(r => r.purchaseChannel).filter(Boolean) as string[])
  existingStatuses.value = freqSort(allRecords.map(r => r.status).filter(Boolean) as string[])
  existingVenues.value = freqSort(allRecords.map(r => r.venue).filter(Boolean) as string[])
  if (props.record) {
    for (const dim of activeDimensions.value) scores.value[dim.key] = props.record.scores[dim.key] ?? 0
  } else {
    for (const dim of activeDimensions.value) scores.value[dim.key] = 50
  }
})

function validate(): boolean {
  errors.value = {}
  if (!name.value.trim()) errors.value.name = '请输入演出名称'
  if (!dateStr.value.trim()) errors.value.date = '请输入演出日期'
  if (!category.value.trim()) errors.value.category = '请选择或输入类别'
  if (!venue.value.trim()) errors.value.venue = '请输入场馆/地址'
  if (price.value < 0) errors.value.price = '价格不能为负'
  return Object.keys(errors.value).length === 0
}

function handleSubmit() {
  if (!validate()) return
  clearDraft()
  emit('submit', {
    name: name.value.trim(),
    date: dateStr.value.trim(),
    category: category.value.trim(),
    venue: venue.value.trim(),
    purchaseChannel: purchaseChannel.value.trim(),
    price: price.value,
    seat: seat.value.trim(),
    status: status.value.trim(),
    scores: { ...scores.value },
    customFields: customFields.value.filter(f => f.key.trim()).map(f => ({ key: f.key, value: f.value })),
    notes: notes.value.trim(),
  })
}

const isEditing = computed(() => !!props.record?.id)

// 粘贴/OCR 识别
const showPasteParser = ref(false)
const pasteText = ref('')
const pasteResult = ref('')
function parseTicket(text: string) {
  const lines = text.split(/[\n\r]+/).map(l => l.trim()).filter(Boolean)
  const result: Record<string, string> = {}

  for (const line of lines) {
    const priceMatch = line.match(/[¥￥]\s*(\d+\.?\d*)|(\d+\.?\d*)\s*元|票价[：:]\s*(\d+)/)
    if (priceMatch && !result.price) result.price = (priceMatch[1] || priceMatch[2] || priceMatch[3] || '')

    const dateMatch = line.match(/(\d{4}[.\-/]\d{1,2}[.\-/]\d{1,2})|(\d{1,2}月\d{1,2}日)/)
    if (dateMatch && !result.date) {
      const d = dateMatch[0]
      result.date = d.includes('月') ? d : d.replace(/-/g, '.').replace(/\//g, '.')
    }

    if (/剧场|剧院|中心|LiveHouse|livehouse|音乐厅|体育馆|会展|艺术馆|文化宫|大舞台|MAO|酒球会|school|SCHOOL/i.test(line) && !result.venue) {
      result.venue = line.replace(/^[场地|场馆|地点|地址][：:]\s*/, '')
    }

    const nameMatch = line.match(/《(.+?)》/)
    if (nameMatch && !result.name) result.name = line

    if (/音乐节|Live|演唱会|话剧|音乐剧|舞蹈|戏曲|脱口秀|相声|歌剧|芭蕾/i.test(line) && !result.category) {
      result.category = line.match(/音乐节|Live|演唱会|话剧|音乐剧|舞蹈|戏曲|脱口秀|相声|歌剧|芭蕾/i)![0]
    }

    if (/(\d+排|\d+座|\d+区|VIP|A区|B区|C区)/i.test(line) && !result.seat) {
      result.seat = line.replace(/^[座位|位置][：:]\s*/, '')
    }

    if (/大麦|秀动|猫眼|摩天轮|票星球|正在现场|聚橙|永乐|票牛/i.test(line) && !result.channel) {
      result.channel = line.match(/大麦|秀动|猫眼|摩天轮|票星球|正在现场|聚橙|永乐|票牛/i)![0]
    }
  }

  if (!result.name && lines[0]) result.name = lines[0]
  return result
}

function applyPaste() {
  const parsed = parseTicket(pasteText.value)
  if (parsed.name) name.value = parsed.name
  if (parsed.date) dateStr.value = parsed.date
  if (parsed.venue) venue.value = parsed.venue
  if (parsed.price) price.value = parseFloat(parsed.price)
  if (parsed.category) category.value = parsed.category
  if (parsed.seat) seat.value = parsed.seat
  if (parsed.channel) purchaseChannel.value = parsed.channel

  const found = Object.keys(parsed).filter(k => parsed[k])
  pasteResult.value = found.length > 0 ? `已识别 ${found.length} 个字段：${found.map(k => parsed[k]).join(' · ')}` : '未能识别，请手动填写'
  pasteText.value = ''
  showPasteParser.value = false
}
</script>

<template>
  <form class="p-5 md:p-7 space-y-6 font-sans" @submit.prevent="handleSubmit">
    <!-- 草稿提示 -->
    <div v-if="!props.record && savedDraft" class="flex items-center justify-between bg-black/[0.03] border-2 border-black/10 px-3 py-2">
      <span class="text-[10px] font-bold text-black/40">已恢复上次未提交的内容</span>
      <button type="button" class="text-[10px] font-black text-black/30 hover:text-black transition-colors" @click="clearDraft(); name = ''; dateStr = ''; category = ''; venue = ''; purchaseChannel = ''; price = 0; seat = ''; status = ''; notes = ''; scores = {}; customFields = []">清空</button>
    </div>

    <!-- 粘贴识别（仅新增模式） -->
    <div v-if="!isEditing">
      <button v-if="!showPasteParser" type="button"
        class="w-full border-2 border-dashed border-black/20 py-3 text-xs font-black text-black/30 hover:text-black hover:border-black/40 transition-colors"
        @click="showPasteParser = true">
        📋 粘贴信息自动识别
      </button>
      <div v-else class="border-2 border-black p-3 space-y-2">
        <textarea v-model="pasteText" rows="4"
          class="w-full text-xs font-bold text-black placeholder:text-black/20 bg-transparent border-0 focus:outline-none resize-none"
          placeholder="粘贴购票信息...&#10;例如：杨策《King's Keys》亚洲巡演 上海站&#10;2026.06.06 19:30 · 上海爵士音乐节主舞台&#10;大麦 ¥288 A区3排"></textarea>
        <div class="flex gap-2">
          <button type="button" class="text-xs font-black bg-black text-white px-4 py-2 hover:bg-black/80 transition-colors disabled:opacity-20"
            :disabled="!pasteText.trim()" @click="applyPaste">识别并填入</button>
          <button type="button" class="text-xs font-black text-black/30 hover:text-black transition-colors px-2"
            @click="showPasteParser = false; pasteText = ''">关闭</button>
        </div>
        <p v-if="pasteResult" class="text-[10px] font-bold text-black/40">{{ pasteResult }}</p>
      </div>
    </div>

    <!-- 演出名称 -->
    <div>
      <label class="block text-xs font-black uppercase tracking-[.15em] text-black/40 mb-1.5">演出名称 *</label>
      <input v-model="name" type="text" placeholder="如：杨策《King's Keys》亚洲巡演"
        class="w-full px-0 py-2 text-base font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
      <p v-if="errors.name" class="text-red-600 text-xs font-bold mt-1">{{ errors.name }}</p>
    </div>

    <!-- 日期 + 类别 -->
    <div class="grid grid-cols-2 gap-6">
      <div>
        <label class="block text-xs font-black uppercase tracking-[.15em] text-black/40 mb-1.5">演出日期 *</label>
        <input v-model="dateStr" type="text" placeholder="2026.06.06 19:30"
          class="w-full px-0 py-2 text-base font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
      </div>
      <div>
        <label class="block text-xs font-black uppercase tracking-[.15em] text-black/40 mb-1.5">类别 *</label>
        <input v-model="category" type="text" list="categories-list" placeholder="如：Live"
          class="w-full px-0 py-2 text-base font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
        <datalist id="categories-list"><option v-for="cat in categories" :key="cat.name" :value="cat.name" /></datalist>
      </div>
    </div>

    <!-- 场馆 -->
    <div>
      <label class="block text-xs font-black uppercase tracking-[.15em] text-black/40 mb-1.5">场馆/地址 *</label>
      <input v-model="venue" type="text" list="venues-list" placeholder="如：上海爵士音乐节主舞台"
        class="w-full px-0 py-2 text-base font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
      <datalist id="venues-list"><option v-for="v in existingVenues" :key="v" :value="v" /></datalist>
    </div>

    <!-- 购买渠道 -->
    <div>
      <label class="block text-xs font-black uppercase tracking-[.15em] text-black/40 mb-1.5">购买渠道</label>
      <input v-model="purchaseChannel" type="text" list="channels-list" placeholder="大麦、秀动、猫眼..."
        class="w-full px-0 py-2 text-base font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
      <datalist id="channels-list"><option v-for="ch in existingChannels" :key="ch" :value="ch" /></datalist>
    </div>

    <!-- 票价 + 座位 -->
    <div class="grid grid-cols-2 gap-6">
      <div>
        <label class="block text-xs font-black uppercase tracking-[.15em] text-black/40 mb-1.5">票价 CNY *</label>
        <input v-model.number="price" type="number" min="0" step="0.01" placeholder="0.00"
          class="w-full px-0 py-2 text-base font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
      </div>
      <div>
        <label class="block text-xs font-black uppercase tracking-[.15em] text-black/40 mb-1.5">座位</label>
        <input v-model="seat" type="text" placeholder="A区3排5座"
          class="w-full px-0 py-2 text-base font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
      </div>
    </div>

    <!-- 现状 -->
    <div>
      <label class="block text-xs font-black uppercase tracking-[.15em] text-black/40 mb-1.5">现状</label>
      <input v-model="status" type="text" list="statuses-list" placeholder="已看、未看、已出票..."
        class="w-full px-0 py-2 text-base font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
      <datalist id="statuses-list"><option v-for="st in existingStatuses" :key="st" :value="st" /></datalist>
    </div>

    <!-- 评分 -->
    <div class="pt-4 border-t-2 border-black/10">
      <h3 class="text-xs font-black uppercase tracking-[.15em] text-black/40 mb-4">多维度评分</h3>
      <div v-if="activeDimensions.length === 0" class="text-xs font-bold text-black/30 py-3 text-center bg-black/[0.02]">
        暂无活跃评分维度，请先在"评分维度"中添加
      </div>
      <ScoreInput v-for="dim in activeDimensions" :key="dim.key" :label="dim.name" v-model="scores[dim.key]" />
    </div>

    <!-- 自定义字段 -->
    <div class="pt-4 border-t-2 border-black/10">
      <CustomFieldsEditor v-model="customFields" />
    </div>

    <!-- 备注 -->
    <div>
      <label class="block text-xs font-black uppercase tracking-[.15em] text-black/40 mb-1.5">备注</label>
      <textarea v-model="notes" rows="3" placeholder="观演感受、特殊事项..."
        class="w-full px-0 py-2 text-sm font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors resize-none" />
    </div>

    <!-- 按钮 -->
    <div class="flex gap-3 pt-4 border-t-2 border-black/10">
      <button type="button" class="flex-1 py-3 text-xs font-black uppercase tracking-[.15em] text-black/40 hover:text-black transition-colors" @click="emit('cancel')">取消</button>
      <button type="submit" class="flex-1 py-3 text-xs font-black uppercase tracking-[.15em] bg-black text-white hover:bg-black/80 transition-colors">
        {{ isEditing ? '保存修改' : '添加记录' }}
      </button>
    </div>
  </form>
</template>
