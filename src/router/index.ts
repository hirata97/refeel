import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

// ページコンポーネントを一元管理
const pages = {
  TopPage: () => import('@/views/TopPage.vue'),
  LoginPage: () => import('@/views/LoginPage.vue'),
  AccountRegisterPage: () => import('@/views/AccountRegisterPage.vue'),
  SettingPage: () => import('@/views/SettingPage.vue'),
  HelpPage: () => import('@/views/HelpPage.vue'),
  DiaryRegisterPage: () => import('@/views/DiaryRegisterPage.vue'),
  DiaryreportPage: () => import('@/views/DiaryReportPage.vue'),
  DiaryViewPage: () => import('@/views/DiaryViewPage.vue'),
  DashBoardPage: () => import('@/views/DashBoardPage.vue'),
}

// ルートの定義を簡略化
const routes = [
  { path: '/', name: 'Top', component: pages.TopPage },
  { path: '/login', name: 'Login', component: pages.LoginPage },
  { path: '/register', name: 'Register', component: pages.AccountRegisterPage },
  { path: '/setting', name: 'Setting', component: pages.SettingPage, meta: { requiresAuth: true } },
  { path: '/help', name: 'Help', component: pages.HelpPage, meta: { requiresAuth: true } },
  {
    path: '/diaryregister',
    name: 'Diaryresister',
    component: pages.DiaryRegisterPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/diaryreport',
    name: 'Diaryreport',
    component: pages.DiaryreportPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/diaryview',
    name: 'Diaryview',
    component: pages.DiaryViewPage,
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
    const authStore = useAuthStore()
    
    // 認証状態をチェック
    if (!authStore.isAuthenticated) {
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
