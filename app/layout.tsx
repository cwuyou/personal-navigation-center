import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'
import Script from 'next/script'
import { GoogleAnalytics } from '@/components/google-analytics'

import ErrorBoundary from '@/components/error-boundary'

export const metadata: Metadata = {
  title: {
    default: 'My Homepage - Personal Start Page & Bookmark Manager | 个人主页导航中心',
    template: '%s | My Homepage'
  },
  description: 'Create your perfect personal homepage and start page. Manage bookmarks intelligently, organize your favorite websites, and build a custom navigation center. MyHomepage.one - 打造专属的个人主页和起始页，智能管理书签，快速访问常用网站。',
  keywords: [
    'my homepage', 'start page', 'startpage', 'bookmarks', 'personal homepage',
    'bookmark manager', 'navigation center', 'custom start page', 'homepage creator',
    '个人主页', '起始页', '书签管理', '导航中心', '自定义主页', '个人导航'
  ],
  authors: [{ name: 'My Homepage', url: 'https://myhomepage.one' }],
  creator: 'My Homepage',
  publisher: 'My Homepage',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'My Homepage',
  },
  openGraph: {
    type: 'website',
    siteName: 'My Homepage',
    title: 'My Homepage - Personal Start Page & Bookmark Manager',
    description: 'Create your perfect personal homepage and start page. Manage bookmarks intelligently and organize your favorite websites.',
    url: 'https://myhomepage.one',
    locale: 'en_US',
    images: [
      {
        url: 'https://myhomepage.one/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'My Homepage - Personal Start Page & Bookmark Manager',
      }
    ],
  },
  twitter: {
    card: 'summary_large_image',
    site: '@myhomepageone',
    title: 'My Homepage - Personal Start Page & Bookmark Manager',
    description: 'Create your perfect personal homepage and start page. Manage bookmarks intelligently and organize your favorite websites.',
    images: ['https://myhomepage.one/twitter-image.jpg'],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || 'your-google-verification-code',
    yandex: process.env.NEXT_PUBLIC_YANDEX_VERIFICATION || 'your-yandex-verification-code',
    yahoo: process.env.NEXT_PUBLIC_YAHOO_VERIFICATION || 'your-yahoo-verification-code',
    other: {
      'msvalidate.01': process.env.NEXT_PUBLIC_BING_VERIFICATION || 'your-bing-verification-code'
    }
  },
  // 🔧 添加canonical URL
  alternates: {
    canonical: 'https://myhomepage.one',
    languages: {
      'en': 'https://myhomepage.one/en',
      'zh-CN': 'https://myhomepage.one',
    }
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // 🔧 允许用户缩放，提升可访问性
  userScalable: true, // 🔧 启用用户缩放，符合WCAG标准
  viewportFit: 'cover',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        {/* 🔧 关键资源预加载 */}
        <link rel="preload" href="/fonts/geist-sans.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="preload" href="/fonts/geist-mono.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
        <link rel="dns-prefetch" href="//www.google-analytics.com" />
        <link rel="dns-prefetch" href="//fonts.googleapis.com" />
        <link rel="dns-prefetch" href="//fonts.gstatic.com" />

        {/* 🔧 PWA和移动端优化 */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="个人导航中心" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
        <meta name="format-detection" content="telephone=no, date=no, email=no, address=no" />

        {/* 🔧 性能优化 */}
        <meta httpEquiv="x-dns-prefetch-control" content="on" />
        <meta name="referrer" content="strict-origin-when-cross-origin" />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  const saved = localStorage.getItem('theme-config');
                  if (saved) {
                    const config = JSON.parse(saved);
                    const root = document.documentElement;
                    root.style.setProperty('--primary', config.primaryColor, 'important');
                    root.style.setProperty('--radius', config.borderRadius + 'px', 'important');
                    root.style.setProperty('--primary-foreground', '0 0% 98%', 'important');
                    root.style.setProperty('--ring', config.primaryColor, 'important');
                    if (config.fontSize && config.fontSize !== 14) {
                      root.style.fontSize = config.fontSize + 'px';
                    }

                    if (!config.animations) root.classList.add('no-animations');
                    if (config.cardStyle && config.cardStyle !== 'default') {
                      root.classList.add('card-style-' + config.cardStyle);
                    }
                    if (config.layout && config.layout !== 'grid') {
                      root.classList.add('layout-' + config.layout);
                    }
                  }
                } catch (e) {
                  console.error('Failed to load theme:', e);
                }
              })();
            `,
          }}
        />
        {/* 简化的全局错误处理 */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              // 全局未处理的Promise rejection处理器
              window.addEventListener('unhandledrejection', function(event) {
                const error = event.reason;
                const errorMessage = error instanceof Error ? error.message : String(error);

                // 静默处理所有未捕获的Promise rejection
                console.warn('未处理的Promise rejection:', errorMessage);
                event.preventDefault();
              });

              // 全局错误处理器
              window.addEventListener('error', function(event) {
                const errorMessage = event.message || '';

                // 静默处理所有全局错误
                console.warn('全局错误:', errorMessage);
                event.preventDefault();
              });
            `,
          }}
        />
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <GoogleAnalytics />
        <ErrorBoundary>
          <ThemeProvider
            attribute="class"
            defaultTheme="light"
            enableSystem
            disableTransitionOnChange
          >
            {children}
            <Toaster />
            <SonnerToaster position="top-right" />
          </ThemeProvider>
        </ErrorBoundary>
      </body>
    </html>
  )
}
