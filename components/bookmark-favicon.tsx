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
    // 添加URL验证，避免无效URL导致的问题
    try {
      const primary = bookmark.favicon
        ? `/api/proxy-image?url=${encodeURIComponent(bookmark.favicon)}`
        : null

      // 暂时禁用fallback，避免循环问题
      // const fallbackUrl = getFaviconUrl(bookmark.url)
      // const fallback = fallbackUrl || undefined

      return {
        primarySrc: primary,
        fallbackSrc: undefined // 暂时禁用fallback
      }
    } catch (error) {
      // 如果URL处理失败，返回安全的默认值
      return {
        primarySrc: null,
        fallbackSrc: undefined
      }
    }
  }, [bookmark.favicon, bookmark.url])

  // 稳定的占位符，避免每次渲染都创建新对象
  const placeholder = useMemo(() => (
    <div className={cn(
      "rounded-sm bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center shadow-sm",
      {
        "w-4 h-4": size === "sm",
        "w-6 h-6": size === "md",
        "w-8 h-8": size === "lg"
      }
    )}>
      <Globe className={cn("text-muted-foreground", {
        "w-2 h-2": size === "sm",
        "w-3 h-3": size === "md",
        "w-4 h-4": size === "lg"
      })} />
    </div>
  ), [size])

  const finalSrc = primarySrc || fallbackSrc

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
          {
            "w-4 h-4": size === "sm",
            "w-6 h-6": size === "md",
            "w-8 h-8": size === "lg"
          }
        )}
        placeholder={placeholder}
        loading="lazy"
      />
    </div>
  )
}
