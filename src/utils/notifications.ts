// 通知・リマインダー関連のユーティリティ

export interface ReminderSettings {
  id: string
  enabled: boolean
  time: string // "HH:mm" format
  days: WeekDay[]
  type: ReminderType
  title: string
  message: string
  sound?: string
  snoozeEnabled: boolean
  snoozeDuration: number // minutes
}

export interface NotificationSettings {
  browserNotifications: boolean
  pushNotifications: boolean
  sound: boolean
  vibration: boolean
  customSounds: Record<string, string>
  quietHours: {
    enabled: boolean
    startTime: string // "HH:mm"
    endTime: string // "HH:mm"
  }
}

export interface ProgressNotificationSettings {
  streakNotifications: boolean
  goalAchievementNotifications: boolean
  weeklyReports: boolean
  monthlyReports: boolean
  motivationalMessages: boolean
}

export type WeekDay =
  | 'monday'
  | 'tuesday'
  | 'wednesday'
  | 'thursday'
  | 'friday'
  | 'saturday'
  | 'sunday'

export type ReminderType =
  | 'diary_entry'
  | 'goal_review'
  | 'weekly_summary'
  | 'monthly_summary'
  | 'custom'

export interface ScheduledNotification {
  id: string
  reminderId: string
  scheduledTime: Date
  executed: boolean
  snoozedUntil?: Date
}

export class NotificationUtils {
  private static readonly NOTIFICATION_PERMISSION_KEY = 'notification_permission_requested'
  private static readonly NOTIFICATION_SETTINGS_KEY = 'notification_settings'
  private static readonly REMINDER_SETTINGS_KEY = 'reminder_settings'
  private static readonly PROGRESS_SETTINGS_KEY = 'progress_notification_settings'

  /**
   * ブラウザ通知の許可を要求
   */
  static async requestNotificationPermission(): Promise<NotificationPermission> {
    if (!('Notification' in window)) {
      throw new Error('このブラウザは通知機能をサポートしていません')
    }

    const permission = await Notification.requestPermission()
    localStorage.setItem(this.NOTIFICATION_PERMISSION_KEY, 'true')

    return permission
  }

  /**
   * 通知許可状態を確認
   */
  static getNotificationPermission(): NotificationPermission {
    if (!('Notification' in window)) {
      return 'denied'
    }

    return Notification.permission
  }

  /**
   * ブラウザ通知を表示
   */
  static async showBrowserNotification(
    title: string,
    options: NotificationOptions = {},
  ): Promise<Notification | null> {
    const permission = this.getNotificationPermission()

    if (permission !== 'granted') {
      console.warn('通知の許可が必要です')
      return null
    }

    const defaultOptions: NotificationOptions = {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      ...options,
    }

    return new Notification(title, defaultOptions)
  }

  /**
   * 通知設定を保存
   */
  static saveNotificationSettings(settings: NotificationSettings): void {
    localStorage.setItem(this.NOTIFICATION_SETTINGS_KEY, JSON.stringify(settings))
  }

  /**
   * 通知設定を読み込み
   */
  static loadNotificationSettings(): NotificationSettings {
    const saved = localStorage.getItem(this.NOTIFICATION_SETTINGS_KEY)

    if (saved) {
      return JSON.parse(saved)
    }

    // デフォルト設定
    return {
      browserNotifications: true,
      pushNotifications: false,
      sound: true,
      vibration: true,
      customSounds: {},
      quietHours: {
        enabled: false,
        startTime: '22:00',
        endTime: '08:00',
      },
    }
  }

  /**
   * リマインダー設定を保存
   */
  static saveReminderSettings(reminders: ReminderSettings[]): void {
    localStorage.setItem(this.REMINDER_SETTINGS_KEY, JSON.stringify(reminders))
  }

  /**
   * リマインダー設定を読み込み
   */
  static loadReminderSettings(): ReminderSettings[] {
    const saved = localStorage.getItem(this.REMINDER_SETTINGS_KEY)

    if (saved) {
      return JSON.parse(saved)
    }

    // デフォルト設定
    return [
      {
        id: 'default-diary-reminder',
        enabled: true,
        time: '20:00',
        days: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        type: 'diary_entry',
        title: '日記を書く時間です',
        message: '今日の目標の進捗を記録しましょう',
        snoozeEnabled: true,
        snoozeDuration: 10,
      },
    ]
  }

  /**
   * 進捗通知設定を保存
   */
  static saveProgressSettings(settings: ProgressNotificationSettings): void {
    localStorage.setItem(this.PROGRESS_SETTINGS_KEY, JSON.stringify(settings))
  }

  /**
   * 進捗通知設定を読み込み
   */
  static loadProgressSettings(): ProgressNotificationSettings {
    const saved = localStorage.getItem(this.PROGRESS_SETTINGS_KEY)

    if (saved) {
      return JSON.parse(saved)
    }

    // デフォルト設定
    return {
      streakNotifications: true,
      goalAchievementNotifications: true,
      weeklyReports: true,
      monthlyReports: true,
      motivationalMessages: true,
    }
  }

  /**
   * 静寂時間内かどうかを判定
   */
  static isQuietTime(settings: NotificationSettings): boolean {
    if (!settings.quietHours.enabled) {
      return false
    }

    const now = new Date()
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`

    const { startTime, endTime } = settings.quietHours

    // 深夜をまたぐ場合の処理
    if (startTime > endTime) {
      return currentTime >= startTime || currentTime <= endTime
    }

    return currentTime >= startTime && currentTime <= endTime
  }

  /**
   * 次のリマインダー時刻を計算
   */
  static getNextReminderTime(reminder: ReminderSettings): Date | null {
    if (!reminder.enabled) {
      return null
    }

    const now = new Date()
    const [hours, minutes] = reminder.time.split(':').map(Number)

    for (let i = 0; i < 7; i++) {
      const targetDate = new Date(now)
      targetDate.setDate(now.getDate() + i)
      targetDate.setHours(hours, minutes, 0, 0)

      // 今日の場合は現在時刻より後かチェック
      if (i === 0 && targetDate <= now) {
        continue
      }

      const dayOfWeek = this.getDayOfWeekString(targetDate.getDay())

      if (reminder.days.includes(dayOfWeek)) {
        return targetDate
      }
    }

    return null
  }

  /**
   * 曜日数値を文字列に変換
   */
  private static getDayOfWeekString(dayNum: number): WeekDay {
    const days: WeekDay[] = [
      'sunday',
      'monday',
      'tuesday',
      'wednesday',
      'thursday',
      'friday',
      'saturday',
    ]
    return days[dayNum]
  }

  /**
   * リマインダーIDを生成
   */
  static generateReminderId(): string {
    return `reminder-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
  }

  /**
   * スヌーズ時刻を計算
   */
  static calculateSnoozeTime(minutes: number): Date {
    const snoozeTime = new Date()
    snoozeTime.setMinutes(snoozeTime.getMinutes() + minutes)
    return snoozeTime
  }

  /**
   * 通知音を再生
   */
  static playNotificationSound(soundUrl?: string): void {
    if (!soundUrl) {
      // デフォルト音
      const audio = new Audio('/sounds/notification.mp3')
      audio.play().catch(console.warn)
      return
    }

    try {
      const audio = new Audio(soundUrl)
      audio.play().catch(console.warn)
    } catch (error) {
      console.warn('通知音の再生に失敗しました:', error)
    }
  }

  /**
   * バイブレーション実行
   */
  static vibrate(pattern: number[] = [100, 50, 100]): void {
    if ('vibrate' in navigator) {
      navigator.vibrate(pattern)
    }
  }
}
