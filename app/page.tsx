"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import {
  ArrowRight,
  Home,
  Star,
  Settings,
  Shield,
  Smartphone,
  Clock,
  Search,
  Upload,
  Lock,
  Download,
  Layout,
  Sliders,
  Sparkles,
} from "lucide-react"
import Link from "next/link"
import {
  StructuredData,
  WebSiteStructuredData,
  FAQStructuredData,
  HowToStructuredData,
} from "@/components/seo-structured-data"
import { SEOOptimization } from "@/components/seo-optimization"
import { PerformanceMonitor } from "@/components/web-vitals-monitor"

// 挂载后再读 localStorage,避免 server/client hydration mismatch
function useIsReturningUser() {
  const [mounted, setMounted] = useState(false)
  const [val, setVal] = useState(false)
  useEffect(() => {
    try {
      setVal(!!localStorage.getItem("hasVisitedDashboard"))
    } catch {
      // ignore
    }
    setMounted(true)
  }, [])
  return { mounted, isReturning: val }
}

export default function LandingPage() {
  const { mounted, isReturning } = useIsReturningUser()
  const year = new Date().getFullYear()

  const faqData = [
    {
      question: "什么是 My Homepage？",
      answer:
        "My Homepage 是一个个人主页和书签管理工具，帮助您创建自定义的浏览器起始页，智能管理书签，并提供快速导航功能。",
    },
    {
      question: "如何导入现有的书签？",
      answer:
        "您可以从 Chrome、Firefox、Safari 等浏览器导出书签文件，然后在 My Homepage 中一键导入，系统会自动整理和分类您的书签。",
    },
    {
      question: "数据是否安全？",
      answer:
        "您的数据主要存储在本地浏览器中，我们不会上传您的个人书签到服务器，确保数据隐私和安全。",
    },
  ]

  const howToSteps = [
    { name: "导入书签", text: "从浏览器导出书签文件，然后在 My Homepage 中点击导入按钮上传文件。" },
    { name: "整理分类", text: "创建分类和子分类，将书签按照用途和主题进行整理。" },
    { name: "自定义主页", text: "调整显示设置、主题颜色和布局，打造个性化的起始页面。" },
  ]

  const features = [
    {
      icon: Settings,
      color: "text-blue-600 dark:text-blue-400",
      bg: "bg-blue-500/10",
      title: "自定义分类结构",
      desc: "创建符合您工作流程的分类体系，多层级自由组织。",
    },
    {
      icon: Layout,
      color: "text-green-600 dark:text-green-400",
      bg: "bg-green-500/10",
      title: "灵活展示布局",
      desc: "网格、列表、卡片多种布局，自由调整间距、列数与密度。",
    },
    {
      icon: Sliders,
      color: "text-purple-600 dark:text-purple-400",
      bg: "bg-purple-500/10",
      title: "精细显示控制",
      desc: "自由开关描述、网址、图标、标签等界面元素的可见性。",
    },
    {
      icon: Search,
      color: "text-amber-600 dark:text-amber-400",
      bg: "bg-amber-500/10",
      title: "智能搜索导航",
      desc: "模糊匹配、标签筛选、键盘导航（Ctrl+K），瞬间定位目标。",
    },
    {
      icon: Upload,
      color: "text-sky-600 dark:text-sky-400",
      bg: "bg-sky-500/10",
      title: "便捷数据迁移",
      desc: "一键导入浏览器书签，支持 Chrome、Firefox 等主流浏览器。",
    },
    {
      icon: Shield,
      color: "text-emerald-600 dark:text-emerald-400",
      bg: "bg-emerald-500/10",
      title: "隐私安全保护",
      desc: "本地存储，数据完全属于您，无需注册登录，保护个人隐私。",
    },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <SEOOptimization
        title="My Homepage - 个人主页和书签管理工具"
        description="创建完美的个人主页和浏览器起始页。智能管理书签，快速访问常用网站，打造专属的导航中心。"
        keywords={["个人主页", "起始页", "书签管理", "导航中心", "自定义主页", "startpage", "homepage"]}
        canonicalUrl="https://myhomepage.one"
      />
      <PerformanceMonitor />
      <WebSiteStructuredData />
      <StructuredData type="homepage" />
      <FAQStructuredData faqs={faqData} />
      <HowToStructuredData
        name="如何使用 My Homepage 创建个人主页"
        description="学习如何使用 My Homepage 创建和管理您的个人主页和书签"
        steps={howToSteps}
      />

      {/* 导航栏 */}
      <nav className="border-b border-border/50 bg-background/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2">
              <Home className="h-7 w-7 text-primary" />
              <span className="text-xl font-bold text-foreground">My Homepage</span>
            </div>
            <Link href="/dashboard">
              <Button size="sm" className="font-medium" suppressHydrationWarning>
                {mounted && isReturning ? (
                  <>
                    <Clock className="h-4 w-4 mr-2" />
                    快速进入
                  </>
                ) : (
                  <>
                    进入应用
                    <ArrowRight className="h-4 w-4 ml-2" />
                  </>
                )}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="py-16 lg:py-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="space-y-8">
            <Badge variant="secondary" className="text-sm px-3 py-1 font-medium">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              个人导航中心
            </Badge>
            <h1 className="text-3xl md:text-5xl lg:text-6xl font-bold text-foreground tracking-tight leading-tight">
              打造完美的
              <span className="block text-primary mt-2">个人主页</span>
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              将浏览器起始页变成你的专属导航中心，智能管理书签、自由定制布局、完全本地存储。
            </p>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center pt-2">
              <Link href="/dashboard">
                <Button size="lg" className="text-base px-8 h-11 font-semibold shadow-md hover:shadow-lg transition-shadow">
                  开始使用
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center items-center gap-x-10 gap-y-3 text-sm text-muted-foreground pt-4">
              <div className="flex items-center gap-2">
                <Star className="h-4 w-4 text-yellow-500" />
                <span>完全免费</span>
              </div>
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-green-500" />
                <span>隐私保护</span>
              </div>
              <div className="flex items-center gap-2">
                <Smartphone className="h-4 w-4 text-blue-500" />
                <span>响应式设计</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 功能特性 - 合并原三节 */}
      <section id="features-section" className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center space-y-4 mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground tracking-tight">功能一览</h2>
            <p className="text-base md:text-lg text-muted-foreground max-w-2xl mx-auto">
              从分类结构到视觉风格，从搜索到导入，一切由你掌控。
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <Card
                key={f.title}
                className="border border-border/60 bg-card hover:border-primary/40 hover:shadow-md transition-all"
              >
                <CardContent className="p-6 space-y-4">
                  <div className={`w-11 h-11 ${f.bg} rounded-lg flex items-center justify-center`}>
                    <f.icon className={`h-5 w-5 ${f.color}`} />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="text-base font-semibold text-foreground">{f.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* 数据安全 + 快速上手 */}
      <section className="py-16 lg:py-20">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
            <div className="space-y-6">
              <div>
                <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-3 tracking-tight">
                  数据安全保障
                </h2>
                <p className="text-base text-muted-foreground leading-relaxed">
                  所有书签数据存储在你的浏览器本地，无需注册登录，不上传服务器，保障隐私安全。
                </p>
              </div>

              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-green-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Shield className="h-4 w-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">本地存储</h3>
                    <p className="text-sm text-muted-foreground">所有数据存储在浏览器本地，不会上传云端</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-blue-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Lock className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">无需注册</h3>
                    <p className="text-sm text-muted-foreground">打开即用，不创建账户，保护个人信息</p>
                  </div>
                </div>

                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-purple-500/10 rounded-full flex items-center justify-center flex-shrink-0">
                    <Download className="h-4 w-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-foreground text-sm">数据导出</h3>
                    <p className="text-sm text-muted-foreground">支持 HTML/JSON/CSV/TXT 导出，完全由你掌控</p>
                  </div>
                </div>
              </div>
            </div>

            <Card className="border border-border/60 bg-card">
              <CardContent className="p-6 space-y-5">
                <h3 className="text-lg font-bold text-foreground">快速上手</h3>
                {howToSteps.map((step, i) => (
                  <div key={step.name} className="flex items-start space-x-3">
                    <div className="w-7 h-7 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0">
                      {i + 1}
                    </div>
                    <div>
                      <h4 className="font-semibold text-foreground text-sm mb-0.5">{step.name}</h4>
                      <p className="text-sm text-muted-foreground">{step.text}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-16 lg:py-20 bg-muted/30">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl md:text-3xl font-bold text-foreground text-center mb-10 tracking-tight">
            常见问题
          </h2>
          <div className="space-y-4">
            {faqData.map((item) => (
              <div key={item.question} className="rounded-lg border border-border/60 bg-card p-5">
                <h3 className="font-semibold text-foreground mb-2">{item.question}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{item.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/50 py-10">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <Home className="h-5 w-5 text-primary" />
              <span className="font-semibold text-foreground">My Homepage</span>
            </div>
            <p className="text-sm text-muted-foreground">
              © {year} My Homepage. 个人主页与起始页解决方案.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
