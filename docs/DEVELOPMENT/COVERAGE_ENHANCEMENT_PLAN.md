# カバレッジ閾値強化計画

> **関連Issue**: #281
> **ステータス**: Phase 1 完了
> **最終更新**: 2025-11-25

## 📊 Phase 1: 現状分析（2025 Q4）

### 現在のカバレッジ状況

**全体カバレッジ（2025-11-25時点）:**

| メトリクス | 現在値 | 推奨値 | 差分 |
|-----------|--------|--------|------|
| **Lines** | 37.83% | 70% | **-32.17%** |
| **Statements** | 37.4% | 70% | **-32.6%** |
| **Branches** | 24.81% | 70% | **-45.19%** ⚠️ |
| **Functions** | 49.38% | 70% | **-20.62%** |

**重要な発見:**
- ✅ Functions カバレッジが最も高い（49.38%）
- ⚠️ **Branches カバレッジが最も低い（24.81%）** - 優先改善対象
- ⚠️ 全てのメトリクスが推奨閾値70%を大幅に下回る
- 📈 推奨閾値到達には平均 **+30%以上の向上** が必要

### 低カバレッジファイル（Top 10 最優先改善対象）

| ファイル | Lines | Stmts | Branch | Funcs | 優先度 |
|---------|-------|-------|--------|-------|--------|
| `stores/session.ts` | 1.63% | 1.53% | 0% | 1.63% | 🔴 Critical |
| `stores/index.ts` | 2.22% | 2.08% | 0% | 0% | 🔴 Critical |
| `utils/session-management.ts` | 2.9% | 2.63% | 1.4% | 2.43% | 🔴 Critical |
| `utils/account-lockout.ts` | 2.89% | 2.7% | 1.63% | 3.7% | 🔴 Critical |
| `utils/auth/session-manager.ts` | 3.27% | 2.94% | 0% | 0% | 🔴 Critical |
| `utils/password-policy.ts` | 5.73% | 4.86% | 0.87% | 5.55% | 🟠 High |
| `stores/security.ts` | 10% | 9.09% | 0% | 0% | 🟠 High |
| `utils/sanitization.ts` | 11.29% | 10.76% | 0% | 0% | 🟠 High |
| `stores/lockout.ts` | 16.66% | 15.38% | 0% | 0% | 🟠 High |
| `config/security.ts` | 25% | 23.07% | 18.42% | 23.52% | 🟡 Medium |

**カテゴリ別分析:**

| カテゴリ | 平均カバレッジ | 主な問題 |
|---------|--------------|---------|
| **Stores** | 76.58% (loading/themeを除く: ~5%) | セッション・セキュリティストアのテスト不足 |
| **Utils (全体)** | 30.85% | 認証・セキュリティ関連ユーティリティの大幅なテスト不足 |
| **Utils/Auth** | 40.47% | セッション管理、ロックアウト管理のテスト不足 |
| **Utils/Security** | - | サニタイゼーション、パスワードポリシーのテスト不足 |
| **Config** | 23.07% | セキュリティ設定のテスト不足 |
| **Lib** | 80% | 良好（Supabaseクライアント） |

### 実装済み設定

**vitest.config.ts カバレッジ設定:**
```typescript
coverage: {
  provider: 'v8',
  reporter: ['text', 'json', 'html', 'lcov', 'json-summary'],
  exclude: [
    // 設定ファイル、型定義、テストファイル等を除外
    '**/node_modules/**',
    '**/*.config.{js,ts,mjs,cjs}',
    '**/*.d.ts',
    '**/tests/**',
    // ... その他
  ],
  thresholds: {
    lines: 0,       // Baseline: 37.83%
    statements: 0,  // Baseline: 37.4%
    branches: 0,    // Baseline: 24.81%
    functions: 0,   // Baseline: 49.38%
  },
}
```

