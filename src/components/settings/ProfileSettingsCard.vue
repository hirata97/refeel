<template>
  <v-card class="profile-settings-card">
    <v-card-title>
      <v-icon class="me-2">mdi-account</v-icon>
      プロファイル設定
    </v-card-title>

    <v-card-text>
      <v-form ref="profileForm" v-model="formValid" @submit.prevent="saveProfile">
        <v-row>
          <!-- アバター -->
          <v-col cols="12" class="text-center">
            <div class="avatar-section">
              <v-avatar
                :size="120"
                class="mb-4 elevation-4"
                :color="profileData.avatar_url ? undefined : 'grey-lighten-2'"
              >
                <v-img
                  v-if="profileData.avatar_url"
                  :src="profileData.avatar_url"
                  alt="アバター"
                />
                <v-icon v-else size="60" color="grey-darken-1">
                  mdi-account
                </v-icon>
              </v-avatar>
              
              <div class="avatar-actions d-flex gap-2 justify-center">
                <v-btn
                  color="primary"
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-upload"
                  @click="triggerFileInput"
                  :loading="uploadLoading"
                >
                  アップロード
                </v-btn>
                
                <v-btn
                  v-if="profileData.avatar_url"
                  color="error"
                  variant="outlined"
                  size="small"
                  prepend-icon="mdi-delete"
                  @click="removeAvatar"
                  :loading="removeLoading"
                >
                  削除
                </v-btn>
              </div>
              
              <input
                ref="fileInput"
                type="file"
                accept="image/*"
                style="display: none"
                @change="handleFileSelect"
              />
            </div>
          </v-col>

          <!-- 表示名 -->
          <v-col cols="12" md="6">
            <v-text-field
              v-model="profileData.display_name"
              label="表示名"
              density="compact"
              variant="outlined"
              :rules="displayNameRules"
              maxlength="50"
              counter
              clearable
            >
              <template #prepend-inner>
                <v-icon>mdi-account-circle</v-icon>
              </template>
            </v-text-field>
          </v-col>

          <!-- メールアドレス -->
          <v-col cols="12" md="6">
            <v-text-field
              :model-value="authStore.user?.email"
              label="メールアドレス"
              density="compact"
              variant="outlined"
              readonly
              hint="メールアドレスの変更はセキュリティ設定から行えます"
              persistent-hint
            >
              <template #prepend-inner>
                <v-icon>mdi-email</v-icon>
              </template>
            </v-text-field>
          </v-col>

          <!-- 自己紹介 -->
          <v-col cols="12">
            <v-textarea
              v-model="profileData.bio"
              label="自己紹介"
              density="compact"
              variant="outlined"
              rows="3"
              maxlength="500"
              counter
              :rules="bioRules"
              clearable
            >
              <template #prepend-inner>
                <v-icon>mdi-text</v-icon>
              </template>
            </v-textarea>
          </v-col>

          <!-- 言語設定 -->
          <v-col cols="12" md="6">
            <v-select
              v-model="profileData.preferred_language"
              :items="languageOptions"
              label="言語"
              density="compact"
              variant="outlined"
            >
              <template #prepend-inner>
                <v-icon>mdi-translate</v-icon>
              </template>
            </v-select>
          </v-col>

          <!-- タイムゾーン -->
          <v-col cols="12" md="6">
            <v-select
              v-model="profileData.timezone"
              :items="timezoneOptions"
              label="タイムゾーン"
              density="compact"
              variant="outlined"
            >
              <template #prepend-inner>
                <v-icon>mdi-clock</v-icon>
              </template>
            </v-select>
          </v-col>

          <!-- プライバシー設定 -->
          <v-col cols="12">
            <v-card variant="outlined" class="pa-4">
              <v-card-title class="text-subtitle-2 pa-0 pb-2">
                プライバシー設定
              </v-card-title>
              
              <v-switch
                v-model="profileData.public_profile"
                label="プロファイルを公開する"
                color="primary"
                hide-details
                density="compact"
              />
              
              <v-switch
                v-model="profileData.show_achievements"
                label="達成状況を表示する"
                color="primary"
                hide-details
                density="compact"
                class="mt-2"
              />
            </v-card>
          </v-col>
        </v-row>

        <!-- 保存ボタン -->
        <v-row class="mt-4">
          <v-col cols="12" class="d-flex gap-2">
            <v-btn
              type="submit"
              color="primary"
              variant="elevated"
              prepend-icon="mdi-content-save"
              :loading="saveLoading"
              :disabled="!formValid || !hasChanges"
            >
              保存
            </v-btn>
            
            <v-btn
              color="secondary"
              variant="outlined"
              prepend-icon="mdi-refresh"
              @click="resetChanges"
              :disabled="!hasChanges"
            >
              リセット
            </v-btn>
          </v-col>
        </v-row>

        <!-- 最終更新日時 -->
        <v-row v-if="profileData.updated_at">
          <v-col cols="12">
            <v-alert
              type="info"
              variant="text"
              density="compact"
            >
              最終更新: {{ formatDate(profileData.updated_at) }}
            </v-alert>
          </v-col>
        </v-row>
      </v-form>
    </v-card-text>
  </v-card>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProfileStore } from '@/stores/profile'
