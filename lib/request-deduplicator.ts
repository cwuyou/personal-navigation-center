/**
 * 请求去重器
 * 避免同时发起多个相同的请求
 */

interface PendingRequest<T> {
  promise: Promise<T>
  timestamp: number
}

class RequestDeduplicator {
  private pendingRequests = new Map<string, PendingRequest<any>>()
  private readonly REQUEST_TIMEOUT = 30000 // 30秒超时

  /**
   * 执行去重请求
   */
  async dedupe<T>(key: string, requestFn: () => Promise<T>): Promise<T> {
    // 检查是否有正在进行的请求
    const existing = this.pendingRequests.get(key)
    if (existing) {
      // 检查请求是否超时
      if (Date.now() - existing.timestamp < this.REQUEST_TIMEOUT) {
        return existing.promise
      } else {
        // 清理超时的请求
        this.pendingRequests.delete(key)
      }
    }

    // 创建新请求
    const promise = requestFn().finally(() => {
      // 请求完成后清理
      this.pendingRequests.delete(key)
    })

    // 缓存请求
    this.pendingRequests.set(key, {
      promise,
      timestamp: Date.now()
    })

    return promise
  }

  /**
   * 清理超时的请求
   */
  cleanup(): void {
    const now = Date.now()
    for (const [key, request] of this.pendingRequests.entries()) {
      if (now - request.timestamp > this.REQUEST_TIMEOUT) {
        this.pendingRequests.delete(key)
      }
    }
  }

  /**
   * 获取统计信息
   */
  getStats(): { pendingCount: number; keys: string[] } {
    return {
      pendingCount: this.pendingRequests.size,
      keys: Array.from(this.pendingRequests.keys())
    }
  }

  /**
   * 清空所有请求
   */
  clear(): void {
    this.pendingRequests.clear()
  }
}

// 全局请求去重器实例
export const requestDeduplicator = new RequestDeduplicator()

// 定期清理超时请求
if (typeof window !== 'undefined') {
  setInterval(() => {
    requestDeduplicator.cleanup()
  }, 60000) // 每分钟清理一次
}

/**
 * 创建去重的 fetch 函数
 */
export function createDedupedFetch() {
  return async function dedupedFetch(url: string, options?: RequestInit): Promise<Response> {
    const key = `fetch:${url}:${JSON.stringify(options || {})}`
    
    return requestDeduplicator.dedupe(key, () => fetch(url, options))
  }
}

/**
 * 去重的 fetch 实例
 */
export const dedupedFetch = createDedupedFetch()

/**
 * 专门用于元数据获取的去重函数
 */
export async function fetchMetadataDeduped(url: string): Promise<any> {
  const key = `metadata:${url}`
  
  return requestDeduplicator.dedupe(key, async () => {
    const response = await fetch(`/api/fetch-meta?url=${encodeURIComponent(url)}`, {
      cache: 'no-store'
    })
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    return response.json()
  })
}

/**
 * 专门用于图片代理的去重函数
 */
export async function fetchImageDeduped(url: string): Promise<string> {
  const key = `image:${url}`
  
  return requestDeduplicator.dedupe(key, async () => {
    const response = await fetch(`/api/proxy-image?url=${encodeURIComponent(url)}`)
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`)
    }
    
    // 返回代理后的 URL
    return response.url
  })
}
