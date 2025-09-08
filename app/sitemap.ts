import { MetadataRoute } from 'next'

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://myhomepage.one'
  const currentDate = new Date().toISOString()

  // 🔧 静态页面
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: baseUrl,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/dashboard`,
      lastModified: currentDate,
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${baseUrl}/help`,
      lastModified: currentDate,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${baseUrl}/demo`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.6,
    },
    {
      url: `${baseUrl}/privacy`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    {
      url: `${baseUrl}/terms`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.5,
    }
  ]

  // 🔧 动态生成博客页面（如果有的话）
  const blogPages = await generateBlogSitemap(baseUrl)

  // 🔧 功能页面
  const featurePages: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/features/bookmark-manager`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/start-page`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${baseUrl}/features/personal-homepage`,
      lastModified: currentDate,
      changeFrequency: 'monthly',
      priority: 0.8,
    }
  ]

  return [...staticPages, ...blogPages, ...featurePages]
}

// 🔧 生成博客sitemap
async function generateBlogSitemap(baseUrl: string): Promise<MetadataRoute.Sitemap> {
  try {
    // 这里可以从CMS或数据库获取博客文章
    // const posts = await fetchBlogPosts()

    // 示例博客文章
    const blogPosts = [
      {
        slug: 'how-to-create-personal-homepage',
        lastModified: '2024-01-15',
        priority: 0.7
      },
      {
        slug: 'bookmark-management-tips',
        lastModified: '2024-01-10',
        priority: 0.7
      },
      {
        slug: 'start-page-customization-guide',
        lastModified: '2024-01-05',
        priority: 0.7
      }
    ]

    return blogPosts.map(post => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: post.lastModified,
      changeFrequency: 'monthly' as const,
      priority: post.priority
    }))
  } catch (error) {
    console.error('Error generating blog sitemap:', error)
    return []
  }
}
