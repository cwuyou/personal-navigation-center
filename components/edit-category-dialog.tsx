"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"

interface EditCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  category: {
    id: string
    name: string
    parentId?: string
  }
  onClose: () => void
}

export function EditCategoryDialog({ open, onOpenChange, category, onClose }: EditCategoryDialogProps) {
  const [name, setName] = useState("")

  const { updateCategory, updateSubCategory } = useBookmarkStore()

  useEffect(() => {
    if (open && category) {
      setName(category.name)
    }
  }, [open, category])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    if (category.parentId) {
      updateSubCategory(category.id, name.trim())
    } else {
      updateCategory(category.id, name.trim())
    }

    onOpenChange(false)
    onClose()
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        onOpenChange(open)
        if (!open) onClose()
      }}
    >
      <DialogContent>
        <DialogHeader>
          <DialogTitle>编辑分类</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="name">分类名称</Label>
            <Input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="输入分类名称"
              required
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit">保存</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
