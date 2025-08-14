# Issue #18: テーマ機能の活用

## 概要
Vuetify のテーマを設定し、全体のカラースキームを統一します。

ts
コードをコピーする
// src/plugins/vuetify.ts
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          background: '#f5f7fa',
        },
      },
    },
  },
})
main.ts にプラグインを登録します。

ts
コードをコピーする
// src/main.ts
import vuetify from './plugins/vuetify'

const app = createApp(App)
app.use(vuetify)
app.mount('#app')

## ラベル
enhancement,design,refactor

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
npm run start-issue 18

# 作業完了後PR作成  
npm run create-pr "fix: Issue #18 テーマ機能の活用" "Issue #18の対応"
```

## Claude Code用プロンプト
```
Issue #18の対応をお願いします。

タイトル: テーマ機能の活用
ラベル: enhancement,design,refactor

内容:
Vuetify のテーマを設定し、全体のカラースキームを統一します。

ts
コードをコピーする
// src/plugins/vuetify.ts
import { createVuetify } from 'vuetify'

export default createVuetify({
  theme: {
    defaultTheme: 'light',
    themes: {
      light: {
        colors: {
          primary: '#1976D2',
          secondary: '#424242',
          background: '#f5f7fa',
        },
      },
    },
  },
})
main.ts にプラグインを登録します。

ts
コードをコピーする
// src/main.ts
import vuetify from './plugins/vuetify'

const app = createApp(App)
app.use(vuetify)
app.mount('#app')
```

---
Generated: 2025-08-14 22:52:51
Source: https://github.com/RsPYP/GoalCategorizationDiary/issues/18
