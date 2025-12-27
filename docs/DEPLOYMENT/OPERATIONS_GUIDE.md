# 本番環境運用ガイド

> **対象**: 運用担当者・開発者
> **最終更新**: 2025-12-27
> **関連Issue**: #317

## 📝 概要

Refeel本番環境（Vercel + Supabase）の日常運用・監視・トラブルシューティング手順をまとめたガイドです。

## 🎯 日常運用タスク

### 毎日のチェック項目

#### 朝のヘルスチェック（推奨: 9:00）

```bash
# 1. 本番URLアクセス確認
curl -I https://refeel.vercel.app
# 期待: HTTP/2 200

# 2. GitHubアクションの確認
# https://github.com/hirata97/GoalCategorizationDiary/actions
# 最新のワークフローが成功していることを確認
```

**Vercel Dashboard確認**:
1. https://vercel.com/dashboard にアクセス
2. デプロイステータスが "Ready" であることを確認
3. 過去24時間のエラーログを確認

**Supabase Dashboard確認**:
1. https://app.supabase.com/ にアクセス
2. Database Health を確認
3. Auth エラーログを確認

### 週次チェック項目

#### 毎週月曜日（推奨: 10:00）

- [ ] パフォーマンスメトリクス確認
  - Vercel Analytics でレスポンスタイム確認
  - 目標: 平均1秒以内
- [ ] セキュリティアラート確認
  - Supabase Dashboard → Security
  - 異常なアクセスパターンがないか確認
- [ ] データベース容量確認
  - Supabase Dashboard → Database → Usage
  - 容量が80%を超えていないか確認
- [ ] 依存パッケージの脆弱性確認
  ```bash
  npm audit
  # 重大な脆弱性がある場合は対応
  ```

### 月次チェック項目

#### 毎月1日（推奨: 10:00）

- [ ] Lighthouseスコア測定
  ```
  Chrome DevTools → Lighthouse → Generate report
  目標: すべて90以上
  ```
- [ ] バックアップ確認
  - Supabase Dashboard → Database → Backups
  - 自動バックアップが正常に動作しているか確認
- [ ] ユーザーフィードバック確認
  - GitHub Issues を確認
  - ユーザーからの問い合わせを確認
- [ ] ドキュメント更新確認
  - README、運用ガイド等が最新か確認

## 📊 監視・アラート

### Vercelモニタリング

#### アクセス方法

1. Vercel Dashboard にログイン
2. プロジェクト選択: `hirata97/GoalCategorizationDiary`
3. タブを選択:
   - **Deployments**: デプロイ履歴
   - **Logs**: リアルタイムログ
   - **Analytics**: アクセス解析（Pro プラン以上）

#### 監視項目

**デプロイステータス**:
- ステータス: Ready / Building / Error
- ビルド時間: 通常1-3分
- ⚠️ 5分以上かかる場合は調査

**エラーログ**:
```
Vercel Dashboard → Logs
```
- JavaScript エラー
- ビルドエラー
- 404エラー（ページが見つからない）

**推奨アラート設定**:
- ビルド失敗時にメール通知
- エラー率が5%を超えた場合に通知

### Supabaseモニタリング

#### アクセス方法

1. Supabase Dashboard にログイン
2. 本番プロジェクトを選択
3. タブを選択:
   - **Logs**: データベース・認証ログ
   - **Database → Performance**: クエリパフォーマンス
   - **Auth → Users**: ユーザー管理

#### 監視項目

**認証ログ**:
```
Supabase Dashboard → Logs → Auth
```
- ログイン失敗の頻度
- ⚠️ 短時間に複数回失敗 → ブルートフォース攻撃の可能性

**データベースログ**:
```
Supabase Dashboard → Logs → Database
```
- クエリエラー
- RLS（Row Level Security）違反
- ⚠️ 頻繁なエラー → コード修正が必要

**データベースパフォーマンス**:
```
Supabase Dashboard → Database → Performance
```
- スロークエリの確認
- ⚠️ 1秒以上かかるクエリ → 最適化が必要

**推奨アラート設定**:
- データベース容量が80%を超えた場合
- 認証失敗が急増した場合（1時間に100回以上）

### メトリクス目標値

| メトリクス | 目標値 | 警告しきい値 | 対応必須しきい値 |
|-----------|--------|-------------|-----------------|
| エラー率 | < 1% | 5% | 10% |
| レスポンスタイム | < 1秒 | 2秒 | 3秒 |
| Lighthouse Performance | ≥ 90 | < 80 | < 70 |
| データベース容量 | < 70% | 80% | 90% |
| 認証失敗率 | < 5% | 10% | 20% |

## 🚨 エラー対応フロー

### 1. エラー検知

**検知方法**:
- Vercel/Supabase Dashboardのアラート
- ユーザーからの問い合わせ（GitHub Issues）
- 定期的な手動チェック

