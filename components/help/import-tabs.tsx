"use client"

import { useEffect, useState } from 'react'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { FileText, Code, Download } from 'lucide-react'
import { DownloadSampleHTMLButton, DownloadSampleJSONButton } from '@/components/help/download-buttons'
import { CopyablePre } from '@/components/ui/copyable-pre'

export type HelpTab = 'overview' | 'html' | 'json' | 'browser'

export function ImportHelpTabs() {
  const [tab, setTab] = useState<HelpTab>('overview')

  // 记住上次查看的 Tab
  useEffect(() => {
    const last = typeof window !== 'undefined' ? (localStorage.getItem('help:tab') as HelpTab | null) : null
    if (last) setTab(last)
  }, [])
  useEffect(() => {
    if (typeof window !== 'undefined') localStorage.setItem('help:tab', tab)
  }, [tab])

  // 监听来自 TOC 的事件来切换 Tab
  useEffect(() => {
    const handler = (e: Event) => {
      const ce = e as CustomEvent<HelpTab>
      const v = ce.detail
      if (v === 'overview' || v === 'html' || v === 'json' || v === 'browser') setTab(v)
    }
    window.addEventListener('help:setTab', handler as EventListener)
    return () => window.removeEventListener('help:setTab', handler as EventListener)
  }, [])

  return (
    <Tabs value={tab} onValueChange={(v: string) => setTab(v as HelpTab)} className="w-full">
      <TabsList className="grid w-full grid-cols-4 bg-muted/40 p-1 rounded-md">
        <TabsTrigger
          id="tab-trigger-overview"
          value="overview"
          className="transition-colors hover:bg-primary/10 hover:text-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          概述
        </TabsTrigger>
        <TabsTrigger
          id="tab-trigger-html"
          value="html"
          className="transition-colors hover:bg-primary/10 hover:text-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          HTML 格式
        </TabsTrigger>
        <TabsTrigger
          id="tab-trigger-json"
          value="json"
          className="transition-colors hover:bg-primary/10 hover:text-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          JSON 格式
        </TabsTrigger>
        <TabsTrigger
          id="tab-trigger-browser"
          value="browser"
          className="transition-colors hover:bg-primary/10 hover:text-primary data-[state=active]:bg-primary/10 data-[state=active]:text-primary focus-visible:ring-2 focus-visible:ring-primary/50"
        >
          浏览器导出
        </TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-6">
        <div className="space-y-6">
          <div>
            <h3 className="text-base font-semibold mb-2">支持的文件格式</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-blue-500" />
                  <h4 className="font-medium">HTML 格式</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">标准的浏览器书签导出格式，支持从 Chrome、Firefox、Safari、Edge 等浏览器导出的书签文件。</p>
                <DownloadSampleHTMLButton size="sm" variant="outline" />
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Code className="w-5 h-5 text-green-500" />
                  <h4 className="font-medium">JSON 格式</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">自定义的 JSON 数据格式，支持完整的分类结构和书签信息，包括描述、创建时间等详细信息。</p>
                <DownloadSampleJSONButton size="sm" variant="outline" />
              </div>

              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <FileText className="w-5 h-5 text-purple-500" />
                  <h4 className="font-medium">CSV 格式</h4>
                </div>
                <p className="text-sm text-muted-foreground mb-3">简单的表格格式，包含标题、URL、描述和分类信息，便于在 Excel 中编辑。</p>
                <Button size="sm" variant="outline" disabled>
                  <Download className="w-4 h-4 mr-2" /> 下载示例文件
                </Button>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-base font-semibold mb-2">导入逻辑说明</h3>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-blue-900 mb-2">🔍 浏览器书签文件层级处理规则</h4>
              <div className="space-y-3 text-sm text-blue-800">
                <div>
                  <strong>书签栏特殊处理：</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• 自动识别"书签栏"文件夹（支持中英文）</li>
                    <li>• 书签栏本身不会成为分类，其内容按以下规则处理</li>
                  </ul>
                </div>

                <div>
                  <strong>层级映射规则：</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• <span className="bg-blue-100 px-1 rounded">书签栏下的文件夹</span> → <span className="text-green-700 font-medium">一级分类</span></li>
                    <li>• <span className="bg-blue-100 px-1 rounded">一级分类下的文件夹</span> → <span className="text-green-700 font-medium">二级分类</span></li>
                    <li>• <span className="bg-blue-100 px-1 rounded">更深层的文件夹</span> → <span className="text-orange-700 font-medium">扁平化到二级分类，用前缀标识</span></li>
                  </ul>
                </div>

                <div>
                  <strong>书签归类规则：</strong>
                  <ul className="ml-4 mt-1 space-y-1">
                    <li>• <span className="bg-yellow-100 px-1 rounded">书签栏下的直接书签</span> → 放入"未分类书签"分类</li>
                    <li>• <span className="bg-yellow-100 px-1 rounded">一级分类下的直接书签</span> → 放入该分类的"默认"子分类</li>
                    <li>• <span className="bg-yellow-100 px-1 rounded">深层文件夹中的书签</span> → 添加前缀标识来源文件夹</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-green-900 mb-2">实际示例</h4>
              <div className="text-sm text-green-800">
                <div className="mb-2 font-medium">原始结构：</div>
                <CopyablePre>{`书签栏/\n├── Google (直接书签)\n├── 开发工具/\n│   ├── VSCode (直接书签)\n│   ├── 前端工具/\n│   │   └── React文档\n│   └── 后端工具/\n│       └── API工具/\n│           └── Postman`}</CopyablePre>
                <div className="mt-3 mb-2 font-medium">导入后结构：</div>
                <CopyablePre>{`📂 未分类书签\n  └── 📁 默认\n      └── 🔗 Google\n\n📂 开发工具\n  ├── 📁 默认\n  │   └── 🔗 VSCode\n  ├── 📁 前端工具\n  │   └── 🔗 React文档\n  └── 📁 后端工具\n      └── 🔗 [API工具] Postman`}</CopyablePre>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2">基本导入说明</h4>
              <ul className="space-y-2 text-sm text-muted-foreground list-disc ml-4">
                <li>导入书签会添加到现有数据，不会覆盖</li>
                <li>支持任意层级的文件夹结构，所有书签都会被正确导入</li>
                <li>JSON 格式支持完整的二级分类与详细信息</li>
                <li>支持拖拽或点击选择文件</li>
                <li>文件大小建议不超过 10MB</li>
              </ul>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="html" className="mt-6">
        <div className="space-y-6 pb-4">
          <div>
            <h3 className="text-base font-semibold mb-2">HTML 书签格式</h3>
            <p className="text-sm text-muted-foreground mb-4">这是浏览器标准的书签导出格式，所有主流浏览器都支持导出为此格式。系统会智能识别书签栏结构并合理组织分类。</p>
            <div className="bg-muted p-4 rounded-lg mb-4">
              <h4 className="font-medium mb-2">Chrome/Edge 导出的典型结构：</h4>
              <CopyablePre>{`<!DOCTYPE NETSCAPE-Bookmark-file-1>\n<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">\n<TITLE>Bookmarks</TITLE>\n<H1>Bookmarks</H1>\n<DL><p>\n    <DT><H3 PERSONAL_TOOLBAR_FOLDER="true">书签栏</H3>\n    <DL><p>\n        <!-- 直接书签 → 未分类书签/默认 -->\n        <DT><A HREF="https://www.google.com/">Google</A>\n\n        <!-- 一级文件夹 → 一级分类 -->\n        <DT><H3>开发工具</H3>\n        <DL><p>\n            <!-- 直接书签 → 开发工具/默认 -->\n            <DT><A HREF="https://code.visualstudio.com/">VSCode</A>\n\n            <!-- 二级文件夹 → 二级分类 -->\n            <DT><H3>前端工具</H3>\n            <DL><p>\n                <DT><A HREF="https://reactjs.org/">React</A>\n\n                <!-- 三级文件夹 → 扁平化到前端工具，添加前缀 -->\n                <DT><H3>框架文档</H3>\n                <DL><p>\n                    <DT><A HREF="https://vuejs.org/">Vue.js</A>\n                </DL><p>\n            </DL><p>\n        </DL><p>\n    </DL><p>\n</DL><p>`}</CopyablePre>
            </div>
            <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4">
              <h4 className="font-medium text-amber-900 mb-2">智能处理特性</h4>
              <ul className="space-y-2 text-sm text-amber-800">
                <li>• <strong>自动识别书签栏：</strong>支持中文"书签栏"、英文"Bookmarks bar"或带有 PERSONAL_TOOLBAR_FOLDER 属性的文件夹</li>
                <li>• <strong>层级适配：</strong>将浏览器的多层文件夹结构适配到网站的二级分类系统</li>
                <li>• <strong>前缀标识：</strong>深层文件夹的书签会添加 [文件夹名] 前缀，保留原始组织信息</li>
                <li>• <strong>无书签丢失：</strong>无论多少层级，所有书签都会被正确导入</li>
              </ul>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="json" className="mt-6">
        <div className="space-y-6 pb-4">
          <div>
            <h3 className="text-base font-semibold mb-2">JSON 数据格式</h3>
            <p className="text-sm text-muted-foreground mb-4">自定义的 JSON 格式，支持完整的分类层级和详细的书签信息。</p>
            <div className="bg-muted p-4 rounded-lg">
              <h4 className="font-medium mb-2">数据结构：</h4>
              <CopyablePre>{`{\n  \"categories\": [\n    {\n      \"id\": \"dev-tools\",           // 分类ID（必需）\n      \"name\": \"开发工具\",           // 分类名称（必需）\n      \"subCategories\": [           // 二级分类数组\n        {\n          \"id\": \"editors\",         // 二级分类ID（必需）\n          \"name\": \"代码编辑器\",     // 二级分类名称（必需）\n          \"parentId\": \"dev-tools\"  // 父分类ID（必需）\n        }\n      ]\n    }\n  ],\n  \"bookmarks\": [\n    {\n      \"id\": \"vscode\",                    // 书签ID（必需）\n      \"title\": \"Visual Studio Code\",    // 书签标题（必需）\n      \"url\": \"https://code.visualstudio.com/\", // 书签URL（必需）\n      \"description\": \"代码编辑器\",       // 书签描述（可选）\n      \"subCategoryId\": \"editors\",       // 所属二级分类ID（必需）\n      \"createdAt\": \"2024-01-01T00:00:00.000Z\" // 创建时间（可选）\n    }\n  ]\n}`}</CopyablePre>
            </div>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="browser" className="mt-6">
        <div className="space-y-6 pb-4">
          <div>
            <h3 className="text-base font-semibold mb-2">从浏览器导出书签</h3>
            <p className="text-sm text-muted-foreground mb-4">各主流浏览器导出步骤，导出后文件可直接导入。</p>
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Chrome / Edge</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>点击浏览器右上角的三点菜单</li>
                    <li>选择“书签” → “书签管理器”</li>
                    <li>点击右上角的三点菜单</li>
                    <li>选择“导出书签”</li>
                    <li>保存为 HTML 文件</li>
                  </ol>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Firefox</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>按 Ctrl+Shift+O 打开书签管理器</li>
                    <li>点击“导入和备份”</li>
                    <li>选择“导出书签到HTML”</li>
                    <li>选择保存位置并保存</li>
                  </ol>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Safari</CardTitle>
                </CardHeader>
                <CardContent>
                  <ol className="list-decimal list-inside space-y-1 text-sm text-muted-foreground">
                    <li>打开 Safari</li>
                    <li>点击菜单栏的“文件”</li>
                    <li>选择“导出书签”</li>
                    <li>保存为 HTML 文件</li>
                  </ol>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </TabsContent>
    </Tabs>
  )
}