import type { UserProfile } from '@/types/settings'
import type { VForm } from 'vuetify/components'

// Props
interface Props {
  modelValue?: Partial<UserProfile>
}

interface Emits {
  (e: 'update:modelValue', value: UserProfile): void
  (e: 'profileUpdated', profile: UserProfile): void
  (e: 'avatarUploaded', url: string): void
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: () => ({})
})

const emit = defineEmits<Emits>()

// Stores
const authStore = useAuthStore()
const profileStore = useProfileStore()

// Form
const profileForm = ref<VForm>()
const formValid = ref(false)

// State
const saveLoading = ref(false)
const uploadLoading = ref(false)
const removeLoading = ref(false)
const fileInput = ref<HTMLInputElement>()

const originalProfile = ref<UserProfile | null>(null)
const profileData = ref<UserProfile>({
  user_id: '',
  display_name: '',
  bio: '',
  avatar_url: '',
  preferred_language: 'ja',
  timezone: 'Asia/Tokyo',
  public_profile: false,
  show_achievements: true,
  created_at: '',
  updated_at: '',
  ...props.modelValue
})

// Options
const languageOptions = [
  { title: '日本語', value: 'ja' },
  { title: 'English', value: 'en' }
]

const timezoneOptions = [
  { title: 'Asia/Tokyo', value: 'Asia/Tokyo' },
  { title: 'UTC', value: 'UTC' },
  { title: 'America/New_York', value: 'America/New_York' },
  { title: 'Europe/London', value: 'Europe/London' }
]

// Validation Rules
const displayNameRules = [
  (v: string) => v.length <= 50 || '表示名は50文字以内で入力してください'
]

const bioRules = [
  (v: string) => !v || v.length <= 500 || '自己紹介は500文字以内で入力してください'
]

// Computed
const hasChanges = computed(() => {
  if (!originalProfile.value) return false
  return JSON.stringify(profileData.value) !== JSON.stringify(originalProfile.value)
})

// Methods
const loadProfile = async () => {
  if (!authStore.user) return

  try {
    const profile = await profileStore.getProfile()
    if (profile) {
      profileData.value = { ...profile }
      originalProfile.value = { ...profile }
      emit('update:modelValue', profile)
    }
  } catch (error) {
    console.error('プロファイル読み込みエラー:', error)
  }
}

const saveProfile = async () => {
  if (!authStore.user || !formValid.value) return

  saveLoading.value = true
  try {
    await profileStore.updateProfile(profileData.value)
    
    originalProfile.value = { ...profileData.value }
    
    emit('update:modelValue', profileData.value)
    emit('profileUpdated', profileData.value)
  } catch (error) {
    console.error('プロファイル保存エラー:', error)
  } finally {
    saveLoading.value = false
  }
}

const resetChanges = () => {
  if (originalProfile.value) {
    profileData.value = { ...originalProfile.value }
  }
}

const triggerFileInput = () => {
  fileInput.value?.click()
}

const handleFileSelect = async (event: Event) => {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  if (!file || !authStore.user) return

  uploadLoading.value = true
  try {
    const url = await profileStore.uploadAvatar(file)
    profileData.value.avatar_url = url || ''
    emit('avatarUploaded', url || '')
  } catch (error) {
    console.error('アバターアップロードエラー:', error)
  } finally {
    uploadLoading.value = false
    target.value = '' // Reset file input
  }
}

const removeAvatar = async () => {
  if (!authStore.user) return

  removeLoading.value = true
  try {
    await profileStore.removeAvatar()
    profileData.value.avatar_url = ''
  } catch (error) {
    console.error('アバター削除エラー:', error)
  } finally {
    removeLoading.value = false
  }
}

const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('ja-JP')
}

// Watchers
watch(
  () => props.modelValue,
  (newValue) => {
    if (newValue) {
      profileData.value = { ...profileData.value, ...newValue }
    }
  },
  { deep: true }
)

// Lifecycle
onMounted(() => {
  loadProfile()
})
</script>

<style scoped>
.profile-settings-card {
  height: 100%;
}

.avatar-section {
  margin-bottom: 1rem;
}

.avatar-actions {
  margin-top: 0.5rem;
}
</style>