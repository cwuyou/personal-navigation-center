import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'My Homepage - Personal Start Page & Bookmark Manager'
export const size = {
  width: 1200,
  height: 600,
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
          backgroundColor: '#1f2937',
          backgroundImage: 'linear-gradient(135deg, #1f2937 0%, #111827 100%)',
          fontSize: 32,
          fontWeight: 600,
          color: 'white',
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
            backgroundImage: 'radial-gradient(circle at 20% 20%, #3b82f6 0%, transparent 40%), radial-gradient(circle at 80% 80%, #8b5cf6 0%, transparent 40%)',
            opacity: 0.3,
          }}
        />
        
        {/* 主要内容 */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 40,
            zIndex: 1,
          }}
        >
          {/* Logo */}
          <div
            style={{
              width: 100,
              height: 100,
              borderRadius: 20,
              backgroundColor: '#3b82f6',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 20px 40px rgba(59, 130, 246, 0.4)',
            }}
          >
            <div
              style={{
                fontSize: 50,
                color: 'white',
              }}
            >
              🏠
            </div>
          </div>
          
          {/* 文字内容 */}
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-start',
            }}
          >
            <div
              style={{
                fontSize: 56,
                fontWeight: 800,
                color: 'white',
                marginBottom: 10,
                lineHeight: 1.1,
              }}
            >
              My Homepage
            </div>
            
            <div
              style={{
                fontSize: 28,
                color: '#d1d5db',
                marginBottom: 20,
                lineHeight: 1.2,
              }}
            >
              Personal Start Page & Bookmark Manager
            </div>
            
            {/* 特性点 */}
            <div
              style={{
                display: 'flex',
                gap: 15,
                fontSize: 18,
                color: '#9ca3af',
              }}
            >
              <span>✨ 智能管理</span>
              <span>🚀 快速访问</span>
              <span>🎨 个性定制</span>
            </div>
          </div>
        </div>
        
        {/* 底部URL */}
        <div
          style={{
            position: 'absolute',
            bottom: 30,
            fontSize: 20,
            color: '#6b7280',
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
