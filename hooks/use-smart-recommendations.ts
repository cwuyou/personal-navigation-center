import { useState, useEffect, useMemo } from 'react'
import { useBookmarkStore } from './use-bookmark-store'

interface UserActivity {
  bookmarkId: string
  action: 'view' | 'edit' | 'delete'
  timestamp: Date
  duration?: number // 停留时间（毫秒）
}

interface RecommendationScore {
  bookmarkId: string
  score: number
  reasons: string[]
}

interface SmartRecommendations {
  frequentlyUsed: any[]
  recentlyAdded: any[]
  similarBookmarks: any[]
  categoryTrends: { categoryId: string; growth: number }[]
  suggestedTags: string[]
}

export function useSmartRecommendations() {
  const { bookmarks, categories } = useBookmarkStore()
  const [userActivity, setUserActivity] = useState<UserActivity[]>([])
  const [recommendations, setRecommendations] = useState<SmartRecommendations>({
    frequentlyUsed: [],
    recentlyAdded: [],
    similarBookmarks: [],
    categoryTrends: [],
    suggestedTags: []
  })

  // 加载用户活动数据
  useEffect(() => {
    if (typeof window === 'undefined') return

    const saved = localStorage.getItem('user-activity')
    if (saved) {
      try {
        const parsed = JSON.parse(saved).map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        }))
        setUserActivity(parsed)
      } catch (error) {
        console.error('Failed to load user activity:', error)
      }
    }
  }, [])

  // 记录用户活动
  const trackActivity = (bookmarkId: string, action: UserActivity['action'], duration?: number) => {
    if (typeof window === 'undefined') return

    const newActivity: UserActivity = {
      bookmarkId,
      action,
      timestamp: new Date(),
      duration
    }

    const updatedActivity = [newActivity, ...userActivity].slice(0, 1000) // 保留最近1000条记录
    setUserActivity(updatedActivity)
    localStorage.setItem('user-activity', JSON.stringify(updatedActivity))
  }

  // 计算书签使用频率
  const calculateFrequency = useMemo(() => {
    const frequency: Record<string, number> = {}
    const now = new Date()
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000)

    userActivity
      .filter(activity => activity.timestamp > thirtyDaysAgo)
      .forEach(activity => {
        frequency[activity.bookmarkId] = (frequency[activity.bookmarkId] || 0) + 1
      })

    return frequency
  }, [userActivity])

  // 计算相似度
  const calculateSimilarity = (bookmark1: any, bookmark2: any): number => {
    let score = 0

    // 基于域名的相似度
    try {
      const domain1 = new URL(bookmark1.url).hostname
      const domain2 = new URL(bookmark2.url).hostname
      if (domain1 === domain2) score += 0.3
    } catch (error) {
      // 忽略URL解析错误
    }

    // 基于标题的相似度
    const title1Words = bookmark1.title.toLowerCase().split(/\s+/)
    const title2Words = bookmark2.title.toLowerCase().split(/\s+/)
    const commonWords = title1Words.filter((word: string) => title2Words.includes(word))
    score += (commonWords.length / Math.max(title1Words.length, title2Words.length)) * 0.4

    // 基于分类的相似度
    if (bookmark1.subCategoryId === bookmark2.subCategoryId) {
      score += 0.3
    }

    return score
  }

  // 生成推荐
  useEffect(() => {
    if (bookmarks.length === 0) return

    // 1. 频繁使用的书签
    const frequentlyUsed = bookmarks
      .map(bookmark => ({
        ...bookmark,
        frequency: calculateFrequency[bookmark.id] || 0
      }))
      .filter(bookmark => bookmark.frequency > 0)
      .sort((a, b) => b.frequency - a.frequency)
      .slice(0, 6)

    // 2. 最近添加的书签
    const recentlyAdded = [...bookmarks]
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, 6)

    // 3. 相似书签推荐
    const similarBookmarks: any[] = []
    if (frequentlyUsed.length > 0) {
      const targetBookmark = frequentlyUsed[0]
      const similar = bookmarks
        .filter(bookmark => bookmark.id !== targetBookmark.id)
        .map(bookmark => ({
          ...bookmark,
          similarity: calculateSimilarity(targetBookmark, bookmark)
        }))
        .filter(bookmark => bookmark.similarity > 0.2)
        .sort((a, b) => b.similarity - a.similarity)
        .slice(0, 4)
      
      similarBookmarks.push(...similar)
    }

    // 4. 分类趋势分析
    const categoryActivity: Record<string, number[]> = {}
    const now = new Date()
    
    // 统计过去7天每天的活动
    for (let i = 0; i < 7; i++) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
      const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
      const dayEnd = new Date(dayStart.getTime() + 24 * 60 * 60 * 1000)
      
      userActivity
        .filter(activity => activity.timestamp >= dayStart && activity.timestamp < dayEnd)
        .forEach(activity => {
          const bookmark = bookmarks.find(b => b.id === activity.bookmarkId)
          if (bookmark) {
            if (!categoryActivity[bookmark.subCategoryId]) {
              categoryActivity[bookmark.subCategoryId] = new Array(7).fill(0)
            }
            categoryActivity[bookmark.subCategoryId][i]++
          }
        })
    }

    const categoryTrends = Object.entries(categoryActivity)
      .map(([categoryId, activities]) => {
        const recent = activities.slice(0, 3).reduce((a, b) => a + b, 0)
        const older = activities.slice(3).reduce((a, b) => a + b, 0)
        const growth = older > 0 ? (recent - older) / older : recent > 0 ? 1 : 0
        return { categoryId, growth }
      })
      .sort((a, b) => b.growth - a.growth)
      .slice(0, 3)

    // 5. 建议标签
    const tagFrequency: Record<string, number> = {}
    bookmarks.forEach(bookmark => {
      if (bookmark.tags) {
        bookmark.tags.forEach(tag => {
          tagFrequency[tag] = (tagFrequency[tag] || 0) + 1
        })
      }
    })

    const suggestedTags = Object.entries(tagFrequency)
      .sort(([, a], [, b]) => b - a)
      .slice(0, 10)
      .map(([tag]) => tag)

    setRecommendations({
      frequentlyUsed,
      recentlyAdded,
      similarBookmarks,
      categoryTrends,
      suggestedTags
    })
  }, [bookmarks, userActivity, calculateFrequency])

  // 获取推荐的新分类
  const getRecommendedCategories = (url: string): string[] => {
    try {
      const domain = new URL(url).hostname
      const suggestions: string[] = []

      // 基于域名的分类建议
      if (domain.includes('github.com')) suggestions.push('开发工具')
      if (domain.includes('stackoverflow.com')) suggestions.push('技术社区')
      if (domain.includes('youtube.com')) suggestions.push('视频')
      if (domain.includes('medium.com')) suggestions.push('博客')
      if (domain.includes('docs.') || domain.includes('documentation')) suggestions.push('文档')

      return suggestions
    } catch (error) {
      return []
    }
  }

  // 检测重复书签
  const detectDuplicates = (newBookmark: { title: string; url: string }) => {
    return bookmarks.filter(bookmark => {
      // 完全相同的URL
      if (bookmark.url === newBookmark.url) return true
      
      // 相似的标题
      const similarity = calculateSimilarity(bookmark, newBookmark)
      return similarity > 0.8
    })
  }

  return {
    recommendations,
    trackActivity,
    getRecommendedCategories,
    detectDuplicates,
    userActivity: userActivity.slice(0, 50) // 返回最近50条活动
  }
}
