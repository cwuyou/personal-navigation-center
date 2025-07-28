"use client"

import { useState, useEffect } from "react"
import { X, ExternalLink, RefreshCw, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { cn } from "@/lib/utils"

interface BookmarkPreviewProps {
  bookmark: {
    id: string
    title: string
    url: string
    description?: string
    favicon?: string
  } | null
  isOpen: boolean
  onClose: () => void
}

export function BookmarkPreview({ bookmark, isOpen, onClose }: BookmarkPreviewProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [hasError, setHasError] = useState(false)
  const [iframeKey, setIframeKey] = useState(0)
  const [useScreenshot, setUseScreenshot] = useState(false)

  useEffect(() => {
    if (bookmark && isOpen) {
      // 对于已知会阻止 iframe 的网站，直接使用截图预览
      if (isKnownBlockedSite(bookmark.url)) {
        setUseScreenshot(true)
        setHasError(false)
        setIsLoading(true)
        // 预加载截图
        const img = new Image()
        img.onload = () => setIsLoading(false)
        img.onerror = () => setIsLoading(false)
        img.src = `/api/screenshot?url=${encodeURIComponent(bookmark.url)}`
      } else {
        setIsLoading(true)
        setHasError(false)
        setUseScreenshot(false)
        setIframeKey(prev => prev + 1)
      }
    }
  }, [bookmark, isOpen])

  // 键盘快捷键支持
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose])

  const handleIframeLoad = () => {
    setIsLoading(false)
    setHasError(false)
  }

  const handleIframeError = () => {
    setIsLoading(false)
    setHasError(true)
    // 自动切换到截图模式
    setTimeout(() => {
      setUseScreenshot(true)
      setHasError(false)
      setIsLoading(true)
      // 预加载截图
      const img = new Image()
      img.onload = () => setIsLoading(false)
      img.onerror = () => setIsLoading(false)
      img.src = `/api/screenshot?url=${encodeURIComponent(bookmark?.url || '')}`
    }, 1500)
  }

  const handleRefresh = () => {
    if (bookmark) {
      setIsLoading(true)
      setHasError(false)
      setUseScreenshot(false)
      setIframeKey(prev => prev + 1)
    }
  }

  const handleTryScreenshot = () => {
    setUseScreenshot(true)
    setHasError(false)
    setIsLoading(true)
    // 预加载截图
    const img = new Image()
    img.onload = () => setIsLoading(false)
    img.onerror = () => setIsLoading(false)
    img.src = `/api/screenshot?url=${encodeURIComponent(bookmark?.url || '')}`
  }

  // 检查是否是已知会阻止 iframe 的网站
  const isKnownBlockedSite = (url: string) => {
    const blockedDomains = [
      'github.com',
      'google.com',
      'youtube.com',
      'facebook.com',
      'twitter.com',
      'instagram.com',
      'linkedin.com',
      'stackoverflow.com',
      'reddit.com',
      'amazon.com',
      'netflix.com',
      'spotify.com'
    ]

    try {
      const domain = new URL(url).hostname.toLowerCase()
      return blockedDomains.some(blocked => domain.includes(blocked))
    } catch {
      return false
    }
  }

  const handleOpenInNewTab = () => {
    if (bookmark) {
      window.open(bookmark.url, '_blank', 'noopener,noreferrer')
    }
  }

  if (!isOpen || !bookmark) {
    return null
  }

  return (
    <>
      {/* 遮罩层 - 仅在移动设备上显示 */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-300"
          onClick={onClose}
        />
      )}

      {/* 预览面板 */}
      <div className={cn(
        "fixed inset-y-0 right-0 z-50 bg-background border-l border-border shadow-2xl transition-transform duration-300 ease-in-out bookmark-preview-panel",
        "w-full md:w-1/2 lg:w-2/5 xl:w-1/3",
        isOpen ? "translate-x-0" : "translate-x-full"
      )}>
      <Card className="h-full rounded-none border-0">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 p-4 border-b">
          <div className="flex items-center space-x-3 flex-1 min-w-0">
            {bookmark.favicon && (
              <img
                src={bookmark.favicon}
                alt=""
                className="w-5 h-5 flex-shrink-0"
                onError={(e) => {
                  e.currentTarget.style.display = 'none'
                }}
              />
            )}
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{bookmark.title}</h3>
              <p className="text-xs text-muted-foreground truncate">{bookmark.url}</p>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleRefresh}
              disabled={isLoading}
              className="h-8 w-8 p-0"
              title="刷新"
            >
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenInNewTab}
              className="h-8 w-8 p-0"
              title="在新标签页中打开"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="h-8 w-8 p-0"
              title="关闭预览"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0 h-[calc(100%-80px)] relative">
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm z-10">
              <div className="flex flex-col items-center space-y-2">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
                <p className="text-sm text-muted-foreground">加载中...</p>
              </div>
            </div>
          )}
          
          {hasError && !useScreenshot && (
            <div className="absolute inset-0 flex items-center justify-center bg-background z-10">
              <div className="flex flex-col items-center space-y-4 text-center p-8">
                <AlertCircle className="h-12 w-12 text-muted-foreground" />
                <div className="space-y-2">
                  <h4 className="font-semibold">无法加载预览</h4>
                  <p className="text-sm text-muted-foreground max-w-md">
                    该网站阻止了在框架中显示。您可以尝试截图预览或直接访问网站。
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 justify-center">
                  <Button variant="outline" size="sm" onClick={handleRefresh}>
                    重试直接预览
                  </Button>
                  <Button variant="outline" size="sm" onClick={handleTryScreenshot}>
                    尝试截图预览
                  </Button>
                  <Button size="sm" onClick={handleOpenInNewTab}>
                    在新标签页中打开
                  </Button>
                </div>
              </div>
            </div>
          )}

          {useScreenshot && (
            <div className="absolute inset-0 flex flex-col bg-background z-10">
              <div className="flex-1 flex items-center justify-center p-4">
                <div className="w-full h-full">
                  <img
                    src={`/api/screenshot?url=${encodeURIComponent(bookmark.url)}`}
                    alt={`${bookmark.title} 预览截图`}
                    className="w-full h-full object-contain rounded-lg border border-border shadow-lg bg-white"
                    onError={(e) => {
                      // 如果截图服务也失败，显示备用内容
                      const img = e.currentTarget as HTMLImageElement
                      img.style.display = 'none'
                      const parent = img.parentElement
                      if (parent) {
                        parent.innerHTML = `
                          <div class="flex items-center justify-center h-full">
                            <div class="text-center space-y-4 p-8">
                              <div class="w-16 h-16 mx-auto rounded-full bg-muted flex items-center justify-center">
                                <svg class="w-8 h-8 text-muted-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9v-9m0-9v9"></path>
                                </svg>
                              </div>
                              <div>
                                <h4 class="font-semibold text-foreground">无法生成预览</h4>
                                <p class="text-sm text-muted-foreground mt-2">该网站暂时无法预览，请直接访问查看内容</p>
                              </div>
                            </div>
                          </div>
                        `
                      }
                    }}
                  />
                </div>
              </div>
              <div className="border-t border-border p-4 bg-muted/30">
                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground">📸 网站截图预览</span>
                    {isKnownBlockedSite(bookmark.url) && (
                      <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full">
                        自动模式
                      </span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    {!isKnownBlockedSite(bookmark.url) && (
                      <Button variant="outline" size="sm" onClick={() => setUseScreenshot(false)}>
                        尝试直接预览
                      </Button>
                    )}
                    <Button size="sm" onClick={handleOpenInNewTab}>
                      访问原网站
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          )}
          
          <iframe
            key={iframeKey}
            src={bookmark.url}
            className="w-full h-full border-0"
            onLoad={handleIframeLoad}
            onError={handleIframeError}
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox allow-top-navigation-by-user-activation"
            referrerPolicy="no-referrer-when-downgrade"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          />
        </CardContent>
      </Card>
    </div>
    </>
  )
}
