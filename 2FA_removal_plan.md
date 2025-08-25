# 2FA完全除去作業計画

## 調査結果サマリー

### ✅ 除去済み
- `src/stores/security.ts` - Issue #139で対応完了

### ❌ 除去が必要なファイル

#### 1. コンポーネントファイル (削除対象)
- `src/components/security/TwoFactorManagement.vue` (347行)
- `src/components/security/TwoFactorSetup.vue` (373行)  
- `src/components/security/TwoFactorVerification.vue` (推定存在)

#### 2. ストアファイル (2FA部分を除去)
- `src/stores/auth.ts`
  - 状態: `twoFactorRequired`, `pendingTwoFactorSessionId`
  - 計算プロパティ: `is2FAEnabled`
  - メソッド: `setup2FA`, `enable2FA`, `disable2FA`
  - ログインロジック内の2FA検証

#### 3. ユーティリティファイル (削除対象)
- `src/utils/two-factor-auth.ts` (522行の2FA実装)
- `src/utils/audit-logger.ts` 内の2FA関連ログ定義

#### 4. ビューファイル (2FA部分を除去)
- `src/views/SecuritySettingsPage.vue` - 2FA管理セクション
- `src/views/LoginPage.vue` - 2FA認証フロー

## 作業優先順位

### Phase 1: ユーティリティとストア (影響範囲大)
1. `src/utils/two-factor-auth.ts` - ファイル削除
2. `src/stores/auth.ts` - 2FA機能除去
3. `src/utils/audit-logger.ts` - 2FA関連ログ定義除去

### Phase 2: コンポーネント (UI関連)
4. `src/components/security/TwoFactor*.vue` - ファイル削除
5. `src/views/SecuritySettingsPage.vue` - 2FAセクション除去
6. `src/views/LoginPage.vue` - 2FA認証フロー除去

### Phase 3: 検証・清掃
7. 型チェックとエラー修正
8. 不要なimportの削除
9. テストの実行・修正

## 推定作業時間
- Phase 1: 30分
- Phase 2: 45分  
- Phase 3: 15分
- **合計: 約90分**

## リスク評価
- **Low Risk**: ファイル削除（使用されていない独立コンポーネント）
- **Medium Risk**: ストア修正（認証フローに影響）
- **High Risk**: ログイン画面修正（基幹機能への影響）

## 実行可否の判断
現在のPR (#145) は Issue #139 の「型エラー解決」が主目的。
2FA完全除去は別スコープとして、新しいタスクで実施することを推奨。

## 次のアクション推奨
1. **Option A**: 現在のPRを完了させ、2FA完全除去は別Issue
2. **Option B**: 現在のPRスコープを拡張して包括的な2FA除去を実施