<script setup lang="ts">
import { ref, onMounted, computed, watch } from 'vue'
import { useRoute } from 'vue-router'
import { useRecords } from '@/composables/useRecords'
import { useDimensions } from '@/composables/useDimensions'
import { computeRanking } from '@/engine/ranking'
import RankingFilters from '@/components/ranking/RankingFilters.vue'
import RankChart from '@/components/ranking/RankChart.vue'
import RankingList from '@/components/ranking/RankingList.vue'
import BackupReminder from '@/components/common/BackupReminder.vue'
import { generatePoster, preparePosterResults } from '@/composables/usePoster'
import GiscusComments from '@/components/common/GiscusComments.vue'
import { POSTER_MAX_ITEMS, RED_PERCENTILE, BLACK_PERCENTILE } from '@/config/constants'
import { DEFAULT_SCALE } from '@/config/defaults'
import type { RankingFilters as RankingFiltersType } from '@/types/ranking'

const route = useRoute()
const { fetchAll: fetchRecords } = useRecords()
const { dimensions, activeDimensions, normalizedWeights, fetchAll: fetchDimensions, setWeight, toggleActive } = useDimensions()

const rankedResults = ref<any[]>([])
const computing = ref(false)
const filters = ref<RankingFiltersType>({ year: 'all', category: 'all', scale: DEFAULT_SCALE })
const backupReminder = ref<InstanceType<typeof BackupReminder>>()

// ---------- 权重面板 ----------
const showWeights = ref(false)
const priceSensitivity = ref(0.5) // 价格敏感度，0=忽略价格，2=极度敏感

function getNormPct(key: string): string {
  const w = normalizedWeights.value[key]
  return w != null ? (w * 100).toFixed(0) + '%' : '0%'
}

async function handleWeightChange(dimId: number, weight: number) {
  await setWeight(dimId, weight)
  await fetchDimensions()
  await loadData()
}

async function handleToggleDim(dimId: number) {
  await toggleActive(dimId)
  await fetchDimensions()
  await loadData()
}

// ---------- 海报弹窗 ----------
const showPosterModal = ref(false)
const posterType = ref<'red' | 'black'>('red')
const posterTitle = ref('')
const posterFooter = ref('')
const posterGenerating = ref(false)
const posterDefaultTitle = computed(() => posterType.value === 'red' ? '年度性价比红榜' : '年度性价比黑榜')
const posterSubtitle = computed(() => {
  const y = filters.value.year === 'all' ? '历年' : filters.value.year
  const c = filters.value.category === 'all' ? '全品类' : filters.value.category
  return `${y} · ${c}`
})
const posterResults = computed(() => preparePosterResults(rankedResults.value, posterType.value))

async function loadData() {
  computing.value = true
  try {
    const [recs] = await Promise.all([fetchRecords(), fetchDimensions()])
    console.log('[榜单] 筛选条件:', filters.value, '记录总数:', recs.length)
    if (recs.length === 0 || activeDimensions.value.length === 0) { rankedResults.value = []; return }
    rankedResults.value = computeRanking({
      records: recs, dimensions: activeDimensions.value, normalizedWeights: normalizedWeights.value,
      filters: filters.value, benchmarkMethod: 'median', redThreshold: RED_PERCENTILE, blackThreshold: BLACK_PERCENTILE,
      priceSensitivity: priceSensitivity.value,
    })
    console.log('[榜单] 筛选后结果:', rankedResults.value.length, '条')
  } catch (err) { console.error('[榜单] 出错:', err); rankedResults.value = [] }
  finally { computing.value = false }
  backupReminder.value?.checkBackup()
}

onMounted(loadData)
watch(filters, () => loadData(), { deep: true })

function openPosterModal() {
  posterTitle.value = ''; posterFooter.value = ''; posterType.value = 'red'; showPosterModal.value = true
}

async function handleGeneratePoster() {
  if (posterResults.value.length === 0) return
  posterGenerating.value = true
  try {
    await generatePoster({
      type: posterType.value, title: posterTitle.value || posterDefaultTitle.value,
      subtitle: posterSubtitle.value, footer: posterFooter.value || 'Powered by 观演红黑榜',
      results: posterResults.value, maxItems: POSTER_MAX_ITEMS,
    })
    showPosterModal.value = false
  } catch (e: any) { alert('海报生成失败: ' + (e.message || '未知错误')) }
  finally { posterGenerating.value = false }
}

