# .vscode/ - VS Code推奨設定

このディレクトリには、Visual Studio Code（VS Code）の推奨設定が含まれています。

## 📋 目次

- [概要](#概要)
- [設定ファイル一覧](#設定ファイル一覧)
- [推奨拡張機能](#推奨拡張機能)
- [エディタ設定](#エディタ設定)
- [デバッグ設定](#デバッグ設定)
- [開発効率化](#開発効率化)
- [トラブルシューティング](#トラブルシューティング)

## 概要

`.vscode/` ディレクトリは、チーム全体で統一された開発環境を実現するための設定を提供します。

### 目的

- **設定統一**: チームメンバー間のエディタ設定統一
- **開発効率化**: 推奨拡張機能による生産性向上
- **品質保証**: 保存時の自動フォーマット・Lint
- **新規参加者支援**: セットアップの簡素化

### 重要な注意

これらの設定は**推奨**であり、個人の設定を上書きしません。プロジェクト固有の設定として機能します。

## 設定ファイル一覧

```
.vscode/
├── README.md          # このファイル
├── settings.json      # エディタ設定（自動フォーマット等）
└── extensions.json    # 推奨拡張機能リスト
```

### settings.json - エディタ設定

プロジェクト固有のVS Code設定を定義します。

### extensions.json - 推奨拡張機能

チーム推奨の拡張機能リストを定義します。VS Code起動時に未インストール拡張機能をインストールするよう促します。

## 推奨拡張機能

### 必須拡張機能（6個）

以下の拡張機能は、このプロジェクトで開発するために**強く推奨**されます。

#### 1. Vue.volar（Vue Language Features）

**ID**: `Vue.volar`

**目的**: Vue 3 Composition API、`<script setup>`構文のサポート

**機能**:
- Vue SFC（Single File Component）のシンタックスハイライト
- TypeScript型チェック（`.vue`ファイル内）
- コード補完・インテリセンス
- テンプレート内の型推論

**重要**: Vetur（古いVue拡張機能）は無効化すること

#### 2. vitest.explorer（Vitest Test Explorer）

**ID**: `vitest.explorer`

**目的**: Vitestテストのビジュアル管理

**機能**:
- テストツリー表示
- 個別テスト実行
- テストデバッグ
- カバレッジ表示

**使用方法**:
- サイドバー「Testing」アイコン
- テストファイル横の「Run Test」ボタン

#### 3. ms-playwright.playwright（Playwright Test for VSCode）

**ID**: `ms-playwright.playwright`

**目的**: Playwright E2Eテストのサポート

**機能**:
- E2Eテストの実行・デバッグ
- テストレコーディング（Codegen）
- スクリーンショット・トレース確認
- ブラウザ選択実行

**使用方法**:
```bash
# テストレコーディング
npx playwright codegen http://localhost:5173
```

#### 4. dbaeumer.vscode-eslint（ESLint）

**ID**: `dbaeumer.vscode-eslint`

**目的**: リアルタイムESLintエラー表示・自動修正

**機能**:
- コーディング中のLintエラー表示
- 保存時の自動修正（`source.fixAll`）
- Quick Fix提案

**設定**（`settings.json`）:
```json
{
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit"
  }
}
```

#### 5. EditorConfig.EditorConfig（EditorConfig for VS Code）

**ID**: `EditorConfig.EditorConfig`

**目的**: `.editorconfig` 設定の適用

**機能**:
- インデントスタイル統一（spaces/tabs）
- 行末文字統一（LF/CRLF）
- ファイル末尾改行統一

**設定例**（`.editorconfig`）:
```ini
[*]
indent_style = space
indent_size = 2
end_of_line = lf
insert_final_newline = true
```

#### 6. esbenp.prettier-vscode（Prettier - Code formatter）

**ID**: `esbenp.prettier-vscode`

**目的**: コードフォーマット自動化

**機能**:
- 保存時の自動フォーマット
- TypeScript、Vue、JSON、Markdown等対応
- チーム統一フォーマット

**設定**（`settings.json`）:
```json
{
  "editor.formatOnSave": true,
  "editor.defaultFormatter": "esbenp.prettier-vscode"
}
```

### 拡張機能インストール方法

**自動インストール**:
1. プロジェクトをVS Codeで開く
2. 右下に「推奨される拡張機能をインストールしますか？」と表示
3. 「すべてインストール」をクリック

**手動インストール**:
```bash
# コマンドパレット（Cmd/Ctrl+Shift+P）
Extensions: Show Recommended Extensions
```

または、各拡張機能IDで検索してインストール。

## エディタ設定

### settings.json 解説

現在の設定内容:

```json
{
  // 保存時にESLint自動修正
  "editor.codeActionsOnSave": {
    "source.fixAll": "explicit"
  },

  // 保存時にPrettier自動フォーマット
  "editor.formatOnSave": true,

  // デフォルトフォーマッター: Prettier
  "editor.defaultFormatter": "esbenp.prettier-vscode",

  // TypeScriptインポートパス: 相対パス優先
  "typescript.preferences.importModuleSpecifier": "relative",

  // Vue Code Actions無効化（Volarと競合回避）
  "vue.codeActions.enabled": false,

  // 拡張機能推奨無視（プロジェクト設定優先）
  "extensions.ignoreRecommendations": true,

  // Cline拡張機能無効化（このプロジェクトでは不使用）
  "cline.enabled": false
}
```

### 設定カスタマイズ

**個人設定の追加**:

プロジェクト設定を維持しつつ、個人設定を追加したい場合：

1. **ユーザー設定**: `Cmd/Ctrl + ,` → ユーザータブ
2. **ワークスペース設定**: `Cmd/Ctrl + ,` → ワークスペースタブ

**推奨**: 個人設定はユーザー設定に、プロジェクト固有設定は `.vscode/settings.json` に配置。

### よく使う設定オプション

**追加推奨設定**:

```json
{
  // ファイル自動保存
  "files.autoSave": "onFocusChange",

  // タブサイズ（EditorConfigと統一）
  "editor.tabSize": 2,

  // 末尾空白の自動削除
  "files.trimTrailingWhitespace": true,

  // ファイル末尾改行
  "files.insertFinalNewline": true,

  // ミニマップ非表示（画面広く使用）
  "editor.minimap.enabled": false,

  // ブレッドクラム表示（ファイルパス表示）
  "breadcrumbs.enabled": true
}
```

## デバッグ設定

### launch.json（未作成）

現在、デバッグ設定ファイル（`launch.json`）は未作成です。必要に応じて以下を参考に作成してください。

### 推奨デバッグ設定

#### Vue.js アプリケーションデバッグ

**`.vscode/launch.json` 例**:

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome against localhost",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true,
      "userDataDir": "${workspaceFolder}/.vscode/chrome-debug"
    },
    {
      "type": "node",
      "request": "launch",
      "name": "Vitest: Debug Current File",
      "program": "${workspaceFolder}/node_modules/vitest/vitest.mjs",
      "args": ["run", "${file}"],
      "console": "integratedTerminal",
      "internalConsoleOptions": "neverOpen"
    }
  ]
}
```

**使用方法**:
1. ブレークポイント設定（行番号左クリック）
2. デバッグパネル（`Cmd/Ctrl + Shift + D`）
3. 「Launch Chrome against localhost」選択
4. `F5` でデバッグ開始

#### Playwright E2Eテストデバッグ

Playwright拡張機能を使用すれば、`launch.json`不要でデバッグ可能：

1. E2Eテストファイルを開く
2. テストケース横の「Debug Test」アイコンクリック
3. ブレークポイントで自動停止

## 開発効率化

### キーボードショートカット

**よく使うショートカット**:

| 操作 | Mac | Windows/Linux |
|-----|-----|---------------|
| コマンドパレット | `Cmd + Shift + P` | `Ctrl + Shift + P` |
| ファイル検索 | `Cmd + P` | `Ctrl + P` |
| シンボル検索 | `Cmd + Shift + O` | `Ctrl + Shift + O` |
| 定義へ移動 | `F12` | `F12` |
| 参照を全て検索 | `Shift + F12` | `Shift + F12` |
| フォーマット | `Shift + Option + F` | `Shift + Alt + F` |
| Quick Fix | `Cmd + .` | `Ctrl + .` |
| ターミナル表示 | ``Ctrl + ` `` | ``Ctrl + ` `` |

### スニペット

**Vueコンポーネントスニペット**（Volar提供）:

- `vbase`: 基本Vue SFCテンプレート
- `vsetup`: `<script setup>` テンプレート
- `vref`: `ref()` 定義
- `vcomputed`: `computed()` 定義

**カスタムスニペット作成**:

1. コマンドパレット → `Snippets: Configure User Snippets`
2. `vue.json` 選択
3. スニペット定義:

```json
{
  "Vue Composition API Component": {
    "prefix": "vcomp",
    "body": [
      "<template>",
      "  <div>",
      "    $1",
      "  </div>",
      "</template>",
      "",
      "<script setup lang=\"ts\">",
      "import { ref } from 'vue'",
      "",
      "$2",
      "</script>"
    ],
    "description": "Vue 3 Composition API Component"
  }
}
```

### タスク自動化

**tasks.json（未作成）**

VS Codeタスク機能で、よく使うコマンドを統合可能：

**`.vscode/tasks.json` 例**:

```json
{
  "version": "2.0.0",
  "tasks": [
    {
      "label": "dev",
      "type": "npm",
      "script": "dev",
      "problemMatcher": [],
      "presentation": {
        "reveal": "always",
        "panel": "new"
      }
    },
    {
      "label": "test:unit",
      "type": "npm",
      "script": "test:unit",
      "problemMatcher": [],
      "group": {
        "kind": "test",
        "isDefault": true
      }
    }
  ]
}
```

**実行**: `Cmd/Ctrl + Shift + B` → タスク選択

## トラブルシューティング

### よくある問題

#### 1. Volarが動作しない

**症状**: Vue SFCのシンタックスハイライトが効かない

**原因**: Vetur拡張機能との競合

**解決策**:
1. コマンドパレット → `Extensions: Show Installed Extensions`
2. Veturを検索
3. 「無効化（ワークスペース）」または「アンインストール」

#### 2. ESLintエラーが表示されない

**症状**: コード内のLintエラーが表示されない

**解決策**:
1. コマンドパレット → `ESLint: Restart ESLint Server`
2. VS Code再起動
3. `node_modules`削除 → `npm install` 再実行

#### 3. Prettierが自動フォーマットしない

**症状**: 保存時にフォーマットされない

**確認事項**:
- [ ] `settings.json` で `"editor.formatOnSave": true` 設定
- [ ] `"editor.defaultFormatter": "esbenp.prettier-vscode"` 設定
- [ ] Prettier拡張機能インストール済み

**解決策**:
```bash
# .prettierrc.json 存在確認
ls -la .prettierrc.json

# 手動フォーマット実行
Shift + Option/Alt + F
```

#### 4. TypeScript型エラーが表示されない

**症状**: `.vue` ファイル内のTypeScript型エラーが表示されない

**解決策**:
1. Volar拡張機能の「Take Over Mode」有効化
2. コマンドパレット → `TypeScript: Select TypeScript Version` → `Use Workspace Version`
3. `tsconfig.json` の `include` 設定確認

#### 5. 拡張機能推奨が表示されない

**症状**: プロジェクト開く際に拡張機能インストール推奨が表示されない

**解決策**:
```json
// ユーザー settings.json で以下を確認
{
  "extensions.ignoreRecommendations": false  // false に設定
}
```

## 参考資料

### 公式ドキュメント
- [VS Code公式ドキュメント](https://code.visualstudio.com/docs)
- [Volar公式ドキュメント](https://github.com/vuejs/language-tools)
- [Vitest拡張機能](https://marketplace.visualstudio.com/items?itemName=vitest.explorer)
- [Playwright拡張機能](https://marketplace.visualstudio.com/items?itemName=ms-playwright.playwright)

### VS Code設定ガイド
- [Settings Sync](https://code.visualstudio.com/docs/editor/settings-sync) - 設定同期
- [Multi-root Workspaces](https://code.visualstudio.com/docs/editor/multi-root-workspaces) - マルチルート
- [Debugging](https://code.visualstudio.com/docs/editor/debugging) - デバッグガイド

### プロジェクト内関連ドキュメント
- `CLAUDE.md` - 開発指針
- `docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md` - 開発ワークフロー
- `.editorconfig` - エディタ設定統一

---

**最終更新**: 2025-11-14
**メンテナー**: GoalCategorizationDiary開発チーム
