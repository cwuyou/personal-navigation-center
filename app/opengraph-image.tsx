import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'My Homepage - Personal Start Page & Bookmark Manager'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          height: '100%',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          backgroundColor: '#ffffff',
          backgroundImage: 'linear-gradient(45deg, #f8fafc 0%, #e2e8f0 100%)',
          fontSize: 32,
          fontWeight: 600,
        }}
      >
        {/* 背景装饰 */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundImage: 'radial-gradient(circle at 25% 25%, #3b82f6 0%, transparent 50%), radial-gradient(circle at 75% 75%, #8b5cf6 0%, transparent 50%)',
            opacity: 0.1,
          }}
        />
        
        {/* 主要内容 */}
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            textAlign: 'center',
            zIndex: 1,
          }}
        >
          {/* Logo/Icon */}
          <div
            style={{
              width: 120,
              height: 120,
              borderRadius: 24,
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 40,
              boxShadow: '0 20px 40px rgba(59, 130, 246, 0.3)',
            }}
          >
            <div
              style={{
                fontSize: 60,
                color: 'white',
              }}
            >
              🏠
            </div>
          </div>
          
          {/* 标题 */}
          <div
            style={{
              fontSize: 64,
              fontWeight: 800,
              color: '#1f2937',
              marginBottom: 20,
              lineHeight: 1.1,
            }}
          >
            My Homepage
          </div>
          
          {/* 副标题 */}
          <div
            style={{
              fontSize: 32,
              color: '#6b7280',
              marginBottom: 40,
              maxWidth: 800,
              lineHeight: 1.3,
            }}
          >
            Personal Start Page & Bookmark Manager
          </div>
          
          {/* 特性标签 */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              justifyContent: 'center',
            }}
          >
            {['智能书签管理', '个人主页定制', '快速导航中心'].map((feature, index) => (
              <div
                key={index}
                style={{
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  padding: '12px 24px',
                  borderRadius: 20,
                  fontSize: 20,
                  fontWeight: 500,
                }}
              >
                {feature}
              </div>
            ))}
          </div>
        </div>
        
        {/* 底部品牌 */}
        <div
          style={{
            position: 'absolute',
            bottom: 40,
            right: 40,
            fontSize: 18,
            color: '#9ca3af',
            fontWeight: 500,
          }}
        >
          myhomepage.one
        </div>
      </div>
    ),
    {
      ...size,
    }
  )
}
