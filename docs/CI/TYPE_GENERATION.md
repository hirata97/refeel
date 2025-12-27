# Type Generation システム

TypeScript型定義の自動生成システムの詳細ドキュメント

## 📋 概要

### 機能説明
データベーススキーマから TypeScript型定義を自動生成し、フロントエンドコードでの型安全性を確保します。Issue #144 対応として実装されました。

### 主な利点
- **型安全性**: データベースとフロントエンド間の型不整合を防止
- **自動更新**: スキーマ変更時の型定義自動同期
- **開発効率**: 手動型定義メンテナンスからの解放
- **品質向上**: コンパイル時エラー検出による不具合削減

## 🛠️ システム構成

### コンポーネント一覧
```
scripts/generate-types.js       # 型定義生成メインスクリプト
.github/workflows/type-generation.yml  # CI/CDワークフロー
src/types/database.ts          # 自動生成データベース型定義
src/types/supabase.ts          # 自動生成Supabaseクライアント型
src/types/custom.ts            # 手動管理カスタム型定義
package.json                   # npm scriptコマンド定義
```

### 実行モード
1. **ローカルモード**: モック型定義生成（開発環境）
2. **本番モード**: 実際のSupabase接続による型定義生成

## 🚀 使用方法

### 基本コマンド
```bash
# ローカル型定義生成（開発時推奨）
npm run generate-types

# 本番型定義生成（要環境変数設定）
npm run generate-types:prod

# 型生成後に開発サーバー起動
npm run dev:with-types
```

### 開発フロー統合
```bash
# 1. 最新型定義で開発開始
npm run dev:with-types

# 2. 実装中の型確認
npm run type-check

# 3. データベーススキーマ変更後
npm run generate-types
npm run type-check  # 影響範囲確認

# 4. CI/CD前チェック
npm run ci:type-check
```

## ⚙️ 設定と環境変数

### 必要な環境変数
```bash
# ローカル開発では不要
# 本番型定義生成時に必要:
VITE_SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ACCESS_TOKEN=your-access-token
```

### GitHub Actions設定
```
Repository Settings > Secrets and variables > Actions
- VITE_SUPABASE_URL: Supabase プロジェクトURL
- SUPABASE_ACCESS_TOKEN: Supabase CLI用アクセストークン
```

### 型定義ファイル構成
```typescript
// src/types/database.ts (自動生成)
export interface Database {
  public: {
    Tables: { /* テーブル定義 */ }
    Views: { /* ビュー定義 */ }
    Functions: { /* 関数定義 */ }
    // ...
  }
}

// src/types/supabase.ts (自動生成)
export type Tables<T> = Database['public']['Tables'][T]['Row']
export type DiaryEntry = Tables<'diaries'>
export type Profile = Tables<'profiles'>

// src/types/custom.ts (手動管理)
export interface CustomType {
  // プロジェクト固有の型定義
}
```

## 🔄 CI/CD統合

### Type Generation Workflow
```yaml
名前: Type Generation
トリガー: push (main), pull_request, 手動実行
実行時間: 約2-3分
自動コミット: main branchでの型定義変更時
```

### ワークフロー詳細
1. **型定義生成**: Supabaseから最新スキーマ取得
2. **変更検出**: git diff による型定義変更確認
3. **型チェック**: 生成された型定義での TypeScript検証
4. **テスト実行**: 型定義関連テストの実行
5. **自動コミット**: main branch での変更自動コミット

### 実行条件
```yaml
# 実行トリガー
- データベースマイグレーション変更
- ワークフローファイル変更
- 型定義生成スクリプト変更
- 手動実行 (workflow_dispatch)
```

## 💻 実装詳細

### PROJECT_ID抽出ロジック
```javascript
function extractProjectId(url) {
  const patterns = [
    /https:\/\/([a-zA-Z0-9]+)\.supabase\.co/,     // 標準
    /https:\/\/([a-zA-Z0-9\-_]+)\.supabase\.co/,  // 特殊文字対応
  ]
  
  for (const pattern of patterns) {
    const match = url.match(pattern)
    if (match && match[1]) return match[1]
  }
  return null
}
```

