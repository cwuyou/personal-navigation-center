import React from 'react'

/**
 * 图片缓存管理器
 * 用于避免重复加载相同的图片资源
 */

interface CacheEntry {
  url: string
  status: 'loading' | 'loaded' | 'error'
  timestamp: number
  element?: HTMLImageElement
}

class ImageCache {
  private cache = new Map<string, CacheEntry>()
  private readonly CACHE_DURATION = 5 * 60 * 1000 // 5分钟缓存

  /**
   * 检查图片是否已缓存
   */
  has(url: string): boolean {
    const entry = this.cache.get(url)
    if (!entry) return false
    
    // 检查缓存是否过期
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(url)
      return false
    }
    
    return true
  }

  /**
   * 获取缓存状态
   */
  getStatus(url: string): 'loading' | 'loaded' | 'error' | 'not-cached' {
    const entry = this.cache.get(url)
    if (!entry) return 'not-cached'
    
    // 检查缓存是否过期
    if (Date.now() - entry.timestamp > this.CACHE_DURATION) {
      this.cache.delete(url)
      return 'not-cached'
    }
    
    return entry.status
  }

  /**
   * 预加载图片
   */
  preload(url: string): Promise<void> {
    return new Promise((resolve, reject) => {
      // 如果已经缓存，直接返回
      const status = this.getStatus(url)
      if (status === 'loaded') {
        resolve()
        return
      }
      if (status === 'error') {
        reject(new Error('Image failed to load'))
        return
      }
      if (status === 'loading') {
        // 如果正在加载，等待加载完成
        const checkStatus = () => {
          const currentStatus = this.getStatus(url)
          if (currentStatus === 'loaded') {
            resolve()
          } else if (currentStatus === 'error') {
            reject(new Error('Image failed to load'))
          } else if (currentStatus === 'loading') {
            setTimeout(checkStatus, 100)
          } else {
            reject(new Error('Cache entry disappeared'))
          }
        }
        setTimeout(checkStatus, 100)
        return
      }

      // 开始加载图片
      this.cache.set(url, {
        url,
        status: 'loading',
        timestamp: Date.now()
      })

      const img = new Image()
      img.onload = () => {
        this.cache.set(url, {
          url,
          status: 'loaded',
          timestamp: Date.now(),
          element: img
        })
        resolve()
      }
      img.onerror = () => {
        this.cache.set(url, {
          url,
          status: 'error',
          timestamp: Date.now()
        })
        reject(new Error('Image failed to load'))
      }
      img.src = url
    })
  }

  /**
   * 批量预加载图片
   */
  async preloadBatch(urls: string[]): Promise<void> {
    const promises = urls.map(url => 
      this.preload(url).catch(() => {
        // 忽略单个图片加载失败，不影响其他图片
        console.warn(`Failed to preload image: ${url}`)
      })
    )
    await Promise.all(promises)
  }

  /**
   * 清理过期缓存
   */
  cleanup(): void {
    const now = Date.now()
    for (const [url, entry] of this.cache.entries()) {
      if (now - entry.timestamp > this.CACHE_DURATION) {
        this.cache.delete(url)
      }
    }
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): { total: number; loaded: number; loading: number; error: number } {
    let loaded = 0, loading = 0, error = 0
    
    for (const entry of this.cache.values()) {
      switch (entry.status) {
        case 'loaded': loaded++; break
        case 'loading': loading++; break
        case 'error': error++; break
      }
    }
    
    return {
      total: this.cache.size,
      loaded,
      loading,
      error
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    this.cache.clear()
  }
}

// 全局图片缓存实例
export const imageCache = new ImageCache()

// 定期清理过期缓存
if (typeof window !== 'undefined') {
  setInterval(() => {
    imageCache.cleanup()
  }, 60000) // 每分钟清理一次
}

/**
 * 智能图片加载 Hook
 */
export function useImagePreloader(urls: string[]) {
  const [loadingStates, setLoadingStates] = React.useState<Record<string, boolean>>({})

  React.useEffect(() => {
    if (urls.length === 0) return

    // 过滤出需要加载的图片
    const urlsToLoad = urls.filter(url => !imageCache.has(url))
    
    if (urlsToLoad.length === 0) return

    // 设置加载状态
    const newLoadingStates: Record<string, boolean> = {}
    urlsToLoad.forEach(url => {
      newLoadingStates[url] = true
    })
    setLoadingStates(prev => ({ ...prev, ...newLoadingStates }))

    // 批量预加载
    imageCache.preloadBatch(urlsToLoad).finally(() => {
      // 清除加载状态
      setLoadingStates(prev => {
        const updated = { ...prev }
        urlsToLoad.forEach(url => {
          delete updated[url]
        })
        return updated
      })
    })
  }, [urls])

  return loadingStates
}
