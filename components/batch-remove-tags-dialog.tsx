"use client"

import { useState, useMemo, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { toast } from "sonner"

interface BatchRemoveTagsDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarkIds: string[]
  onSuccess?: () => void
}

export function BatchRemoveTagsDialog({ open, onOpenChange, bookmarkIds, onSuccess }: BatchRemoveTagsDialogProps) {
  const { bookmarks, removeTagsFromBookmarks } = useBookmarkStore()
  const [selected, setSelected] = useState<Set<string>>(new Set())

  // 列出选中书签里出现过的所有标签 + 出现次数
  const tagFrequency = useMemo(() => {
    const idSet = new Set(bookmarkIds)
    const freq = new Map<string, number>()
    for (const b of bookmarks) {
      if (!idSet.has(b.id)) continue
      for (const t of b.tags || []) {
        freq.set(t, (freq.get(t) ?? 0) + 1)
      }
    }
    return Array.from(freq.entries()).sort((a, b) => b[1] - a[1])
  }, [bookmarks, bookmarkIds])

  useEffect(() => {
    if (open) setSelected(new Set())
  }, [open])

  const toggle = (tag: string) => {
    setSelected((prev) => {
      const next = new Set(prev)
      if (next.has(tag)) next.delete(tag)
      else next.add(tag)
      return next
    })
  }

  const handleConfirm = () => {
    if (selected.size === 0) {
      toast.error("请至少选择一个标签")
      return
    }
    const tagsToRemove = Array.from(selected)
    removeTagsFromBookmarks(bookmarkIds, tagsToRemove)
    toast.success(`已从 ${bookmarkIds.length} 个书签移除 ${tagsToRemove.length} 个标签`)
    setSelected(new Set())
    onOpenChange(false)
    onSuccess?.()
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>批量移除标签</DialogTitle>
          <DialogDescription>
            勾选要从选中的 {bookmarkIds.length} 个书签中移除的标签。括号内为该标签出现的次数。
          </DialogDescription>
        </DialogHeader>

        <div className="py-2">
          {tagFrequency.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              选中的书签都没有标签
            </p>
          ) : (
            <div className="max-h-72 overflow-auto space-y-1 pr-1">
              {tagFrequency.map(([tag, count]) => (
                <label
                  key={tag}
                  className="flex items-center gap-2 px-2 py-1.5 rounded-md hover:bg-accent cursor-pointer"
                >
                  <Checkbox
                    checked={selected.has(tag)}
                    onCheckedChange={() => toggle(tag)}
                  />
                  <span className="text-sm flex-1">{tag}</span>
                  <span className="text-xs text-muted-foreground">{count}</span>
                </label>
              ))}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>取消</Button>
          <Button
            variant="destructive"
            onClick={handleConfirm}
            disabled={selected.size === 0 || tagFrequency.length === 0}
          >
            移除选中的 {selected.size} 个标签
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
