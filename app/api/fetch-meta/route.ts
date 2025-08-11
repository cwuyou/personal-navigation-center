import { NextRequest, NextResponse } from 'next/server'

function decodeEntities(text: string) {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&nbsp;/g, ' ')
}

function stripHtml(html: string) {
  return decodeEntities(
    html
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
  )
    .replace(/\s+/g, ' ')
    .trim()
}

function extractJsonLd(html: string) {
  try {
    const matches = html.match(/<script[^>]*type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/i)
    if (!matches?.[1]) return null
    const json = JSON.parse(matches[1])
    if (Array.isArray(json)) return json.find((x) => x && typeof x === 'object')
    return json
  } catch {
    return null
  }
}

function extractJsonByScriptId(html: string, id: string) {
  try {
    const re = new RegExp(`<script[^>]*id=["']${id}["'][^>]*>([\\s\\S]*?)<\\/script>`, 'i')
    const m = html.match(re)
    if (!m?.[1]) return null
    return JSON.parse(m[1])
  } catch {
    return null
  }
}

function deepFindArticleContent(json: any): { title?: string; content?: string } | null {
  if (!json) return null
  try {
    if (typeof json === 'object') {
      if (typeof json.content === 'string' && json.content.length > 40) {
        const title = typeof json.title === 'string' ? json.title : undefined
        return { title, content: json.content }
      }
      if (typeof json.articleBody === 'string' && json.articleBody.length > 40) {
        const title = typeof json.headline === 'string' ? json.headline : undefined
        return { title, content: json.articleBody }
      }
      for (const key of Object.keys(json)) {
        const v = (json as any)[key]
        const found = deepFindArticleContent(v)
        if (found) return found
      }
    } else if (Array.isArray(json)) {
      for (const v of json) {
        const found = deepFindArticleContent(v)
        if (found) return found
      }
    }
  } catch {}
  return null
}

function extractArticleText(html: string, host: string): { text?: string; titleFromJsonLd?: string } {
  const lowerHost = host.replace(/^www\./, '')

  // Site-specific selectors (best-effort)
  const selectorsByHost: Record<string, string[]> = {
    'blog.csdn.net': ['#content_views'],
    'zhuanlan.zhihu.com': ['article', '.Post-RichTextContainer', '.RichText'],
    'juejin.cn': ['article', '.markdown-body', '.article-content'],
    'cnblogs.com': ['#cnblogs_post_body', '.post', '.postBody'],
    'jianshu.com': ['article', '.note .content', '.article'],
    'medium.com': ['article', 'article div[role="article"]', 'article .pw-post-body-paragraph'],
    'ahrefs.com': ['article', '.post__content', '.article__content', '.blog-content'],
    'moz.com': ['article', '.article-content', '.entry-content'],
    'searchengineland.com': ['article', '.article__content', '.entry-content'],
    'backlinko.com': ['article', '.entry-content', '.post-content'],
    'neilpatel.com': ['article', '.entry', '.post-content', '.single-post-content'],
    'hubspot.com': ['article', '.post-body', '.article-body'],
    'semrush.com': ['article', '.c-blog__content', '.article__content'],
    'searchenginejournal.com': ['article', '.article__content', '.single-post .content'],
    'yoast.com': ['article', '.article__content', '.entry-content'],
    'contentmarketinginstitute.com': ['article', '.entry-content', '.article__content'],
    'reddit.com': ['article']
  }

  const selectors = selectorsByHost[lowerHost] || ['article', 'main article', '[itemprop="articleBody"]', '.article-content', '.post-content', '.entry-content']

  for (const sel of selectors) {
    const re = new RegExp(`<${sel.replace(/[#.\[\]\-\s]/g, '[^>]*')}[^>]*>([\\s\\S]*?)<\\/[^>]+>`, 'i')
    const m = html.match(re)
    if (m?.[1]) {
      const text = stripHtml(m[1])
      if (text && text.length > 40) return { text }
    }
  }

  // JSON-LD fallback
  const jsonld = extractJsonLd(html)
  if (jsonld) {
    const titleFromJsonLd = jsonld.headline || jsonld.name
    const body = jsonld.articleBody || jsonld.description
    if (body) return { text: stripHtml(String(body)).slice(0, 180), titleFromJsonLd }
    if (titleFromJsonLd) return { titleFromJsonLd }
  }

  // Zhihu special: deeply nested JSON in js-initialData
  if (lowerHost === 'zhuanlan.zhihu.com') {
    const initial = extractJsonByScriptId(html, 'js-initialData')
    const found = deepFindArticleContent(initial)
    if (found?.content) {
      return { text: stripHtml(found.content).slice(0, 180), titleFromJsonLd: found.title }
    }
  }

  return {}
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    const target = new URL(url)
    if (!['http:', 'https:'].includes(target.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 })
    }

    const ua =
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0 Safari/537.36'

    const resp = await fetch(url, {
      headers: {
        'User-Agent': ua,
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      // Reasonable timeout
      signal: AbortSignal.timeout(7000),
      cache: 'no-store',
    })

    let title = ''
    let description = ''

    if (resp.ok) {
      const html = await resp.text()

      // Title: <title> or og:title
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
      if (titleMatch?.[1]) title = titleMatch[1].trim()
      if (!title) {
        const ogTitleMatch = html.match(
          /<meta[^>]*property=["']og:title["'][^>]*content=["']([^"']*)["'][^>]*>/i
        )
        if (ogTitleMatch?.[1]) title = ogTitleMatch[1].trim()
      }

      // Description: meta description or og:description
      const metaDescMatch = html.match(
        /<meta[^>]*name=["']description["'][^>]*content=["']([^"']*)["'][^>]*>/i
      )
      if (metaDescMatch?.[1]) description = metaDescMatch[1].trim()
      if (!description) {
        const ogDescMatch = html.match(
          /<meta[^>]*property=["']og:description["'][^>]*content=["']([^"']*)["'][^>]*>/i
        )
        if (ogDescMatch?.[1]) description = ogDescMatch[1].trim()
      }

      // Special handling for common article structures
      const host = target.hostname.replace(/^www\./, '')
      const path = target.pathname.toLowerCase()

      if (!description) {
        const article = extractArticleText(html, host)
        if (article.text) description = article.text
        if (!title && article.titleFromJsonLd) title = article.titleFromJsonLd
      }

      // Final cleanups
      if (title) title = decodeEntities(title).replace(/\s+/g, ' ').trim()
      if (!title) {
        const domain = target.hostname.replace(/^www\./, '')
        title = domain.charAt(0).toUpperCase() + domain.slice(1)
      }

      if (description) description = decodeEntities(description).replace(/\s+/g, ' ').trim()
      if (description.length > 200) description = description.slice(0, 200) + '...'
    }

    return NextResponse.json({ title, description, url })
  } catch (error) {
    console.error('fetch-meta API error:', error)
    return NextResponse.json({ error: 'Failed to fetch metadata' }, { status: 500 })
  }
}

