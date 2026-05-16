"use client"

import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
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
import {
  ContextMenu,
  ContextMenuContent,
  ContextMenuItem,
  ContextMenuSeparator,
  ContextMenuTrigger,
} from "@/components/ui/context-menu"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { ExternalLink, Edit, Trash2, Globe, Copy, Move, Star } from "lucide-react"
import { cn } from "@/lib/utils"
import { BookmarkFavicon } from "@/components/bookmark-favicon"
import { BookmarkCover } from "@/components/bookmark-cover"

import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useDisplaySettings } from "@/hooks/use-display-settings"
import { useLayoutMode } from "@/hooks/use-layout-mode"
import { EditBookmarkDialog } from "@/components/edit-bookmark-dialog"
import { MoveBookmarkDialog } from "@/components/move-bookmark-dialog"
import { toast } from "sonner"

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
}

export function EnhancedBookmarkCard({ bookmark }: EnhancedBookmarkCardProps) {
  // 可选：用于高亮展示的命中词（由搜索结果传入）
  // 当前卡片内部未使用高亮，保持现有样式，如需在卡片内部高亮可在标题/描述处接入
  // const highlight = (text: string, q: string) => text

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const layoutMode = useLayoutMode()
  const { deleteBookmark, toggleFavorite } = useBookmarkStore()
  const { settings } = useDisplaySettings()

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

  // 移除本地缓存逻辑，使用专门的组件处理

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
      <ContextMenu>
        <ContextMenuTrigger asChild>
      <Card
        data-bm-id={bookmark.id}
        id={`bm-${bookmark.id}`}
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
              <BookmarkCover
                bookmark={bookmark}
                className="w-24 h-16 flex-shrink-0 border-r border-border/30"
                aspectRatio="wide"
              />
            )}

            {/* 右侧内容区域 */}
            <div className="flex-1 relative">
              <CardContent className={cn("card-content h-full flex items-center", getCardPadding())}>
                <div className="flex items-center justify-between w-full">
                  <div className="flex items-center space-x-3 flex-1 min-w-0">
                    {/* 网站图标 */}
                    {settings.showFavicon && (
                      <BookmarkFavicon
                        bookmark={bookmark}
                        size="md"
                        className="flex-shrink-0"
                      />
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

                  {/* 操作按钮组（hover/focus-visible 显示） */}
                  <TooltipProvider delayDuration={200}>
                    <div className="ml-2 flex items-center gap-0.5">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className={cn(
                              "h-8 w-8 p-0 transition-opacity",
                              bookmark.isFavorite
                                ? "opacity-100"
                                : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                            )}
                            aria-label={bookmark.isFavorite ? "取消收藏" : "加入收藏"}
                            aria-pressed={bookmark.isFavorite}
                            onClick={(e) => { e.stopPropagation(); toggleFavorite(bookmark.id) }}
                          >
                            <Star className={cn("h-4 w-4", bookmark.isFavorite && "fill-amber-400 text-amber-400")} />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>{bookmark.isFavorite ? "取消收藏" : "加入收藏"}</TooltipContent>
                      </Tooltip>
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label="编辑书签"
                            onClick={(e) => { e.stopPropagation(); setEditDialogOpen(true) }}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>编辑</TooltipContent>
                      </Tooltip>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            aria-label="复制链接"
                            onClick={(e) => { e.stopPropagation(); handleCopyUrl() }}
                          >
                            <Copy className="h-4 w-4" />
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent>复制链接</TooltipContent>
                      </Tooltip>
                      </div>
                    </div>
                  </TooltipProvider>
                </div>
              </CardContent>
            </div>
          </div>
        ) : (
          <>
            {/* 网格模式：垂直布局；上半部分 - 封面图片区域 */}
            {settings.showCover && (
              <div className="relative">
                <BookmarkCover
                  bookmark={bookmark}
                  className="h-32 border-b border-border/40"
                  aspectRatio="video"
                />

                {/* 操作菜单 - 悬浮在封面图上 */}
                <TooltipProvider delayDuration={200}>
                  <div className="absolute top-2 right-2 flex items-center gap-1">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90 transition-opacity",
                            bookmark.isFavorite
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          )}
                          aria-label={bookmark.isFavorite ? "取消收藏" : "加入收藏"}
                          aria-pressed={bookmark.isFavorite}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(bookmark.id) }}
                        >
                          <Star className={cn("h-4 w-4", bookmark.isFavorite && "fill-amber-400 text-amber-400")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{bookmark.isFavorite ? "取消收藏" : "加入收藏"}</TooltipContent>
                    </Tooltip>
                    <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                          aria-label="编辑书签"
                          onClick={(e) => { e.stopPropagation(); setEditDialogOpen(true) }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>编辑</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 bg-background/80 backdrop-blur-sm hover:bg-background/90"
                          aria-label="复制链接"
                          onClick={(e) => { e.stopPropagation(); handleCopyUrl() }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>复制链接</TooltipContent>
                    </Tooltip>
                    </div>
                  </div>
                </TooltipProvider>
              </div>
            )}

            {/* 固定分区布局：下半部分 - 书签信息区域 */}
            <CardContent className={cn("card-content", getCardPadding())}>
              <div className="flex items-start space-x-3">
                {/* 网站图标 */}
                {settings.showFavicon && (
                  <BookmarkFavicon
                    bookmark={bookmark}
                    size="lg"
                    className="flex-shrink-0 mt-0.5"
                  />
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

              {/* 当没有开启封面图显示时，操作按钮显示在这里 */}
              {!settings.showCover && (
                <TooltipProvider delayDuration={200}>
                  <div className="absolute top-2 right-2 flex items-center gap-0.5">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className={cn(
                            "h-8 w-8 p-0 transition-opacity",
                            bookmark.isFavorite
                              ? "opacity-100"
                              : "opacity-0 group-hover:opacity-100 focus-visible:opacity-100"
                          )}
                          aria-label={bookmark.isFavorite ? "取消收藏" : "加入收藏"}
                          aria-pressed={bookmark.isFavorite}
                          onClick={(e) => { e.stopPropagation(); toggleFavorite(bookmark.id) }}
                        >
                          <Star className={cn("h-4 w-4", bookmark.isFavorite && "fill-amber-400 text-amber-400")} />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>{bookmark.isFavorite ? "取消收藏" : "加入收藏"}</TooltipContent>
                    </Tooltip>
                    <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label="编辑书签"
                          onClick={(e) => { e.stopPropagation(); setEditDialogOpen(true) }}
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>编辑</TooltipContent>
                    </Tooltip>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0"
                          aria-label="复制链接"
                          onClick={(e) => { e.stopPropagation(); handleCopyUrl() }}
                        >
                          <Copy className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>复制链接</TooltipContent>
                    </Tooltip>
                    </div>
                  </div>
                </TooltipProvider>
              )}
            </CardContent>
          </>
        )}
      </Card>
        </ContextMenuTrigger>
        <ContextMenuContent className="w-48">
          <ContextMenuItem onClick={() => toggleFavorite(bookmark.id)}>
            <Star className={cn("mr-2 h-4 w-4", bookmark.isFavorite && "fill-amber-400 text-amber-400")} />
            {bookmark.isFavorite ? "取消收藏" : "加入收藏"}
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem onClick={() => setEditDialogOpen(true)}>
            <Edit className="mr-2 h-4 w-4" />
            编辑书签
          </ContextMenuItem>
          <ContextMenuItem onClick={handleCopyUrl}>
            <Copy className="mr-2 h-4 w-4" />
            复制链接
          </ContextMenuItem>
          <ContextMenuItem onClick={() => setMoveDialogOpen(true)}>
            <Move className="mr-2 h-4 w-4" />
            移动到...
          </ContextMenuItem>
          <ContextMenuSeparator />
          <ContextMenuItem
            onClick={() => setDeleteDialogOpen(true)}
            className="text-destructive focus:text-destructive"
          >
            <Trash2 className="mr-2 h-4 w-4" />
            删除书签
          </ContextMenuItem>
        </ContextMenuContent>
      </ContextMenu>

      {/* 编辑书签对话框 */}
      <EditBookmarkDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        bookmark={bookmark}
      />

      {/* 移动书签对话框 */}
      <MoveBookmarkDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        bookmarkIds={[bookmark.id]}
        currentSubCategoryId={bookmark.subCategoryId}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除</AlertDialogTitle>
            <AlertDialogDescription>
              确定要删除书签 &quot;{bookmark.title}&quot; 吗？删除后可在短时间内撤销。
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
