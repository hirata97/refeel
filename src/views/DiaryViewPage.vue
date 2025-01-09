<template>
  <v-container class="diary-view-page">
    <v-typography variant="h4" class="mb-4">日記一覧</v-typography>

    <v-row>
      <v-col>
        <!-- カレンダー -->
        <v-calendar :events="events" @day-click="handleDateClick" />

        <!-- ポップオーバー -->
        <v-popover v-model="isPopoverOpen" :anchor="anchorEl">
          <v-card>
            <v-card-text>
              <template v-if="filteredDiaries.length > 0">
                <v-list>
                  <v-list-item v-for="(diary, index) in filteredDiaries" :key="index">
                    <v-list-item-content>
                      <v-list-item-title>{{ diary.title }}</v-list-item-title>
                      <v-list-item-subtitle>{{ diary.content }}</v-list-item-subtitle>
                    </v-list-item-content>
                    <v-list-item-action>
                      <v-btn @click="handleDeleteDiary(diary)" icon>🗑️</v-btn>
                    </v-list-item-action>
                  </v-list-item>
                </v-list>
              </template>
              <template v-else>
                <v-typography>この日に登録された日記はありません。</v-typography>
              </template>
            </v-card-text>
          </v-card>
        </v-popover>
      </v-col>
    </v-row>
  </v-container>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { isAuthenticated } from '@/utils/auth'

interface Diary {
  date: string
  title: string
  content: string
}

const router = useRouter()

// ページ読み込み時に認証をチェックし、未認証ならリダイレクト
onMounted(() => {
  if (!isAuthenticated()) {
    router.push({
      path: '/login',
      query: { redirect: router.currentRoute.value.fullPath }, // 元のページを記憶
    })
  }
})

// データの管理
const diaries = ref<Diary[]>([])
const selectedDate = ref<string | null>(null)
const anchorEl = ref<HTMLElement | null>(null)
const isPopoverOpen = ref(false)

// ローカルストレージから日記を読み込む
onMounted(() => {
  const savedDiaries = localStorage.getItem('diaries')
  if (savedDiaries) {
    diaries.value = JSON.parse(savedDiaries)
  }
})

// 日記削除処理
const handleDeleteDiary = (diaryToDelete: Diary) => {
  diaries.value = diaries.value.filter((diary) => diary !== diaryToDelete)
  localStorage.setItem('diaries', JSON.stringify(diaries.value))
}

// 日付クリック時の処理
const handleDateClick = (date: Date, event: MouseEvent) => {
  selectedDate.value = date.toISOString().split('T')[0]
  anchorEl.value = event.currentTarget as HTMLElement
  isPopoverOpen.value = true
}

// フィルタリングした日記
const filteredDiaries = computed(() =>
  diaries.value.filter((diary) => diary.date === selectedDate.value),
)

// カレンダーイベント
const events = computed(() =>
  diaries.value.map((diary) => ({
    date: diary.date,
    title: '📅',
  })),
)
</script>

<style scoped>
.diary-view-page {
  padding: 24px;
}
</style>
