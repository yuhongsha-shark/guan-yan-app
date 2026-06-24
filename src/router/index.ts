import { createRouter, createWebHashHistory } from 'vue-router'
import type { RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    redirect: '/rankings',
  },
  {
    path: '/rankings',
    name: 'rankings',
    component: () => import('@/views/RankingsView.vue'),
    meta: { title: '红黑榜单', icon: 'trophy', tab: 0 },
  },
  {
    path: '/records',
    name: 'records',
    component: () => import('@/views/RecordsView.vue'),
    meta: { title: '演出记录', icon: 'list-music', tab: 1 },
  },
  {
    path: '/records/new',
    name: 'record-create',
    component: () => import('@/views/RecordEditView.vue'),
    meta: { title: '添加记录', parent: 'records' },
  },
  {
    path: '/records/:id',
    name: 'record-edit',
    component: () => import('@/views/RecordEditView.vue'),
    meta: { title: '编辑记录', parent: 'records' },
  },
  {
    path: '/dimensions',
    name: 'dimensions',
    component: () => import('@/views/DimensionsView.vue'),
    meta: { title: '评分维度', icon: 'sliders-horizontal', tab: 2 },
  },
  {
    path: '/poster',
    name: 'poster',
    component: () => import('@/views/PosterConfigView.vue'),
    meta: { title: '海报生成', icon: 'image', tab: 2 },
  },
  {
    path: '/backup',
    name: 'backup',
    component: () => import('@/views/BackupView.vue'),
    meta: { title: '数据备份', icon: 'download', tab: 2 },
  },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

export default router
