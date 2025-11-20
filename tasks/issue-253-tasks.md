# Issue #253: views/SettingPage.vue リファクタリング（622行→タブ別コンポーネント分割）

## 概要
## 親チケット

#215 (優先度2: UI/UX改善 - 子チケット3)

## 📝 概要

`views/SettingPage.vue`（622行）をタブ別コンポーネントに分割し、保守性・可読性を向上させます。

## 🎯 目的・背景

### 現状の問題
- **行数**: 622行（推奨上限500行を超過）
- **複雑度**: 複数の設定セクションが1つのコンポーネントに集約
- **保守性**: 設定項目追加時の影響範囲が広い
- **テスト**: 単一コンポーネントで全設定をテスト

### リファクタリング後の構造

```
Before: views/SettingPage.vue (622行)

After:  views/SettingPage.vue (200行：親コンポーネント・タブ管理)
        components/settings/
        ├── ProfileSettings.vue       (プロフィール設定)
        ├── SecuritySettings.vue      (セキュリティ設定)
        ├── NotificationSettings.vue  (通知設定)
        └── AppearanceSettings.vue    (外観設定)
```

## ✅ 受け入れ条件

- [ ] `components/settings/` ディレクトリに4つのタブコンポーネント作成
- [ ] 各コンポーネントが200行以下
- [ ] 親コンポーネント（SettingPage.vue）が200行以下
- [ ] タブ切り替え機能の実装
- [ ] 既存の設定機能が全て動作
- [ ] 型安全性維持（`any`型追加なし）
- [ ] 各タブコンポーネントのユニットテスト追加

## 🔧 実装手順

### Step 1: 現状分析

```bash
# 現在のSettingPage.vueを確認
cat src/views/SettingPage.vue | wc -l

# 設定セクションの特定
grep -n "section" src/views/SettingPage.vue
```

### Step 2: ブランチ作成

```bash
git checkout main
git pull origin main
git checkout -b feature/refactor-settings-page

mkdir -p src/components/settings
```

### Step 3: コンポーネント分割

**ProfileSettings.vue** (プロフィール設定)
- ユーザー名変更
- メールアドレス変更
- プロフィール画像設定
- アカウント情報表示

**SecuritySettings.vue** (セキュリティ設定)
- パスワード変更
- 二段階認証設定
- セッション管理
- ログイン履歴表示

**NotificationSettings.vue** (通知設定)
- メール通知設定
- プッシュ通知設定
- 通知頻度設定
- 通知カテゴリ選択

**AppearanceSettings.vue** (外観設定)
- テーマ選択（ライト/ダーク）
- 言語設定
- フォントサイズ設定
- レイアウト設定

**SettingPage.vue** (親コンポーネント)
```vue
<template>
  <v-container>
    <v-tabs v-model="activeTab">
      <v-tab value="profile">プロフィール</v-tab>
      <v-tab value="security">セキュリティ</v-tab>
      <v-tab value="notifications">通知</v-tab>
      <v-tab value="appearance">外観</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="profile">
        <ProfileSettings />
      </v-window-item>
      <v-window-item value="security">
        <SecuritySettings />
      </v-window-item>
      <v-window-item value="notifications">
        <NotificationSettings />
      </v-window-item>
      <v-window-item value="appearance">
        <AppearanceSettings />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProfileSettings from '@/components/settings/ProfileSettings.vue'
import SecuritySettings from '@/components/settings/SecuritySettings.vue'
import NotificationSettings from '@/components/settings/NotificationSettings.vue'
import AppearanceSettings from '@/components/settings/AppearanceSettings.vue'

const activeTab = ref('profile')
</script>
```

### Step 4: 状態管理の整理

```bash
# 設定用のPiniaストア作成（必要に応じて）
src/stores/settings.ts
```

### Step 5: テスト作成

```bash
# 各タブコンポーネントのテスト作成
tests/components/settings/
├── ProfileSettings.spec.ts
├── SecuritySettings.spec.ts
├── NotificationSettings.spec.ts
└── AppearanceSettings.spec.ts

# 親コンポーネントのE2Eテスト
tests/e2e/settings-page.spec.ts
```

### Step 6: 動作確認

```bash
# 開発サーバーで動作確認
npm run dev

# ユニットテスト
npm run test:unit -- tests/components/settings/

# E2Eテスト
npm run test:e2e -- tests/e2e/settings-page.spec.ts

# 全品質チェック
npm run ci:all
```

### Step 7: コミット・PR作成

