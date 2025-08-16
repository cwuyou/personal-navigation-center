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
      'Referer': referer,
    },
    redirect: 'follow',
    cache: 'no-store',
    signal: AbortSignal.timeout(7000),
  })
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

  // 1) 主请求
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
        },
      })
    }
  } catch (_) {
    // 忽略，走回退
  }

  // 2) 回退到 Google S2 favicon（使用站点主域）
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
          'X-Proxy-Fallback': 's2',
        },
      })
    }
  } catch (_) {
    // 失败则继续返回错误
  }

  return NextResponse.json({ error: 'Upstream error with fallback failed' }, { status: 502 })
}

