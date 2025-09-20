<template>
  <div class="pagination-jump">
    <v-text-field
      v-model.number="localJumpToPage"
      :max="totalPages"
      :min="1"
      :disabled="loading"
      type="number"
      label="ページ番号"
      variant="outlined"
      density="compact"
      class="page-jump"
      aria-label="移動したいページ番号を入力してEnterキーを押してください"
      @keyup.enter="handleJumpToPage"
      @blur="validateJumpInput"
    >
      <template #append-inner>
        <v-btn
          :disabled="!isValidJump || loading"
          variant="text"
          size="x-small"
          icon="mdi-keyboard-return"
          aria-label="指定したページに移動"
          @click="handleJumpToPage"
        />
      </template>
    </v-text-field>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'

interface Props {
  page: number
  totalPages: number
  loading?: boolean
}

interface Emits {
  (e: 'jump-to-page', page: number): void
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
})

const emit = defineEmits<Emits>()

// ローカル状態
const localJumpToPage = ref(props.page)

// 計算プロパティ
const isValidJump = computed(() => {
  return (
    localJumpToPage.value >= 1 &&
    localJumpToPage.value <= props.totalPages &&
    localJumpToPage.value !== props.page
  )
})

// イベントハンドラー
const handleJumpToPage = () => {
  if (isValidJump.value) {
    emit('jump-to-page', localJumpToPage.value)
  }
}

const validateJumpInput = () => {
  if (localJumpToPage.value < 1) {
    localJumpToPage.value = 1
  } else if (localJumpToPage.value > props.totalPages) {
    localJumpToPage.value = props.totalPages
  }
}

// プロパティ変更の監視
watch(
  () => props.page,
  (newPage) => {
    if (newPage !== localJumpToPage.value) {
      localJumpToPage.value = newPage
    }
  },
)
</script>

<style scoped>
.pagination-jump {
  display: flex;
  align-items: center;
  justify-content: center;
}

.page-jump {
  min-width: 120px;
  max-width: 160px;
}

/* フォーカス状態のアクセシビリティ */
.v-text-field:focus-within {
  outline: 2px solid rgba(var(--v-theme-primary));
  outline-offset: 2px;
}

/* レスポンシブ対応 */
@media (max-width: 480px) {
  .page-jump {
    min-width: 100px;
    max-width: 140px;
  }
}
</style>
