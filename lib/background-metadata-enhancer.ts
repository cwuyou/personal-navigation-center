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
      const domain = new URL(url).hostname.replace(/^www\./, '')
      const preset = (websiteDescriptions as any)[domain]

      console.log(`🔍 查找预置描述: ${domain}`)

      if (preset) {
        console.log(`✅ 找到预置描述: ${preset.title}`)
        console.log(`   封面图片: ${preset.coverImage ? '有' : '无'}`)
        return {
          id: '',
          title: preset.title,
          description: preset.description,
          favicon: getFaviconUrl(url),
          coverImage: preset.coverImage,  // 添加封面图片
          enhanced: true,
          lastUpdated: new Date()
        }
      } else {
        console.log(`❌ 未找到预置描述: ${domain}`)
      }
    } catch (error) {
      console.warn('Failed to parse URL:', url, error)
    }

    return null
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
        'medium.com': 'https://miro.medium.com/max/1200/1*jfdwtvU6V6g99q3G7gq7dQ.png'
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
  async enhanceSingleBookmark(bookmark: { id: string, url: string, title: string, description?: string }): Promise<BookmarkMetadata | null> {
    return this.enhanceBookmark(bookmark, { isBatchImport: false })
  }

  /**
   * 增强单个书签的元数据（内部方法）
   */
  private async enhanceBookmark(
    bookmark: { id: string, url: string, title: string, description?: string },
    options: { isBatchImport?: boolean } = {}
  ): Promise<BookmarkMetadata | null> {
    console.log(`🔄 开始增强书签: ${bookmark.title} (${bookmark.url})`)
    console.log(`   当前描述长度: ${bookmark.description?.length || 0}`)
    console.log(`   模式: ${options.isBatchImport ? '批量导入' : '单个添加'}`)

    // 如果已有描述且足够详细，跳过
    if (bookmark.description && bookmark.description.length >= 20) {
      console.log(`⏭️ 跳过书签 ${bookmark.title}：描述已足够详细`)
      return null
    }

    // 1. 首先尝试预置数据库
    const presetData = this.getPresetDescription(bookmark.url)
    if (presetData) {
      console.log(`✅ 使用预置描述增强书签: ${bookmark.title}`)
      return {
        ...presetData,
        id: bookmark.id
      }
    }

    // 2. 生成智能描述
    const smartDescription = this.generateSmartDescription(bookmark.url)

    // 3. 尝试获取详细元数据（适度使用API）
    const domain = extractSiteName(bookmark.url).toLowerCase()
    const shouldFetchDetailed = !['github', 'google', 'youtube', 'twitter', 'facebook'].some(known => domain.includes(known))

    if (shouldFetchDetailed && !options.isBatchImport) {
      // 单个书签添加时，可以调用API获取更详细信息
      console.log('🌐 单个书签添加，尝试获取详细元数据...')
      try {
        const detailedData = await this.fetchDetailedMetadata(bookmark.url)
        if (detailedData && detailedData.description && detailedData.description.length > smartDescription.length) {
          console.log(`✅ API获取成功，使用详细描述: ${detailedData.description.substring(0, 50)}...`)
          return {
            ...detailedData,
            id: bookmark.id,
            coverImage: this.generateCoverImage(bookmark.url)
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw error
        }
        console.warn('API获取失败，使用本地生成:', error)
        // API失败，继续使用智能描述
      }
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
        const domain = new URL(bookmark.url).hostname.replace(/^www\./, '')
        const preset = (websiteDescriptions as any)[domain]

        if (preset) {
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

        // 第二阶段：处理未知书签（需要API调用）
        if (unknownBookmarks.length > 0 && !this.abortController?.signal.aborted) {
          console.log(`🌐 处理 ${unknownBookmarks.length} 个未知书签...`)
          await this.processSlowBatch(unknownBookmarks, {
            onProgress: (batchCompleted) => {
              completed += batchCompleted
              onProgress?.({
                total,
                completed,
                current: `处理未知书签 (${completed}/${total})`,
                status: 'running'
              })
            },
            onUpdate,
            batchSize: config.unknownBatchSize,
            delay: config.delay
          })
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
