# Issue #142: [Refactor] ユニットテストの修正と品質向上

## 概要
## 📝 機能概要
複数のテストスイートで発生している失敗を修正し、CI/CDパイプラインとテスト品質を向上させる。

## 🎯 目的・背景
現在多数のユニットテストが失敗しており、以下の問題が発生：
- CI/CDパイプラインの不安定化
- 品質保証プロセスの阻害  
- 新機能開発時の回帰テスト不備

## ❌ 主な失敗テスト分類

### 1. AuthStore関連テスト
```
AuthStore.setSession is not a function
```
- **原因**: AuthStoreのsetSessionメソッド未実装
- **影響**: 認証フローのテストが全て失敗

### 2. DataStore関連テスト  
```
[vitest] No "supabase" export is defined on the "@/lib/supabase" mock
```
- **原因**: Supabaseモック設定の不備
- **影響**: データ操作関連テスト(12件失敗)

### 3. セキュリティ関連テスト
```
Cannot read properties of undefined (reading 'digest')
```
- **原因**: パスワードハッシュ化機能の実装不備
- **影響**: セキュリティ機能テスト(9件失敗)

### 4. 2FA認証テスト
```
expected 'https://api.qrserver.com/v1/create-qr…' to contain 'test%40example.com'
```
- **原因**: QRコード生成URLのエンコーディング問題

### 5. 暗号化機能テスト
```
promise resolved "undefined" instead of rejecting
```
- **原因**: KeyManagerエラーハンドリング不備

## ✅ 受け入れ条件
- [ ] AuthStore.setSessionメソッド実装
- [ ] Supabaseモック設定修正
- [ ] セキュリティ機能実装完了
- [ ] 2FA QRコード生成修正
- [ ] 暗号化機能エラーハンドリング修正
- [ ] 全テストスイート成功率90%以上達成
- [ ] CI/CDパイプライン安定化

## 🔧 技術的要件
- Vitest 2.1+ 対応
- Supabaseクライアントモック最適化
- セキュリティ機能との整合性
- テストカバレッジ維持・向上

## 🧪 テスト要件
- [ ] 各テストスイートの個別確認
- [ ] 統合テスト実行確認
- [ ] CI/CD環境でのテスト成功確認

## 📚 参考資料
- [テストガイド](docs/DEVELOPMENT/PR_TESTING_GUIDE.md)
- [セキュリティ実装不足](#139)
- [認証機能仕様](docs/SUPABASE_AUTH.md)

## ラベル
priority:P2,size:M,type-quality:test

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
npm run start-issue 142

# 作業完了後PR作成  
npm run create-pr "fix: Issue #142 [Refactor] ユニットテストの修正と品質向上" "Issue #142の対応

Closes #142"
```

## Claude Code用プロンプト
```
Issue #142の対応をお願いします。

タイトル: [Refactor] ユニットテストの修正と品質向上
ラベル: priority:P2,size:M,type-quality:test

内容:
## 📝 機能概要
複数のテストスイートで発生している失敗を修正し、CI/CDパイプラインとテスト品質を向上させる。

## 🎯 目的・背景
現在多数のユニットテストが失敗しており、以下の問題が発生：
- CI/CDパイプラインの不安定化
- 品質保証プロセスの阻害  
- 新機能開発時の回帰テスト不備

## ❌ 主な失敗テスト分類

### 1. AuthStore関連テスト
```
AuthStore.setSession is not a function
```
- **原因**: AuthStoreのsetSessionメソッド未実装
- **影響**: 認証フローのテストが全て失敗

### 2. DataStore関連テスト  
```
[vitest] No "supabase" export is defined on the "@/lib/supabase" mock
```
- **原因**: Supabaseモック設定の不備
- **影響**: データ操作関連テスト(12件失敗)

### 3. セキュリティ関連テスト
```
Cannot read properties of undefined (reading 'digest')
```
- **原因**: パスワードハッシュ化機能の実装不備
- **影響**: セキュリティ機能テスト(9件失敗)

### 4. 2FA認証テスト
```
expected 'https://api.qrserver.com/v1/create-qr…' to contain 'test%40example.com'
```
- **原因**: QRコード生成URLのエンコーディング問題

### 5. 暗号化機能テスト
```
promise resolved "undefined" instead of rejecting
```
- **原因**: KeyManagerエラーハンドリング不備

## ✅ 受け入れ条件
- [ ] AuthStore.setSessionメソッド実装
- [ ] Supabaseモック設定修正
- [ ] セキュリティ機能実装完了
- [ ] 2FA QRコード生成修正
- [ ] 暗号化機能エラーハンドリング修正
- [ ] 全テストスイート成功率90%以上達成
- [ ] CI/CDパイプライン安定化

## 🔧 技術的要件
- Vitest 2.1+ 対応
- Supabaseクライアントモック最適化
- セキュリティ機能との整合性
- テストカバレッジ維持・向上

## 🧪 テスト要件
- [ ] 各テストスイートの個別確認
- [ ] 統合テスト実行確認
- [ ] CI/CD環境でのテスト成功確認

## 📚 参考資料
- [テストガイド](docs/DEVELOPMENT/PR_TESTING_GUIDE.md)
- [セキュリティ実装不足](#139)
- [認証機能仕様](docs/SUPABASE_AUTH.md)
```

---
Generated: 2025-08-25 12:16:12
Source: https://github.com/RsPYP/GoalCategorizationDiary/issues/142
