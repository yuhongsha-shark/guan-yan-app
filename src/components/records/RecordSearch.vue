<script setup lang="ts">
import { ref } from 'vue'
import { Search } from '@lucide/vue'

const emit = defineEmits<{ search: [query: string]; 'update:category': [category: string] }>()
const query = ref(''); const selectedCategory = ref('all')
function onSearchInput(e: Event) { query.value = (e.target as HTMLInputElement).value; emit('search', query.value) }
function onCategoryChange(e: Event) { selectedCategory.value = (e.target as HTMLSelectElement).value; emit('update:category', selectedCategory.value) }
</script>

<template>
  <div class="flex gap-3 items-center">
    <div class="relative flex-1">
      <Search :size="14" :stroke-width="2" class="absolute left-3 top-1/2 -translate-y-1/2 text-black/20" />
      <input type="text" :value="query" @input="onSearchInput" placeholder="搜索名称、场馆..."
        class="w-full text-xs font-bold text-black placeholder:text-black/20 bg-transparent border-2 border-black/20 pl-9 pr-3 py-2 rounded-none focus:border-black focus:outline-none transition-colors" />
    </div>
    <select class="text-xs font-bold text-black bg-transparent border-2 border-black/20 px-3 py-2 appearance-none cursor-pointer focus:border-black focus:outline-none transition-colors" @change="onCategoryChange">
      <option value="all">全部分类</option>
      <option value="Live">Live</option><option value="音乐节">音乐节</option><option value="演唱会">演唱会</option>
      <option value="话剧">话剧</option><option value="音乐剧">音乐剧</option><option value="舞蹈">舞蹈</option><option value="其他">其他</option>
    </select>
  </div>
</template>
