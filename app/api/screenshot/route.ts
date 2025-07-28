import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    // 验证 URL 格式
    const targetUrl = new URL(url)
    
    // 使用免费的截图服务
    const screenshotServices = [
      // 服务1: htmlcsstoimage.com (免费额度)
      `https://hcti.io/v1/image?url=${encodeURIComponent(url)}&viewport_width=1200&viewport_height=800`,
      
      // 服务2: screenshotapi.net (免费额度)
      `https://shot.screenshotapi.net/screenshot?token=demo&url=${encodeURIComponent(url)}&width=1200&height=800&output=image&file_type=png&wait_for_event=load`,
      
      // 服务3: 备用方案 - 使用 Google PageSpeed Insights 的截图
      `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&screenshot=true`,
    ]

    // 尝试第一个服务
    try {
      const response = await fetch(screenshotServices[1], {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      })

      if (response.ok) {
        const imageBuffer = await response.arrayBuffer()
        return new NextResponse(imageBuffer, {
          headers: {
            'Content-Type': 'image/png',
            'Cache-Control': 'public, max-age=3600', // 缓存1小时
          },
        })
      }
    } catch (error) {
      console.log('Screenshot service 1 failed:', error)
    }

    // 如果截图服务失败，返回一个简单的预览卡片
    const fallbackSvg = `
      <svg width="1200" height="800" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style="stop-color:#f8fafc;stop-opacity:1" />
            <stop offset="100%" style="stop-color:#e2e8f0;stop-opacity:1" />
          </linearGradient>
        </defs>
        <rect width="100%" height="100%" fill="url(#bg)"/>
        
        <!-- 浏览器框架 -->
        <rect x="50" y="50" width="1100" height="700" rx="8" fill="white" stroke="#e2e8f0" stroke-width="2"/>
        
        <!-- 地址栏 -->
        <rect x="50" y="50" width="1100" height="60" rx="8" fill="#f1f5f9" stroke="#e2e8f0" stroke-width="1"/>
        <circle cx="90" cy="80" r="8" fill="#ef4444"/>
        <circle cx="120" cy="80" r="8" fill="#f59e0b"/>
        <circle cx="150" cy="80" r="8" fill="#10b981"/>
        
        <!-- URL 地址 -->
        <rect x="200" y="65" width="800" height="30" rx="15" fill="white" stroke="#d1d5db"/>
        <text x="220" y="85" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">${targetUrl.hostname}</text>
        
        <!-- 网站图标 -->
        <circle cx="600" cy="300" r="60" fill="#3b82f6" opacity="0.1"/>
        <text x="600" y="315" font-family="Arial, sans-serif" font-size="48" fill="#3b82f6" text-anchor="middle">🌐</text>
        
        <!-- 网站信息 -->
        <text x="600" y="380" font-family="Arial, sans-serif" font-size="24" fill="#1f2937" text-anchor="middle" font-weight="bold">网站预览</text>
        <text x="600" y="420" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">${targetUrl.hostname}</text>
        <text x="600" y="450" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">该网站不支持直接预览</text>
        <text x="600" y="480" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">点击"在新标签页中打开"访问完整内容</text>
        
        <!-- 装饰元素 -->
        <rect x="400" y="520" width="400" height="2" rx="1" fill="#e5e7eb"/>
        <rect x="450" y="540" width="100" height="8" rx="4" fill="#f3f4f6"/>
        <rect x="570" y="540" width="80" height="8" rx="4" fill="#f3f4f6"/>
        <rect x="420" y="560" width="120" height="8" rx="4" fill="#f3f4f6"/>
        <rect x="560" y="560" width="140" height="8" rx="4" fill="#f3f4f6"/>
      </svg>
    `

    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // 缓存5分钟
      },
    })

  } catch (error) {
    console.error('Screenshot API error:', error)
    return NextResponse.json({ error: 'Failed to generate screenshot' }, { status: 500 })
  }
}
