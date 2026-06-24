<script setup lang="ts">
import { ref } from 'vue'
import { BACKUP_REMINDER_DAYS } from '@/config/constants'
import { db } from '@/db/index'

const visible = ref(false)

async function checkBackup() {
  const setting = await db.settings.get('lastBackupDate')
  if (!setting) { visible.value = true; return }
  const lastBackup = new Date(setting.value as string)
  const daysSince = (Date.now() - lastBackup.getTime()) / (1000 * 60 * 60 * 24)
  visible.value = daysSince > BACKUP_REMINDER_DAYS
}

function dismiss() {
  visible.value = false
}

defineExpose({ checkBackup })
</script>

<template>
  <div
    v-if="visible"
    class="border-2 border-black/20 p-3 flex items-center justify-between gap-3 bg-black/[0.02]"
  >
    <span class="text-xs font-bold text-black/60 uppercase tracking-[.15em]">⚠ 超过 {{ BACKUP_REMINDER_DAYS }} 天未备份，建议导出数据</span>
    <div class="flex gap-2 flex-shrink-0">
      <router-link to="/backup" class="text-[10px] font-black uppercase tracking-[.15em] bg-black text-white px-3 py-1.5 hover:bg-black/80 transition-colors">BACKUP</router-link>
      <button class="text-xs font-black text-black/30 hover:text-black transition-colors" @click="dismiss">✕</button>
    </div>
  </div>
</template>
