# 自動PR作成機能テスト

このファイルはClaude Code自動PR作成機能のテスト用です。

## 機能概要
- `npm run create-pr "タイトル" "説明"`でPR自動作成
- 変更をコミット→プッシュ→PR作成を一括実行
- Claude Codeとの連携用

## 使用方法
```bash
npm run create-pr "feat: 新機能追加" "詳細な説明"
```

テスト実行日時: $(date)