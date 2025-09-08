import { NextRequest, NextResponse } from 'next/server'

export const runtime = 'edge'

// 第三方网站预览服务
const PREVIEW_SERVICES = [
  {
    name: 'htmlcsstoimage',
    url: (url: string) => `https://htmlcsstoimage.com/demo_images/image.png?url=${encodeURIComponent(url)}&width=1200&height=800`,
    headers: {}
  },
  {
    name: 'microlink',
    url: (url: string) => `https://api.microlink.io/screenshot?url=${encodeURIComponent(url)}&viewport.width=1200&viewport.height=800&type=png`,
    headers: {}
  },
  {
    name: 'urlbox',
    url: (url: string) => `https://api.urlbox.io/v1/render?url=${encodeURIComponent(url)}&width=1200&height=800&format=png`,
    headers: {}
  }
]

// 生成网站预览图
async function generateWebsitePreview(url: string): Promise<Response | null> {
  for (const service of PREVIEW_SERVICES) {
    try {
      const previewUrl = service.url(url)
      const response = await fetch(previewUrl, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          ...service.headers
        },
        signal: AbortSignal.timeout(10000)
      })
      
      if (response.ok && response.headers.get('content-type')?.startsWith('image/')) {
        return response
      }
    } catch (error) {
      console.log(`Preview service ${service.name} failed:`, error)
      continue
    }
  }
  return null
}

// 生成SVG占位图
function generateSVGPlaceholder(url: string): string {
  const domain = new URL(url).hostname
  return `
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
      <text x="220" y="85" font-family="Arial, sans-serif" font-size="14" fill="#6b7280">${domain}</text>
      
      <!-- 网站图标 -->
      <circle cx="600" cy="300" r="60" fill="#3b82f6" opacity="0.1"/>
      <text x="600" y="315" font-family="Arial, sans-serif" font-size="48" fill="#3b82f6" text-anchor="middle">🌐</text>
      
      <!-- 网站信息 -->
      <text x="600" y="380" font-family="Arial, sans-serif" font-size="24" fill="#1f2937" text-anchor="middle" font-weight="bold">网站预览</text>
      <text x="600" y="420" font-family="Arial, sans-serif" font-size="16" fill="#6b7280" text-anchor="middle">${domain}</text>
      <text x="600" y="450" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">该网站暂时无法预览</text>
      <text x="600" y="480" font-family="Arial, sans-serif" font-size="14" fill="#9ca3af" text-anchor="middle">点击访问完整内容</text>
      
      <!-- 装饰元素 -->
      <rect x="400" y="520" width="400" height="2" rx="1" fill="#e5e7eb"/>
      <rect x="450" y="540" width="100" height="8" rx="4" fill="#f3f4f6"/>
      <rect x="570" y="540" width="80" height="8" rx="4" fill="#f3f4f6"/>
      <rect x="420" y="560" width="120" height="8" rx="4" fill="#f3f4f6"/>
      <rect x="560" y="560" width="140" height="8" rx="4" fill="#f3f4f6"/>
    </svg>
  `
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    // 验证 URL 格式
    const targetUrl = new URL(url)
    
    // 尝试生成网站预览
    const previewResponse = await generateWebsitePreview(url)
    
    if (previewResponse) {
      return new NextResponse(previewResponse.body, {
        headers: {
          'Content-Type': previewResponse.headers.get('content-type') || 'image/png',
          'Cache-Control': 'public, max-age=3600', // 缓存1小时
          'X-Preview-Source': 'third-party'
        }
      })
    }

    // 如果第三方服务都失败，返回SVG占位图
    const fallbackSvg = generateSVGPlaceholder(url)
    
    return new NextResponse(fallbackSvg, {
      headers: {
        'Content-Type': 'image/svg+xml',
        'Cache-Control': 'public, max-age=300', // 缓存5分钟
        'X-Preview-Source': 'svg-fallback'
      }
    })

  } catch (error) {
    console.error('Website preview API error:', error)
    return NextResponse.json({ error: 'Failed to generate preview' }, { status: 500 })
  }
}
