import '@/utils/validation'

// バリデーションプラグインは、validation.tsで自動的に初期化されます
// このファイルは、メインのアプリケーションファイルでインポートすることで
// バリデーションルールとメッセージが確実にロードされるようにします

export default {
  install() {
    // VeeValidateの設定は validation.ts で行われています
    console.log('Validation plugin initialized')
  }
}