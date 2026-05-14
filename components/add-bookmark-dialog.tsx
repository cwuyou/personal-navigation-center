"use client"

import type React from "react"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { loadWebsiteDescriptions } from "@/lib/website-descriptions"
import { TagInput } from "@/components/tag-input"
import { toast } from "sonner"
import { processUserInput } from "@/lib/url-utils"

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

  const getPresetData = async (url: string) => {
    try {
      const websiteDescriptions = await loadWebsiteDescriptions()
      const domain = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
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
        // 尝试部分匹配（例如子域名匹配）
        const partialMatch = Object.keys(websiteDescriptions).find(key =>
          key.includes(domain) || domain.includes(key)
        )

        if (partialMatch) {
          const data = websiteDescriptions[partialMatch as keyof typeof websiteDescriptions]
          console.log('✅ 找到部分匹配:', partialMatch, '→', data.title)
          return {
            title: data.title,
            description: data.description,
            coverImage: data.coverImage
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse URL:', url, error)
    }
    return null
  }

  const fetchWebsiteMetadata = async (url: string) => {
    try {
      const { fetchMetadataDeduped } = await import('@/lib/request-deduplicator')
      const data = await fetchMetadataDeduped(url)
      return data
    } catch (error) {
      return null
    }
  }

  const handleUrlChange = (newUrl: string) => {
    // 直接更新URL状态，保持用户输入的原始状态
    setUrl(newUrl)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!url.trim()) {
      toast.error('请输入网址')
      return
    }

    // 处理和规范化URL
    const { normalizedUrl, isValid } = processUserInput(url.trim())

    if (!isValid) {
      toast.error('请输入有效的网址')
      return
    }

    setLoading(true)

    try {
      // 准备基础书签数据
      let initialTitle = title.trim()
      let initialDescription = description.trim()
      let initialCoverImage = coverImage.trim()

      // 如果没有标题，先尝试从预置数据库快速获取
      if (!initialTitle) {
        const presetData = await getPresetData(normalizedUrl)
        if (presetData) {
          initialTitle = presetData.title
          if (!initialDescription) initialDescription = presetData.description
          if (!initialCoverImage && presetData.coverImage) initialCoverImage = presetData.coverImage
        }
      }

      // 如果还是没有标题，使用域名作为临时标题
      if (!initialTitle) {
        try {
          const domain = new URL(normalizedUrl).hostname.replace(/^www\./, '')
          initialTitle = domain
        } catch {
          initialTitle = '新书签'
        }
      }

      const tagsArray = tags.map(t => t.trim()).filter(t => t.length > 0)

      // 立即添加书签（使用基础信息）
      await addBookmark({
        title: initialTitle,
        url: normalizedUrl,
        description: initialDescription || undefined,
        coverImage: initialCoverImage || undefined,
        tags: tagsArray.length ? tagsArray : undefined,
        subCategoryId,
      })

      // 立即重置表单并关闭对话框
      setTitle("")
      setUrl("")
      setDescription("")
      setCoverImage("")
      setTags([])
      setLoading(false)
      onOpenChange(false)
      toast.success("书签添加成功")

      // 如果没有从预置数据库获取到完整信息，在后台异步获取元数据
      if (!(await getPresetData(normalizedUrl))) {
        // 后台异步获取元数据（不阻塞用户界面）
        fetchWebsiteMetadata(normalizedUrl).then(metadata => {
          if (metadata && (metadata.title || metadata.description || metadata.coverImage)) {
            // 实际的更新会通过 addBookmark 中的增强逻辑自动处理
          }
        }).catch(() => {
          // 静默处理错误，不影响用户体验
        })
      }
      return // 提前返回，避免执行 finally 块
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
    } finally {
      setLoading(false)
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
              type="text"
              value={url}
              onChange={(e) => handleUrlChange(e.target.value)}
              placeholder="google.com 或 https://example.com"
              required
            />
          </div>

          <div>
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="留空将自动获取网站标题"
              disabled={loading}
            />
            {loading && <p className="text-xs text-muted-foreground mt-1">正在获取网站信息...</p>}
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
