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
  defaultCategoryId?: string // 可选的默认一级分类
  defaultSubCategoryId?: string // 可选的默认子分类
}

// 虚拟分类/子分类 ID（用于"暂无"场景下的占位选项）
const VIRTUAL_SYSTEM_CAT_ID = 'system'
const VIRTUAL_UNCATEGORIZED_SUB_ID = 'uncategorized'
const NEW_DEFAULT_SUB_SENTINEL = '__new_default_sub__'
const DEFAULT_NEW_SUB_NAME = '未分组'

export function AddBookmarkWithCategoryDialog({
  open,
  onOpenChange,
  defaultCategoryId,
  defaultSubCategoryId
}: AddBookmarkWithCategoryDialogProps) {
  const [title, setTitle] = useState("")
  const [url, setUrl] = useState("")
  const [description, setDescription] = useState("")
  const [coverImage, setCoverImage] = useState("")
  const [tags, setTags] = useState<string[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState("")
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("")
  const [loading, setLoading] = useState(false)
  const { addBookmark, categories, bookmarks, ensureUncategorizedExists, ensureSubCategory } = useBookmarkStore()
  const allTagSuggestions = Array.from(new Set(bookmarks.flatMap(b => b.tags || [])))

  // 一级分类下拉选项：真实分类为主，若完全没有则提供"系统"虚拟项
  const categoryOptions = useMemo(() => {
    if (categories.length === 0) {
      return [{ id: VIRTUAL_SYSTEM_CAT_ID, name: '系统', isVirtual: true }]
    }
    return categories.map(c => ({ id: c.id, name: c.name, isVirtual: false }))
  }, [categories])

  // 当前一级分类下的子分类下拉选项
  const subCategoryOptions = useMemo(() => {
    if (!selectedCategoryId) return []
    // 虚拟"系统"分类 → 固定展示"未分类"
    if (selectedCategoryId === VIRTUAL_SYSTEM_CAT_ID && !categories.find(c => c.id === VIRTUAL_SYSTEM_CAT_ID)) {
      return [{ id: VIRTUAL_UNCATEGORIZED_SUB_ID, name: '未分类' }]
    }
    const cat = categories.find(c => c.id === selectedCategoryId)
    const subs = cat?.subCategories ?? []
    // 真实一级下没有子分类 → 展示"未分组（将自动创建）"占位项
    if (subs.length === 0) {
      return [{ id: NEW_DEFAULT_SUB_SENTINEL, name: `${DEFAULT_NEW_SUB_NAME}（将自动创建）` }]
    }
    return subs.map(s => ({ id: s.id, name: s.name }))
  }, [categories, selectedCategoryId])

  // 初始化默认选中：打开对话框时根据 defaultCategoryId / defaultSubCategoryId 推导一级和二级
  useEffect(() => {
    if (!open) return

    // 1) 指定了 defaultSubCategoryId 且能在真实分类里找到 → 直接选中该子分类及其所属一级
    if (defaultSubCategoryId) {
      for (const cat of categories) {
        const sub = cat.subCategories.find(s => s.id === defaultSubCategoryId)
        if (sub) {
          setSelectedCategoryId(cat.id)
          setSelectedSubCategoryId(defaultSubCategoryId)
          return
        }
      }
    }

    // 2) 指定了 defaultCategoryId → 用该一级分类，子分类取其第一个（无则用"未分组"占位）
    if (defaultCategoryId) {
      const cat = categories.find(c => c.id === defaultCategoryId)
      if (cat) {
        setSelectedCategoryId(cat.id)
        setSelectedSubCategoryId(cat.subCategories[0]?.id ?? NEW_DEFAULT_SUB_SENTINEL)
        return
      }
    }

    // 3) 未传入默认值 → 选第一个有子分类的一级分类
    for (const cat of categories) {
      if (cat.subCategories.length > 0) {
        setSelectedCategoryId(cat.id)
        setSelectedSubCategoryId(cat.subCategories[0].id)
        return
      }
    }

    // 4) 有一级但全无二级 → 默认第一个一级 + "未分组（将自动创建）"占位
    if (categories.length > 0) {
      setSelectedCategoryId(categories[0].id)
      setSelectedSubCategoryId(NEW_DEFAULT_SUB_SENTINEL)
      return
    }

    // 5) 完全没有分类 → 虚拟"系统 / 未分类"
    setSelectedCategoryId(VIRTUAL_SYSTEM_CAT_ID)
    setSelectedSubCategoryId(VIRTUAL_UNCATEGORIZED_SUB_ID)
  }, [open, defaultCategoryId, defaultSubCategoryId, categories])

  // 切换一级分类时，自动选中该分类下第一个子分类（或占位项）
  const handleCategoryChange = (catId: string) => {
    setSelectedCategoryId(catId)
    if (catId === VIRTUAL_SYSTEM_CAT_ID && !categories.find(c => c.id === VIRTUAL_SYSTEM_CAT_ID)) {
      setSelectedSubCategoryId(VIRTUAL_UNCATEGORIZED_SUB_ID)
      return
    }
    const cat = categories.find(c => c.id === catId)
    const firstSub = cat?.subCategories[0]
    setSelectedSubCategoryId(firstSub ? firstSub.id : NEW_DEFAULT_SUB_SENTINEL)
  }

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

    // 解析目标子分类 ID：占位项在提交时转化为真实 ID
    let targetSubCategoryId = selectedSubCategoryId
    if (!targetSubCategoryId) return

    if (targetSubCategoryId === VIRTUAL_UNCATEGORIZED_SUB_ID) {
      targetSubCategoryId = ensureUncategorizedExists()
    } else if (targetSubCategoryId === NEW_DEFAULT_SUB_SENTINEL) {
      if (!selectedCategoryId) return
      targetSubCategoryId = ensureSubCategory(selectedCategoryId, DEFAULT_NEW_SUB_NAME)
    }

    if (!targetSubCategoryId) {
      toast.error('创建子分类失败，请重试')
      return
    }

    setLoading(true)

    try {
      // 准备基础书签数据
      let initialTitle = title.trim()
      let initialDescription = description.trim()
      let initialCoverImage = coverImage.trim()

      // 如果没有标题，先尝试从预置数据库快速获取
      const presetData = !initialTitle ? getPresetData(normalizedUrl) : null
      if (presetData) {
        initialTitle = presetData.title
        if (!initialDescription) initialDescription = presetData.description
        if (!initialCoverImage && presetData.coverImage) initialCoverImage = presetData.coverImage
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

      // 立即添加书签（后台增强由 store 内的 startBackgroundEnhancement 统一处理）
      await addBookmark({
        title: initialTitle,
        url: normalizedUrl,
        description: initialDescription || undefined,
        coverImage: initialCoverImage || undefined,
        tags: tagsArray.length ? tagsArray : undefined,
        subCategoryId: targetSubCategoryId,
      })

      // 重置表单并关闭对话框
      setTitle("")
      setUrl("")
      setDescription("")
      setCoverImage("")
      setTags([])
      setSelectedCategoryId("")
      setSelectedSubCategoryId("")
      onOpenChange(false)
      toast.success("书签添加成功")
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
    } finally {
      setLoading(false)
    }
  }

  const handleClose = () => {
    setTitle("")
    setUrl("")
    setDescription("")
    setCoverImage("")
    setTags([])
    setSelectedCategoryId("")
    setSelectedSubCategoryId("")
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) handleClose() }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>添加书签</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>选择分类 *</Label>
            <div className="grid grid-cols-2 gap-2 mt-1.5">
              <Select value={selectedCategoryId} onValueChange={handleCategoryChange}>
                <SelectTrigger>
                  <SelectValue placeholder="一级分类" />
                </SelectTrigger>
                <SelectContent>
                  {categoryOptions.map(cat => (
                    <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select
                value={selectedSubCategoryId}
                onValueChange={setSelectedSubCategoryId}
                disabled={subCategoryOptions.length === 0}
              >
                <SelectTrigger>
                  <SelectValue placeholder="子分类" />
                </SelectTrigger>
                <SelectContent>
                  {subCategoryOptions.map(sub => (
                    <SelectItem key={sub.id} value={sub.id}>{sub.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
              disabled={loading || !selectedCategoryId || !selectedSubCategoryId}
            >
              添加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
