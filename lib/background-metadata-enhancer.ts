/**
 * 后台元数据增强服务
 * 在书签导入后异步获取和更新描述信息
 */

import websiteDescriptions from '@/data/website-descriptions-1000plus.json'
import { getFaviconUrl, extractSiteName } from './metadata-fetcher'
import { logger } from './logger'


export interface BookmarkMetadata {
  id: string
  title?: string
  description?: string
  favicon?: string
  coverImage?: string  // 封面图片
  enhanced?: boolean
  lastUpdated?: Date
}

export interface EnhancementProgress {
  total: number
  completed: number
  current?: string
  status: 'idle' | 'running' | 'completed' | 'error'
}

export class BackgroundMetadataEnhancer {
  private isRunning = false
  private abortController?: AbortController

  /**
   * 从预置数据库获取网站描述
   */
  private getPresetDescription(url: string): BookmarkMetadata | null {
    try {
      const u = new URL(url)
      const domain = u.hostname.replace(/^www\./, '')

      // 对文章类页面不要使用域名级别的通用描述，交给详细提取逻辑处理
      if (this.isArticleUrl(u)) {
        return null
      }

      const preset = (websiteDescriptions as any)[domain]

      if (preset) {
        const cover: string | undefined = preset.coverImage
        const isFavicon = !!cover && (/\.ico(\?|$)/i.test(cover) || cover.toLowerCase().includes('favicon') || /icon-\d+x\d+/i.test(cover) || cover.toLowerCase().includes('apple-touch-icon'))
        return {
          id: '',
          title: preset.title,
          description: preset.description,
          favicon: getFaviconUrl(url),
          // 预置没有封面或疑似favicon时，兜底生成封面（本地截图占位）
          coverImage: (!cover || isFavicon) ? this.generateCoverImage(url) : cover,
          enhanced: true,
          lastUpdated: new Date()
        }
      }
    } catch (error) {
      logger.warn('Failed to parse URL:', url, error)
    }

    return null
  }

