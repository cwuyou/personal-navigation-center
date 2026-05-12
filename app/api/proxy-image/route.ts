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

function mergeSignals(...signals: (AbortSignal | undefined)[]): AbortSignal {
  const valid = signals.filter((s): s is AbortSignal => !!s)
  const anyFn = (AbortSignal as unknown as { any?: (list: AbortSignal[]) => AbortSignal }).any
  if (typeof anyFn === 'function') return anyFn(valid)
  const ctrl = new AbortController()
  for (const s of valid) {
    if (s.aborted) { ctrl.abort((s as any).reason); break }
    s.addEventListener('abort', () => ctrl.abort((s as any).reason), { once: true })
  }
  return ctrl.signal
}

function relayBody(upstream: Response, clientSignal: AbortSignal): ReadableStream<Uint8Array> {
  const { readable, writable } = new TransformStream<Uint8Array, Uint8Array>()
  upstream.body!
    .pipeTo(writable, { signal: clientSignal })
    .catch(() => {
      // 客户端中途断开、上游提前结束、abort 均在此静默吞掉
      // 避免 Edge Runtime 里 enqueue-after-close 冒泡成 unhandledRejection
    })
  return readable
}

async function fetchWithReferer(u: URL, clientSignal: AbortSignal) {
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
    signal: mergeSignals(clientSignal, AbortSignal.timeout(4000)),
  })
}

// 尝试不同的User-Agent策略
async function fetchWithDifferentUA(u: URL, clientSignal: AbortSignal) {
  const userAgents = [
    // 标准浏览器
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
    // 移动端浏览器
    'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
    // 简化的请求
    'Mozilla/5.0 (compatible; ImageBot/1.0)',
  ]

  for (const ua of userAgents) {
    if (clientSignal.aborted) break
    try {
      const response = await fetch(u.toString(), {
        headers: {
          'User-Agent': ua,
          'Accept': 'image/*,*/*;q=0.8',
        },
        redirect: 'follow',
        cache: 'no-store',
        signal: mergeSignals(clientSignal, AbortSignal.timeout(3000)),
      })
      if (response.ok) return response
    } catch (e) {
      continue // 尝试下一个UA
    }
  }
  throw new Error('All user agents failed')
}

async function fetchSiteAsset(origin: string, path: string, clientSignal: AbortSignal, timeoutMs: number) {
  const url = `${origin}${path}`
  return fetch(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
      'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
    },
    redirect: 'follow',
    cache: 'no-store',
    signal: mergeSignals(clientSignal, AbortSignal.timeout(timeoutMs)),
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

  const clientSignal = request.signal

  // 识别"聚合 favicon 服务"。如果目标已经是这类服务，
  // 我们可以从其参数还原出真实站点，先尝试用真实站点自身的资产，
  // 避免在国内网络下被这些不可达服务拖死。
  let realSiteOrigin: string | null = null
  if (target.hostname === 'www.google.com' && target.pathname.startsWith('/s2/favicons')) {
    const domain = target.searchParams.get('domain')
    if (domain) realSiteOrigin = `https://${domain}`
  } else if (target.hostname === 'icons.duckduckgo.com' && target.pathname.startsWith('/ip3/')) {
    const host = target.pathname.replace(/^\/ip3\//, '').replace(/\.ico$/, '')
    if (host) realSiteOrigin = `https://${host}`
  } else {
    realSiteOrigin = target.origin
  }

  // 0) 如果是聚合服务请求,优先取真实站点的 favicon (国内最快)
  const isAggregator = target.hostname === 'www.google.com' || target.hostname === 'icons.duckduckgo.com'
  if (isAggregator && realSiteOrigin) {
    for (const path of ['/favicon.ico', '/apple-touch-icon.png']) {
      if (clientSignal.aborted) return new NextResponse(null, { status: 499 })
      try {
        const resp = await fetchSiteAsset(realSiteOrigin, path, clientSignal, 3500)
        if (resp.ok) {
          const contentType = resp.headers.get('content-type') || 'image/x-icon'
          return new NextResponse(relayBody(resp, clientSignal), {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400, immutable',
              'X-Proxy-From': new URL(realSiteOrigin).hostname,
              'X-Proxy-Method': `site-asset${path}`,
            },
          })
        }
      } catch (_) { /* 继续 */ }
    }
  }

  // 1) 主请求 - 带Referer
  try {
    const resp = await fetchWithReferer(target, clientSignal)
    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || 'application/octet-stream'
      return new NextResponse(relayBody(resp, clientSignal), {
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

  if (clientSignal.aborted) return new NextResponse(null, { status: 499 })

  // 2) 目标站自身的 favicon / apple-touch-icon (跳过聚合服务,因为 0) 已经试过)
  if (!isAggregator && realSiteOrigin) {
    for (const path of ['/favicon.ico', '/apple-touch-icon.png']) {
      if (clientSignal.aborted) return new NextResponse(null, { status: 499 })
      try {
        const resp = await fetchSiteAsset(realSiteOrigin, path, clientSignal, 3500)
        if (resp.ok) {
          const contentType = resp.headers.get('content-type') || 'image/x-icon'
          return new NextResponse(relayBody(resp, clientSignal), {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400, immutable',
              'X-Proxy-From': new URL(realSiteOrigin).hostname,
              'X-Proxy-Method': `site-asset${path}`,
            },
          })
        }
      } catch (_) { /* 继续 */ }
    }
  }

  if (clientSignal.aborted) return new NextResponse(null, { status: 499 })

  // 3) 尝试不同User-Agent (针对原始 URL)
  try {
    const resp = await fetchWithDifferentUA(target, clientSignal)
    if (resp.ok) {
      const contentType = resp.headers.get('content-type') || 'application/octet-stream'
      return new NextResponse(relayBody(resp, clientSignal), {
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

  if (clientSignal.aborted) return new NextResponse(null, { status: 499 })

  // 4) 回退到 DuckDuckGo (国际网络可达性较好)
  try {
    const duckUrl = `https://icons.duckduckgo.com/ip3/${target.hostname}.ico`
    const resp3 = await fetch(duckUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      cache: 'no-store',
      signal: mergeSignals(clientSignal, AbortSignal.timeout(3000)),
    })

    if (resp3.ok) {
      const contentType = resp3.headers.get('content-type') || 'image/x-icon'
      return new NextResponse(relayBody(resp3, clientSignal), {
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
    // 继续尝试最后的回退
  }

  if (clientSignal.aborted) return new NextResponse(null, { status: 499 })

  // 5) 最终回退：Google S2 favicon (国内通常不可达,放最后)
  try {
    const fallbackUrl = s2FaviconUrl(target.hostname)
    const resp2 = await fetch(fallbackUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36',
        'Accept': 'image/avif,image/webp,image/apng,image/*,*/*;q=0.8',
      },
      redirect: 'follow',
      cache: 'no-store',
      signal: mergeSignals(clientSignal, AbortSignal.timeout(3000)),
    })

    if (resp2.ok) {
      const contentType = resp2.headers.get('content-type') || 'image/png'
      return new NextResponse(relayBody(resp2, clientSignal), {
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
    // 所有方法都失败了
  }

  // 终极兜底:所有上游都失败时,跳到纯本地生成的 SVG 占位图,
  // 避免浏览器出现 broken image,也不再污染控制台日志
  const screenshotUrl = `/api/screenshot?url=${encodeURIComponent(target.origin)}`
  return NextResponse.redirect(new URL(screenshotUrl, request.url), 302)
}

