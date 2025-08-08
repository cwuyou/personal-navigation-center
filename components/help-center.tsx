"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

import {
  BookOpen,
  Search,
  Upload,
  Shield,
  Smartphone,
  Sparkles,
  HelpCircle,
  MessageCircle,
  Star,
  Users,
  Zap,
  Heart
} from "lucide-react"

interface HelpCenterProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function HelpCenter({ open, onOpenChange }: HelpCenterProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <HelpCircle className="w-5 h-5" />
            <span>帮助中心</span>
          </DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="about" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="about">产品介绍</TabsTrigger>
            <TabsTrigger value="features">功能特性</TabsTrigger>
            <TabsTrigger value="guide">使用指南</TabsTrigger>
            <TabsTrigger value="faq">常见问题</TabsTrigger>
          </TabsList>

          <TabsContent value="about" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="w-5 h-5 text-blue-500" />
                  <span>关于个人导航中心</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  个人导航中心是一款简洁高效的书签管理工具，专为现代网络用户设计。
                  无论您是学生、职场人士、创作者还是网络爱好者，都能通过我们的智能分类和快速搜索功能，
                  让您的网络生活更加井然有序、高效便捷。
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-blue-50 dark:bg-blue-950/20 rounded-lg">
                    <Users className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                    <h4 className="font-medium">面向所有用户</h4>
                    <p className="text-sm text-muted-foreground">简单易用，人人都能快速上手</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 dark:bg-green-950/20 rounded-lg">
                    <Shield className="w-8 h-8 text-green-500 mx-auto mb-2" />
                    <h4 className="font-medium">隐私安全</h4>
                    <p className="text-sm text-muted-foreground">本地存储，数据完全属于您</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 dark:bg-purple-950/20 rounded-lg">
                    <Zap className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                    <h4 className="font-medium">高效便捷</h4>
                    <p className="text-sm text-muted-foreground">快速搜索，秒速找到目标</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="features" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <BookOpen className="w-5 h-5 text-blue-500" />
                    <span>智能分类管理</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• 两级分类系统，支持灵活组织</li>
                    <li>• 自定义分类名称和图标</li>
                    <li>• 拖拽排序，随心调整</li>
                    <li>• 批量管理，提升效率</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Search className="w-5 h-5 text-green-500" />
                    <span>强大搜索功能</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• 全局模糊搜索，智能匹配</li>
                    <li>• 支持中英文混合搜索</li>
                    <li>• 实时搜索结果预览</li>
                    <li>• 搜索历史记录</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Upload className="w-5 h-5 text-purple-500" />
                    <span>便捷导入导出</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• 支持Chrome、Firefox等浏览器</li>
                    <li>• 智能去重，避免重复导入</li>
                    <li>• 批量导入，一键完成</li>
                    <li>• 数据备份与恢复</li>
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2 text-base">
                    <Smartphone className="w-5 h-5 text-orange-500" />
                    <span>多设备体验</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2 text-sm text-muted-foreground">
                    <li>• 响应式设计，适配所有屏幕</li>
                    <li>• 触摸友好的移动端体验</li>
                    <li>• PWA支持，可安装到桌面</li>
                    <li>• 离线访问，随时可用</li>
                  </ul>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="guide" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>快速上手指南</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                    <div>
                      <h4 className="font-medium">添加第一个书签</h4>
                      <p className="text-sm text-muted-foreground">点击"添加书签"按钮，输入网站名称和链接，选择合适的分类</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-green-500 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                    <div>
                      <h4 className="font-medium">导入现有书签</h4>
                      <p className="text-sm text-muted-foreground">使用"导入"功能，从浏览器批量导入您的现有书签</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-purple-500 text-white rounded-full flex items-center justify-center text-sm font-bold">3</div>
                    <div>
                      <h4 className="font-medium">组织和管理</h4>
                      <p className="text-sm text-muted-foreground">创建分类和子分类，将书签按用途和类型进行整理</p>
                    </div>
                  </div>
                  
                  <div className="flex items-start space-x-4">
                    <div className="w-8 h-8 bg-orange-500 text-white rounded-full flex items-center justify-center text-sm font-bold">4</div>
                    <div>
                      <h4 className="font-medium">快速访问</h4>
                      <p className="text-sm text-muted-foreground">使用搜索功能快速找到需要的网站，或通过分类浏览</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="faq" className="space-y-4">
            <div className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">数据安全相关</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Q: 我的书签数据存储在哪里？</h4>
                    <p className="text-sm text-muted-foreground">A: 所有数据都存储在您的浏览器本地，不会上传到任何服务器，完全保护您的隐私。</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Q: 如果清除浏览器数据会丢失书签吗？</h4>
                    <p className="text-sm text-muted-foreground">A: 是的，建议定期使用导出功能备份您的书签数据。</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">使用相关</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <h4 className="font-medium text-sm">Q: 支持哪些浏览器？</h4>
                    <p className="text-sm text-muted-foreground">A: 支持所有现代浏览器，包括Chrome、Firefox、Safari、Edge等。</p>
                  </div>
                  <div>
                    <h4 className="font-medium text-sm">Q: 可以在手机上使用吗？</h4>
                    <p className="text-sm text-muted-foreground">A: 当然可以！我们的设计完全适配移动设备，提供优秀的移动端体验。</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <div className="flex items-center justify-center pt-4 border-t">
          <div className="flex items-center text-sm text-muted-foreground">
            <Heart className="w-4 h-4 mr-1 text-red-500" />
            用心打造，为您的网络生活添彩
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
