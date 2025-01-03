import { createRouter, createWebHistory } from 'vue-router'

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
  { path: '/setting', name: 'Setting', component: pages.SettingPage },
  { path: '/help', name: 'Help', component: pages.HelpPage },
  { path: '/report', name: 'Report', component: pages.ReportPage },
  { path: '/diary', name: 'Diary', component: pages.DiaryViewPage },
  { path: '/manager', name: 'Manager', component: pages.DiaryManagerPage },
  { path: '/dashboard', name: 'DashBoard', component: pages.DashBoardPage },
]

// Vue Routerの設定
const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
})

export default router
