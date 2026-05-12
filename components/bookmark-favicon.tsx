"use client"

import { useMemo } from "react"
import { cn } from "@/lib/utils"
import { getFaviconUrl } from "@/lib/metadata-fetcher"
import { getLetterPlaceholder } from "@/lib/letter-placeholder"
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
    try {
      // bookmark.favicon 优先;为空时从 URL 现场派生一个走代理的 favicon。
      // 如果 favicon 已是同源代理路径,直接用,避免双重编码。
      let primary: string | null = null
      if (bookmark.favicon) {
        primary = bookmark.favicon.startsWith('/api/')
          ? bookmark.favicon
          : `/api/proxy-image?url=${encodeURIComponent(bookmark.favicon)}`
      } else {
        primary = getFaviconUrl(bookmark.url) || null
      }

      return {
        primarySrc: primary,
        fallbackSrc: undefined,
      }
    } catch (error) {
      return {
        primarySrc: null,
        fallbackSrc: undefined,
      }
    }
  }, [bookmark.favicon, bookmark.url])

  // 稳定的占位符:与服务端 /api/screenshot 的字母+纯色风格保持一致
  const placeholder = useMemo(() => {
    const { color, letter } = getLetterPlaceholder(bookmark.url)
    return (
      <div
        className={cn(
          "rounded-sm flex items-center justify-center shadow-sm text-white font-semibold select-none",
          {
            "w-4 h-4 text-[10px]": size === "sm",
            "w-6 h-6 text-sm": size === "md",
            "w-8 h-8 text-base": size === "lg",
          }
        )}
        style={{ backgroundColor: color }}
        aria-hidden="true"
      >
        {letter}
      </div>
    )
  }, [bookmark.url, size])

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
