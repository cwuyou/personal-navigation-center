"use client"

import { useState, useMemo } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { TagInput } from "@/components/tag-input"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { toast } from "sonner"

interface BatchAddTagsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarkIds: string[]
  onSuccess?: () => void
}

export function BatchAddTagsDialog({ open, onOpenChange, bookmarkIds, onSuccess }: BatchAddTagsDialogProps) {
  const { bookmarks, addTagsToBookmarks } = useBookmarkStore()
  const [tags, setTags] = useState<string[]>([])

  const allTagSuggestions = useMemo(
    () => Array.from(new Set(bookmarks.flatMap(b => b.tags || []))),
    [bookmarks]
  )

  const handleConfirm = () => {
    if (tags.length === 0) {
      toast.error("请至少添加一个标签")
      return
    }
    addTagsToBookmarks(bookmarkIds, tags)
    toast.success(`已为 ${bookmarkIds.length} 个书签添加 ${tags.length} 个标签`)
    setTags([])
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setTags([])
        onOpenChange(v)
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量添加标签</DialogTitle>
          <DialogDescription>
            将为选中的 {bookmarkIds.length} 个书签添加以下标签。已存在的标签会自动跳过。
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3 py-2">
          <Label>标签</Label>
          <TagInput
            value={tags}
            onChange={setTags}
            placeholder="输入后回车添加"
            suggestions={allTagSuggestions}
          />
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button onClick={handleConfirm} disabled={tags.length === 0}>
            添加
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
