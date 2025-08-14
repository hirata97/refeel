# Issue #16: 認証チェックのミドルウェア化

## 概要
認証チェックロジックを各ページに分散させる代わりに、Vue Router のナビゲーションガードを活用します。

ts
コードをコピーする
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'

const routes = [
  { path: '/login', component: () => import('@/views/LoginPage.vue') },
  { 
    path: '/dashboard',
    component: () => import('@/views/DashboardPage.vue'),
    meta: { requiresAuth: true },
  },
  // 他のルート
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router

## ラベル
refactor

## 実装タスク
- [ ] Issue内容の詳細確認
- [ ] 必要なファイルの特定
- [ ] 実装方針の決定
- [ ] コード実装
- [ ] テスト実行
- [ ] 動作確認

## 実行コマンド例
```bash
# Issue作業開始
npm run start-issue 16

# 作業完了後PR作成  
npm run create-pr "fix: Issue #16 認証チェックのミドルウェア化" "Issue #16の対応

Closes #16"
```

## Claude Code用プロンプト
```
Issue #16の対応をお願いします。

タイトル: 認証チェックのミドルウェア化
ラベル: refactor

内容:
認証チェックロジックを各ページに分散させる代わりに、Vue Router のナビゲーションガードを活用します。

ts
コードをコピーする
// src/router/index.ts
import { createRouter, createWebHistory } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'

const routes = [
  { path: '/login', component: () => import('@/views/LoginPage.vue') },
  { 
    path: '/dashboard',
    component: () => import('@/views/DashboardPage.vue'),
    meta: { requiresAuth: true },
  },
  // 他のルート
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

router.beforeEach((to, from, next) => {
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next({ path: '/login', query: { redirect: to.fullPath } })
  } else {
    next()
  }
})

export default router
```

---
Generated: 2025-08-14 23:01:36
Source: https://github.com/RsPYP/GoalCategorizationDiary/issues/16
