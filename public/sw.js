const CACHE_NAME = 'personal-navigation-v1'
const STATIC_CACHE = 'static-v1'
const DYNAMIC_CACHE = 'dynamic-v1'

// 需要缓存的静态资源
const STATIC_ASSETS = [
  '/',
  '/manifest.json',
  '/icon-192x192.png',
  '/icon-512x512.png',
  // 添加其他静态资源
]

// 需要缓存的动态资源模式
const CACHE_PATTERNS = [
  /^https:\/\/fonts\.googleapis\.com/,
  /^https:\/\/fonts\.gstatic\.com/,
  /\.(?:png|jpg|jpeg|svg|gif|webp)$/,
]

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
  console.log('Service Worker: Installing...')
  
  event.waitUntil(
    caches.open(STATIC_CACHE)
      .then((cache) => {
        console.log('Service Worker: Caching static assets')
        return cache.addAll(STATIC_ASSETS)
      })
      .then(() => {
        console.log('Service Worker: Static assets cached')
        return self.skipWaiting()
      })
      .catch((error) => {
        console.error('Service Worker: Failed to cache static assets', error)
      })
  )
})

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
  console.log('Service Worker: Activating...')
  
  event.waitUntil(
    caches.keys()
      .then((cacheNames) => {
        return Promise.all(
          cacheNames.map((cacheName) => {
            if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
              console.log('Service Worker: Deleting old cache', cacheName)
              return caches.delete(cacheName)
            }
          })
        )
      })
      .then(() => {
        console.log('Service Worker: Activated')
        return self.clients.claim()
      })
  )
})

// 获取事件 - 处理网络请求
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // 跳过非 GET 请求
  if (request.method !== 'GET') {
    return
  }

  // 跳过 Chrome 扩展请求
  if (url.protocol === 'chrome-extension:') {
    return
  }

  // 处理导航请求（HTML 页面）
  if (request.mode === 'navigate') {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // 如果网络请求成功，缓存响应
          if (response.status === 200) {
            const responseClone = response.clone()
            caches.open(DYNAMIC_CACHE)
              .then((cache) => cache.put(request, responseClone))
          }
          return response
        })
        .catch(() => {
          // 网络失败时，尝试从缓存获取
          return caches.match(request)
            .then((cachedResponse) => {
              if (cachedResponse) {
                return cachedResponse
              }
              // 如果缓存中也没有，返回离线页面
              return caches.match('/')
            })
        })
    )
    return
  }

  // 处理静态资源请求
  if (STATIC_ASSETS.includes(url.pathname)) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          return cachedResponse || fetch(request)
        })
    )
    return
  }

  // 处理需要缓存的动态资源
  const shouldCache = CACHE_PATTERNS.some(pattern => pattern.test(request.url))
  
  if (shouldCache) {
    event.respondWith(
      caches.match(request)
        .then((cachedResponse) => {
          if (cachedResponse) {
            // 从缓存返回，同时在后台更新
            fetch(request)
              .then((response) => {
                if (response.status === 200) {
                  const responseClone = response.clone()
                  caches.open(DYNAMIC_CACHE)
                    .then((cache) => cache.put(request, responseClone))
                }
              })
              .catch(() => {
                // 网络请求失败，忽略
              })
            
            return cachedResponse
          }
          
          // 缓存中没有，从网络获取
          return fetch(request)
            .then((response) => {
              if (response.status === 200) {
                const responseClone = response.clone()
                caches.open(DYNAMIC_CACHE)
                  .then((cache) => cache.put(request, responseClone))
              }
              return response
            })
        })
    )
    return
  }

  // 其他请求直接通过网络
  event.respondWith(fetch(request))
})

// 后台同步事件
self.addEventListener('sync', (event) => {
  console.log('Service Worker: Background sync', event.tag)
  
  if (event.tag === 'bookmark-sync') {
    event.waitUntil(syncBookmarks())
  }
})

// 推送通知事件
self.addEventListener('push', (event) => {
  console.log('Service Worker: Push received', event)
  
  const options = {
    body: event.data ? event.data.text() : '您有新的书签更新',
    icon: '/icon-192x192.png',
    badge: '/icon-192x192.png',
    vibrate: [100, 50, 100],
    data: {
      dateOfArrival: Date.now(),
      primaryKey: 1
    },
    actions: [
      {
        action: 'explore',
        title: '查看',
        icon: '/icon-add.png'
      },
      {
        action: 'close',
        title: '关闭',
        icon: '/icon-close.png'
      }
    ]
  }
  
  event.waitUntil(
    self.registration.showNotification('个人导航中心', options)
  )
})

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
  console.log('Service Worker: Notification click', event)
  
  event.notification.close()
  
  if (event.action === 'explore') {
    event.waitUntil(
      clients.openWindow('/')
    )
  }
})

// 同步书签数据
async function syncBookmarks() {
  try {
    console.log('Service Worker: Syncing bookmarks...')
    
    // 这里可以实现与服务器同步的逻辑
    // 例如：上传本地更改，下载远程更新等
    
    // 获取本地存储的书签数据
    const bookmarkData = await getLocalBookmarks()
    
    // 发送到服务器（如果有的话）
    // await uploadBookmarks(bookmarkData)
    
    console.log('Service Worker: Bookmarks synced successfully')
  } catch (error) {
    console.error('Service Worker: Failed to sync bookmarks', error)
    throw error
  }
}

// 获取本地书签数据
async function getLocalBookmarks() {
  return new Promise((resolve) => {
    // 这里需要与主线程通信获取数据
    // 或者直接访问 IndexedDB
    resolve({})
  })
}

// 消息处理
self.addEventListener('message', (event) => {
  console.log('Service Worker: Message received', event.data)
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }
  
  if (event.data && event.data.type === 'GET_VERSION') {
    event.ports[0].postMessage({ version: CACHE_NAME })
  }
  
  if (event.data && event.data.type === 'CACHE_URLS') {
    const urlsToCache = event.data.payload
    event.waitUntil(
      caches.open(DYNAMIC_CACHE)
        .then((cache) => cache.addAll(urlsToCache))
    )
  }
})

// 错误处理
self.addEventListener('error', (event) => {
  console.error('Service Worker: Error', event.error)
})

self.addEventListener('unhandledrejection', (event) => {
  console.error('Service Worker: Unhandled promise rejection', event.reason)
})
