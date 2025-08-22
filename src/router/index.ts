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
  DiaryEditPage: () => import('@/views/DiaryEditPage.vue'),
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
    path: '/diary-register',
    name: 'DiaryRegister',
    component: pages.DiaryRegisterPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/diary-report',
    name: 'DiaryReport',
    component: pages.DiaryreportPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/diary-view',
    name: 'DiaryView',
    component: pages.DiaryViewPage,
    meta: { requiresAuth: true },
  },
  {
    path: '/diary-edit/:id',
    name: 'DiaryEdit',
    component: pages.DiaryEditPage,
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

router.beforeEach(async (to, from, next) => {
  const authStore = useAuthStore()

  // セッション監視を開始（初回のみ）
  if (!authStore.session && typeof authStore.startSessionMonitoring === 'function') {
    authStore.startSessionMonitoring()
  }

  if (to.matched.some((record) => record.meta.requiresAuth)) {
    // 認証が必要なルート

    // セッションの有効性を確認
    if (authStore.session && typeof authStore.validateSession === 'function') {
      const isValid = await authStore.validateSession()
      if (!isValid) {
        // セッションが無効な場合はログインページへリダイレクト
        next({
          path: '/login',
          query: {
            redirect: to.fullPath,
            reason: 'session_expired',
          },
        })
        return
      }
    }

    // 認証状態をチェック
    if (!authStore.isAuthenticated) {
      next({
        path: '/login',
        query: { redirect: to.fullPath },
      })
    } else {
      // 最終活動時間を更新
      if (typeof authStore.updateLastActivity === 'function') {
        authStore.updateLastActivity()
      }
      next()
    }
  } else {
    // 認証不要のルート
    next()
  }
})

export default router
