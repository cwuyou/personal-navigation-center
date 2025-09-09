"use client"

import React, { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"

interface CachedImageProps {
  src?: string
  fallbackSrc?: string
  alt: string
  className?: string
  loading?: "lazy" | "eager"
  onLoad?: () => void
  onError?: () => void
  placeholder?: React.ReactNode
}

// 简单的内存缓存，避免重复请求
const imageCache = new Map<string, { status: 'loading' | 'loaded' | 'error', url?: string }>()

export function CachedImage({
  src,
  fallbackSrc,
  alt,
  className,
  loading = "lazy",
  onLoad,
  onError,
  placeholder
}: CachedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [currentSrc, setCurrentSrc] = useState<string | undefined>(src)
  const [usedFallback, setUsedFallback] = useState(false)
  const [isInitialLoad, setIsInitialLoad] = useState(true)
  const [retryCount, setRetryCount] = useState(0)
  const maxRetries = 1 // 最多重试1次，避免无限循环

  // 缓存图片URL，避免每次渲染都重新生成
  const finalSrc = useMemo(() => {
    if (!src) return fallbackSrc

    // 检查缓存
    const cached = imageCache.get(src)
    if (cached?.status === 'error' && fallbackSrc && !usedFallback) {
      return fallbackSrc
    }
    if (cached?.status === 'loaded') {
      return src
    }

    return src
  }, [src, fallbackSrc, usedFallback])

  const handleImageLoad = () => {
    if (currentSrc) {
      imageCache.set(currentSrc, { status: 'loaded', url: currentSrc })
    }
    setImageLoaded(true)
    setImageError(false)
    setIsInitialLoad(false)
    onLoad?.()
  }

  const handleImageError = () => {
    if (currentSrc) {
      imageCache.set(currentSrc, { status: 'error' })
    }

    // 防止无限重试 - 更严格的限制
    if (retryCount >= maxRetries) {
      setImageError(true)
      setIsInitialLoad(false)
      onError?.()
      return
    }

    // 如果主图片失败且有fallback且还没用过fallback，尝试fallback
    if (currentSrc === src && fallbackSrc && !usedFallback && retryCount < maxRetries) {
      setUsedFallback(true)
      setCurrentSrc(fallbackSrc)
      setImageError(false)
      setImageLoaded(false)
      setRetryCount(prev => prev + 1)
      return
    }

    // 所有重试都失败了
    setImageError(true)
    setIsInitialLoad(false)
    onError?.()
  }

  // 当src改变时重置状态 - 避免无限循环
  React.useEffect(() => {
    setCurrentSrc(src)
    setUsedFallback(false)
    setImageError(false)
    setImageLoaded(false)
    setIsInitialLoad(true)
    setRetryCount(0) // 重置重试计数
  }, [src]) // 只依赖src，避免currentSrc导致的循环

  // 如果没有图片源，显示占位符
  if (!finalSrc) {
    return <div className={className}>{placeholder}</div>
  }

  return (
    <div className="relative">
      <img
        src={currentSrc || finalSrc}
        alt={alt}
        className={cn(className, !imageLoaded && "opacity-0")}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          transition: 'opacity 0.3s ease-in-out'
        }}
      />
      {/* 只在初始加载或真正的错误状态时显示占位符 */}
      {((isInitialLoad && !imageLoaded) || (imageError && !usedFallback)) && (
        <div className={cn(className, "absolute inset-0 bg-muted/20 flex items-center justify-center")}>
          {placeholder}
        </div>
      )}
    </div>
  )
}

// 预加载图片的工具函数
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 检查缓存
    const cached = imageCache.get(src)
    if (cached?.status === 'loaded') {
      resolve()
      return
    }
    if (cached?.status === 'error') {
      reject(new Error('Image failed to load'))
      return
    }

    // 标记为加载中
    imageCache.set(src, { status: 'loading' })

    const img = new Image()
    img.onload = () => {
      imageCache.set(src, { status: 'loaded', url: src })
      resolve()
    }
    img.onerror = () => {
      imageCache.set(src, { status: 'error' })
      reject(new Error('Image failed to load'))
    }
    img.src = src
  })
}

// 清理缓存的工具函数
export const clearImageCache = () => {
  imageCache.clear()
}
