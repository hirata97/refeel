# Vue Boilerplate

2025/01/01作成
Vue 3 と Vite を用いた開発を始めるためのテンプレート。

## 新しいリポジトリの作成方法

1. **ローカルにクローン**
   ```
   git clone https://github.com/<このリポジトリのURL>.git
   cd <クローンしたディレクトリ>
   ```
2. **リモートURLを削除**
   ```
   git remote remove origin
   ```
3. **GitHubで新しいリポジトリを作成し、リンクを設定**
   ```
   git remote add origin https://github.com/<ユーザー名>/<新しいリポジトリ>.git
   git branch -M main
   git push -u origin main
   ```

## 推奨開発環境

- [VSCode](https://code.visualstudio.com/)
- [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar)（Veturは無効化）

## TypeScriptの`.vue`サポート

`.vue`ファイルの型情報を正しく処理するため、`tsc`の代わりに`vue-tsc`を使用します。また、エディタにはVolarを導入する必要があります。

## プロジェクトセットアップ

1. **依存関係をインストール**
   ```
   npm install
   ```
2. **開発用ビルドとホットリロード**
   ```
   npm run dev
   ```
3. **本番用ビルド**
   ```
   npm run build
   ```
4. **ユニットテストの実行**
   ```
   npm run test:unit
   ```
5. **E2Eテストの実行**  
   初回のみブラウザをインストール：
   ```
   npx playwright install
   ```
   テスト実行：
   ```
   npm run test:e2e
   ```

## Lint

コードをLintする：

```
npm run lint
```

## GitHub Issue → PR 自動化ワークフロー

このプロジェクトでは、GitHub IssueからPR作成までを自動化する効率的なワークフローを提供しています。

### 利用可能なコマンド

#### 1. Issue一覧・詳細取得
```bash
npm run fetch-issue [issue番号]
```
- Issue番号なしで実行するとオープン中のIssue一覧を表示
- Issue番号を指定すると詳細情報を取得してタスクファイルを生成

#### 2. Issue作業開始（推奨）
```bash
npm run start-issue [issue番号]
```
- 専用のフィーチャーブランチを自動作成
- タスク管理ファイル生成（`tasks/issue-[番号]-tasks.md`）
- 自分をIssueにアサイン
- Claude Code用のプロンプトをクリップボードにコピー

#### 3. PR作成
```bash
npm run create-pr "タイトル" "説明"
```
- 変更を自動コミット・プッシュ
- developブランチに向けたPRを自動作成
- Claude Code署名付きコミットメッセージ

### 完全なワークフロー例

```bash
# 1. 現在のIssue確認
npm run fetch-issue

# 2. Issue #18の作業開始
npm run start-issue 18

# 3. Claude Codeで実装作業
# （クリップボードのプロンプトをClaude Codeに貼り付け）

# 4. 作業完了後PR作成
npm run create-pr "feat: テーマ機能の活用" "Issue #18の対応完了"
```

### 生成されるファイル

- `tasks/issue-[番号]-tasks.md` - 詳細なタスク管理ファイル
  - Issue内容の整理
  - 実装チェックリスト  
  - Claude Code用プロンプト
  - 推奨コマンド例

### 特徴

- **自動ブランチ作成**: Issue番号とタイトルから適切なブランチ名を生成
- **Claude Code連携**: 最適化されたプロンプトを自動生成
- **アサイン機能**: 作業開始時に自動で自分をアサイン
- **テンプレート化**: 一貫したPR本文とコミットメッセージ

## Supabaseの設定

このプロジェクトでは、Supabaseを使用してデータベース操作を行います。以下の手順に従ってSupabaseを設定してください。

1. **Supabaseプロジェクトの作成**

   - [Supabase](https://supabase.io/)にサインアップし、新しいプロジェクトを作成します。

2. **APIキーとURLの取得**

   - プロジェクトの設定ページから、APIキーとURLを取得します。

3. **環境変数の設定**

   SupabaseのURLとAPIキーを環境変数として設定します。プロジェクトのルートディレクトリに `.env` ファイルを作成し、以下の内容を追加します。

   ```
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_KEY=your-anon-key
   ```

4. **Supabaseクライアントの初期化**

   - `src/lib/supabase.ts`ファイルでSupabaseクライアントを初期化します。

   ```typescript
   // filepath: /home/mizuki/projects/GoalCategorizationDiary/src/lib/supabase.ts
   import { createClient } from '@supabase/supabase-js'

   const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
   const supabaseKey = import.meta.env.VITE_SUPABASE_KEY

   export const supabase = createClient(supabaseUrl, supabaseKey)
   ```

5. **Supabaseクライアントの提供**

   - `src/main.ts`ファイルでSupabaseクライアントをアプリケーション全体に提供します。

   ```typescript
   // filepath: /home/mizuki/projects/GoalCategorizationDiary/src/main.ts
   import { createApp } from 'vue'
   import App from './App.vue'
   import { supabase } from './lib/supabase'

   createApp(App).provide('supabase', supabase).mount('#app')
   ```

# プロジェクトドキュメント

## テスト作成ガイドライン

### テストファイルの命名規則

- **形式**: `正常系または異常系_コンポーネント名_ナンバリング.spec.js`
- **例**: `normal_LoginPage_01.spec.js`, `exception_LoginPage_01.spec.js`

### テストの内容

- 各テストファイルは一つの観点に焦点を当てます。
- 正常系と異常系のテストを同じファイルに含めることができます。

### ディレクトリ構造

- `tests/`ディレクトリ内に、各コンポーネントごとにサブディレクトリを作成します（例: ログインページのテストは`LoginPage`ディレクトリに配置）。
- テストファイルは適切なコンポーネントディレクトリ内に配置します。

これらのガイドラインに従うことで、テストスイートの一貫性と明確さを確保し、チーム全員が理解しやすく貢献しやすくなります。

### clineの使用法

Memory Bankの更新: すべてのMemory Bankファイルが作成されました。これらのファイルに具体的な情報を追加することが重要です。各ファイルのセクションにプロジェクトに関する詳細を記入してください。

プロジェクトのレビュー: 現在のプロジェクトの状態を確認し、進捗状況や残りのタスクを把握します。progress.mdファイルにこれらの情報を記載することで、プロジェクトの全体像を把握しやすくなります。

次のステップの計画: activeContext.mdに基づいて、次に取り組むべきタスクを計画します。これには、現在の作業の焦点、最近の変更、次のステップが含まれます。

技術的な詳細の確認: techContext.mdを使用して、使用している技術や開発環境、技術的な制約を確認します。これにより、開発プロセスがスムーズに進むようになります。

システムパターンの確認: systemPatterns.mdを参照して、システムアーキテクチャや設計パターンを確認します。これにより、プロジェクトの技術的な方向性を理解しやすくなります。
Working with Cline
Core Workflows
Plan Mode
ディスカッションと計画を行う。

Act Mode

特定のタスクの実装と実行に使用

Key Commands
"follow your custom instructions"
Clineにメモリバンクファイルを読み取って、中断したところから続行するように指示(タスクの開始時にこれを使用)

"initialize memory bank"
新しいプロジェクトを開始するときに使用

"update memory bank"
タスク中に完全なドキュメントのレビューと更新をトリガー

Documentation Updates
メモリバンクのアップデートは、次の場合に自動的に行われます

You discover new patterns in your project

After implementing significant changes

When you explicitly request with "update memory bank"

When you feel context needs clarification
