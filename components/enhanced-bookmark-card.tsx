"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
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
import { MoreHorizontal, ExternalLink, Edit, Trash2, Globe, Eye } from "lucide-react"
import { cn } from "@/lib/utils"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useDisplaySettings } from "@/hooks/use-display-settings"

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
  onEdit?: (bookmark: Bookmark) => void
}

export function EnhancedBookmarkCard({ bookmark, onPreview, onEdit }: EnhancedBookmarkCardProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [imageError, setImageError] = useState(false)
  const { deleteBookmark } = useBookmarkStore()
  const { settings } = useDisplaySettings()

  const handleClick = () => {
    window.open(bookmark.url, "_blank", "noopener,noreferrer")
  }

  const handleDelete = () => {
    deleteBookmark(bookmark.id)
    setDeleteDialogOpen(false)
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
          "hover:shadow-lg hover:scale-[1.02] border-border/20 shadow-sm",
          getCardRadius()
        )}
        onClick={handleClick}
      >
        <CardContent className={cn("card-content", getCardPadding())}>
          {/* 封面图片 */}
          {settings.showCover && bookmark.coverImage && !imageError && (
            <div className="mb-3 overflow-hidden rounded-md">
              <img
                src={bookmark.coverImage}
                alt={bookmark.title}
                className="w-full h-32 object-cover transition-transform duration-300 group-hover:scale-105"
                onError={() => setImageError(true)}
              />
            </div>
          )}

          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1 min-w-0">
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

            {/* 操作菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {onPreview && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onPreview(bookmark) }}>
                    <Eye className="mr-2 h-4 w-4" />
                    预览
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onEdit(bookmark) }}>
                    <Edit className="mr-2 h-4 w-4" />
                    编辑
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem 
                  onClick={(e) => { e.stopPropagation(); setDeleteDialogOpen(true) }}
                  className="text-destructive"
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  删除
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

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
