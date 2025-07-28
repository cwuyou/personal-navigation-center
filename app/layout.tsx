import type { Metadata, Viewport } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { ThemeProvider } from '@/components/theme-provider'
import { Toaster } from '@/components/ui/toaster'
import { Toaster as SonnerToaster } from 'sonner'

export const metadata: Metadata = {
  title: '个人导航中心',
  description: '个人书签管理和导航工具',
  keywords: ['书签', '导航', '个人工具', '书签管理'],
  authors: [{ name: '个人导航中心' }],
  creator: '个人导航中心',
  publisher: '个人导航中心',
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: '个人导航中心',
  },
  openGraph: {
    type: 'website',
    locale: 'zh_CN',
    title: '个人导航中心',
    description: '个人书签管理和导航工具',
    siteName: '个人导航中心',
  },
  twitter: {
    card: 'summary_large_image',
    title: '个人导航中心',
    description: '个人书签管理和导航工具',
  },
}

export const viewport: Viewport = {
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#000000' },
  ],
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="zh-CN" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192x192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="个人导航中心" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="msapplication-TileColor" content="#3b82f6" />
        <meta name="msapplication-tap-highlight" content="no" />
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
                    if (config.compactMode) root.classList.add('compact-mode');
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
      </head>
      <body className={`${GeistSans.variable} ${GeistMono.variable}`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          {children}
          <Toaster />
          <SonnerToaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  )
}
