"use client"

import { useState, useMemo } from "react"
import { FolderOpen, X, CheckSquare, Download, Star, StarOff, Tag, ExternalLink, Tags } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoveBookmarkDialog } from "@/components/move-bookmark-dialog"
import { BatchAddTagsDialog } from "@/components/batch-add-tags-dialog"
import { BatchRemoveTagsDialog } from "@/components/batch-remove-tags-dialog"
import { BatchOpenLinksDialog } from "@/components/batch-open-links-dialog"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { openBookmarksBatch } from "@/lib/open-batch"
import { cn } from "@/lib/utils"
import { toast } from "sonner"

interface BatchSelectionToolbarProps {
  selectedBookmarkIds: string[]
  onClearSelection: () => void
  onDeleteSelected: () => void
  onMoveComplete?: () => void
  onExportSelected?: (ids: string[]) => void
  className?: string
}

export function BatchSelectionToolbar({
  selectedBookmarkIds,
  onClearSelection,
  onDeleteSelected,
  onMoveComplete,
  className,
  onExportSelected,
}: BatchSelectionToolbarProps) {
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)
  const [addTagsDialogOpen, setAddTagsDialogOpen] = useState(false)
  const [removeTagsDialogOpen, setRemoveTagsDialogOpen] = useState(false)
  const [openLinksDialogOpen, setOpenLinksDialogOpen] = useState(false)
  const [preOpenedIds, setPreOpenedIds] = useState<string[]>([])
  const { bookmarks, setFavorites } = useBookmarkStore()

  // 计算选中书签的"是否全部已收藏"——决定批量按钮显示加入还是移出
  const allFavorited = useMemo(() => {
    if (selectedBookmarkIds.length === 0) return false
    const idSet = new Set(selectedBookmarkIds)
    const selected = bookmarks.filter(b => idSet.has(b.id))
    return selected.length > 0 && selected.every(b => b.isFavorite)
  }, [bookmarks, selectedBookmarkIds])

  const handleToggleFavorites = () => {
    setFavorites(selectedBookmarkIds, !allFavorited)
    toast.success(allFavorited
      ? `已从收藏夹移出 ${selectedBookmarkIds.length} 个书签`
      : `已加入收藏夹 ${selectedBookmarkIds.length} 个书签`
    )
  }

  const handleOpenSelected = () => {
    const idSet = new Set(selectedBookmarkIds)
    const items = bookmarks.filter(b => idSet.has(b.id)).map(b => ({ id: b.id, url: b.url }))
    if (items.length === 0) return
    const { openedIds, blockedIds } = openBookmarksBatch(items)
    if (blockedIds.length === 0) {
      toast.success(`已打开 ${openedIds.length} 个标签页`)
      return
    }
    // 有拦截时打开引导对话框,把已成功的 id 传过去,避免重复尝试
    setPreOpenedIds(openedIds)
    setOpenLinksDialogOpen(true)
  }

  if (selectedBookmarkIds.length === 0) return null

  return (
    <>
      <div
        role="toolbar"
        aria-label={`已选择 ${selectedBookmarkIds.length} 个书签的操作`}
        className={cn(
          "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
          "bg-card border border-border rounded-lg shadow-lg",
          "flex items-center space-x-2 px-4 py-3 max-w-[calc(100vw-2rem)]",
          "animate-in slide-in-from-bottom-2 duration-200",
          className
        )}
      >
        <div className="flex items-center space-x-2 text-sm flex-shrink-0">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span className="font-medium whitespace-nowrap">
            已选 {selectedBookmarkIds.length}
          </span>
        </div>

        <div className="h-4 w-px bg-border mx-1 flex-shrink-0" />

        <div className="flex items-center space-x-1 overflow-x-auto">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleOpenSelected}
            className="h-8 px-3 hover:bg-primary/10 hover:text-primary"
            aria-label="打开选中的书签"
          >
            <ExternalLink className="w-4 h-4 mr-1" />
            打开
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleToggleFavorites}
            className="h-8 px-3 hover:bg-amber-500/10 hover:text-amber-600"
            aria-label={allFavorited ? "移出收藏" : "加入收藏"}
          >
            {allFavorited ? (
              <>
                <StarOff className="w-4 h-4 mr-1" />
                移出收藏
              </>
            ) : (
              <>
                <Star className="w-4 h-4 mr-1" />
                收藏
              </>
            )}
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setAddTagsDialogOpen(true)}
            className="h-8 px-3 hover:bg-primary/10 hover:text-primary"
          >
            <Tag className="w-4 h-4 mr-1" />
            加标签
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRemoveTagsDialogOpen(true)}
            className="h-8 px-3 hover:bg-destructive/10 hover:text-destructive"
          >
            <Tags className="w-4 h-4 mr-1" />
            移除标签
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMoveDialogOpen(true)}
            className="h-8 px-3 hover:bg-orange-500/10 hover:text-orange-600"
          >
            <FolderOpen className="w-4 h-4 mr-1" />
            移动
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => onExportSelected && onExportSelected(selectedBookmarkIds)}
            className="h-8 px-3 hover:bg-primary/10 hover:text-primary"
          >
            <Download className="w-4 h-4 mr-1" />
            导出
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onDeleteSelected}
            className="h-8 px-3 hover:bg-destructive/10 hover:text-destructive"
          >
            删除
          </Button>
        </div>

        <div className="h-4 w-px bg-border mx-1 flex-shrink-0" />

        <Button
          variant="ghost"
          size="sm"
          onClick={onClearSelection}
          className="h-8 w-8 p-0 hover:bg-muted flex-shrink-0"
          aria-label="取消选择"
        >
          <X className="w-4 h-4" />
        </Button>
      </div>

      <MoveBookmarkDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        bookmarkIds={selectedBookmarkIds}
        onMoveComplete={onMoveComplete}
      />

      <BatchAddTagsDialog
        open={addTagsDialogOpen}
        onOpenChange={setAddTagsDialogOpen}
        bookmarkIds={selectedBookmarkIds}
      />

      <BatchRemoveTagsDialog
        open={removeTagsDialogOpen}
        onOpenChange={setRemoveTagsDialogOpen}
        bookmarkIds={selectedBookmarkIds}
      />

      <BatchOpenLinksDialog
        open={openLinksDialogOpen}
        onOpenChange={setOpenLinksDialogOpen}
        bookmarkIds={selectedBookmarkIds}
        initiallyOpenedIds={preOpenedIds}
      />
    </>
  )
}
