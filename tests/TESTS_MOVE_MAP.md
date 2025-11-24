# tests 移動マップ（短縮版）

以下は今回の整理で移動した主要なディレクトリのマッピングです。

注意: これは作業支援用のメモです。実際の import 更新は各ファイルを確認してから行ってください。

## ディレクトリ移動マップ（旧 => 新）

- `tests/BaseAlert/` => `tests/components/BaseAlert/`
- `tests/BaseButton/` => `tests/components/BaseButton/`
- `tests/ComparisonCard/` => `tests/components/ComparisonCard/`
- `tests/DiaryDetailModal/` => `tests/components/DiaryDetailModal/`
- `tests/DiaryEditPage/` => `tests/components/DiaryEditPage/`
- `tests/DiaryFilter/` => `tests/components/DiaryFilter/`
- `tests/DiaryPreview/` => `tests/components/DiaryPreview/`
- `tests/DiaryRegisterPage/` => `tests/components/DiaryRegisterPage/`
- `tests/DiaryViewPage/` => `tests/components/DiaryViewPage/`
- `tests/LoginPage/` => `tests/components/LoginPage/`
- `tests/BaseCard/` => `tests/components/BaseCard/`
- `tests/BaseForm/` => `tests/components/BaseForm/`
- `tests/SkipLink/` => `tests/components/SkipLink/`
- `tests/WeeklyReflectionPage/` => `tests/components/WeeklyReflectionPage/`

- `tests/notification/` => `tests/unit/notification/`
- `tests/audit-logger/` => `tests/unit/audit-logger/`
- `tests/auth/` => `tests/unit/auth/`
- `tests/loading/` => `tests/unit/loading/`
- `tests/password-policy/` => `tests/unit/password-policy/`
- `tests/two-factor-auth/` => `tests/unit/two-factor-auth/`
- `tests/account-lockout/` => `tests/unit/account-lockout/`
- `tests/composables/` => `tests/unit/composables/`
- `tests/dashboard/` => `tests/unit/dashboard/`
- `tests/data/` => `tests/unit/data/`
- `tests/stores/` => `tests/unit/stores/`
- `tests/utils/` => `tests/unit/utils/`
- `tests/theme/` => `tests/unit/theme/`
- `tests/types/` => `tests/unit/types/`

- `tests/enhanced-session-management/` => `tests/integration/enhanced-session-management/`

- `tests/setup.ts` => `tests/helpers/setup.ts`

## 一括で import パスを更新するための簡易コマンド例

※ 実行前に必ず変更をコミットしておくこと（安全のため）。

旧パスを `tests/components/*` 系に置き換える例:

```bash
# 例: tests/BaseButton を tests/components/BaseButton に置換（リポジトリ内の *.ts, *.js, *.vue を対象）
git grep -l "tests/BaseButton" -- "*.ts" "*.js" "*.vue" | xargs sed -i 's|tests/BaseButton|tests/components/BaseButton|g'
```

複数ディレクトリの置換は同様に map を作って処理できます。安全な流れ:

1. `git grep -l "tests/OldName"` で参照ファイルを確認
2. sed コマンドで置換（必要なら `-n` オプションで dry-run）
3. `git add -p` で差分を確認してコミット

## 注意点

- 相対 import（例: `../../tests/...`）は単純な文字列置換で壊れる場合があります。相対パスはファイルごとに確認してください。
- `tests/helpers/setup.ts` を参照する設定（`vitest.config.ts`）は既に更新済みです。
- Playwright の E2E は `tests/e2e/` を維持しているため、E2E 側のパス変更は最小限にしました。

---

（必要ならこのマップを拡張して 1 ファイルずつの移動推奨リストを作成します）
