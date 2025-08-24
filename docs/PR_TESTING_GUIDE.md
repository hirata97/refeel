# PRテスト・検証ガイド

このドキュメントでは、プルリクエスト（PR）のテスト・検証手順について説明します。

## 📋 概要

### テスト戦略

- **自動化レイヤー**: CI/CDパイプラインによる品質チェック
- **手動テストレイヤー**: 機能・UX・統合テスト
- **レビューレイヤー**: コードレビューと設計レビュー

## 🤖 自動CI/CDテスト（必須）

### 1. 実行タイミング

```yaml
# 自動実行されるタイミング
- PR作成時
- PRへのプッシュ時
- main/developブランチへのプッシュ時
```

### 2. 5つの自動チェック項目

#### ✅ lint-and-format

```bash
実行内容: ESLint（警告ゼロモード）+ Prettier
成功条件: コード規約違反・フォーマット問題なし
失敗時の対処: npm run lint で自動修正
```

#### ✅ type-check

```bash
実行内容: TypeScript型チェック（フィルタリング済み）
成功条件: 重要な型エラーなし（Vuetify既知問題除外）
失敗時の対処: 型エラー修正またはフィルタリング追加
```

#### ✅ unit-tests

```bash
実行内容: Vitest実行 + カバレッジ測定
成功条件: 主要テストケース成功
失敗時の対処: テストコード修正・追加
```

#### ✅ build-check

```bash
実行内容: 本番用ビルド（vite build）
成功条件: ビルド完了・アセット生成
失敗時の対処: ビルドエラー修正・依存関係確認
```

#### ✅ security-audit

```bash
実行内容: npm audit（moderate以上の脆弱性）
成功条件: 重要な脆弱性なし
失敗時の対処: npm audit fix または依存関係更新
```

### 3. CI結果確認方法

#### GitHub PR画面での確認

1. **Checksタブ**: 各チェック項目の詳細結果
2. **自動コメント**: PR内のCI結果サマリー
3. **ステータス表示**: PR画面上部の緑色チェックマーク

#### 失敗時の詳細確認

```bash
# ローカルで同じチェックを実行
npm run ci:lint      # lint失敗時
npm run ci:type-check # type-check失敗時
npm run ci:test      # test失敗時
npm run ci:build     # build失敗時
npm run ci:security  # security失敗時
```

## 🧪 手動テストガイド

### 1. 機能テスト

#### 基本機能確認

```markdown
□ 実装した機能の正常動作
□ エラーハンドリング（異常系）
□ 入力値検証（バリデーション）
□ 認証・認可の動作確認
```

#### UI/UXテスト

```markdown
□ レスポンシブデザイン確認
□ ダークモード対応確認
□ アクセシビリティ基本チェック
□ ローディング・エラー画面表示
```

### 2. ブラウザテスト

#### 対応ブラウザでの確認

```markdown
□ Chrome（最新版）
□ Firefox（最新版）  
□ Safari（macOS/iOS）
□ Edge（Windows）
```

#### デバイステスト

```markdown
□ デスクトップ（1920x1080）
□ タブレット（768x1024）
□ モバイル（375x667）
```

### 3. 統合テスト

#### データベース連携

```markdown
□ Supabase接続確認
□ CRUD操作の正常動作
□ リアルタイム更新確認
□ 認証状態との連携
```

#### 外部サービス連携

```markdown
□ 認証フロー（Google/Email）
□ ファイルアップロード
□ APIエンドポイント呼び出し
```

## 📝 テスト手順（チェックリスト）

### PR作成前の事前テスト

```bash
# 1. ローカル環境での動作確認
npm run dev
# → ブラウザで機能テスト実行

# 2. CI品質チェックの事前実行
npm run ci:lint
npm run ci:type-check
npm run ci:test
npm run ci:build
npm run ci:security

# 3. E2Eテスト実行（大きな変更時）
npm run test:e2e
```

### PR作成後の検証手順

#### 1. 自動CI確認（5分以内）

```markdown
1. PR作成後、Checksタブを確認
2. 5つのCI項目がすべて✅になることを確認
3. ❌の場合は詳細ログを確認し、修正してプッシュ
```

#### 2. 手動テスト実行

