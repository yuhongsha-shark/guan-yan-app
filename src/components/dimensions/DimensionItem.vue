<script setup lang="ts">
import type { ScoreDimension } from '@/types/dimension'
import { GripVertical } from '@lucide/vue'

const props = defineProps<{ dimension: ScoreDimension; normalizedPct: string; index: number }>()
const emit = defineEmits<{
  'update:weight': [weight: number]
  toggle: []
  remove: []
  dragstart: [index: number, e: DragEvent]
  dragover: [index: number, e: DragEvent]
  drop: [index: number]
}>()

function onSliderInput(e: Event) { emit('update:weight', parseInt((e.target as HTMLInputElement).value)) }
</script>

<template>
  <div
    class="flex items-center gap-3 py-2.5 group/dim"
    :class="{ 'opacity-30': !dimension.active }"
    draggable="true"
    @dragstart="emit('dragstart', index, $event)"
    @dragover.prevent="emit('dragover', index, $event)"
    @drop.prevent="emit('drop', index)"
  >
    <!-- 拖拽手柄 -->
    <div class="flex-shrink-0 text-black/10 group-hover/dim:text-black/30 transition-colors cursor-grab active:cursor-grabbing">
      <GripVertical :size="14" :stroke-width="2" />
    </div>

    <div class="w-20 flex-shrink-0">
      <p class="text-xs font-black text-black uppercase truncate">{{ dimension.name }}</p>
      <p class="text-[10px] font-bold text-black/30 uppercase">{{ dimension.key }}</p>
    </div>
    <div class="flex-1">
      <input type="range" min="0" max="100" :value="dimension.weight" @input="onSliderInput"
        class="w-full h-1 bg-black/10 appearance-none [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:bg-black [&::-webkit-slider-thumb]:cursor-pointer" />
    </div>
    <span class="text-[10px] font-black tabular-nums w-9 text-right"
      :class="dimension.active ? 'text-black/60' : 'text-black/20'">{{ normalizedPct }}</span>
    <div class="flex gap-1">
      <button class="text-[10px] font-black uppercase px-1.5 py-0.5 border"
        :class="dimension.active ? 'border-black text-black' : 'border-black/20 text-black/20'"
        @click="emit('toggle')">
        {{ dimension.active ? '开' : '关' }}
      </button>
      <button v-if="!dimension.builtIn" class="text-xs font-black text-black/20 hover:text-black transition-colors px-1"
        @click="emit('remove')" title="删除">✕</button>
    </div>
  </div>
</template>
