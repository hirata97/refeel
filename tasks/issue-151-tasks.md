# Issue #151: [Refactor] 巨大ファイルの分割と保守性向上

## 概要
## 📝 機能概要
コードベースの品質分析の結果、いくつかの大きなファイルと保守性の課題を特定しました。単一責任原則に従って、巨大ファイルを機能別に分割し、保守性と拡張性を向上させるリファクタリングを段階的に実施します。

## 🎯 目的・背景
### 現状の問題点
- **巨大ファイルの存在**: `src/stores/auth.ts` (737行)、`src/components/PaginationComponent.vue` (660行)など
- **セキュリティ機能の分散**: `src/utils/`内に8個のセキュリティ関連ファイルが分散
- **認証ロジックの重複**: `stores/auth.ts` と `utils/auth.ts` で機能が重複
- **単一責任原則違反**: 1つのファイルに複数の責務が混在

### 解決の必要性
- 今後の機能追加・保守を効率的に行うため
- テストの粒度向上とデバッグの容易性向上
- 新規メンバーのコード理解促進

## ✅ 受け入れ条件
### Phase 1: 認証ストアの分割
- [ ] `src/stores/auth.ts` (737行) を以下に分割:
  - [ ] `stores/auth/session.ts` - セッション管理 (~150行)
  - [ ] `stores/auth/authentication.ts` - ログイン/ログアウト (~150行)
  - [ ] `stores/auth/security.ts` - セキュリティチェック (~150行)
  - [ ] `stores/auth/lockout.ts` - アカウントロックアウト (~150行)
  - [ ] `stores/auth/index.ts` - 統合interface (~50行)
- [ ] 既存の認証機能が正常に動作すること
- [ ] 全ての認証関連テストがパスすること

### Phase 2: ページネーションコンポーネントの分割
- [ ] `src/components/PaginationComponent.vue` (660行) を以下に分割:
  - [ ] `components/pagination/PaginationCore.vue` - 基本ページネーション (~150行)
  - [ ] `components/pagination/PaginationControls.vue` - ナビゲーション制御 (~150行)
  - [ ] `components/pagination/PaginationJump.vue` - ページジャンプ機能 (~150行)
  - [ ] `components/pagination/PaginationAnimation.vue` - アニメーション機能 (~150行)
- [ ] 既存のページネーション機能が正常に動作すること

### Phase 3: セキュリティモジュールの統合
- [ ] `src/utils/security-*.ts` を `src/security/` に統合:
  - [ ] `src/security/core/` - 基本セキュリティ機能
  - [ ] `src/security/monitoring/` - セキュリティ監視
  - [ ] `src/security/reporting/` - セキュリティレポート
  - [ ] `src/security/index.ts` - エクスポート統一
- [ ] セキュリティ関連機能が正常に動作すること

### Phase 4: 設定ページの分割
- [ ] `src/views/SettingPage.vue` (607行) をタブごとにコンポーネント分割:
  - [ ] `components/settings/ProfileTab.vue`
  - [ ] `components/settings/SecurityTab.vue`
  - [ ] `components/settings/NotificationTab.vue`
  - [ ] `components/settings/DataTab.vue`
- [ ] 設定画面が正常に動作すること

## 🔧 技術的要件
- **後方互換性を保持**すること
- **既存のAPIインターフェースは変更しない**こと
- 各分割されたファイルが200行以下であること
- TypeScript strict modeに準拠すること
- 既存のコーディング規則に準拠すること

## 🧪 テスト要件
- [ ] 既存の全テストがパス
- [ ] 型チェック (`npm run ci:type-check`) がパス
- [ ] リンティング (`npm run ci:lint`) がパス
- [ ] 分割後の各モジュールにユニットテスト追加
- [ ] パフォーマンスの劣化がないことを確認

## 📚 参考資料
### 内部ドキュメント
- [開発ワークフロー](docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)
- [コーディング規約](docs/DEVELOPMENT/CODING_STANDARDS.md)
- [アーキテクチャガイド](docs/DEVELOPMENT/ARCHITECTURE.md)