  private isArticleUrl(u: URL): boolean {
    const host = u.hostname.replace(/^www\./, '')
    const path = u.pathname.toLowerCase()
    if (host.includes('csdn.net') && /\/article\/details\//.test(path)) return true
    if (host === 'zhuanlan.zhihu.com' && /^\/p\/[0-9a-zA-Z_-]+/.test(path)) return true
    if (host.includes('juejin.cn') && /^\/post\//.test(path)) return true
    if (host.includes('cnblogs.com') && /\/p\//.test(path)) return true
    if (host.includes('jianshu.com') && /\/p\//.test(path)) return true
    if (host.includes('medium.com') && /\/p\//.test(path)) return true
    if (host.includes('ahrefs.com') && /\/blog\//.test(path)) return true
    if (host.includes('moz.com') && /\/blog\//.test(path)) return true
    if (host.includes('searchengineland.com') && /\/\d{4}\/\d{2}\//.test(path)) return true
    if (host.includes('backlinko.com') && /\/\d{4}\/\d{2}\//.test(path)) return true
    if (host.includes('neilpatel.com') && /\/blog\//.test(path)) return true
    if (host.includes('hubspot.com') && /\/blog\//.test(path)) return true
    if (host.includes('semrush.com') && /\/blog\//.test(path)) return true
    if (host.includes('searchenginejournal.com') && /\/\d{4}\/\d{2}\//.test(path)) return true
    if (host.includes('yoast.com') && /\/seo-blog\//.test(path)) return true
    if (host.includes('contentmarketinginstitute.com') && /\/blog\//.test(path)) return true

    if (/\/article(\.|\/)/.test(path)) return true
    if (/\/blog\//.test(path)) return true
    return false
  }

  /**
   * 生成封面图片URL
   */
  private generateCoverImage(url: string): string | undefined {
    try {
      const urlObj = new URL(url)
      const domain = urlObj.hostname.replace(/^www\./, '')

      // 对于一些知名网站，使用特定的封面图片策略
      const coverImageStrategies: Record<string, string[]> = {
        'youtube.com': [
          `https://img.youtube.com/vi/${this.extractYouTubeVideoId(url)}/maxresdefault.jpg`,
          `https://img.youtube.com/vi/${this.extractYouTubeVideoId(url)}/hqdefault.jpg`,
          'https://www.youtube.com/img/desktop/yt_1200.png'
        ],
        'github.com': [
          'https://github.githubassets.com/images/modules/site/social-cards/github-social.png',
          'https://github.githubassets.com/images/modules/logos_page/GitHub-Mark.png'
        ],
        'twitter.com': [
          'https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc7275.png',
          'https://abs.twimg.com/icons/apple-touch-icon-192x192.png'
        ],
        'linkedin.com': [
          'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
          'https://static.licdn.com/aero-v1/sc/h/8s162nmbcnfkg7a0k8nq9wwqo'
        ],
        'medium.com': [
          'https://miro.medium.com/max/1200/1*jfdwtvU6V6g99q3G7gq7dQ.png',
          'https://cdn-static-1.medium.com/sites/medium.com/apple-touch-icon-152x152-precomposed.png'
        ],
        'chatgpt.com': [
          'https://chatgpt.com/apple-touch-icon.png',
          'https://cdn.openai.com/API/logo-openai.png'
        ],
        'claude.ai': [
          'https://claude.ai/apple-touch-icon.png',
          'https://www.anthropic.com/images/icons/apple-touch-icon.png'
        ],
        'figma.com': [
          'https://static.figma.com/app/icon/1/favicon-192.png',
          'https://static.figma.com/app/icon/1/touch-icon-iphone-retina-120.png'
        ],
        'notion.so': [
          'https://www.notion.so/images/logo-ios.png',
          'https://www.notion.so/front-static/logo-ios.png'
        ]
      }

      // 检查是否有特定策略（返回第一个可用的URL）
      for (const [siteDomain, imageUrls] of Object.entries(coverImageStrategies)) {
        if (domain.includes(siteDomain)) {
          // 返回第一个URL，如果失败会通过代理服务尝试其他URL
          return `/api/proxy-image?url=${encodeURIComponent(imageUrls[0])}`
        }
      }

      // 🔧 修复：移除 microlink.io 截图API，使用本地截图服务
      return `/api/screenshot?url=${encodeURIComponent(url)}`

    } catch (error) {
      logger.warn('Failed to generate cover image for:', url, error)
      return undefined
    }
  }

  /**
   * 从YouTube URL中提取视频ID
   */
  private extractYouTubeVideoId(url: string): string {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/)
    return match ? match[1] : 'default'
  }

  /**
   * 生成智能描述（基于域名和路径）
   */
  private generateSmartDescription(url: string): string {
    try {
      const urlObj = new URL(url)

      // 处理file://协议
      if (urlObj.protocol === 'file:') {
        const fileName = urlObj.pathname.split('/').pop() || ''
        if (fileName.includes('index.html')) {
          return '本地网站项目 - 开发和测试环境'
        }
        return '本地文件 - 离线资源'
      }

      const domain = urlObj.hostname.replace(/^www\./, '')
      const path = urlObj.pathname.toLowerCase()

      // 基于路径特征生成描述
      if (path.includes('/docs') || path.includes('/documentation')) {
        return `${extractSiteName(url)} - 技术文档和开发指南`
      }
      if (path.includes('/blog') || path.includes('/article') || path.includes('/post')) {
        return `${extractSiteName(url)} - 博客文章和技术见解`
      }
      if (path.includes('/api')) {
        return `${extractSiteName(url)} - API文档和接口说明`
      }
      if (path.includes('/tutorial') || path.includes('/guide') || path.includes('/learn')) {
        return `${extractSiteName(url)} - 教程和学习指南`
      }
      if (path.includes('/tool') || path.includes('/generator') || path.includes('/converter')) {
        return `${extractSiteName(url)} - 在线工具和实用服务`
      }
      if (path.includes('/download') || path.includes('/release')) {
        return `${extractSiteName(url)} - 软件下载和资源获取`
      }
      if (path.includes('/dashboard') || path.includes('/console') || path.includes('/admin')) {
        return `${extractSiteName(url)} - 管理控制台`
      }
      if (path.includes('/game') || path.includes('/play')) {
        return `${extractSiteName(url)} - 在线游戏平台`
      }
      if (path.includes('/search') || path.includes('/explore')) {
        return `${extractSiteName(url)} - 搜索和发现平台`
      }
      if (path.includes('/login') || path.includes('/register') || path.includes('/auth')) {
        return `${extractSiteName(url)} - 用户登录注册`
      }

      // 基于域名特征生成描述
      if (domain.includes('github.io') || domain.includes('gitlab.io') || domain.includes('pages.dev')) {
        return '项目主页和技术文档'
      }
      if (domain.includes('npm') || domain.includes('pypi') || domain.includes('maven') || domain.includes('packagist')) {
        return '软件包和依赖库'
      }
      if (domain.includes('stackoverflow') || domain.includes('stackexchange')) {
        return '编程问答和技术讨论'
      }
      if (domain.includes('youtube') || domain.includes('youtu.be')) {
        return '视频内容和教程'
      }
      if (domain.includes('medium') || domain.includes('substack') || domain.includes('hashnode')) {
        return '技术博客和文章分享'
      }
      if (domain.includes('discord') || domain.includes('slack') || domain.includes('telegram')) {
        return '社区交流和即时通讯'
      }
      if (domain.includes('figma') || domain.includes('sketch') || domain.includes('canva')) {
        return '设计工具和创作平台'
      }
      if (domain.includes('notion') || domain.includes('obsidian') || domain.includes('roam')) {
        return '笔记管理和知识组织'
      }
      if (domain.includes('vercel') || domain.includes('netlify') || domain.includes('heroku')) {
        return '云服务和应用部署'
      }
      if (domain.includes('ai') || domain.includes('openai') || domain.includes('anthropic')) {
        return 'AI工具和人工智能服务'
      }

      // 特定知名网站识别
      if (domain.includes('google.com')) {
        return 'Google - 全球领先的搜索引擎和互联网服务'
      }
      if (domain.includes('vercel.com') || domain.includes('v0.dev')) {
        return '前端开发和部署平台'
      }
      if (domain.includes('cloudflare.com')) {
        return '云服务和网络安全平台'
      }
      if (domain.includes('grok.com')) {
        return 'AI对话和智能助手服务'
      }
      if (domain.includes('spaceship.com')) {
        return '域名注册和网站建设服务'
      }

      // 默认描述
      return `${extractSiteName(url)} - 网站链接`
    } catch (error) {
      return '网站链接'
    }
  }

  /**
   * 使用API获取详细元数据（仅用于单个书签添加）
   */
  // 注意：外部 API 调用已禁用，保留方法仅为向后兼容；如需启用可按域白名单判断
  private async fetchDetailedMetadata(url: string): Promise<BookmarkMetadata | null> {
    try {
      // 使用快速的元数据API
      const response = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}&fields=title,description,image`, {
        signal: this.abortController?.signal,
        headers: {
          'Accept': 'application/json',
        }
      })

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status}`)
      }

      const result = await response.json()
      const data = result.data

      if (data && (data.title || data.description)) {
        return {
          id: '',
          title: data.title || undefined,
          description: data.description || undefined,
          favicon: getFaviconUrl(url),
          enhanced: true,
          lastUpdated: new Date()
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        throw error
      }
      logger.warn(`Failed to fetch metadata for ${url}:`, error)
    }

    return null
  }

  /**
   * 增强单个书签的元数据（公共接口，用于单个书签添加）
   */
  async enhanceSingleBookmark(
    bookmark: { id: string, url: string, title: string, description?: string },
    options: { seed?: Partial<BookmarkMetadata> } = {}
  ): Promise<BookmarkMetadata | null> {
    return this.enhanceBookmark(bookmark, { isBatchImport: false, seed: options.seed })
  }

  /**
   * 增强单个书签的元数据（内部方法）
   */
  private async enhanceBookmark(
    bookmark: { id: string, url: string, title: string, description?: string },
    options: { isBatchImport?: boolean; seed?: Partial<BookmarkMetadata>; preserveOriginal?: boolean } = {}
  ): Promise<BookmarkMetadata | null> {
    logger.debug(`🔄 开始增强书签: ${bookmark.title} (${bookmark.url})`)
    logger.debug(`   当前描述长度: ${bookmark.description?.length || 0}`)
    logger.debug(`   模式: ${options.isBatchImport ? '批量导入' : '单个添加'}`)
    logger.debug(`   保留原始内容: ${options.preserveOriginal ? '是' : '否'}`)

    // 🔧 如果是导入书签且已有标题和描述，优先保留原始内容
    if (options.preserveOriginal && bookmark.title && bookmark.description && bookmark.description.length > 0) {
      logger.debug(`✅ 保留导入书签的原始标题和描述: ${bookmark.title}`)
      return {
        id: bookmark.id,
        title: bookmark.title,
        description: bookmark.description,
        favicon: getFaviconUrl(bookmark.url),
        coverImage: `/api/screenshot?url=${encodeURIComponent(bookmark.url)}`,
        enhanced: true,
        lastUpdated: new Date()
      }
    }

    // 🔧 修复：只有在批量导入时才检查描述长度，单个添加时强制增强以获取真实标题和描述
    if (options.isBatchImport && bookmark.description && bookmark.description.length >= 20) {
      logger.debug(`⏭️ 跳过书签 ${bookmark.title}：描述已足够详细（批量导入模式）`)
      return null
    }

    // 1. 如果前端提供了种子元数据（seed），优先合并使用，避免重复请求
    const seed = options.seed || {}

    // 1.1 预置数据库（仅用于补充缺失字段）
    const presetData = this.getPresetDescription(bookmark.url)
    if (presetData) {
      const isFallbackCover = !presetData.coverImage || presetData.coverImage.startsWith('/api/screenshot')
      // 如果是批量导入的慢速阶段（isBatchImport=false），且预置封面只是占位图，则继续尝试抓取 og:image
      if (!options.isBatchImport && isFallbackCover) {
        logger.debug(`✅ 预置可用，但封面为占位图，继续尝试抓取 og:image: ${bookmark.title}`)
        // 不立即返回，向下走 fetch-meta 逻辑；把预置当作种子
      } else {
        logger.debug(`✅ 使用预置描述增强书签: ${bookmark.title}`)

        // 🔧 如果是导入书签且要求保留原始内容，只补充缺失的字段
        if (options.preserveOriginal) {
          return {
            id: bookmark.id,
            title: bookmark.title || presetData.title, // 优先使用原始标题
            description: bookmark.description || presetData.description, // 优先使用原始描述
            favicon: presetData.favicon || getFaviconUrl(bookmark.url),
            coverImage: presetData.coverImage || `/api/screenshot?url=${encodeURIComponent(bookmark.url)}`,
            enhanced: true,
            lastUpdated: new Date()
          }
        } else {
          return {
            ...presetData,
            ...seed,
            id: bookmark.id
          }
        }
      }
    }

    // 2. 生成智能描述
    const smartDescription = this.generateSmartDescription(bookmark.url)

    // 3. 尝试获取详细元数据（适度使用API）
    const domain = extractSiteName(bookmark.url).toLowerCase()
    const shouldFetchDetailed = !['github', 'google', 'youtube', 'twitter', 'facebook'].some(known => domain.includes(known))

    if (shouldFetchDetailed && !options.isBatchImport) {
      // 单个书签添加：优先使用种子数据，避免重复网络请求
      if (seed.title || seed.description || seed.coverImage) {
        return {
          id: bookmark.id,
          title: seed.title || bookmark.title,
          description: seed.description || smartDescription,
          favicon: getFaviconUrl(bookmark.url),
          coverImage: seed.coverImage || this.generateCoverImage(bookmark.url),
          enhanced: true,
          lastUpdated: new Date()
        }
      }

      // 若没有种子数据，再调用本地 fetch-meta API（使用去重）
      try {
        const { fetchMetadataDeduped } = await import('./request-deduplicator')
        const data = await fetchMetadataDeduped(bookmark.url)
        if (data?.title || data?.description || data?.coverImage) {
          // 🔧 如果是导入书签且要求保留原始内容，优先使用原始标题和描述
          if (options.preserveOriginal) {
            return {
              id: bookmark.id,
              title: bookmark.title || data.title, // 优先使用原始标题
              description: bookmark.description || data.description || smartDescription, // 优先使用原始描述
              favicon: getFaviconUrl(bookmark.url),
              coverImage: data.coverImage || this.generateCoverImage(bookmark.url),
              enhanced: true,
              lastUpdated: new Date()
            }
          } else {
            return {
              id: bookmark.id,
              title: data.title || bookmark.title,
              description: data.description || smartDescription,
              favicon: getFaviconUrl(bookmark.url),
              coverImage: data.coverImage || this.generateCoverImage(bookmark.url),
              enhanced: true,
              lastUpdated: new Date()
            }
          }
        }
      } catch (err) {
        if (err instanceof Error && err.name === 'AbortError') throw err
        logger.debug('fetch-meta unavailable or failed; skip external API and fallback to local generation.', err)
      }
      // 不再退回外部API，保持本地生成，避免 400/429 噪音与外部依赖
    } else if (options.isBatchImport) {
      // 批量导入时，跳过API调用以避免429错误，但仍然生成智能描述
      logger.debug('ℹ️ 批量导入模式，使用智能生成描述以确保稳定性')
    }

    // 4. 返回智能生成的描述
    logger.debug(`🧠 使用智能生成描述增强书签: ${bookmark.title}`)
    logger.debug(`   生成的描述: ${smartDescription}`)

    // 尝试生成通用封面图片
    const coverImage = this.generateCoverImage(bookmark.url)

    return {
      id: bookmark.id,
      description: smartDescription,
      favicon: getFaviconUrl(bookmark.url),
      coverImage: coverImage,
      enhanced: true,
      lastUpdated: new Date()
    }
  }

  /**
   * 将书签分类为预置和未知两类
   */
  private categorizeBookmarks(bookmarks: Array<{ id: string, url: string, title: string, description?: string }>) {
    const presetBookmarks: typeof bookmarks = []
    const unknownBookmarks: typeof bookmarks = []

    for (const bookmark of bookmarks) {
      try {
        const u = new URL(bookmark.url)
        const domain = u.hostname.replace(/^www\./, '')
        const preset = (websiteDescriptions as any)[domain]

        // 文章类页面（如 CSDN /article/details/ 等）视为未知，需走详细提取流程
        if (preset && !this.isArticleUrl(u)) {
          presetBookmarks.push(bookmark)
        } else {
          unknownBookmarks.push(bookmark)
        }
      } catch (error) {
        unknownBookmarks.push(bookmark)
      }
    }

    return { presetBookmarks, unknownBookmarks }
  }

  /**
   * 快速处理预置书签批次
   */
  private async processFastBatch(
    bookmarks: Array<{ id: string, url: string, title: string, description?: string }>,
    options: {
      onProgress: (completed: number) => void
      onUpdate?: (bookmarkId: string, metadata: BookmarkMetadata) => void
      batchSize: number
      preserveOriginal?: boolean // 🔧 新增：是否保留原始内容
    }
  ) {
    const { onProgress, onUpdate, batchSize, preserveOriginal } = options
    let completed = 0

    // 预置书签可以同步处理，无需延迟
    for (let i = 0; i < bookmarks.length; i += batchSize) {
      if (this.abortController?.signal.aborted) break

      const batch = bookmarks.slice(i, i + batchSize)

      // 同步处理预置书签（无网络请求）
      for (const bookmark of batch) {
        try {
          const metadata = this.getPresetDescription(bookmark.url)
          if (metadata && onUpdate) {
            // 🔧 如果要求保留原始内容，优先使用原始标题和描述
            if (preserveOriginal) {
              const preservedMetadata = {
                ...metadata,
                id: bookmark.id,
                title: bookmark.title || metadata.title, // 优先使用原始标题
                description: bookmark.description || metadata.description // 优先使用原始描述
              }
              onUpdate(bookmark.id, preservedMetadata)
            } else {
              onUpdate(bookmark.id, { ...metadata, id: bookmark.id })
            }
          }
          completed++
        } catch (error) {
          logger.warn(`Failed to process preset bookmark ${bookmark.id}:`, error)
          completed++
        }
      }

      onProgress(batch.length)
    }
  }

  /**
   * 处理需要API调用的书签批次
   */
  private async processSlowBatch(
    bookmarks: Array<{ id: string, url: string, title: string, description?: string }>,
    options: {
      onProgress: (completed: number) => void
      onUpdate?: (bookmarkId: string, metadata: BookmarkMetadata) => void
      batchSize: number
      delay: number
      preserveOriginal?: boolean // 🔧 新增：是否保留原始内容
    }
  ) {
    const { onProgress, onUpdate, batchSize, delay, preserveOriginal } = options

    for (let i = 0; i < bookmarks.length; i += batchSize) {
      if (this.abortController?.signal.aborted) break

      const batch = bookmarks.slice(i, i + batchSize)

      // 并发处理当前批次 - 允许API调用获取详细信息
      const promises = batch.map(async (bookmark) => {
        try {
          const metadata = await this.enhanceBookmark(bookmark, {
            isBatchImport: false,
            preserveOriginal // 🔧 传递保留原始内容的参数
          })
          if (metadata && onUpdate) {
            onUpdate(bookmark.id, metadata)
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error
          }
          logger.warn(`Failed to enhance bookmark ${bookmark.id}:`, error)
        }
      })

      await Promise.all(promises)
      onProgress(batch.length)

      // 只在API调用批次间添加延迟
      if (i + batchSize < bookmarks.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  /**
   * 传统批处理模式
   */
  private async processTraditionalBatch(
    bookmarks: Array<{ id: string, url: string, title: string, description?: string }>,
    options: {
      onProgress: (completed: number) => void
      onUpdate?: (bookmarkId: string, metadata: BookmarkMetadata) => void
      batchSize: number
      delay: number
    }
  ) {
    const { onProgress, onUpdate, batchSize, delay } = options

    for (let i = 0; i < bookmarks.length; i += batchSize) {
      if (this.abortController?.signal.aborted) break

      const batch = bookmarks.slice(i, i + batchSize)

      const promises = batch.map(async (bookmark) => {
        try {
          const metadata = await this.enhanceBookmark(bookmark, { isBatchImport: true })
          if (metadata && onUpdate) {
            onUpdate(bookmark.id, metadata)
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error
          }
          logger.warn(`Failed to enhance bookmark ${bookmark.id}:`, error)
        }
      })

      await Promise.all(promises)
      onProgress(batch.length)

      if (i + batchSize < bookmarks.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  /**
   * 批量增强书签元数据 - 简化版本
   */
  async enhanceBookmarks(
    bookmarks: Array<{ id: string, url: string, title: string, description?: string }>,
    options: {
      onProgress?: (progress: EnhancementProgress) => void
      onUpdate?: (bookmarkId: string, metadata: BookmarkMetadata) => void
      preserveOriginal?: boolean // 🔧 新增：是否保留导入书签的原始标题和描述
    } = {}
  ): Promise<void> {
    if (this.isRunning) {
      throw new Error('Enhancement already in progress')
    }

    const { onProgress, onUpdate } = options

    // 简化配置
    const { presetBookmarks, unknownBookmarks } = this.categorizeBookmarks(bookmarks)
    const config = {
      batchSize: 15,
      delay: 100,
      fastMode: true,
      presetBatchSize: 40,
      unknownBatchSize: 8
    }

    this.isRunning = true
    this.abortController = new AbortController()

    const total = bookmarks.length
    let completed = 0

    try {

      logger.debug(`🚀 开始批量增强 ${total} 个书签`)
      logger.debug(`📊 配置信息:`, {
        预置书签: presetBookmarks.length,
        未知书签: unknownBookmarks.length,
        批次大小: config.batchSize,
        延迟: config.delay + 'ms',
        快速模式: config.fastMode
      })

      // 报告开始状态
      onProgress?.({
        total,
        completed: 0,
        status: 'running'
      })

      // 快速模式：优先处理预置数据库中的书签
      if (config.fastMode) {
        logger.debug(`📊 分类结果: ${presetBookmarks.length} 个预置书签, ${unknownBookmarks.length} 个未知书签`)

        // 第一阶段：快速处理预置书签（无延迟，大批次）
        if (presetBookmarks.length > 0) {
          logger.debug(`⚡ 快速处理 ${presetBookmarks.length} 个预置书签...`)
          await this.processFastBatch(presetBookmarks, {
            onProgress: (batchCompleted) => {
              completed += batchCompleted
              onProgress?.({
                total,
                completed,
                current: `快速处理预置书签 (${completed}/${total})`,
                status: 'running'
              })
            },
            onUpdate,
            batchSize: config.presetBatchSize,
            preserveOriginal: options.preserveOriginal // 🔧 传递保留原始内容的参数
          })
        }

        // 第二阶段：处理未知书签（需要API调用） + 预置但缺少封面的书签
        if (!this.abortController?.signal.aborted) {
          // 找出预置但缺少封面的书签，加入慢速批次以尝试抓取 og:image
          const presetNeedingCover = presetBookmarks.filter((b) => {
            try {
              const u = new URL(b.url)
              const domain = u.hostname.replace(/^www\./, '')
              const preset = (websiteDescriptions as any)[domain]
              const cover: string | undefined = preset?.coverImage
              const isFavicon = !!cover && (/\.ico(\?|$)/i.test(cover) || cover.toLowerCase().includes('favicon') || /icon-\d+x\d+/i.test(cover) || cover.toLowerCase().includes('apple-touch-icon'))
              return !cover || isFavicon
            } catch {
              return true
            }
          })

          const slowList = [...unknownBookmarks, ...presetNeedingCover]
            .filter((b, idx, arr) => arr.findIndex(x => x.id === b.id) === idx)

          if (slowList.length > 0) {
            logger.debug(`🌐 处理 ${slowList.length} 个需要抓取的书签（未知 + 预置缺封面）...`)
            await this.processSlowBatch(slowList, {
              onProgress: (batchCompleted) => {
                completed += batchCompleted
                onProgress?.({
                  total,
                  completed,
                  current: `处理未知/缺封面书签 (${completed}/${total})`,
                  status: 'running'
                })
              },
              onUpdate,
              batchSize: config.unknownBatchSize,
              delay: config.delay,
              preserveOriginal: options.preserveOriginal // 🔧 传递保留原始内容的参数
            })
          }
        }
      } else {
        // 传统模式：统一处理
        await this.processTraditionalBatch(bookmarks, {
          onProgress: (batchCompleted) => {
            completed += batchCompleted
            onProgress?.({
              total,
              completed,
              current: `处理书签 (${completed}/${total})`,
              status: 'running'
            })
          },
          onUpdate,
          batchSize: config.batchSize,
          delay: config.delay
        })
      }

      // 报告完成状态
      onProgress?.({
        total,
        completed,
        status: 'completed'
      })

    } catch (error) {
      if (error instanceof Error && error.name === 'AbortError') {
        onProgress?.({
          total: bookmarks.length,
          completed,
          status: 'idle'
        })
      } else {
        logger.error('Enhancement failed:', error)
        onProgress?.({
          total: bookmarks.length,
          completed,
          status: 'error'
        })
      }
    } finally {
      this.isRunning = false
      this.abortController = undefined
    }
  }

  /**
   * 停止增强过程
   */
  stop(): void {
    if (this.abortController) {
      this.abortController.abort()
    }
  }

  /**
   * 检查是否正在运行
   */
  get running(): boolean {
    return this.isRunning
  }

  /**
   * 获取预置数据库的统计信息
   */
  getPresetStats(): { totalSites: number, categories: string[] } {
    const sites = Object.values(websiteDescriptions as any)
    const categories = [...new Set(sites.map((site: any) => site.category))]

    return {
      totalSites: sites.length,
      categories
    }
  }

  /**
   * 刷新单个书签的封面图
   */
  async refreshBookmarkCoverImage(bookmark: { id: string, url: string, title: string, description?: string }): Promise<string | null> {
    try {
      logger.debug(`🖼️ 开始刷新书签封面图: ${bookmark.title}`)

      // 强制重新生成封面图，不使用缓存
      const newCoverImage = this.generateCoverImage(bookmark.url)

      if (newCoverImage) {
        logger.debug(`✅ 成功生成新的封面图: ${newCoverImage}`)
        return newCoverImage
      }

      return null
    } catch (error) {
      logger.warn(`❌ 刷新封面图失败: ${bookmark.title}`, error)
      return null
    }
  }
}

// 导出单例实例
export const backgroundEnhancer = new BackgroundMetadataEnhancer()
export default backgroundEnhancer
