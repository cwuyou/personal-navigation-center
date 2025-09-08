"use client"

import type React from "react"

import { useState, useEffect, useMemo } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import websiteDescriptions from '@/data/website-descriptions-1000plus.json'
import { TagInput } from "@/components/tag-input"
import { toast } from "sonner"
import { processUserInput } from "@/lib/url-utils"
import { logger } from "@/lib/logger"

interface AddBookmarkWithCategoryDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  defaultSubCategoryId?: string // 可选的默认分类
}

export function AddBookmarkWithCategoryDialog({
  open,
  onOpenChange,
  defaultSubCategoryId
}: AddBookmarkWithCategoryDialogProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("")
  const [loading, setLoading] = useState(false)
  // 首次添加书签（已有一级但无二级）引导字段
  const { addBookmark, categories, bookmarks, ensureUncategorizedExists, ensureSubCategory } = useBookmarkStore()
  const allTagSuggestions = Array.from(new Set(bookmarks.flatMap(b => b.tags || [])))
  const totalSubCount = categories.reduce((sum, c) => sum + c.subCategories.length, 0)
  const firstSubcase = categories.length > 0 && totalSubCount === 0
  const [firstParentId, setFirstParentId] = useState<string>("")
  const [firstSubName, setFirstSubName] = useState<string>("未分组")

  useEffect(() => {
    if (firstSubcase) {
      const firstCat = categories[0]
      setFirstParentId(firstCat?.id || "")
    }
  }, [firstSubcase, categories])

  // 获取所有可用的子分类（使用 useMemo 避免每次渲染都创建新数组导致副作用反复触发）
  // 仅当完全没有任何一级分类时，才提供“未分类”占位
  const allSubCategories = useMemo(() => {
    const list = categories.flatMap(category =>
      category.subCategories.map(subCategory => ({
        ...subCategory,
        categoryName: category.name
      }))
    )
    if (categories.length === 0 && list.length === 0) {
      return [{ id: 'uncategorized', name: '未分类', parentId: 'system', categoryName: '系统' } as any]
    }
    return list
  }, [categories])

  // 设置默认选中的分类（仅当未选择或选择的项不再存在时才设定，避免覆盖用户操作）
  useEffect(() => {
    if (!open) return
    const exists = selectedSubCategoryId && allSubCategories.some(sub => sub.id === selectedSubCategoryId)
    if (defaultSubCategoryId && allSubCategories.some(sub => sub.id === defaultSubCategoryId)) {
      // 如果传入了默认二级分类且存在，优先使用
      setSelectedSubCategoryId(prev => (prev ? prev : defaultSubCategoryId))
      return
    }
    if (!exists && allSubCategories.length > 0) {
      setSelectedSubCategoryId(allSubCategories[0].id)
    }
  }, [open, defaultSubCategoryId, allSubCategories, selectedSubCategoryId])

  // 获取预置数据的函数
  const getPresetData = (url: string) => {
    try {
      // 🔧 修复：正确提取域名，而不是保留完整路径
      const domain = new URL(url).hostname.replace(/^www\./, '').toLowerCase()
      logger.debug('🔍 查找预置数据，提取的域名:', domain)

      // 预置数据库是对象格式，键是域名
      const found = websiteDescriptions[domain as keyof typeof websiteDescriptions]

      if (found) {
        logger.debug('✅ 在预置数据库中找到匹配:', domain, '→', found.title)
        return {
          title: found.title,
          description: found.description,
          coverImage: found.coverImage,
          url: domain
        }
      } else {
        logger.debug('❌ 预置数据库中未找到匹配项:', domain)
        // 尝试部分匹配（例如子域名匹配）
        const partialMatch = Object.keys(websiteDescriptions).find(key =>
          key.includes(domain) || domain.includes(key)
        )

        if (partialMatch) {
          const data = websiteDescriptions[partialMatch as keyof typeof websiteDescriptions]
          logger.debug('✅ 找到部分匹配:', partialMatch, '→', data.title)
          return {
            title: data.title,
            description: data.description,
            coverImage: data.coverImage,
            url: domain
          }
        }
      }
    } catch (error) {
      logger.warn('Failed to parse URL for preset data:', url, error)
    }

    return null
  }

  // 获取网站完整元数据的函数
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

    // 首次添加：先确保创建一个子分类
    let targetSubCategoryId = selectedSubCategoryId
    if (firstSubcase) {
      if (!firstParentId) return
      const name = firstSubName?.trim() || '未分组'
      targetSubCategoryId = ensureSubCategory(firstParentId, name)
    } else {
      if (!selectedSubCategoryId) return
      if (selectedSubCategoryId === 'uncategorized') {
        targetSubCategoryId = ensureUncategorizedExists()
      }
    }

    setLoading(true)

    try {
      // 准备基础书签数据
      let initialTitle = title.trim()
      let initialDescription = description.trim()
      let initialCoverImage = coverImage.trim()

      // 如果没有标题，先尝试从预置数据库快速获取
      if (!initialTitle) {
        const presetData = getPresetData(normalizedUrl)
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
        subCategoryId: targetSubCategoryId!,
      })

      // 立即重置表单并关闭对话框
      setTitle("")
      setUrl("")
      setDescription("")
      setCoverImage("")
      setTags([])
      setSelectedSubCategoryId("")
      setLoading(false)
      onOpenChange(false)
      toast.success("书签添加成功")

      // 如果没有从预置数据库获取到完整信息，在后台异步获取元数据
      if (!getPresetData(normalizedUrl)) {
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
      logger.error(err)
      toast.error('添加失败，请重试')
      return
    } finally {
      setLoading(false)
    }

    // 重置表单
    setTitle("")
    setUrl("")
    setDescription("")
    setCoverImage("")
    setTags([])
    setSelectedSubCategoryId("")
    onOpenChange(false)
  }

  const handleClose = () => {
    setTitle("")
    setUrl("")
    setDescription("")
    setCoverImage("")
    setTags([])
    setSelectedSubCategoryId("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加书签</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="category">选择分类 *</Label>

	          {firstSubcase && (
	            <div className="space-y-2">
	              <Label>首次添加引导</Label>
	              <div className="grid grid-cols-1 gap-2">
	                <div>
	                  <Label>父级分类</Label>
	                  <Select value={firstParentId} onValueChange={setFirstParentId}>
	                    <SelectTrigger>
	                      <SelectValue placeholder="选择父级分类" />
	                    </SelectTrigger>
	                    <SelectContent>
	                      {categories.map(cat => (
	                        <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
	                      ))}
	                    </SelectContent>
	                  </Select>
	                </div>
	                <div>
	                  <Label>子分类名称</Label>
	                  <Input value={firstSubName} onChange={(e) => setFirstSubName(e.target.value)} placeholder="未分组" />
	                </div>
	              </div>
	            </div>
	          )}

	            {!firstSubcase && (
	              <Select value={selectedSubCategoryId} onValueChange={setSelectedSubCategoryId}>
	                <SelectTrigger>
	                  <SelectValue placeholder="请选择分类" />
	                </SelectTrigger>
	                <SelectContent>
	                  {allSubCategories.map((subCategory) => (
	                    <SelectItem key={subCategory.id} value={subCategory.id}>
	                      {subCategory.categoryName} / {subCategory.name}
	                    </SelectItem>
	                  ))}
	                </SelectContent>
	              </Select>
	            )}


          </div>

          <div>
            <Label htmlFor="url">网址 *</Label>
            <div className="relative">
              <Input
                id="url"
                type="text"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="google.com 或 https://example.com"
                required
                disabled={loading}
              />
              {loading && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                </div>
              )}
            </div>
            {loading && (
              <p className="text-xs text-muted-foreground mt-1">正在获取网站信息...</p>
            )}
          </div>

          <div>
            <Label htmlFor="title">标题</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={loading ? "正在获取网站信息..." : "留空将自动获取网站标题"}
              disabled={loading}
            />
            {!title && !loading && url && (
              <p className="text-xs text-muted-foreground mt-1">
                输入网址后将自动获取标题，或手动输入
              </p>
            )}
          </div>

          <div>
            <Label htmlFor="description">描述</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="网站描述"
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
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button
              type="submit"
              disabled={loading || !(firstSubcase ? Boolean(firstParentId && firstSubName.trim()) : Boolean(selectedSubCategoryId))}
            >
              添加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
