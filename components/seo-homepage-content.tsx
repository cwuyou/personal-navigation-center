"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Bookmark, 
  Home, 
  Zap, 
  Search, 
  Palette, 
  Download,
  Star,
  Globe,
  Smartphone,
  Shield
} from "lucide-react"

export function SEOHomepageContent() {
  return (
    <div className="text-center space-y-4">
      {/* 极简主标题 */}
      <div className="space-y-2">
        <h2 className="text-lg md:text-xl font-medium text-foreground/80">
          Create Your Perfect Personal Homepage and Start Page
        </h2>
        <p className="text-sm text-muted-foreground max-w-2xl mx-auto">
          Transform your browser's <strong>start page</strong> into a powerful navigation center.
          Manage your <strong>bookmarks</strong> intelligently and build a custom <strong>personal homepage</strong>.
        </p>
      </div>

      {/* 极简功能标签 */}
      <div className="flex flex-wrap justify-center items-center gap-4 text-xs text-muted-foreground/80">
        <span className="flex items-center gap-1">
          <Home className="h-3 w-3" />
          Personal Homepage
        </span>
        <span className="flex items-center gap-1">
          <Bookmark className="h-3 w-3" />
          Smart Bookmarks
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3 w-3" />
          Lightning Fast
        </span>
      </div>

      {/* 隐藏的SEO文本 */}
      <section className="sr-only">
        <h2>My Homepage One - The Ultimate Personal Homepage and Start Page Solution</h2>
        <p>
          My Homepage One is the most advanced personal homepage and start page creator available. 
          Whether you're looking to replace your browser's default start page, organize your bookmarks 
          more effectively, or create a custom navigation center for your daily web browsing, 
          My Homepage One provides all the tools you need.
        </p>
        <p>
          Our intelligent bookmark manager automatically fetches website information, creates beautiful 
          previews, and organizes your links into smart categories. The result is a personalized 
          homepage that serves as your central hub for accessing the web.
        </p>
        <p>
          Key features include: custom start page creation, intelligent bookmark management, 
          responsive design, privacy-first approach, lightning-fast performance, and seamless 
          import/export capabilities. Perfect for anyone who wants to transform their browser's 
          homepage into a powerful productivity tool.
        </p>
      </section>
    </div>
  )
}
