/**
 * 后台元数据增强服务
 * 在书签导入后异步获取和更新描述信息
 */

import websiteDescriptions from '@/data/website-descriptions-1000plus.json'
import { getFaviconUrl, extractSiteName } from './metadata-fetcher'


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
      console.warn('Failed to parse URL:', url, error)
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
      const coverImageStrategies: Record<string, string> = {
        'youtube.com': `https://img.youtube.com/vi/${this.extractYouTubeVideoId(url)}/maxresdefault.jpg`,
        'github.com': 'https://github.githubassets.com/images/modules/site/social-cards/github-social.png',
        'twitter.com': 'https://abs.twimg.com/responsive-web/client-web/icon-ios.b1fc7275.png',
        'linkedin.com': 'https://static.licdn.com/sc/h/al2o9zrvru7aqj8e1x2rzsrca',
        'medium.com': 'https://miro.medium.com/max/1200/1*jfdwtvU6V6g99q3G7gq7dQ.png',
        // Popular AI assistants: use large touch icons as decent covers when og:image is unavailable
        'chatgpt.com': 'https://chatgpt.com/apple-touch-icon.png',
        'claude.ai': 'https://claude.ai/apple-touch-icon.png'
      }

      // 检查是否有特定策略
      for (const [siteDomain, imageUrl] of Object.entries(coverImageStrategies)) {
        if (domain.includes(siteDomain)) {
          return imageUrl
        }
      }

      // 🔧 修复：移除 microlink.io 截图API，使用本地截图服务
      return `/api/screenshot?url=${encodeURIComponent(url)}`

    } catch (error) {
      console.warn('Failed to generate cover image for:', url, error)
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
      const domain = urlObj.hostname.replace(/^www\./, '')
      const path = urlObj.pathname.toLowerCase()

      // 基于路径特征生成描述
      if (path.includes('/docs') || path.includes('/documentation')) {
        return `${extractSiteName(url)} - 技术文档和开发指南`
      }
      if (path.includes('/blog')) {
        return `${extractSiteName(url)} - 博客文章和技术见解`
      }
      if (path.includes('/api')) {
        return `${extractSiteName(url)} - API文档和接口说明`
      }
      if (path.includes('/tutorial') || path.includes('/guide')) {
        return `${extractSiteName(url)} - 教程和学习指南`
      }
      if (path.includes('/tool')) {
        return `${extractSiteName(url)} - 在线工具和实用服务`
      }
      if (path.includes('/download')) {
        return `${extractSiteName(url)} - 软件下载和资源获取`
      }

      // 基于域名特征生成描述
      if (domain.includes('github.io') || domain.includes('gitlab.io')) {
        return '项目主页和技术文档'
      }
      if (domain.includes('npm') || domain.includes('pypi') || domain.includes('maven')) {
        return '软件包和依赖库'
      }
      if (domain.includes('stackoverflow') || domain.includes('stackexchange')) {
        return '编程问答和技术讨论'
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
      console.warn(`Failed to fetch metadata for ${url}:`, error)
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
    options: { isBatchImport?: boolean; seed?: Partial<BookmarkMetadata> } = {}
  ): Promise<BookmarkMetadata | null> {
    console.log(`🔄 开始增强书签: ${bookmark.title} (${bookmark.url})`)
    console.log(`   当前描述长度: ${bookmark.description?.length || 0}`)
    console.log(`   模式: ${options.isBatchImport ? '批量导入' : '单个添加'}`)

    // 如果已有描述且足够详细，跳过
    if (bookmark.description && bookmark.description.length >= 20) {
      console.log(`⏭️ 跳过书签 ${bookmark.title}：描述已足够详细`)
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
        console.log(`✅ 预置可用，但封面为占位图，继续尝试抓取 og:image: ${bookmark.title}`)
        // 不立即返回，向下走 fetch-meta 逻辑；把预置当作种子
      } else {
        console.log(`✅ 使用预置描述增强书签: ${bookmark.title}`)
        return {
          ...presetData,
          ...seed,
          id: bookmark.id
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

      // 若没有种子数据，再调用本地 fetch-meta API
      try {
        const res = await fetch(`/api/fetch-meta?url=${encodeURIComponent(bookmark.url)}`, {
          signal: this.abortController?.signal,
          cache: 'no-store',
        })
        if (res.ok) {
          const data = await res.json()
          if (data?.title || data?.description || data?.coverImage) {
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
        console.log('fetch-meta unavailable or failed; skip external API and fallback to local generation.', err)
      }
      // 不再退回外部API，保持本地生成，避免 400/429 噪音与外部依赖
    } else if (options.isBatchImport) {
      // 批量导入时，跳过API调用以避免429错误，但仍然生成智能描述
      console.log('ℹ️ 批量导入模式，使用智能生成描述以确保稳定性')
    }

    // 4. 返回智能生成的描述
    console.log(`🧠 使用智能生成描述增强书签: ${bookmark.title}`)
    console.log(`   生成的描述: ${smartDescription}`)

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
    }
  ) {
    const { onProgress, onUpdate, batchSize } = options
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
            onUpdate(bookmark.id, { ...metadata, id: bookmark.id })
          }
          completed++
        } catch (error) {
          console.warn(`Failed to process preset bookmark ${bookmark.id}:`, error)
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
    }
  ) {
    const { onProgress, onUpdate, batchSize, delay } = options

    for (let i = 0; i < bookmarks.length; i += batchSize) {
      if (this.abortController?.signal.aborted) break

      const batch = bookmarks.slice(i, i + batchSize)

      // 并发处理当前批次 - 允许API调用获取详细信息
      const promises = batch.map(async (bookmark) => {
        try {
          const metadata = await this.enhanceBookmark(bookmark, { isBatchImport: false })
          if (metadata && onUpdate) {
            onUpdate(bookmark.id, metadata)
          }
        } catch (error) {
          if (error instanceof Error && error.name === 'AbortError') {
            throw error
          }
          console.warn(`Failed to enhance bookmark ${bookmark.id}:`, error)
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
          console.warn(`Failed to enhance bookmark ${bookmark.id}:`, error)
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

      console.log(`🚀 开始批量增强 ${total} 个书签`)
      console.log(`📊 配置信息:`, {
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
        console.log(`📊 分类结果: ${presetBookmarks.length} 个预置书签, ${unknownBookmarks.length} 个未知书签`)

        // 第一阶段：快速处理预置书签（无延迟，大批次）
        if (presetBookmarks.length > 0) {
          console.log(`⚡ 快速处理 ${presetBookmarks.length} 个预置书签...`)
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
            batchSize: config.presetBatchSize
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
            console.log(`🌐 处理 ${slowList.length} 个需要抓取的书签（未知 + 预置缺封面）...`)
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
              delay: config.delay
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
        console.error('Enhancement failed:', error)
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
}

// 导出单例实例
export const backgroundEnhancer = new BackgroundMetadataEnhancer()
export default backgroundEnhancer
