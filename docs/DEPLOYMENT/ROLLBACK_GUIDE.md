# ロールバック手順ガイド

> **対象**: デプロイ担当者・運用担当者
> **最終更新**: 2025-12-27
> **関連Issue**: #317

## 📝 概要

本番環境でデプロイ後に問題が発生した場合のロールバック（以前のバージョンへの復帰）手順を説明します。

## 🎯 ロールバックが必要なケース

### 即座にロールバックすべき状況（Critical）

- ✅ アプリケーションが完全に停止している
- ✅ ユーザー認証が機能しない
- ✅ データ破損のリスクがある
- ✅ セキュリティ脆弱性が発見された
- ✅ エラー率が50%を超えている

### 検討すべき状況（High）

- ⚠️ 一部機能が動作しない
- ⚠️ パフォーマンスが著しく低下している
- ⚠️ エラー率が10-50%の範囲
- ⚠️ ユーザーからの問い合わせが急増

### 修正PRで対応可能な状況（Low/Medium）

- 📝 軽微なUI不具合
- 📝 非重要機能の不具合
- 📝 エラー率が10%未満
- 📝 修正が30分以内に完了できる

## 🔄 ロールバック方法（3つの選択肢）

### 方法1: Vercel Dashboardによるロールバック（推奨・最速）

**特徴**:
- ✅ 最速（約30秒）
- ✅ GUI操作で簡単
- ✅ ビルド不要
- ✅ 失敗リスクが低い

**手順**:

1. **Vercel Dashboardにアクセス**
   ```
   https://vercel.com/dashboard
   ```

2. **プロジェクトを選択**
   - `hirata97/GoalCategorizationDiary` を選択

3. **Deploymentsタブを開く**
   - 左メニューから"Deployments"をクリック

4. **前回の成功したデプロイを探す**
   - デプロイ履歴が時系列で表示される
   - "Ready" ステータスのデプロイを選択
   - "Production" ラベルがついているもの（現在）の直前を選択

5. **ロールバック実行**
   - 選択したデプロイの右側にある"..."メニューをクリック
   - "Promote to Production"を選択
   - 確認ダイアログで"Promote"をクリック

6. **ロールバック完了確認**
   - ステータスが"Promoting..."から"Ready"に変わることを確認
   - 本番URLにアクセスして動作確認
   - 所要時間: 約30秒

**確認コマンド**:
```bash
# デプロイ状況確認
curl -I https://refeel.vercel.app

# 期待: HTTP/2 200
```

### 方法2: Git revertによるロールバック

**特徴**:
- ✅ Git履歴に記録される
- ✅ コードレビュー可能
- ⚠️ ビルド時間が必要（約2-3分）
- ⚠️ CI/CDパイプラインを通る

**手順**:

1. **問題のあるコミットを特定**
   ```bash
   # 最近のコミット履歴確認
   git log --oneline -10

   # 例:
   # a1b2c3d Fix: Update feature X
   # e4f5g6h Merge pull request #123
   # h7i8j9k Add: New feature Y  ← 問題のあるコミット
   ```

2. **revertコミット作成**
   ```bash
   # 問題のあるコミットをrevert
   git revert h7i8j9k

   # コミットメッセージ例:
   # Revert "Add: New feature Y"
   #
   # This reverts commit h7i8j9k.
   # Reason: Critical bug causing authentication failures
   ```

3. **revertをpush**
   ```bash
   # mainブランチにpush
   git push origin main
   ```

4. **Vercelの自動デプロイを待つ**
   - Vercel Dashboardでビルド状況を確認
   - 所要時間: 約2-3分

5. **動作確認**
   ```bash
   # 本番URLにアクセス
   curl -I https://refeel.vercel.app
   ```

**注意事項**:
- ⚠️ 複数のコミットを一度にrevertする場合は逆順で実行
- ⚠️ データベースマイグレーションがある場合は別途手動対応が必要

### 方法3: Vercel CLIによるロールバック

**特徴**:
- ✅ コマンドラインで完結
- ✅ 比較的高速（約1分）
- ⚠️ Vercel CLIのインストールが必要

**前提条件**:
```bash
# Vercel CLIインストール
npm install -g vercel

# ログイン
vercel login
```

**手順**:

1. **現在のデプロイ一覧確認**
   ```bash
   vercel ls

   # 例:
   # Production: https://refeel.vercel.app (a1b2c3d)
   # Latest: https://refeel-git-main.vercel.app (e4f5g6h)
   ```

2. **ロールバック実行**
   ```bash
   # 直前のデプロイにロールバック
   vercel rollback

   # または、特定のデプロイURLにロールバック
   vercel rollback https://refeel-e4f5g6h.vercel.app
   ```

3. **ロールバック完了確認**
   ```bash
   # デプロイ状況確認
   vercel ls

   # 本番URLにアクセス
   curl -I https://refeel.vercel.app
   ```

**所要時間**: 約1分

## 📋 ロールバックチェックリスト

### ロールバック前