// 分享链接
const linkCopied = ref(false)
function copyShareLink() {
  const params = new URLSearchParams()
  if (filters.value.year !== 'all') params.set('year', String(filters.value.year))
  if (filters.value.category !== 'all') params.set('category', filters.value.category)
  if (filters.value.scale !== DEFAULT_SCALE) params.set('scale', String(filters.value.scale))
  const url = `${window.location.origin}${window.location.pathname}#/rankings`
  const full = params.toString() ? `${url}?${params.toString()}` : url
  navigator.clipboard.writeText(full).then(() => {
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2000)
  }).catch(() => {
    // fallback
    const ta = document.createElement('textarea')
    ta.value = full
    document.body.appendChild(ta)
    ta.select()
    document.execCommand('copy')
    document.body.removeChild(ta)
    linkCopied.value = true
    setTimeout(() => { linkCopied.value = false }, 2000)
  })
}

// 是否从分享链接打开（URL 带有筛选参数）
const isSharedLink = computed(() => {
  const q = route.query
  return !!(q.year || q.category || q.scale)
})
// 生成分享链接标识（用于 Giscus 讨论映射）
const shareTerm = computed(() => {
  const parts: string[] = []
  if (filters.value.year !== 'all') parts.push(String(filters.value.year))
  if (filters.value.category !== 'all') parts.push(filters.value.category)
  return parts.length > 0 ? `ranking-${parts.join('-')}` : 'ranking-all'
})

// Giscus 配置 — 替换为你的仓库信息
const GISCUS_CONFIG = {
  repo: 'YOUR_USERNAME/YOUR_REPO',
  repoId: 'R_kgDOXXXXX',
  category: 'Comments',
  categoryId: 'DIC_kwDOXXXXX',
}

const sortedList = computed(() => [...rankedResults.value].sort((a: any, b: any) => b.cpZ - a.cpZ))

function scrollToSection(id: string) {
  const el = document.getElementById(id)
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }
}
</script>

