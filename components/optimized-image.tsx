'use client'

import Image from 'next/image'
import { useState, useEffect } from 'react'

interface OptimizedImageProps {
  src: string
  alt: string
  width?: number
  height?: number
  className?: string
  priority?: boolean
  placeholder?: 'blur' | 'empty'
  blurDataURL?: string
  sizes?: string
  quality?: number
  loading?: 'lazy' | 'eager'
  onLoad?: () => void
  onError?: () => void
}

export function OptimizedImage({
  src,
  alt,
  width = 400,
  height = 300,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes = '(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw',
  quality = 85,
  loading = 'lazy',
  onLoad,
  onError
}: OptimizedImageProps) {
  const [imageError, setImageError] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  
  // 🔧 生成默认的blur placeholder
  const defaultBlurDataURL = blurDataURL || generateBlurDataURL(width, height)
  
  // 🔧 处理图片加载错误
  const handleError = () => {
    setImageError(true)
    setIsLoading(false)
    onError?.()
  }
  
  // 🔧 处理图片加载完成
  const handleLoad = () => {
    setIsLoading(false)
    onLoad?.()
  }
  
  // 🔧 如果图片加载失败，显示占位符
  if (imageError) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-100 text-gray-400 ${className}`}
        style={{ width, height }}
      >
        <svg 
          className="w-12 h-12" 
          fill="currentColor" 
          viewBox="0 0 20 20"
        >
          <path 
            fillRule="evenodd" 
            d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" 
            clipRule="evenodd" 
          />
        </svg>
      </div>
    )
  }
  
  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* 🔧 加载状态指示器 */}
      {isLoading && (
        <div 
          className="absolute inset-0 bg-gray-100 animate-pulse flex items-center justify-center"
          style={{ width, height }}
        >
          <div className="w-8 h-8 border-2 border-gray-300 border-t-blue-500 rounded-full animate-spin" />
        </div>
      )}
      
      <Image
        src={src}
        alt={alt}
        width={width}
        height={height}
        className={`transition-opacity duration-300 ${isLoading ? 'opacity-0' : 'opacity-100'}`}
        priority={priority}
        placeholder={placeholder}
        blurDataURL={defaultBlurDataURL}
        sizes={sizes}
        quality={quality}
        loading={loading}
        onLoad={handleLoad}
        onError={handleError}
        // 🔧 SEO优化属性
        decoding="async"
        fetchPriority={priority ? 'high' : 'auto'}
      />
    </div>
  )
}

// 🔧 生成blur placeholder的工具函数
function generateBlurDataURL(width: number, height: number): string {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  
  const ctx = canvas.getContext('2d')
  if (!ctx) return ''
  
  // 创建渐变背景
  const gradient = ctx.createLinearGradient(0, 0, width, height)
  gradient.addColorStop(0, '#f3f4f6')
  gradient.addColorStop(1, '#e5e7eb')
  
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)
  
  return canvas.toDataURL('image/jpeg', 0.1)
}

// 🔧 响应式图片组件
export function ResponsiveImage({
  src,
  alt,
  aspectRatio = '16/9',
  className = '',
  priority = false,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & {
  aspectRatio?: string
}) {
  return (
    <div 
      className={`relative w-full ${className}`}
      style={{ aspectRatio }}
    >
      <OptimizedImage
        src={src}
        alt={alt}
        width={1200}
        height={Math.round(1200 / parseAspectRatio(aspectRatio))}
        className="absolute inset-0 w-full h-full object-cover"
        priority={priority}
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        {...props}
      />
    </div>
  )
}

// 🔧 解析宽高比
function parseAspectRatio(ratio: string): number {
  const [width, height] = ratio.split('/').map(Number)
  return width / height
}

// 🔧 头像图片组件
export function AvatarImage({
  src,
  alt,
  size = 40,
  className = '',
  fallback,
  ...props
}: Omit<OptimizedImageProps, 'width' | 'height'> & {
  size?: number
  fallback?: string
}) {
  const [error, setError] = useState(false)
  
  if (error || !src) {
    return (
      <div 
        className={`flex items-center justify-center bg-gray-200 text-gray-500 rounded-full ${className}`}
        style={{ width: size, height: size }}
      >
        {fallback || alt.charAt(0).toUpperCase()}
      </div>
    )
  }
  
  return (
    <OptimizedImage
      src={src}
      alt={alt}
      width={size}
      height={size}
      className={`rounded-full ${className}`}
      onError={() => setError(true)}
      {...props}
    />
  )
}

// 🔧 图片预加载Hook
export function useImagePreload(src: string) {
  const [loaded, setLoaded] = useState(false)
  const [error, setError] = useState(false)
  
  useEffect(() => {
    if (!src) return
    
    const img = new window.Image()
    img.onload = () => setLoaded(true)
    img.onerror = () => setError(true)
    img.src = src
    
    return () => {
      img.onload = null
      img.onerror = null
    }
  }, [src])
  
  return { loaded, error }
}
