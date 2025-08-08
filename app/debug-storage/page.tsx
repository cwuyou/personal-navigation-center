import { SimpleStorageDebug } from '@/components/simple-storage-debug'
import { ConnectionTest } from '@/components/connection-test'

export default function DebugStoragePage() {
  return (
    <div className="container mx-auto py-8 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-4">Storage 配置调试</h1>
          <p className="text-gray-600 mb-4">
            这个工具可以帮助您诊断和解决 Supabase Storage 配置问题。
          </p>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-blue-800 mb-2">🎯 解决问题</h2>
            <ul className="text-sm text-blue-700 space-y-1">
              <li>• "avatars 存储桶不存在" 错误</li>
              <li>• 头像上传失败问题</li>
              <li>• Storage 权限配置问题</li>
              <li>• RLS 策略配置错误</li>
            </ul>
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <h2 className="font-semibold text-yellow-800 mb-2">⚠️ 使用前提</h2>
            <ul className="text-sm text-yellow-700 space-y-1">
              <li>• 确保已配置 Supabase 环境变量</li>
              <li>• 需要登录用户账号</li>
              <li>• 确保网络连接正常</li>
            </ul>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
          <ConnectionTest />
          <SimpleStorageDebug />
        </div>

        <div className="mt-8 space-y-6">
          <div className="bg-gray-50 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">📚 常见问题解答</h2>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Q: 为什么显示"avatars 存储桶不存在"？</h3>
                <p className="text-sm text-gray-600">
                  A: 可能的原因：1) 存储桶确实未创建；2) 权限问题导致无法访问；3) 网络连接问题。
                  使用上方的诊断工具可以准确定位问题。
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Q: 如何创建 avatars 存储桶？</h3>
                <p className="text-sm text-gray-600">
                  A: 访问 Supabase Dashboard → Storage → Create bucket → 名称填写 "avatars" → 勾选 "Public bucket" → 创建。
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Q: RLS 策略如何配置？</h3>
                <p className="text-sm text-gray-600">
                  A: 点击上方的"快速修复"按钮，复制 SQL 脚本，在 Supabase SQL 编辑器中执行即可。
                </p>
              </div>
              
              <div>
                <h3 className="font-medium text-gray-800 mb-2">Q: 配置完成后如何验证？</h3>
                <p className="text-sm text-gray-600">
                  A: 重新运行诊断工具，如果显示"所有功能正常"，说明配置成功。然后可以在个人设置中测试头像上传功能。
                </p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <h2 className="font-semibold text-green-800 mb-2">✅ 配置成功标志</h2>
            <ul className="text-sm text-green-700 space-y-1">
              <li>• ✅ Supabase 连接正常</li>
              <li>• ✅ 用户已登录</li>
              <li>• ✅ avatars 存储桶存在</li>
              <li>• ✅ 文件上传成功</li>
              <li>• ✅ 公共 URL 生成成功</li>
              <li>• ✅ 测试文件已清理</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
