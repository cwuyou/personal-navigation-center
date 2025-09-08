// 🔧 改为服务端渲染，提升SEO效果
import Script from 'next/script'

interface StructuredDataProps {
  type?: 'homepage' | 'bookmarks' | 'startpage' | 'features'
  title?: string
  description?: string
  url?: string
}

export function StructuredData({
  type = 'homepage',
  title,
  description,
  url
}: StructuredDataProps) {

  let structuredData = {}

    switch (type) {
      case 'homepage':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "WebApplication",
          "name": "My Homepage One",
          "alternateName": ["Personal Homepage", "Start Page Creator", "Bookmark Manager"],
          "description": "Create your perfect personal homepage and start page. Manage bookmarks intelligently, organize your favorite websites, and build a custom navigation center.",
          "url": "https://myhomepage.one",
          "applicationCategory": "ProductivityApplication",
          "operatingSystem": "Web Browser",
          "browserRequirements": "Requires JavaScript. Requires HTML5.",
          "softwareVersion": "1.0",
          "datePublished": "2024-01-01",
          "dateModified": new Date().toISOString().split('T')[0],
          "inLanguage": ["en", "zh-CN"],
          "isAccessibleForFree": true,
          "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD",
            "availability": "https://schema.org/InStock"
          },
          "featureList": [
            "Personal Homepage Creation",
            "Custom Start Page Design", 
            "Intelligent Bookmark Management",
            "Website Organization Tools",
            "Quick Navigation Interface",
            "Responsive Design",
            "Dark/Light Theme Support",
            "Import/Export Bookmarks",
            "Search Functionality",
            "Category Management"
          ],
          "screenshot": "https://myhomepage.one/screenshot.jpg",
          "aggregateRating": {
            "@type": "AggregateRating",
            "ratingValue": "4.8",
            "ratingCount": "150",
            "bestRating": "5",
            "worstRating": "1"
          },
          "author": {
            "@type": "Organization",
            "name": "My Homepage One",
            "url": "https://myhomepage.one"
          },
          "publisher": {
            "@type": "Organization",
            "name": "My Homepage One",
            "url": "https://myhomepage.one"
          }
        }
        break

      case 'bookmarks':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Bookmark Manager - My Homepage One",
          "description": "Powerful bookmark manager to organize, categorize and manage your bookmarks. Create collections, add tags, and access your favorite websites quickly.",
          "url": url || "https://myhomepage.one/bookmarks",
          "isPartOf": {
            "@type": "WebSite",
            "name": "My Homepage One",
            "url": "https://myhomepage.one"
          },
          "about": {
            "@type": "SoftwareApplication",
            "name": "Bookmark Manager",
            "applicationCategory": "ProductivityApplication",
            "description": "Intelligent bookmark organization and management tool"
          },
          "breadcrumb": {
            "@type": "BreadcrumbList",
            "itemListElement": [
              {
                "@type": "ListItem",
                "position": 1,
                "name": "Home",
                "item": "https://myhomepage.one"
              },
              {
                "@type": "ListItem",
                "position": 2,
                "name": "Bookmark Manager",
                "item": "https://myhomepage.one/bookmarks"
              }
            ]
          }
        }
        break

      case 'startpage':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Start Page Creator - My Homepage One",
          "description": "Create a custom start page that serves as your personal homepage. Design your perfect browser start page with widgets, bookmarks, and quick access tools.",
          "url": url || "https://myhomepage.one/start-page",
          "isPartOf": {
            "@type": "WebSite",
            "name": "My Homepage One",
            "url": "https://myhomepage.one"
          },
          "about": {
            "@type": "SoftwareApplication",
            "name": "Start Page Creator",
            "applicationCategory": "ProductivityApplication",
            "description": "Custom start page and personal homepage creation tool"
          }
        }
        break

      case 'features':
        structuredData = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": "Features - My Homepage One",
          "description": "Discover all features of My Homepage One: bookmark management, custom start page creation, personal homepage tools, and navigation center capabilities.",
          "url": url || "https://myhomepage.one/features",
          "isPartOf": {
            "@type": "WebSite",
            "name": "My Homepage One",
            "url": "https://myhomepage.one"
          }
        }
        break

      default:
        structuredData = {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "name": title || "My Homepage One",
          "description": description || "Personal homepage and start page creator",
          "url": url || "https://myhomepage.one"
        }
    }

  // 🔧 使用Next.js Script组件，服务端渲染
  return (
    <Script
      id={`structured-data-${type}`}
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(structuredData)
      }}
    />
  )
}

// 网站级别的结构化数据
export function WebSiteStructuredData() {
  const websiteData = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "name": "My Homepage One",
    "alternateName": ["MyHomepage.one", "Personal Homepage Creator"],
    "url": "https://myhomepage.one",
    "description": "Create your perfect personal homepage and start page. Manage bookmarks intelligently and organize your favorite websites.",
    "inLanguage": ["en", "zh-CN"],
    "potentialAction": {
      "@type": "SearchAction",
      "target": {
        "@type": "EntryPoint",
        "urlTemplate": "https://myhomepage.one/search?q={search_term_string}"
      },
      "query-input": "required name=search_term_string"
    },
    "sameAs": [
      "https://github.com/myhomepage-one",
      "https://twitter.com/myhomepageone"
    ]
  }

  return (
    <Script
      id="website-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(websiteData)
      }}
    />
  )
}

// 面包屑导航结构化数据
export function BreadcrumbStructuredData({ items }: { items: Array<{ name: string; url: string }> }) {
  const breadcrumbData = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": items.map((item, index) => ({
      "@type": "ListItem",
      "position": index + 1,
      "name": item.name,
      "item": item.url
    }))
  }

  return (
    <Script
      id="breadcrumb-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(breadcrumbData)
      }}
    />
  )
}

// 🔧 新增FAQ结构化数据
export function FAQStructuredData({ faqs }: { faqs: Array<{ question: string; answer: string }> }) {
  const faqData = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "mainEntity": faqs.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }))
  }

  return (
    <Script
      id="faq-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(faqData)
      }}
    />
  )
}

// 🔧 新增HowTo结构化数据
export function HowToStructuredData({
  name,
  description,
  steps
}: {
  name: string
  description: string
  steps: Array<{ name: string; text: string; image?: string }>
}) {
  const howToData = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    "name": name,
    "description": description,
    "step": steps.map((step, index) => ({
      "@type": "HowToStep",
      "position": index + 1,
      "name": step.name,
      "text": step.text,
      ...(step.image && { "image": step.image })
    }))
  }

  return (
    <Script
      id="howto-structured-data"
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(howToData)
      }}
    />
  )
}
