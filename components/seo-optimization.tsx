import Head from 'next/head'
import Script from 'next/script'

interface SEOOptimizationProps {
  title?: string
  description?: string
  keywords?: string[]
  canonicalUrl?: string
  ogImage?: string
  twitterImage?: string
  structuredData?: object
  noIndex?: boolean
}

export function SEOOptimization({
  title = "My Homepage - Personal Start Page & Bookmark Manager",
  description = "Create your perfect personal homepage and start page. Manage bookmarks intelligently, organize your favorite websites, and build a custom navigation center.",
  keywords = ['personal homepage', 'start page', 'bookmark manager', 'navigation center'],
  canonicalUrl,
  ogImage = '/opengraph-image',
  twitterImage = '/twitter-image',
  structuredData,
  noIndex = false
}: SEOOptimizationProps) {
  
  const currentUrl = canonicalUrl || 'https://myhomepage.one'
  
  return (
    <>
      <Head>
        {/* 🔧 基础SEO标签 */}
        <title>{title}</title>
        <meta name="description" content={description} />
        <meta name="keywords" content={keywords.join(', ')} />
        
        {/* 🔧 Canonical URL */}
        <link rel="canonical" href={currentUrl} />
        
        {/* 🔧 Robots指令 */}
        <meta name="robots" content={noIndex ? "noindex,nofollow" : "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"} />
        <meta name="googlebot" content={noIndex ? "noindex,nofollow" : "index,follow,max-snippet:-1,max-image-preview:large,max-video-preview:-1"} />
        
        {/* 🔧 Open Graph标签 */}
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content="My Homepage" />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={description} />
        <meta property="og:url" content={currentUrl} />
        <meta property="og:image" content={`https://myhomepage.one${ogImage}`} />
        <meta property="og:image:width" content="1200" />
        <meta property="og:image:height" content="630" />
        <meta property="og:image:alt" content={title} />
        <meta property="og:locale" content="zh_CN" />
        <meta property="og:locale:alternate" content="en_US" />
        
        {/* 🔧 Twitter Card标签 */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:site" content="@myhomepageone" />
        <meta name="twitter:creator" content="@myhomepageone" />
        <meta name="twitter:title" content={title} />
        <meta name="twitter:description" content={description} />
        <meta name="twitter:image" content={`https://myhomepage.one${twitterImage}`} />
        <meta name="twitter:image:alt" content={title} />
        
        {/* 🔧 移动端优化 */}
        <meta name="viewport" content="width=device-width,initial-scale=1,maximum-scale=5,user-scalable=yes,viewport-fit=cover" />
        <meta name="format-detection" content="telephone=no,date=no,email=no,address=no" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="My Homepage" />
        
        {/* 🔧 性能优化 */}
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        
        {/* 🔧 图标和主题 */}
        <link rel="icon" href="/favicon.svg" type="image/svg+xml" />
        <link rel="icon" href="/favicon.ico" sizes="any" />
        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />
        <meta name="theme-color" content="#3b82f6" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-config" content="/browserconfig.xml" />
        
        {/* 🔧 安全和隐私 */}
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <meta httpEquiv="X-Content-Type-Options" content="nosniff" />
        <meta httpEquiv="X-Frame-Options" content="DENY" />
        <meta httpEquiv="X-XSS-Protection" content="1; mode=block" />
        
        {/* 🔧 语言和地区 */}
        <meta httpEquiv="content-language" content="zh-CN" />
        <link rel="alternate" hrefLang="zh-CN" href="https://myhomepage.one" />
        <link rel="alternate" hrefLang="en" href="https://myhomepage.one/en" />
        <link rel="alternate" hrefLang="x-default" href="https://myhomepage.one" />
        
        {/* 🔧 PWA相关 */}
        <link rel="manifest" href="/manifest.json" />
        <meta name="application-name" content="My Homepage" />
        <meta name="apple-mobile-web-app-title" content="My Homepage" />
        
        {/* 🔧 搜索引擎验证 */}
        <meta name="google-site-verification" content={process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || ""} />
        <meta name="msvalidate.01" content={process.env.NEXT_PUBLIC_BING_VERIFICATION || ""} />
        <meta name="yandex-verification" content={process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || ""} />
        
        {/* 🔧 作者和版权信息 */}
        <meta name="author" content="My Homepage Team" />
        <meta name="copyright" content="© 2024 My Homepage. All rights reserved." />
        <meta name="generator" content="Next.js" />
        
        {/* 🔧 页面分类和标签 */}
        <meta name="category" content="Technology" />
        <meta name="classification" content="Personal Homepage, Bookmark Manager, Start Page" />
        <meta name="coverage" content="Worldwide" />
        <meta name="distribution" content="Global" />
        <meta name="rating" content="General" />
        
        {/* 🔧 缓存控制 */}
        <meta httpEquiv="Cache-Control" content="public, max-age=31536000" />
        <meta httpEquiv="Expires" content="31536000" />
      </Head>
      
      {/* 🔧 结构化数据 */}
      {structuredData && (
        <Script
          id="structured-data"
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(structuredData)
          }}
        />
      )}
      
      {/* 🔧 性能监控脚本 */}
      <Script
        id="performance-monitor"
        strategy="afterInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // Core Web Vitals监控
            function sendToAnalytics(metric) {
              if (typeof gtag !== 'undefined') {
                gtag('event', metric.name, {
                  event_category: 'Web Vitals',
                  event_label: metric.id,
                  value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
                  non_interaction: true,
                });
              }
            }
            
            // 动态导入web-vitals
            import('https://unpkg.com/web-vitals@3/dist/web-vitals.js').then(({ onCLS, onFID, onFCP, onLCP, onTTFB }) => {
              onCLS(sendToAnalytics);
              onFID(sendToAnalytics);
              onFCP(sendToAnalytics);
              onLCP(sendToAnalytics);
              onTTFB(sendToAnalytics);
            }).catch(err => {
              console.warn('Failed to load web-vitals:', err);
            });
          `
        }}
      />
      
      {/* 🔧 预加载关键资源 */}
      <Script
        id="resource-preloader"
        strategy="beforeInteractive"
        dangerouslySetInnerHTML={{
          __html: `
            // 预加载关键字体
            const fontPreload = document.createElement('link');
            fontPreload.rel = 'preload';
            fontPreload.href = 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap';
            fontPreload.as = 'style';
            fontPreload.onload = function() { this.onload = null; this.rel = 'stylesheet'; };
            document.head.appendChild(fontPreload);
            
            // 预加载关键图片
            const criticalImages = ['/placeholder-logo.png', '/og-image.jpg'];
            criticalImages.forEach(src => {
              const link = document.createElement('link');
              link.rel = 'preload';
              link.href = src;
              link.as = 'image';
              document.head.appendChild(link);
            });
          `
        }}
      />
    </>
  )
}
