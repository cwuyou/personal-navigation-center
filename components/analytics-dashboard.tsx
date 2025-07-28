"use client"

import { useState, useMemo } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BarChart3, TrendingUp, Clock, Star, Calendar, Tag, Folder } from "lucide-react"
import { useBookmarkStore } from "@/hooks/use-bookmark-store"
import { useSmartRecommendations } from "@/hooks/use-smart-recommendations"

interface AnalyticsDashboardProps {
  className?: string
}

export function AnalyticsDashboard({ className }: AnalyticsDashboardProps) {
  const { bookmarks, categories } = useBookmarkStore()
  const { recommendations, userActivity } = useSmartRecommendations()
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month')

  // 基础统计
  const basicStats = useMemo(() => {
    const totalBookmarks = bookmarks.length
    const totalCategories = categories.length
    const totalSubCategories = categories.reduce((sum, cat) => sum + cat.subCategories.length, 0)
    
    // 计算平均每个分类的书签数
    const avgBookmarksPerCategory = totalCategories > 0 ? Math.round(totalBookmarks / totalCategories) : 0
    
    // 最近7天添加的书签
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    const recentBookmarks = bookmarks.filter(bookmark => 
      new Date(bookmark.createdAt) > sevenDaysAgo
    ).length

    return {
      totalBookmarks,
      totalCategories,
      totalSubCategories,
      avgBookmarksPerCategory,
      recentBookmarks
    }
  }, [bookmarks, categories])

  // 分类分布统计
  const categoryStats = useMemo(() => {
    const stats = categories.map(category => {
      const categoryBookmarks = bookmarks.filter(bookmark =>
        category.subCategories.some(sub => sub.id === bookmark.subCategoryId)
      )
      
      return {
        id: category.id,
        name: category.name,
        count: categoryBookmarks.length,
        percentage: bookmarks.length > 0 ? Math.round((categoryBookmarks.length / bookmarks.length) * 100) : 0,
        subCategories: category.subCategories.length
      }
    }).sort((a, b) => b.count - a.count)

    return stats
  }, [bookmarks, categories])

  // 标签统计
  const tagStats = useMemo(() => {
    const tagCount: Record<string, number> = {}
    
    bookmarks.forEach(bookmark => {
      if (bookmark.tags) {
        bookmark.tags.forEach(tag => {
          tagCount[tag] = (tagCount[tag] || 0) + 1
        })
      }
    })

    return Object.entries(tagCount)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 20)
  }, [bookmarks])

  // 时间趋势分析
  const timeStats = useMemo(() => {
    const now = new Date()
    const periods = selectedPeriod === 'week' ? 7 : selectedPeriod === 'month' ? 30 : 365
    const data = []

    for (let i = periods - 1; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      const dayBookmarks = bookmarks.filter(bookmark => {
        const bookmarkDate = new Date(bookmark.createdAt)
        return bookmarkDate >= dayStart && bookmarkDate < dayEnd
      }).length

      const dayActivity = userActivity.filter(activity => {
        return activity.timestamp >= dayStart && activity.timestamp < dayEnd
      }).length

      data.push({
        date: dayStart,
        bookmarks: dayBookmarks,
        activity: dayActivity,
        label: selectedPeriod === 'week' 
          ? date.toLocaleDateString('zh-CN', { weekday: 'short' })
          : selectedPeriod === 'month'
          ? date.toLocaleDateString('zh-CN', { day: 'numeric' })
          : date.toLocaleDateString('zh-CN', { month: 'short' })
      })
    }

    return data
  }, [bookmarks, userActivity, selectedPeriod])

  // 域名统计
  const domainStats = useMemo(() => {
    const domainCount: Record<string, number> = {}
    
    bookmarks.forEach(bookmark => {
      try {
        const domain = new URL(bookmark.url).hostname
        domainCount[domain] = (domainCount[domain] || 0) + 1
      } catch (error) {
        // 忽略无效URL
      }
    })

    return Object.entries(domainCount)
      .map(([domain, count]) => ({ domain, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 10)
  }, [bookmarks])

  return (
    <div className={className}>
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">概览</TabsTrigger>
          <TabsTrigger value="categories">分类分析</TabsTrigger>
          <TabsTrigger value="trends">趋势分析</TabsTrigger>
          <TabsTrigger value="recommendations">智能推荐</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* 基础统计卡片 */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <BarChart3 className="h-4 w-4 text-blue-500" />
                  <div>
                    <p className="text-2xl font-bold">{basicStats.totalBookmarks}</p>
                    <p className="text-xs text-muted-foreground">总书签数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Folder className="h-4 w-4 text-green-500" />
                  <div>
                    <p className="text-2xl font-bold">{basicStats.totalCategories}</p>
                    <p className="text-xs text-muted-foreground">分类数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Tag className="h-4 w-4 text-purple-500" />
                  <div>
                    <p className="text-2xl font-bold">{tagStats.length}</p>
                    <p className="text-xs text-muted-foreground">标签数</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-4 w-4 text-orange-500" />
                  <div>
                    <p className="text-2xl font-bold">{basicStats.recentBookmarks}</p>
                    <p className="text-xs text-muted-foreground">本周新增</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center space-x-2">
                  <Star className="h-4 w-4 text-yellow-500" />
                  <div>
                    <p className="text-2xl font-bold">{basicStats.avgBookmarksPerCategory}</p>
                    <p className="text-xs text-muted-foreground">平均/分类</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* 热门标签 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">热门标签</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {tagStats.slice(0, 15).map(({ tag, count }) => (
                  <Badge key={tag} variant="secondary" className="text-xs">
                    {tag} ({count})
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 热门域名 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">热门网站</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {domainStats.map(({ domain, count }) => (
                  <div key={domain} className="flex items-center justify-between">
                    <span className="text-sm">{domain}</span>
                    <Badge variant="outline">{count}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">分类分布</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {categoryStats.map((category) => (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">{category.name}</span>
                      <div className="flex items-center space-x-2">
                        <span className="text-sm text-muted-foreground">
                          {category.count} 个书签
                        </span>
                        <Badge variant="outline">{category.percentage}%</Badge>
                      </div>
                    </div>
                    <div className="w-full bg-muted rounded-full h-2">
                      <div
                        className="bg-primary h-2 rounded-full transition-all duration-300"
                        style={{ width: `${category.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="trends" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-lg">活动趋势</CardTitle>
                <div className="flex space-x-2">
                  {(['week', 'month', 'year'] as const).map((period) => (
                    <Button
                      key={period}
                      variant={selectedPeriod === period ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedPeriod(period)}
                    >
                      {period === 'week' ? '周' : period === 'month' ? '月' : '年'}
                    </Button>
                  ))}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-64 flex items-end space-x-1">
                {timeStats.map((data, index) => (
                  <div key={index} className="flex-1 flex flex-col items-center">
                    <div className="w-full bg-muted rounded-t" style={{ height: '200px', position: 'relative' }}>
                      <div
                        className="bg-blue-500 rounded-t absolute bottom-0 w-full transition-all duration-300"
                        style={{ 
                          height: `${Math.max(5, (data.bookmarks / Math.max(...timeStats.map(d => d.bookmarks)) || 1) * 100)}%` 
                        }}
                      />
                    </div>
                    <span className="text-xs text-muted-foreground mt-1">{data.label}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="recommendations" className="space-y-6">
          {/* 频繁使用的书签 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">常用书签</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {recommendations.frequentlyUsed.slice(0, 6).map((bookmark) => (
                  <div key={bookmark.id} className="flex items-center space-x-3 p-3 border rounded-lg">
                    <div className="w-8 h-8 bg-muted rounded flex items-center justify-center">
                      <span className="text-xs font-medium">
                        {bookmark.frequency || 0}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{bookmark.title}</p>
                      <p className="text-xs text-muted-foreground truncate">
                        {new URL(bookmark.url).hostname}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* 建议标签 */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">建议标签</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {recommendations.suggestedTags.map((tag) => (
                  <Badge key={tag} variant="outline" className="cursor-pointer hover:bg-primary hover:text-primary-foreground">
                    {tag}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
