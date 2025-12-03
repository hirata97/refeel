# 環境設定

## Supabase設定

環境変数ファイル（`.env`）を作成：

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_KEY=your-anon-key
```

**📚 認証システムドキュメント**:
- **🚀 クイックセットアップ**: [SUPABASE_QUICK_SETUP.md](SUPABASE_QUICK_SETUP.md) - 5分で設定完了
- **📖 詳細ドキュメント**: [SUPABASE_AUTH.md](SUPABASE_AUTH.md) - 完全な技術仕様

### 認証システム概要

- **認証方法**: メール + パスワード
- **状態管理**: Pinia ストア (`src/stores/auth.ts`)
- **セッション管理**: 自動更新・永続化対応
- **ルート保護**: Vue Router ガード機能
- **データベース**: RLS (Row Level Security) 設定済み

### 必要なデータベーステーブル

- `accounts` - ユーザープロファイル情報
- `diaries` - 日記データ（ユーザー毎に分離）

### セットアップが必要な場合

新しいSupabaseプロジェクトでは以下の設定が必要：

1. 認証プロバイダー設定 (メール確認無効化)
2. データベーステーブル作成 (SQLスクリプト実行)
3. RLSポリシー設定 (セキュリティ設定)

## 推奨開発環境

- **エディタ**: VSCode
- **拡張機能**: 
  - Volar（Vue）
  - Veturは無効化
  - Prettier
  - ESLint

## Node.js バージョン

- **推奨**: Node.js 18.x 以上
- **パッケージマネージャ**: npm (yarn は使用しない)

## Docker開発環境（オプション）

Docker Desktopをお使いの場合、以下の開発環境を利用できます：

- **VSCode Dev Container**: 完全な開発環境をコンテナで実行
- **Docker Compose**: Supabaseローカル環境との統合
- **自動セットアップ**: 環境変数・依存関係が自動構成

詳細は **[../.devcontainer/README.md](../../.devcontainer/README.md)** を参照してください。

## 初回セットアップ（ローカル環境）

```bash
# 1. リポジトリクローン
git clone https://github.com/RsPYP/GoalCategorizationDiary.git
cd GoalCategorizationDiary

# 2. 依存関係インストール
npm install

# 3. 環境変数設定
cp .env.example .env
# .env ファイルを編集してSupabase情報を設定

# 4. 開発サーバー起動
npm run dev
```

## トラブルシューティング

### よくある問題

1. **Supabase接続エラー**: 環境変数の設定を確認
2. **TypeScriptエラー**: `npm run type-check` で詳細確認
3. **リンティングエラー**: `npm run lint` で修正可能なものは自動修正
4. **テスト失敗**: `npm run test:unit` で詳細確認