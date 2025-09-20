import { ref, onMounted } from 'vue'

export interface NotificationSettings {
  dailyReminder: boolean
  reminderTime: string
  weeklyReport: boolean
  reportDay: number // 0-6 (Sunday-Saturday)
  motivationalQuotes: boolean
}

export function usePushNotifications() {
  const isSupported = ref(false)
  const permission = ref<NotificationPermission>('default')
  const subscription = ref<PushSubscription | null>(null)
  const isSubscribed = ref(false)

  // VAPID公開鍵（環境変数から取得）
  const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY || ''

  // プッシュ通知のサポート状況をチェック
  const checkSupport = () => {
    isSupported.value =
      'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
  }

  // 通知許可を要求
  const requestPermission = async (): Promise<boolean> => {
    if (!isSupported.value) {
      console.warn('プッシュ通知がサポートされていません')
      return false
    }

    try {
      const result = await Notification.requestPermission()
      permission.value = result

      if (result === 'granted') {
        console.log('プッシュ通知が許可されました')
        return true
      } else {
        console.log('プッシュ通知が拒否されました')
        return false
      }
    } catch (error) {
      console.error('通知許可要求エラー:', error)
      return false
    }
  }

  // プッシュ通知に登録
  const subscribe = async (): Promise<boolean> => {
    if (!isSupported.value || permission.value !== 'granted') {
      return false
    }

    if (!VAPID_PUBLIC_KEY) {
      console.warn('VAPID公開鍵が設定されていません')
      return false
    }

    try {
      const registration = await navigator.serviceWorker.ready

      // 既存の購読を確認
      const existingSubscription = await registration.pushManager.getSubscription()
      if (existingSubscription) {
        subscription.value = existingSubscription
        isSubscribed.value = true
        return true
      }

      // 新しい購読を作成
      const newSubscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      })

      subscription.value = newSubscription
      isSubscribed.value = true

      // サーバーに購読情報を送信
      await sendSubscriptionToServer(newSubscription)

      console.log('プッシュ通知に登録しました')
      return true
    } catch (error) {
      console.error('プッシュ通知登録エラー:', error)
      return false
    }
  }

  // プッシュ通知を解除
  const unsubscribe = async (): Promise<boolean> => {
    if (!subscription.value) {
      return true
    }

    try {
      await subscription.value.unsubscribe()

      // サーバーから購読情報を削除
      await removeSubscriptionFromServer(subscription.value)

      subscription.value = null
      isSubscribed.value = false

      console.log('プッシュ通知を解除しました')
      return true
    } catch (error) {
      console.error('プッシュ通知解除エラー:', error)
      return false
    }
  }

  // テスト通知を送信
  const sendTestNotification = async (): Promise<boolean> => {
    if (!isSubscribed.value || !subscription.value) {
      console.warn('プッシュ通知に登録されていません')
      return false
    }

    try {
      // サーバーにテスト通知要求を送信
      const response = await fetch('/api/push/test', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.value,
          message: {
            title: 'Refeel テスト通知',
            body: 'プッシュ通知が正常に動作しています！',
            icon: '/pwa-192x192.svg',
            badge: '/favicon.ico',
          },
        }),
      })

      if (response.ok) {
        console.log('テスト通知を送信しました')
        return true
      } else {
        console.error('テスト通知送信に失敗しました')
        return false
      }
    } catch (error) {
      console.error('テスト通知エラー:', error)
      return false
    }
  }

  // 通知設定を保存
  const saveNotificationSettings = async (settings: NotificationSettings): Promise<boolean> => {
    if (!isSubscribed.value || !subscription.value) {
      return false
    }

    try {
      const response = await fetch('/api/push/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: subscription.value,
          settings,
        }),
      })

      if (response.ok) {
        localStorage.setItem('notification_settings', JSON.stringify(settings))
        console.log('通知設定を保存しました')
        return true
      } else {
        console.error('通知設定保存に失敗しました')
        return false
      }
    } catch (error) {
      console.error('通知設定保存エラー:', error)
      return false
    }
  }

  // 通知設定を読み込み
  const loadNotificationSettings = (): NotificationSettings => {
    const defaultSettings: NotificationSettings = {
      dailyReminder: false,
      reminderTime: '20:00',
      weeklyReport: false,
      reportDay: 0, // Sunday
      motivationalQuotes: false,
    }

    try {
      const saved = localStorage.getItem('notification_settings')
      return saved ? { ...defaultSettings, ...JSON.parse(saved) } : defaultSettings
    } catch (error) {
      console.error('通知設定読み込みエラー:', error)
      return defaultSettings
    }
  }

  // ローカル通知を表示（フォールバック）
  const showLocalNotification = (title: string, options?: NotificationOptions) => {
    if (permission.value !== 'granted') {
      console.warn('通知が許可されていません')
      return
    }

    try {
      const notification = new Notification(title, {
        icon: '/pwa-192x192.svg',
        badge: '/favicon.ico',
        ...options,
      })

      // 3秒後に自動的に閉じる
      setTimeout(() => {
        notification.close()
      }, 3000)

      return notification
    } catch (error) {
      console.error('ローカル通知エラー:', error)
    }
  }

  // 購読情報をサーバーに送信
  const sendSubscriptionToServer = async (sub: PushSubscription): Promise<void> => {
    try {
      const response = await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: sub,
          userAgent: navigator.userAgent,
          timestamp: new Date().toISOString(),
        }),
      })

      if (!response.ok) {
        throw new Error('購読情報送信に失敗しました')
      }
    } catch (error) {
      console.error('購読情報送信エラー:', error)
      // サーバー送信に失敗してもローカルでは購読状態を維持
    }
  }

  // 購読情報をサーバーから削除
  const removeSubscriptionFromServer = async (sub: PushSubscription): Promise<void> => {
    try {
      const response = await fetch('/api/push/unsubscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          subscription: sub,
        }),
      })

      if (!response.ok) {
        throw new Error('購読情報削除に失敗しました')
      }
    } catch (error) {
      console.error('購読情報削除エラー:', error)
    }
  }

  // VAPID キーをUint8Arrayに変換
  const urlBase64ToUint8Array = (base64String: string): Uint8Array => {
    const padding = '='.repeat((4 - (base64String.length % 4)) % 4)
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  // 現在の購読状態を確認
  const checkSubscriptionStatus = async (): Promise<void> => {
    if (!isSupported.value) return

    try {
      const registration = await navigator.serviceWorker.ready
      const existingSubscription = await registration.pushManager.getSubscription()

      if (existingSubscription) {
        subscription.value = existingSubscription
        isSubscribed.value = true
      } else {
        subscription.value = null
        isSubscribed.value = false
      }
    } catch (error) {
      console.error('購読状態確認エラー:', error)
    }
  }

  onMounted(async () => {
    checkSupport()

    if (isSupported.value) {
      permission.value = Notification.permission
      await checkSubscriptionStatus()
    }
  })

  return {
    // 状態
    isSupported,
    permission,
    subscription,
    isSubscribed,

    // 関数
    requestPermission,
    subscribe,
    unsubscribe,
    sendTestNotification,
    saveNotificationSettings,
    loadNotificationSettings,
    showLocalNotification,
  }
}
