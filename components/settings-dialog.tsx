"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Settings, Palette, BarChart3, Download, Info } from "lucide-react"
import { ThemeCustomizer } from "@/components/theme-customizer"
import { AnalyticsDashboard } from "@/components/analytics-dashboard"
import { ImportDialog } from "@/components/import-dialog"
import { AboutDialog } from "@/components/about-dialog"

interface SettingsDialogProps {
  children?: React.ReactNode
}

export function SettingsDialog({ children }: SettingsDialogProps) {
  const [open, setOpen] = useState(false)
  const [importDialogOpen, setImportDialogOpen] = useState(false)
  const [aboutDialogOpen, setAboutDialogOpen] = useState(false)

  return (
    <>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogTrigger asChild>
          {children || (
            <Button variant="ghost" size="sm">
              <Settings className="h-4 w-4 mr-2" />
              设置
            </Button>
          )}
        </DialogTrigger>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Settings className="w-5 h-5" />
              <span>设置中心</span>
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="theme" className="w-full h-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="theme" className="flex items-center space-x-2">
                <Palette className="w-4 h-4" />
                <span>主题定制</span>
              </TabsTrigger>
              <TabsTrigger value="analytics" className="flex items-center space-x-2">
                <BarChart3 className="w-4 h-4" />
                <span>数据分析</span>
              </TabsTrigger>
              <TabsTrigger value="import" className="flex items-center space-x-2">
                <Download className="w-4 h-4" />
                <span>导入导出</span>
              </TabsTrigger>
              <TabsTrigger value="about" className="flex items-center space-x-2">
                <Info className="w-4 h-4" />
                <span>关于</span>
              </TabsTrigger>
            </TabsList>

            <div className="mt-6 h-[calc(90vh-120px)] overflow-y-auto">
              <TabsContent value="theme" className="mt-0">
                <ThemeCustomizer />
              </TabsContent>

              <TabsContent value="analytics" className="mt-0">
                <AnalyticsDashboard />
              </TabsContent>

              <TabsContent value="import" className="mt-0 space-y-6">
                <div className="max-w-4xl mx-auto p-6">
                  <div className="text-center mb-8">
                    <h3 className="text-2xl font-bold mb-2">数据管理</h3>
                    <p className="text-muted-foreground">
                      导入、导出和备份您的书签数据
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* 导入数据 */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">导入数据</h4>
                      <p className="text-sm text-muted-foreground">
                        从其他书签管理工具或浏览器导入您的书签数据
                      </p>
                      <Button 
                        onClick={() => setImportDialogOpen(true)}
                        className="w-full"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        导入书签
                      </Button>
                    </div>

                    {/* 导出数据 */}
                    <div className="space-y-4">
                      <h4 className="text-lg font-semibold">导出数据</h4>
                      <p className="text-sm text-muted-foreground">
                        将您的书签数据导出为 JSON 或 HTML 格式
                      </p>
                      <div className="space-y-2">
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            // 导出 JSON 格式
                            const { exportBookmarks } = require('@/hooks/use-bookmark-store').useBookmarkStore.getState()
                            const data = exportBookmarks()
                            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.json`
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                        >
                          导出为 JSON
                        </Button>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => {
                            // 导出 HTML 格式
                            const { exportBookmarks } = require('@/hooks/use-bookmark-store').useBookmarkStore.getState()
                            const data = exportBookmarks()
                            
                            let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>Bookmarks</TITLE>
<H1>Bookmarks</H1>
<DL><p>
`
                            
                            data.categories.forEach(category => {
                              html += `    <DT><H3>${category.name}</H3>\n    <DL><p>\n`
                              
                              category.subCategories.forEach(subCategory => {
                                html += `        <DT><H3>${subCategory.name}</H3>\n        <DL><p>\n`
                                
                                const categoryBookmarks = data.bookmarks.filter(b => b.subCategoryId === subCategory.id)
                                categoryBookmarks.forEach(bookmark => {
                                  html += `            <DT><A HREF="${bookmark.url}">${bookmark.title}</A>\n`
                                })
                                
                                html += `        </DL><p>\n`
                              })
                              
                              html += `    </DL><p>\n`
                            })
                            
                            html += `</DL><p>`
                            
                            const blob = new Blob([html], { type: 'text/html' })
                            const url = URL.createObjectURL(blob)
                            const a = document.createElement('a')
                            a.href = url
                            a.download = `bookmarks-${new Date().toISOString().split('T')[0]}.html`
                            a.click()
                            URL.revokeObjectURL(url)
                          }}
                        >
                          导出为 HTML
                        </Button>
                      </div>
                    </div>
                  </div>

                  {/* 数据统计 */}
                  <div className="mt-8 p-6 bg-muted/50 rounded-lg">
                    <h4 className="text-lg font-semibold mb-4">数据统计</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                      <div>
                        <p className="text-2xl font-bold text-primary">--</p>
                        <p className="text-sm text-muted-foreground">总书签数</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-green-500">--</p>
                        <p className="text-sm text-muted-foreground">分类数</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-orange-500">--</p>
                        <p className="text-sm text-muted-foreground">子分类数</p>
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-purple-500">--</p>
                        <p className="text-sm text-muted-foreground">存储大小(KB)</p>
                      </div>
                    </div>
                  </div>

                  {/* 数据清理 */}
                  <div className="mt-8 p-6 border border-destructive/20 rounded-lg">
                    <h4 className="text-lg font-semibold mb-2 text-destructive">危险操作</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      以下操作将永久删除数据，请谨慎操作
                    </p>
                    <div className="space-y-2">
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (confirm('确定要清除所有搜索历史吗？此操作不可撤销。')) {
                            localStorage.removeItem('search-history')
                            localStorage.removeItem('user-activity')
                            alert('搜索历史已清除')
                          }
                        }}
                      >
                        清除搜索历史
                      </Button>
                      <Button 
                        variant="destructive" 
                        size="sm"
                        onClick={() => {
                          if (confirm('确定要重置所有设置吗？此操作不可撤销。')) {
                            localStorage.removeItem('theme-config')
                            localStorage.removeItem('pwa-install-dismissed')
                            localStorage.removeItem('pwa-install-count')
                            alert('设置已重置，请刷新页面')
                          }
                        }}
                      >
                        重置所有设置
                      </Button>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => {
                          if (confirm('确定要清空所有数据吗？此操作将删除所有书签、分类、设置、搜索历史等数据，且不可撤销！')) {
                            if (confirm('最后确认：这将清空应用的所有数据，包括：\n• 所有书签和分类\n• 主题和显示设置\n• 搜索历史和用户活动\n• PWA安装状态\n\n确定要继续吗？')) {
                              // 清空所有localStorage数据
                              localStorage.clear()

                              // 清空sessionStorage（如果有的话）
                              sessionStorage.clear()

                              alert('所有数据已清空，页面将自动刷新')
                              window.location.reload()
                            }
                          }
                        }}
                      >
                        清空所有数据
                      </Button>
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="about" className="mt-0">
                <div className="max-w-4xl mx-auto p-6 text-center space-y-8">
                  <div>
                    <h3 className="text-3xl font-bold mb-4">个人导航中心</h3>
                    <p className="text-lg text-muted-foreground mb-6">
                      一个现代化的个人书签管理和导航工具
                    </p>
                    <div className="inline-flex items-center space-x-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
                      <span className="text-sm font-medium">版本 2.0.0</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="p-6 border rounded-lg">
                      <h4 className="font-semibold mb-2">🚀 现代化设计</h4>
                      <p className="text-sm text-muted-foreground">
                        采用最新的设计理念，提供流畅的用户体验
                      </p>
                    </div>
                    <div className="p-6 border rounded-lg">
                      <h4 className="font-semibold mb-2">📱 响应式布局</h4>
                      <p className="text-sm text-muted-foreground">
                        完美适配桌面、平板和手机设备
                      </p>
                    </div>
                    <div className="p-6 border rounded-lg">
                      <h4 className="font-semibold mb-2">🔒 隐私保护</h4>
                      <p className="text-sm text-muted-foreground">
                        所有数据本地存储，保护您的隐私安全
                      </p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <h4 className="text-xl font-semibold">新功能特性</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left">
                      <div className="space-y-2">
                        <h5 className="font-medium">✨ 智能推荐</h5>
                        <p className="text-sm text-muted-foreground">基于使用习惯的智能书签推荐</p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium">🎨 主题定制</h5>
                        <p className="text-sm text-muted-foreground">丰富的主题选项和个性化设置</p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium">📊 数据分析</h5>
                        <p className="text-sm text-muted-foreground">详细的使用统计和趋势分析</p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium">🔍 增强搜索</h5>
                        <p className="text-sm text-muted-foreground">智能搜索建议和历史记录</p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium">📱 PWA 支持</h5>
                        <p className="text-sm text-muted-foreground">可安装为原生应用，支持离线使用</p>
                      </div>
                      <div className="space-y-2">
                        <h5 className="font-medium">⚡ 性能优化</h5>
                        <p className="text-sm text-muted-foreground">虚拟滚动和懒加载提升性能</p>
                      </div>
                    </div>
                  </div>

                  <div className="pt-6 border-t">
                    <p className="text-sm text-muted-foreground">
                      © 2024 个人导航中心. 使用 Next.js 和 TypeScript 构建.
                    </p>
                  </div>
                </div>
              </TabsContent>
            </div>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* 导入对话框 */}
      <ImportDialog open={importDialogOpen} onOpenChange={setImportDialogOpen} />
      
      {/* 关于对话框 */}
      <AboutDialog open={aboutDialogOpen} onOpenChange={setAboutDialogOpen} />
    </>
  )
}
