<script setup lang="ts">
import { ref } from 'vue'
import type { ScoreDimension } from '@/types/dimension'
import DimensionItem from './DimensionItem.vue'

const props = defineProps<{
  dimensions: ScoreDimension[]
  normalizedWeights: Record<string, number>
}>()

const emit = defineEmits<{
  'update:weight': [id: number, weight: number]
  toggle: [id: number]
  remove: [id: number]
  reorder: [fromIndex: number, toIndex: number]
}>()

const dragIndex = ref<number | null>(null)

function getPct(key: string): string {
  const w = props.normalizedWeights[key]
  if (w == null) return '0%'
  return (w * 100).toFixed(0) + '%'
}

function onDragStart(idx: number, e: DragEvent) {
  dragIndex.value = idx
  if (e.dataTransfer) {
    e.dataTransfer.effectAllowed = 'move'
    e.dataTransfer.setData('text/plain', String(idx))
  }
}

function onDragOver(idx: number, e: DragEvent) {
  if (dragIndex.value == null || dragIndex.value === idx) return
  e.dataTransfer!.dropEffect = 'move'
}

function onDrop(idx: number) {
  if (dragIndex.value != null && dragIndex.value !== idx) {
    emit('reorder', dragIndex.value, idx)
  }
  dragIndex.value = null
}
</script>

<template>
  <div class="space-y-1">
    <DimensionItem
      v-for="(dim, i) in dimensions"
      :key="dim.id"
      :dimension="dim"
      :index="i"
      :normalized-pct="getPct(dim.key)"
      @update:weight="dim.id != null && emit('update:weight', dim.id, $event)"
      @toggle="dim.id != null && emit('toggle', dim.id)"
      @remove="dim.id != null && emit('remove', dim.id)"
      @dragstart="onDragStart"
      @dragover="onDragOver"
      @drop="onDrop"
    />
  </div>
</template>
