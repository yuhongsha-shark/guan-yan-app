<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  label: string
  modelValue: number | null
  disabled?: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: number | null]
}>()

// 内部 0-100 映射为 0-5 星（0.5 步进）
const currentStars = computed(() => {
  if (props.modelValue == null) return 0
  return Math.round(props.modelValue / 10) / 2
})

const displayText = computed(() => {
  if (props.modelValue == null) return '—'
  return currentStars.value.toFixed(1)
})

// 生成 5 颗星的数据：[1, 2, 3, 4, 5]
const STARS = [1, 2, 3, 4, 5]

function setRating(star: number, half: boolean) {
  const value = half ? star - 0.5 : star
  emit('update:modelValue', Math.round(value * 20))
}

function clearRating() {
  emit('update:modelValue', null)
}

// 每颗星的填充状态: 'full' | 'half' | 'empty'
function starState(star: number): 'full' | 'half' | 'empty' {
  if (currentStars.value >= star) return 'full'
  if (currentStars.value >= star - 0.5) return 'half'
  return 'empty'
}
</script>

<template>
  <div class="flex items-center gap-3 py-1.5">
    <label class="text-xs font-black uppercase tracking-[.15em] text-black/40 w-20 flex-shrink-0 truncate">
      {{ label }}
    </label>

    <!-- 5 颗星 -->
    <div class="flex items-center gap-0.5">
      <div
        v-for="star in STARS"
        :key="star"
        class="relative w-7 h-7 flex items-center justify-center"
        :class="disabled ? '' : 'group/star'"
        :title="star + ' 星'"
      >
        <!-- 视觉星星：底层灰星 + 上层金星（半星时裁剪左半） -->
        <span class="relative text-xl leading-none select-none pointer-events-none transition-transform duration-150"
          :class="[!disabled ? 'group-hover/star:scale-110' : '']">
          <!-- 底层：空星（始终灰色） -->
          <span class="text-black/[0.12]">★</span>
          <!-- 上层：金星，根据状态裁剪 -->
          <span
            class="absolute inset-0 overflow-hidden"
            style="color: oklch(0.86 0.17 105)"
            :style="{
              width: starState(star) === 'full' ? '100%' : starState(star) === 'half' ? '50%' : '0%',
            }"
          >★</span>
        </span>

        <!-- 左半点击区（半星） -->
        <button
          v-if="!disabled"
          type="button"
          class="absolute inset-y-0 left-0 w-1/2 bg-transparent cursor-pointer z-10"
          @click="setRating(star, true)"
          :title="(star - 0.5) + ' 星'"
        />
        <!-- 右半点击区（满星） -->
        <button
          v-if="!disabled"
          type="button"
          class="absolute inset-y-0 right-0 w-1/2 bg-transparent cursor-pointer z-10"
          @click="setRating(star, false)"
          :title="star + ' 星'"
        />
      </div>
    </div>

    <!-- 分数文字 -->
    <span
      class="text-xs font-black tabular-nums min-w-[2rem]"
      :class="currentStars > 0 ? 'text-black/60' : 'text-black/20'"
    >
      {{ displayText }}
    </span>

    <!-- 清除 -->
    <button
      v-if="modelValue != null && !disabled"
      type="button"
      class="text-xs font-black text-black/20 hover:text-black/60 transition-colors leading-none"
      @click="clearRating"
      title="清除"
    >✕</button>
  </div>
</template>
