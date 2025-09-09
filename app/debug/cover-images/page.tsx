"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { RefreshCw, Download, Trash2 } from "lucide-react"
import { coverImageDebugger } from "@/lib/cover-image-debug"

export default function CoverImageDebugPage() {
  const [logs, setLogs] = useState<any[]>([])
  const [stats, setStats] = useState<any>({})

  const refreshData = () => {
    setLogs(coverImageDebugger.getLogs())
    setStats(coverImageDebugger.getStats())
  }

  const exportLogs = () => {
    const data = coverImageDebugger.exportLogs()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `cover-image-debug-${new Date().toISOString().slice(0, 19)}.json`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const clearLogs = () => {
    coverImageDebugger.clear()
    refreshData()
  }

  useEffect(() => {
    refreshData()
    const interval = setInterval(refreshData, 2000) // 每2秒刷新一次
    return () => clearInterval(interval)
  }, [])

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge variant="default" className="bg-green-500">成功</Badge>
      case 'error':
        return <Badge variant="destructive">失败</Badge>
      case 'fallback':
        return <Badge variant="secondary">回退</Badge>
      case 'loading':
        return <Badge variant="outline">加载中</Badge>
      default:
        return <Badge variant="outline">{status}</Badge>
    }
  }

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString()
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">封面图调试工具</h1>
        <div className="flex gap-2">
          <Button onClick={refreshData} variant="outline" size="sm">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新
          </Button>
          <Button onClick={exportLogs} variant="outline" size="sm">
            <Download className="w-4 h-4 mr-2" />
            导出日志
          </Button>
          <Button onClick={clearLogs} variant="outline" size="sm">
            <Trash2 className="w-4 h-4 mr-2" />
            清空日志
          </Button>
        </div>
      </div>

      {/* 统计信息 */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold">{stats.total || 0}</div>
            <div className="text-sm text-muted-foreground">总数</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-green-600">{stats.success || 0}</div>
            <div className="text-sm text-muted-foreground">成功 ({stats.successRate || '0%'})</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-red-600">{stats.error || 0}</div>
            <div className="text-sm text-muted-foreground">失败 ({stats.errorRate || '0%'})</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-blue-600">{stats.fallback || 0}</div>
            <div className="text-sm text-muted-foreground">回退 ({stats.fallbackRate || '0%'})</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="text-2xl font-bold text-yellow-600">{stats.loading || 0}</div>
            <div className="text-sm text-muted-foreground">加载中</div>
          </CardContent>
        </Card>
      </div>

      {/* 日志详情 */}
      <Tabs defaultValue="all" className="w-full">
        <TabsList>
          <TabsTrigger value="all">全部日志 ({logs.length})</TabsTrigger>
          <TabsTrigger value="failed">失败日志 ({coverImageDebugger.getFailedLogs().length})</TabsTrigger>
          <TabsTrigger value="success">成功日志 ({coverImageDebugger.getSuccessLogs().length})</TabsTrigger>
          <TabsTrigger value="fallback">回退日志 ({coverImageDebugger.getFallbackLogs().length})</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <LogTable logs={logs} getStatusBadge={getStatusBadge} formatTime={formatTime} />
        </TabsContent>

        <TabsContent value="failed">
          <LogTable logs={coverImageDebugger.getFailedLogs()} getStatusBadge={getStatusBadge} formatTime={formatTime} />
        </TabsContent>

        <TabsContent value="success">
          <LogTable logs={coverImageDebugger.getSuccessLogs()} getStatusBadge={getStatusBadge} formatTime={formatTime} />
        </TabsContent>

        <TabsContent value="fallback">
          <LogTable logs={coverImageDebugger.getFallbackLogs()} getStatusBadge={getStatusBadge} formatTime={formatTime} />
        </TabsContent>
      </Tabs>
    </div>
  )
}

function LogTable({ logs, getStatusBadge, formatTime }: any) {
  if (logs.length === 0) {
    return (
      <Card>
        <CardContent className="p-8 text-center text-muted-foreground">
          暂无日志数据
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-left">
                <th className="p-4 font-medium">时间</th>
                <th className="p-4 font-medium">书签标题</th>
                <th className="p-4 font-medium">状态</th>
                <th className="p-4 font-medium">原始图片</th>
                <th className="p-4 font-medium">代理图片</th>
                <th className="p-4 font-medium">回退图片</th>
                <th className="p-4 font-medium">错误信息</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log: any, index: number) => (
                <tr key={index} className="border-b hover:bg-muted/50">
                  <td className="p-4 text-sm">{formatTime(log.timestamp)}</td>
                  <td className="p-4 font-medium max-w-xs truncate" title={log.bookmarkTitle}>
                    {log.bookmarkTitle}
                  </td>
                  <td className="p-4">{getStatusBadge(log.loadStatus)}</td>
                  <td className="p-4 text-sm max-w-xs truncate" title={log.originalCoverImage}>
                    {log.originalCoverImage || '-'}
                  </td>
                  <td className="p-4 text-sm max-w-xs truncate" title={log.proxiedCoverImage}>
                    {log.proxiedCoverImage || '-'}
                  </td>
                  <td className="p-4 text-sm max-w-xs truncate" title={log.fallbackUrl}>
                    {log.fallbackUrl || '-'}
                  </td>
                  <td className="p-4 text-sm max-w-xs truncate text-red-600" title={log.errorMessage}>
                    {log.errorMessage || '-'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  )
}
