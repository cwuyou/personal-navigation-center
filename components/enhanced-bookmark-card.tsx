"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { MoreHorizontal, ExternalLink, Edit, Trash2, Globe, Eye, Copy, Move, MoreVertical } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useDisplaySettings } from "@/hooks/use-display-settings"
import { EditBookmarkDialog } from "@/components/edit-bookmark-dialog"
import { toast } from "sonner"

// 复制到剪贴板的辅助函数
const copyToClipboard = async (text: string) => {
  try {
    await navigator.clipboard.writeText(text)
    toast.success("已复制到剪贴板")
  } catch (err) {
    console.error('Failed to copy: ', err)
    toast.error("复制失败")
  }
}

interface Bookmark {
  id: string
  title: string
  url: string
  description?: string
  favicon?: string
  coverImage?: string
  tags?: string[]
  subCategoryId: string
  createdAt: Date
}

interface EnhancedBookmarkCardProps {
  bookmark: Bookmark
  onPreview?: (bookmark: Bookmark) => void
}

export function EnhancedBookmarkCard({ bookmark, onPreview }: EnhancedBookmarkCardProps) {
  // 可选：用于高亮展示的命中词（由搜索结果传入）
  // 当前卡片内部未使用高亮，保持现有样式，如需在卡片内部高亮可在标题/描述处接入
  // const highlight = (text: string, q: string) => text

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const [layoutMode, setLayoutMode] = useState('grid')
  const { deleteBookmark } = useBookmarkStore()
  const { settings } = useDisplaySettings()

  // 检测当前布局模式
  const getCurrentLayoutMode = () => {
    if (typeof window === 'undefined') return 'grid'
    const root = document.documentElement
    if (root.classList.contains('layout-masonry')) return 'masonry'
    if (root.classList.contains('layout-list')) return 'list'
    return 'grid'
  }

  // 监听布局模式变化
  useEffect(() => {
    const updateLayoutMode = () => {
      setLayoutMode(getCurrentLayoutMode())
    }

    // 初始化布局模式
    updateLayoutMode()

    // 创建 MutationObserver 来监听 document.documentElement 的 class 变化
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.type === 'attributes' && mutation.attributeName === 'class') {
          updateLayoutMode()
        }
      })
    })

    // 开始观察
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class']
    })

    // 清理函数
    return () => {
      observer.disconnect()
    }
  }, [])

  const isListMode = layoutMode === 'list'

  const handleClick = () => {
    window.open(bookmark.url, "_blank", "noopener,noreferrer")
  }

  const handleDelete = () => {
    deleteBookmark(bookmark.id)
    setDeleteDialogOpen(false)
  }

  const handleCopyUrl = async () => {
    try {
      await navigator.clipboard.writeText(bookmark.url)
      toast.success('网址已复制到剪贴板')
    } catch (error) {
      console.error('复制失败:', error)
      toast.error('复制失败，请手动复制')
    }
  }

  const getFaviconUrl = (url: string) => {
    try {
      const domain = new URL(url).hostname
      return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
    } catch {
      return null
    }
  }

  const getCardPadding = () => {
    switch (settings.cardLayout) {
      case 'compact': return 'p-3'
      case 'comfortable': return 'p-4'
      case 'spacious': return 'p-6'
      default: return 'p-4'
    }
  }

  const getCardRadius = () => {
    switch (settings.cardRadius) {
      case 'none': return 'rounded-none'
      case 'sm': return 'rounded-sm'
      case 'md': return 'rounded-md'
      case 'lg': return 'rounded-lg'
      case 'xl': return 'rounded-xl'
      default: return 'rounded-lg'
    }
  }

  return (
    <>
      <Card
        className={cn(
          "bookmark-card bookmark-group cursor-pointer transition-all duration-300 bg-card/80 backdrop-blur-sm group",
          "hover:shadow-lg border-border/20 shadow-sm overflow-hidden",
          isListMode ? "hover:scale-[1.01]" : "hover:scale-[1.02]",
          getCardRadius()
        )}
        onClick={handleClick}
      >
        {/* 根据布局模式选择不同的结构 */}
        {isListMode ? (
          <div className="flex"> {/* 列表模式：水平布局 */}
            {/* 左侧封面图片 */}
            {settings.showCover && (
              <div className="relative w-24 h-16 flex-shrink-0 bg-gradient-to-br from-muted/30 to-muted/10 border-r border-border/30">
                {bookmark.coverImage && !imageError ? (
                  <img
                    src={bookmark.coverImage}
                    alt={bookmark.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20 border border-border/20"> {/* 没有封面图时的增强样式 */}
                    <Globe className="w-5 h-5 text-muted-foreground/40" />
                  </div>
                )}
              </div>
            )}

            {/* 右侧内容区域 */}
            <div className="flex-1 relative">
              <CardContent className={cn("card-content h-full flex items-center", getCardPadding())}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* 网站图标 */}
                    {settings.showFavicon && (
                      <div className="flex-shrink-0">
                        {bookmark.favicon || getFaviconUrl(bookmark.url) ? (
                          <img
                            src={bookmark.favicon || getFaviconUrl(bookmark.url)!}
                            alt=""
                            className="w-6 h-6 rounded-sm shadow-sm"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement
                              target.style.display = "none"
                              target.nextElementSibling?.classList.remove("hidden")
                            }}
                          />
                        ) : null}
                        <div
                          className={cn(
                            "w-6 h-6 rounded-sm bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center shadow-sm",
                            bookmark.favicon || getFaviconUrl(bookmark.url) ? "hidden" : "",
                          )}
                        >
                          <Globe className="w-3 h-3 text-muted-foreground" />
                        </div>
                      </div>
                    )}

                    <div className="flex-1 min-w-0">
                      {/* 标题 */}
                      {settings.showTitle && (
                        <h3 className="font-medium text-foreground bookmark-group-hover:text-primary transition-colors text-sm line-clamp-1 mb-1">
                          {bookmark.title}
                        </h3>
                      )}

                      {/* 描述 */}
                      {settings.showDescription && bookmark.description && (
                        <p className="text-muted-foreground text-xs line-clamp-1 mb-1">
                          {bookmark.description}
                        </p>
                      )}

                      {/* 网址 */}
                      {settings.showUrl && (
                        <div className="flex items-center text-xs text-muted-foreground/70">
                          <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                          <span className="truncate">
                            {new URL(bookmark.url).hostname}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* 标签 - 在列表模式下显示在右侧 */}
                    {settings.showTags && bookmark.tags && bookmark.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 max-w-32">
                        {bookmark.tags.slice(0, 2).map((tag) => (
                          <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                            {tag}
                          </Badge>
                        ))}
                        {bookmark.tags.length > 2 && (
                          <Badge variant="outline" className="text-xs px-2 py-0.5">
                            +{bookmark.tags.length - 2}
                          </Badge>
                        )}
                      </div>
                    )}
                  </div>

                  {/* 操作菜单 */}
                  <div className="ml-2">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-48">
                        {/* 查看操作组 */}
                        {onPreview && (
                          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(bookmark) }}>
                            <Eye className="mr-2 h-4 w-4" />
                            预览网站
                          </DropdownMenuItem>
                        )}
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank') }}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          新窗口打开
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* 编辑操作组 */}
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditDialogOpen(true) }}>
                          <Edit className="mr-2 h-4 w-4" />
                          编辑书签
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyToClipboard(bookmark.url) }}>
                          <Copy className="mr-2 h-4 w-4" />
                          复制链接
                        </DropdownMenuItem>

                        <DropdownMenuSeparator />

                        {/* 危险操作组 */}
                        <DropdownMenuItem
                          onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true) }}
                          className="text-destructive focus:text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          删除书签
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              </CardContent>
            </div>
          </div>
        ) : (
          <> {/* 网格模式：垂直布局 */}
            {/* 固定分区布局：上半部分 - 封面图片区域 */}
            {settings.showCover && (
              <div className="relative h-32 bg-gradient-to-br from-muted/30 to-muted/10 border-b border-border/40">
                {bookmark.coverImage && !imageError ? (
                  <img
                    src={bookmark.coverImage}
                    alt={bookmark.title}
                    className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted/50 to-muted/20"> {/* 没有封面图时的增强样式 */}
                    <Globe className="w-8 h-8 text-muted-foreground/40" />
                  </div>
                )}

                {/* 操作菜单 - 悬浮在封面图上 */}
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity bg-background/80 backdrop-blur-sm hover:bg-background/90"
                      >
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {/* 查看操作组 */}
                      {onPreview && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(bookmark) }}>
                          <Eye className="mr-2 h-4 w-4" />
                          预览网站
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank') }}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        新窗口打开
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* 编辑操作组 */}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditDialogOpen(true) }}>
                        <Edit className="mr-2 h-4 w-4" />
                        编辑书签
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyToClipboard(bookmark.url) }}>
                        <Copy className="mr-2 h-4 w-4" />
                        复制链接
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* 危险操作组 */}
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true) }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除书签
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>
            )}

            {/* 固定分区布局：下半部分 - 书签信息区域 */}
            <CardContent className={cn("card-content", getCardPadding())}>
              <div className="flex items-start space-x-3">
                {/* 网站图标 */}
                {settings.showFavicon && (
                  <div className="flex-shrink-0 mt-0.5">
                    {bookmark.favicon || getFaviconUrl(bookmark.url) ? (
                      <img
                        src={bookmark.favicon || getFaviconUrl(bookmark.url)!}
                        alt=""
                        className="w-8 h-8 rounded-md shadow-sm"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement
                          target.style.display = "none"
                          target.nextElementSibling?.classList.remove("hidden")
                        }}
                      />
                    ) : null}
                    <div
                      className={cn(
                        "w-8 h-8 rounded-md bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center shadow-sm",
                        bookmark.favicon || getFaviconUrl(bookmark.url) ? "hidden" : "",
                      )}
                    >
                      <Globe className="w-4 h-4 text-muted-foreground" />
                    </div>
                  </div>
                )}

                <div className="flex-1 min-w-0">
                  {/* 标题 */}
                  {settings.showTitle && (
                    <h3 className={cn(
                      "font-medium text-foreground bookmark-group-hover:text-primary transition-colors",
                      settings.cardLayout === 'compact' ? "text-xs mb-1" : "text-sm mb-2",
                      "line-clamp-2"  // 最多显示2行标题
                    )}>
                      {bookmark.title}
                    </h3>
                  )}

                  {/* 描述 */}
                  {settings.showDescription && bookmark.description && (
                    <p className={cn(
                      "text-muted-foreground leading-relaxed",
                      settings.cardLayout === 'compact' ? "text-xs line-clamp-2 mb-2" :
                      settings.cardLayout === 'comfortable' ? "text-xs line-clamp-3 mb-3" :
                      "text-xs line-clamp-4 mb-4"
                    )}>
                      {bookmark.description}
                    </p>
                  )}

                  {/* 网址 */}
                  {settings.showUrl && (
                    <div className="flex items-center text-xs text-muted-foreground/70 mb-2">
                      <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                      <span className="truncate">
                        {new URL(bookmark.url).hostname}
                      </span>
                    </div>
                  )}

                  {/* 标签 */}
                  {settings.showTags && bookmark.tags && bookmark.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {bookmark.tags.slice(0, 3).map((tag) => (
                        <Badge key={tag} variant="secondary" className="text-xs px-2 py-0.5">
                          {tag}
                        </Badge>
                      ))}
                      {bookmark.tags.length > 3 && (
                        <Badge variant="outline" className="text-xs px-2 py-0.5">
                          +{bookmark.tags.length - 3}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* 当没有开启封面图显示时，操作菜单显示在这里 */}
              {!settings.showCover && (
                <div className="absolute top-2 right-2">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                        <MoreHorizontal className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                      {/* 查看操作组 */}
                      {onPreview && (
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(bookmark) }}>
                          <Eye className="mr-2 h-4 w-4" />
                          预览网站
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); window.open(bookmark.url, '_blank') }}>
                        <ExternalLink className="mr-2 h-4 w-4" />
                        新窗口打开
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* 编辑操作组 */}
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); setEditDialogOpen(true) }}>
                        <Edit className="mr-2 h-4 w-4" />
                        编辑书签
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={(e) => { e.stopPropagation(); copyToClipboard(bookmark.url) }}>
                        <Copy className="mr-2 h-4 w-4" />
                        复制链接
                      </DropdownMenuItem>

                      <DropdownMenuSeparator />

                      {/* 危险操作组 */}
                      <DropdownMenuItem
                        onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true) }}
                        className="text-destructive focus:text-destructive"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        删除书签
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )}
            </CardContent>
          </>
        )}
      </Card>

      {/* 编辑书签对话框 */}
      <EditBookmarkDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        bookmark={bookmark}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除书签 &quot;{bookmark.title}&quot; 吗？此操作无法撤销。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
