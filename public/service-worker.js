// Service Worker for Goal Categorization Diary
// リマインダー通知とオフライン機能をサポート

const CACHE_NAME = 'goal-diary-v1'
const REMINDER_DB_NAME = 'ReminderDB'
const REMINDER_STORE_NAME = 'reminders'

// キャッシュするファイル
const STATIC_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico'
]

// Service Worker インストール
self.addEventListener('install', event => {
  console.log('Service Worker installing...')
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        console.log('Cache opened')
        return cache.addAll(STATIC_FILES)
      })
      .then(() => {
        // 即座に有効化
        self.skipWaiting()
      })
  )
})

// Service Worker アクティベート
self.addEventListener('activate', event => {
  console.log('Service Worker activating...')
  
  event.waitUntil(
    caches.keys()
      .then(cacheNames => {
        return Promise.all(
          cacheNames.map(cacheName => {
            if (cacheName !== CACHE_NAME) {
              console.log('Deleting old cache:', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        // 全てのクライアントを制御
        return self.clients.claim()
      })
  )
})

// リクエスト処理（Cache First戦略）
self.addEventListener('fetch', event => {
  // HTTPSまたはローカルホストのみ処理
  if (event.request.url.startsWith('http://') && 
      !event.request.url.includes('localhost') &&
      !event.request.url.includes('127.0.0.1')) {
    return
  }

  event.respondWith(
    caches.match(event.request)
      .then(response => {
        // キャッシュにある場合は返す
        if (response) {
          return response
        }

        // ネットワークから取得を試行
        return fetch(event.request)
          .then(response => {
            // レスポンスが無効な場合はそのまま返す
            if (!response || response.status !== 200 || response.type !== 'basic') {
              return response
            }

            // 静的ファイルをキャッシュに保存
            const responseToCache = response.clone()
            
            if (event.request.method === 'GET') {
              caches.open(CACHE_NAME)
                .then(cache => {
                  cache.put(event.request, responseToCache)
                })
            }

            return response
          })
          .catch(() => {
            // ネットワークエラー時はオフラインページを表示
            if (event.request.destination === 'document') {
              return caches.match('/index.html')
            }
          })
      })
  )
})

// バックグラウンド同期（リマインダー）
self.addEventListener('sync', event => {
  console.log('Background sync triggered:', event.tag)
  
  if (event.tag === 'reminder-sync') {
    event.waitUntil(syncReminders())
  }
})

// プッシュ通知受信
self.addEventListener('push', event => {
  console.log('Push notification received')
  
  const options = {
    body: 'リマインダーの時間です',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '開く',
        icon: '/images/checkmark.png'
      },
      {
        action: 'close',
        title: '閉じる',
        icon: '/images/xmark.png'
      }
    ]
  }

  let title = 'Goal Diary'
  let body = 'リマインダーの時間です'

  if (event.data) {
    try {
      const pushData = event.data.json()
      title = pushData.title || title
      body = pushData.body || body
      
      if (pushData.options) {
        Object.assign(options, pushData.options)
      }
    } catch (e) {
      console.error('Push data parsing error:', e)
    }
  }

  event.waitUntil(
    self.registration.showNotification(title, {
      ...options,
      body
    })
  )
})

// 通知クリック処理
self.addEventListener('notificationclick', event => {
  console.log('Notification clicked:', event.notification.tag)
  
  event.notification.close()

  if (event.action === 'close') {
    return
  }

  // アプリを開く
  event.waitUntil(
    self.clients.matchAll({ type: 'window' })
      .then(clients => {
        // 既存のウィンドウがあれば前面に出す
        if (clients.length > 0) {
          return clients[0].focus()
        }
        
        // 新しいウィンドウを開く
        return self.clients.openWindow('/')
      })
  )
})

// 通知を閉じた時の処理
self.addEventListener('notificationclose', event => {
  console.log('Notification closed:', event.notification.tag)
  
  // 分析データを送信（オプション）
  event.waitUntil(
    sendAnalytics('notification_closed', {
      tag: event.notification.tag,
      timestamp: Date.now()
    })
  )
})

// メッセージ処理（メインアプリからの通信）
self.addEventListener('message', event => {
  console.log('Message received:', event.data)
  
  const { type, data } = event.data

  switch (type) {
    case 'SKIP_WAITING':
      self.skipWaiting()
      break
      
    case 'SCHEDULE_REMINDER':
      scheduleReminder(data)
      break
      
    case 'CANCEL_REMINDER':
      cancelReminder(data.id)
      break
      
    case 'GET_SCHEDULED_REMINDERS':
      getScheduledReminders()
        .then(reminders => {
          event.ports[0].postMessage({
            type: 'SCHEDULED_REMINDERS',
            data: reminders
          })
        })
      break
  }
})

// リマインダー同期機能
async function syncReminders() {
  try {
    const reminders = await getScheduledReminders()
    console.log('Syncing reminders:', reminders.length)
    
    // 期限切れのリマインダーをチェック
    const now = new Date()
    const dueReminders = reminders.filter(reminder => 
      new Date(reminder.scheduledTime) <= now && !reminder.executed
    )
    
    // 期限が来たリマインダーを実行
    for (const reminder of dueReminders) {
      await executeReminder(reminder)
    }
    
    return Promise.resolve()
  } catch (error) {
    console.error('Reminder sync failed:', error)
    return Promise.reject(error)
  }
}

// リマインダー実行
async function executeReminder(reminder) {
  try {
    await self.registration.showNotification(reminder.title, {
      body: reminder.message,
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      tag: `reminder-${reminder.id}`,
      requireInteraction: true,
      vibrate: [100, 50, 100],
      data: reminder
    })
    
    // 実行済みフラグを設定
    await markReminderExecuted(reminder.id)
    
    console.log('Reminder executed:', reminder.title)
  } catch (error) {
    console.error('Reminder execution failed:', error)
  }
}

// IndexedDB ヘルパー関数
function openReminderDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(REMINDER_DB_NAME, 1)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    
    request.onupgradeneeded = event => {
      const db = event.target.result
      
      if (!db.objectStoreNames.contains(REMINDER_STORE_NAME)) {
        const store = db.createObjectStore(REMINDER_STORE_NAME, { keyPath: 'id' })
        store.createIndex('scheduledTime', 'scheduledTime')
        store.createIndex('executed', 'executed')
      }
    }
  })
}

