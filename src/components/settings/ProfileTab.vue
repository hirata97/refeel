<template>
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
            />
            <v-icon v-else size="60">mdi-account-circle</v-icon>
          </v-avatar>
          <div>
            <v-btn
              color="primary"
              class="mb-2 mr-2"
              @click="uploadAvatar"
            >
              アバター変更
            </v-btn>
            <v-btn
              v-if="profileStore.avatarUrl"
              color="error"
              variant="outlined"
              class="mb-2"
              @click="removeAvatar"
            >
              アバター削除
            </v-btn>
          </div>
        </v-col>
      </v-row>

      <v-form @submit.prevent="updateProfile">
        <v-text-field
          v-model="profileStore.displayName"
          label="表示名"
          variant="outlined"
          class="mb-3"
          :rules="[v => !!v || '表示名は必須です']"
        />

        <v-text-field
          v-model="profileStore.email"
          label="メールアドレス"
          variant="outlined"
          type="email"
          class="mb-3"
          readonly
          hint="メールアドレスは変更できません"
          persistent-hint
        />

        <v-textarea
          v-model="profileStore.bio"
          label="自己紹介"
          variant="outlined"
          rows="3"
          class="mb-3"
          counter="200"
          :rules="[v => !v || v.length <= 200 || '200文字以内で入力してください']"
        />

        <v-select
          v-model="profileStore.language"
          :items="languageOptions"
          item-title="title"
          item-value="value"
          label="言語設定"
          variant="outlined"
          class="mb-3"
        />

        <v-select
          v-model="profileStore.timezone"
          :items="timezoneOptions"
          item-title="title"
          item-value="value"
          label="タイムゾーン"
          variant="outlined"
          class="mb-3"
        />
      </v-form>
    </v-card-text>

    <v-card-actions>
      <v-spacer />
      <v-btn
        color="primary"
        @click="updateProfile"
        :loading="profileStore.loading"
      >
        プロフィール更新
      </v-btn>
    </v-card-actions>
  </v-card>
</template>

<script setup lang="ts">
import { useProfileStore } from '../../stores/profile'

const profileStore = useProfileStore()

// 言語設定オプション
const languageOptions = [
  { title: '日本語', value: 'ja' },
  { title: 'English', value: 'en' },
]

// タイムゾーンオプション
const timezoneOptions = [
  { title: 'Asia/Tokyo', value: 'Asia/Tokyo' },
  { title: 'UTC', value: 'UTC' },
  { title: 'America/New_York', value: 'America/New_York' },
  { title: 'Europe/London', value: 'Europe/London' },
]

const updateProfile = async () => {
  await profileStore.updateProfile({
    displayName: profileStore.displayName,
    bio: profileStore.bio,
    language: profileStore.language,
    timezone: profileStore.timezone,
  })
}

const uploadAvatar = () => {
  // アバターアップロード機能は既存実装を参照
  const input = document.createElement('input')
  input.type = 'file'
  input.accept = 'image/*'
  input.onchange = async (event) => {
    const file = (event.target as HTMLInputElement)?.files?.[0]
    if (file) {
      await profileStore.uploadAvatar(file)
    }
  }
  input.click()
}

const removeAvatar = async () => {
  await profileStore.removeAvatar()
}
</script>

<style scoped>
.v-avatar {
  border: 2px solid rgba(var(--v-theme-outline), 0.2);
}
</style>