"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import websiteDescriptions from '@/data/website-descriptions-1000plus.json'
import { TagInput } from "@/components/tag-input"
import { toast } from "sonner"

interface AddBookmarkDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  subCategoryId: string
}

export function AddBookmarkDialog({ open, onOpenChange, subCategoryId }: AddBookmarkDialogProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [loading, setLoading] = useState(false)

  const { addBookmark, bookmarks } = useBookmarkStore()
  const allTagSuggestions = Array.from(new Set(bookmarks.flatMap(b => b.tags || [])))

  const getPresetData = (url: string) => {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, '')
      const preset = (websiteDescriptions as any)[domain]

      if (preset) {
        console.log(`✅ 找到预置数据: ${preset.title}`)
        return {
          title: preset.title,
          description: preset.description,
          coverImage: preset.coverImage
        }
      } else {
        console.log(`❌ 未找到预置数据: ${domain}`)
      }
    } catch (error) {
      console.warn('Failed to parse URL:', url, error)
    }
    return null
  }

  const fetchPageTitle = async (url: string) => {
    try {
      // 首先尝试从预置数据库获取
      const presetData = getPresetData(url)
      if (presetData) {
        return presetData.title
      }

      // 如果没有预置数据，提取域名作为备用
      const domain = new URL(url).hostname
      return domain.replace("www.", "")
    } catch {
      return ""
    }
  }

  const handleUrlChange = async (newUrl: string) => {
    setUrl(newUrl)

    if (newUrl && newUrl.startsWith("http")) {
      setLoading(true)
      try {
        // 尝试从预置数据库获取完整信息
        const presetData = getPresetData(newUrl)

        if (presetData) {
          // 如果找到预置数据，自动填充所有字段
          if (!title) setTitle(presetData.title)
          if (!description) setDescription(presetData.description)
          if (!coverImage && presetData.coverImage) setCoverImage(presetData.coverImage)
        } else {
          // 如果没有预置数据，只获取标题
          const pageTitle = await fetchPageTitle(newUrl)
          if (pageTitle && !title) {
            setTitle(pageTitle)
          }
        }
      } catch (error) {
        console.error("Failed to fetch page data:", error)
      } finally {
        setLoading(false)
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !url.trim()) return

    const tagsArray = tags.map(t => t.trim()).filter(t => t.length > 0)

    try {
      await addBookmark({
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
        tags: tagsArray.length ? tagsArray : undefined,
        subCategoryId,
      })
    } catch (err: any) {
      if (err && err.code === 'DUPLICATE_BOOKMARK') {
        // 重复提示：toast + 滚动高亮已有卡片
        toast.warning('该子分类下已存在相同网址的书签')
        const id = err.existingId as string | undefined
        if (id) {
          const el = document.querySelector(`[data-bm-id="${id}"]`) as HTMLElement | null
          if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'center' })
            el.classList.add('ring-2','ring-primary')
            setTimeout(() => el.classList.remove('ring-2','ring-primary'), 1500)
          }
        }
        return
      }
      console.error(err)
      toast.error('添加失败，请重试')
      return
    }

    setTitle("")
    setUrl("")
    setDescription("")
    setCoverImage("")
    setTags([])
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

          <div>
            <Label htmlFor="coverImage">封面图片</Label>
            <Input
              id="coverImage"
              type="url"
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="https://example.com/image.jpg"
            />
          </div>

          <div>
            <Label htmlFor="tags">标签</Label>
            <TagInput
              value={tags}
              onChange={setTags}
              placeholder="输入后回车添加标签，或粘贴逗号/换行分隔的标签"
              suggestions={allTagSuggestions}
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