```bash
git add src/views/SettingPage.vue src/components/settings/
git commit -m "refactor: split SettingPage into tab-based components"
git push -u origin feature/refactor-settings-page
npm run create-pr
```

## 🧪 テスト要件

**コンポーネントテスト**
- [ ] ProfileSettings: ユーザー情報更新テスト
- [ ] SecuritySettings: パスワード変更・2FA設定テスト
- [ ] NotificationSettings: 通知設定変更テスト
- [ ] AppearanceSettings: テーマ・言語切り替えテスト

**統合テスト**
- [ ] タブ切り替え動作確認
- [ ] 設定保存・読み込み確認
- [ ] バリデーションエラー処理確認

**E2Eテスト**
- [ ] 設定画面遷移
- [ ] 各タブの設定変更フロー
- [ ] 設定反映確認

## 📊 期待される効果

### 定量的効果
- ファイル行数: 622行 → 各100-150行（5ファイル）
- 単一責任の明確化: 1コンポーネント4責任 → 1コンポーネント1責任
- テスト粒度: 1ファイル → 5ファイル

### 定性的効果
- 新しい設定項目追加が容易
- 各設定セクションの独立性向上
- コードレビューの効率化
- ユーザー体験の向上（タブによる整理）

## 🚨 注意事項

### UI/UX整合性
- 既存のデザインシステム（Vuetify）を維持
- タブUIの使いやすさ確認
- レスポンシブデザイン対応

### 状態管理
- 設定変更の即座反映
- 保存前の確認ダイアログ（必要に応じて）
- エラーハンドリング

## 📚 参考資料

- Vue 3 Composition API
- Vuetify Tabs Component
- 親チケット #215

## 🎯 作業見積もり

- **作業時間**: 1-2日
  - 設計・分析: 0.5日
  - コンポーネント実装: 1日
  - テスト作成・確認: 0.5日
- **優先度**: P2
- **サイズ**: size:M

## ラベル
priority:P2,size:M,type-basic:refactor

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
npm run start-issue 253

# 作業完了後PR作成  
npm run create-pr "fix: Issue #253 views/SettingPage.vue リファクタリング（622行→タブ別コンポーネント分割）" "Issue #253の対応

Closes #253"
```

## Claude Code用プロンプト
```
Issue #253の対応をお願いします。

タイトル: views/SettingPage.vue リファクタリング（622行→タブ別コンポーネント分割）
ラベル: priority:P2,size:M,type-basic:refactor

内容:
## 親チケット

#215 (優先度2: UI/UX改善 - 子チケット3)

## 📝 概要

`views/SettingPage.vue`（622行）をタブ別コンポーネントに分割し、保守性・可読性を向上させます。

## 🎯 目的・背景

### 現状の問題
- **行数**: 622行（推奨上限500行を超過）
- **複雑度**: 複数の設定セクションが1つのコンポーネントに集約
- **保守性**: 設定項目追加時の影響範囲が広い
- **テスト**: 単一コンポーネントで全設定をテスト

### リファクタリング後の構造

```
Before: views/SettingPage.vue (622行)

After:  views/SettingPage.vue (200行：親コンポーネント・タブ管理)
        components/settings/
        ├── ProfileSettings.vue       (プロフィール設定)
        ├── SecuritySettings.vue      (セキュリティ設定)
        ├── NotificationSettings.vue  (通知設定)
        └── AppearanceSettings.vue    (外観設定)
```

## ✅ 受け入れ条件

- [ ] `components/settings/` ディレクトリに4つのタブコンポーネント作成
- [ ] 各コンポーネントが200行以下
- [ ] 親コンポーネント（SettingPage.vue）が200行以下
- [ ] タブ切り替え機能の実装
- [ ] 既存の設定機能が全て動作
- [ ] 型安全性維持（`any`型追加なし）
- [ ] 各タブコンポーネントのユニットテスト追加

## 🔧 実装手順

### Step 1: 現状分析

```bash
# 現在のSettingPage.vueを確認
cat src/views/SettingPage.vue | wc -l

# 設定セクションの特定
grep -n "section" src/views/SettingPage.vue
```

### Step 2: ブランチ作成

```bash
git checkout main
git pull origin main
git checkout -b feature/refactor-settings-page

mkdir -p src/components/settings
```

### Step 3: コンポーネント分割

**ProfileSettings.vue** (プロフィール設定)
- ユーザー名変更
- メールアドレス変更
- プロフィール画像設定
- アカウント情報表示

