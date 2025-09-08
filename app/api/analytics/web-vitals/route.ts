import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

interface WebVitalMetric {
  name: string
  value: number
  id: string
  url: string
  timestamp: number
  userAgent: string
  connection?: {
    effectiveType: string
    downlink: number
    rtt: number
    saveData: boolean
  }
}

// 🔧 Web Vitals数据收集端点
export async function POST(request: NextRequest) {
  try {
    const metric: WebVitalMetric = await request.json()
    
    // 验证数据
    if (!metric.name || typeof metric.value !== 'number' || !metric.id) {
      return NextResponse.json(
        { error: 'Invalid metric data' },
        { status: 400 }
      )
    }
    
    // 获取客户端信息
    const clientInfo = {
      ip: getClientIP(request),
      userAgent: request.headers.get('user-agent') || '',
      referer: request.headers.get('referer') || '',
      country: request.headers.get('cf-ipcountry') || 'unknown',
      timestamp: new Date().toISOString()
    }
    
    // 处理不同类型的指标
    const processedMetric = processMetric(metric, clientInfo)
    
    // 在开发环境下记录到控制台
    if (process.env.NODE_ENV === 'development') {
      console.log('📊 Web Vitals Received:', processedMetric)
    }
    
    // 存储到数据库或发送到分析服务
    await storeMetric(processedMetric)
    
    // 实时性能警报
    if (shouldAlert(metric)) {
      await sendPerformanceAlert(processedMetric)
    }
    
    return NextResponse.json({ success: true })
    
  } catch (error) {
    console.error('Web Vitals API Error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// 🔧 获取客户端IP
function getClientIP(request: NextRequest): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (cfConnectingIP) return cfConnectingIP
  if (realIP) return realIP
  if (forwarded) return forwarded.split(',')[0].trim()
  
  return 'unknown'
}

// 🔧 处理指标数据
function processMetric(metric: WebVitalMetric, clientInfo: any) {
  const processed = {
    ...metric,
    ...clientInfo,
    rating: getMetricRating(metric.name, metric.value),
    category: getMetricCategory(metric.name),
    deviceType: getDeviceType(clientInfo.userAgent),
    browserInfo: getBrowserInfo(clientInfo.userAgent)
  }
  
  return processed
}

// 🔧 获取指标评级
function getMetricRating(name: string, value: number): 'good' | 'needs-improvement' | 'poor' {
  const thresholds: Record<string, [number, number]> = {
    FCP: [1800, 3000],
    LCP: [2500, 4000],
    FID: [100, 300],
    CLS: [0.1, 0.25],
    TTFB: [800, 1800],
    INP: [200, 500]
  }
  
  const [good, poor] = thresholds[name] || [0, 0]
  
  if (value <= good) return 'good'
  if (value <= poor) return 'needs-improvement'
  return 'poor'
}

// 🔧 获取指标分类
function getMetricCategory(name: string): string {
  const categories: Record<string, string> = {
    FCP: 'loading',
    LCP: 'loading',
    FID: 'interactivity',
    INP: 'interactivity',
    CLS: 'visual-stability',
    TTFB: 'loading'
  }
  
  return categories[name] || 'other'
}

// 🔧 获取设备类型
function getDeviceType(userAgent: string): string {
  if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
    return /iPad/.test(userAgent) ? 'tablet' : 'mobile'
  }
  return 'desktop'
}

// 🔧 获取浏览器信息
function getBrowserInfo(userAgent: string) {
  const browsers = [
    { name: 'Chrome', pattern: /Chrome\/(\d+)/ },
    { name: 'Firefox', pattern: /Firefox\/(\d+)/ },
    { name: 'Safari', pattern: /Safari\/(\d+)/ },
    { name: 'Edge', pattern: /Edg\/(\d+)/ }
  ]
  
  for (const browser of browsers) {
    const match = userAgent.match(browser.pattern)
    if (match) {
      return {
        name: browser.name,
        version: match[1]
      }
    }
  }
  
  return { name: 'Unknown', version: '0' }
}

// 🔧 存储指标数据
async function storeMetric(metric: any) {
  try {
    // 这里可以集成各种存储方案：
    
    // 1. 发送到Google Analytics 4
    if (process.env.GA_MEASUREMENT_ID) {
      await sendToGA4(metric)
    }
    
    // 2. 发送到自定义数据库
    if (process.env.DATABASE_URL) {
      await saveToDatabase(metric)
    }
    
    // 3. 发送到第三方分析服务
    if (process.env.ANALYTICS_WEBHOOK_URL) {
      await sendToWebhook(metric)
    }
    
    // 4. 本地日志记录
    console.log('Metric stored:', {
      name: metric.name,
      value: metric.value,
      rating: metric.rating,
      timestamp: metric.timestamp
    })
    
  } catch (error) {
    console.error('Failed to store metric:', error)
  }
}

// 🔧 发送到Google Analytics 4
async function sendToGA4(metric: any) {
  const measurementId = process.env.GA_MEASUREMENT_ID
  const apiSecret = process.env.GA_API_SECRET
  
  if (!measurementId || !apiSecret) return
  
  const payload = {
    client_id: metric.id,
    events: [{
      name: 'web_vitals',
      params: {
        metric_name: metric.name,
        metric_value: metric.value,
        metric_rating: metric.rating,
        page_location: metric.url,
        custom_parameter_1: metric.deviceType,
        custom_parameter_2: metric.browserInfo.name
      }
    }]
  }
  
  await fetch(`https://www.google-analytics.com/mp/collect?measurement_id=${measurementId}&api_secret=${apiSecret}`, {
    method: 'POST',
    body: JSON.stringify(payload),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 🔧 保存到数据库
async function saveToDatabase(metric: any) {
  // 这里可以集成数据库操作
  // 例如：Supabase, PlanetScale, MongoDB等
  console.log('Saving to database:', metric.name)
}

// 🔧 发送到Webhook
async function sendToWebhook(metric: any) {
  const webhookUrl = process.env.ANALYTICS_WEBHOOK_URL
  if (!webhookUrl) return
  
  await fetch(webhookUrl, {
    method: 'POST',
    body: JSON.stringify(metric),
    headers: {
      'Content-Type': 'application/json'
    }
  })
}

// 🔧 判断是否需要发送警报
function shouldAlert(metric: WebVitalMetric): boolean {
  const alertThresholds: Record<string, number> = {
    LCP: 4000,  // LCP > 4s
    FID: 300,   // FID > 300ms
    CLS: 0.25,  // CLS > 0.25
    TTFB: 1800  // TTFB > 1.8s
  }
  
  const threshold = alertThresholds[metric.name]
  return threshold !== undefined && metric.value > threshold
}

// 🔧 发送性能警报
async function sendPerformanceAlert(metric: any) {
  const alertWebhook = process.env.PERFORMANCE_ALERT_WEBHOOK
  if (!alertWebhook) return
  
  const alertData = {
    type: 'performance_alert',
    metric: metric.name,
    value: metric.value,
    rating: metric.rating,
    url: metric.url,
    timestamp: metric.timestamp,
    deviceType: metric.deviceType,
    browser: metric.browserInfo
  }
  
  try {
    await fetch(alertWebhook, {
      method: 'POST',
      body: JSON.stringify(alertData),
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Failed to send performance alert:', error)
  }
}
