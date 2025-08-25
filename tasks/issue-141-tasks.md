# Issue #141: [Enhancement] DiaryViewPage.vueのコード最適化 - 未使用変数の整理

## 概要
## 📝 機能概要
DiaryViewPage.vueで発生している未使用変数のESLintエラーを解消し、コード品質を向上させる。

## 🎯 目的・背景
リンティングエラーにより開発効率が低下している。以下3つの変数が定義されているが使用されていない状態。

## ❌ 現在のESLintエラー
```
/home/mizuki/projects/GoalCategorizationDiary/src/views/DiaryViewPage.vue
  151:3  error  'moodStats' is assigned a value but never used
  214:7  error  'getMoodColor' is assigned a value but never used  
  238:7  error  'handlePageSizeChange' is assigned a value but never used
```

## 🔧 各変数の調査と対応方針

### 1. moodStats (Line 151)
- **機能**: 気分統計データの計算
- **対応**: 統計表示機能として実装するか削除

### 2. getMoodColor (Line 214)
- **機能**: 気分に応じた色の取得
- **対応**: UI表示機能として活用するか削除

### 3. handlePageSizeChange (Line 238)  
- **機能**: ページサイズ変更のハンドラー
- **対応**: ページネーション機能として実装するか削除

## ✅ 受け入れ条件
- [ ] 3つの未使用変数エラーの解消
- [ ] ESLint警告ゼロの達成
- [ ] 機能実装 or 変数削除の決定
- [ ] コード品質の向上確認

## 🎨 UI/UX要件（機能実装する場合）
- moodStats: ダッシュボードでの統計表示
- getMoodColor: 日記エントリの視覚的色分け
- handlePageSizeChange: ページネーション機能

## 🔧 技術的要件
- ESLint規則準拠（@typescript-eslint/no-unused-vars）
- Vue 3 Composition API最適化
- 既存機能への影響なし

## 🧪 テスト要件
- [ ] リンティングエラー解消確認
- [ ] DiaryViewPage動作確認
- [ ] 実装機能のテスト（該当時）

## 📚 参考資料
- [ESLintルール設定](eslint.config.js)
- [コーディング規則](docs/DEVELOPMENT/CODING_STANDARDS.md)

## ラベル
priority:P2,size:S,type-basic:enhancement

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
npm run start-issue 141

# 作業完了後PR作成  
npm run create-pr "fix: Issue #141 [Enhancement] DiaryViewPage.vueのコード最適化 - 未使用変数の整理" "Issue #141の対応

Closes #141"
```

## Claude Code用プロンプト
```
Issue #141の対応をお願いします。

タイトル: [Enhancement] DiaryViewPage.vueのコード最適化 - 未使用変数の整理
ラベル: priority:P2,size:S,type-basic:enhancement

内容:
## 📝 機能概要
DiaryViewPage.vueで発生している未使用変数のESLintエラーを解消し、コード品質を向上させる。

## 🎯 目的・背景
リンティングエラーにより開発効率が低下している。以下3つの変数が定義されているが使用されていない状態。

## ❌ 現在のESLintエラー
```
/home/mizuki/projects/GoalCategorizationDiary/src/views/DiaryViewPage.vue
  151:3  error  'moodStats' is assigned a value but never used
  214:7  error  'getMoodColor' is assigned a value but never used  
  238:7  error  'handlePageSizeChange' is assigned a value but never used
```

## 🔧 各変数の調査と対応方針

### 1. moodStats (Line 151)
- **機能**: 気分統計データの計算
- **対応**: 統計表示機能として実装するか削除

### 2. getMoodColor (Line 214)
- **機能**: 気分に応じた色の取得
- **対応**: UI表示機能として活用するか削除

### 3. handlePageSizeChange (Line 238)  
- **機能**: ページサイズ変更のハンドラー
- **対応**: ページネーション機能として実装するか削除

## ✅ 受け入れ条件
- [ ] 3つの未使用変数エラーの解消
- [ ] ESLint警告ゼロの達成
- [ ] 機能実装 or 変数削除の決定
- [ ] コード品質の向上確認

## 🎨 UI/UX要件（機能実装する場合）
- moodStats: ダッシュボードでの統計表示
- getMoodColor: 日記エントリの視覚的色分け
- handlePageSizeChange: ページネーション機能

## 🔧 技術的要件
- ESLint規則準拠（@typescript-eslint/no-unused-vars）
- Vue 3 Composition API最適化
- 既存機能への影響なし

## 🧪 テスト要件
- [ ] リンティングエラー解消確認
- [ ] DiaryViewPage動作確認
- [ ] 実装機能のテスト（該当時）

## 📚 参考資料
- [ESLintルール設定](eslint.config.js)
- [コーディング規則](docs/DEVELOPMENT/CODING_STANDARDS.md)
```

---
Generated: 2025-08-25 11:59:04
Source: https://github.com/RsPYP/GoalCategorizationDiary/issues/141
