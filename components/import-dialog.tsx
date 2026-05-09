"use client"

import type React from "react"

import { useState, useRef } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, FileText, HelpCircle, Globe } from "lucide-react"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useToast } from "@/hooks/use-toast"
// import { useSmartAutoSync } from "@/hooks/use-smart-auto-sync" // 移除，避免多实例
import { ImportHelpDialog } from "@/components/import-help-dialog"
import { TooltipProvider, Tooltip, TooltipTrigger, TooltipContent } from "@/components/ui/tooltip"
import { parseBookmarkHTML } from "@/lib/bookmark-importer"


interface ImportDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function ImportDialog({ open, onOpenChange }: ImportDialogProps) {
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [enableBackgroundEnhancement, setEnableBackgroundEnhancement] = useState(true)
  const [loadingMessage, setLoadingMessage] = useState("")
  const [importStats, setImportStats] = useState<{
    newCategories: number
    newSubCategories: number
    newBookmarks: number
    skippedBookmarks: number
  } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importBookmarks } = useBookmarkStore()
  const { toast } = useToast()
  // 移除同步相关代码，改为纯本地存储

  const processFile = async (file: File) => {
    console.log("开始导入文件:", file.name, file.type)
    setLoading(true)
    setImportStats(null) // 重置统计信息
    setLoadingMessage("正在读取文件...")

    try {
      // 开始导入处理

      const text = await file.text()
      console.log("文件内容长度:", text.length)
      setLoadingMessage("正在解析书签数据...")

      let stats
      if (file.name.endsWith(".html")) {
        console.log("导入HTML格式")
        setLoadingMessage("正在快速导入书签...")
        stats = await importFromHTML(text)
      } else if (file.name.endsWith(".json")) {
        console.log("导入JSON格式")
        setLoadingMessage("正在快速导入书签...")
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

      // 导入完成，数据已保存到本地存储
      console.log('✅ 导入完成，数据已保存到本地存储')

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
      // 出错时立即重置导入状态
      markImportStatus(false)
    } finally {
      // 只在没有新增内容或出错时才在这里重置状态
      // 有新增内容时，状态重置由 markImportCompleted 处理
      setLoading(false)
      setLoadingMessage("")
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
    const stats = await importBookmarks(bookmarkData, { enableBackgroundEnhancement })
    setImportStats(stats)
    return stats
  }

  const importFromJSON = async (json: string) => {
    const rawData = JSON.parse(json)
    console.log("解析JSON得到的原始数据:", rawData)

    // 检测并转换数据格式
    const data = convertToStandardFormat(rawData)
    console.log("转换后的标准格式数据:", data)

    const stats = await importBookmarks(data, { enableBackgroundEnhancement })
    setImportStats(stats)
    return stats
  }

  // 转换不同格式的JSON数据为标准格式
  const convertToStandardFormat = (rawData: any) => {
    // 如果已经是标准格式，直接返回
    if (rawData.bookmarks && rawData.categories) {
      return rawData
    }

    // 如果是 navigation_data 格式，进行转换
    if (rawData.navigations && rawData.categories) {
      console.log("检测到 navigation_data 格式，开始转换...")

      const convertedCategories: any[] = []
      const convertedBookmarks: any[] = []
      const categoryIdMap = new Map<string, string>()
      const subCategoryIdMap = new Map<string, string>()

      // 转换分类
      rawData.categories.forEach((category: any, categoryIndex: number) => {
        const categoryId = `cat_${Date.now()}_${categoryIndex}`
        categoryIdMap.set(category.name, categoryId)

        const convertedSubCategories: any[] = []

        // 转换子分类
        if (category.subcategories) {
          category.subcategories.forEach((subcat: any, subIndex: number) => {
            const subCategoryId = `sub_${Date.now()}_${categoryIndex}_${subIndex}`
            subCategoryIdMap.set(`${category.name}|${subcat.name}`, subCategoryId)

            convertedSubCategories.push({
              id: subCategoryId,
              name: subcat.name,
              parentId: categoryId
            })
          })
        }

        convertedCategories.push({
          id: categoryId,
          name: category.name,
          subCategories: convertedSubCategories
        })
      })

      // 转换书签
      rawData.navigations.forEach((nav: any, navIndex: number) => {
        const subCategoryKey = `${nav.category}|${nav.subcategory}`
        const subCategoryId = subCategoryIdMap.get(subCategoryKey)

        if (subCategoryId) {
          convertedBookmarks.push({
            id: `bm_${Date.now()}_${navIndex}`,
            title: nav.title,
            url: nav.url,
            description: nav.description || nav.url,
            subCategoryId: subCategoryId,
            createdAt: new Date().toISOString()
          })
        } else {
          console.warn(`无法找到子分类: ${subCategoryKey}`)
        }
      })

      console.log(`✅ 转换完成: ${convertedCategories.length} 个分类, ${convertedBookmarks.length} 个书签`)

      return {
        categories: convertedCategories,
        bookmarks: convertedBookmarks
      }
    }

    // 如果格式不识别，抛出错误
    throw new Error("不支持的JSON格式。请确保文件包含 'categories' 和 'bookmarks' 字段，或者是 navigation_data 格式。")
  }


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="pr-10">
          <div className="flex items-center justify-between">
            <DialogTitle>导入书签</DialogTitle>

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
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setHelpOpen(true)}
                      className="text-xs"
                    >
                      <HelpCircle className="w-3 h-3 mr-1" />
                      导入说明
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    查看支持的文件格式与示例
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
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

          {/* 导入选项 */}
          <div className="bg-green-50 dark:bg-green-950/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
            <div className="flex items-start space-x-3">
              <Checkbox
                id="background-enhancement"
                checked={enableBackgroundEnhancement}
                onCheckedChange={(checked) => setEnableBackgroundEnhancement(checked === true)}
                disabled={loading}
              />
              <div className="space-y-1">
                <label
                  htmlFor="background-enhancement"
                  className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                >
                  <div className="flex items-center space-x-2">
                    <Globe className="w-4 h-4 text-green-600" />
                    <span>自动智能增强</span>
                  </div>
                </label>
                <p className="text-xs text-muted-foreground">
                  导入完成后自动在后台为书签获取详细描述和图标，让您的书签更加丰富完整
                </p>
                {enableBackgroundEnhancement ? (
                  <div className="text-xs mt-2 space-y-1">
                    <p className="text-green-600">
                      ✨ 已启用：导入后将自动开始智能增强
                    </p>
                    <p className="text-blue-600">
                      🚀 无感体验：后台处理，不影响正常使用
                    </p>
                    <p className="text-purple-600">
                      📚 预置数据库：已覆盖780+知名网站，瞬间完成
                    </p>
                    <p className="text-gray-600">
                      🔄 保留原创：优先使用您的自定义标题和描述
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-orange-600 mt-1">
                    ⚠️ 未启用：导入的书签将保持原始信息，不会自动增强
                  </p>
                )}
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
                  ? loadingMessage || "导入中..."
                  : dragOver
                    ? "释放文件开始导入"
                    : "点击选择文件或拖拽文件到此处"
                }
              </p>
              {loading ? (
                <div className="flex items-center justify-center space-x-2">
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce"></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-2 h-2 bg-primary rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground">
                  支持 HTML 和 JSON 格式
                </p>
              )}
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