- [ ] 問題の重大性を評価（Critical/High/Medium/Low）
- [ ] 影響を受けるユーザー数を推定
- [ ] ロールバック方法を決定（方法1/2/3）
- [ ] 関係者に通知（必要に応じて）
- [ ] 現在のデプロイURLを記録

### ロールバック実施

- [ ] ロールバック手順を実行
- [ ] ロールバック完了を確認
- [ ] 基本機能の動作確認
  - [ ] トップページアクセス
  - [ ] ログイン機能
  - [ ] 主要機能の動作
- [ ] エラーログ確認（Vercel/Supabase）

### ロールバック後

- [ ] ユーザーへの通知（必要に応じて）
- [ ] 問題の根本原因を調査
- [ ] 修正PRを作成
- [ ] テスト実施（ローカル + CI/CD）
- [ ] レビュー・承認
- [ ] 再デプロイ
- [ ] ポストモーテム作成（重大な問題の場合）

## 📊 ロールバック所要時間目安

| 方法 | 所要時間 | 推奨度 | 難易度 |
|------|----------|--------|--------|
| 方法1: Vercel Dashboard | 約30秒 | ★★★★★ | 易 |
| 方法2: Git revert | 約2-3分 | ★★★☆☆ | 中 |
| 方法3: Vercel CLI | 約1分 | ★★★★☆ | 中 |

## 🎯 ロールバック判断フロー

```
問題発生
  ↓
Critical? (アプリ停止・認証不可・データ破損リスク)
  ↓ YES → 即座に方法1でロールバック
  ↓ NO
  ↓
High? (一部機能停止・パフォーマンス低下・エラー率10-50%)
  ↓ YES → 30分以内に修正可能?
  |         ↓ NO → 方法1でロールバック
  |         ↓ YES → 修正PR作成・マージ
  ↓ NO
  ↓
Low/Medium? (軽微な不具合・エラー率10%未満)
  ↓ YES → 修正PR作成・マージ（ロールバック不要）
```

## 🚨 緊急時の連絡先

### プロジェクト内部

- **GitHub Issues**: 問題報告・追跡
  - https://github.com/hirata97/GoalCategorizationDiary/issues
- **Pull Requests**: 修正提案
  - https://github.com/hirata97/GoalCategorizationDiary/pulls

### 外部サポート

- **Vercelサポート**: デプロイ・インフラ関連
  - https://vercel.com/support
- **Supabaseサポート**: データベース・認証関連
  - https://supabase.com/support

## 📝 ロールバック履歴テンプレート

ロールバックを実施した場合、以下の情報を記録してください：

```markdown
## ロールバック実施記録

**日時**: YYYY-MM-DD HH:MM
**実施者**: [名前/ID]
**方法**: [方法1/2/3]
**対象デプロイ**: [コミットハッシュまたはデプロイURL]
**ロールバック先**: [コミットハッシュまたはデプロイURL]

### 問題の概要
- 発生した問題
- 影響範囲
- 重大性レベル

### ロールバック理由
- 即座に修正できない理由
- ユーザー影響の範囲

### 所要時間
- ロールバック実施: X分
- 動作確認: X分
- 合計: X分

### 事後対応
- [ ] 根本原因の調査
- [ ] 修正PRの作成
- [ ] 再デプロイ
- [ ] ポストモーテム作成（必要に応じて）
```

## 🔍 ロールバック後の確認項目

### 基本機能確認

```bash
# 1. HTTPSアクセス確認
curl -I https://refeel.vercel.app
# 期待: HTTP/2 200

# 2. ログインページ確認
curl https://refeel.vercel.app/login
# 期待: HTML返却（200 OK）

# 3. API疎通確認（要認証）
# ブラウザで実際にログインして確認
```

### ログ確認

**Vercel Dashboard → Logs**:
- ビルドエラーがないこと
- ランタイムエラーが減少していること

**Supabase Dashboard → Logs**:
- 認証エラーが減少していること
- データベースエラーがないこと

### メトリクス確認

- エラー率が正常範囲（1%未満）に戻っていること
- レスポンスタイムが正常範囲（1秒以内）に戻っていること
- ユーザーからの問い合わせが減少していること

## 📚 関連ドキュメント

- [本番環境デプロイ実施レポート](./PRODUCTION_DEPLOYMENT_REPORT.md)
- [運用ガイド](./OPERATIONS_GUIDE.md)
- [Vercelデプロイ手順書](./VERCEL_DEPLOYMENT.md)
- [セキュリティ監査レポート](../SECURITY/SECURITY_AUDIT_REPORT_2025-12-27.md)

## 🎓 ベストプラクティス

1. **迷ったらロールバック**
   - 問題の重大性が不明な場合は、まずロールバックして安定化
   - その後、落ち着いて原因調査・修正

2. **記録を残す**
   - ロールバック履歴を必ず記録
   - 将来の参考資料として活用

3. **定期的なテスト**
   - 本番デプロイ前にPreview環境で十分なテスト
   - ロールバック手順も定期的に確認

4. **段階的デプロイ**
   - 大きな変更は段階的にリリース
   - カナリアリリース・ブルーグリーンデプロイの検討

---

**最終更新**: 2025-12-27
**次回レビュー**: 初回ロールバック実施後
