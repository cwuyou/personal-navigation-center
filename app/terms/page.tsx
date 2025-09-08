import { Metadata } from 'next'
import { StructuredData } from '@/components/seo-structured-data'

export const metadata: Metadata = {
  title: '服务条款 - My Homepage',
  description: '阅读My Homepage的服务条款，了解使用我们服务时的权利和义务。',
  robots: 'index,follow'
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-background">
      <StructuredData 
        type="features"
        title="服务条款 - My Homepage"
        description="阅读My Homepage的服务条款，了解使用我们服务时的权利和义务"
        url="https://myhomepage.one/terms"
      />
      
      <div className="max-w-4xl mx-auto px-4 py-16">
        <div className="prose prose-lg max-w-none">
          <h1 className="text-4xl font-bold mb-8">服务条款</h1>
          <p className="text-muted-foreground mb-8">最后更新：2024年1月1日</p>
          
          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">1. 服务描述</h2>
            <p className="mb-4">
              My Homepage是一个个人主页和书签管理工具，帮助用户创建自定义的起始页面，
              智能管理书签，并提供快速导航功能。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">2. 用户责任</h2>
            <p className="mb-4">使用我们的服务时，您同意：</p>
            <ul className="list-disc pl-6 mb-4">
              <li>提供准确、完整的信息</li>
              <li>不进行任何非法或有害的活动</li>
              <li>不侵犯他人的知识产权</li>
              <li>不传播恶意软件或病毒</li>
              <li>遵守所有适用的法律法规</li>
            </ul>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">3. 知识产权</h2>
            <p className="mb-4">
              My Homepage的所有内容、功能和服务均受版权、商标和其他知识产权法保护。
              未经明确授权，您不得复制、修改、分发或创建衍生作品。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">4. 用户内容</h2>
            <p className="mb-4">
              您对自己创建、上传或分享的内容负责。您保证拥有必要的权利，
              并授予我们使用、存储和处理这些内容的权限，以提供服务。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">5. 服务可用性</h2>
            <p className="mb-4">
              我们努力保持服务的可用性，但不保证服务不会中断。
              我们可能因维护、更新或其他原因暂时中断服务。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">6. 免责声明</h2>
            <p className="mb-4">
              服务按"现状"提供，我们不对服务的准确性、完整性或可靠性做出保证。
              在法律允许的最大范围内，我们排除所有明示或暗示的保证。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">7. 责任限制</h2>
            <p className="mb-4">
              在任何情况下，我们对因使用或无法使用服务而产生的任何直接、
              间接、偶然、特殊或后果性损害不承担责任。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">8. 服务修改</h2>
            <p className="mb-4">
              我们保留随时修改、暂停或终止服务的权利，恕不另行通知。
              我们也可能更新这些条款，重大变更将提前通知用户。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">9. 争议解决</h2>
            <p className="mb-4">
              因使用本服务产生的任何争议将通过友好协商解决。
              如协商不成，将提交至有管辖权的法院解决。
            </p>
          </section>

          <section className="mb-8">
            <h2 className="text-2xl font-semibold mb-4">10. 联系信息</h2>
            <p className="mb-4">
              如果您对这些条款有任何疑问，请联系我们：
            </p>
            <ul className="list-disc pl-6 mb-4">
              <li>邮箱：legal@myhomepage.one</li>
              <li>地址：[公司地址]</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