**SecuritySettings.vue** (セキュリティ設定)
- パスワード変更
- 二段階認証設定
- セッション管理
- ログイン履歴表示

**NotificationSettings.vue** (通知設定)
- メール通知設定
- プッシュ通知設定
- 通知頻度設定
- 通知カテゴリ選択

**AppearanceSettings.vue** (外観設定)
- テーマ選択（ライト/ダーク）
- 言語設定
- フォントサイズ設定
- レイアウト設定

**SettingPage.vue** (親コンポーネント)
```vue
<template>
  <v-container>
    <v-tabs v-model="activeTab">
      <v-tab value="profile">プロフィール</v-tab>
      <v-tab value="security">セキュリティ</v-tab>
      <v-tab value="notifications">通知</v-tab>
      <v-tab value="appearance">外観</v-tab>
    </v-tabs>

    <v-window v-model="activeTab">
      <v-window-item value="profile">
        <ProfileSettings />
      </v-window-item>
      <v-window-item value="security">
        <SecuritySettings />
      </v-window-item>
      <v-window-item value="notifications">
        <NotificationSettings />
      </v-window-item>
      <v-window-item value="appearance">
        <AppearanceSettings />
      </v-window-item>
    </v-window>
  </v-container>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import ProfileSettings from '@/components/settings/ProfileSettings.vue'
import SecuritySettings from '@/components/settings/SecuritySettings.vue'
import NotificationSettings from '@/components/settings/NotificationSettings.vue'
import AppearanceSettings from '@/components/settings/AppearanceSettings.vue'

const activeTab = ref('profile')
</script>
```

### Step 4: 状態管理の整理

```bash
# 設定用のPiniaストア作成（必要に応じて）
src/stores/settings.ts
```

### Step 5: テスト作成

```bash
# 各タブコンポーネントのテスト作成
tests/components/settings/
├── ProfileSettings.spec.ts
├── SecuritySettings.spec.ts
├── NotificationSettings.spec.ts
└── AppearanceSettings.spec.ts

# 親コンポーネントのE2Eテスト
tests/e2e/settings-page.spec.ts
```

### Step 6: 動作確認

```bash
# 開発サーバーで動作確認
npm run dev

# ユニットテスト
npm run test:unit -- tests/components/settings/

# E2Eテスト
npm run test:e2e -- tests/e2e/settings-page.spec.ts

# 全品質チェック
npm run ci:all
```

### Step 7: コミット・PR作成

```bash
git add src/views/SettingPage.vue src/components/settings/
git commit -m "refactor: split SettingPage into tab-based components"
git push -u origin feature/refactor-settings-page
npm run create-pr
```

## 🧪 テスト要件

**コンポーネントテスト**
- [ ] ProfileSettings: ユーザー情報更新テスト
- [ ] SecuritySettings: パスワード変更・2FA設定テスト
- [ ] NotificationSettings: 通知設定変更テスト
- [ ] AppearanceSettings: テーマ・言語切り替えテスト

**統合テスト**
- [ ] タブ切り替え動作確認
- [ ] 設定保存・読み込み確認
- [ ] バリデーションエラー処理確認

**E2Eテスト**
- [ ] 設定画面遷移
- [ ] 各タブの設定変更フロー
- [ ] 設定反映確認

## 📊 期待される効果

### 定量的効果
- ファイル行数: 622行 → 各100-150行（5ファイル）
- 単一責任の明確化: 1コンポーネント4責任 → 1コンポーネント1責任
- テスト粒度: 1ファイル → 5ファイル

### 定性的効果
- 新しい設定項目追加が容易
- 各設定セクションの独立性向上
- コードレビューの効率化
- ユーザー体験の向上（タブによる整理）

## 🚨 注意事項

### UI/UX整合性
- 既存のデザインシステム（Vuetify）を維持
- タブUIの使いやすさ確認
- レスポンシブデザイン対応

### 状態管理
- 設定変更の即座反映
- 保存前の確認ダイアログ（必要に応じて）
- エラーハンドリング

## 📚 参考資料

- Vue 3 Composition API
- Vuetify Tabs Component
- 親チケット #215

## 🎯 作業見積もり

- **作業時間**: 1-2日
  - 設計・分析: 0.5日
  - コンポーネント実装: 1日
  - テスト作成・確認: 0.5日
- **優先度**: P2
- **サイズ**: size:M
```

---
Generated: 2025-11-17 17:03:58
Source: https://github.com/hirata97/GoalCategorizationDiary/issues/253