**pr-quality-gate.yml 現状:**
- 推奨閾値: 70% (警告のみ、ビルド失敗なし)
- カバレッジレポート自動生成
- Codecov統合済み

---

## 🎯 Phase 2: 強化計画策定

### 段階的目標設定（2026年ロードマップ）

#### Q1 2026（2026年1-3月）- 第1段階

**目標:**
- ✅ Lines: **60%** (現在37.83% → +22.17%)
- ✅ Statements: **60%** (現在37.4% → +22.6%)
- ✅ Branches: **50%** (現在24.81% → +25.19%)
- ✅ Functions: **60%** (現在49.38% → +10.62%)

**実装タスク:**
1. Critical優先度ファイルのテスト追加（session.ts, index.ts等）
2. セキュリティ関連ユーティリティのテスト強化
3. vitest.config.ts 閾値更新:
   ```typescript
   thresholds: {
     lines: 60,
     statements: 60,
     branches: 50,
     functions: 60,
   }
   ```
4. pr-quality-gate.yml 必須閾値設定（警告→エラー化）

**期待効果:**
- セキュリティ関連コードの品質保証
- リファクタリング時の安全性向上

#### Q2 2026（2026年4-6月）- 第2段階

**目標:**
- ✅ Lines: **70%** (+10%)
- ✅ Statements: **70%** (+10%)
- ✅ Branches: **60%** (+10%)
- ✅ Functions: **70%** (+10%)

**実装タスク:**
1. High優先度ファイルのテスト追加
2. エッジケース・異常系テスト強化
3. 閾値を70/70/60/70に引き上げ

**期待効果:**
- 推奨レベル到達（Lines/Statements/Functions）
- バグ検出率向上

#### Q3 2026（2026年7-9月）- 第3段階

**目標:**
- ✅ Lines: **75%** (+5%)
- ✅ Statements: **75%** (+5%)
- ✅ Branches: **65%** (+5%)
- ✅ Functions: **75%** (+5%)

**実装タスク:**
1. Medium優先度ファイルのテスト追加
2. 統合テスト強化
3. Branch カバレッジ向上施策

#### Q4 2026（2026年10-12月）- 最終目標

**目標:**
- 🎯 Lines: **80%** (+5%)
- 🎯 Statements: **80%** (+5%)
- 🎯 Branches: **70%** (+5%)
- 🎯 Functions: **80%** (+5%)

**実装タスク:**
1. 全メトリクス80%達成（Branches除く）
2. カバレッジレポート可視化改善
3. 継続的改善プロセス確立

### 除外対象の明確化

**カバレッジ計測から除外:**
- 設定ファイル (`*.config.ts`)
- 型定義 (`*.d.ts`, `types/`)
- テストファイル (`**/*.spec.ts`, `tests/`)
- モックファイル (`mocks/`, `__mocks__/`)
- ビルド成果物 (`dist/`, `coverage/`)
- エントリポイント (`main.ts`)

**カバレッジ計測対象（重要）:**
- ✅ 全ストア (`stores/*.ts`)
- ✅ 全ユーティリティ (`utils/**/*.ts`)
- ✅ 全コンポーネント (`src/components/**/*.vue`)
- ✅ 全ビュー (`src/views/**/*.vue`)
- ✅ 設定モジュール (`config/*.ts`)

---

## 📋 Phase 3: 段階的実装（次期Issue予定）

### 優先順位付けタスク

#### Milestone 1: Critical ファイル対応（Q1前半）

**対象ファイル（カバレッジ <5%）:**
1. `stores/session.ts` - セッション管理テスト
2. `stores/index.ts` - ストアインデックステスト
3. `utils/session-management.ts` - セッション管理ユーティリティテスト
4. `utils/account-lockout.ts` - アカウントロックアウトテスト
5. `utils/auth/session-manager.ts` - 認証セッションマネージャーテスト

**推定工数:** 各ファイル 1-2日 × 5ファイル = **5-10日**

