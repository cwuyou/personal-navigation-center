/**
 * 封面图调试工具 - 完全禁用版本
 * 
 * 此文件完全禁用了所有调试功能，避免循环问题
 * 所有函数都是空操作，不会产生任何输出
 */

export interface CoverImageDebugInfo {
  bookmarkTitle: string
  bookmarkUrl: string
  originalCoverImage?: string
  proxiedCoverImage?: string
  fallbackUrl?: string
  loadStatus: 'loading' | 'success' | 'error' | 'fallback'
  errorMessage?: string
  timestamp: number
}

class CoverImageDebugger {
  // 完全禁用所有方法
  log(_info: Omit<CoverImageDebugInfo, 'timestamp'>) {
    // 空操作 - 不输出任何内容
  }

  getLogs(): CoverImageDebugInfo[] {
    return []
  }

  getFailedLogs(): CoverImageDebugInfo[] {
    return []
  }

  getSuccessLogs(): CoverImageDebugInfo[] {
    return []
  }

  getFallbackLogs(): CoverImageDebugInfo[] {
    return []
  }

  getStats() {
    return {
      total: 0,
      success: 0,
      error: 0,
      fallback: 0,
      loading: 0,
      successRate: '0%',
      errorRate: '0%',
      fallbackRate: '0%'
    }
  }

  clear() {
    // 空操作
  }

  exportLogs() {
    return {
      timestamp: new Date().toISOString(),
      stats: this.getStats(),
      logs: []
    }
  }
}

// 导出完全静默的调试器实例
export const coverImageDebugger = new CoverImageDebugger()

// 所有便捷函数都是空操作
export const logCoverImageLoad = () => { /* 空操作 */ }
export const logCoverImageSuccess = () => { /* 空操作 */ }
export const logCoverImageError = () => { /* 空操作 */ }
export const logCoverImageFallback = () => { /* 空操作 */ }
