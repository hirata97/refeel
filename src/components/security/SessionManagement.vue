<template>
  <v-card>
    <v-card-title class="d-flex align-center">
      <v-icon class="me-2">mdi-monitor-multiple</v-icon>
      アクティブセッション
      <v-spacer />
      <v-chip 
        :color="activeSessions.length > 0 ? 'success' : 'warning'"
        size="small"
      >
        {{ activeSessions.length }} 個
      </v-chip>
    </v-card-title>

    <v-divider />

    <v-card-text>
      <!-- セッション統計 -->
      <v-row class="mb-4">
        <v-col cols="12" sm="4">
          <v-card variant="outlined" class="text-center pa-3">
            <div class="text-h4 text-primary">{{ activeSessions.length }}</div>
            <div class="text-body-2">アクティブセッション</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card variant="outlined" class="text-center pa-3">
            <div class="text-h4 text-info">{{ devices.length }}</div>
            <div class="text-body-2">認識デバイス</div>
          </v-card>
        </v-col>
        <v-col cols="12" sm="4">
          <v-card variant="outlined" class="text-center pa-3">
            <div class="text-h4" :class="securityStats?.pendingAlerts ? 'text-warning' : 'text-success'">
              {{ securityStats?.pendingAlerts || 0 }}
            </div>
            <div class="text-body-2">セキュリティアラート</div>
          </v-card>
        </v-col>
      </v-row>

      <!-- 全セッション終了ボタン -->
      <div class="d-flex justify-end mb-4">
        <v-btn
          color="warning"
          variant="outlined"
          prepend-icon="mdi-logout-variant"
          :loading="terminatingAll"
          :disabled="activeSessions.length <= 1"
          @click="showTerminateAllDialog = true"
        >
          他のセッションをすべて終了
        </v-btn>
      </div>

      <!-- アクティブセッション一覧 -->
      <div class="text-h6 mb-3">アクティブセッション</div>
      
      <v-data-table
        :headers="sessionHeaders"
        :items="activeSessions"
        :loading="loading"
        class="mb-6"
        density="compact"
      >
        <template #item.device="{ item }">
          <div class="d-flex align-center">
            <v-icon :class="getDeviceIcon(item.userAgent).class" class="me-2">
              {{ getDeviceIcon(item.userAgent).icon }}
            </v-icon>
            <div>
              <div class="text-body-2 font-weight-medium">
                {{ getDeviceName(item.userAgent) }}
              </div>
              <div class="text-caption text-medium-emphasis">
                {{ item.ipAddress }}
              </div>
            </div>
          </div>
        </template>

        <template #item.status="{ item }">
          <v-chip 
            :color="item.isActive ? 'success' : 'error'"
            size="small"
          >
            {{ item.isActive ? 'アクティブ' : '非アクティブ' }}
          </v-chip>
        </template>

        <template #item.lastActivity="{ item }">
          <div>
            <div class="text-body-2">
              {{ formatDate(item.lastActivity) }}
            </div>
            <div class="text-caption text-medium-emphasis">
              {{ getRelativeTime(item.lastActivity) }}
            </div>
          </div>
        </template>

        <template #item.current="{ item }">
          <v-chip 
            v-if="isCurrentSession(item)"
            color="primary"
            size="small"
          >
            現在のセッション
          </v-chip>
        </template>

        <template #item.actions="{ item }">
          <v-btn
            v-if="!isCurrentSession(item)"
            icon="mdi-close"
            variant="text"
            size="small"
            color="error"
            :loading="terminatingSession === item.id"
            @click="terminateSession(item)"
          />
        </template>

        <template v-slot:no-data>
          <div class="text-center py-4">
            <v-icon size="48" color="grey">mdi-monitor-off</v-icon>
            <div class="text-body-1 mt-2">アクティブなセッションがありません</div>
          </div>
        </template>
      </v-data-table>

      <!-- デバイス履歴 -->
      <div class="text-h6 mb-3">デバイス履歴</div>
      
      <v-list>
        <v-list-item
          v-for="device in devices"
          :key="device.id"
          :prepend-icon="getDeviceIcon(device.userAgent).icon"
        >
          <v-list-item-title>
            {{ device.name }}
          </v-list-item-title>
          
          <v-list-item-subtitle>
            <div>IP: {{ device.ipAddress }}</div>
            <div>初回: {{ formatDate(device.firstSeen) }}</div>
            <div>最終: {{ formatDate(device.lastSeen) }}</div>
          </v-list-item-subtitle>

          <template v-slot:append>
            <v-chip
              v-if="device.isCurrentDevice"
              color="primary"
              size="small"
            >
              現在のデバイス
            </v-chip>
          </template>
        </v-list-item>

        <v-list-item v-if="devices.length === 0">
          <v-list-item-title class="text-center text-medium-emphasis">
            デバイス履歴がありません
          </v-list-item-title>
        </v-list-item>
      </v-list>

      <!-- エラー表示 -->
      <v-alert v-if="error" type="error" class="mt-4">
        {{ error }}
      </v-alert>
    </v-card-text>

    <!-- 全セッション終了確認ダイアログ -->
    <v-dialog v-model="showTerminateAllDialog" max-width="500">
      <v-card>
        <v-card-title class="text-h6">
          <v-icon class="me-2 text-warning">mdi-alert</v-icon>
          全セッション終了の確認
        </v-card-title>
        
        <v-card-text>
          <v-alert type="warning" class="mb-4">
            <strong>注意:</strong> 現在のセッション以外のすべてのセッションが終了されます。
          </v-alert>

          <div class="text-body-2">
            他のデバイスからログアウトされ、再度ログインが必要になります。
            続行しますか？
          </div>

          <div class="mt-3">
            <strong>終了対象:</strong> {{ activeSessions.length - 1 }} セッション
          </div>
        </v-card-text>

        <v-card-actions>
          <v-spacer />
          <v-btn
            variant="outlined"
            @click="showTerminateAllDialog = false"
            :disabled="terminatingAll"
          >
            キャンセル
          </v-btn>
          <v-btn
            color="warning"
            @click="confirmTerminateAll"
            :loading="terminatingAll"
          >
            すべて終了
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import type { SessionInfo } from '@/utils/enhanced-session-management'

