<template>
  <v-card>
    <v-card-title>
      <v-icon class="mr-2" size="24">mdi-database</v-icon>
      データ管理
    </v-card-title>
    <v-card-subtitle>データのインポート・エクスポート・削除ができます。</v-card-subtitle>

    <v-card-text>
      <!-- データエクスポート -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-h6">データエクスポート</v-card-title>
            <v-card-text>
              <v-select
                v-model="exportFormat"
                :items="[
                  { title: 'JSON', value: 'json' },
                  { title: 'CSV', value: 'csv' },
                ]"
                label="エクスポート形式"
                variant="outlined"
                class="mb-3"
              />
              <v-btn
                color="primary"
                @click="exportData"
                :loading="dataManagementStore.loading"
                block
              >
                データをエクスポート
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- データインポート -->
      <v-row class="mb-4">
        <v-col cols="12">
          <v-card variant="outlined">
            <v-card-title class="text-h6">データインポート</v-card-title>
            <v-card-text>
              <v-file-input
                v-model="importFile"
                label="インポートファイル"
                accept=".json,.csv"
                variant="outlined"
                class="mb-3"
                :rules="[(v) => !v || v.length > 0 || 'ファイルを選択してください']"
              />
              <v-btn
                color="success"
                @click="importData"
                :disabled="!importFile || importFile.length === 0"
                :loading="dataManagementStore.loading"
                block
              >
                データをインポート
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>

      <!-- データ削除 -->
      <v-row>
        <v-col cols="12">
          <v-card variant="outlined" color="error">
            <v-card-title class="text-h6 text-error">
              <v-icon class="mr-2">mdi-alert</v-icon>
              危険な操作
            </v-card-title>
            <v-card-text>
              <v-btn
                color="error"
                variant="outlined"
                @click="showDeleteDialog = true"
                block
                class="mb-2"
              >
                全データを削除
              </v-btn>

              <v-btn color="error" @click="showAccountDeleteDialog = true" block>
                アカウント削除
              </v-btn>
            </v-card-text>
          </v-card>
        </v-col>
      </v-row>
    </v-card-text>

    <!-- 全データ削除確認ダイアログ -->
    <v-dialog v-model="showDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">全データ削除</v-card-title>
        <v-card-text>
          すべてのデータを削除してもよろしいですか？この操作は取り消せません。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showDeleteDialog = false">キャンセル</v-btn>
          <v-btn color="error" @click="deleteAllData" :loading="dataManagementStore.loading">
            削除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>

    <!-- アカウント削除確認ダイアログ -->
    <v-dialog v-model="showAccountDeleteDialog" max-width="400">
      <v-card>
        <v-card-title class="text-error">アカウント削除</v-card-title>
        <v-card-text>
          アカウントを削除してもよろしいですか？すべてのデータが永久に失われます。
        </v-card-text>
        <v-card-actions>
          <v-spacer />
          <v-btn @click="showAccountDeleteDialog = false">キャンセル</v-btn>
          <v-btn color="error" @click="deleteAccount" :loading="dataManagementStore.loading">
            アカウント削除
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
  </v-card>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useDataManagementStore } from '../../stores/dataManagement'

const dataManagementStore = useDataManagementStore()

// ローカル状態
const exportFormat = ref('json')
const importFile = ref<File[]>([])
const showDeleteDialog = ref(false)
const showAccountDeleteDialog = ref(false)

// データ操作
const exportData = async () => {
  const exportOptions = {
    format: exportFormat.value as 'json' | 'csv',
    dataTypes: ['diaries', 'settings', 'profile'] as Array<'diaries' | 'settings' | 'profile'>,
    compressed: false,
  }
  await dataManagementStore.exportData(exportOptions)
}

const importData = async () => {
  if (importFile.value && importFile.value.length > 0) {
    const importOptions = {
      format: 'json' as 'json' | 'csv',
      file: importFile.value[0],
      conflictResolution: 'merge' as 'overwrite' | 'merge' | 'skip',
      validateData: true,
    }
    await dataManagementStore.importData(importOptions)
    importFile.value = []
  }
}

const deleteAllData = async () => {
  await dataManagementStore.deleteAllData()
  showDeleteDialog.value = false
}

const deleteAccount = async () => {
  // TODO: アカウント削除機能の実装が必要
  // logger.warn('アカウント削除機能は未実装です')
  showAccountDeleteDialog.value = false
}
</script>
