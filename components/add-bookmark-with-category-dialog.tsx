"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import websiteDescriptions from '@/data/website-descriptions-1000plus.json'

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
  const [tags, setTags] = useState("")
  const [selectedSubCategoryId, setSelectedSubCategoryId] = useState("")
  const [loading, setLoading] = useState(false)

  const { addBookmark, categories } = useBookmarkStore()

  // 获取所有可用的子分类
  const allSubCategories = categories.flatMap(category => 
    category.subCategories.map(subCategory => ({
      ...subCategory,
      categoryName: category.name
    }))
  )

  // 设置默认选中的分类
  useEffect(() => {
    if (open) {
      if (defaultSubCategoryId && allSubCategories.find(sub => sub.id === defaultSubCategoryId)) {
        setSelectedSubCategoryId(defaultSubCategoryId)
      } else if (allSubCategories.length > 0) {
        setSelectedSubCategoryId(allSubCategories[0].id)
      }
    }
  }, [open, defaultSubCategoryId, allSubCategories])

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    if (!title.trim() || !url.trim() || !selectedSubCategoryId) return

    const tagsArray = tags.trim()
      ? tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      : undefined

    addBookmark({
      title: title.trim(),
      url: url.trim(),
      description: description.trim() || undefined,
      coverImage: coverImage.trim() || undefined,
      tags: tagsArray,
      subCategoryId: selectedSubCategoryId,
    })

    // 重置表单
    setTitle("")
    setUrl("")
    setDescription("")
    setCoverImage("")
    setTags("")
    setSelectedSubCategoryId("")
    onOpenChange(false)
  }

  const handleClose = () => {
    setTitle("")
    setUrl("")
    setDescription("")
    setCoverImage("")
    setTags("")
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
            <Input
              id="tags"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
              placeholder="标签1, 标签2, 标签3"
            />
            <p className="text-xs text-muted-foreground mt-1">用逗号分隔多个标签</p>
          </div>

          <div className="flex justify-end space-x-2">
            <Button type="button" variant="outline" onClick={handleClose}>
              取消
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !selectedSubCategoryId}
            >
              添加
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