async function getScheduledReminders() {
  const db = await openReminderDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REMINDER_STORE_NAME], 'readonly')
    const store = transaction.objectStore(REMINDER_STORE_NAME)
    const request = store.getAll()
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
  })
}

async function scheduleReminder(reminder) {
  const db = await openReminderDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REMINDER_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(REMINDER_STORE_NAME)
    const request = store.put(reminder)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      console.log('Reminder scheduled:', reminder.title)
      resolve()
    }
  })
}

async function markReminderExecuted(reminderId) {
  const db = await openReminderDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REMINDER_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(REMINDER_STORE_NAME)
    const getRequest = store.get(reminderId)
    
    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const reminder = getRequest.result
      if (reminder) {
        reminder.executed = true
        reminder.executedAt = new Date().toISOString()
        
        const putRequest = store.put(reminder)
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve()
      } else {
        resolve()
      }
    }
  })
}

async function cancelReminder(reminderId) {
  const db = await openReminderDB()
  
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([REMINDER_STORE_NAME], 'readwrite')
    const store = transaction.objectStore(REMINDER_STORE_NAME)
    const request = store.delete(reminderId)
    
    request.onerror = () => reject(request.error)
    request.onsuccess = () => {
      console.log('Reminder cancelled:', reminderId)
      resolve()
    }
  })
}

// 分析データ送信（オプション）
async function sendAnalytics(event, data) {
  try {
    // 実装は環境に応じて調整
    console.log('Analytics event:', event, data)
  } catch (error) {
    console.error('Analytics error:', error)
  }
}

// 定期的なリマインダーチェック（1分間隔）
setInterval(() => {
  syncReminders().catch(error => {
    console.error('Periodic reminder check failed:', error)
  })
}, 60000) // 60秒

console.log('Service Worker loaded successfully')