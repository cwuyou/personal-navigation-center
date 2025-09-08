/**
 * 生产环境友好的日志工具
 * 在开发环境中显示所有日志，在生产环境中只显示错误和警告
 */

const isDevelopment = process.env.NODE_ENV === 'development'

export const logger = {
  /**
   * 调试日志 - 仅在开发环境显示
   */
  debug: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * 信息日志 - 仅在开发环境显示
   */
  info: (...args: any[]) => {
    if (isDevelopment) {
      console.log(...args)
    }
  },

  /**
   * 警告日志 - 在所有环境显示
   */
  warn: (...args: any[]) => {
    console.warn(...args)
  },

  /**
   * 错误日志 - 在所有环境显示
   */
  error: (...args: any[]) => {
    console.error(...args)
  },

  /**
   * 性能日志 - 仅在开发环境显示
   */
  perf: (label: string, fn: () => void) => {
    if (isDevelopment) {
      console.time(label)
      fn()
      console.timeEnd(label)
    } else {
      fn()
    }
  },

  /**
   * 分组日志 - 仅在开发环境显示
   */
  group: (label: string, fn: () => void) => {
    if (isDevelopment) {
      console.group(label)
      fn()
      console.groupEnd()
    } else {
      fn()
    }
  }
}

// 为了向后兼容，也导出单独的函数
export const debugLog = logger.debug
export const infoLog = logger.info
export const warnLog = logger.warn
export const errorLog = logger.error
