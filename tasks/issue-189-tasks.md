# Issue #189: [Feature] 日記編集機能で感情タグ統合

## 概要
## 📝 機能概要
日記編集機能において感情タグの表示・編集機能を実装します。DiaryEditPageにEmotionTagSelectorを統合し、既存の感情タグを読み込み、編集・更新できるようにします。

## 🎯 目的・背景
- 現在、日記編集時に感情タグの表示・編集ができない
- 感情タグは作成時のみ設定可能で、後からの変更ができない
- 完全な感情タグ機能統合のために編集機能が必要
- 親チケット #185 の実装フェーズ3

## ✅ 受け入れ条件
- [ ] 日記編集画面にEmotionTagSelectorが表示される
- [ ] 既存日記の感情タグが正しく読み込まれ、選択状態で表示される
- [ ] 感情タグの追加・削除が可能
- [ ] 更新時に感情タグの変更が正しく保存される
- [ ] 感情タグが存在しない場合の適切な表示
- [ ] エラーハンドリング（感情タグ保存失敗時の処理）

## 🎨 UI/UX要件
- 気分セレクターの後に感情タグセレクターを配置
- 既存の選択状態を正確に反映
- 保存エラー時の適切なフィードバック表示
- 既存のフォームデザインとの一貫性維持

## 🔧 技術的要件
- DiaryEditPage.vue にEmotionTagSelector統合
- 既存感情タグの取得と初期状態設定
- 更新時の感情タグ保存処理実装
- エラーハンドリングとユーザーフィードバック

## 🧪 テスト要件
- [ ] 既存感情タグの正しい読み込み確認
- [ ] 感情タグ更新処理のテスト
- [ ] エラーケースのハンドリングテスト

## 📚 参考資料
- EmotionTagSelectorコンポーネント（既存実装）
- src/views/DiaryEditPage.vue
- src/stores/emotionTags.ts
- DiaryRegisterPage.vueでの実装パターン

**見積り**: 4-5時間
**依存関係**: EmotionTagChipsコンポーネント完成（#186, #187）

## 実装予定ファイル
- src/views/DiaryEditPage.vue（EmotionTagSelector統合）
- 必要に応じてemotionTagsStoreの拡張
- tests/views/DiaryEditPage_emotion_tags.spec.ts（統合テスト）

## 実装手順
1. DiaryEditPage.vueにEmotionTagSelectorを追加
2. 既存感情タグ読み込み処理実装（loadDiary関数拡張）
3. 更新処理に感情タグ保存を統合（updateDiary関数拡張）
4. エラーハンドリング・ユーザーフィードバック実装
5. テスト作成と動作確認

## ラベル
priority:P1,size:S,type-basic:feature

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
npm run start-issue 189

# 作業完了後PR作成  
npm run create-pr "fix: Issue #189 [Feature] 日記編集機能で感情タグ統合" "Issue #189の対応

Closes #189"
```

## Claude Code用プロンプト
```
Issue #189の対応をお願いします。

タイトル: [Feature] 日記編集機能で感情タグ統合
ラベル: priority:P1,size:S,type-basic:feature

内容:
## 📝 機能概要
日記編集機能において感情タグの表示・編集機能を実装します。DiaryEditPageにEmotionTagSelectorを統合し、既存の感情タグを読み込み、編集・更新できるようにします。

## 🎯 目的・背景
- 現在、日記編集時に感情タグの表示・編集ができない
- 感情タグは作成時のみ設定可能で、後からの変更ができない
- 完全な感情タグ機能統合のために編集機能が必要
- 親チケット #185 の実装フェーズ3

## ✅ 受け入れ条件
- [ ] 日記編集画面にEmotionTagSelectorが表示される
- [ ] 既存日記の感情タグが正しく読み込まれ、選択状態で表示される
- [ ] 感情タグの追加・削除が可能
- [ ] 更新時に感情タグの変更が正しく保存される
- [ ] 感情タグが存在しない場合の適切な表示
- [ ] エラーハンドリング（感情タグ保存失敗時の処理）

## 🎨 UI/UX要件
- 気分セレクターの後に感情タグセレクターを配置
- 既存の選択状態を正確に反映
- 保存エラー時の適切なフィードバック表示
- 既存のフォームデザインとの一貫性維持

## 🔧 技術的要件
- DiaryEditPage.vue にEmotionTagSelector統合
- 既存感情タグの取得と初期状態設定
- 更新時の感情タグ保存処理実装
- エラーハンドリングとユーザーフィードバック

## 🧪 テスト要件
- [ ] 既存感情タグの正しい読み込み確認
- [ ] 感情タグ更新処理のテスト
- [ ] エラーケースのハンドリングテスト

## 📚 参考資料
- EmotionTagSelectorコンポーネント（既存実装）
- src/views/DiaryEditPage.vue
- src/stores/emotionTags.ts
- DiaryRegisterPage.vueでの実装パターン

**見積り**: 4-5時間
**依存関係**: EmotionTagChipsコンポーネント完成（#186, #187）

## 実装予定ファイル
- src/views/DiaryEditPage.vue（EmotionTagSelector統合）
- 必要に応じてemotionTagsStoreの拡張
- tests/views/DiaryEditPage_emotion_tags.spec.ts（統合テスト）

## 実装手順
1. DiaryEditPage.vueにEmotionTagSelectorを追加
2. 既存感情タグ読み込み処理実装（loadDiary関数拡張）
3. 更新処理に感情タグ保存を統合（updateDiary関数拡張）
4. エラーハンドリング・ユーザーフィードバック実装
5. テスト作成と動作確認
```

---
Generated: 2025-09-20 14:35:08
Source: https://github.com/RsPYP/GoalCategorizationDiary/issues/189
