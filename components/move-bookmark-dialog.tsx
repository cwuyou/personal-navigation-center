"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { FolderOpen, ChevronRight, Search } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useToast } from "@/hooks/use-toast"
import { cn } from "@/lib/utils"

interface MoveBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  bookmarkIds: string[]
  currentSubCategoryId?: string
  onMoveComplete?: () => void
}

interface CandidateSub {
  id: string
  name: string
  categoryId: string
  categoryName: string
  isCurrent: boolean
}

export function MoveBookmarkDialog({
  open,
  onOpenChange,
  bookmarkIds,
  currentSubCategoryId,
  onMoveComplete,
}: MoveBookmarkDialogProps) {
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("")
  const [query, setQuery] = useState("")
  const [activeIndex, setActiveIndex] = useState(0)
  const { categories, moveBookmarks } = useBookmarkStore()
  const { toast } = useToast()
  const searchRef = useRef<HTMLInputElement>(null)
  const activeButtonRef = useRef<HTMLButtonElement>(null)

  // 打开时重置 + 聚焦搜索
  useEffect(() => {
    if (open) {
      setQuery("")
      setSelectedSubCategoryId("")
      setActiveIndex(0)
      // 微任务后聚焦,等 Dialog 完成挂载
      const t = setTimeout(() => searchRef.current?.focus(), 50)
      return () => clearTimeout(t)
    }
  }, [open])

  // 扁平化全部子分类(便于过滤和键盘导航);保留分类名做分组渲染
  const allSubs: CandidateSub[] = useMemo(() => {
    const list: CandidateSub[] = []
    categories.forEach(cat => {
      cat.subCategories.forEach(sub => {
        list.push({
          id: sub.id,
          name: sub.name,
          categoryId: cat.id,
          categoryName: cat.name,
          isCurrent: sub.id === currentSubCategoryId,
        })
      })
    })
    return list
  }, [categories, currentSubCategoryId])

  // 过滤后的候选(分类名或子分类名命中即可)
  const filtered: CandidateSub[] = useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return allSubs
    return allSubs.filter(s =>
      s.name.toLowerCase().includes(q) ||
      s.categoryName.toLowerCase().includes(q)
    )
  }, [allSubs, query])

  // 可选(排除当前位置)的候选,用于键盘导航
  const selectable = useMemo(() => filtered.filter(s => !s.isCurrent), [filtered])

  // query 或 filtered 变化时, activeIndex 收敛到 0
  useEffect(() => {
    setActiveIndex(0)
  }, [query, filtered.length])

  // active 项变化时滚动到可视区
  useEffect(() => {
    activeButtonRef.current?.scrollIntoView({ block: "nearest" })
  }, [activeIndex])

  // 按分类分组渲染过滤结果
  const grouped = useMemo(() => {
    const map = new Map<string, { categoryName: string; subs: CandidateSub[] }>()
    filtered.forEach(s => {
      const g = map.get(s.categoryId)
      if (g) {
        g.subs.push(s)
      } else {
        map.set(s.categoryId, { categoryName: s.categoryName, subs: [s] })
      }
    })
    return Array.from(map.entries())
  }, [filtered])

  const confirmMove = (targetId: string) => {
    if (!targetId || targetId === currentSubCategoryId || bookmarkIds.length === 0) return

    const targetCategory = categories.find(cat =>
      cat.subCategories.some(sub => sub.id === targetId)
    )
    const targetSubCategory = targetCategory?.subCategories.find(sub => sub.id === targetId)

    moveBookmarks(bookmarkIds, targetId)

    toast({
      title: "移动成功",
      description: `已将 ${bookmarkIds.length} 个书签移动到「${targetCategory?.name} - ${targetSubCategory?.name}」`,
    })

    onOpenChange(false)
    setSelectedSubCategoryId("")
    setQuery("")
    onMoveComplete?.()
  }

  const handleMove = () => {
    if (selectedSubCategoryId) {
      confirmMove(selectedSubCategoryId)
    } else if (selectable.length > 0) {
      confirmMove(selectable[activeIndex]?.id || "")
    }
  }

  const handleCancel = () => {
    onOpenChange(false)
    setSelectedSubCategoryId("")
    setQuery("")
  }

  const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (selectable.length === 0) return
    if (e.key === "ArrowDown") {
      e.preventDefault()
      setActiveIndex(prev => (prev + 1) % selectable.length)
    } else if (e.key === "ArrowUp") {
      e.preventDefault()
      setActiveIndex(prev => (prev - 1 + selectable.length) % selectable.length)
    } else if (e.key === "Enter") {
      e.preventDefault()
      const target = selectedSubCategoryId || selectable[activeIndex]?.id
      if (target) confirmMove(target)
    }
  }

  const getCurrentSubCategoryInfo = () => {
    if (!currentSubCategoryId) return null
    for (const category of categories) {
      const subCategory = category.subCategories.find(sub => sub.id === currentSubCategoryId)
      if (subCategory) {
        return {
          categoryName: category.name,
          subCategoryName: subCategory.name,
        }
      }
    }
    return null
  }

  const currentInfo = getCurrentSubCategoryInfo()
  const activeId = selectable[activeIndex]?.id

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <FolderOpen className="w-5 h-5" />
            <span>移动书签</span>
          </DialogTitle>
          <DialogDescription>
            {bookmarkIds.length === 1
              ? "选择要移动到的分类"
              : `选择要移动 ${bookmarkIds.length} 个书签到的分类`
            }
          </DialogDescription>
        </DialogHeader>

        {currentInfo && (
          <div className="bg-muted/50 rounded-lg p-3 text-sm">
            <div className="flex items-center text-muted-foreground">
              <span>当前位置：</span>
              <span className="ml-1 font-medium text-foreground">
                {currentInfo.categoryName}
              </span>
              <ChevronRight className="w-3 h-3 mx-1" />
              <span className="font-medium text-foreground">
                {currentInfo.subCategoryName}
              </span>
            </div>
          </div>
        )}

        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            ref={searchRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            placeholder="搜索分类或子分类..."
            className="pl-9"
          />
        </div>

        <ScrollArea className="max-h-80">
          <div className="space-y-2">
            {grouped.length === 0 ? (
              <div className="text-center text-sm text-muted-foreground py-8">
                没有匹配的分类
              </div>
            ) : (
              grouped.map(([categoryId, group]) => (
                <div key={categoryId} className="space-y-1">
                  <div className="font-medium text-sm text-muted-foreground px-2 py-1">
                    {group.categoryName}
                  </div>
                  {group.subs.map((sub) => {
                    const isActive = sub.id === activeId
                    const isSelected = selectedSubCategoryId === sub.id
                    return (
                      <button
                        key={sub.id}
                        ref={isActive ? activeButtonRef : null}
                        className={cn(
                          "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                          "hover:bg-accent hover:text-accent-foreground",
                          isSelected && "bg-primary text-primary-foreground hover:bg-primary hover:text-primary-foreground",
                          !isSelected && isActive && "bg-accent text-accent-foreground ring-1 ring-primary/30",
                          sub.isCurrent && "opacity-50 cursor-not-allowed"
                        )}
                        onClick={() => {
                          if (!sub.isCurrent) {
                            setSelectedSubCategoryId(sub.id)
                          }
                        }}
                        onDoubleClick={() => {
                          if (!sub.isCurrent) confirmMove(sub.id)
                        }}
                        disabled={sub.isCurrent}
                      >
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                          <span>{sub.name}</span>
                          {sub.isCurrent && (
                            <span className="text-xs opacity-70">(当前位置)</span>
                          )}
                        </div>
                      </button>
                    )
                  })}
                </div>
              ))
            )}
          </div>
        </ScrollArea>

        <div className="flex items-center justify-between pt-4">
          <p className="text-xs text-muted-foreground hidden sm:block">
            ↑↓ 选择 · Enter 移动
          </p>
          <div className="flex space-x-2 sm:ml-auto">
            <Button variant="outline" onClick={handleCancel}>
              取消
            </Button>
            <Button
              onClick={handleMove}
              disabled={
                selectable.length === 0 ||
                (selectedSubCategoryId === currentSubCategoryId && !!selectedSubCategoryId)
              }
            >
              移动
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
