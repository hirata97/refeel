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

---