### フォールバック機能
```javascript
async function generateTypesProduction() {
  try {
    // Supabase CLI による型生成試行
    const typesOutput = execCommand(`npx supabase gen types typescript --project-id ${PROJECT_ID}`)
    // 成功時の処理
  } catch (error) {
    // 失敗時は自動的にローカル型定義使用
    generateTypesLocal()
  }
}
```

### エラーハンドリング
```javascript
// 環境変数検証
if (!PROJECT_ID) {
  log('PROJECT_ID が取得できません。環境変数を確認してください:', 'error')
  log(`  VITE_SUPABASE_URL: ${SUPABASE_URL || 'undefined'}`, 'error')
  throw new Error('PROJECT_ID が環境変数から取得できません')
}

// 型チェック実行
function validateTypeCompatibility() {
  try {
    execCommand('npm run type-check', '型チェック実行')
    return true
  } catch (error) {
    log('型チェックでエラーが発生しました', 'error')
    return false
  }
}
```

## 🔧 トラブルシューティング

### よくある問題と解決方法

#### 1. PROJECT_ID 抽出失敗
```bash
# 問題: PROJECT_ID が環境変数から取得できません
# 原因: VITE_SUPABASE_URL の形式が想定と異なる

# 確認方法:
echo $VITE_SUPABASE_URL
# 期待形式: https://[project-id].supabase.co

# 解決策:
# 1. URL形式の確認・修正
# 2. 新しい抽出パターンに対応済み（複数パターン対応）
```

#### 2. Supabase CLI接続失敗
```bash
# 問題: 本番環境での型定義生成失敗
# 原因: SUPABASE_ACCESS_TOKEN 未設定または無効

# 確認方法:
npx supabase auth status

# 解決策:
# 1. Supabase CLI でログイン
# 2. アクセストークンの更新
# 3. 自動フォールバック機能でローカル型定義使用
```

#### 3. 型定義の不整合
```bash
# 問題: 生成された型定義で TypeScript エラー
# 原因: データベーススキーマと既存コードの不整合

# 確認方法:
npm run type-check

# 解決策:
# 1. データベーススキーマ確認
# 2. 既存コード修正
# 3. カスタム型定義での補完 (src/types/custom.ts)
```

#### 4. CI/CD での型定義生成失敗
```bash
# 問題: GitHub Actions での型定義生成失敗
# 原因: 環境変数設定不備

# 解決策:
# 1. Repository Settings > Secrets and variables > Actions
# 2. VITE_SUPABASE_URL と SUPABASE_ACCESS_TOKEN 設定確認
# 3. ワークフロー再実行
```

### デバッグコマンド
```bash
# 環境変数確認
echo $VITE_SUPABASE_URL
echo $SUPABASE_ACCESS_TOKEN

# Supabase CLI状態確認
npx supabase --version
npx supabase auth status

# 型定義ファイル確認
ls -la src/types/
cat src/types/database.ts | head -20

# 型チェック詳細実行
npm run type-check -- --verbose
```

## 📈 運用とメンテナンス

### 定期メンテナンス
- **月次**: 生成される型定義の品質確認
- **四半期**: Supabase CLI アップデート確認
- **スキーマ変更時**: 型定義自動更新の動作確認

### パフォーマンス監視
```bash
# 型生成時間計測
time npm run generate-types

# 型チェック時間計測  
time npm run type-check

# CI/CD実行時間監視
# GitHub Actions > Type Generation workflow > 実行時間確認
```

### 将来の改善予定
- [ ] 増分型定義生成（差分のみ更新）
- [ ] 型定義バリデーション強化
- [ ] 複数データベース対応
- [ ] 型定義ドキュメント自動生成

## 📚 関連ドキュメント

- [CI/CD開発者ガイド](CI_CD_DEVELOPER_GUIDE.md) - Type Generation Workflow詳細・ベストプラクティス
- [Development Commands](../DEVELOPMENT/DEVELOPMENT_COMMANDS.md) - npm script使用方法
- [Architecture](../DEVELOPMENT/ARCHITECTURE.md) - システム全体での型システム位置づけ
- [CLAUDE.md](../../CLAUDE.md) - 開発フロー統合情報

---

**📝 更新履歴**
- 2025-08-25: Type Generation システム初版作成（Issue #144, #155対応）
- 2025-08-25: CI/CD安定性向上・troubleshooting追加