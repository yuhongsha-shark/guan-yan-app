<script setup lang="ts">
defineProps<{
  show: boolean
  title: string
  message: string
  confirmText?: string
  cancelText?: string
}>()

const emit = defineEmits<{
  confirm: []
  cancel: []
}>()
</script>

<template>
  <Teleport to="body">
    <div v-if="show" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      @click.self="emit('cancel')">
      <div class="w-full max-w-sm mx-4 bg-white border-2 border-black">
        <div class="p-5">
          <h3 class="text-xs font-black uppercase tracking-[.15em] text-black/40 mb-3">{{ title }}</h3>
          <p class="text-sm font-bold text-black leading-snug mb-6">{{ message }}</p>
          <div class="flex gap-3">
            <button class="flex-1 py-2.5 text-xs font-black uppercase tracking-[.15em] text-black/40 hover:text-black transition-colors" @click="emit('cancel')">
              {{ cancelText || '取消' }}
            </button>
            <button class="flex-1 py-2.5 text-xs font-black uppercase tracking-[.15em] text-white transition-colors"
              :class="confirmText === '删除' ? 'bg-black hover:bg-black/80' : 'bg-black hover:bg-black/80'"
              @click="emit('confirm')">
              {{ confirmText || '确认' }}
            </button>
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>