```markdown
1. PRブランチをローカルでチェックアウト
   git checkout [PR-branch-name]
2. 開発サーバー起動
   npm run dev
3. 実装機能の動作テスト
4. UI/UXの確認
5. エラーケースのテスト
```

#### 3. レビュー依頼前の最終チェック

```markdown
□ CI/CDが全て成功
□ 手動テストでの動作確認完了
□ コードの自己レビュー実施
□ ドキュメント更新（必要時）
□ PR説明文の記載完了
```

## 🔧 テスト時のトラブルシューティング

### 1. CI失敗パターンと対処法

#### lint-and-format失敗

```bash
# 症状: ESLintルール違反
# 対処:
npm run lint        # 自動修正実行
npm run format      # フォーマット修正

# 確認:
npm run ci:lint     # CI同等チェック
```

#### type-check失敗

```bash
# 症状: TypeScript型エラー
# 対処:
npm run type-check  # 詳細エラー確認
# → 型エラー修正
# → 必要時: scripts/ci-type-check.sh にフィルタ追加

# 確認:
npm run ci:type-check
```

#### unit-tests失敗

```bash
# 症状: テスト失敗・カバレッジ不足
# 対処:
npm run test:unit   # 詳細確認
# → テストコード修正・追加
# → 実装コード修正

# 確認:
npm run ci:test
```

#### build-check失敗

```bash
# 症状: ビルド失敗
# 対処:
npm run ci:build    # 詳細エラー確認
# → 依存関係チェック
# → import/export修正
# → 型エラー修正

# 確認:
ls -la dist/        # ビルド成果物確認
```

#### security-audit失敗

```bash
# 症状: 脆弱性検出
# 対処:
npm audit           # 詳細確認
npm audit fix       # 自動修正試行
npm update          # 依存関係更新

# 確認:
npm run ci:security
```

### 2. 手動テスト時の問題

#### 機能が動作しない

```markdown
1. ブラウザコンソールでエラーチェック
2. ネットワークタブでAPI呼び出し確認
3. Supabase接続状態確認
4. 認証状態確認
5. ローカルストレージ・セッション確認
```

#### スタイルが適用されない

```markdown
1. CSSファイルの読み込み確認
2. Vuetifyテーマ設定確認
3. ダークモード切り替え確認
4. レスポンシブブレイクポイント確認
```

### 3. パフォーマンス問題

```bash
# Lighthouseでの確認
npm run build
npm run preview
# → Lighthouse実行

# バンドルサイズ確認
npm run build
# → dist/assets/ フォルダサイズ確認
```

## 📊 テスト品質メトリクス

### 目標品質指標

```yaml
CI/CDテスト: 100%成功必須
手動テスト: 主要機能カバー100%
ブラウザ互換: Chrome/Firefox/Safari対応
レスポンシブ: 3デバイス以上で確認
パフォーマンス: Lighthouse Score 80以上
```

### 品質ゲート

```markdown
■ マージ可能条件:
□ CI/CD 5項目すべて成功
□ 手動機能テスト完了
□ 1名以上のコードレビュー承認
□ Conflictなし

■ 推奨条件:
□ E2Eテスト成功（大きな変更時）
□ パフォーマンステスト実施
□ アクセシビリティ基本チェック
□ セキュリティ観点でのレビュー
```

## 🚀 今後の改善予定

### テスト自動化拡張

- [ ] E2Eテストの本格導入
- [ ] ビジュアルリグレッションテスト
- [ ] パフォーマンス自動測定
- [ ] アクセシビリティ自動チェック

### CI/CD最適化

- [ ] 実行時間短縮（並行処理最適化）
- [ ] 失敗時の自動通知システム
- [ ] デプロイ自動化（CD拡張）
- [ ] テスト結果の可視化強化

---

## 📚 関連ドキュメント

- [CI/CDパイプライン運用ガイド](CI_CD_GUIDE.md) - 自動テスト詳細
- [開発ワークフロー](DEVELOPMENT_WORKFLOW.md) - 全体的な開発手順
- [コーディング規則](CODING_STANDARDS.md) - コード品質基準
- [セキュリティガイドライン](SECURITY.md) - セキュリティテスト観点

---

**📝 更新履歴**

- 2025-08-19: 初版作成（Issue #55 CI/CD実装に伴う）
- 2025-08-19: 5段階CI/CDテスト手順詳細化
