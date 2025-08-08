import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const url = searchParams.get('url')

  console.log('🔍 API调用 - 获取标题:', url)

  if (!url) {
    return NextResponse.json({ error: 'URL parameter is required' }, { status: 400 })
  }

  try {
    // 验证URL格式
    const urlObj = new URL(url)
    if (!['http:', 'https:'].includes(urlObj.protocol)) {
      return NextResponse.json({ error: 'Invalid URL protocol' }, { status: 400 })
    }

    console.log('✅ URL格式验证通过:', urlObj.hostname)

    // 先准备备选标题
    const domain = urlObj.hostname.replace(/^www\./, '')
    const fallbackTitle = domain.charAt(0).toUpperCase() + domain.slice(1)

    let title = ''

    try {
      console.log('🌐 开始获取网页内容...')

      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        },
        signal: AbortSignal.timeout(5000), // 5秒超时
      })

      console.log('📄 网页响应状态:', response.status)

      if (response.ok) {
        const html = await response.text()
        console.log('📝 获取到HTML内容，长度:', html.length)

        // 提取标题
        console.log('🔍 开始提取标题...')

        // 方法1: 匹配 <title> 标签
        const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i)
        if (titleMatch && titleMatch[1]) {
          title = titleMatch[1].trim()
          console.log('✅ 从<title>标签获取到标题:', title)
        }

        // 方法2: 如果没有找到title，尝试匹配 og:title
        if (!title) {
          const ogTitleMatch = html.match(/<meta[^>]*property=["\']og:title["\'][^>]*content=["\']([^"\']*)["\'][^>]*>/i)
          if (ogTitleMatch && ogTitleMatch[1]) {
            title = ogTitleMatch[1].trim()
            console.log('✅ 从og:title获取到标题:', title)
          }
        }

        if (title) {
          // 清理标题
          title = title
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .replace(/&nbsp;/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()

          // 限制标题长度
          if (title.length > 100) {
            title = title.substring(0, 100) + '...'
          }
        }
      } else {
        console.log('❌ 网页请求失败，状态码:', response.status)
      }
    } catch (fetchError) {
      console.log('⚠️ 网页获取失败:', fetchError)
    }

    // 如果仍然没有标题，使用域名作为备选
    if (!title) {
      title = fallbackTitle
      console.log('🔄 使用域名作为备选标题:', title)
    }

    const result = { 
      title: title || '未知网站',
      url: url 
    }

    console.log('🎉 API返回结果:', result)
    return NextResponse.json(result)

  } catch (error) {
    console.error('❌ API错误:', error)
    
    // 如果是网络错误，尝试从URL推断标题
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace(/^www\./, '')
      const fallbackTitle = domain.charAt(0).toUpperCase() + domain.slice(1)
      
      console.log('🔄 使用备选标题:', fallbackTitle)
      return NextResponse.json({ 
        title: fallbackTitle,
        url: url,
        warning: 'Failed to fetch title, using domain name'
      })
    } catch {
      return NextResponse.json({ error: 'Failed to fetch title' }, { status: 500 })
    }
  }
}
