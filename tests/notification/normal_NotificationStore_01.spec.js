import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { setActivePinia, createPinia } from 'pinia'
import { useNotificationStore } from '@/stores/notification'

describe('NotificationStore - 正常系テスト', () => {
  let notificationStore

  beforeEach(() => {
    setActivePinia(createPinia())
    notificationStore = useNotificationStore()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  it('通知を正常に追加できる', () => {
    const notificationId = notificationStore.addNotification({
      type: 'success',
      title: 'テスト通知',
      message: 'これはテストメッセージです'
    })

    expect(notificationId).toBeDefined()
    expect(notificationStore.notifications).toHaveLength(1)
    expect(notificationStore.notifications[0]).toMatchObject({
      type: 'success',
      title: 'テスト通知',
      message: 'これはテストメッセージです',
      timeout: 5000
    })
  })

  it('通知に一意のIDが割り当てられる', () => {
    const id1 = notificationStore.addNotification({
      type: 'info',
      title: 'テスト1'
    })
    
    const id2 = notificationStore.addNotification({
      type: 'info',
      title: 'テスト2'
    })

    expect(id1).not.toBe(id2)
    expect(notificationStore.notifications).toHaveLength(2)
  })

  it('成功通知を正常に表示できる', () => {
    /*const id =*/ notificationStore.showSuccess('成功', '処理が完了しました')

    expect(id).toBeDefined()
    expect(notificationStore.notifications).toHaveLength(1)
    expect(notificationStore.notifications[0]).toMatchObject({
      type: 'success',
      title: '成功',
      message: '処理が完了しました'
    })
  })

  it('エラー通知を正常に表示できる', () => {
    /*const id =*/ notificationStore.showError('エラー', '処理に失敗しました')

    expect(id).toBeDefined()
    expect(notificationStore.notifications).toHaveLength(1)
    expect(notificationStore.notifications[0]).toMatchObject({
      type: 'error',
      title: 'エラー',
      message: '処理に失敗しました',
      timeout: 8000 // エラーは長めの表示時間
    })
  })

  it('警告通知を正常に表示できる', () => {
    /*const id =*/ notificationStore.showWarning('警告', '注意が必要です')

    expect(id).toBeDefined()
    expect(notificationStore.notifications).toHaveLength(1)
    expect(notificationStore.notifications[0]).toMatchObject({
      type: 'warning',
      title: '警告',
      message: '注意が必要です',
      timeout: 6000
    })
  })

  it('情報通知を正常に表示できる', () => {
    /*const id =*/ notificationStore.showInfo('情報', 'お知らせです')

    expect(id).toBeDefined()
    expect(notificationStore.notifications).toHaveLength(1)
    expect(notificationStore.notifications[0]).toMatchObject({
      type: 'info',
      title: '情報',
      message: 'お知らせです'
    })
  })

  it('通知を手動で削除できる', () => {
    /*const id =*/ notificationStore.addNotification({
      type: 'info',
      title: 'テスト通知'
    })

    expect(notificationStore.notifications).toHaveLength(1)

    notificationStore.removeNotification(id)

    expect(notificationStore.notifications).toHaveLength(0)
  })

  it('すべての通知をクリアできる', () => {
    notificationStore.addNotification({
      type: 'success',
      title: '通知1'
    })
    notificationStore.addNotification({
      type: 'error',
      title: '通知2'
    })

    expect(notificationStore.notifications).toHaveLength(2)

    notificationStore.clearAll()

    expect(notificationStore.notifications).toHaveLength(0)
  })

  it('最大通知数を超えた場合、古い通知が削除される', () => {
    // 最大数を超えるまで通知を追加
    for (let i = 0; i < 7; i++) {
      notificationStore.addNotification({
        type: 'info',
        title: `通知${i + 1}`
      })
    }

    // 最大数（5個）に制限される
    expect(notificationStore.notifications).toHaveLength(5)
    // 最新の通知が残っている
    expect(notificationStore.notifications[0].title).toBe('通知3')
    expect(notificationStore.notifications[4].title).toBe('通知7')
  })

  it('自動削除が設定された通知が時間経過後に削除される', () => {
    /*const id =*/ notificationStore.addNotification({
      type: 'info',
      title: 'テスト通知',
      timeout: 1000
    })

    expect(notificationStore.notifications).toHaveLength(1)

    // 1秒経過
    vi.advanceTimersByTime(1000)

    expect(notificationStore.notifications).toHaveLength(0)
  })

  it('persistentな通知は自動削除されない', () => {
    /*const id =*/ notificationStore.addNotification({
      type: 'warning',
      title: '永続通知',
      persistent: true,
      timeout: 1000
    })

    expect(notificationStore.notifications).toHaveLength(1)

    // 時間経過
    vi.advanceTimersByTime(2000)

    // 削除されない
    expect(notificationStore.notifications).toHaveLength(1)
  })

  it('アクションを含む通知を正常に作成できる', () => {
    const mockAction = vi.fn()
    
    /*const id =*/ notificationStore.addNotification({
      type: 'error',
      title: 'エラー',
      message: 'リトライできます',
      actions: [{
        text: 'リトライ',
        action: mockAction
      }]
    })

    expect(notificationStore.notifications).toHaveLength(1)
    expect(notificationStore.notifications[0].actions).toBeDefined()
    expect(notificationStore.notifications[0].actions[0].text).toBe('リトライ')

    // アクションを実行
    notificationStore.notifications[0].actions[0].action()
    expect(mockAction).toHaveBeenCalledOnce()
  })

  it('カスタムオプションで通知をオーバーライドできる', () => {
    /*const id =*/ notificationStore.showSuccess(
      '成功',
      'カスタム設定',
      {
        timeout: 10000,
        persistent: true
      }
    )

    expect(notificationStore.notifications[0]).toMatchObject({
      type: 'success',
      title: '成功',
      message: 'カスタム設定',
      timeout: 10000,
      persistent: true
    })
  })
})