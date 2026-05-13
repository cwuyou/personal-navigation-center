"use client"

import { useState, useRef, useEffect } from "react"
import { Upload, Info, Settings, FileText, HelpCircle, Plus, Home, Download, MoreHorizontal, Eye } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubTrigger,
  DropdownMenuSubContent,
  DropdownMenuPortal,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipTrigger, TooltipContent, TooltipProvider } from "@/components/ui/tooltip"
import { ImportDialog } from "@/components/import-dialog"
import { AboutDialog } from "@/components/about-dialog"
import { DataManagementDialog } from "@/components/data-management-dialog"
import { ImportHelpDialog } from "@/components/import-help-dialog"

import { EnhancedSearch } from "@/components/enhanced-search"
import { AddBookmarkWithCategoryDialog } from "@/components/add-bookmark-with-category-dialog"
import { QuickDisplaySettingsContent } from "@/components/quick-display-settings-content"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useToast } from "@/hooks/use-toast"
import { parseBookmarkHTML } from "@/lib/bookmark-importer"
import type { SearchFilters } from "@/lib/search-utils"

interface HeaderProps {
  searchQuery: string
  onSearchChange: (query: string) => void
  searchFilters?: SearchFilters
  onSearchFiltersChange?: (filters: SearchFilters) => void
  onLogoClick?: () => void
  onSettingsClick?: () => void
  selectedCategory?: string | null
  selectedSubCategory?: string | null
}

