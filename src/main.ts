import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { seedDefaults } from './db/seeds'
import './assets/styles/main.css'

// 先挂载应用，再异步初始化种子数据（初始化失败不影响应用使用）
const app = createApp(App)
app.use(router)
app.mount('#app')

seedDefaults().catch(err => {
  console.error('种子数据初始化失败:', err)
})
