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
    const cleanUrl = url.toLowerCase().replace(/^https?:\/\//, '').replace(/^www\./, '').replace(/\/$/, '')
    console.log('🔍 查找预置数据，清理后的URL:', cleanUrl)

    // 预置数据库是对象格式，键是域名
    const found = websiteDescriptions[cleanUrl as keyof typeof websiteDescriptions]

    if (found) {
      console.log('✅ 在预置数据库中找到匹配:', cleanUrl, '→', found.title)
      return {
        title: found.title,
        description: found.description,
        coverImage: found.coverImage,
        url: cleanUrl
      }
    } else {
      console.log('❌ 预置数据库中未找到匹配项:', cleanUrl)
      // 尝试部分匹配
      const partialMatch = Object.keys(websiteDescriptions).find(key =>
        key.includes(cleanUrl) || cleanUrl.includes(key)
      )

      if (partialMatch) {
        const data = websiteDescriptions[partialMatch as keyof typeof websiteDescriptions]
        console.log('✅ 找到部分匹配:', partialMatch, '→', data.title)
        return {
          title: data.title,
          description: data.description,
          coverImage: data.coverImage,
          url: cleanUrl
        }
      }
    }

    return null
  }

  // 获取页面标题的函数
  const fetchPageTitle = async (url: string): Promise<string | null> => {
    try {
      console.log('🔍 前端调用API获取标题:', url)
      const response = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`)
      console.log('📄 API响应状态:', response.status)

      if (response.ok) {
        const data = await response.json()
        console.log('✅ API返回数据:', data)
        return data.title
      } else {
        console.log('❌ API响应失败:', response.status)
      }
    } catch (error) {
      console.error("❌ 获取页面标题失败:", error)
    }
    return null
  }

  const handleUrlChange = async (newUrl: string) => {
    console.log('🎯 URL输入变化:', newUrl)
    setUrl(newUrl)

    // 清空之前的自动填充内容（如果URL改变了）
    if (newUrl !== url) {
      console.log('🧹 清空之前的填充内容')
      setTitle("")
      setDescription("")
      setCoverImage("")
    }

    if (newUrl && newUrl.startsWith("http")) {
      console.log('🚀 开始处理URL:', newUrl)
      setLoading(true)
      try {
        // 尝试从预置数据库获取完整信息
        console.log('🔍 查找预置数据库...')
        const presetData = getPresetData(newUrl)

        if (presetData) {
          // 如果找到预置数据，自动填充所有字段
          console.log('✅ 从预置数据库找到信息:', presetData)
          setTitle(presetData.title)
          setDescription(presetData.description)
          if (presetData.coverImage) setCoverImage(presetData.coverImage)
          console.log('✅ 从预置数据库获取到网站信息:', presetData.title)
        } else {
          // 如果没有预置数据，获取页面标题
          console.log('❌ 预置数据库中未找到，开始动态获取标题...')
          const pageTitle = await fetchPageTitle(newUrl)
          if (pageTitle) {
            setTitle(pageTitle)
            console.log('✅ 成功获取网页标题:', pageTitle)
          } else {
            console.log('⚠️ 无法获取网页标题，请手动输入')
          }
        }
      } catch (error) {
        console.error("❌ 获取页面数据失败:", error)
      } finally {
        setLoading(false)
        console.log('🏁 URL处理完成')
      }
    } else {
      console.log('⚠️ URL格式不正确或为空:', newUrl)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !url.trim()) return

    const tagsArray = tags.map(t => t.trim()).filter(t => t.length > 0)

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

    try {
      await addBookmark({
        title: title.trim(),
        url: url.trim(),
        description: description.trim() || undefined,
        coverImage: coverImage.trim() || undefined,
        tags: tagsArray.length ? tagsArray : undefined,
        subCategoryId: targetSubCategoryId!,
      })
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
      console.error(err)
      toast.error('添加失败，请重试')
      return
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
                type="url"
                value={url}
                onChange={(e) => handleUrlChange(e.target.value)}
                placeholder="https://example.com"
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
            <Label htmlFor="title">标题 *</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={loading ? "正在获取标题..." : "网站标题"}
              required
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
