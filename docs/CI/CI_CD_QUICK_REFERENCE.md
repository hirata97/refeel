# CI/CDクイックリファレンス

開発者向けの実用的なコマンド集とチェックリストです。日常的なCI/CD作業で頻繁に使用するコマンドと手順をまとめています。

## 📋 目次

- [よく使うコマンド集](#よく使うコマンド集)
- [品質チェック対応手順](#品質チェック対応手順)
- [PR作成時チェックリスト](#pr作成時チェックリスト)
- [トラブル対応クイックガイド](#トラブル対応クイックガイド)

## よく使うコマンド集

### ローカル品質チェック

```bash
# 全品質チェック（PR前に必ず実行）
npm run ci:all

# 個別チェック
npm run ci:lint          # ESLint（警告でエラー）
npm run ci:type-check    # TypeScript型チェック
npm run ci:test          # ユニットテスト（カバレッジ付き）
npm run ci:build         # 本番ビルド
npm run ci:security      # セキュリティ監査

# 開発用（自動修正あり）
npm run lint             # ESLint自動修正
npm run format           # Prettier自動フォーマット
npm run type-check       # 型チェック（詳細ログなし）
```

### PR状況確認

```bash
# オープンPR一覧
gh pr list

# 自分のPR一覧
gh pr list --author "@me"

# 特定PRのCI/CD状況
gh pr checks [PR番号]

# PRステータス確認
gh pr status

# PRビュー（詳細確認）
gh pr view [PR番号]
```

### CI/CD実行確認

```bash
# 最新実行一覧
gh run list --limit 10

# 特定ワークフローの実行一覧
gh run list --workflow="pr-quality-gate.yml"

# 実行詳細確認
gh run view [run-id]

# 失敗ログのみ表示
gh run view [run-id] --log-failed

# CI/CD再実行
gh run rerun [run-id]

# 失敗した実行のみ再実行
gh run rerun [run-id] --failed
```

### 依存関係管理

```bash
# 依存関係インストール（クリーンインストール）
npm ci

# 高速・安定インストール（CI/CD推奨）
npm ci --prefer-offline --no-audit --no-fund

# 古い依存関係確認
npm outdated

# 脆弱性スキャン
npm audit

# 高リスク以上の脆弱性のみ
npm audit --audit-level=high

# 脆弱性自動修正
npm audit fix
```

### ブランチ・Git操作

```bash
# 最新mainブランチ取得
git pull origin main

# フィーチャーブランチ作成
git checkout -b feature/issue-[番号]-[説明]

# ステージング・コミット
git add .
git commit -m "type: description"

# プッシュ
git push -u origin feature/issue-[番号]-[説明]

# PR作成
gh pr create --title "タイトル" --body "説明"

# Draft PR作成
gh pr create --draft --title "タイトル" --body "説明"
```

## 品質チェック対応手順

### ESLintエラー修正

#### 1. エラー確認

```bash
# エラー一覧表示
npm run ci:lint

# 特定ファイルのみ
npx eslint src/views/LoginPage.vue
```

#### 2. 自動修正試行

```bash
# 自動修正可能なエラーを修正
npm run lint

# または
npx eslint src/views/LoginPage.vue --fix
```

#### 3. 手動修正

**よくあるエラーと対処法**:

| エラー | 対処法 |
|--------|--------|
| `no-unused-vars` | 未使用変数削除、または`_`プリフィックス |
| `@typescript-eslint/no-explicit-any` | 具体的な型定義に変更 |
| `no-console` | `console.log`を削除、または`logger`使用 |
| `vue/multi-word-component-names` | コンポーネント名を複数単語に変更 |

#### 4. 再確認

```bash
npm run ci:lint
```

### TypeScript型エラー対応

#### 1. 型エラー確認

```bash
# 全体型チェック
npm run type-check

# CI用（詳細ログ）
npm run ci:type-check

# 特定ファイルのみ
npx vue-tsc --noEmit src/views/LoginPage.vue
```

#### 2. よくある型エラーと対処法

**undefined可能性エラー**:

```typescript
// ❌ エラー
const userName: string = user.name  // user.nameがundefinedの可能性

// ✅ 解決1: Nullish coalescing
const userName: string = user.name ?? ''

// ✅ 解決2: 型ガード
if (user.name) {
  const userName: string = user.name
}

// ✅ 解決3: Optional chaining + 型アサーション
const userName: string = user.name!  // 確実にnullでない場合のみ
```

**any型エラー**:

```typescript
// ❌ エラー
const data: any = fetchData()

// ✅ 解決: 適切な型定義
interface User {
  id: number
  name: string
}
const data: User = fetchData()
```

#### 3. 型定義生成・更新

```bash
# ローカル型定義生成（Supabaseスキーマから）
npm run generate-types

# 本番型定義生成
npm run generate-types:prod
```

### テスト失敗対応

#### 1. テスト実行

```bash
# 全テスト実行
npm run test:unit

# 特定ファイルのみ
npm run test:unit -- src/views/LoginPage.spec.ts

# watchモード（開発中便利）
npm run test:unit -- --watch

# カバレッジ付き
npm run ci:test
```

#### 2. よくあるテストエラーと対処法

**非同期エラー**:

```typescript
// ❌ エラー
test('should fetch data', () => {
  const data = fetchData()  // Promiseが返る
  expect(data.name).toBe('test')  // エラー
})

// ✅ 解決
test('should fetch data', async () => {
  const data = await fetchData()
  expect(data.name).toBe('test')
})
```

**モックエラー**:

```typescript
// ❌ エラー
test('should call API', () => {
  callAPI()
  expect(fetch).toHaveBeenCalled()  // fetchがモックされていない
})

// ✅ 解決
test('should call API', () => {
  global.fetch = vi.fn()  // モック設定
  callAPI()
  expect(fetch).toHaveBeenCalled()
})
```

#### 3. カバレッジ確認

```bash
# HTMLレポート生成
npm run ci:test

# ブラウザで確認
open coverage/index.html

# 未カバー箇所を特定してテスト追加
```

### Prettierフォーマット

```bash
# フォーマットチェック
npm run format -- --check

# 自動フォーマット適用
npm run format

# 特定ファイルのみ
npx prettier --write src/views/LoginPage.vue
```

### ビルドエラー対応

#### 1. ビルド実行

```bash
# 本番ビルド
npm run ci:build

# または
npm run build
```

#### 2. よくあるビルドエラーと対処法

**依存関係エラー**:

```bash
# node_modules削除・再インストール
rm -rf node_modules package-lock.json
npm ci

# 再ビルド
npm run ci:build
```

**環境変数エラー**:

```bash
# .env.exampleをコピー
cp .env.example .env

# 環境変数設定
vim .env

# 再ビルド
npm run ci:build
```

## PR作成時チェックリスト

### 作業前

- [ ] 最新mainブランチから作業開始: `git pull origin main`
- [ ] フィーチャーブランチ作成: `git checkout -b feature/issue-[番号]-[説明]`
- [ ] Issue内容確認: `gh issue view [番号]`

### 実装中

- [ ] コミットメッセージ規約遵守: `type: description`
- [ ] 段階的コミット（最小単位で）
- [ ] 定期的なローカルチェック: `npm run ci:lint && npm run type-check`

### PR作成前

- [ ] **全品質チェック成功**: `npm run ci:all`
  - [ ] ESLint: エラー0件
  - [ ] TypeScript: 型エラー0件
  - [ ] ユニットテスト: 全成功
  - [ ] ビルド: 成功
  - [ ] セキュリティ: High/Critical脆弱性0件

- [ ] コミット整理（必要時）: `git rebase -i HEAD~[件数]`
- [ ] コミットメッセージ確認
- [ ] 不要ファイル削除（console.log、デバッグコード等）

### PR作成

```bash
# PR作成テンプレート
gh pr create \
  --title "type: 変更内容の簡潔な説明" \
  --body "## Summary
変更内容の詳細

## Root Cause Analysis
- **原因**: [問題の根本原因]
- **予防策**: [再発防止策]

## Test plan
- [ ] ローカルで全品質チェック成功
- [ ] 影響範囲のE2Eテスト実施
- [ ] 手動動作確認

## Related Issues
Closes #[Issue番号]"
```

### PR作成後

- [ ] CI/CD実行確認: `gh pr checks`
- [ ] 品質ゲート通過確認
- [ ] レビュー依頼
- [ ] CI/CD失敗時は即座修正

## トラブル対応クイックガイド

### CI/CD失敗時の初動対応

#### 1. エラー種別の特定

```bash
# 失敗ログ確認
gh pr checks

# 詳細ログ確認
gh run view [run-id] --log-failed
```

#### 2. エラー種別別対応

| エラー種別 | コマンド | 次のアクション |
|-----------|---------|--------------|
| **ESLint** | `npm run ci:lint` | 自動修正 → 手動修正 |
| **TypeScript** | `npm run ci:type-check` | 型定義修正 |
| **Test** | `npm run ci:test` | テスト修正 |
| **Build** | `npm run ci:build` | 依存関係確認 |
| **Security** | `npm audit` | 脆弱性対応 |

#### 3. ローカル再現

```bash
# CI/CDと同じコマンド実行
npm ci --prefer-offline --no-audit --no-fund
npm run ci:all
```

#### 4. 修正・再実行

```bash
# 修正後コミット
git add .
git commit -m "fix: [エラー内容]対応"
git push

# CI/CD自動再実行確認
gh pr checks
```

### 緊急時対応

#### CI/CD全体停止

```bash
# GitHub Status確認
open https://www.githubstatus.com/

# ローカルで全チェック実行
npm run ci:all

# 成功後、管理者に連絡してマージ判断
```

#### タイムアウトエラー

```bash
# 再実行試行
gh run rerun [run-id]

# 継続失敗時はタイムアウト延長検討
# .github/workflows/[ワークフロー].yml
# timeout-minutes: 15  # 延長
```

### よくある質問（FAQ）

**Q: `npm run ci:all`が失敗するが、原因がわからない**

```bash
# 段階的実行で原因特定
npm run ci:lint          # 1. ESLint
npm run ci:type-check    # 2. TypeScript
npm run ci:test          # 3. Test
npm run ci:build         # 4. Build
npm run ci:security      # 5. Security

# 失敗したコマンドを詳細確認
```

**Q: CI/CDは成功するが、ローカルで失敗する**

```bash
# 依存関係同期
rm -rf node_modules package-lock.json
npm ci

# 環境変数確認
cp .env.example .env
vim .env

# 再実行
npm run ci:all
```

**Q: 型定義が見つからないエラー**

```bash
# 型定義再生成
npm run generate-types

# 型チェック
npm run type-check
```

**Q: カバレッジが足りない警告が出る**

```bash
# カバレッジレポート確認
npm run ci:test
open coverage/index.html

# 未カバー箇所を特定してテスト追加
# 注意: カバレッジは推奨レベル（警告のみ）、失敗条件ではない
```

## コミットメッセージ規約

### フォーマット

```
type: subject

body (optional)

footer (optional)
```

### Type一覧

| Type | 説明 | 例 |
|------|------|-----|
| `feat` | 新機能 | `feat: add user authentication` |
| `fix` | バグ修正 | `fix: resolve login error` |
| `docs` | ドキュメント | `docs: update API guide` |
| `style` | コードスタイル | `style: format with prettier` |
| `refactor` | リファクタリング | `refactor: simplify auth logic` |
| `test` | テスト | `test: add login page tests` |
| `chore` | 雑務 | `chore: update dependencies` |
| `ci` | CI/CD | `ci: optimize workflow` |

### 例

```bash
# 良い例
git commit -m "feat: add password reset feature"
git commit -m "fix: resolve type error in auth store"
git commit -m "test: add coverage for user registration"

# 悪い例
git commit -m "update"
git commit -m "fix bug"
git commit -m "changes"
```

## 関連ドキュメント

詳細情報は以下のドキュメントを参照してください：

- [CI/CDアーキテクチャ](CI_CD_OVERVIEW.md) - 全体像・技術スタック
- [設定変更手順](CI_CD_CONFIGURATION.md) - ワークフロー・設定変更方法
- [トラブルシューティング](CI_CD_TROUBLESHOOTING.md) - 詳細エラー対応
- [運用・保守ガイド](CI_CD_OPERATIONS.md) - 定期メンテナンス・監視

## バージョン履歴

| バージョン | 日付 | 変更内容 |
|-----------|------|---------|
| 1.0.0 | 2025-01-14 | 初版作成 |
