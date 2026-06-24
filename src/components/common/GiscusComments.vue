<script setup lang="ts">
import { onMounted, ref } from 'vue'

const props = defineProps<{
  repo: string       // e.g. 'username/repo'
  repoId: string     // from Giscus setup
  category: string   // e.g. 'Comments'
  categoryId: string // from Giscus setup
  term: string       // discussion mapping, e.g. a share-link identifier
}>()

const loaded = ref(false)

onMounted(() => {
  // 避免重复加载
  if (document.querySelector('script[data-giscus]')) {
    loaded.value = true
    return
  }
  const script = document.createElement('script')
  script.src = 'https://giscus.app/client.js'
  script.setAttribute('data-repo', props.repo)
  script.setAttribute('data-repo-id', props.repoId)
  script.setAttribute('data-category', props.category)
  script.setAttribute('data-category-id', props.categoryId)
  script.setAttribute('data-mapping', 'specific')
  script.setAttribute('data-term', props.term)
  script.setAttribute('data-reactions-enabled', '1')
  script.setAttribute('data-emit-metadata', '0')
  script.setAttribute('data-input-position', 'bottom')
  script.setAttribute('data-theme', 'light')
  script.setAttribute('data-lang', 'zh-CN')
  script.setAttribute('data-loading', 'lazy')
  script.setAttribute('crossorigin', 'anonymous')
  script.async = true
  script.setAttribute('data-giscus', '')
  script.onload = () => { loaded.value = true }
  document.getElementById('giscus-container')?.appendChild(script)
})
</script>

<template>
  <div class="border-t-2 border-black/10 pt-6 mt-6">
    <h3 class="text-xs font-black tracking-[.15em] text-black/40 mb-4">💬 评论</h3>
    <div v-if="!loaded" class="text-xs font-bold text-black/20 py-4">加载评论区...</div>
    <div id="giscus-container"></div>
    <p class="text-[10px] font-bold text-black/20 mt-2">
      需登录 GitHub 账号发表评论。<br />
      要使用此功能，请先 <a href="https://github.com/apps/giscus" target="_blank" class="underline hover:text-black/40">安装 Giscus App</a> 并配置仓库。
    </p>
  </div>
</template>
