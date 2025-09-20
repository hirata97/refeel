# Issue #137: [Bug] Terser依存関係不足によりビルドが失敗する

## 概要
## 🐛 バグ概要
Vite v3以降でTerserが依存関係から外されたため、本番ビルド時にエラーが発生しビルドが完全に失敗している。

## 🔄 再現手順
1. `npm run build` を実行
2. ビルドプロセスが開始される
3. Terser圧縮処理でエラー発生

## 🎯 期待される動作
- 本番ビルドが正常に完了する
- 圧縮されたJavaScriptファイルが生成される
- デプロイ可能なdistフォルダが作成される

## ❌ 実際の動作
```
error during build:
[vite:terser] terser not found. Since Vite v3, terser has become an optional dependency. You need to install it.
    at loadTerserPath (file:///home/mizuki/projects/GoalCategorizationDiary/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:19705:13)
    at Object.renderChunk (file:///home/mizuki/projects/GoalCategorizationDiary/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:19740:27)
ERROR: "build-only" exited with 1.
```

## 🖥️ 環境情報
- Node.js: v18+
- Vite: v5.4.19
- OS: Linux (WSL2)
- Build Tool: npm run-p

## 🔧 調査情報
- Vite v3以降、Terserはオプショナル依存関係に変更された
- package.jsonにTerser依存関係が不足
- ビルド設定（vite.config.ts）でTerser使用を前提としている

## 🚨 影響度
- [x] 機能停止（本番ビルド不可）
- [x] パフォーマンス低下（デプロイ不可）
- [ ] UI表示問題
- [ ] データ不整合

## 🔧 修正方法
```bash
npm install --save-dev terser
```

## ✅ 受け入れ条件
- [ ] Terserパッケージの追加
- [ ] 本番ビルドの正常完了確認
- [ ] Vercelデプロイの動作確認

## ラベル
priority:P0,size:S,type-basic:bugfix

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
npm run start-issue 137

# 作業完了後PR作成  
npm run create-pr "fix: Issue #137 [Bug] Terser依存関係不足によりビルドが失敗する" "Issue #137の対応

Closes #137"
```

## Claude Code用プロンプト
```
Issue #137の対応をお願いします。

タイトル: [Bug] Terser依存関係不足によりビルドが失敗する
ラベル: priority:P0,size:S,type-basic:bugfix

内容:
## 🐛 バグ概要
Vite v3以降でTerserが依存関係から外されたため、本番ビルド時にエラーが発生しビルドが完全に失敗している。

## 🔄 再現手順
1. `npm run build` を実行
2. ビルドプロセスが開始される
3. Terser圧縮処理でエラー発生

## 🎯 期待される動作
- 本番ビルドが正常に完了する
- 圧縮されたJavaScriptファイルが生成される
- デプロイ可能なdistフォルダが作成される

## ❌ 実際の動作
```
error during build:
[vite:terser] terser not found. Since Vite v3, terser has become an optional dependency. You need to install it.
    at loadTerserPath (file:///home/mizuki/projects/GoalCategorizationDiary/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:19705:13)
    at Object.renderChunk (file:///home/mizuki/projects/GoalCategorizationDiary/node_modules/vite/dist/node/chunks/dep-C6uTJdX2.js:19740:27)
ERROR: "build-only" exited with 1.
```

## 🖥️ 環境情報
- Node.js: v18+
- Vite: v5.4.19
- OS: Linux (WSL2)
- Build Tool: npm run-p

## 🔧 調査情報
- Vite v3以降、Terserはオプショナル依存関係に変更された
- package.jsonにTerser依存関係が不足
- ビルド設定（vite.config.ts）でTerser使用を前提としている

## 🚨 影響度
- [x] 機能停止（本番ビルド不可）
- [x] パフォーマンス低下（デプロイ不可）
- [ ] UI表示問題
- [ ] データ不整合

## 🔧 修正方法
```bash
npm install --save-dev terser
```

## ✅ 受け入れ条件
- [ ] Terserパッケージの追加
- [ ] 本番ビルドの正常完了確認
- [ ] Vercelデプロイの動作確認
```

---
Generated: 2025-09-20 14:41:54
Source: https://github.com/RsPYP/GoalCategorizationDiary/issues/137
