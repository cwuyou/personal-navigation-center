"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Upload, FileText, HelpCircle } from "lucide-react"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useToast } from "@/hooks/use-toast"
import { ImportHelpDialog } from "@/components/import-help-dialog"

interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [importStats, setImportStats] = useState<{
    newCategories: number
    newSubCategories: number
    newBookmarks: number
    skippedBookmarks: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importBookmarks } = useBookmarkStore()
  const { toast } = useToast()

  const processFile = async (file: File) => {
    console.log("开始导入文件:", file.name, file.type)
    setLoading(true)
    setImportStats(null) // 重置统计信息

    try {
      const text = await file.text()
      console.log("文件内容长度:", text.length)

      let stats
      if (file.name.endsWith(".html")) {
        console.log("导入HTML格式")
        stats = await importFromHTML(text)
      } else if (file.name.endsWith(".json")) {
        console.log("导入JSON格式")
        stats = await importFromJSON(text)
      } else {
        throw new Error("不支持的文件格式")
      }

      console.log("导入成功", stats)

      // 生成详细的导入结果描述
      const descriptions = []
      if (stats.newCategories > 0) descriptions.push(`新增 ${stats.newCategories} 个分类`)
      if (stats.newSubCategories > 0) descriptions.push(`新增 ${stats.newSubCategories} 个子分类`)
      if (stats.newBookmarks > 0) descriptions.push(`新增 ${stats.newBookmarks} 个书签`)
      if (stats.skippedBookmarks > 0) descriptions.push(`跳过 ${stats.skippedBookmarks} 个重复书签`)

      const description = descriptions.length > 0
        ? descriptions.join('，')
        : '没有新增内容（所有数据已存在）'

      toast({
        title: "导入完成",
        description: description,
      })

      // 不立即关闭对话框，让用户查看统计信息
      // onOpenChange(false)
    } catch (error) {
      console.error("导入失败:", error)
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "导入过程中发生错误",
        variant: "destructive",
      })
      setImportStats(null)
    } finally {
      setLoading(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }
    }
  }

  const handleFileSelect = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    await processFile(file)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(true)
  }

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
  }

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    const file = files[0]

    if (!file) return

    // 检查文件类型
    if (!file.name.endsWith('.html') && !file.name.endsWith('.json')) {
      toast({
        title: "文件格式不支持",
        description: "请选择 HTML 或 JSON 格式的文件",
        variant: "destructive",
      })
      return
    }

    await processFile(file)
  }

  const importFromHTML = async (html: string) => {
    const parser = new DOMParser()
    const doc = parser.parseFromString(html, "text/html")
    const bookmarkData = parseBookmarkHTML(doc)
    console.log("解析HTML得到的数据:", bookmarkData)
    const stats = await importBookmarks(bookmarkData)
    setImportStats(stats)
    return stats
  }

  const importFromJSON = async (json: string) => {
    const data = JSON.parse(json)
    console.log("解析JSON得到的数据:", data)
    const stats = await importBookmarks(data)
    setImportStats(stats)
    return stats
  }

  const parseBookmarkHTML = (doc: Document) => {
    const categories: any[] = []
    const bookmarks: any[] = []

    // Find all DT elements which typically contain folders or bookmarks
    const dtElements = doc.querySelectorAll("dt")

    dtElements.forEach((dt) => {
      const h3 = dt.querySelector("h3")
      const a = dt.querySelector("a")

      if (h3) {
        // This is a folder/category
        const categoryName = h3.textContent?.trim() || "Unnamed Category"
        const categoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

        const category = {
          id: categoryId,
          name: categoryName,
          subCategories: [],
        }

        // Look for nested folders and bookmarks
        const nextDl = dt.querySelector("dl")
        if (nextDl) {
          const subDts = nextDl.querySelectorAll("dt")
          const subCategoryId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          category.subCategories.push({
            id: subCategoryId,
            name: "Default",
            parentId: categoryId,
          })

          subDts.forEach((subDt) => {
            const subA = subDt.querySelector("a")
            if (subA) {
              bookmarks.push({
                id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                title: subA.textContent?.trim() || "Unnamed Bookmark",
                url: subA.getAttribute("href") || "",
                subCategoryId: subCategoryId,
              })
            }
          })
        }

        categories.push(category)
      } else if (a) {
        // This is a direct bookmark (not in a folder)
        if (categories.length === 0) {
          // Create a default category
          const defaultCategoryId = `cat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
          const defaultSubCategoryId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`

          categories.push({
            id: defaultCategoryId,
            name: "Imported Bookmarks",
            subCategories: [
              {
                id: defaultSubCategoryId,
                name: "Default",
                parentId: defaultCategoryId,
              },
            ],
          })
        }

        const lastCategory = categories[categories.length - 1]
        const subCategoryId = lastCategory.subCategories[0]?.id

        if (subCategoryId) {
          bookmarks.push({
            id: `bm_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            title: a.textContent?.trim() || "Unnamed Bookmark",
            url: a.getAttribute("href") || "",
            subCategoryId: subCategoryId,
          })
        }
      }
    })

    return { categories, bookmarks }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <div className="flex items-center justify-between">
            <DialogTitle>导入书签</DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setHelpOpen(true)}
              className="text-muted-foreground hover:text-foreground"
            >
              <HelpCircle className="w-4 h-4 mr-1" />
              格式说明
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {/* 导入统计信息 */}
          {importStats && (
            <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
              <div className="flex items-center space-x-2 mb-3">
                <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                <h3 className="font-medium text-green-800 dark:text-green-200">导入完成</h3>
              </div>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">新增分类：</span>
                    <span className="font-medium">{importStats.newCategories}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">新增子分类：</span>
                    <span className="font-medium">{importStats.newSubCategories}</span>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">新增书签：</span>
                    <span className="font-medium text-green-600">{importStats.newBookmarks}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">跳过重复：</span>
                    <span className="font-medium text-orange-600">{importStats.skippedBookmarks}</span>
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-green-200 dark:border-green-800">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">
                    智能去重已启用，避免了重复导入
                  </span>
                  <Button
                    size="sm"
                    onClick={() => onOpenChange(false)}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    完成
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-muted/30 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-medium">支持的文件格式</h3>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setHelpOpen(true)}
                className="text-xs"
              >
                <HelpCircle className="w-3 h-3 mr-1" />
                详细说明
              </Button>
            </div>
            <div className="text-sm text-muted-foreground space-y-2">
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-500" />
                <span>HTML 文件（浏览器书签导出）</span>
              </div>
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-green-500" />
                <span>JSON 文件（自定义格式）</span>
              </div>
              <div className="text-xs text-muted-foreground mt-2 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border-l-2 border-blue-500">
                💡 智能导入：自动匹配现有分类，避免重复书签
              </div>
            </div>
          </div>

          {/* 隐藏的文件输入框 */}
          <input
            ref={fileInputRef}
            type="file"
            accept=".html,.json"
            onChange={handleFileSelect}
            disabled={loading}
            className="hidden"
          />

          {/* 文件选择区域 */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
              dragOver
                ? "border-primary bg-primary/5"
                : "border-muted-foreground/25 hover:border-muted-foreground/50"
            } ${loading ? "pointer-events-none opacity-50" : ""}`}
            onClick={() => !loading && fileInputRef.current?.click()}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            <Upload className={`w-12 h-12 mx-auto mb-4 ${
              dragOver ? "text-primary" : "text-muted-foreground"
            }`} />
            <div className="space-y-2">
              <p className="text-sm font-medium">
                {loading
                  ? "导入中..."
                  : dragOver
                    ? "释放文件开始导入"
                    : "点击选择文件或拖拽文件到此处"
                }
              </p>
              <p className="text-xs text-muted-foreground">
                支持 HTML 和 JSON 格式
              </p>
            </div>
          </div>

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              取消
            </Button>
          </div>
        </div>
      </DialogContent>

      <ImportHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />
    </Dialog>
  )
}
