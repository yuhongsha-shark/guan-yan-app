<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useRecords } from '@/composables/useRecords'
import { CheckCircle, List, Trophy, ArrowLeft } from '@lucide/vue'
import RecordForm from '@/components/records/RecordForm.vue'
import type { PerformanceRecord, CreateRecordInput } from '@/types/record'

const route = useRoute(); const router = useRouter()
const { getById, create, update } = useRecords()
const record = ref<PerformanceRecord | null>(null); const loading = ref(true)
const isNew = computed(() => !route.params.id); const submitted = ref(false)

onMounted(async () => {
  const id = route.params.id
  if (id && id !== 'new') { const f = await getById(Number(id)); if (f) record.value = f; else { router.replace('/records'); return } }
  loading.value = false
})

async function handleSubmit(data: CreateRecordInput) {
  if (record.value?.id != null) await update(record.value.id, data); else await create(data)
  submitted.value = true
}
function handleCancel() { router.back() }
</script>

<template>
  <div>
    <div v-if="submitted" class="flex flex-col items-center justify-center py-16 px-6 text-center max-w-sm mx-auto">
      <CheckCircle :size="48" :stroke-width="2" class="text-black mb-5" />
      <h2 class="text-2xl font-black text-black tracking-tighter mb-1.5">{{ isNew ? '添加成功！' : '保存成功！' }}</h2>
      <p class="text-xs font-bold text-black/40 mb-8">记录已保存，现在可以查看排名了</p>
      <div class="flex gap-3">
        <button class="border-2 border-black text-black text-xs font-black tracking-[.15em] px-4 py-2.5 hover:bg-black hover:text-white transition-colors" @click="router.push('/records')">
          返回记录
        </button>
        <button class="bg-black text-white text-xs font-black tracking-[.15em] px-4 py-2.5 hover:bg-black/80 transition-colors" @click="router.push('/rankings')">
          查看红黑榜
        </button>
      </div>
    </div>

    <template v-else>
      <div v-if="loading" class="p-8 text-center text-xs font-bold text-black/30">加载中...</div>
      <RecordForm v-else :record="record" @submit="handleSubmit" @cancel="handleCancel" />
    </template>
  </div>
</template>
