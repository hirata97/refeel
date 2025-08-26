# Issue #164: 感情タグ機能の実装

## 概要
## Summary
気分スコアに加えて具体的な感情タグを複数選択できる機能を追加し、モチベーション要因の詳細分析を可能にする。

## Root Cause Analysis (根本原因分析)
**なぜこの問題が発生したか:**
- [x] 設計段階での考慮不足
- [ ] 実装時のロジックミス
- [ ] テストケースの不備
- [ ] 外部依存関係の変更
- [x] 要件の理解不足
- [ ] 技術選定の問題
- [ ] その他: [具体的な原因を記述]

**具体的な原因:**
現在の気分スコア（1-10）だけでは感情の詳細が分からず、同じスコアでも異なる要因を区別できない。モチベーション分析には感情の質的な違いの把握が必要。

**今後の予防策:**
- 定量データと定性データのバランス設計
- 感情の多面性を考慮したデータ構造設計

## 実装内容

### 機能仕様
**感情タグ選択機能**：
- 複数選択可能なタグシステム
- カテゴリ別タグ分類（ポジティブ・ネガティブ・中性）
- タグ別の気分変化トレンド分析

### タグ候補
**ポジティブ**：達成感、集中、やりがい、安心、充実、興奮
**ネガティブ**：疲労、不安、焦り、失望、孤独、退屈  
**中性**：平常、淡々、思考中、準備中

### UI設計
```vue
<v-card variant="outlined" class="emotion-tags">
  <v-card-subtitle>今日の感情（複数選択可）</v-card-subtitle>
  <v-card-text>
    <v-chip-group
      v-model="selectedEmotions"
      multiple
      color="primary"
    >
      <v-chip
        v-for="emotion in emotionTags"
        :key="emotion.id"
        :value="emotion.id"
        :color="emotion.color"
        variant="outlined"
      >
        {{ emotion.label }}
      </v-chip>
    </v-chip-group>
  </v-card-text>
</v-card>
```

### データベース変更
- `emotion_tags`テーブル新規作成
- `diary_emotion_tags`中間テーブル作成（多対多関係）
- 型定義更新

### 分析機能
- タグ別気分変化グラフ
- 感情とモチベーションの相関分析
- レポートページでのタグ頻度表示

## Test plan
- [ ] 感情タグ選択・保存の動作確認
- [ ] 複数タグ選択時の動作確認
- [ ] タグ未選択でも正常保存されることを確認
- [ ] タグ別分析機能の動作確認
- [ ] ユニットテスト：タグ管理ロジック
- [ ] E2Eテスト：感情タグ記録フロー

## 関連
**親チケット**: #160 - [親チケット] モチベーション測定機能強化

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>

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
npm run start-issue 164

# 作業完了後PR作成  
npm run create-pr "fix: Issue #164 感情タグ機能の実装" "Issue #164の対応

Closes #164"
```

## Claude Code用プロンプト
```
Issue #164の対応をお願いします。

タイトル: 感情タグ機能の実装
ラベル: priority:P2,size:M,type-basic:feature

内容:
## Summary
気分スコアに加えて具体的な感情タグを複数選択できる機能を追加し、モチベーション要因の詳細分析を可能にする。

## Root Cause Analysis (根本原因分析)
**なぜこの問題が発生したか:**
- [x] 設計段階での考慮不足
- [ ] 実装時のロジックミス
- [ ] テストケースの不備
- [ ] 外部依存関係の変更
- [x] 要件の理解不足
- [ ] 技術選定の問題
- [ ] その他: [具体的な原因を記述]

**具体的な原因:**
現在の気分スコア（1-10）だけでは感情の詳細が分からず、同じスコアでも異なる要因を区別できない。モチベーション分析には感情の質的な違いの把握が必要。

**今後の予防策:**
- 定量データと定性データのバランス設計
- 感情の多面性を考慮したデータ構造設計

## 実装内容

### 機能仕様
**感情タグ選択機能**：
- 複数選択可能なタグシステム
- カテゴリ別タグ分類（ポジティブ・ネガティブ・中性）
- タグ別の気分変化トレンド分析

### タグ候補
**ポジティブ**：達成感、集中、やりがい、安心、充実、興奮
**ネガティブ**：疲労、不安、焦り、失望、孤独、退屈  
**中性**：平常、淡々、思考中、準備中

### UI設計
```vue
<v-card variant="outlined" class="emotion-tags">
  <v-card-subtitle>今日の感情（複数選択可）</v-card-subtitle>
  <v-card-text>
    <v-chip-group
      v-model="selectedEmotions"
      multiple
      color="primary"
    >
      <v-chip
        v-for="emotion in emotionTags"
        :key="emotion.id"
        :value="emotion.id"
        :color="emotion.color"
        variant="outlined"
      >
        {{ emotion.label }}
      </v-chip>
    </v-chip-group>
  </v-card-text>
</v-card>
```

### データベース変更
- `emotion_tags`テーブル新規作成
- `diary_emotion_tags`中間テーブル作成（多対多関係）
- 型定義更新

### 分析機能
- タグ別気分変化グラフ
- 感情とモチベーションの相関分析
- レポートページでのタグ頻度表示

## Test plan
- [ ] 感情タグ選択・保存の動作確認
- [ ] 複数タグ選択時の動作確認
- [ ] タグ未選択でも正常保存されることを確認
- [ ] タグ別分析機能の動作確認
- [ ] ユニットテスト：タグ管理ロジック
- [ ] E2Eテスト：感情タグ記録フロー

## 関連
**親チケット**: #160 - [親チケット] モチベーション測定機能強化

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

---
Generated: 2025-08-26 17:26:15
Source: https://github.com/RsPYP/GoalCategorizationDiary/issues/164
