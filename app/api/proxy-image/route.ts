import { NextRequest, NextResponse } from 'next/server'

// 极简图片代理（带回退）
// 用法: /api/proxy-image?url=<encoded image url>
// 安全：仅允许 http/https；阻止本地/内网地址；7s 超时；透传 Content-Type 与缓存头
export const runtime = 'edge'

// 某些静态资源域需要指定站点主域作为 Referer
const REFERER_HOST_OVERRIDE: Record<string, string> = {
  'static.figma.com': 'https://figma.com/',
  'static.canva.com': 'https://canva.com/',
  'a.trellocdn.com': 'https://trello.com/',
  'assets.monica.im': 'https://monica.im/',
  'cdn.nlark.com': 'https://yuque.com/',
  'upload-images.jianshu.io': 'https://jianshu.com/',
  'oss-emcsprod-public.oss-cn-beijing.aliyuncs.com': 'https://modb.pro/',
}

// 用于 favicon 回退时将静态域映射回站点域
const FAVICON_DOMAIN_OVERRIDE: Record<string, string> = {
  'static.figma.com': 'figma.com',
  'static.canva.com': 'canva.com',
  'a.trellocdn.com': 'trello.com',
}

function isPrivateHostname(host: string) {
  const h = host.toLowerCase()
  if (
    h === 'localhost' ||
    h === '127.0.0.1' ||
    h === '::1' ||
    h === '0.0.0.0'
  ) return true

  // IPv4 私网段
  if (/^10\./.test(h)) return true
  if (/^192\.168\./.test(h)) return true
  if (/^172\.(1[6-9]|2\d|3[0-1])\./.test(h)) return true
  if (/^169\.254\./.test(h)) return true

  // 无点主机名（如内网主机名）
  if (!h.includes('.')) return true

  return false
}

function rootDomain(host: string) {
  const parts = host.split('.')
  if (parts.length <= 2) return host
  return parts.slice(-2).join('.')
}

function s2FaviconUrl(host: string) {
  const domain = FAVICON_DOMAIN_OVERRIDE[host] || rootDomain(host)
  const d = encodeURIComponent(domain)
  return `https://www.google.com/s2/favicons?domain=${d}&sz=256`
}

async function fetchWithReferer(u: URL) {
  const referer = REFERER_HOST_OVERRIDE[u.hostname] || `${u.origin}/`
  return fetch(u.toString(), {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
      'Referer': referer,
      'Sec-Fetch-Dest': 'image',
      'Sec-Fetch-Mode': 'no-cors',
      'Sec-Fetch-Site': 'cross-site',
    },
    redirect: 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(10000), // 增加到10秒
  })
}

// 尝试不同的User-Agent策略
async function fetchWithDifferentUA(u: URL) {
  const userAgents = [
    // 标准浏览器
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    // 移动端浏览器
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    // 简化的请求
    'Mozilla/5.0 (compatible; ImageBot/1.0)',
  ]

  for (const ua of userAgents) {
    try {
      const response = await fetch(u.toString(), {
        headers: {
          'User-Agent': ua,
          'Accept': 'image/*,*/*;q=0.8',
        },
        redirect: 'follow',
        cache: 'no-store',
        signal: AbortSignal.timeout(8000),
      })
      if (response.ok) return response
    } catch (e) {
      continue // 尝试下一个UA
    }
  }
  throw new Error('All user agents failed')
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url') || searchParams.get('src')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  let target: URL
  try {
    target = new URL(url)
  } catch {
    return NextResponse.json({ error: 'Invalid URL' }, { status: 400 })
  }

  if (!['http:', 'https:'].includes(target.protocol)) {
    return NextResponse.json({ error: 'Unsupported protocol' }, { status: 400 })
  }

  if (isPrivateHostname(target.hostname)) {
    return NextResponse.json({ error: 'Blocked host' }, { status: 403 })
  }

  // 1) 主请求 - 带Referer
  try {
    const resp = await fetchWithReferer(target)
    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || 'application/octet-stream'
      return new NextResponse(resp.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, immutable',
          'X-Proxy-From': target.hostname,
          'X-Proxy-Method': 'referer',
        },
      })
    }
  } catch (_) {
    // 继续尝试其他方法
  }

  // 2) 尝试不同User-Agent
  try {
    const resp = await fetchWithDifferentUA(target)
    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || 'application/octet-stream'
      return new NextResponse(resp.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, immutable',
          'X-Proxy-From': target.hostname,
          'X-Proxy-Method': 'ua-fallback',
        },
      })
    }
  } catch (_) {
    // 继续尝试其他方法
  }

  // 3) 回退到 Google S2 favicon（使用站点主域）
  try {
    const fallbackUrl = s2FaviconUrl(target.hostname)
    const resp2 = await fetch(fallbackUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(7000),
    })

    if (resp2.ok) {
      const contentType = resp2.headers.get('content-type') || 'image/png'
      return new NextResponse(resp2.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, immutable',
          'X-Proxy-From': target.hostname,
          'X-Proxy-Method': 's2-favicon',
        },
      })
    }
  } catch (_) {
    // 继续尝试最后的回退
  }

  // 4) 最终回退：DuckDuckGo favicon
  try {
    const duckUrl = `https://icons.duckduckgo.com/ip3/${target.hostname}.ico`
    const resp3 = await fetch(duckUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      cache: 'no-store',
      signal: AbortSignal.timeout(5000),
    })

    if (resp3.ok) {
      const contentType = resp3.headers.get('content-type') || 'image/x-icon'
      return new NextResponse(resp3.body, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=86400, immutable',
          'X-Proxy-From': target.hostname,
          'X-Proxy-Method': 'duckduckgo-favicon',
        },
      })
    }
  } catch (_) {
    // 所有方法都失败了
  }

  return NextResponse.json({ error: 'Upstream error with fallback failed' }, { status: 502 })
}

