"use client"

import { useState, useEffect, useMemo } from "react"
import { cn } from "@/lib/utils"

interface CachedImageProps {
  src?: string
  fallbackSrc?: string
  alt: string
  className?: string
  loading?: "lazy" | "eager"
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
  onError,
  placeholder 
}: CachedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)

  // 缓存图片URL，避免每次渲染都重新生成
  const finalSrc = useMemo(() => {
    if (!src) return fallbackSrc
    
    // 检查缓存
    const cached = imageCache.get(src)
    if (cached?.status === 'error') {
      return fallbackSrc
    }
    if (cached?.status === 'loaded') {
      return src
    }
    
    return src
  }, [src, fallbackSrc])

  const handleImageLoad = () => {
    if (src) {
      imageCache.set(src, { status: 'loaded', url: src })
    }
    setImageLoaded(true)
  }

  const handleImageError = () => {
    if (src) {
      imageCache.set(src, { status: 'error' })
    }
    setImageError(true)
    onError?.()
  }

  // 如果没有图片源，显示占位符
  if (!finalSrc) {
    return <div className={className}>{placeholder}</div>
  }

  return (
    <>
      <img
        src={finalSrc}
        alt={alt}
        className={cn(className, !imageLoaded && "opacity-0")}
        loading={loading}
        onLoad={handleImageLoad}
        onError={handleImageError}
        style={{
          transition: 'opacity 0.2s ease-in-out'
        }}
      />
      {!imageLoaded && !imageError && (
        <div className={cn(className, "absolute inset-0 bg-muted/20 animate-pulse")}>
          {placeholder}
        </div>
      )}
      {imageError && fallbackSrc && finalSrc !== fallbackSrc && (
        <img
          src={fallbackSrc}
          alt={alt}
          className={className}
          loading={loading}
          onError={() => {
            // 最后的兜底，显示占位符
            setImageError(true)
          }}
        />
      )}
    </>
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
