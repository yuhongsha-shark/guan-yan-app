<script setup lang="ts">
import type { CustomField } from '@/types/record'

const props = defineProps<{ modelValue: CustomField[] }>()
const emit = defineEmits<{ 'update:modelValue': [value: CustomField[]] }>()

function addField() { emit('update:modelValue', [...props.modelValue, { key: '', value: '' }]) }
function removeField(index: number) { const u = [...props.modelValue]; u.splice(index, 1); emit('update:modelValue', u) }
function updateKey(index: number, key: string) { const u = [...props.modelValue]; u[index] = { ...u[index], key }; emit('update:modelValue', u) }
function updateValue(index: number, value: string) { const u = [...props.modelValue]; u[index] = { ...u[index], value: isNaN(Number(value)) ? value : Number(value) }; emit('update:modelValue', u) }
</script>

<template>
  <div>
    <div class="flex items-center justify-between mb-2">
      <label class="text-[10px] font-black tracking-[.15em] text-black/40">自定义字段</label>
      <button type="button" class="text-[10px] font-black tracking-[.15em] text-black/40 hover:text-black transition-colors" @click="addField">
        + 添加
      </button>
    </div>
    <div v-if="modelValue.length === 0" class="text-[10px] font-bold text-black/20 py-2">暂无自定义字段</div>
    <div v-for="(field, i) in modelValue" :key="i" class="flex gap-2 mb-2">
      <input type="text" :value="field.key" @input="updateKey(i, ($event.target as HTMLInputElement).value)" placeholder="字段名"
        class="flex-1 px-0 py-1.5 text-xs font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
      <input type="text" :value="field.value" @input="updateValue(i, ($event.target as HTMLInputElement).value)" placeholder="值"
        class="flex-1 px-0 py-1.5 text-xs font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
      <button type="button" class="text-xs font-black text-black/20 hover:text-black transition-colors px-1" @click="removeField(i)">✕</button>
    </div>
  </div>
</template>
