# コミット・プッシュガイドライン

## 定期的なコミットプッシュ体制

### 基本方針
- **小さく頻繁に**: 機能単位での細かいコミット推奨
- **定期プッシュ**: 作業開始から30分以内に初回プッシュ
- **進捗可視化**: 各作業段階でのプッシュによる進捗追跡

### コミットタイミング
1. **作業開始時** (0-15分)
   - タスク計画・調査結果をコミット
   - 例: `docs: Issue #XXX 作業計画・要件調査`

2. **実装段階** (15-30分間隔)
   - 機能実装の各ステップをコミット
   - 例: `feat: Issue #XXX テストファイル雛形作成`
   - 例: `feat: Issue #XXX 正常系テストケース実装`

3. **完了前** (機能完成時)
   - 最終調整・統合をコミット
   - 例: `fix: Issue #XXX テストエラー修正とカバレッジ向上`

### プッシュタイミング
- **初回プッシュ**: 作業開始から30分以内
- **定期プッシュ**: 1時間に1回以上
- **完了プッシュ**: PR作成前の最終確認後

### コミットメッセージ規則
```
{type}: Issue #{number} {description}

{詳細説明（必要に応じて）}

🤖 Generated with [Claude Code](https://claude.ai/code)

Co-Authored-By: Claude <noreply@anthropic.com>
```

### 自動化スクリプト活用
```bash
# 定期的な作業保存
npm run save-progress "進捗説明"

# 段階的品質チェック
npm run quick-check  # lint + type-check

# 完了前最終チェック
npm run ci:all       # 全品質チェック
```

### 緊急時・中断時の対応
1. **作業中断時**
   - 現在の状況をコミット
   - `WIP: Issue #XXX 作業中断 - {理由}`

2. **緊急切り替え時**  
   - 進捗を保存してプッシュ
   - 新ブランチ作成前にstash回避

3. **復帰時**
   - 前回コミットからの差分確認
   - 作業再開コミットで状況説明

## 効果的な開発フロー

### Phase実装サイクル
```bash
# 1. 作業開始・計画 (0-15分)
git add . && git commit -m "docs: Issue #XXX Phase開始・実装計画"

# 2. 初期実装 (15-30分) 
git add . && git commit -m "feat: Issue #XXX 基本構造実装"
git push

# 3. 機能実装 (30分間隔)
git add . && git commit -m "feat: Issue #XXX 主要機能実装完了"
git push

# 4. テスト・検証 (完了時)
git add . && git commit -m "test: Issue #XXX テストケース追加・検証完了"
git push

# 5. PR作成
npm run create-pr "タイトル" "説明"
```

### 品質保証チェックポイント
1. **段階チェック**: 実装中の`npm run quick-check`
2. **機能チェック**: 機能完成時の`npm run test:unit` 
3. **最終チェック**: PR前の`npm run ci:all`

## 成功指標
- **進捗可視化**: 1日の作業で3-5回のプッシュ
- **品質維持**: 各段階での品質チェック通過
- **効率向上**: 中断・復帰時の迅速な状況把握