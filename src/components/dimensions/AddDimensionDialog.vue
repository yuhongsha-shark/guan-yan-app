<script setup lang="ts">
import { ref } from 'vue'
const emit = defineEmits<{ add: [name: string, key: string]; close: [] }>()
const name = ref(''); const key = ref(''); const error = ref('')
function handleSubmit() {
  error.value = ''; const n = name.value.trim(); const k = key.value.trim() || toKey(n)
  if (!n) { error.value = '请输入维度名称'; return }
  if (!k) { error.value = '请输入有效的英文键名'; return }
  emit('add', n, k); name.value = ''; key.value = ''
}
function toKey(name: string): string { return name.toLowerCase().replace(/\s+/g, '_').replace(/[^a-z0-9_]/g, '') }
function onNameInput(e: Event) { name.value = (e.target as HTMLInputElement).value; if (!key.value) key.value = toKey(name.value) }
</script>

<template>
  <Teleport to="body">
    <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/40" @click.self="emit('close')">
      <div class="bg-white border-2 border-black w-full max-w-sm mx-4">
        <div class="flex items-center justify-between px-5 py-4 border-b-2 border-black/10">
          <h3 class="text-xs font-black tracking-[.15em] text-black/40">添加维度</h3>
          <button class="text-black/30 hover:text-black text-lg leading-none" @click="emit('close')">✕</button>
        </div>
        <div class="p-5 space-y-4">
          <div>
            <label class="block text-[10px] font-black tracking-[.15em] text-black/40 mb-1.5">名称</label>
            <input v-model="name" @input="onNameInput" type="text" placeholder="如：编曲"
              class="w-full px-0 py-2 text-sm font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
          </div>
          <div>
            <label class="block text-[10px] font-black tracking-[.15em] text-black/40 mb-1.5">键名（英文）</label>
            <input v-model="key" type="text" placeholder="如：arrangement"
              class="w-full px-0 py-2 text-sm font-bold text-black placeholder:text-black/20 bg-transparent border-0 border-b-2 border-black/20 focus:border-black focus:outline-none transition-colors" />
          </div>
          <p v-if="error" class="text-[10px] font-bold text-black/60">{{ error }}</p>
          <div class="flex gap-3 pt-2">
            <button class="flex-1 py-2.5 text-xs font-black tracking-[.15em] text-black/40 hover:text-black transition-colors" @click="emit('close')">取消</button>
            <button class="flex-1 py-2.5 text-xs font-black tracking-[.15em] bg-black text-white hover:bg-black/80 transition-colors" @click="handleSubmit">添加</button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
