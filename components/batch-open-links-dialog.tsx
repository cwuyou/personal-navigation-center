"use client"

import { useState, useEffect } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Check, ExternalLink, AlertTriangle } from "lucide-react"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { openBookmarksBatch } from "@/lib/open-batch"
import { toast } from "sonner"

interface BatchOpenLinksDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarkIds: string[]
  /** 已经在第一轮打开成功的 id(避免对话框打开时再次尝试或重复显示已打开状态) */
  initiallyOpenedIds?: string[]
}

export function BatchOpenLinksDialog({
  open,
  onOpenChange,
  bookmarkIds,
  initiallyOpenedIds,
}: BatchOpenLinksDialogProps) {
  const { bookmarks } = useBookmarkStore()
  const [openedIds, setOpenedIds] = useState<Set<string>>(new Set())

  const items = bookmarks.filter(b => bookmarkIds.includes(b.id))

  // 对话框打开时同步已打开状态(由调用方传入)
  useEffect(() => {
    if (open) {
      setOpenedIds(new Set(initiallyOpenedIds ?? []))
    }
  }, [open, initiallyOpenedIds])

  const handleOpenAll = () => {
    // 只对仍未打开的尝试,避免对成功的再开一次
    const remaining = items.filter(b => !openedIds.has(b.id))
    if (remaining.length === 0) {
      toast.success("已全部打开")
      onOpenChange(false)
      return
    }
    const { openedIds: opened, blockedIds: blocked } = openBookmarksBatch(remaining)
    setOpenedIds(prev => {
      const next = new Set(prev)
      opened.forEach(id => next.add(id))
      return next
    })
    if (blocked.length === 0) {
      toast.success(`已打开 ${opened.length} 个标签页`)
      onOpenChange(false)
    } else {
      toast.warning(
        `${opened.length}/${remaining.length} 已打开,${blocked.length} 个被浏览器拦截`,
        { duration: 6000 }
      )
    }
  }

  const handleItemClick = (id: string) => {
    setOpenedIds(prev => new Set(prev).add(id))
  }

  // 是否还有未打开的项,用于显示引导
  const hasUnopened = items.some(b => !openedIds.has(b.id))

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        if (!v) setOpenedIds(new Set())
        onOpenChange(v)
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>打开 {items.length} 个书签</DialogTitle>
          <DialogDescription>
            部分标签页被浏览器拦截了。可以从下方列表逐个点击(每次点击都是有效用户操作,不会被拦截),或允许本站点弹窗后再点「全部打开」。
          </DialogDescription>
        </DialogHeader>

        {hasUnopened && (
          <div className="flex gap-2 text-xs bg-amber-500/10 border border-amber-500/30 text-amber-700 dark:text-amber-400 rounded-md p-3">
            <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="font-medium">如何允许此站点弹窗?</p>
              <p>
                点击浏览器<strong>地址栏右侧</strong>的弹窗拦截图标 →
                选择「<strong>始终允许此网站的弹出式窗口</strong>」→ 再次点击「全部打开」即可一次开完。
              </p>
            </div>
          </div>
        )}

        <div className="max-h-72 overflow-auto -mx-6 px-6">
          <ul className="space-y-1">
            {items.map((b) => {
              const opened = openedIds.has(b.id)
              return (
                <li key={b.id}>
                  <a
                    href={b.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => handleItemClick(b.id)}
                    className="flex items-center gap-2 px-2 py-2 rounded-md hover:bg-accent text-sm transition-colors"
                  >
                    {opened ? (
                      <Check className="h-4 w-4 text-emerald-500 flex-shrink-0" />
                    ) : (
                      <ExternalLink className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                    <span className="flex-1 min-w-0">
                      <span className="block truncate font-medium">{b.title}</span>
                      <span className="block truncate text-xs text-muted-foreground">{b.url}</span>
                    </span>
                  </a>
                </li>
              )
            })}
          </ul>
        </div>

        <DialogFooter className="gap-2 sm:gap-2">
          <div className="flex-1 text-xs text-muted-foreground self-center">
            已打开 {openedIds.size}/{items.length}
          </div>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            关闭
          </Button>
          <Button onClick={handleOpenAll} disabled={!hasUnopened}>
            <ExternalLink className="w-4 h-4 mr-1" />
            全部打开
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
