"use client"

import { useEffect, useRef } from 'react'

interface ImagePreloaderOptions {
  enabled?: boolean
  maxConcurrent?: number
  priority?: 'high' | 'low'
}

// 全局图片预加载队列
class ImagePreloader {
  private queue: Set<string> = new Set()
  private loading: Set<string> = new Set()
  private loaded: Set<string> = new Set()
  private failed: Set<string> = new Set()
  private maxConcurrent: number = 3

  preload(urls: string[], options: ImagePreloaderOptions = {}) {
    const { maxConcurrent = 3, priority = 'low' } = options

    this.maxConcurrent = maxConcurrent

    // 过滤已加载或正在加载的图片
    const newUrls = urls.filter(url => 
      !this.loaded.has(url) && 
      !this.loading.has(url) && 
      !this.failed.has(url)
    )

    // 添加到队列
    newUrls.forEach(url => this.queue.add(url))

    // 开始处理队列
    this.processQueue(priority)
  }

  private async processQueue(priority: 'high' | 'low') {
    // 如果已达到最大并发数，等待
    if (this.loading.size >= this.maxConcurrent) {
      return
    }

    // 从队列中取出URL
    const url = this.queue.values().next().value
    if (!url) return

    this.queue.delete(url)
    this.loading.add(url)

    try {
      await this.loadImage(url, priority)
      this.loaded.add(url)
    } catch (error) {
      this.failed.add(url)
      console.warn(`图片预加载失败: ${url}`, error)
    } finally {
      this.loading.delete(url)
      
      // 继续处理队列
      if (this.queue.size > 0) {
        this.processQueue(priority)
      }
    }
  }

  private loadImage(url: string, priority: 'high' | 'low'): Promise<void> {
    return new Promise((resolve, reject) => {
      const img = new Image()
      
      // 设置优先级
      if ('fetchPriority' in img) {
        (img as any).fetchPriority = priority
      }

      img.onload = () => resolve()
      img.onerror = () => reject(new Error(`Failed to load image: ${url}`))
      
      // 延迟加载低优先级图片
      if (priority === 'low') {
        setTimeout(() => {
          img.src = url
        }, 100)
      } else {
        img.src = url
      }
    })
  }

  isLoaded(url: string): boolean {
    return this.loaded.has(url)
  }

  isFailed(url: string): boolean {
    return this.failed.has(url)
  }

  clear() {
    this.queue.clear()
    this.loading.clear()
    this.loaded.clear()
    this.failed.clear()
  }
}

// 全局实例
const globalPreloader = new ImagePreloader()

export function useImagePreloader(options: ImagePreloaderOptions = {}) {
  const { enabled = true } = options
  const preloadedUrls = useRef<Set<string>>(new Set())

  const preloadImages = (urls: string[]) => {
    if (!enabled) return

    // 过滤已预加载的URL
    const newUrls = urls.filter(url => !preloadedUrls.current.has(url))
    
    if (newUrls.length === 0) return

    // 记录已预加载的URL
    newUrls.forEach(url => preloadedUrls.current.add(url))

    // 开始预加载
    globalPreloader.preload(newUrls, options)
  }

  const isImageLoaded = (url: string): boolean => {
    return globalPreloader.isLoaded(url)
  }

  const isImageFailed = (url: string): boolean => {
    return globalPreloader.isFailed(url)
  }

  const clearCache = () => {
    globalPreloader.clear()
    preloadedUrls.current.clear()
  }

  return {
    preloadImages,
    isImageLoaded,
    isImageFailed,
    clearCache
  }
}

// 书签图片预加载Hook
export function useBookmarkImagePreloader() {
  const { preloadImages } = useImagePreloader({ 
    enabled: true, 
    maxConcurrent: 2, 
    priority: 'low' 
  })

  const preloadBookmarkImages = (bookmarks: Array<{ favicon?: string; coverImage?: string; url: string }>) => {
    const urls: string[] = []

    bookmarks.forEach(bookmark => {
      // 预加载favicon
      if (bookmark.favicon) {
        urls.push(`/api/proxy-image?url=${encodeURIComponent(bookmark.favicon)}`)
      }

      // 预加载封面图
      if (bookmark.coverImage && !bookmark.coverImage.includes('/api/screenshot')) {
        urls.push(bookmark.coverImage)
      }
    })

    if (urls.length > 0) {
      preloadImages(urls)
    }
  }

  return { preloadBookmarkImages }
}
