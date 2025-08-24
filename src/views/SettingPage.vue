<template>
  <v-container class="settings-page">
    <v-typography variant="h4" class="mb-4">設定</v-typography>
    <v-typography variant="body1" class="mb-4">ここではアプリの設定を行います。</v-typography>

    <!-- タブナビゲーション -->
    <v-tabs v-model="activeTab" class="mb-4">
      <v-tab value="theme">テーマ</v-tab>
      <v-tab value="notifications">通知</v-tab>
      <v-tab value="profile">プロフィール</v-tab>
      <v-tab value="data">データ管理</v-tab>
      <v-tab value="privacy">プライバシー</v-tab>
      <v-tab value="tags">タグ管理</v-tab>
    </v-tabs>

    <!-- タブコンテンツ -->
    <v-tabs-window v-model="activeTab">
      <!-- テーマ設定 -->
      <v-tabs-window-item value="theme">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2" size="24">mdi-palette</v-icon>
            テーマ設定
          </v-card-title>
          <v-card-subtitle>アプリの表示テーマを変更できます。</v-card-subtitle>
          <v-card-text>
            <v-select
              v-model="themeStore.selectedTheme"
              :items="themeOptions"
              item-title="title"
              item-value="value"
              label="テーマを選択"
              prepend-inner-icon="mdi-theme-light-dark"
              variant="outlined"
              @update:model-value="handleThemeChange"
            >
              <template v-slot:[`item`]="{ props, item }">
                <v-list-item v-bind="props" :title="item.raw.title">
                  <template v-slot:prepend>
                    <v-icon :icon="item.raw.icon" class="mr-3"></v-icon>
                  </template>
                </v-list-item>
              </template>
            </v-select>

            <!-- 現在のテーマ状態表示 -->
            <v-chip
              :color="themeStore.isDarkMode ? 'secondary' : 'primary'"
              variant="outlined"
              class="mt-3"
            >
              <v-icon
                start
                :icon="
                  themeStore.isDarkMode ? 'mdi-moon-waning-crescent' : 'mdi-white-balance-sunny'
                "
              ></v-icon>
              現在: {{ themeStore.isDarkMode ? 'ダークモード' : 'ライトモード' }}
            </v-chip>
          </v-card-text>

          <v-card-actions>
            <v-btn
              variant="text"
              @click="toggleTheme"
              :prepend-icon="
                themeStore.isDarkMode ? 'mdi-white-balance-sunny' : 'mdi-moon-waning-crescent'
              "
            >
              {{ themeStore.isDarkMode ? 'ライトモードに切り替え' : 'ダークモードに切り替え' }}
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-tabs-window-item>

      <!-- 通知設定 -->
      <v-tabs-window-item value="notifications">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2" size="24">mdi-bell</v-icon>
            通知設定
          </v-card-title>
          <v-card-subtitle>ブラウザ通知とリマインダーの設定ができます。</v-card-subtitle>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-switch
                  v-model="notificationStore.settings.enabled"
                  label="ブラウザ通知を有効にする"
                  color="primary"
                  @update:model-value="updateNotificationSettings"
                ></v-switch>
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="notificationStore.settings.diaryReminder"
                  label="日記リマインダー"
                  color="primary"
                  :disabled="!notificationStore.settings.enabled"
                  @update:model-value="updateNotificationSettings"
                ></v-switch>
              </v-col>

              <v-col cols="12" md="6">
                <v-text-field
                  v-model="notificationStore.settings.reminderTime"
                  label="リマインダー時刻"
                  type="time"
                  variant="outlined"
                  :disabled="!notificationStore.settings.diaryReminder"
                  @update:model-value="updateNotificationSettings"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6">
                <v-switch
                  v-model="notificationStore.settings.soundEnabled"
                  label="通知音を有効にする"
                  color="primary"
                  :disabled="!notificationStore.settings.enabled"
                  @update:model-value="updateNotificationSettings"
                ></v-switch>
              </v-col>

              <v-col cols="12">
                <v-alert
                  v-if="!notificationStore.hasPermission && notificationStore.settings.enabled"
                  type="warning"
                  variant="outlined"
                  class="mb-4"
                >
                  ブラウザの通知権限が必要です。
                </v-alert>
              </v-col>
            </v-row>
          </v-card-text>

          <v-card-actions>
            <v-btn
              v-if="!notificationStore.hasPermission"
              variant="outlined"
              prepend-icon="mdi-shield-check"
              @click="requestNotificationPermission"
            >
              通知権限を要求
            </v-btn>
            <v-btn
              variant="text"
              prepend-icon="mdi-test-tube"
              @click="testNotification"
              :disabled="!notificationStore.canShowNotifications"
            >
              テスト通知
            </v-btn>
          </v-card-actions>
        </v-card>
      </v-tabs-window-item>

      <!-- プロフィール管理 -->
      <v-tabs-window-item value="profile">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2" size="24">mdi-account</v-icon>
            プロフィール管理
          </v-card-title>
          <v-card-subtitle>ユーザープロフィール情報の管理ができます。</v-card-subtitle>
          <v-card-text>
            <v-row>
              <v-col cols="12" class="text-center">
                <v-avatar size="120" class="mb-4">
                  <v-img
                    v-if="profileStore.avatarUrl"
                    :src="profileStore.avatarUrl"
                    alt="アバター"
                  ></v-img>
                  <v-icon v-else size="60">mdi-account-circle</v-icon>
                </v-avatar>
                <div>
                  <v-file-input
                    ref="avatarInput"
                    accept="image/*"
                    style="display: none"
                    @change="uploadAvatar"
                  ></v-file-input>
                  <v-btn
                    variant="outlined"
                    size="small"
                    prepend-icon="mdi-camera"
                    @click="$refs.avatarInput?.$el.querySelector('input').click()"
                    :loading="profileStore.uploading"
                  >
                    画像変更
                  </v-btn>
                  <v-btn
                    v-if="profileStore.avatarUrl"
                    variant="text"
                    size="small"
                    prepend-icon="mdi-delete"
                    @click="removeAvatar"
                    class="ml-2"
                  >
                    削除
                  </v-btn>
                </div>
              </v-col>

              <v-col cols="12" md="6" v-if="profileStore.profile">
                <v-text-field
                  v-model="profileStore.profile.displayName"
                  label="表示名"
                  variant="outlined"
                  :loading="profileStore.loading"
                  @blur="updateProfile"
                ></v-text-field>
              </v-col>

              <v-col cols="12" md="6" v-if="profileStore.profile">
                <v-select
                  v-model="profileStore.profile.timezone"
                  :items="timezoneOptions"
                  label="タイムゾーン"
                  variant="outlined"
                  :loading="profileStore.loading"
                  @update:model-value="updateProfile"
                ></v-select>
              </v-col>

              <v-col cols="12" md="6" v-if="profileStore.profile">
                <v-select
                  v-model="profileStore.profile.language"
                  :items="languageOptions"
                  label="言語"
                  variant="outlined"
                  :loading="profileStore.loading"
                  @update:model-value="updateProfile"
                ></v-select>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <!-- データ管理 -->
      <v-tabs-window-item value="data">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2" size="24">mdi-database</v-icon>
            データ管理
          </v-card-title>
          <v-card-subtitle>日記データのエクスポート・インポート・削除ができます。</v-card-subtitle>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <v-card variant="outlined" class="mb-4">
                  <v-card-text>
                    <v-row align="center">
                      <v-col>
                        <div class="text-h6">ストレージ使用量</div>
                        <div class="text-caption">使用中: {{ formatBytes(dataManagementStore.storageUsage.used) }} / {{ formatBytes(dataManagementStore.storageUsage.total) }}</div>
                      </v-col>
                      <v-col cols="auto">
                        <v-progress-circular
                          :model-value="(dataManagementStore.storageUsage.used / dataManagementStore.storageUsage.total) * 100"
                          size="60"
                          width="4"
                          color="primary"
                        >
                          {{ Math.round((dataManagementStore.storageUsage.used / dataManagementStore.storageUsage.total) * 100) }}%
                        </v-progress-circular>
                      </v-col>
                    </v-row>
                  </v-card-text>
                </v-card>
              </v-col>

              <v-col cols="12" md="6">
                <div class="text-h6 mb-2">データエクスポート</div>
                <v-select
                  v-model="exportFormat"
                  :items="[{title: 'JSON形式', value: 'json'}, {title: 'CSV形式', value: 'csv'}]"
                  label="エクスポート形式"
                  variant="outlined"
                  class="mb-2"
                ></v-select>
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-download"
                  @click="exportData"
                  :loading="dataManagementStore.isExporting"
                  block
                >
                  データをエクスポート
                </v-btn>
              </v-col>

              <v-col cols="12" md="6">
                <div class="text-h6 mb-2">データインポート</div>
                <v-file-input
                  v-model="importFile"
                  accept=".json,.csv"
                  label="インポートファイル"
                  variant="outlined"
                  class="mb-2"
                ></v-file-input>
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-upload"
                  @click="importData"
                  :loading="dataManagementStore.isImporting"
                  :disabled="!importFile"
                  block
                >
                  データをインポート
                </v-btn>
              </v-col>

              <v-col cols="12">
                <v-divider class="my-4"></v-divider>
                <div class="text-h6 mb-2 text-error">危険な操作</div>
                <v-btn
                  variant="outlined"
                  color="error"
                  prepend-icon="mdi-delete-forever"
                  @click="showDeleteDialog = true"
                >
                  全データを削除
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <!-- プライバシー設定 -->
      <v-tabs-window-item value="privacy">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2" size="24">mdi-shield-account</v-icon>
            プライバシー・セキュリティ
          </v-card-title>
          <v-card-subtitle>アカウントとデータの安全性に関する設定です。</v-card-subtitle>
          <v-card-text>
            <v-row>
              <v-col cols="12">
                <div class="text-h6 mb-4">アカウント管理</div>
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-key"
                  href="https://supabase.com" 
                  target="_blank"
                  class="mb-2"
                >
                  パスワード変更
                </v-btn>
                <br>
                <v-btn
                  variant="outlined"
                  prepend-icon="mdi-download"
                  @click="downloadData"
                  class="mb-2"
                >
                  個人データをダウンロード
                </v-btn>
                <br>
                <v-btn
                  variant="outlined"
                  color="error"
                  prepend-icon="mdi-account-remove"
                  @click="showAccountDeleteDialog = true"
                >
                  アカウントを削除
                </v-btn>
              </v-col>
            </v-row>
          </v-card-text>
        </v-card>
      </v-tabs-window-item>

      <!-- タグ管理 -->
      <v-tabs-window-item value="tags">
        <v-card>
          <v-card-title>
            <v-icon class="mr-2" size="24">mdi-tag-multiple</v-icon>
            タグ管理
          </v-card-title>
          <v-card-subtitle>日記や目標で使用するタグを管理できます。</v-card-subtitle>
          <v-card-text>
            <TagManager />
          </v-card-text>
        </v-card>
      </v-tabs-window-item>
    </v-tabs-window>

    <!-- データ削除確認ダイアログ -->
    <v-dialog v-model="showDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          全データ削除の確認
        </v-card-title>
        <v-card-text>
          すべての日記データと設定が削除されます。この操作は取り消せません。
          <br><br>
          本当に削除しますか？
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showDeleteDialog = false">キャンセル</v-btn>
          <v-btn color="error" @click="deleteAllData">削除する</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- アカウント削除確認ダイアログ -->
    <v-dialog v-model="showAccountDeleteDialog" max-width="500">
      <v-card>
        <v-card-title class="text-error">
          <v-icon class="mr-2">mdi-alert</v-icon>
          アカウント削除の確認
        </v-card-title>
        <v-card-text>
          アカウントとすべてのデータが完全に削除されます。この操作は取り消せません。
          <br><br>
          本当にアカウントを削除しますか？
        </v-card-text>
        <v-card-actions>
          <v-spacer></v-spacer>
          <v-btn @click="showAccountDeleteDialog = false">キャンセル</v-btn>
          <v-btn color="error" @click="deleteAccount">アカウントを削除</v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-container>
