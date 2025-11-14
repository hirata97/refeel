# public/ - 静的リソース管理

このディレクトリには、ビルド時にそのまま配信される静的ファイルを配置します。

## 📋 目次

- [概要](#概要)
- [ディレクトリ内容](#ディレクトリ内容)
- [静的ファイル配置ルール](#静的ファイル配置ルール)
- [PWA関連ファイル](#pwa関連ファイル)
- [Service Worker](#service-worker)
- [ファイル管理方針](#ファイル管理方針)
- [キャッシュ戦略](#キャッシュ戦略)
- [注意事項](#注意事項)

## 概要

`public/` ディレクトリに配置されたファイルは、Viteビルド時に**そのまま**`dist/`にコピーされます。

### 特徴

- **ビルド処理不要**: Webpack/Viteによる処理をスキップ
- **パス固定**: `public/filename.ext` → `https://domain.com/filename.ext`
- **キャッシュ制御**: 静的ファイルのキャッシュ戦略に最適
- **PWA対応**: Service Worker、マニフェスト、アイコンの配置先

## ディレクトリ内容

### 現在の静的ファイル

```
public/
├── favicon.ico              # ファビコン（ブラウザタブアイコン）
├── icon.svg                 # SVGアイコン
├── service-worker.js        # Service Worker（PWA機能・リマインダー通知）
├── pwa-192x192.png          # PWAアイコン（192x192）
├── pwa-192x192.svg          # PWAアイコン（192x192、SVG版）
├── pwa-512x512.svg          # PWAアイコン（512x512）
├── apple-touch-icon.png     # iOS Safariホーム画面アイコン
├── apple-touch-icon.svg     # iOS Safariアイコン（SVG版）
└── mask-icon.svg            # Safari ピン留めタブアイコン
```

### ファイル用途

| ファイル | 用途 | サイズ | 形式 |
|---------|------|--------|-----|
| `favicon.ico` | ブラウザタブアイコン | 16x16, 32x32 | ICO |
| `icon.svg` | 汎用SVGアイコン | ベクター | SVG |
| `pwa-192x192.png` | PWAアイコン（小） | 192x192 | PNG |
| `pwa-512x512.svg` | PWAアイコン（大） | 512x512 | SVG |
| `apple-touch-icon.png` | iOSホーム画面アイコン | 180x180 | PNG |
| `mask-icon.svg` | Safariピン留めアイコン | ベクター | SVG |

## 静的ファイル配置ルール

### 配置すべきファイル

✅ **配置推奨:**
- ファビコン（`favicon.ico`）
- ロボット制御（`robots.txt`）
- サイトマップ（`sitemap.xml`）
- PWAマニフェスト参照ファイル
- PWAアイコン（複数サイズ）
- OGP画像（SNSシェア用）
- Service Worker

❌ **配置非推奨:**
- ビルド処理が必要な画像（最適化必要）
- コンポーネントで使用する画像・アセット → `src/assets/` に配置
- TypeScript/JavaScript → `src/` に配置
- CSS/SCSS → `src/` に配置

### 命名規則

- **小文字・ハイフン区切り**: `apple-touch-icon.png`
- **明確な名前**: 用途が分かる名前を使用
- **バージョン管理不要**: ハッシュ不要（キャッシュ戦略で対応）

## PWA関連ファイル

### PWA（Progressive Web App）対応

このアプリケーションはPWA対応しており、以下の機能を提供：

- **オフライン動作**: Service Workerによるキャッシュ
- **ホーム画面追加**: モバイルでアプリのようにインストール可能
- **プッシュ通知**: リマインダー機能（Service Worker経由）

### アイコン要件

**必須サイズ:**
- `192x192`: Android ホーム画面、小アイコン
- `512x512`: Android スプラッシュ画面、大アイコン
- `180x180`: iOS ホーム画面（`apple-touch-icon.png`）

**推奨形式:**
- PNG: 透過背景サポート、広範な互換性
- SVG: ベクター形式、スケーラブル（最新ブラウザ）

### マニフェストファイル

PWAマニフェストは `index.html` の `<link>` タグで参照：

```html
<link rel="manifest" href="/manifest.json" />
```

**注意**: `manifest.json` は通常 `public/` に配置されますが、現在はVite Pluginで動的生成している可能性があります。

## Service Worker

### 概要

`public/service-worker.js` は以下の機能を提供：

- **オフラインキャッシュ**: 静的ファイルのキャッシュ
- **リマインダー通知**: 日記リマインダーのプッシュ通知
- **バックグラウンド同期**: オフライン時のデータ同期（将来実装）

### 主な機能

```javascript
// キャッシュ対象ファイル
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
]

// リマインダー通知機能
self.addEventListener('notificationclick', ...)
```

### Service Worker登録

Service Workerは `src/main.ts` で登録：

```typescript
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('/service-worker.js')
}
```

### デバッグ方法

**Chrome DevTools:**
1. `Application` タブ → `Service Workers`
2. キャッシュ確認: `Cache Storage`
3. 通知テスト: `Push Messaging`

**更新方法:**
- ブラウザで `Shift + F5`（強制リロード）
- DevToolsで `Update on reload` 有効化

## ファイル管理方針

### 画像最適化

**推奨ツール:**
- **PNG最適化**: [TinyPNG](https://tinypng.com/)、ImageOptim
- **SVG最適化**: [SVGO](https://github.com/svg/svgo)
- **ICO生成**: [RealFaviconGenerator](https://realfavicongenerator.net/)

**最適化コマンド例:**

```bash
# SVG最適化
npx svgo public/icon.svg

# PNG最適化（ImageOptim CLI）
imageoptim public/*.png
```

### アイコン生成フロー

1. **マスター画像作成**: 1024x1024 PNG（透過背景）
2. **各サイズ生成**:
   ```bash
   # ImageMagickで一括生成
   convert icon-master.png -resize 192x192 pwa-192x192.png
   convert icon-master.png -resize 512x512 pwa-512x512.png
   convert icon-master.png -resize 180x180 apple-touch-icon.png
   ```
3. **SVG版作成**: Adobe Illustrator、Inkscape等でベクター化
4. **ICO生成**: RealFaviconGeneratorで複数サイズを含むfavicon.ico生成

### ファイル追加手順

1. **ファイル配置**: `public/` に直接配置
2. **参照更新**: 必要に応じて `index.html`、マニフェスト更新
3. **キャッシュ更新**: Service Worker の `CACHE_NAME` バージョンアップ
4. **テスト**: ローカル環境で動作確認
5. **デプロイ**: PR作成・マージ

## キャッシュ戦略

### ブラウザキャッシュ

Vercelデプロイ時のキャッシュ設定（推奨）：

```json
// vercel.json
{
  "headers": [
    {
      "source": "/icon.svg",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }
      ]
    },
    {
      "source": "/service-worker.js",
      "headers": [
        { "key": "Cache-Control", "value": "public, max-age=0, must-revalidate" }
      ]
    }
  ]
}
```

### Service Workerキャッシュ

**キャッシュ戦略:**
- **Cache First**: 静的ファイル（アイコン、CSS）
- **Network First**: HTML、API レスポンス
- **Stale-While-Revalidate**: 画像、フォント

**バージョン管理:**

Service Worker更新時は `CACHE_NAME` をインクリメント：

```javascript
const CACHE_NAME = 'goal-diary-v1' // → 'goal-diary-v2'
```

## 注意事項

### セキュリティ

- **robots.txt**: 検索エンジンクロール制御（機密情報の誤公開防止）
- **Service Worker**: HTTPS必須（localhost除く）
- **CORS**: 外部リソース読み込み時のCORS設定確認

### パフォーマンス

- **画像サイズ**: 必要最小限のサイズに最適化
- **HTTP/2**: 複数ファイルの並列ダウンロード活用
- **CDN**: Vercel自動CDN配信活用

### SEO

**必須ファイル（追加推奨）:**
- `robots.txt`: クローラー制御
- `sitemap.xml`: サイトマップ
- OGP画像: SNSシェア時の表示画像

**robots.txt 例:**

```txt
User-agent: *
Allow: /

Sitemap: https://yourdomain.com/sitemap.xml
```

### PWA要件

**Lighthouse PWA監査項目:**
- ✅ マニフェストファイル存在
- ✅ Service Worker登録
- ✅ 192x192、512x512アイコン
- ✅ HTTPS配信（本番環境）

## 参考資料

### 公式ドキュメント
- [Vite静的アセット処理](https://vitejs.dev/guide/assets.html#the-public-directory)
- [PWA マニフェスト](https://web.dev/add-manifest/)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

### ツール
- [RealFaviconGenerator](https://realfavicongenerator.net/) - ファビコン生成
- [PWA Builder](https://www.pwabuilder.com/) - PWAマニフェスト生成
- [Lighthouse](https://developers.google.com/web/tools/lighthouse) - PWA監査

### プロジェクト内関連ファイル
- `index.html` - アイコン・マニフェスト参照
- `src/main.ts` - Service Worker登録
- `vite.config.ts` - ビルド設定
- `CLAUDE.md` - 開発指針

---

**最終更新**: 2025-11-14
**メンテナー**: GoalCategorizationDiary開発チーム
