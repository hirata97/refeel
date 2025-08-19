<template>
  <div class="security-settings-page">
    <v-container fluid class="pa-4">
      <!-- ページヘッダー -->
      <div class="d-flex align-center mb-6">
        <v-icon size="32" class="me-3 text-primary">mdi-shield-account</v-icon>
        <div>
          <h1 class="text-h4 font-weight-bold">セキュリティ設定</h1>
          <p class="text-body-1 text-medium-emphasis ma-0">
            アカウントのセキュリティを管理して、大切なデータを保護しましょう
          </p>
        </div>
      </div>

      <!-- セキュリティ概要 -->
      <v-row class="mb-6">
        <v-col cols="12">
          <v-card class="security-overview-card">
            <v-card-text class="pa-4">
              <div class="d-flex align-center mb-3">
                <v-icon class="me-2">mdi-shield-check</v-icon>
                <span class="text-h6">セキュリティスコア</span>
                <v-spacer />
                <v-chip 
                  :color="getSecurityScoreColor(securityScore)"
                  :prepend-icon="getSecurityScoreIcon(securityScore)"
                >
                  {{ securityScore }}%
                </v-chip>
              </div>

              <v-progress-linear
                :model-value="securityScore"
                :color="getSecurityScoreColor(securityScore)"
                height="8"
                rounded
                class="mb-4"
              />

              <v-row density="compact">
                <v-col cols="12" sm="3">
                  <div class="text-center">
                    <v-icon 
                      size="24" 
                      :color="authStore.is2FAEnabled ? 'success' : 'warning'"
                    >
                      {{ authStore.is2FAEnabled ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                    </v-icon>
                    <div class="text-body-2 mt-1">2要素認証</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="3">
                  <div class="text-center">
                    <v-icon 
                      size="24" 
                      :color="hasStrongPassword ? 'success' : 'warning'"
                    >
                      {{ hasStrongPassword ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                    </v-icon>
                    <div class="text-body-2 mt-1">強固なパスワード</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="3">
                  <div class="text-center">
                    <v-icon 
                      size="24" 
                      :color="activeSessions <= 2 ? 'success' : 'warning'"
                    >
                      {{ activeSessions <= 2 ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                    </v-icon>
                    <div class="text-body-2 mt-1">セッション管理</div>
                  </div>
                </v-col>
                <v-col cols="12" sm="3">
                  <div class="text-center">
                    <v-icon 
                      size="24" 
                      :color="pendingAlerts === 0 ? 'success' : 'warning'"
                    >
                      {{ pendingAlerts === 0 ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                    </v-icon>
                    <div class="text-body-2 mt-1">セキュリティアラート</div>
                  </div>
                </v-col>
              </v-row>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- セキュリティ設定タブ -->
      <v-tabs v-model="activeTab" class="mb-4" color="primary">
        <v-tab value="password">
          <v-icon class="me-2">mdi-lock</v-icon>
          パスワード
        </v-tab>
        <v-tab value="2fa">
          <v-icon class="me-2">mdi-shield-key</v-icon>
          2要素認証
        </v-tab>
        <v-tab value="sessions">
          <v-icon class="me-2">mdi-monitor-multiple</v-icon>
          セッション
        </v-tab>
        <v-tab value="audit" :disabled="!isAdvancedUser">
          <v-icon class="me-2">mdi-file-document-outline</v-icon>
          監査ログ
        </v-tab>
      </v-tabs>

      <v-card>
        <v-tabs-window v-model="activeTab">
          <!-- パスワード設定 -->
          <v-tabs-window-item value="password">
            <PasswordChange />
          </v-tabs-window-item>

          <!-- 2FA設定 -->
          <v-tabs-window-item value="2fa">
            <TwoFactorManagement />
          </v-tabs-window-item>

          <!-- セッション管理 -->
          <v-tabs-window-item value="sessions">
            <SessionManagement />
          </v-tabs-window-item>

          <!-- 監査ログ（上級ユーザー向け） -->
          <v-tabs-window-item value="audit">
            <AuditLogViewer />
          </v-tabs-window-item>
        </v-tabs-window>
      </v-card>

      <!-- セキュリティ推奨事項 -->
      <v-row class="mt-6">
        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2 text-info">mdi-lightbulb</v-icon>
              セキュリティ推奨事項
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-list density="compact" class="bg-transparent">
                <v-list-item
                  v-for="recommendation in securityRecommendations"
                  :key="recommendation.id"
                  :class="recommendation.completed ? 'text-success' : ''"
                >
                  <template v-slot:prepend>
                    <v-icon 
                      :color="recommendation.completed ? 'success' : 'warning'"
                      size="20"
                    >
                      {{ recommendation.completed ? 'mdi-check-circle' : 'mdi-alert-circle' }}
                    </v-icon>
                  </template>
                  
                  <v-list-item-title class="text-body-2">
                    {{ recommendation.title }}
                  </v-list-item-title>
                  
                  <v-list-item-subtitle v-if="!recommendation.completed">
                    {{ recommendation.description }}
                  </v-list-item-subtitle>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>

        <v-col cols="12" md="6">
          <v-card>
            <v-card-title class="d-flex align-center">
              <v-icon class="me-2 text-warning">mdi-alert</v-icon>
              最近のセキュリティアクティビティ
            </v-card-title>
            <v-divider />
            <v-card-text>
              <v-list density="compact" class="bg-transparent">
                <v-list-item
                  v-for="activity in recentActivities"
                  :key="activity.id"
                >
                  <template v-slot:prepend>
                    <v-avatar size="24" :color="getActivityColor(activity.type)">
                      <v-icon size="16" color="white">
                        {{ getActivityIcon(activity.type) }}
                      </v-icon>
                    </v-avatar>
                  </template>
                  
                  <v-list-item-title class="text-body-2">
                    {{ activity.description }}
                  </v-list-item-title>
                  
                  <v-list-item-subtitle>
                    {{ formatDateTime(activity.timestamp) }}
                  </v-list-item-subtitle>
                </v-list-item>

                <v-list-item v-if="recentActivities.length === 0">
                  <v-list-item-title class="text-center text-medium-emphasis">
                    最近のアクティビティはありません
                  </v-list-item-title>
                </v-list-item>
              </v-list>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-container>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import PasswordChange from '@/components/security/PasswordChange.vue'
import TwoFactorManagement from '@/components/security/TwoFactorManagement.vue'
import SessionManagement from '@/components/security/SessionManagement.vue'
// import AuditLogViewer from '@/components/security/AuditLogViewer.vue'

// State
const authStore = useAuthStore()
const activeTab = ref('password')
const isAdvancedUser = ref(false) // 将来的に管理者権限で制御

// Computed
const securityScore = computed(() => {
  let score = 50 // ベーススコア
  
  if (authStore.is2FAEnabled) score += 30
  if (hasStrongPassword.value) score += 20
  
  return Math.min(100, score)
})

const hasStrongPassword = computed(() => {
  // 実際の実装では最後のパスワード強度をチェック
  return true // プレースホルダー
})

const activeSessions = computed(() => {
  return authStore.getActiveSessions().length
})

const pendingAlerts = computed(() => {
  return authStore.securityStats?.pendingAlerts || 0
})

const securityRecommendations = computed(() => [
  {
    id: 1,
    title: '2要素認証を有効にする',
    description: 'アカウントのセキュリティを大幅に向上させます',
    completed: authStore.is2FAEnabled
  },
  {
    id: 2,
    title: '強固なパスワードを設定する',
    description: '12文字以上の複雑なパスワードを使用してください',
    completed: hasStrongPassword.value
  },
  {
    id: 3,
    title: 'セッションを管理する',
    description: '不要なセッションは定期的に終了してください',
    completed: activeSessions.value <= 2
  },
  {
    id: 4,
    title: 'セキュリティアラートを確認する',
    description: '未解決のアラートを確認・対処してください',
    completed: pendingAlerts.value === 0
  }
])

const recentActivities = ref([
  {
    id: 1,
    type: 'login',
    description: 'ログインしました',
    timestamp: new Date(Date.now() - 30 * 60 * 1000) // 30分前
  },
  {
    id: 2,
    type: 'password',
    description: 'パスワードを変更しました',
    timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000) // 2日前
  },
  {
    id: 3,
    type: '2fa',
    description: '2要素認証を有効にしました',
    timestamp: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 1週間前
  }
])

// Methods
const getSecurityScoreColor = (score: number): string => {
  if (score >= 80) return 'success'
  if (score >= 60) return 'info'
  if (score >= 40) return 'warning'
  return 'error'
}

const getSecurityScoreIcon = (score: number): string => {
  if (score >= 80) return 'mdi-shield-check'
  if (score >= 60) return 'mdi-shield'
  if (score >= 40) return 'mdi-shield-alert'
  return 'mdi-shield-off'
}

const getActivityColor = (type: string): string => {
  switch (type) {
    case 'login': return 'info'
    case 'password': return 'warning'
    case '2fa': return 'success'
    case 'security': return 'error'
    default: return 'grey'
  }
}

const getActivityIcon = (type: string): string => {
  switch (type) {
    case 'login': return 'mdi-login'
    case 'password': return 'mdi-lock-reset'
    case '2fa': return 'mdi-shield-key'
    case 'security': return 'mdi-alert'
    default: return 'mdi-information'
  }
}

const formatDateTime = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

// 一時的なAuditLogViewerコンポーネント（実装待ち）
const AuditLogViewer = {
  template: `
    <v-card-text class="text-center pa-8">
      <v-icon size="64" color="grey">mdi-file-document-outline</v-icon>
      <div class="text-h6 mt-4 mb-2">監査ログビューワー</div>
      <div class="text-body-2 text-medium-emphasis">
        この機能は開発中です。近日公開予定です。
      </div>
    </v-card-text>
  `
}

// Lifecycle
onMounted(() => {
  // 初期化処理
})
</script>

<style scoped>
.security-settings-page {
  min-height: 100vh;
  background-color: rgb(var(--v-theme-surface));
}

.security-overview-card {
  background: linear-gradient(135deg, 
    rgba(var(--v-theme-primary), 0.05) 0%, 
    rgba(var(--v-theme-surface), 1) 100%);
}

.v-tabs {
  background-color: transparent;
}

.v-tabs-window {
  background-color: transparent;
}

/* タブレット・スマートフォン対応 */
@media (max-width: 960px) {
  .v-container {
    padding: 16px 8px;
  }
  
  .text-h4 {
    font-size: 1.75rem !important;
  }
}

@media (max-width: 600px) {
  .v-tabs {
    overflow-x: auto;
  }
  
  .v-tab {
    min-width: 120px;
  }
}
</style>