</template>

<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useThemeStore, type ThemeName } from '@/stores/theme'
import { useBrowserNotificationStore } from '@/stores/browserNotifications'
import { useProfileStore } from '@/stores/profile'
import { useDataManagementStore } from '@/stores/dataManagement'
import { useTheme } from 'vuetify'
import TagManager from '@/components/TagManager.vue'

// タブの状態管理
const activeTab = ref<string>('theme')

// ダイアログの状態
const showDeleteDialog = ref<boolean>(false)
const showAccountDeleteDialog = ref<boolean>(false)

// フォームデータ
const exportFormat = ref<'json' | 'csv'>('json')
const importFile = ref<File[]>([])

// オプション定義
const timezoneOptions = [
  { title: '日本標準時', value: 'Asia/Tokyo' },
  { title: 'UTC', value: 'UTC' },
  { title: 'アメリカ東部時間', value: 'America/New_York' },
  { title: 'アメリカ太平洋時間', value: 'America/Los_Angeles' },
  { title: 'ヨーロッパ中央時間', value: 'Europe/Berlin' },
]

const languageOptions = [
  { title: '日本語', value: 'ja' },
  { title: 'English', value: 'en' },
]

const router = useRouter()
const authStore = useAuthStore()
const themeStore = useThemeStore()
const notificationStore = useBrowserNotificationStore()
const profileStore = useProfileStore()
const dataManagementStore = useDataManagementStore()
const vuetifyTheme = useTheme()

