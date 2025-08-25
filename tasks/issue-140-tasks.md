# Issue #140: [Enhancement] 設定画面コンポーネントの型定義整備

## 概要
## 📝 機能概要
設定画面関連コンポーネントで発生している型エラーを解消し、プロパティ名の統一と不足機能を追加する。

## 🎯 目的・背景
現在、設定画面の以下のコンポーネントで型エラーが発生し、機能制限が生じている：
- ユーザープロファイル設定の表示・編集制限
- 通知設定の一部機能が利用不可
- テーマ設定の状態管理問題

## ❌ 現在の問題箇所

### ProfileSettingsCard.vue
- `avatar_url` vs `avatarUrl` プロパティ名不一致 (Line 17, 20, 21, 42)
- `display_name` vs `displayName` 不一致 (Line 67)
- 存在しないプロパティ:
  - `bio` (Line 102)
  - `preferred_language` (Line 121)
  - `public_profile` (Line 156)
  - `show_achievements` (Line 164)

### NotificationSettingsCard.vue
- 存在しないプロパティ:
  - `reminderDays` (Line 87)
  - `goalDeadlineAlert` (Line 107)  
  - `achievementNotification` (Line 118)

### ThemeSettingsCard.vue
- 存在しないプロパティ:
  - `currentTheme` (Line 95, 143, 150)

## ✅ 受け入れ条件
- [ ] プロパティ名の統一（camelCase vs snake_case）
- [ ] UserProfile型定義の拡張
- [ ] NotificationSettings型定義の拡張
- [ ] ThemeStore型定義の修正
- [ ] 設定画面の動作確認（プロファイル・通知・テーマ）
- [ ] 型チェックエラーの完全解消

## 🎨 UI/UX要件
- 既存の設定画面レイアウトを維持
- ユーザビリティを損なわない形での型整備
- 設定変更の即座反映機能維持

## 🔧 技術的要件
- TypeScript strict mode対応
- Pinia状態管理との整合性
- Supabaseデータ型との一致
- Vue 3 Composition API準拠

## 🧪 テスト要件
- [ ] 型定義の正確性確認
- [ ] 設定画面の表示テスト
- [ ] 設定変更機能のテスト

## 📚 参考資料
- [TypeScript型エラー詳細](#138)
- [設定画面実装ガイド](docs/DEVELOPMENT/COMPONENT_GUIDE.md)

## ラベル
priority:P1,size:M,type-basic:enhancement

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
npm run start-issue 140

# 作業完了後PR作成  
npm run create-pr "fix: Issue #140 [Enhancement] 設定画面コンポーネントの型定義整備" "Issue #140の対応

Closes #140"
```

## Claude Code用プロンプト
```
Issue #140の対応をお願いします。

タイトル: [Enhancement] 設定画面コンポーネントの型定義整備
ラベル: priority:P1,size:M,type-basic:enhancement

内容:
## 📝 機能概要
設定画面関連コンポーネントで発生している型エラーを解消し、プロパティ名の統一と不足機能を追加する。

## 🎯 目的・背景
現在、設定画面の以下のコンポーネントで型エラーが発生し、機能制限が生じている：
- ユーザープロファイル設定の表示・編集制限
- 通知設定の一部機能が利用不可
- テーマ設定の状態管理問題

## ❌ 現在の問題箇所

### ProfileSettingsCard.vue
- `avatar_url` vs `avatarUrl` プロパティ名不一致 (Line 17, 20, 21, 42)
- `display_name` vs `displayName` 不一致 (Line 67)
- 存在しないプロパティ:
  - `bio` (Line 102)
  - `preferred_language` (Line 121)
  - `public_profile` (Line 156)
  - `show_achievements` (Line 164)

### NotificationSettingsCard.vue
- 存在しないプロパティ:
  - `reminderDays` (Line 87)
  - `goalDeadlineAlert` (Line 107)  
  - `achievementNotification` (Line 118)

### ThemeSettingsCard.vue
- 存在しないプロパティ:
  - `currentTheme` (Line 95, 143, 150)

## ✅ 受け入れ条件
- [ ] プロパティ名の統一（camelCase vs snake_case）
- [ ] UserProfile型定義の拡張
- [ ] NotificationSettings型定義の拡張
- [ ] ThemeStore型定義の修正
- [ ] 設定画面の動作確認（プロファイル・通知・テーマ）
- [ ] 型チェックエラーの完全解消

## 🎨 UI/UX要件
- 既存の設定画面レイアウトを維持
- ユーザビリティを損なわない形での型整備
- 設定変更の即座反映機能維持

## 🔧 技術的要件
- TypeScript strict mode対応
- Pinia状態管理との整合性
- Supabaseデータ型との一致
- Vue 3 Composition API準拠

## 🧪 テスト要件
- [ ] 型定義の正確性確認
- [ ] 設定画面の表示テスト
- [ ] 設定変更機能のテスト

## 📚 参考資料
- [TypeScript型エラー詳細](#138)
- [設定画面実装ガイド](docs/DEVELOPMENT/COMPONENT_GUIDE.md)
```

---
Generated: 2025-08-25 14:20:55
Source: https://github.com/RsPYP/GoalCategorizationDiary/issues/140
