<script setup lang="ts">
import { ref, watch, onMounted, onUnmounted } from 'vue'
import type { RankedResult } from '@/types/ranking'
import {
  Chart,
  ScatterController,
  LinearScale,
  PointElement,
  Tooltip,
  Legend,
  Title,
  type ChartConfiguration,
  type TooltipItem,
} from 'chart.js'

Chart.register(ScatterController, LinearScale, PointElement, Tooltip, Legend, Title)

const props = defineProps<{
  results: RankedResult[]
}>()

const emit = defineEmits<{
  'select-record': [recordId: number]
}>()

const canvasRef = ref<HTMLCanvasElement | null>(null)
let chartInstance: Chart | null = null

// 为每个数据点附上记录引用，方便 tooltip 直接取
interface ScatterPoint {
  x: number
  y: number
  record: RankedResult
}

function isDark() {
  return document.documentElement.classList.contains('dark')
}

function buildConfig(): ChartConfiguration<'scatter'> {
  const dark = isDark()
  const gridColor = dark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'
  const textColor = dark ? '#999' : '#666'
  const colors = {
    red: dark ? '#ef4444' : '#c0392b',
    grey: dark ? '#f3f4f6' : '#9ca3af',
    black: dark ? '#999' : '#1f1f1f',
  }

  const rankOrder = ['red', 'grey', 'black'] as const
  const labels = { red: '红榜', grey: '灰榜', black: '黑榜' }

  const datasets = rankOrder.map(rank => {
    const points: ScatterPoint[] = props.results
      .filter(r => r.rankClass === rank)
      .map(r => ({ x: r.price, y: r.mappedScore, record: r }))

    return {
      label: labels[rank],
      data: points,
      backgroundColor: colors[rank],
      borderColor: (dark ? '#fff' : colors[rank]),
      borderWidth: dark ? 1 : 0,
      pointRadius: rank === 'grey' ? 6 : 6,
      pointHoverRadius: 10,
      pointHoverBorderWidth: 2,
      pointHoverBorderColor: dark ? '#fff' : '#000',
    }
  }).filter(d => d.data.length > 0)

  return {
    type: 'scatter',
    data: { datasets },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'nearest',
        intersect: true,
      },
      onClick(_event, elements) {
        if (elements.length > 0) {
          const el = elements[0]
          const dataset = datasets[el.datasetIndex]
          const point = dataset?.data[el.index] as ScatterPoint | undefined
          if (point?.record?.recordId != null) {
            const sectionId = 'rank-card-' + point.record.recordId
            document.getElementById(sectionId)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }
        }
      },
      plugins: {
        legend: {
          position: 'top' as const,
          labels: {
            usePointStyle: true,
            padding: 20,
            color: textColor,
            font: { family: 'system-ui', weight: 'bold', size: 11 },
          },
        },
        tooltip: {
          backgroundColor: '#000',
          titleColor: '#fff',
          bodyColor: '#fff',
          bodyFont: { family: 'system-ui', weight: 'bold', size: 12 },
          titleFont: { family: 'system-ui', weight: 'bold', size: 13 },
          padding: 12,
          cornerRadius: 0,
          displayColors: false,
          callbacks: {
            title(items: TooltipItem<'scatter'>[]) {
              const p = items[0]?.raw as ScatterPoint | undefined
              return p?.record?.name ?? ''
            },
            label(item: TooltipItem<'scatter'>) {
              const p = item.raw as ScatterPoint | undefined
              if (!p) return ''
              return `¥${p.record.price.toFixed(0)} · ${p.record.mappedScore.toFixed(1)} 分`
            },
          },
        },
      },
      scales: {
        x: {
          ticks: { callback: (v) => '¥' + v, color: textColor },
          grid: { color: gridColor },
        },
        y: {
          ticks: { color: textColor },
          grid: { color: gridColor },
        },
      },
    },
  }
}

function render() {
  if (!canvasRef.value) return
  chartInstance?.destroy()
  chartInstance = new Chart(canvasRef.value, buildConfig())
}

watch(() => props.results, render, { deep: true })
onMounted(render)
onUnmounted(() => chartInstance?.destroy())
</script>

<template>
  <div class="bg-white border-2 border-black/10 p-4 pb-8" style="height:370px">
    <canvas ref="canvasRef" class="h-full"></canvas>
    <p class="text-[10px] font-black text-black/20 tracking-[.15em] mt-3 text-center">点击散点跳转到对应记录 · 点击图例筛选类别</p>
  </div>
</template>