// State
const authStore = useAuthStore()
const loading = ref(false)
const terminatingSession = ref<string | null>(null)
const terminatingAll = ref(false)
const showTerminateAllDialog = ref(false)
const error = ref<string | null>(null)

// Computed
const activeSessions = computed(() => authStore.getActiveSessions())
const devices = computed(() => authStore.getUserDevices())
const securityStats = computed(() => authStore.securityStats)

const sessionHeaders = [
  { title: 'デバイス', key: 'device', sortable: false },
  { title: 'ステータス', key: 'status', sortable: false },
  { title: '最終アクティビティ', key: 'lastActivity', sortable: true },
  { title: '', key: 'current', sortable: false },
  { title: '', key: 'actions', sortable: false, width: '80px' }
]

// Methods
const getDeviceIcon = (userAgent: string) => {
  if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
    return { icon: 'mdi-cellphone', class: 'text-blue' }
  } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
    return { icon: 'mdi-tablet', class: 'text-purple' }
  } else if (userAgent.includes('Windows')) {
    return { icon: 'mdi-microsoft-windows', class: 'text-blue' }
  } else if (userAgent.includes('Mac')) {
    return { icon: 'mdi-apple', class: 'text-grey' }
  } else if (userAgent.includes('Linux')) {
    return { icon: 'mdi-linux', class: 'text-orange' }
  } else {
    return { icon: 'mdi-monitor', class: 'text-grey' }
  }
}

const getDeviceName = (userAgent: string): string => {
  if (userAgent.includes('Chrome')) return 'Chrome ブラウザ'
  if (userAgent.includes('Firefox')) return 'Firefox ブラウザ'
  if (userAgent.includes('Safari')) return 'Safari ブラウザ'
  if (userAgent.includes('Edge')) return 'Edge ブラウザ'
  return '不明なブラウザ'
}

const formatDate = (date: Date): string => {
  return new Intl.DateTimeFormat('ja-JP', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date)
}

const getRelativeTime = (date: Date): string => {
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMins = Math.floor(diffMs / (1000 * 60))
  const diffHours = Math.floor(diffMins / 60)
  const diffDays = Math.floor(diffHours / 24)

  if (diffMins < 1) return '今'
  if (diffMins < 60) return `${diffMins}分前`
  if (diffHours < 24) return `${diffHours}時間前`
  return `${diffDays}日前`
}

const isCurrentSession = (session: SessionInfo): boolean => {
  return session.id === authStore.session?.access_token
}

const terminateSession = async (session: SessionInfo) => {
  try {
    terminatingSession.value = session.id
    error.value = null

    await authStore.terminateUserSession(session.id)
    await loadSessions()
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'セッション終了に失敗しました'
  } finally {
    terminatingSession.value = null
  }
}

const confirmTerminateAll = async () => {
  try {
    terminatingAll.value = true
    error.value = null

    const terminatedCount = await authStore.terminateAllUserSessions()
    
    if (terminatedCount > 0) {
      showTerminateAllDialog.value = false
      await loadSessions()
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : '全セッション終了に失敗しました'
  } finally {
    terminatingAll.value = false
  }
}

const loadSessions = async () => {
  try {
    loading.value = true
    error.value = null
    
    // セッションとデバイス情報を更新
    // 実際の実装では必要に応じてデータの再取得
    await new Promise(resolve => setTimeout(resolve, 500)) // 模擬遅延
    
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'セッション情報の読み込みに失敗しました'
  } finally {
    loading.value = false
  }
}

// Lifecycle
onMounted(() => {
  loadSessions()
})
</script>

<style scoped>
.text-body-2.font-weight-medium {
  font-weight: 500;
}

.text-caption.text-medium-emphasis {
  color: rgba(var(--v-theme-on-surface), var(--v-medium-emphasis-opacity));
}
</style>