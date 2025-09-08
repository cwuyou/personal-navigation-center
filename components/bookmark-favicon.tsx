"use client"

import { useMemo } from "react"
import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { getFaviconUrl } from "@/lib/metadata-fetcher"
import { CachedImage } from "./cached-image"

interface BookmarkFaviconProps {
  bookmark: {
    favicon?: string
    url: string
    title: string
  }
  size?: "sm" | "md" | "lg"
  className?: string
}

export function BookmarkFavicon({ bookmark, size = "md", className }: BookmarkFaviconProps) {
  // 缓存图标URL，避免每次渲染都重新计算
  const { primarySrc, fallbackSrc } = useMemo(() => {
    const primary = bookmark.favicon 
      ? `/api/proxy-image?url=${encodeURIComponent(bookmark.favicon)}`
      : null
    
    const fallback = getFaviconUrl(bookmark.url)
    
    return {
      primarySrc: primary,
      fallbackSrc: fallback || undefined
    }
  }, [bookmark.favicon, bookmark.url])

  // 根据尺寸设置样式
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-6 h-6", 
    lg: "w-8 h-8"
  }

  const iconSizes = {
    sm: "w-2 h-2",
    md: "w-3 h-3",
    lg: "w-4 h-4"
  }

  const finalSrc = primarySrc || fallbackSrc

  // 占位符组件
  const placeholder = (
    <div className={cn(
      "rounded-sm bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center shadow-sm",
      sizeClasses[size]
    )}>
      <Globe className={cn("text-muted-foreground", iconSizes[size])} />
    </div>
  )

  if (!finalSrc) {
    return <div className={className}>{placeholder}</div>
  }

  return (
    <div className={className}>
      <CachedImage
        src={finalSrc}
        fallbackSrc={fallbackSrc}
        alt={`${bookmark.title} favicon`}
        className={cn(
          "rounded-sm shadow-sm object-cover",
          sizeClasses[size]
        )}
        placeholder={placeholder}
        loading="lazy"
      />
    </div>
  )
}
