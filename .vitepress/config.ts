import { defineConfig } from 'vitepress'

export default defineConfig({
  title: 'Goal Categorization Diary',
  description: '目標設定と進捗追跡のためのWebアプリケーション開発ガイド',
  
  themeConfig: {
    nav: [
      { text: 'ホーム', link: '/' },
      { text: '開発ガイド', link: '/docs/DEVELOPMENT_COMMANDS' },
      { text: 'セキュリティ', link: '/docs/SECURITY' },
      { text: 'アーキテクチャ', link: '/docs/ARCHITECTURE' }
    ],
    
    sidebar: {
      '/docs/': [
        {
          text: '開発環境',
          items: [
            { text: '環境設定', link: '/docs/ENVIRONMENT_SETUP' },
            { text: '開発コマンド', link: '/docs/DEVELOPMENT_COMMANDS' },
            { text: '開発ワークフロー', link: '/docs/DEVELOPMENT_WORKFLOW' },
            { text: 'コーディング規約', link: '/docs/CODING_STANDARDS' }
          ]
        },
        {
          text: 'アーキテクチャ',
          items: [
            { text: 'システム構成', link: '/docs/ARCHITECTURE' }
          ]
        },
        {
          text: 'セキュリティ',
          items: [
            { text: 'セキュリティガイドライン', link: '/docs/SECURITY' },
            { text: 'セキュリティ開発ガイド', link: '/docs/SECURITY_DEVELOPMENT' },
            { text: 'セキュリティ実装詳細', link: '/docs/SECURITY_IMPLEMENTATION' },
            { text: 'セキュリティトラブルシューティング', link: '/docs/SECURITY_TROUBLESHOOTING' }
          ]
        },
        {
          text: 'Supabase',
          items: [
            { text: 'クイックセットアップ', link: '/docs/SUPABASE_QUICK_SETUP' },
            { text: '認証システム', link: '/docs/SUPABASE_AUTH' }
          ]
        },
        {
          text: 'プロジェクト管理',
          items: [
            { text: 'Issueラベル体系', link: '/docs/ISSUE_LABELS' }
          ]
        }
      ]
    },
    
    socialLinks: [
      { icon: 'github', link: 'https://github.com/RsPYP/GoalCategorizationDiary' }
    ]
  }
})