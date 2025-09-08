import { Metadata } from 'next'
import { StructuredData } from '@/components/seo-structured-data'

export const metadata: Metadata = {
  title: '隐私政策 - My Homepage',
  description: '了解My Homepage如何收集、使用和保护您的个人信息。我们致力于保护用户隐私和数据安全。',
  robots: 'index,follow'
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData 
        type="features"
        title="隐私政策 - My Homepage"
        description="了解My Homepage如何收集、使用和保护您的个人信息"
        url="https://myhomepage.one/privacy"
      />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold mb-8">隐私政策</h1>
          <p className="text-muted-foreground mb-8">最后更新：2024年1月1日</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. 信息收集</h2>
            <p className="mb-4">
              My Homepage致力于保护您的隐私。我们收集的信息类型包括：
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>您主动提供的信息（如书签、分类等）</li>
              <li>自动收集的技术信息（如IP地址、浏览器类型）</li>
              <li>使用情况数据（如页面访问、功能使用）</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. 信息使用</h2>
            <p className="mb-4">我们使用收集的信息用于：</p>
            <ul className="list-disc pl-6 mb-4">
              <li>提供和改进我们的服务</li>
              <li>个性化用户体验</li>
              <li>分析使用模式和趋势</li>
              <li>确保服务安全和稳定</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. 数据存储</h2>
            <p className="mb-4">
              您的数据主要存储在本地浏览器中，我们不会将您的个人书签数据上传到我们的服务器，
              除非您明确选择使用云同步功能。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. 第三方服务</h2>
            <p className="mb-4">我们可能使用以下第三方服务：</p>
            <ul className="list-disc pl-6 mb-4">
              <li>Google Analytics - 用于网站分析</li>
              <li>字体服务 - 用于改善视觉体验</li>
              <li>CDN服务 - 用于提高加载速度</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. 用户权利</h2>
            <p className="mb-4">您有权：</p>
            <ul className="list-disc pl-6 mb-4">
              <li>访问您的个人数据</li>
              <li>更正不准确的数据</li>
              <li>删除您的数据</li>
              <li>导出您的数据</li>
              <li>撤回同意</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. 安全措施</h2>
            <p className="mb-4">
              我们采用行业标准的安全措施来保护您的信息，包括加密传输、
              安全存储和访问控制等。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. Cookie使用</h2>
            <p className="mb-4">
              我们使用Cookie来改善用户体验，包括记住您的偏好设置、
              分析网站使用情况等。您可以通过浏览器设置管理Cookie。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. 政策更新</h2>
            <p className="mb-4">
              我们可能会不时更新此隐私政策。重大变更将通过网站通知或
              电子邮件通知用户。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. 联系我们</h2>
            <p className="mb-4">
              如果您对此隐私政策有任何疑问，请通过以下方式联系我们：
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>邮箱：privacy@myhomepage.one</li>
              <li>地址：[公司地址]</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
