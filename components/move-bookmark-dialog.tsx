"use client"

import { useState } from "react"
import { FolderOpen, ChevronRight } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
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

export function MoveBookmarkDialog({
  open,
  onOpenChange,
  bookmarkIds,
  currentSubCategoryId,
  onMoveComplete,
}: MoveBookmarkDialogProps) {
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState<string>("")
  const { categories, moveBookmarks } = useBookmarkStore()
  const { toast } = useToast()

  const handleMove = () => {
    if (!selectedSubCategoryId || bookmarkIds.length === 0) return

    // 获取目标分类信息用于显示
    const targetCategory = categories.find(cat =>
      cat.subCategories.some(sub => sub.id === selectedSubCategoryId)
    )
    const targetSubCategory = targetCategory?.subCategories.find(sub => sub.id === selectedSubCategoryId)

    moveBookmarks(bookmarkIds, selectedSubCategoryId)

    // 显示成功提示
    toast({
      title: "移动成功",
      description: `已将 ${bookmarkIds.length} 个书签移动到「${targetCategory?.name} - ${targetSubCategory?.name}」`,
    })

    onOpenChange(false)
    setSelectedSubCategoryId("")

    // 通知父组件移动完成，用于清理选择状态
    onMoveComplete?.()
  }

  const handleCancel = () => {
    onOpenChange(false)
    setSelectedSubCategoryId("")
  }

  // 获取当前子分类的信息
  const getCurrentSubCategoryInfo = () => {
    if (!currentSubCategoryId) return null
    
    for (const category of categories) {
      const subCategory = category.subCategories.find(sub => sub.id === currentSubCategoryId)
      if (subCategory) {
        return {
          categoryName: category.name,
          subCategoryName: subCategory.name
        }
      }
    }
    return null
  }

  const currentInfo = getCurrentSubCategoryInfo()

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

        <ScrollArea className="max-h-80">
          <div className="space-y-2">
            {categories.map((category) => (
              <div key={category.id} className="space-y-1">
                <div className="font-medium text-sm text-muted-foreground px-2 py-1">
                  {category.name}
                </div>
                {category.subCategories.map((subCategory) => (
                  <button
                    key={subCategory.id}
                    className={cn(
                      "w-full text-left px-3 py-2 rounded-md text-sm transition-colors",
                      "hover:bg-accent hover:text-accent-foreground",
                      selectedSubCategoryId === subCategory.id
                        ? "bg-primary text-primary-foreground"
                        : "",
                      currentSubCategoryId === subCategory.id
                        ? "opacity-50 cursor-not-allowed"
                        : ""
                    )}
                    onClick={() => {
                      if (currentSubCategoryId !== subCategory.id) {
                        setSelectedSubCategoryId(subCategory.id)
                      }
                    }}
                    disabled={currentSubCategoryId === subCategory.id}
                  >
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 rounded-full bg-current opacity-60" />
                      <span>{subCategory.name}</span>
                      {currentSubCategoryId === subCategory.id && (
                        <span className="text-xs opacity-70">(当前位置)</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ))}
          </div>
        </ScrollArea>

        <div className="flex justify-end space-x-2 pt-4">
          <Button variant="outline" onClick={handleCancel}>
            取消
          </Button>
          <Button 
            onClick={handleMove} 
            disabled={!selectedSubCategoryId || selectedSubCategoryId === currentSubCategoryId}
          >
            移动
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
