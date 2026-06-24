<script setup lang="ts">
import { ref } from 'vue'

const showPrompt = ref(false)

// 监听PWA安装事件
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault()
  showPrompt.value = true
  // 存储事件以便后续触发
  ;(window as any).__pwaInstallEvent = e
})

function install() {
  const e = (window as any).__pwaInstallEvent
  if (e) {
    e.prompt()
    e.userChoice.then(() => { showPrompt.value = false })
  }
}

function dismiss() {
  showPrompt.value = false
}
</script>

<template>
  <div
    v-if="showPrompt"
    class="fixed bottom-20 left-4 right-4 md:left-auto md:right-4 md:w-80 bg-white rounded-xl shadow-xl border border-gray-200 p-4 z-50"
  >
    <div class="flex items-center gap-3 mb-3">
      <span class="text-2xl">📱</span>
      <div>
        <p class="font-semibold text-sm text-gray-900">添加到主屏幕</p>
        <p class="text-xs text-gray-400">快速访问观演红黑榜</p>
      </div>
    </div>
    <div class="flex gap-2">
      <button class="btn btn-primary btn-sm flex-1" @click="install">安装</button>
      <button class="btn btn-ghost btn-sm" @click="dismiss">暂不</button>
    </div>
  </div>
</template>
