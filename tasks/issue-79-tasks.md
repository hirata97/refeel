# Issue #79: 目標カテゴリとタグの連携機能実装

## 概要
## 概要
タグと目標カテゴリを連携させ、日記の分類と目標の進捗管理を効率化します。

## 実装内容
### 🎯 **目標カテゴリ連携**
- タグと目標の紐付け機能
- 目標別の日記フィルタリング
- 目標進捗の自動追跡
- カテゴリベースの分析

### 📈 **進捗管理**
- タグベースの目標達成度表示
- 期間別の進捗グラフ
- 目標達成予測
- 振り返りレポート生成

### 🔄 **自動化機能**
- タグベースの自動カテゴリ分類
- 関連目標の自動提案
- 定期的な進捗通知
- 目標調整の提案

## データベース設計
```sql
CREATE TABLE tag_goals (
  tag_id UUID REFERENCES tags(id),
  goal_id UUID REFERENCES goals(id),
  weight FLOAT DEFAULT 1.0,
  PRIMARY KEY (tag_id, goal_id)
);

CREATE TABLE goal_progress (
  goal_id UUID REFERENCES goals(id),
  diary_id UUID REFERENCES diaries(id),
  progress_value FLOAT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (goal_id, diary_id)
);
```

## 技術要件
- 進捗計算アルゴリズム
- データ視覚化
- リアルタイム更新
- 通知システム連携

## 受け入れ基準
- [ ] タグと目標の紐付けが機能する
- [ ] 進捗が正しく計算される
- [ ] 視覚化が分かりやすい
- [ ] 自動化機能が正常に動作する

## ラベル
priority:P2,size:M,type-basic:feature

## 実装タスク
- [ ] Issue内容の詳細確認
- [ ] 必要なファイルの特定
- [ ] 実装方針の決定
- [ ] コード実装
- [ ] テスト実行
- [ ] 動作確認

## 実行コマンド例
```bash
# Issue作業開始
npm run start-issue 79

# 作業完了後PR作成  
npm run create-pr "fix: Issue #79 目標カテゴリとタグの連携機能実装" "Issue #79の対応

Closes #79"
```

## Claude Code用プロンプト
```
Issue #79の対応をお願いします。

タイトル: 目標カテゴリとタグの連携機能実装
ラベル: priority:P2,size:M,type-basic:feature

内容:
## 概要
タグと目標カテゴリを連携させ、日記の分類と目標の進捗管理を効率化します。

## 実装内容
### 🎯 **目標カテゴリ連携**
- タグと目標の紐付け機能
- 目標別の日記フィルタリング
- 目標進捗の自動追跡
- カテゴリベースの分析

### 📈 **進捗管理**
- タグベースの目標達成度表示
- 期間別の進捗グラフ
- 目標達成予測
- 振り返りレポート生成

### 🔄 **自動化機能**
- タグベースの自動カテゴリ分類
- 関連目標の自動提案
- 定期的な進捗通知
- 目標調整の提案

## データベース設計
```sql
CREATE TABLE tag_goals (
  tag_id UUID REFERENCES tags(id),
  goal_id UUID REFERENCES goals(id),
  weight FLOAT DEFAULT 1.0,
  PRIMARY KEY (tag_id, goal_id)
);

CREATE TABLE goal_progress (
  goal_id UUID REFERENCES goals(id),
  diary_id UUID REFERENCES diaries(id),
  progress_value FLOAT,
  recorded_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (goal_id, diary_id)
);
```

## 技術要件
- 進捗計算アルゴリズム
- データ視覚化
- リアルタイム更新
- 通知システム連携

## 受け入れ基準
- [ ] タグと目標の紐付けが機能する
- [ ] 進捗が正しく計算される
- [ ] 視覚化が分かりやすい
- [ ] 自動化機能が正常に動作する
```

---
Generated: 2025-08-21 17:23:16
Source: https://github.com/RsPYP/GoalCategorizationDiary/issues/79
