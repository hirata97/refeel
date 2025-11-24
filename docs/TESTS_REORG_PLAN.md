# tests ディレクトリ整理（作業方針）

## 目的

- `tests/` 配下が散在して分かりづらいため、可読性・保守性を高めるために段階的に再編成する。

## 基本方針

- トップレベルを `unit/`, `components/`, `integration/`, `e2e/`, `fixtures/`, `security/` の6つに整理。
- 影響が大きい変更は段階的に行い、各ステップでコミット・push・CI 実行をする。
- 拡張子は原則 `*.spec.ts` に統一する（段階的適用）。

## ブランチ

- ベース: 最新の `main`
- 新規ブランチ: `feature/issue-55-reorganize-tests`

## ステップ（段階的）

1. この文書を追加してブランチ作成（完了）
2. `tests/helpers` と `tests/fixtures` を作成（共通モック・ヘルパーを集約）
3. `unit` にロジック/ユーティリティを移動（上位優先）
4. `components` にコンポーネント/ページテストを移動
5. `integration` に外部依存テストを移動
6. `vitest`/`playwright` 設定で必要最小限のパス修正
7. CI で全テストを順に実行し、破損箇所を修正

## 移行時の注意点

- import の相対パスや `tsconfig.paths` の影響に注意する。
- Playwright の `testDir` や webServer 設定は E2E の移動で影響を受ける。
- 変更は小さな PR に分けて CI をこまめに回す。

## クイックウィン（すぐできる）

1. 大きな README を `docs/` に移してテストルートを軽くする。
2. `*.spec.ts` へ拡張子方針を明記する。
3. 共通 mock を `tests/fixtures` に集約するための `.gitkeep` と README を追加する。

## 次のアクション（短期）

1. 本ブランチで `tests/helpers` と `tests/fixtures` を追加し push する（本 PR の次コミット）。
2. 上位10件のファイルを移動して小さな PR を作成する。

---

作業中に問題が出たらこの文書を更新してください。
