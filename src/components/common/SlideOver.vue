<script setup lang="ts">
import { watch, ref, onMounted, onUnmounted } from 'vue'
import { X } from '@lucide/vue'

const props = defineProps<{ show: boolean; title: string }>()
const emit = defineEmits<{ close: [] }>()

const visible = ref(false)
const contentRef = ref<HTMLElement | null>(null)

watch(() => props.show, (val) => {
  if (val) {
    visible.value = true
    document.body.style.overflow = 'hidden'
    // 自动聚焦到第一个输入框
    setTimeout(() => {
      const firstInput = contentRef.value?.querySelector('input, textarea, select') as HTMLElement
      firstInput?.focus()
    }, 600)
  } else {
    document.body.style.overflow = ''
    setTimeout(() => { visible.value = false }, 1100)
  }
}, { immediate: true })

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Escape' && props.show) {
    emit('close')
  }
}

onMounted(() => window.addEventListener('keydown', onKeydown))
onUnmounted(() => window.removeEventListener('keydown', onKeydown))
</script>

<template>
  <Teleport to="body">
    <div v-if="visible" class="fixed inset-0 z-50 flex justify-end">
      <!-- 遮罩 -->
      <Transition name="fade">
        <div
          v-if="show"
          class="absolute inset-0 bg-black/40 backdrop-blur-sm"
          @click="emit('close')"
        />
      </Transition>

      <!-- 抽屉面板 -->
      <Transition name="slide">
        <div
          v-if="show"
          class="relative w-full sm:w-[420px] h-full bg-[#fdfcf9] shadow-2xl flex flex-col overflow-hidden"
        >
          <!-- 头部 -->
          <div class="flex items-center justify-between px-5 md:px-7 py-5 border-b-2 border-black/10 flex-shrink-0">
            <h2 class="text-xs font-black uppercase tracking-[.15em] text-black/40">{{ title }}</h2>
            <button
              class="w-8 h-8 flex items-center justify-center text-black/30 hover:text-black transition-colors"
              @click="emit('close')"
            >
              <X :size="20" :stroke-width="2" />
            </button>
          </div>

          <!-- 内容区（可滚动） -->
          <div ref="contentRef" class="flex-1 overflow-y-auto overscroll-contain">
            <slot />
          </div>
        </div>
      </Transition>
    </div>
  </Teleport>
</template>

<style scoped>
/* 遮罩：缓慢均匀淡入 */
.fade-enter-active {
  transition: opacity 0.9s ease-out 0.15s;
}
.fade-leave-active {
  transition: opacity 0.25s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 抽屉面板：极缓滑入，全程轻柔 */
.slide-enter-active {
  transition: transform 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}
.slide-leave-active {
  transition: transform 0.25s cubic-bezier(0.55, 0, 1, 0.45);
}
.slide-enter-from,
.slide-leave-to {
  transform: translateX(105%);
}

/* reduced-motion: 淡入淡出代替滑入滑出 */
@media (prefers-reduced-motion: reduce) {
  .fade-enter-active,
  .fade-leave-active {
    transition: opacity 0.2s ease;
  }
  .slide-enter-active,
  .slide-leave-active {
    transition: opacity 0.2s ease, transform 0s;
  }
  .slide-enter-from,
  .slide-leave-to {
    transform: none;
    opacity: 0;
  }
}
</style>
