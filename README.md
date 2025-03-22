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

---
