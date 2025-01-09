import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'

// ページコンポーネントを一元管理
const pages = {
  TopPage: () => import('@/views/TopPage.vue'),
  LoginPage: () => import('@/views/LoginPage.vue'),
  RegisterPage: () => import('@/views/RegisterPage.vue'),
  SettingPage: () => import('@/views/SettingPage.vue'),
  HelpPage: () => import('@/views/HelpPage.vue'),
  ReportPage: () => import('@/views/ReportPage.vue'),
  DiaryViewPage: () => import('@/views/DiaryViewPage.vue'),
  DiaryManagerPage: () => import('@/views/DiaryManagerPage.vue'),
  DashBoardPage: () => import('@/views/DashBoardPage.vue'),
}

// ルートの定義を簡略化
const routes = [
  { path: '/', name: 'Home', component: pages.TopPage },
  { path: '/login', name: 'Login', component: pages.LoginPage },
  { path: '/register', name: 'Register', component: pages.RegisterPage },
  { path: '/setting', name: 'Setting', component: pages.SettingPage, meta: { requiresAuth: true } },
  { path: '/help', name: 'Help', component: pages.HelpPage, meta: { requiresAuth: true } },
  { path: '/report', name: 'Report', component: pages.ReportPage, meta: { requiresAuth: true } },
  { path: '/diary', name: 'Diary', component: pages.DiaryViewPage, meta: { requiresAuth: true } },
  {
    path: '/manager',
    name: 'Manager',
    component: pages.DiaryManagerPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/dashboard',
    name: 'DashBoard',
    component: pages.DashBoardPage,
    meta: { requiresAuth: true },
  },
]

// Vue Routerの設定
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.matched.some((record) => record.meta.requiresAuth)) {
    if (!isAuthenticated()) {
      next({
        path: '/login',
        query: { redirect: to.fullPath }, // 元のページを記憶しておく
      })
    } else {
      next()
    }
  } else {
    next() // 認証不要のルート
  }
})

export default router
