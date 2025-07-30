"use client"

import { useState } from "react"
import { FolderOpen, X, CheckSquare } from "lucide-react"
import { Button } from "@/components/ui/button"
import { MoveBookmarkDialog } from "@/components/move-bookmark-dialog"
import { cn } from "@/lib/utils"

interface BatchSelectionToolbarProps {
  selectedBookmarkIds: string[]
  onClearSelection: () => void
  onDeleteSelected: () => void
  onMoveComplete?: () => void
  className?: string
}

export function BatchSelectionToolbar({
  selectedBookmarkIds,
  onClearSelection,
  onDeleteSelected,
  onMoveComplete,
  className,
}: BatchSelectionToolbarProps) {
  const [moveDialogOpen, setMoveDialogOpen] = useState(false)

  if (selectedBookmarkIds.length === 0) return null

  return (
    <>
      <div
        className={cn(
          "fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50",
          "bg-card border border-border rounded-lg shadow-lg",
          "flex items-center space-x-2 px-4 py-3",
          "animate-in slide-in-from-bottom-2 duration-200",
          className
        )}
      >
        <div className="flex items-center space-x-2 text-sm">
          <CheckSquare className="w-4 h-4 text-primary" />
          <span className="font-medium">
            已选择 {selectedBookmarkIds.length} 个书签
          </span>
        </div>

        <div className="h-4 w-px bg-border mx-2" />

        <div className="flex items-center space-x-1">
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
            onClick={onDeleteSelected}
            className="h-8 px-3 hover:bg-destructive/10 hover:text-destructive"
          >
            删除
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={onClearSelection}
            className="h-8 w-8 p-0 hover:bg-muted"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <MoveBookmarkDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        bookmarkIds={selectedBookmarkIds}
        onMoveComplete={onMoveComplete}
      />
    </>
  )
}
