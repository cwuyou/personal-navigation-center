"use client"

import { useMemo } from "react"
import { Globe } from "lucide-react"
import { cn } from "@/lib/utils"
import { CachedImage } from "./cached-image"

interface BookmarkCoverProps {
  bookmark: {
    coverImage?: string
    title: string
    url: string
  }
  className?: string
  aspectRatio?: "video" | "square" | "wide"
}

export function BookmarkCover({ bookmark, className, aspectRatio = "video" }: BookmarkCoverProps) {
  // 处理封面图URL，确保通过代理访问 - 添加稳定性检查
  const { coverImageSrc, fallbackSrc } = useMemo(() => {
    if (!bookmark.coverImage) {
      return { coverImageSrc: null, fallbackSrc: null }
    }

    // 如果已经是代理URL或截图URL，直接使用
    if (bookmark.coverImage.includes('/api/proxy-image') ||
        bookmark.coverImage.includes('/api/screenshot')) {
      return {
        coverImageSrc: bookmark.coverImage,
        fallbackSrc: `/api/screenshot?url=${encodeURIComponent(bookmark.url)}&width=400&height=300`
      }
    }

    // 对于外部图片URL，通过代理访问
    const proxiedUrl = `/api/proxy-image?url=${encodeURIComponent(bookmark.coverImage)}`
    const screenshotUrl = `/api/screenshot?url=${encodeURIComponent(bookmark.url)}&width=400&height=300`

    return {
      coverImageSrc: proxiedUrl,
      fallbackSrc: screenshotUrl
    }
  }, [bookmark.coverImage, bookmark.url]) // 保持依赖简单，避免循环

  // 移除调试日志以避免循环问题

  // 根据宽高比设置样式
  const aspectClasses = {
    video: "aspect-video", // 16:9
    square: "aspect-square", // 1:1
    wide: "aspect-[21/9]" // 21:9 超宽屏
  }

  // 占位符组件
  const placeholder = (
    <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20">
      <Globe className="w-8 h-8 text-muted-foreground/40" />
    </div>
  )

  if (!coverImageSrc) {
    return (
      <div className={cn(
        "relative bg-gradient-to-br from-muted/30 to-muted/10",
        aspectClasses[aspectRatio],
        className
      )}>
        {placeholder}
      </div>
    )
  }

  return (
    <div className={cn(
      "relative bg-gradient-to-br from-muted/30 to-muted/10 overflow-hidden",
      aspectClasses[aspectRatio],
      className
    )}>
      <CachedImage
        src={coverImageSrc}
        fallbackSrc={fallbackSrc}
        alt={bookmark.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        placeholder={placeholder}
        loading="lazy"
        onLoad={() => {
          // 移除日志，避免控制台噪音
        }}
        onError={() => {
          // 移除日志，避免控制台噪音
        }}
      />
    </div>
  )
}
