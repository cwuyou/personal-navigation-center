"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowRight, Home, Star, Settings, Shield, Smartphone, Clock, Search, Upload, Lock, Download, Layout, Sliders } from "lucide-react"
import Link from "next/link"
import { StructuredData, WebSiteStructuredData } from "@/components/seo-structured-data"

export default function LandingPage() {
  const [isReturningUser, setIsReturningUser] = useState(false)

  useEffect(() => {
    // 检查用户是否之前访问过应用
    const hasVisited = localStorage.getItem('hasVisitedDashboard')
    setIsReturningUser(!!hasVisited)
  }, [])

  // 平滑滚动到指定区域
  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({
        behavior: 'smooth',
        block: 'start'
      })
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* SEO 结构化数据 */}
      <WebSiteStructuredData />
      <StructuredData type="homepage" />

      {/* 导航栏 */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Home className="h-8 w-8 text-primary" />
              <span className="text-xl font-bold text-foreground">My Homepage</span>
            </div>
            <div className="flex items-center space-x-4">
              {isReturningUser && (
                <Link href="/dashboard">
                  <Button variant="default" size="sm" className="bg-primary">
                    <Clock className="h-4 w-4 mr-2" />
                    快速进入
                  </Button>
                </Link>
              )}
              <Link href="/dashboard">
                <Button variant={isReturningUser ? "outline" : "ghost"} size="sm">
                  {isReturningUser ? "书签管理" : "进入应用"}
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* 英雄区域 */}
      <section className="py-16 lg:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-10">
            <div className="space-y-6">
              <Badge variant="secondary" className="text-base px-4 py-2 font-medium">
                🚀 个人导航中心
              </Badge>
              <h1 className="text-2xl md:text-4xl lg:text-5xl font-bold text-foreground tracking-tight leading-tight">
                打造完美的
                <br />
                <span className="text-primary">个人主页</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto leading-relaxed font-medium">
                将浏览器的<strong className="text-foreground">起始页</strong>转换为强大的导航中心。
                智能管理您的<strong className="text-foreground">书签</strong>，打造适应您浏览习惯的定制化<strong className="text-foreground">个人主页</strong>。
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-6 justify-center items-center pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-10 py-3 h-12 font-semibold shadow-lg hover:shadow-xl transition-all duration-200">
                  开始使用
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button
                variant="outline"
                size="lg"
                className="text-base px-10 py-3 h-12 font-semibold border-2 hover:bg-muted/50 transition-all duration-200"
                onClick={() => scrollToSection('features-section')}
              >
                了解更多
              </Button>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-12 text-base text-muted-foreground pt-8">
              <div className="flex items-center gap-3">
                <Star className="h-5 w-5 text-yellow-500" />
                <span className="font-medium">完全免费</span>
              </div>
              <div className="flex items-center gap-3">
                <Shield className="h-5 w-5 text-green-500" />
                <span className="font-medium">隐私保护</span>
              </div>
              <div className="flex items-center gap-3">
                <Smartphone className="h-5 w-5 text-blue-500" />
                <span className="font-medium">响应式设计</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 产品介绍 */}
      <section id="features-section" className="py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              为什么选择 My Homepage？
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto font-medium leading-relaxed">
              完全自定义的个人导航中心，让您打造独一无二的浏览体验。
              从分类结构到展示方式，从主题配色到布局风格，一切都由您决定。
              真正属于您的个性化<strong className="text-foreground">起始页</strong>和<strong className="text-foreground">导航中心</strong>。
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 mb-16">
            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-blue-50 dark:bg-blue-950/20 rounded-full flex items-center justify-center">
                  <Settings className="h-10 w-10 text-blue-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">完全自定义</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  自定义分类结构、展示布局、主题配色等。
                  打造真正属于您的<strong className="text-foreground">个性化导航中心</strong>
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-green-50 dark:bg-green-950/20 rounded-full flex items-center justify-center">
                  <Layout className="h-10 w-10 text-green-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">灵活布局</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  网格、列表、卡片等多种展示方式，自由调整间距、大小、排列。
                  让您的<strong className="text-foreground">导航页面</strong>完全符合使用习惯
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
              <CardContent className="p-10 text-center space-y-6">
                <div className="w-20 h-20 mx-auto bg-purple-50 dark:bg-purple-950/20 rounded-full flex items-center justify-center">
                  <Sliders className="h-10 w-10 text-purple-500" />
                </div>
                <h3 className="text-xl font-bold text-foreground">显示控制</h3>
                <p className="text-base text-muted-foreground leading-relaxed">
                  自由开关书签描述、网址显示、图标展示、标签显示。
                  精确控制每个<strong className="text-foreground">界面元素</strong>的显示与隐藏
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* 自定义功能展示 */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              强大的自定义功能
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-4xl mx-auto font-medium">
              从分类结构到视觉风格，一切都由您掌控
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* 左侧：自定义分类 */}
            <div className="space-y-8">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-lg flex items-center justify-center">
                    <Settings className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">自定义分类结构</h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  创建符合您工作流程的分类体系。无论是按项目、按用途还是按频率分类，
                  都能轻松构建多层级的<strong className="text-foreground">个性化导航结构</strong>。
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-lg flex items-center justify-center">
                    <Layout className="h-6 w-6 text-green-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">灵活展示布局</h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  网格、列表、卡片等多种布局方式，自由调整间距、大小、列数。
                  让您的<strong className="text-foreground">书签页面</strong>完全符合视觉偏好。
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-lg flex items-center justify-center">
                    <Sliders className="h-6 w-6 text-purple-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-foreground">显示设置控制</h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  自由控制书签描述、网址、图标、标签的显示与隐藏。
                  让<strong className="text-foreground">界面元素</strong>完全按需显示，打造专属视觉体验。
                </p>
              </div>
            </div>

            {/* 右侧：功能预览图 */}
            <div className="relative">
              <div className="bg-gradient-to-br from-primary/10 to-primary/5 rounded-2xl p-8 border">
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h4 className="text-lg font-semibold text-foreground">显示设置面板</h4>
                    <Sliders className="h-5 w-5 text-primary" />
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="text-sm text-muted-foreground">显示书签描述</span>
                      <div className="w-10 h-6 bg-primary rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="text-sm text-muted-foreground">显示网址链接</span>
                      <div className="w-10 h-6 bg-muted rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 left-1 shadow"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="text-sm text-muted-foreground">显示网站图标</span>
                      <div className="w-10 h-6 bg-primary rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow"></div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-3 bg-background rounded-lg border">
                      <span className="text-sm text-muted-foreground">显示标签</span>
                      <div className="w-10 h-6 bg-primary rounded-full relative">
                        <div className="w-4 h-4 bg-white rounded-full absolute top-1 right-1 shadow"></div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 主要特性 */}
      <section className="py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6 mb-20">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground">
              完整功能生态
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground max-w-3xl mx-auto font-medium">
              在自定义的基础上，提供全方位的书签管理和导航体验
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="flex items-start space-x-4 p-6 rounded-lg bg-card border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Settings className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-foreground mb-2">自定义分类体系</h3>
                <p className="text-sm text-muted-foreground">创建多层级分类结构，按项目、用途或个人习惯自由组织书签</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 rounded-lg bg-card border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Layout className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">多样化布局选择</h3>
                <p className="text-base text-muted-foreground">网格、列表、卡片布局，自定义间距、大小，打造专属视觉体验</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 rounded-lg bg-card border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Sliders className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">精细显示控制</h3>
                <p className="text-base text-muted-foreground">自由开关书签描述、网址、图标、标签的显示，精确控制界面元素</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 rounded-lg bg-card border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Search className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">智能搜索导航</h3>
                <p className="text-base text-muted-foreground">快速搜索书签，支持模糊匹配、标签筛选，瞬间找到目标网站</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 rounded-lg bg-card border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Upload className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">便捷数据迁移</h3>
                <p className="text-base text-muted-foreground">一键导入浏览器书签，支持Chrome、Firefox等主流浏览器</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 rounded-lg bg-card border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">隐私安全保护</h3>
                <p className="text-base text-muted-foreground">本地存储，数据完全属于您，无需注册登录，保护个人隐私</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 rounded-lg bg-card border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Smartphone className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">跨设备响应式</h3>
                <p className="text-base text-muted-foreground">完美适配手机、平板、电脑，自定义设置在各设备间保持一致</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 rounded-lg bg-card border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Download className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">数据导入导出</h3>
                <p className="text-base text-muted-foreground">支持书签数据备份和恢复，自定义设置可随时导出分享</p>
              </div>
            </div>

            <div className="flex items-start space-x-4 p-6 rounded-lg bg-card border hover:shadow-md transition-shadow">
              <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center flex-shrink-0">
                <Star className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="text-xl font-semibold text-foreground mb-2">智能标签系统</h3>
                <p className="text-base text-muted-foreground">为书签添加自定义标签，支持多标签筛选和快速分类管理</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 数据安全 */}
      <section className="py-20 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-8">
              <div>
                <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-6">
                  数据安全保障
                </h2>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  您的所有书签数据都安全存储在本地浏览器中，无需注册登录，
                  不会上传到任何服务器，完全保护您的隐私安全。
                </p>
              </div>

              <div className="space-y-6">
                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">本地存储</h3>
                    <p className="text-sm text-muted-foreground">所有数据存储在您的浏览器本地，不会上传到云端</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">无需注册</h3>
                    <p className="text-sm text-muted-foreground">无需创建账户，打开即用，保护个人信息</p>
                  </div>
                </div>

                <div className="flex items-start space-x-4">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                    <Download className="h-4 w-4 text-purple-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground mb-1">数据导出</h3>
                    <p className="text-sm text-muted-foreground">支持随时导出备份，数据完全由您掌控</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                  <h3 className="text-xl font-bold text-foreground mb-6">快速上手指南</h3>
                  <div className="space-y-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">1</div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">添加第一个书签</h4>
                        <p className="text-sm text-muted-foreground">点击"添加书签"按钮，输入网站名称和链接，选择合适的分类</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">2</div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">导入现有书签</h4>
                        <p className="text-sm text-muted-foreground">从浏览器导出书签文件，然后一键导入到个人导航中心</p>
                      </div>
                    </div>

                    <div className="flex items-start space-x-4">
                      <div className="w-8 h-8 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0">3</div>
                      <div>
                        <h4 className="font-semibold text-foreground mb-1">设为浏览器首页</h4>
                        <p className="text-sm text-muted-foreground">将此页面设为浏览器起始页，享受个性化的导航体验</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* CTA 区域 */}
      <section className="py-24 bg-gradient-to-br from-primary/5 to-primary/10">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-10">
            <h2 className="text-2xl md:text-4xl font-bold text-foreground leading-tight">
              准备好创建您的个人主页了吗？
            </h2>
            <p className="text-lg md:text-xl text-muted-foreground font-medium max-w-3xl mx-auto">
              立即开始，几分钟内就能拥有专属的导航中心
            </p>
            <div className="pt-4">
              <Link href="/dashboard">
                <Button size="lg" className="text-lg px-12 py-4 h-14 font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105">
                  立即开始使用
                  <ArrowRight className="ml-3 h-6 w-6" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 页脚 */}
      <footer className="border-t border-border/50 py-16 bg-muted/20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-6">
            <div className="flex items-center justify-center space-x-3">
              <Home className="h-7 w-7 text-primary" />
              <span className="text-2xl font-bold text-foreground">My Homepage</span>
            </div>
            <p className="text-base text-muted-foreground font-medium">
              © 2024 My Homepage. 专业的个人主页和起始页解决方案.
            </p>
            <div className="flex flex-wrap justify-center gap-6 text-base">
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium">个人主页</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium">起始页</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium">书签管理</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium">导航中心</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium">浏览器首页</Badge>
              <Badge variant="outline" className="px-4 py-2 text-sm font-medium">网址收藏</Badge>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
