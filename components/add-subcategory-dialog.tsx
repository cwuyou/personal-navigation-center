"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FolderPlus } from "lucide-react"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"

interface AddSubCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  categoryId: string
}

export function AddSubCategoryDialog({ 
  open, 
  onOpenChange, 
  categoryId 
}: AddSubCategoryDialogProps) {
  const [subCategoryName, setSubCategoryName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const { addSubCategory, categories } = useBookmarkStore()
  
  // 找到当前分类
  const category = categories.find(cat => cat.id === categoryId)
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!subCategoryName.trim()) return
    
    setIsLoading(true)
    
    try {
      // 添加子分类
      addSubCategory(categoryId, subCategoryName.trim())
      
      // 重置表单并关闭对话框
      setSubCategoryName("")
      onOpenChange(false)
    } catch (error) {
      console.error("添加子分类失败:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setSubCategoryName("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FolderPlus className="h-5 w-5" />
            添加子分类
          </DialogTitle>
          <DialogDescription>
            为分类 "{category?.name}" 添加一个新的子分类
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="subcategory-name" className="text-right">
                子分类名称
              </Label>
              <Input
                id="subcategory-name"
                value={subCategoryName}
                onChange={(e) => setSubCategoryName(e.target.value)}
                placeholder="请输入子分类名称"
                className="col-span-3"
                autoFocus
                disabled={isLoading}
              />
            </div>
          </div>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={isLoading}
            >
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={!subCategoryName.trim() || isLoading}
            >
              {isLoading ? "添加中..." : "添加子分类"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