<template>
  <div class="p-4 md:p-6 space-y-6">
    <BackupReminder ref="backupReminder" />

    <!-- 操作栏 -->
    <div class="flex flex-wrap gap-3">
      <router-link to="/records" class="inline-block bg-black text-white text-xs font-black uppercase tracking-[.15em] px-4 py-2.5 hover:bg-black/80 transition-colors">
        + 添加记录
      </router-link>
      <button class="inline-block border-2 border-black text-black text-xs font-black tracking-[.15em] px-4 py-2.5 hover:bg-black hover:text-white transition-colors"
        :disabled="rankedResults.length === 0" @click="openPosterModal">
        生成海报
      </button>
      <button class="text-xs font-black tracking-[.15em] text-black/40 hover:text-black transition-colors px-2" @click="loadData">
        刷新
      </button>
    </div>

    <!-- 权重面板 -->
    <div class="border-2 border-black/10">
      <button class="w-full flex items-center justify-between px-4 py-3 hover:bg-black/[0.02] transition-colors"
        @click="showWeights = !showWeights">
        <span class="text-xs font-black uppercase tracking-[.15em] text-black/40">
          权重设置 ({{ activeDimensions.length }}个维度)
        </span>
        <span class="text-xs font-black text-black/30">{{ showWeights ? '▲' : '▼' }}</span>
      </button>

      <div v-if="showWeights" class="px-4 pb-4 border-t-2 border-black/10">
        <div class="space-y-1 pt-3">
          <div v-for="dim in dimensions" :key="dim.id"
            class="flex items-center gap-3 py-2"
            :class="{ 'opacity-30': !dim.active }">
            <span class="text-xs font-bold text-black w-24 flex-shrink-0 truncate" :title="'拖滑块调权重，数字越大该维度在总分中占比越高。当前占比：' + getNormPct(dim.key)">{{ dim.name }}</span>
            <input type="range" min="0" max="100" :value="dim.weight"
              class="flex-1 h-1 bg-black/10 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:cursor-pointer"
              @input="dim.id != null && handleWeightChange(dim.id, parseInt(($event.target as HTMLInputElement).value))" />
            <span class="text-[10px] font-black tabular-nums w-9 text-right"
              :class="dim.active ? 'text-black/60' : 'text-black/20'">{{ getNormPct(dim.key) }}</span>
            <button class="text-[10px] font-black uppercase text-black/30 hover:text-black transition-colors"
              @click="dim.id != null && handleToggleDim(dim.id)">
              {{ dim.active ? '开' : '关' }}
            </button>
          </div>
        </div>
        <!-- 价格敏感度 -->
        <div class="border-t-2 border-black/10 pt-3 mt-3">
          <div class="flex items-center gap-3">
            <span class="text-xs font-bold text-black w-24 flex-shrink-0" title="控制价格对排名的影响程度：0=忽略价格只看评分，2=价格主导排名">价格敏感度</span>
            <input type="range" min="0" max="2" step="0.1" :value="priceSensitivity"
              class="flex-1 h-1 bg-black/10 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:cursor-pointer"
              @input="priceSensitivity = parseFloat(($event.target as HTMLInputElement).value); loadData()" />
            <span class="text-[10px] font-black tabular-nums w-9 text-right text-black/60">{{ priceSensitivity.toFixed(1) }}</span>
          </div>
          <p class="text-[10px] font-bold text-black/40 mt-1.5 ml-[6.5rem]">
            <span v-if="priceSensitivity < 0.3">价格几乎不影响排名</span>
            <span v-else-if="priceSensitivity < 0.8">温和：贵但好不至于直接黑榜</span>
            <span v-else-if="priceSensitivity < 1.3">标准：与原版demo一致</span>
            <span v-else>激进：价格主导排名</span>
          </p>
        </div>
        <router-link to="/dimensions" class="text-[10px] font-black uppercase tracking-[.15em] text-black/40 hover:text-black mt-2 inline-block">
          管理维度 →
        </router-link>
      </div>
    </div>

    <!-- 统计概要 -->
    <div v-if="rankedResults.length > 0" class="flex gap-6 text-xs font-black tracking-[.15em]">
      <button style="color:#c0392b" class="font-black hover:opacity-70 transition-opacity" @click="scrollToSection('rank-section-red')">红榜 {{ rankedResults.filter(r => r.rankClass === 'red').length }}</button>
      <button class="text-black/40 hover:text-black transition-colors" @click="scrollToSection('rank-section-grey')">灰榜 {{ rankedResults.filter(r => r.rankClass === 'gray').length }}</button>
      <button class="text-black/60 hover:text-black transition-colors" @click="scrollToSection('rank-section-black')">黑榜 {{ rankedResults.filter(r => r.rankClass === 'black').length }}</button>
      <span class="text-black/20">共 {{ rankedResults.length }} 条</span>
    </div>

    <!-- 筛选器 + 标题 -->
    <div class="flex flex-col sm:flex-row gap-3 justify-between items-start sm:items-center">
      <h2 class="text-xl md:text-2xl font-black text-black tracking-tighter">综合榜单</h2>
      <RankingFilters v-model="filters" />
    </div>

    <!-- 加载中 -->
    <div v-if="computing" class="text-center py-16">
      <p class="text-xs font-black tracking-[.15em] text-black/30">计算中...</p>
    </div>

    <!-- 空 -->
    <template v-else-if="rankedResults.length === 0">
      <div class="text-center py-16">
        <p class="text-4xl font-black text-black/10 tracking-tighter">暂无数据</p>
        <div class="flex items-center gap-2 mt-3 text-[10px] font-bold text-black/30">
          <span class="border-2 border-black/10 px-2 py-1">① 添加评分维度</span>
          <span>→</span>
          <span class="border-2 border-black/10 px-2 py-1">② 添加演出记录</span>
          <span>→</span>
          <span class="border-2 border-black/10 px-2 py-1">③ 回来看排名</span>
        </div>
        <router-link to="/records" class="inline-block mt-6 bg-black text-white text-xs font-black tracking-[.15em] px-4 py-2.5 hover:bg-black/80 transition-colors">
          + 添加记录
        </router-link>
      </div>
    </template>

    <!-- 榜单 -->
    <template v-else>
      <RankChart :results="rankedResults" />
      <RankingList :results="sortedList" :scale="filters.scale" />

      <!-- 评论区（分享链接打开时显示）-->
      <GiscusComments
        v-if="isSharedLink && GISCUS_CONFIG.repo !== 'YOUR_USERNAME/YOUR_REPO'"
        v-bind="GISCUS_CONFIG"
        :term="shareTerm"
      />
    </template>

    <!-- 海报弹窗 -->
    <Teleport to="body">
      <div v-if="showPosterModal" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
        @click.self="showPosterModal = false">
        <div class="bg-white border-2 border-black w-full max-w-sm mx-4 max-h-[90vh] overflow-y-auto">
          <div class="flex items-center justify-between px-5 py-4 border-b-2 border-black/10">
            <h3 class="text-xs font-black tracking-[.15em] text-black/40">分享榜单</h3>
            <button class="text-black/30 hover:text-black text-lg leading-none" @click="showPosterModal = false">✕</button>
          </div>
          <div class="p-5 space-y-4">
            <!-- 红/黑版切换 -->
            <div class="grid grid-cols-2 gap-2">
              <button class="border-2 py-2.5 text-xs font-black tracking-[.15em] text-center transition-colors"
                :class="posterType === 'red' ? 'border-[#c0392b] bg-[#c0392b] text-white' : 'border-black/20 text-black/40 hover:border-black/40'"
                @click="posterType = 'red'">红榜 ({{ rankedResults.filter(r => r.rankClass === 'red').length }})</button>
              <button class="border-2 py-2.5 text-xs font-black tracking-[.15em] text-center transition-colors"
                :class="posterType === 'black' ? 'border-black bg-black text-white' : 'border-black/20 text-black/40 hover:border-black/40'"
                @click="posterType = 'black'">黑榜 ({{ rankedResults.filter(r => r.rankClass === 'black').length }})</button>
            </div>

            <!-- 标题 + 底部文字 -->
            <div>
              <label class="block text-[10px] font-black tracking-[.15em] text-black/40 mb-1.5">标题</label>
              <input v-model="posterTitle" type="text" :placeholder="posterDefaultTitle"
                class="w-full px-0 py-2 text-sm font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
            </div>
            <div>
              <label class="block text-[10px] font-black tracking-[.15em] text-black/40 mb-1.5">底部文字</label>
              <input v-model="posterFooter" type="text" placeholder="Powered by 观演红黑榜"
                class="w-full px-0 py-2 text-sm font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
            </div>

            <!-- 实时预览 -->
            <div class="border-2 border-black/10 p-3 bg-black/[0.01]" ref="posterPreviewRef">
              <p class="text-[10px] font-black text-black/30 tracking-[.15em] mb-2">
                {{ posterTitle || posterDefaultTitle }} · {{ posterSubtitle }} ({{ Math.min(posterResults.length, POSTER_MAX_ITEMS) }}条)
              </p>
              <div v-for="(r, i) in posterResults.slice(0, 8)" :key="r.recordId" class="flex justify-between py-0.5 text-[10px] font-bold">
                <span class="text-black/70">{{ i + 1 }}. {{ r.name }}</span>
                <span class="text-black/40">¥{{ r.price.toFixed(0) }}</span>
              </div>
              <p v-if="posterResults.length > 8" class="text-[10px] font-bold text-black/20 mt-1">...等 {{ posterResults.length }} 条</p>
            </div>

            <!-- 操作按钮 -->
            <div class="grid grid-cols-2 gap-2">
              <button class="py-3 bg-black text-white text-xs font-black tracking-[.15em] hover:bg-black/80 transition-colors disabled:opacity-20"
                :disabled="posterGenerating || posterResults.length === 0" @click="handleGeneratePoster">
                {{ posterGenerating ? '生成中...' : '下载海报' }}
              </button>
              <button class="py-3 border-2 border-black text-black text-xs font-black tracking-[.15em] hover:bg-black hover:text-white transition-colors"
                @click="copyShareLink">
                {{ linkCopied ? '已复制 ✓' : '复制链接' }}
              </button>
            </div>
          </div>
        </div>
      </div>
    </Teleport>
  </div>
</template>
