"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export default function TestApiPage() {
  const [url, setUrl] = useState("https://www.baidu.com")
  const [result, setResult] = useState<any>(null)
  const [loading, setLoading] = useState(false)

  const testApi = async () => {
    setLoading(true)
    setResult(null)
    
    try {
      console.log('🔍 测试API调用:', url)
      const response = await fetch(`/api/fetch-title?url=${encodeURIComponent(url)}`)
      const data = await response.json()
      
      console.log('📄 API响应:', data)
      setResult(data)
    } catch (error) {
      console.error('❌ API调用失败:', error)
      setResult({ error: error.message })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="container mx-auto p-8 max-w-2xl">
      <h1 className="text-2xl font-bold mb-6">测试标题获取API</h1>
      
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">测试URL:</label>
          <Input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
          />
        </div>
        
        <Button onClick={testApi} disabled={loading}>
          {loading ? "获取中..." : "测试获取标题"}
        </Button>
        
        {result && (
          <div className="mt-4 p-4 border rounded-lg">
            <h3 className="font-semibold mb-2">结果:</h3>
            <pre className="text-sm bg-gray-100 p-2 rounded overflow-auto">
              {JSON.stringify(result, null, 2)}
            </pre>
          </div>
        )}
      </div>
    </div>
  )
}