### 2. 影響範囲の確認

```bash
# ステップ1: 本番URLアクセス確認
curl -I https://refeel.vercel.app

# ステップ2: エラーログ確認
# Vercel Dashboard → Logs（直近30分）
# Supabase Dashboard → Logs（直近30分）

# ステップ3: 影響範囲の推定
# - 全ユーザー影響? → Critical
# - 一部機能のみ? → High/Medium
# - 特定ユーザーのみ? → Low/Medium
```

### 3. 対応判断

```
エラー重大性の評価
  ↓
Critical (全ユーザー影響・認証不可・データ破損リスク)
  → 即座にロールバック（docs/DEPLOYMENT/ROLLBACK_GUIDE.md参照）
  ↓
High (一部機能停止・パフォーマンス低下)
  → 30分以内に修正可能?
     YES → 緊急修正PR作成
     NO → ロールバック
  ↓
Medium/Low (軽微な不具合)
  → 通常の修正PR作成・レビュー・マージ
```

### 4. 緊急修正手順

**Critical/Highの場合**:

```bash
# 1. ロールバック実施（ROLLBACK_GUIDE.md参照）
# Vercel Dashboard → Deployments → Promote to Production

# 2. 問題調査
# エラーログ・コード確認

# 3. 緊急修正PR作成
git checkout main
git pull origin main
git checkout -b hotfix/critical-issue-description

# 修正実施
# ...

# 4. ローカルテスト
npm run ci:all

# 5. コミット・プッシュ
git add .
git commit -m "hotfix: Fix critical issue

Root Cause Analysis:
- [問題の根本原因]

Fix:
- [修正内容]

Test plan:
- [x] ローカルテスト実施
- [x] ci:all 成功

Related Issue: #XXX"

git push origin hotfix/critical-issue-description

# 6. PR作成・マージ
gh pr create --title "hotfix: Fix critical issue" \
  --body "緊急修正のため即座にレビュー・マージお願いします"

# 7. 再デプロイ確認
# Vercel Dashboardでデプロイ成功を確認
```

## 🔍 トラブルシューティング

### よくある問題と対処法

#### 問題1: デプロイが失敗する

**症状**:
- Vercel Dashboardでビルドエラー
- "Error: Build failed" メッセージ

**確認項目**:
```bash
# ローカルでビルド確認
npm run build

# 型チェック
npm run type-check

# テスト実行
npm run test:unit
```

**対処法**:
1. エラーログを確認
2. ローカルで問題を修正
3. `npm run ci:all` で全チェック実行
4. 修正をコミット・プッシュ

#### 問題2: 環境変数が反映されない

**症状**:
- 本番環境でSupabase接続エラー
- "Invalid API key" エラー

**確認項目**:
```
Vercel Dashboard → Project Settings → Environment Variables
```

**対処法**:
1. 環境変数が正しく設定されているか確認
2. `VITE_` プレフィックスがあるか確認
3. 環境変数変更後、再デプロイを実行
   ```bash
   # 再デプロイのトリガー
   git commit --allow-empty -m "chore: Trigger redeploy"
   git push origin main
   ```

#### 問題3: RLS（Row Level Security）エラー

**症状**:
- Supabase Dashboard → Logs に "RLS violation" エラー
- ユーザーが他人のデータにアクセスできない（意図通りの場合もある）

**確認項目**:
```sql
-- Supabase Dashboard → SQL Editor
-- RLSポリシー確認
SELECT * FROM pg_policies WHERE tablename = 'diaries';
```

**対処法**:
1. RLSポリシーが正しく設定されているか確認
2. ユーザーIDが正しく渡されているか確認（コード側）
3. 必要に応じてポリシーを修正
   - `supabase/migrations/` でマイグレーション作成
   - ローカルで検証後、本番環境に適用

#### 問題4: パフォーマンス低下

**症状**:
- ページロード時間が3秒以上
- Lighthouseスコアが70未満

**確認項目**:
```bash
# Chrome DevToolsでLighthouse実行
# Performance タブで詳細分析
```

**対処法**:
1. 大きな画像の最適化（WebP変換、遅延読み込み）
2. 未使用のJavaScriptコード削除
3. バンドルサイズ削減
   ```bash
   npm run build -- --mode production
   # dist/ のサイズ確認
   ```
4. Supabase クエリの最適化（インデックス追加）

### エラーログの読み方

#### Vercelエラーログ

```
Error: Build failed
  at buildProject (/vercel/path/builder/index.js:123:45)
  ...
```

**読み方**:
1. エラーメッセージを確認（"Build failed"）
2. スタックトレースで問題箇所を特定
3. ローカルで同じエラーを再現
4. 修正・テスト・デプロイ

#### Supabaseエラーログ

