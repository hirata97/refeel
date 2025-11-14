<template>
  <a href="#main-content" class="skip-link" @click="handleSkipClick">
    メインコンテンツへスキップ
  </a>
</template>

<script setup lang="ts">
/**
 * SkipLinkコンポーネント
 *
 * WCAG 2.1準拠のスキップリンクを提供します。
 * キーボードユーザーがナビゲーションをバイパスしてメインコンテンツへ直接移動できます。
 *
 * アクセシビリティ機能:
 * - フォーカス時のみ表示（視覚的に邪魔にならない）
 * - 高コントラスト（WCAG AA準拠）
 * - 明確なフォーカスインジケーター
 * - セマンティックHTMLアンカー要素
 */

const handleSkipClick = (event: MouseEvent): void => {
  event.preventDefault()

  // メインコンテンツ要素を取得
  const mainContent = document.getElementById('main-content')

  if (mainContent) {
    // フォーカスを移動（tabindex=-1が必要な場合があるため設定）
    mainContent.setAttribute('tabindex', '-1')
    mainContent.focus()

    // スクロール位置を調整
    mainContent.scrollIntoView({ behavior: 'smooth', block: 'start' })

    // フォーカス後、tabindexを削除（通常のフォーカスフローを妨げないため）
    mainContent.addEventListener(
      'blur',
      () => {
        mainContent.removeAttribute('tabindex')
      },
      { once: true },
    )
  }
}
</script>

<style scoped>
.skip-link {
  /* 画面外に配置（視覚的に非表示） */
  position: absolute;
  top: -40px;
  left: 0;
  z-index: 10000;

  /* デザイン */
  background-color: #1976d2; /* Vuetify primary色 */
  color: #ffffff;
  padding: 12px 24px;
  text-decoration: none;
  font-size: 16px;
  font-weight: 500;
  border-radius: 0 0 4px 0;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);

  /* アニメーション */
  transition: top 0.2s ease-in-out;
}

/* フォーカス時に表示 */
.skip-link:focus {
  top: 0;
  outline: 3px solid #ffd700; /* 高コントラストのフォーカスリング */
  outline-offset: 2px;
}

/* ホバー時の視覚フィードバック */
.skip-link:hover {
  background-color: #1565c0; /* 少し濃い青 */
}
</style>
