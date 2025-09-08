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
  // 缓存封面图URL
  const coverImageSrc = useMemo(() => {
    return bookmark.coverImage
  }, [bookmark.coverImage])

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
        alt={bookmark.title}
        className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
        placeholder={placeholder}
        loading="lazy"
        onError={() => {
          // 封面图加载失败时的处理
          console.log(`封面图加载失败: ${bookmark.title}`)
        }}
      />
    </div>
  )
}
