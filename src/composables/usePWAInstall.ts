import { ref, onMounted, onUnmounted } from 'vue'
import { logger } from '@shared/utils/logger'

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: ReadonlyArray<string>
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed'
    platform: string
  }>
  prompt(): Promise<void>
}

export function usePWAInstall() {
  const isInstallable = ref(false)
  const isInstalled = ref(false)
  const isStandalone = ref(false)
  const isIOS = ref(false)
  const installPromptEvent = ref<BeforeInstallPromptEvent | null>(null)

  // インストール可能性をチェック
  const checkInstallability = () => {
    // PWA が既にインストールされているかチェック
    isStandalone.value =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as Navigator & { standalone?: boolean }).standalone === true

    // iOSデバイスかチェック
    isIOS.value =
      /iPad|iPhone|iPod/.test(navigator.userAgent) &&
      !(window as Window & { MSStream?: unknown }).MSStream

    // 既にインストール済みの場合
    if (isStandalone.value) {
      isInstalled.value = true
      isInstallable.value = false
      return
    }

    // Service Worker がサポートされているかチェック
    if (!('serviceWorker' in navigator)) {
      logger.warn('PWA: Service Worker not supported')
      return
    }
  }

  // インストールプロンプトを表示
  const showInstallPrompt = async (): Promise<boolean> => {
    if (!installPromptEvent.value) {
      logger.warn('PWA: インストールプロンプトが利用できません')
      return false
    }

    try {
      // ネイティブインストールプロンプトを表示
      await installPromptEvent.value.prompt()

      // ユーザーの選択を待つ
      const choiceResult = await installPromptEvent.value.userChoice

      if (choiceResult.outcome === 'accepted') {
        logger.debug('PWA: ユーザーがインストールを承認しました')
        isInstalled.value = true
        isInstallable.value = false
        installPromptEvent.value = null
        return true
      } else {
        logger.debug('PWA: ユーザーがインストールを拒否しました')
        return false
      }
    } catch (error) {
      logger.error('PWA: インストールプロンプトエラー:', error)
      return false
    }
  }

  // iOSでの手動インストール手順を表示
  const showIOSInstallInstructions = () => {
    return {
      title: 'Refeelをホーム画面に追加',
      steps: [
        'Safari の下部にある共有ボタン（□↗）をタップ',
        'メニューから「ホーム画面に追加」を選択',
        '「追加」ボタンをタップしてインストール完了',
      ],
    }
  }

  // beforeinstallprompt イベントリスナー
  const handleBeforeInstallPrompt = (e: Event) => {
    e.preventDefault()
    installPromptEvent.value = e as BeforeInstallPromptEvent
    isInstallable.value = true
    logger.debug('PWA: インストール可能になりました')
  }

  // appinstalled イベントリスナー
  const handleAppInstalled = () => {
    logger.debug('PWA: インストールが完了しました')
    isInstalled.value = true
    isInstallable.value = false
    installPromptEvent.value = null
  }

  // インストール統計の記録
  const trackInstallEvent = async (
    event: 'prompt_shown' | 'install_accepted' | 'install_dismissed',
  ) => {
    try {
      // 分析データを記録（実装に応じて調整）
      logger.debug('PWA Install Event:', event)

      // ローカルストレージに記録
      const installStats = JSON.parse(localStorage.getItem('pwa_install_stats') || '{}')
      installStats[event] = (installStats[event] || 0) + 1
      installStats.lastEvent = new Date().toISOString()
      localStorage.setItem('pwa_install_stats', JSON.stringify(installStats))
    } catch (error) {
      logger.error('インストール統計記録エラー:', error)
    }
  }

  // デバイス情報を取得
  const getDeviceInfo = () => {
    return {
      isIOS: isIOS.value,
      isAndroid: /Android/.test(navigator.userAgent),
      isDesktop: !/Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
        navigator.userAgent,
      ),
      browser: getBrowserName(),
      standalone: isStandalone.value,
    }
  }

  // ブラウザ名を取得
  const getBrowserName = (): string => {
    const userAgent = navigator.userAgent
    if (userAgent.includes('Chrome')) return 'Chrome'
    if (userAgent.includes('Firefox')) return 'Firefox'
    if (userAgent.includes('Safari')) return 'Safari'
    if (userAgent.includes('Edge')) return 'Edge'
    return 'Unknown'
  }

  // PWA機能の可用性をチェック
  const checkPWASupport = () => {
    return {
      serviceWorker: 'serviceWorker' in navigator,
      webAppManifest: 'onbeforeinstallprompt' in window,
      pushNotifications: 'PushManager' in window,
      backgroundSync:
        'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
      offlineStorage: 'indexedDB' in window,
    }
  }

  onMounted(() => {
    checkInstallability()

    // イベントリスナーを追加
    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.addEventListener('appinstalled', handleAppInstalled)

    // display-mode の変更を監視
    const mediaQuery = window.matchMedia('(display-mode: standalone)')
    const handleDisplayModeChange = (e: MediaQueryListEvent) => {
      isStandalone.value = e.matches
      if (e.matches) {
        isInstalled.value = true
        isInstallable.value = false
      }
    }

    if (mediaQuery.addEventListener) {
      mediaQuery.addEventListener('change', handleDisplayModeChange)
    } else {
      // Safari での互換性
      mediaQuery.addListener(handleDisplayModeChange)
    }
  })

  onUnmounted(() => {
    window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    window.removeEventListener('appinstalled', handleAppInstalled)
  })

  return {
    // 状態
    isInstallable,
    isInstalled,
    isStandalone,
    isIOS,

    // 関数
    showInstallPrompt,
    showIOSInstallInstructions,
    trackInstallEvent,
    getDeviceInfo,
    checkPWASupport,

    // 内部状態（デバッグ用）
    installPromptEvent,
  }
}
