<script setup lang="ts">
import { ref, onMounted } from 'vue'
import type { RankingFilters } from '@/types/ranking'
import { extractYear } from '@/types/record'
import { db } from '@/db/index'
import { SCALE_OPTIONS } from '@/config/defaults'

const props = defineProps<{
  modelValue: RankingFilters
}>()

const emit = defineEmits<{
  'update:modelValue': [value: RankingFilters]
  change: []
}>()

const years = ref<string[]>([])
const categories = ref<string[]>([])

onMounted(async () => {
  const records = await db.records.toArray()
  const ySet = new Set<string>()
  const cSet = new Set<string>()
  for (const r of records) {
    ySet.add(String(extractYear(r.date)))
    cSet.add(r.category)
  }
  years.value = Array.from(ySet).sort().reverse()
  categories.value = Array.from(cSet).sort()
})

function update(key: keyof RankingFilters, value: string | number) {
  emit('update:modelValue', { ...props.modelValue, [key]: value })
  emit('change')
}
</script>

<template>
  <div class="flex flex-wrap gap-2 items-center">
    <select
      class="text-xs font-black uppercase tracking-[.15em] bg-transparent border-2 border-black/20 px-3 py-2 appearance-none cursor-pointer focus:border-black focus:outline-none transition-colors"
      :value="modelValue.year" @change="update('year', ($event.target as HTMLSelectElement).value)">
      <option value="all">全部年份</option>
      <option v-for="y in years" :key="y" :value="y">{{ y }}</option>
    </select>
    <select
      class="text-xs font-black uppercase tracking-[.15em] bg-transparent border-2 border-black/20 px-3 py-2 appearance-none cursor-pointer focus:border-black focus:outline-none transition-colors"
      :value="modelValue.category" @change="update('category', ($event.target as HTMLSelectElement).value)">
      <option value="all">全部分类</option>
      <option v-for="c in categories" :key="c" :value="c">{{ c }}</option>
    </select>
    <select
      class="text-xs font-black uppercase tracking-[.15em] bg-transparent border-2 border-black/20 px-3 py-2 appearance-none cursor-pointer focus:border-black focus:outline-none transition-colors"
      :value="modelValue.scale" @change="update('scale', Number(($event.target as HTMLSelectElement).value) as 5 | 10 | 100)">
      <option v-for="opt in SCALE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
    </select>
  </div>
</template>
