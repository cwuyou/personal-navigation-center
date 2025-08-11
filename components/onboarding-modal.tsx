"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle, } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FolderPlus, BookmarkPlus } from "lucide-react"

interface OnboardingModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  onCreateCategory: () => void
  onAddBookmark: () => void
  onImport: () => void
}

export function OnboardingModal({ open, onOpenChange, onCreateCategory, onAddBookmark, onImport }: OnboardingModalProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>欢迎开始使用</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">清空数据后，你可以通过以下任意方式开始：</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button className="gap-2" onClick={onImport}>
              <Upload className="h-4 w-4" /> 导入书签
            </Button>
            <Button variant="outline" className="gap-2" onClick={onCreateCategory}>
              <FolderPlus className="h-4 w-4" /> 创建分类
            </Button>
            <Button variant="outline" className="gap-2" onClick={onAddBookmark}>
              <BookmarkPlus className="h-4 w-4" /> 添加书签
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}

