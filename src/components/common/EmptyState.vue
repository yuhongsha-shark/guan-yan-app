<script setup lang="ts">
defineProps<{
  icon?: any
  title: string
  description?: string
}>()
</script>

<template>
  <div class="flex flex-col items-center justify-center py-20 px-6 text-center">
    <component v-if="icon" :is="icon" :size="40" :stroke-width="1.5" class="text-black/10 mb-5" />
    <h3 class="text-2xl font-black text-black/15 tracking-tighter mb-2">{{ title }}</h3>
    <p v-if="description" class="text-xs font-bold text-black/30 max-w-xs">{{ description }}</p>
    <div class="mt-5"><slot /></div>
  </div>
</template>
