<script setup lang="ts">
import { ref } from 'vue'

interface ToastItem {
  id: number
  message: string
  type: 'success' | 'error' | 'info'
}

const toasts = ref<ToastItem[]>([])
let nextId = 0

function show(message: string, type: 'success' | 'error' | 'info' = 'info', duration = 3000) {
  const id = nextId++
  toasts.value.push({ id, message, type })
  setTimeout(() => {
    toasts.value = toasts.value.filter(t => t.id !== id)
  }, duration)
}

defineExpose({ show })
</script>

<template>
  <Teleport to="body">
    <div class="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      <div
        v-for="t in toasts"
        :key="t.id"
        class="px-4 py-3 border-2 text-xs font-black animate-slide-in"
        :class="{
          'border-black bg-black text-white': t.type === 'success',
          'border-black text-black bg-white': t.type === 'error',
          'border-black/20 bg-white text-black': t.type === 'info',
        }"
      >
        {{ t.message }}
      </div>
    </div>
  </Teleport>
</template>

<style scoped>
@keyframes slide-in {
  from { transform: translateX(100%); opacity: 0; }
  to { transform: translateX(0); opacity: 1; }
}
.animate-slide-in { animation: slide-in 0.25s ease-out; }
</style>
