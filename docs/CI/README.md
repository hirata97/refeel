```markdown
# CI ドキュメント（docs/CI）

このディレクトリにはプロジェクトの CI/CD に関する運用ドキュメントをまとめています。

- `CI_CD_GUIDE.md` — CI/CD パイプラインの運用ガイド（ジョブ一覧、トリガー、実行手順など）
- `CI_CD_BEST_PRACTICES.md` — CI/CD を効率的に運用するためのベストプラクティス集
- `TYPE_GENERATION.md` — Supabase からの型定義自動生成（Type Generation）の詳細とトラブルシューティング

使い分けの目安:

- 日常的な CI の運用や PR のチェック方法 → `CI_CD_GUIDE.md`
- 開発フローや品質ゲートの方針 → `CI_CD_BEST_PRACTICES.md`
- 型生成に関する深い技術的詳細やワークフロー → `TYPE_GENERATION.md`

ガイド更新時は、重複を避けるために上記ファイルのうち1箇所だけを詳細更新し、他は該当ドキュメントへのリンクを貼る運用を推奨します。
```
