'use client'

import { useEffect } from 'react'
import { useReportWebVitals } from 'next/web-vitals'
import { logger } from '@/lib/logger'

// 🔧 Web Vitals监控组件
export function WebVitalsMonitor() {
  useReportWebVitals((metric) => {
    // 发送到Google Analytics
    if (typeof window !== 'undefined' && window.gtag) {
      window.gtag('event', metric.name, {
        event_category: 'Web Vitals',
        event_label: metric.id,
        value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
        non_interaction: true,
        custom_map: {
          metric_id: 'dimension1',
          metric_value: 'metric1',
          metric_delta: 'metric2'
        }
      })
    }
    
    // 发送到自定义分析服务
    sendToAnalytics(metric)
    
    // 开发环境下在控制台显示
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vitals:', {
        name: metric.name,
        value: metric.value,
        id: metric.id,
        rating: getMetricRating(metric.name, metric.value)
      })
    }
  })
  
  return null
}

// 🔧 发送指标到分析服务
function sendToAnalytics(metric: any) {
  const body = JSON.stringify({
    name: metric.name,
    value: metric.value,
    id: metric.id,
    url: window.location.href,
    timestamp: Date.now(),
    userAgent: navigator.userAgent,
    connection: getConnectionInfo()
  })
  
  // 使用sendBeacon API确保数据发送
  if ('sendBeacon' in navigator) {
    navigator.sendBeacon('/api/analytics/web-vitals', body)
  } else {
    // 降级到fetch
    fetch('/api/analytics/web-vitals', {
      method: 'POST',
      body,
      headers: {
        'Content-Type': 'application/json'
      },
      keepalive: true
    }).catch(err => {
      console.warn('Failed to send web vitals:', err)
    })
  }
}

// 🔧 获取网络连接信息
function getConnectionInfo() {
  if ('connection' in navigator) {
    const conn = (navigator as any).connection
    return {
      effectiveType: conn.effectiveType,
      downlink: conn.downlink,
      rtt: conn.rtt,
      saveData: conn.saveData
    }
  }
  return null
}

// 🔧 获取指标评级
function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds = {
    FCP: [1800, 3000],
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    TTFB: [800, 1800]
  }
  
  const [good, poor] = thresholds[name as keyof typeof thresholds] || [0, 0]
  
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

// 🔧 性能监控Hook
export function usePerformanceMonitor() {
  useEffect(() => {
    // 监控长任务
    if ('PerformanceObserver' in window) {
      const longTaskObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.duration > 50) {
            logger.warn('Long task detected:', {
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name
            })
            
            // 发送长任务数据
            sendToAnalytics({
              name: 'LONG_TASK',
              value: entry.duration,
              id: `long-task-${Date.now()}`,
              startTime: entry.startTime
            })
          }
        }
      })
      
      try {
        longTaskObserver.observe({ entryTypes: ['longtask'] })
      } catch (e) {
        logger.warn('Long task observer not supported')
      }
      
      // 监控布局偏移
      const layoutShiftObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            console.log('Layout shift:', {
              value: (entry as any).value,
              sources: (entry as any).sources
            })
          }
        }
      })
      
      try {
        layoutShiftObserver.observe({ entryTypes: ['layout-shift'] })
      } catch (e) {
        console.warn('Layout shift observer not supported')
      }
      
      return () => {
        longTaskObserver.disconnect()
        layoutShiftObserver.disconnect()
      }
    }
  }, [])
}

// 🔧 资源加载监控
export function useResourceMonitor() {
  useEffect(() => {
    if ('PerformanceObserver' in window) {
      const resourceObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const resource = entry as PerformanceResourceTiming
          
          // 监控慢资源
          if (resource.duration > 1000) {
            logger.warn('Slow resource:', {
              name: resource.name,
              duration: resource.duration,
              size: resource.transferSize,
              type: resource.initiatorType
            })
          }

          // 监控失败的资源
          if (resource.transferSize === 0 && resource.duration > 0) {
            logger.warn('Failed resource:', resource.name)
          }
        }
      })
      
      try {
        resourceObserver.observe({ entryTypes: ['resource'] })
      } catch (e) {
        logger.warn('Resource observer not supported')
      }
      
      return () => {
        resourceObserver.disconnect()
      }
    }
  }, [])
}

// 🔧 内存使用监控
export function useMemoryMonitor() {
  useEffect(() => {
    const checkMemory = () => {
      if ('memory' in performance) {
        const memory = (performance as any).memory
        const memoryInfo = {
          usedJSHeapSize: memory.usedJSHeapSize,
          totalJSHeapSize: memory.totalJSHeapSize,
          jsHeapSizeLimit: memory.jsHeapSizeLimit,
          usage: (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100
        }
        
        // 如果内存使用超过80%，发出警告
        if (memoryInfo.usage > 80) {
          logger.warn('High memory usage:', memoryInfo)
          
          sendToAnalytics({
            name: 'HIGH_MEMORY_USAGE',
            value: memoryInfo.usage,
            id: `memory-${Date.now()}`,
            details: memoryInfo
          })
        }
      }
    }
    
    // 每30秒检查一次内存使用
    const interval = setInterval(checkMemory, 30000)
    
    return () => clearInterval(interval)
  }, [])
}

// 🔧 页面可见性监控
export function useVisibilityMonitor() {
  useEffect(() => {
    let startTime = Date.now()
    
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面变为不可见
        const visibleTime = Date.now() - startTime
        sendToAnalytics({
          name: 'PAGE_VISIBLE_TIME',
          value: visibleTime,
          id: `visibility-${Date.now()}`
        })
      } else {
        // 页面变为可见
        startTime = Date.now()
      }
    }
    
    document.addEventListener('visibilitychange', handleVisibilityChange)
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [])
}

// 🔧 综合性能监控组件
export function PerformanceMonitor() {
  usePerformanceMonitor()
  useResourceMonitor()
  useMemoryMonitor()
  useVisibilityMonitor()
  
  return <WebVitalsMonitor />
}