```json
{
  "timestamp": "2025-12-27T10:00:00Z",
  "level": "error",
  "message": "new row violates row-level security policy",
  "table": "diaries",
  "user_id": "xxx"
}
```

**読み方**:
1. エラーメッセージを確認（"RLS policy violation"）
2. 対象テーブルを確認（"diaries"）
3. RLSポリシーを確認・修正

## 📞 緊急連絡先

### プロジェクト内部

- **GitHub Issues**: バグ報告・機能要望
  - https://github.com/hirata97/GoalCategorizationDiary/issues
- **Pull Requests**: コードレビュー・修正提案
  - https://github.com/hirata97/GoalCategorizationDiary/pulls

### 外部サポート

- **Vercelサポート**:
  - https://vercel.com/support
  - サポート範囲: デプロイ・ビルド・インフラ
- **Supabaseサポート**:
  - https://supabase.com/support
  - サポート範囲: データベース・認証・RLS

### エスカレーションフロー

```
問題発生
  ↓
プロジェクトメンバーで解決を試みる（30分）
  ↓ 解決できない場合
  ↓
GitHub Issueで問題を共有・相談
  ↓ それでも解決できない場合
  ↓
外部サポート（Vercel/Supabase）に問い合わせ
```

## 📚 定期メンテナンス

### 依存パッケージ更新（月次）

```bash
# 1. 脆弱性確認
npm audit

# 2. アップデート可能なパッケージ確認
npm outdated

# 3. マイナーバージョンアップデート
npm update

# 4. メジャーバージョンアップデート（慎重に）
# Breaking changesを確認してから実行
# npm install <package>@latest

# 5. テスト実行
npm run ci:all

# 6. 問題なければコミット
git add package.json package-lock.json
git commit -m "chore: Update dependencies"
git push origin main
```

### データベースバックアップ確認（週次）

```
Supabase Dashboard → Database → Backups
```

**確認項目**:
- 最新のバックアップが存在するか
- バックアップが正常に完了しているか
- バックアップ保持期間が適切か（推奨: 7日以上）

### セキュリティパッチ適用（随時）

**通知を受け取る設定**:
- GitHub Security Alerts を有効化
- Dependabot を有効化

**対応手順**:
```bash
# 1. セキュリティアラートを確認
# GitHub → Security → Dependabot alerts

# 2. 影響範囲を確認
npm audit

# 3. 修正実施
npm audit fix

# または手動で特定パッケージを更新
npm install <package>@latest

# 4. テスト
npm run ci:all

# 5. コミット・デプロイ
git add .
git commit -m "security: Fix vulnerability in <package>"
git push origin main
```

## 🎓 ベストプラクティス

### 運用の心得

1. **定期的な確認**
   - 毎日のヘルスチェックを習慣化
   - 問題の早期発見が重要

2. **記録を残す**
   - エラー発生時は必ずGitHub Issueに記録
   - 解決方法を共有して将来に活用

3. **段階的な変更**
   - 大きな変更は段階的にリリース
   - Preview環境で十分なテスト

4. **ドキュメント更新**
   - 運用で気づいたことはドキュメントに反映
   - チーム全体で知識を共有

### 推奨ツール

- **Vercel CLI**: コマンドラインでのデプロイ管理
  ```bash
  npm install -g vercel
  ```
- **GitHub CLI**: Issue/PR管理の効率化
  ```bash
  # インストール済み（プロジェクト内で使用）
  gh issue list
  gh pr list
  ```

## 📋 運用チェックリスト

### デプロイ後チェックリスト

- [ ] デプロイが成功していることを確認（Vercel Dashboard）
- [ ] 本番URLにアクセスできることを確認
- [ ] ログイン機能が動作することを確認
- [ ] 主要機能が動作することを確認
- [ ] エラーログがないことを確認（Vercel/Supabase）
- [ ] パフォーマンスが正常であることを確認

### インシデント対応チェックリスト

- [ ] 問題の重大性を評価
- [ ] 影響範囲を確認
- [ ] GitHub Issueを作成
- [ ] 必要に応じてロールバック
- [ ] 根本原因を調査
- [ ] 修正PRを作成・マージ
- [ ] 再発防止策を検討
- [ ] ポストモーテム作成（重大な問題の場合）

## 🔗 関連ドキュメント

- [本番環境デプロイ実施レポート](./PRODUCTION_DEPLOYMENT_REPORT.md)
- [ロールバック手順ガイド](./ROLLBACK_GUIDE.md)
- [Vercelデプロイ手順書](./VERCEL_DEPLOYMENT.md)
- [セキュリティ監査レポート](../SECURITY/SECURITY_AUDIT_REPORT_2025-12-27.md)
- [CI/CD開発者ガイド](../CI/CI_CD_DEVELOPER_GUIDE.md)

---

**最終更新**: 2025-12-27
**次回レビュー**: 運用開始後1ヶ月
