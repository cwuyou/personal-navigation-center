"use client"

import { cn } from "@/lib/utils"
import { getFaviconUrl } from "@/lib/metadata-fetcher"


import { useState } from "react"
import { ExternalLink, Edit2, Trash2, Globe, Eye, FolderOpen, Copy } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { EditBookmarkDialog } from "@/components/edit-bookmark-dialog"
import { DeleteConfirmDialog } from "@/components/delete-confirm-dialog"
import { MoveBookmarkDialog } from "@/components/move-bookmark-dialog"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { toast } from "sonner"

interface BookmarkCardProps {
  bookmark: {
    id: string
    title: string
    url: string
    description?: string
    favicon?: string
    subCategoryId: string
  }
  onPreview?: (bookmark: BookmarkCardProps['bookmark']) => void
}

export function BookmarkCard({ bookmark, onPreview }: BookmarkCardProps) {
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const { deleteBookmark } = useBookmarkStore()

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

  // 使用公共工具函数 getFaviconUrl（components 内部定义移除），保留此占位避免大改动
  const getFaviconUrlLocal = (url: string) => getFaviconUrl(url)

  return (
    <>
      <Card className="bookmark-card bookmark-group cursor-pointer hover:shadow-lg transition-all duration-300 hover:scale-[1.02] border-border/50 bg-card/80 backdrop-blur-sm">
        <CardContent className="card-content p-4 sm:p-5">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-start space-x-3 flex-1 min-w-0" onClick={handleClick}>
              <div className="flex-shrink-0 mt-0.5">
                {bookmark.favicon || getFaviconUrlLocal(bookmark.url) ? (
                  <img
                    src={bookmark.favicon || getFaviconUrlLocal(bookmark.url)!}
                    alt=""
                    className="w-10 h-10 rounded-lg shadow-sm"
                    onError={(e) => {
                      const img = e.target as HTMLImageElement
                      try {
                        const domain = new URL(bookmark.url).hostname
                        if (!img.dataset.fallbackTried) {
                          img.dataset.fallbackTried = '1'
                          img.src = `https://www.google.com/s2/favicons?domain=${domain}&sz=64`
                          return
                        }
                      } catch {}
                      img.style.display = "none"
                      img.nextElementSibling?.classList.remove("hidden")
                    }}
                  />
                ) : null}
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center shadow-sm",
                    bookmark.favicon || getFaviconUrlLocal(bookmark.url) ? "hidden" : "",
                  )}
                >
                  <Globe className="w-5 h-5 text-muted-foreground" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-xs sm:text-sm text-foreground truncate mb-1.5 bookmark-group-hover:text-primary transition-colors" title={bookmark.title}>
                  {bookmark.title}
                </h3>
                {bookmark.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed mb-2" title={bookmark.description}>
                    {bookmark.description}
                  </p>
                )}
                <div className="mt-2 flex items-center text-xs text-muted-foreground/70">
                  <ExternalLink className="w-3 h-3 mr-1 flex-shrink-0" />
                  <span className="truncate">
                    {new URL(bookmark.url).hostname}
                  </span>
                </div>
              </div>
            </div>

            <div className="opacity-0 bookmark-group-hover:opacity-100 flex items-center space-x-1 ml-2 transition-all duration-200">
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary rounded-md"
                onClick={(e) => {
                  e.stopPropagation()
                  onPreview?.(bookmark)
                }}
                title="预览网站"
              >
                <Eye className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary rounded-md"
                onClick={(e) => {
                  e.stopPropagation()
                  setMoveDialogOpen(true)
                }}
                title="移动书签"
              >
                <FolderOpen className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-primary/10 hover:text-primary rounded-md"
                onClick={(e) => {
                  e.stopPropagation()
                  setEditDialogOpen(true)
                }}
                title="编辑书签"
              >
                <Edit2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-green-500/10 hover:text-green-600 rounded-md"
                onClick={(e) => {
                  e.stopPropagation()
                  handleCopyUrl()
                }}
                title="复制网址"
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="h-7 w-7 p-0 hover:bg-destructive/10 hover:text-destructive rounded-md"
                onClick={(e) => {
                  e.stopPropagation()
                  setDeleteDialogOpen(true)
                }}
                title="删除书签"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>


        </CardContent>
      </Card>

      <EditBookmarkDialog open={editDialogOpen} onOpenChange={setEditDialogOpen} bookmark={bookmark} />

      <MoveBookmarkDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        bookmarkIds={[bookmark.id]}
        currentSubCategoryId={bookmark.subCategoryId}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="删除书签"
        description={`确定要删除书签"${bookmark.title}"吗？`}
        onConfirm={handleDelete}
      />
    </>
  )
}
