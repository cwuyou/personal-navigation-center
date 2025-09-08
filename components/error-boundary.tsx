'use client'

import React from 'react'
import { logger } from '@/lib/logger'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; resetError: () => void }>
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    // 检查是否是我们要静默处理的错误
    const silentErrors = [
      '获取用户信息超时',
      '获取用户超时',
      '用户状态检查超时',
      'Supabase 操作超时',
      '网络连接不可用',
      'Auth session missing',
      'session_not_found',
      'invalid_token',
      'token_expired',
      'user_not_found',
      'UserTimeoutError'
    ]

    const errorMessage = error.message || ''
    const shouldSilent = silentErrors.some(silentError => 
      errorMessage.toLowerCase().includes(silentError.toLowerCase())
    )

    if (shouldSilent) {
      // 静默处理这些错误，不显示错误界面
      logger.warn('🔇 ErrorBoundary 静默处理错误:', errorMessage)
      return { hasError: false } // 不显示错误界面
    }

    // 在生产环境中也静默处理所有错误
    if (process.env.NODE_ENV !== 'development') {
      logger.warn('🔇 生产环境中的错误已被静默处理:', errorMessage)
      return { hasError: false } // 不显示错误界面
    }

    // 只在开发环境中显示错误界面
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    // 检查是否是我们要静默处理的错误
    const silentErrors = [
      '获取用户信息超时',
      '获取用户超时',
      '用户状态检查超时',
      'Supabase 操作超时',
      '网络连接不可用',
      'Auth session missing',
      'session_not_found',
      'invalid_token',
      'token_expired',
      'user_not_found',
      'UserTimeoutError'
    ]

    const errorMessage = error.message || ''
    const shouldSilent = silentErrors.some(silentError => 
      errorMessage.toLowerCase().includes(silentError.toLowerCase())
    )

    if (shouldSilent) {
      logger.warn('🔇 ErrorBoundary componentDidCatch 静默处理错误:', errorMessage)
      // 重置错误状态，继续正常渲染
      this.setState({ hasError: false })
      return
    }

    if (process.env.NODE_ENV !== 'development') {
      logger.warn('🔇 生产环境中的错误已被静默处理:', errorMessage)
      // 重置错误状态，继续正常渲染
      this.setState({ hasError: false })
      return
    }

    // 只在开发环境中记录详细错误
    console.error('❌ ErrorBoundary 捕获到错误:', error, errorInfo)
  }

  resetError = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      // 只在开发环境中显示错误界面
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback
        return <FallbackComponent error={this.state.error} resetError={this.resetError} />
      }

      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
            <div className="flex items-center mb-4">
              <div className="flex-shrink-0">
                <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-gray-800">
                  开发环境错误
                </h3>
              </div>
            </div>
            <div className="mb-4">
              <p className="text-sm text-gray-600">
                {this.state.error?.message || '发生了未知错误'}
              </p>
            </div>
            <button
              onClick={this.resetError}
              className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              重试
            </button>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// 默认的错误回退组件
export const DefaultErrorFallback: React.FC<{ error?: Error; resetError: () => void }> = ({ 
  error, 
  resetError 
}) => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="max-w-md w-full bg-white shadow-lg rounded-lg p-6">
      <div className="flex items-center mb-4">
        <div className="flex-shrink-0">
          <svg className="h-8 w-8 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833.192 2.5 1.732 2.5z" />
          </svg>
        </div>
        <div className="ml-3">
          <h3 className="text-sm font-medium text-gray-800">
            应用错误
          </h3>
        </div>
      </div>
      <div className="mb-4">
        <p className="text-sm text-gray-600">
          {error?.message || '应用遇到了一个错误，请尝试刷新页面'}
        </p>
      </div>
      <div className="flex space-x-3">
        <button
          onClick={resetError}
          className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          重试
        </button>
        <button
          onClick={() => window.location.reload()}
          className="flex-1 bg-gray-600 text-white py-2 px-4 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
        >
          刷新页面
        </button>
      </div>
    </div>
  </div>
)

export default ErrorBoundary
