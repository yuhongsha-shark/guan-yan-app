<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useDimensions } from '@/composables/useDimensions'
import DimensionList from '@/components/dimensions/DimensionList.vue'
import AddDimensionDialog from '@/components/dimensions/AddDimensionDialog.vue'
import ConfirmDialog from '@/components/common/ConfirmDialog.vue'

const { dimensions, normalizedWeights, fetchAll, create, update, remove, toggleActive, setWeight } = useDimensions()
const showAddDialog = ref(false)
const deleteTargetId = ref<number | null>(null)

// 撤销删除
const undoDim = ref<{ name: string; key: string; weight: number; active: boolean; order: number } | null>(null)
const undoDimTimer = ref<ReturnType<typeof setTimeout> | null>(null)

onMounted(async () => { await fetchAll() })

async function handleWeightChange(id: number, weight: number) { await setWeight(id, weight); await fetchAll() }
async function handleToggle(id: number) { await toggleActive(id); await fetchAll() }
async function handleReorder(fromIdx: number, toIdx: number) {
  const items = [...dimensions.value].sort((a, b) => a.order - b.order)
  const [moved] = items.splice(fromIdx, 1)
  items.splice(toIdx, 0, moved)
  for (let i = 0; i < items.length; i++) {
    if (items[i].id != null && items[i].order !== i) {
      await update(items[i].id!, { order: i })
    }
  }
  await fetchAll()
}
async function handleRemoveRequest(id: number) { deleteTargetId.value = id }
async function handleRemoveConfirm() {
  if (deleteTargetId.value != null) {
    const dim = dimensions.value.find(d => d.id === deleteTargetId.value)
    if (dim) {
      undoDim.value = { name: dim.name, key: dim.key, weight: dim.weight, active: dim.active, order: dim.order }
      undoDimTimer.value = setTimeout(() => { undoDim.value = null }, 5000)
    }
    await remove(deleteTargetId.value)
    await fetchAll()
  }
  deleteTargetId.value = null
}
async function undoDimDelete() {
  if (undoDim.value) {
    await create({ ...undoDim.value, builtIn: false })
    await fetchAll()
    if (undoDimTimer.value) clearTimeout(undoDimTimer.value)
    undoDim.value = null
  }
}
async function handleAdd(name: string, key: string) {
  const maxOrder = dimensions.value.reduce((max, d) => Math.max(max, d.order), 0)
  await create({ name, key, weight: 50, active: true, builtIn: false, order: maxOrder + 1 })
  await fetchAll(); showAddDialog.value = false
}
</script>

<template>
  <div class="p-4 md:p-6">
    <!-- 撤销提示 -->
    <Transition name="fade">
      <div v-if="undoDim" class="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-3 bg-black text-white px-4 py-2.5 shadow-lg">
        <span class="text-xs font-bold">已删除维度「{{ undoDim.name }}」</span>
        <button class="text-xs font-black tracking-[.15em] text-[#facc15] hover:text-white transition-colors" @click="undoDimDelete">撤销</button>
        <button class="text-xs text-white/40 hover:text-white transition-colors ml-1" @click="undoDim = null">✕</button>
      </div>
    </Transition>

    <div class="flex items-center justify-between mb-6">
      <div>
        <h2 class="text-xl md:text-2xl font-black text-black tracking-tighter">评分维度</h2>
        <p class="text-xs font-bold text-black/40 mt-1.5 tracking-[.15em]">权重数值越大 → 该维度对排名影响越大 · 停用则不参与计算 · <span title="所有维度的权重会自动换算成百分比，加起来永远是100%">自动归一化</span></p>
      </div>
      <button class="bg-black text-white text-xs font-black uppercase tracking-[.15em] px-4 py-2.5 hover:bg-black/80 transition-colors" @click="showAddDialog = true">
        + 添加维度
      </button>
    </div>

    <div v-if="dimensions.length > 0" class="border-2 border-black/10 p-4">
      <DimensionList :dimensions="dimensions" :normalized-weights="normalizedWeights"
        @update:weight="handleWeightChange" @toggle="handleToggle" @remove="handleRemoveRequest" @reorder="handleReorder" />
    </div>

    <div v-else class="text-center py-16">
      <p class="text-4xl font-black text-black/10 uppercase tracking-tighter">NO DATA</p>
      <p class="text-xs font-bold text-black/30 mt-2 uppercase tracking-[.15em]">请添加至少一个维度</p>
    </div>

    <AddDimensionDialog v-if="showAddDialog" @add="handleAdd" @close="showAddDialog = false" />

    <ConfirmDialog :show="deleteTargetId != null" title="删除维度"
      message="确定要删除此维度吗？已有记录中对应的评分数据将保留（但不再参与排名计算）。"
      confirm-text="删除" @confirm="handleRemoveConfirm" @cancel="deleteTargetId = null" />
  </div>
</template>

<style scoped>
.fade-enter-active { transition: opacity 0.3s ease; }
.fade-leave-active { transition: opacity 0.2s ease; }
.fade-enter-from,
.fade-leave-to { opacity: 0; }
</style>
