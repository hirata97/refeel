# スキップ中のテスト一覧

このドキュメントは、未実装機能や実装更新により一時的にスキップされているテストの一覧を記載しています。

## 概要

- **スキップテスト総数**: 34件（5ファイル追加）
- **最終更新日**: 2025-11-25
- **関連Issue**: #226, #55

## スキップ中のテスト詳細

### 1. 2要素認証（2FA）機能テスト

#### ファイル: `tests/two-factor-auth/normal_TwoFactorAuthManager_01.spec.js`

**スキップ理由**: 2FA機能（`@/utils/two-factor-auth`）が未実装のため

**スキップ方法**: `describe.skip()` でファイル全体をスキップ

**スキップテスト数**: 26件

**テストカテゴリ**:
- インスタンス作成 (2件)
- 2FA セットアップ (4件)
- 2FA 有効化 (2件)
- 2FA コード検証 (3件)
- 2FA 無効化 (2件)
- 2FA ステータス確認 (3件)
- バックアップコード再生成 (2件)
- TOTP Generator 統合 (2件)
- エラーレスポンス処理 (2件)
- データ永続化 (2件)
- バックアップコード使用追跡 (2件)

**有効化手順**:
1. `src/utils/two-factor-auth.ts` の実装完了を確認
2. テストファイルの先頭コメント内のTODOを確認
3. `describe.skip` を `describe` に変更
4. 一時的なモック定義（`class TwoFactorAuthManager {}` など）を削除
5. コメントアウトされたimport文のコメントを解除
6. テストを実行して成功を確認

---

### 2. AuthStoreの2FA関連テスト

#### ファイル: `tests/auth/exception_AuthStore_01.spec.js`

**スキップ理由**: AuthStore内の2FAメソッド（`setup2FA`, `enable2FA`, `disable2FA`）が未実装のため

**スキップ方法**: `it.skip()` で個別テストをスキップ

**スキップテスト数**: 3件

**テスト一覧**:
1. `setup2FA - 未認証ユーザーでエラーを投げる` (行420-424)
2. `enable2FA - 未認証ユーザーでエラーを投げる` (行426-432)
3. `disable2FA - 未認証ユーザーでエラーを投げる` (行434-438)

**有効化手順**:
1. AuthStoreに2FAメソッドの実装を追加
2. `it.skip` を `it` に変更
3. テストを実行して成功を確認

---

### 3. 実装更新によるテスト修正が必要なファイル（一時除外）

#### ファイル: `vitest.config.ts`で除外中

**スキップ理由**: ストア実装のモジュール化・モダン化によりテストの全面的な書き直しが必要

**スキップ方法**: `vitest.config.ts` の `exclude` リストに追加

**スキップテスト数**: 約5ファイル

**対象ファイル**:
1. `tests/unit/data/normal_DataStore_01.spec.js` - DataStoreが`profiles`に変更、`diariesByMood`に変更など
2. `tests/unit/auth/normal_AuthStore_01.spec.js` - AuthStoreがモジュール化、`setUser`などが非公開に
3. `tests/unit/composables/normal_useDataFetch_01.spec.js` - モック設定の問題
4. `tests/components/normal_EmotionTagSelector_01.spec.ts` - コンポーネント実装変更
5. `tests/components/DiaryPreview/normal_DiaryPreview_01.spec.js` - コンポーネント実装変更

**修正手順**:
1. 各ストアの最新実装を確認
2. テストを新しいAPIに合わせて書き直し
3. モックを適切に設定
4. `vitest.config.ts` から該当ファイルを削除
5. テストを実行して成功を確認

**優先度**: 中（Issue #55完了後に別Issueで対応）

---

## 実装完了時のチェックリスト

各機能実装完了時に、以下を確認してください：

- [ ] 該当機能の実装が完了している
- [ ] テストファイルの`describe.skip`または`it.skip`を削除
- [ ] 必要に応じてimport文のコメントを解除
- [ ] 一時的なモック定義を削除
- [ ] テストが全て成功することを確認
- [ ] このドキュメントから該当テストを削除または更新

## 参考情報

- **親チケット**: #212（AuthStore異常系テスト拡充）
- **基盤整備PR**: #224
- **Issue #226**: 未実装機能のテストをスキップ設定

## 注意事項

- テストをスキップする際は、必ず理由をコメントで明記すること
- 実装完了時には速やかにテストを有効化すること
- 新しく未実装機能のテストを追加する場合は、このドキュメントを更新すること
