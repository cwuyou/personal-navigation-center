"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { BookmarkCover } from "@/components/bookmark-cover"
import { Badge } from "@/components/ui/badge"

export default function TestCoverImagesPage() {
  const [testUrl, setTestUrl] = useState("")
  const [testResults, setTestResults] = useState<any[]>([])
  const [loading, setLoading] = useState(false)

  // 预设的测试URL
  const presetUrls = [
    "https://github.com",
    "https://stackoverflow.com",
    "https://medium.com",
    "https://dev.to",
    "https://www.figma.com",
    "https://vercel.com",
    "https://nextjs.org",
    "https://tailwindcss.com",
    "https://www.typescriptlang.org",
    "https://react.dev"
  ]

  const testSingleUrl = async (url: string) => {
    setLoading(true)
    try {
      const response = await fetch(`/api/fetch-meta?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      
      const result = {
        url,
        title: data.title || '未知标题',
        coverImage: data.coverImage,
        description: data.description,
        timestamp: Date.now(),
        success: response.ok
      }
      
      setTestResults(prev => [result, ...prev.slice(0, 19)]) // 保持最新20条
      return result
    } catch (error) {
      const result = {
        url,
        title: '获取失败',
        coverImage: '',
        description: '',
        timestamp: Date.now(),
        success: false,
        error: error instanceof Error ? error.message : '未知错误'
      }
      setTestResults(prev => [result, ...prev.slice(0, 19)])
      return result
    } finally {
      setLoading(false)
    }
  }

  const testPresetUrls = async () => {
    setLoading(true)
    setTestResults([])
    
    for (const url of presetUrls) {
      await testSingleUrl(url)
      // 添加小延迟避免请求过快
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    setLoading(false)
  }

  const handleTestCustomUrl = () => {
    if (testUrl.trim()) {
      testSingleUrl(testUrl.trim())
    }
  }

  const clearResults = () => {
    setTestResults([])
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">封面图测试工具</h1>
        <div className="flex gap-2">
          <Button onClick={testPresetUrls} disabled={loading}>
            {loading ? "测试中..." : "测试预设URL"}
          </Button>
          <Button onClick={clearResults} variant="outline">
            清空结果
          </Button>
        </div>
      </div>

      {/* 自定义URL测试 */}
      <Card>
        <CardHeader>
          <CardTitle>测试自定义URL</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Input
              placeholder="输入要测试的URL..."
              value={testUrl}
              onChange={(e) => setTestUrl(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleTestCustomUrl()}
            />
            <Button onClick={handleTestCustomUrl} disabled={loading || !testUrl.trim()}>
              测试
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 测试结果 */}
      {testResults.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold">测试结果 ({testResults.length})</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {testResults.map((result, index) => (
              <Card key={index} className="overflow-hidden">
                <div className="relative">
                  <BookmarkCover
                    bookmark={{
                      title: result.title,
                      url: result.url,
                      coverImage: result.coverImage
                    }}
                    className="h-32"
                    aspectRatio="video"
                  />
                  <div className="absolute top-2 right-2">
                    {result.success ? (
                      <Badge variant="default" className="bg-green-500">
                        成功
                      </Badge>
                    ) : (
                      <Badge variant="destructive">
                        失败
                      </Badge>
                    )}
                  </div>
                </div>
                <CardContent className="p-4">
                  <h3 className="font-medium text-sm mb-2 truncate" title={result.title}>
                    {result.title}
                  </h3>
                  <p className="text-xs text-muted-foreground mb-2 truncate" title={result.url}>
                    {result.url}
                  </p>
                  {result.coverImage && (
                    <p className="text-xs text-blue-600 mb-2 truncate" title={result.coverImage}>
                      封面图: {result.coverImage}
                    </p>
                  )}
                  {result.error && (
                    <p className="text-xs text-red-600 mb-2">
                      错误: {result.error}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    {new Date(result.timestamp).toLocaleTimeString()}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p>• 点击"测试预设URL"可以测试常见网站的封面图获取效果</p>
          <p>• 在输入框中输入自定义URL进行单独测试</p>
          <p>• 绿色标签表示成功获取元数据，红色表示失败</p>
          <p>• 如果原始封面图加载失败，会自动回退到截图服务</p>
          <p>• 可以在浏览器控制台中输入 <code>coverImageDebug.getStats()</code> 查看详细统计</p>
        </CardContent>
      </Card>
    </div>
  )
}