#### Milestone 2: High 優先度ファイル対応（Q1後半）

**対象ファイル（カバレッジ 5-20%）:**
1. `utils/password-policy.ts`
2. `stores/security.ts`
3. `utils/sanitization.ts`
4. `stores/lockout.ts`

**推定工数:** 各ファイル 1日 × 4ファイル = **4日**

#### Milestone 3: Medium 優先度ファイル対応（Q2）

**対象ファイル（カバレッジ 20-50%）:**
- `config/security.ts`
- その他Medium優先度ファイル

**推定工数:** **5-7日**

### テスト作成ガイドライン

**新規テスト作成時の必須項目:**
1. ✅ 正常系テスト（Happy Path）
2. ✅ 異常系テスト（Error Handling）
3. ✅ エッジケーステスト（Boundary Conditions）
4. ✅ Branch カバレッジ向上（条件分岐の全パターン）

**テストファイル命名規則:**
```
tests/unit/<category>/normal_<FileName>_01.spec.ts    # 正常系
tests/unit/<category>/exception_<FileName>_01.spec.ts # 異常系
```

**最小カバレッジ要件（新規ファイル）:**
- Lines: 80%以上
- Statements: 80%以上
- Branches: 70%以上
- Functions: 80%以上

---

## 🔄 Phase 4: 継続的改善

### カバレッジレポート可視化

**実装予定:**
1. PRコメントへのカバレッジサマリー自動投稿
2. GitHubバッジ追加（README.md）
3. カバレッジトレンドダッシュボード（Codecov）

### 定期レビュープロセス

**四半期ごとのレビュー:**
- カバレッジ目標達成状況確認
- 低カバレッジファイルの定期レビュー
- テスト戦略の見直し

### 新規機能開発時のルール

**必須事項:**
1. 新規コンポーネント・ストア作成時、ユニットテスト同時作成
2. PR作成前に影響範囲のテスト実行確認
3. カバレッジ低下を防ぐ（PR時に警告表示）

---

## 📈 成功指標（KPI）

### 主要指標

| 指標 | 現在値 | Q1目標 | Q4目標 |
|------|--------|--------|--------|
| **Lines Coverage** | 37.83% | 60% | 80% |
| **Statements Coverage** | 37.4% | 60% | 80% |
| **Branches Coverage** | 24.81% | 50% | 70% |
| **Functions Coverage** | 49.38% | 60% | 80% |
| **Critical Files (<5%)** | 5ファイル | 0ファイル | 0ファイル |
| **High Priority Files (5-20%)** | 4ファイル | 2ファイル | 0ファイル |

### 副次指標

- ✅ PRレビュー時のカバレッジ確認率: 100%
- ✅ 新規機能のテスト同時作成率: 100%
- ✅ CI/CD パス率: 95%以上維持
- ✅ テスト実行時間: 2分以内維持

---

## 🚀 次のアクション

### 即座に実施（Phase 1完了後）

- [x] vitest.config.ts カバレッジ設定追加
- [x] 現状分析完了
- [x] Phase 1ドキュメント作成
- [ ] チーム内レビュー・合意形成
- [ ] PR #281 マージ

### Phase 2開始準備（Q1 2026）

- [ ] Critical ファイルテスト作成Issue作成
- [ ] テスト作成ガイドライン詳細化
- [ ] Q1マイルストーン設定

---

## 📚 参考資料

- [Vitest Coverage Documentation](https://vitest.dev/guide/coverage.html)
- [Istanbul Coverage Thresholds](https://github.com/istanbuljs/nyc#coverage-thresholds)
- [Test Coverage Best Practices (Martin Fowler)](https://martinfowler.com/bliki/TestCoverage.html)
- Issue #277（親チケット）- CI/CDテスト整理・最適化
- Issue #281 - カバレッジ閾値強化計画

---

**変更履歴:**
- 2025-11-25: Phase 1 現状分析完了、ドキュメント初版作成
