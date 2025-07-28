"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"

interface AddCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function AddCategoryDialog({ open, onOpenChange }: AddCategoryDialogProps) {
  const [name, setName] = useState("")
  const [type, setType] = useState<"primary" | "secondary">("primary")
  const [parentCategoryId, setParentCategoryId] = useState("")

  const { categories, addCategory, addSubCategory } = useBookmarkStore()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!name.trim()) return

    if (type === "primary") {
      addCategory(name.trim())
    } else {
      if (!parentCategoryId) return
      addSubCategory(parentCategoryId, name.trim())
    }

    setName("")
    setType("primary")
    setParentCategoryId("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加分类</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="type">分类类型</Label>
            <Select value={type} onValueChange={(value: "primary" | "secondary") => setType(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="primary">一级分类</SelectItem>
                <SelectItem value="secondary">二级分类</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {type === "secondary" && (
            <div>
              <Label htmlFor="parent">父级分类</Label>
              <Select value={parentCategoryId} onValueChange={setParentCategoryId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择父级分类" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

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
            <Button type="submit">添加</Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