export function Header({ searchQuery, onSearchChange, searchFilters, onSearchFiltersChange, onLogoClick, onSettingsClick, selectedCategory, selectedSubCategory }: HeaderProps) {
  const [importDialogOpen, setImportDialogOpen] = useState(false)

  // 监听从页面发出的“打开导入对话框”事件（用于空态/Onboarding）
  useEffect(() => {
    const handler = () => setImportDialogOpen(true)
    window.addEventListener('open-import-dialog' as any, handler)
    return () => window.removeEventListener('open-import-dialog' as any, handler)
  }, [])
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)
  const [helpOpen, setHelpOpen] = useState(false)
  const [dataDialogOpen, setDataDialogOpen] = useState(false)


  const [addBookmarkOpen, setAddBookmarkOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const { importBookmarks, categories } = useBookmarkStore()
  const { exportBookmarks } = useBookmarkStore()

  const handleExport = (type: 'json' | 'html' | 'csv' | 'txt' = 'json') => {
    const data = exportBookmarks()

    const download = (blob: Blob, ext: string) => {
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `bookmarks-export-${new Date().toISOString().slice(0,10)}.${ext}`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    }

    if (type === 'json') {
      download(new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' }), 'json')
      return
    }

    if (type === 'html') {
      const html = generateNetscapeHTML(data)
      download(new Blob([html], { type: 'text/html' }), 'html')
      return
    }

    if (type === 'csv') {
      const { categories, bookmarks } = data
      const subMap = new Map<string, { category: string; sub: string }>()
      categories.forEach(cat => (cat.subCategories || []).forEach(sub => {
        subMap.set(sub.id, { category: cat.name, sub: sub.name })
      }))
      const esc = (s: any) => '"' + String(s ?? '').replace(/"/g, '""') + '"'
      const header = ['Title','URL','Description','Category','SubCategory']
      const lines = [header.join(',')]
      bookmarks.forEach(bm => {
        const names = subMap.get(bm.subCategoryId) || { category: '', sub: '' }
        lines.push([
          esc(bm.title || bm.url),
          esc(bm.url || ''),
          esc(bm.description || ''),
          esc(names.category),
          esc(names.sub),
        ].join(','))
      })
      download(new Blob([lines.join('\r\n')], { type: 'text/csv' }), 'csv')
      return
    }

    if (type === 'txt') {
      const { bookmarks } = data
      const content = bookmarks.map(b => `${b.title || b.url} - ${b.url}`).join('\n')
      download(new Blob([content], { type: 'text/plain' }), 'txt')
      return
    }
  }

  const generateNetscapeHTML = (data: ReturnType<typeof exportBookmarks>) => {
    const { categories, bookmarks } = data
    const lines: string[] = []
    lines.push('<!DOCTYPE NETSCAPE-Bookmark-file-1>')
    lines.push('<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">')
    lines.push('<TITLE>Bookmarks</TITLE>')
    lines.push('<H1>Bookmarks</H1>')
    lines.push('<DL><p>')

    // 将分类和子分类映射，输出为两层文件夹
    for (const cat of categories) {
      lines.push(`    <DT><H3>${cat.name}</H3>`) // 一级分类
      lines.push('    <DL><p>')
      const subs = cat.subCategories || []
      for (const sub of subs) {
        lines.push(`        <DT><H3>${sub.name}</H3>`) // 二级分类
        lines.push('        <DL><p>')
        for (const bm of bookmarks.filter(b => b.subCategoryId === sub.id)) {
          const title = bm.title?.replace(/\n/g, ' ') || bm.url
          lines.push(`            <DT><A HREF="${bm.url}">${title}</A>`)
        }
        lines.push('        </DL><p>')
      }
      lines.push('    </DL><p>')
    }

    lines.push('</DL><p>')
    return lines.join('\n')
  }

  const { toast } = useToast()

  // 获取默认的一级分类ID（用于全局添加书签）
  const getDefaultCategoryId = () => {
    if (selectedCategory) return selectedCategory
    // 回退到当前选中的子分类所属的一级
    if (selectedSubCategory) {
      const parent = categories.find(cat => cat.subCategories.some(sub => sub.id === selectedSubCategory))
      if (parent) return parent.id
    }
    return categories[0]?.id ?? null
  }

  // 获取默认的子分类ID（用于全局添加书签）
  const getDefaultSubCategoryId = () => {
    if (selectedSubCategory) return selectedSubCategory

    // 优先用当前选中一级分类下的第一个子分类
    if (selectedCategory) {
      const cat = categories.find(c => c.id === selectedCategory)
      if (cat && cat.subCategories.length > 0) return cat.subCategories[0].id
    }

    // 否则使用第一个可用的子分类
    for (const category of categories) {
      if (category.subCategories.length > 0) {
        return category.subCategories[0].id
      }
    }
    return null
  }

  const processFile = async (file: File) => {
    console.log("开始导入文件:", file.name, file.type)
    setLoading(true)

    try {
      const text = await file.text()
      console.log("文件内容长度:", text.length)

      if (file.name.endsWith(".html")) {
        console.log("导入HTML格式")
        await importFromHTML(text)
      } else if (file.name.endsWith(".json")) {
        console.log("导入JSON格式")
        await importFromJSON(text)
      } else {
        throw new Error("不支持的文件格式")
      }

      console.log("导入成功")
      toast({
        title: "导入成功",
        description: "书签已成功导入到您的导航中心",
      })
    } catch (error) {
      console.error("导入失败:", error)
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "导入过程中发生错误",
        variant: "destructive",
      })
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
    await importBookmarks(bookmarkData, { enableBackgroundEnhancement: true })
  }

  const importFromJSON = async (json: string) => {
    const data = JSON.parse(json)
    console.log("解析JSON得到的数据:", data)
    await importBookmarks(data, { enableBackgroundEnhancement: true })
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center space-x-4">
          <div
            className="flex items-center space-x-2 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={onLogoClick}
            role="banner"
          >
            <Home className="h-6 w-6 text-primary" aria-hidden="true" />
            <h1 className="text-xl sm:text-2xl font-bold">
              <span className="sr-only">My Homepage - </span>
              My Homepage
              <span className="sr-only"> - Personal Start Page & Bookmark Manager</span>
            </h1>
          </div>
        </div>

        <EnhancedSearch
          searchQuery={searchQuery}
          onSearchChange={onSearchChange}
          filters={searchFilters}
          onFiltersChange={onSearchFiltersChange}
        />

        <div className="flex items-center space-x-2">
          {/* 添加书签按钮（无分类时展示提示） */}
          {(() => {
            const isAddDisabled = categories.length === 0 || categories.every(cat => cat.subCategories.length === 0)
            return (
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className="inline-flex">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => setAddBookmarkOpen(true)}
                        disabled={isAddDisabled}
                        className="bg-gradient-to-r from-primary to-primary/90 hover:from-primary/90 hover:to-primary/80 font-semibold"
                        title="添加书签"
                      >
                        <Plus className="h-4 w-4 sm:mr-2" />
                        <span className="hidden sm:inline">书签</span>
                      </Button>
                    </span>
                  </TooltipTrigger>
                  {isAddDisabled && (
                    <TooltipContent>
                      需要先创建一个分类/子分类，或点击右侧“导入”导入书签
                    </TooltipContent>
                  )}
                </Tooltip>
              </TooltipProvider>
            )
          })()}

          {/* 导入按钮 - 卡片式（紧邻添加书签） */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10" title="导入书签">
                <Upload className="h-4 w-4 sm:mr-2" />
                <span className="hidden sm:inline">导入</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              className="w-96 p-0 shadow-xl border border-border/20 bg-background/95 backdrop-blur-sm rounded-lg animate-in slide-in-from-top-2 duration-200"
              align="end"
              sideOffset={8}
            >
              <Card className="border-0 shadow-none">
                <CardContent className="p-4">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <Upload className="h-5 w-5 text-primary" />
                        <h3 className="font-semibold text-sm">导入书签</h3>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setHelpOpen(true)}
                        className="text-xs text-muted-foreground hover:text-foreground"
                      >
                        <HelpCircle className="w-3 h-3 mr-1" />
                        格式说明
                      </Button>
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
                      className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
                        dragOver
                          ? "border-primary bg-primary/5"
                          : "border-muted-foreground/25 hover:border-muted-foreground/50"
                      } ${loading ? "pointer-events-none opacity-50" : ""}`}
                      onClick={() => !loading && fileInputRef.current?.click()}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                    >
                      <Upload className={`w-8 h-8 mx-auto mb-2 ${
                        dragOver ? "text-primary" : "text-muted-foreground"
                      }`} />
                      <div className="space-y-1">
                        <p className="text-xs font-medium">
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
                  </div>
                </CardContent>
              </Card>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button variant="ghost" size="sm" onClick={onSettingsClick} className="hover:bg-primary/10" title="设置">
            <Settings className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">设置</span>
          </Button>

          {/* 更多菜单：显示/导出/帮助/关于 */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="hover:bg-primary/10" title="更多">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">更多</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" sideOffset={8} className="w-48">
              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Eye className="mr-2 h-4 w-4" />
                  <span>显示</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-80 p-0">
                    <QuickDisplaySettingsContent />
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSub>
                <DropdownMenuSubTrigger>
                  <Download className="mr-2 h-4 w-4" />
                  <span>导出</span>
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent className="w-40">
                    <DropdownMenuItem onClick={() => handleExport('html')}>
                      <FileText className="mr-2 h-4 w-4 text-blue-500" />
                      <span>HTML</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('json')}>
                      <FileText className="mr-2 h-4 w-4 text-green-500" />
                      <span>JSON</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('csv')}>
                      <FileText className="mr-2 h-4 w-4 text-amber-500" />
                      <span>CSV</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => handleExport('txt')}>
                      <FileText className="mr-2 h-4 w-4 text-purple-500" />
                      <span>TXT</span>
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <Link href="/">
                  <Home className="mr-2 h-4 w-4" />
                  <span>产品首页</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <Link href="/help">
                  <HelpCircle className="mr-2 h-4 w-4" />
                  <span>帮助</span>
                </Link>
              </DropdownMenuItem>

              <DropdownMenuItem onClick={() => setAboutDialogOpen(true)}>
                <Info className="mr-2 h-4 w-4" />
                <span>关于</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          <DataManagementDialog
            open={dataDialogOpen}
            onOpenChange={setDataDialogOpen}
          />
        </div>
      </div>

      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      <AboutDialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen} />

      <ImportHelpDialog open={helpOpen} onOpenChange={setHelpOpen} />


      {/* 全局添加书签对话框 */}
      <AddBookmarkWithCategoryDialog
        open={addBookmarkOpen}
        onOpenChange={setAddBookmarkOpen}
        defaultCategoryId={getDefaultCategoryId() || undefined}
        defaultSubCategoryId={getDefaultSubCategoryId() || undefined}
      />
    </header>
  )
}