// テーマオプション
const themeOptions = computed(() => themeStore.getThemeOptions())

// テーマ変更ハンドラ
const handleThemeChange = (newTheme: ThemeName) => {
  themeStore.setTheme(newTheme)
}

// テーマトグル
const toggleTheme = () => {
  themeStore.toggleTheme()
}

// 通知設定の更新
const updateNotificationSettings = async () => {
  try {
    await notificationStore.updateSettings(notificationStore.settings)
  } catch (error) {
    console.error('通知設定の更新に失敗:', error)
  }
}

// 通知権限の要求
const requestNotificationPermission = async () => {
  try {
    await notificationStore.requestPermission()
  } catch (error) {
    console.error('通知権限の要求に失敗:', error)
  }
}

// テスト通知
const testNotification = async () => {
  try {
    await notificationStore.testNotification()
  } catch (error) {
    console.error('テスト通知の送信に失敗:', error)
  }
}

// プロフィール更新
const updateProfile = async () => {
  if (!profileStore.profile) return
  
  try {
    await profileStore.updateProfile({
      displayName: profileStore.profile.displayName,
      timezone: profileStore.profile.timezone,
      language: profileStore.profile.language,
    })
  } catch (error) {
    console.error('プロフィールの更新に失敗:', error)
  }
}

