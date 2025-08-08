'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { supabase, getCurrentUser } from '@/lib/supabase'

export function SimpleStorageDebug() {
  const [results, setResults] = useState<string[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const addResult = (message: string) => {
    setResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`])
  }

  const testStorageSetup = async () => {
    setIsLoading(true)
    setResults([])
    
    try {
      addResult('🔍 开始 Storage 配置检查...')
      
      if (!supabase) {
        addResult('❌ Supabase 客户端未配置')
        addResult('💡 请检查 .env.local 文件中的 Supabase 配置')
        return
      }

      // 1. 检查用户认证
      addResult('🔐 检查用户认证...')
      const user = await getCurrentUser()
      if (!user) {
        addResult('❌ 用户未登录')
        addResult('💡 请先登录后再测试 Storage 功能')
        return
      }
      addResult(`✅ 用户已登录: ${user.email}`)

      // 2. 检查存储桶
      addResult('📦 检查存储桶...')
      const { data: buckets, error: bucketsError } = await supabase.storage.listBuckets()
      
      if (bucketsError) {
        addResult(`❌ 获取存储桶列表失败: ${bucketsError.message}`)
        
        // 尝试直接访问 avatars 存储桶
        addResult('🔄 尝试直接访问 avatars 存储桶...')
        const { data: files, error: listError } = await supabase.storage
          .from('avatars')
          .list('', { limit: 1 })
        
        if (listError) {
          addResult(`❌ 直接访问失败: ${listError.message}`)
          if (listError.message.includes('not found')) {
            addResult('💡 avatars 存储桶不存在，需要创建')
          }
        } else {
          addResult('✅ avatars 存储桶存在且可访问')
        }
        return
      }
      
      addResult(`✅ 成功获取存储桶列表，共 ${buckets?.length || 0} 个`)
      
      const avatarsBucket = buckets?.find(bucket => bucket.id === 'avatars')
      if (!avatarsBucket) {
        addResult('❌ avatars 存储桶不存在')
        addResult('💡 请在 Supabase Dashboard 中创建 avatars 存储桶')
        return
      }
      addResult(`✅ avatars 存储桶存在 (public: ${avatarsBucket.public})`)

      // 3. 测试上传
      addResult('📤 测试文件上传...')
      const testContent = 'test-upload'
      const testFile = new File([testContent], 'test.txt', { type: 'text/plain' })
      const testFileName = `${user.id}/test-${Date.now()}.txt`
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(testFileName, testFile)

      if (uploadError) {
        addResult(`❌ 上传失败: ${uploadError.message}`)
        if (uploadError.message.includes('row-level security')) {
          addResult('💡 需要配置 RLS 策略')
        }
      } else {
        addResult(`✅ 上传成功: ${uploadData.path}`)
        
        // 清理测试文件
        await supabase.storage.from('avatars').remove([testFileName])
        addResult('✅ 测试文件已清理')
      }

      addResult('🎉 Storage 检查完成')
      
    } catch (error) {
      addResult(`❌ 检查失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsLoading(false)
    }
  }

  const showQuickFix = () => {
    addResult('🔧 === 快速修复指南 ===')
    addResult('')
    addResult('1️⃣ 创建 avatars 存储桶:')
    addResult('   - 访问 Supabase Dashboard > Storage')
    addResult('   - 点击 "Create bucket"')
    addResult('   - 名称: avatars')
    addResult('   - ✅ 勾选 "Public bucket"')
    addResult('')
    addResult('2️⃣ 配置 RLS 策略 (在 SQL 编辑器中执行):')
    addResult('')
    addResult('-- 允许公开访问头像')
    addResult('CREATE POLICY "Public Avatar Access" ON storage.objects')
    addResult('FOR SELECT USING (bucket_id = \'avatars\');')
    addResult('')
    addResult('-- 允许用户上传自己的头像')
    addResult('CREATE POLICY "User Avatar Upload" ON storage.objects')
    addResult('FOR INSERT WITH CHECK (')
    addResult('  bucket_id = \'avatars\'')
    addResult('  AND auth.uid()::text = (storage.foldername(name))[1]')
    addResult(');')
    addResult('')
    addResult('3️⃣ 验证配置:')
    addResult('   - 重新运行此诊断工具')
    addResult('   - 应该显示 "Storage 检查完成"')
  }

  return (
    <Card className="w-full max-w-2xl">
      <CardHeader>
        <CardTitle>Storage 配置调试</CardTitle>
        <p className="text-sm text-gray-600 mt-2">
          简化版调试工具，解决卡住问题
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            onClick={testStorageSetup} 
            disabled={isLoading}
            className="flex-1"
          >
            {isLoading ? '检查中...' : '🔍 检查 Storage 配置'}
          </Button>
          
          <Button 
            onClick={showQuickFix} 
            variant="outline"
            disabled={isLoading}
          >
            🔧 快速修复
          </Button>
        </div>
        
        {results.length > 0 && (
          <div className="bg-gray-50 p-4 rounded-lg max-h-96 overflow-y-auto">
            <h3 className="font-semibold mb-2">检查结果：</h3>
            <div className="space-y-1 text-sm font-mono">
              {results.map((result, index) => (
                <div key={index} className="whitespace-pre-wrap">
                  {result}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="text-xs text-gray-500 space-y-1">
          <p>💡 <strong>提示</strong>：这是简化版调试工具，避免复杂检查导致卡住</p>
          <p>🔗 <strong>如果仍有问题</strong>：请使用左侧的"连接诊断工具"</p>
        </div>
      </CardContent>
    </Card>
  )
}
