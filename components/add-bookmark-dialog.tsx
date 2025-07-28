"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"

interface AddBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subCategoryId: string
}

export function AddBookmarkDialog({ open, onOpenChange, subCategoryId }: AddBookmarkDialogProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [loading, setLoading] = useState(false)

  const { addBookmark } = useBookmarkStore()

  const fetchPageTitle = async (url: string) => {
    try {
      // In a real app, you'd need a backend service to fetch page titles due to CORS
      // For now, we'll extract domain name as fallback
      const domain = new URL(url).hostname
      return domain.replace("www.", "")
    } catch {
      return ""
    }
  }

  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl)

    if (newUrl && !title && newUrl.startsWith("http")) {
      setLoading(true)
      try {
        const pageTitle = await fetchPageTitle(newUrl)
        if (pageTitle && !title) {
          setTitle(pageTitle)
        }
      } catch (error) {
        console.error("Failed to fetch page title:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !url.trim()) return

    addBookmark({
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || undefined,
      subCategoryId,
    })

    setTitle("")
    setUrl("")
    setDescription("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>添加书签</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="url">网址 *</Label>
            <Input
              id="url"
              type="url"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="https://example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="网站标题"
              required
              disabled={loading}
            />
            {loading && <p className="text-xs text-muted-foreground mt-1">正在获取页面标题...</p>}
          </div>

          <div>
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="简短描述这个网站的用途"
              rows={3}
            />
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              添加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