// アバターアップロード
const uploadAvatar = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (file) {
    try {
      await profileStore.uploadAvatar(file)
    } catch (error) {
      console.error('アバターのアップロードに失敗:', error)
    }
  }
}

// アバター削除
const removeAvatar = async () => {
  try {
    await profileStore.removeAvatar()
  } catch (error) {
    console.error('アバターの削除に失敗:', error)
  }
}

// データエクスポート
const exportData = async () => {
  try {
    const blob = await dataManagementStore.exportData({
      format: exportFormat.value,
      dataTypes: ['diaries', 'settings', 'profile'],
      compressed: false,
    })
    
    if (blob) {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `goal_diary_backup_${new Date().toISOString().split('T')[0]}.${exportFormat.value}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }
  } catch (error) {
    console.error('データエクスポートに失敗:', error)
  }
}

// データインポート
const importData = async () => {
  if (!importFile.value.length) return
  
  try {
    const file = importFile.value[0]
    const format = file.name.endsWith('.json') ? 'json' : 'csv'
    
    const success = await dataManagementStore.importData({
      format,
      file,
      conflictResolution: 'merge',
      validateData: true,
    })
    
    if (success) {
      importFile.value = []
      // ページを再読み込みしてデータを反映
      window.location.reload()
    }
  } catch (error) {
    console.error('データインポートに失敗:', error)
  }
}

// 全データ削除
const deleteAllData = async () => {
  try {
    const success = await dataManagementStore.deleteAllData()
    if (success) {
      showDeleteDialog.value = false
      // ログアウトして初期画面に戻る
      authStore.signOut()
      router.push('/')
    }
  } catch (error) {
    console.error('データ削除に失敗:', error)
  }
}

// 個人データダウンロード
const downloadData = async () => {
  await exportData()
}

// アカウント削除
const deleteAccount = async () => {
  try {
    // まずデータを削除
    await dataManagementStore.deleteAllData()
    
    // アカウントを削除（Supabaseの機能を使用）
    // 注意: 実際の実装では適切なAPIエンドポイントを使用する必要があります
    showAccountDeleteDialog.value = false
    authStore.signOut()
    router.push('/')
  } catch (error) {
    console.error('アカウント削除に失敗:', error)
  }
}

// バイト数のフォーマット
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes'
  
  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

// システムテーマリスナーのクリーンアップ関数
let cleanupThemeListener: (() => void) | null = null

// 認証状態をチェック
onMounted(() => {
  if (!authStore.isAuthenticated) {
    // 認証されていない場合はログインページにリダイレクト
    router.push('/login')
    return
  }

  // Vuetifyテーマインスタンスをテーマストアに設定
  themeStore.setVuetifyTheme(vuetifyTheme)

  // テーマストアを初期化
  cleanupThemeListener = themeStore.initialize()

  // その他のストアの初期化
  notificationStore.initialize()
  profileStore.initialize()
  dataManagementStore.initialize()
})

// コンポーネント破棄時のクリーンアップ
onUnmounted(() => {
  if (cleanupThemeListener) {
    cleanupThemeListener()
  }
})
</script>

<style scoped>
/* 設定ページ全体のスタイル */
.settings-page {
  padding: 24px;
  border-radius: 8px;
  min-height: 100vh; /* ページ全体をカバーする高さ */
  transition: background-color 0.3s ease;
}

/* マージンのスタイル */
.mb-4 {
  margin-bottom: 16px;
}

/* テーマ切り替えアニメーション */
.v-card {
  transition:
    background-color 0.3s ease,
    border-color 0.3s ease;
}

.v-chip {
  transition:
    color 0.3s ease,
    background-color 0.3s ease;
}
</style>