### 外部参考資料
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia ストア分割ベストプラクティス](https://pinia.vuejs.org/core-concepts/)

## 📊 期待効果
| 項目 | Before | After | 改善度 |
|------|--------|--------|--------|
| 最大ファイルサイズ | 737行 | ~200行 | 70%↓ |
| セキュリティファイル数 | 8個分散 | 1モジュール統合 | 保守性↑ |
| テスト対象数 | 巨大ファイル | 小さな単位 | テスト性↑ |
| 新機能追加時の影響 | 広範囲 | 局所的 | 開発効率↑ |

## 🚨 注意事項
- この作業は複数のPRに分割して段階的に実施
- 各Phaseごとにテストを実行して品質確認
- 既存の動作に影響がないことを確認
- マージ後は必ずスモークテストを実行

## ラベル
priority:P1,size:L,type-basic:refactor

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
npm run start-issue 151

# 作業完了後PR作成  
npm run create-pr "fix: Issue #151 [Refactor] 巨大ファイルの分割と保守性向上" "Issue #151の対応

Closes #151"
```

## Claude Code用プロンプト
```
Issue #151の対応をお願いします。

タイトル: [Refactor] 巨大ファイルの分割と保守性向上
ラベル: priority:P1,size:L,type-basic:refactor

内容:
## 📝 機能概要
コードベースの品質分析の結果、いくつかの大きなファイルと保守性の課題を特定しました。単一責任原則に従って、巨大ファイルを機能別に分割し、保守性と拡張性を向上させるリファクタリングを段階的に実施します。

## 🎯 目的・背景
### 現状の問題点
- **巨大ファイルの存在**: `src/stores/auth.ts` (737行)、`src/components/PaginationComponent.vue` (660行)など
- **セキュリティ機能の分散**: `src/utils/`内に8個のセキュリティ関連ファイルが分散
- **認証ロジックの重複**: `stores/auth.ts` と `utils/auth.ts` で機能が重複
- **単一責任原則違反**: 1つのファイルに複数の責務が混在

### 解決の必要性
- 今後の機能追加・保守を効率的に行うため
- テストの粒度向上とデバッグの容易性向上
- 新規メンバーのコード理解促進

## ✅ 受け入れ条件
### Phase 1: 認証ストアの分割
- [ ] `src/stores/auth.ts` (737行) を以下に分割:
  - [ ] `stores/auth/session.ts` - セッション管理 (~150行)
  - [ ] `stores/auth/authentication.ts` - ログイン/ログアウト (~150行)
  - [ ] `stores/auth/security.ts` - セキュリティチェック (~150行)
  - [ ] `stores/auth/lockout.ts` - アカウントロックアウト (~150行)
  - [ ] `stores/auth/index.ts` - 統合interface (~50行)
- [ ] 既存の認証機能が正常に動作すること
- [ ] 全ての認証関連テストがパスすること

### Phase 2: ページネーションコンポーネントの分割
- [ ] `src/components/PaginationComponent.vue` (660行) を以下に分割:
  - [ ] `components/pagination/PaginationCore.vue` - 基本ページネーション (~150行)
  - [ ] `components/pagination/PaginationControls.vue` - ナビゲーション制御 (~150行)
  - [ ] `components/pagination/PaginationJump.vue` - ページジャンプ機能 (~150行)
  - [ ] `components/pagination/PaginationAnimation.vue` - アニメーション機能 (~150行)
- [ ] 既存のページネーション機能が正常に動作すること

### Phase 3: セキュリティモジュールの統合
- [ ] `src/utils/security-*.ts` を `src/security/` に統合:
  - [ ] `src/security/core/` - 基本セキュリティ機能
  - [ ] `src/security/monitoring/` - セキュリティ監視
  - [ ] `src/security/reporting/` - セキュリティレポート
  - [ ] `src/security/index.ts` - エクスポート統一
- [ ] セキュリティ関連機能が正常に動作すること

### Phase 4: 設定ページの分割
- [ ] `src/views/SettingPage.vue` (607行) をタブごとにコンポーネント分割:
  - [ ] `components/settings/ProfileTab.vue`
  - [ ] `components/settings/SecurityTab.vue`
  - [ ] `components/settings/NotificationTab.vue`
  - [ ] `components/settings/DataTab.vue`
- [ ] 設定画面が正常に動作すること

## 🔧 技術的要件
- **後方互換性を保持**すること
- **既存のAPIインターフェースは変更しない**こと
- 各分割されたファイルが200行以下であること
- TypeScript strict modeに準拠すること
- 既存のコーディング規則に準拠すること

## 🧪 テスト要件
- [ ] 既存の全テストがパス
- [ ] 型チェック (`npm run ci:type-check`) がパス
- [ ] リンティング (`npm run ci:lint`) がパス
- [ ] 分割後の各モジュールにユニットテスト追加
- [ ] パフォーマンスの劣化がないことを確認

## 📚 参考資料
### 内部ドキュメント
- [開発ワークフロー](docs/DEVELOPMENT/DEVELOPMENT_WORKFLOW.md)
- [コーディング規約](docs/DEVELOPMENT/CODING_STANDARDS.md)
- [アーキテクチャガイド](docs/DEVELOPMENT/ARCHITECTURE.md)

### 外部参考資料
- [Vue 3 Composition API](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia ストア分割ベストプラクティス](https://pinia.vuejs.org/core-concepts/)

## 📊 期待効果
| 項目 | Before | After | 改善度 |
|------|--------|--------|--------|
| 最大ファイルサイズ | 737行 | ~200行 | 70%↓ |
| セキュリティファイル数 | 8個分散 | 1モジュール統合 | 保守性↑ |
| テスト対象数 | 巨大ファイル | 小さな単位 | テスト性↑ |
| 新機能追加時の影響 | 広範囲 | 局所的 | 開発効率↑ |

## 🚨 注意事項
- この作業は複数のPRに分割して段階的に実施
- 各Phaseごとにテストを実行して品質確認
- 既存の動作に影響がないことを確認
- マージ後は必ずスモークテストを実行
```

---
Generated: 2025-08-25 15:22:22
Source: https://github.com/RsPYP/GoalCategorizationDiary/issues/151
