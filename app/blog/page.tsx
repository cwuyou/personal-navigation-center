import { Metadata } from 'next'
import Link from 'next/link'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { CalendarDays, Clock, ArrowRight } from "lucide-react"

export const metadata: Metadata = {
  title: 'Blog - My Homepage One | Personal Homepage & Start Page Tips',
  description: 'Learn how to create the perfect personal homepage, manage bookmarks effectively, and optimize your browser start page. Tips, tutorials, and best practices for My Homepage One.',
  keywords: [
    'personal homepage blog', 'start page tips', 'bookmark management guide', 
    'homepage tutorial', 'browser customization', 'productivity tips',
    '个人主页教程', '书签管理技巧', '起始页设置'
  ],
}

const blogPosts = [
  {
    id: 'perfect-personal-homepage',
    title: 'How to Create the Perfect Personal Homepage in 2024',
    description: 'A comprehensive guide to designing and organizing your ideal personal homepage that serves as an efficient start page for your daily browsing.',
    excerpt: 'Learn the essential elements of a great personal homepage, from bookmark organization to visual design principles that enhance productivity.',
    date: '2024-01-15',
    readTime: '8 min read',
    tags: ['Personal Homepage', 'Start Page', 'Design'],
    featured: true,
  },
  {
    id: 'bookmark-management-best-practices',
    title: 'Bookmark Management Best Practices: From Chaos to Organization',
    description: 'Transform your bookmark collection from a chaotic mess into a well-organized navigation system with these proven strategies.',
    excerpt: 'Discover advanced techniques for categorizing, tagging, and maintaining your bookmarks for maximum efficiency and easy access.',
    date: '2024-01-10',
    readTime: '6 min read',
    tags: ['Bookmarks', 'Organization', 'Productivity'],
    featured: true,
  },
  {
    id: 'browser-start-page-optimization',
    title: 'Browser Start Page Optimization: Speed Up Your Daily Workflow',
    description: 'Optimize your browser start page to reduce friction and increase productivity in your daily web browsing routine.',
    excerpt: 'Learn how to configure your start page for maximum efficiency, including quick access patterns and visual organization.',
    date: '2024-01-05',
    readTime: '5 min read',
    tags: ['Start Page', 'Browser', 'Workflow'],
    featured: false,
  },
  {
    id: 'custom-homepage-vs-default',
    title: 'Custom Homepage vs Default Browser Pages: Why Personalization Matters',
    description: 'Explore the benefits of using a custom personal homepage instead of default browser start pages and how it impacts productivity.',
    excerpt: 'Compare the advantages of personalized homepages over generic browser defaults and understand the productivity gains.',
    date: '2024-01-01',
    readTime: '7 min read',
    tags: ['Personal Homepage', 'Customization', 'Productivity'],
    featured: false,
  },
  {
    id: 'mobile-homepage-design',
    title: 'Designing Your Personal Homepage for Mobile: Responsive Best Practices',
    description: 'Essential tips for creating a mobile-friendly personal homepage that works seamlessly across all devices.',
    excerpt: 'Master the art of responsive design for your personal homepage, ensuring optimal usability on smartphones and tablets.',
    date: '2023-12-28',
    readTime: '6 min read',
    tags: ['Mobile Design', 'Responsive', 'UX'],
    featured: false,
  },
  {
    id: 'bookmark-import-export-guide',
    title: 'Complete Guide to Bookmark Import and Export Across Browsers',
    description: 'Step-by-step instructions for migrating your bookmarks between different browsers and bookmark management tools.',
    excerpt: 'Learn how to seamlessly transfer your bookmark collection between Chrome, Firefox, Safari, and other browsers.',
    date: '2023-12-25',
    readTime: '4 min read',
    tags: ['Bookmarks', 'Migration', 'Tutorial'],
    featured: false,
  },
]

export default function BlogPage() {
  const featuredPosts = blogPosts.filter(post => post.featured)
  const regularPosts = blogPosts.filter(post => !post.featured)

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
              <h1 className="text-xl font-bold">My Homepage One</h1>
            </Link>
            <nav className="flex items-center space-x-4">
              <Link href="/" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Home
              </Link>
              <Link href="/features" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
                Features
              </Link>
              <Link href="/blog" className="text-sm font-medium text-foreground">
                Blog
              </Link>
            </nav>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary/5 to-primary/10 border-b">
        <div className="container mx-auto px-4 py-12">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-3xl md:text-4xl font-bold mb-4">
              Personal Homepage & Start Page Blog
            </h1>
            <p className="text-lg text-muted-foreground mb-6">
              Tips, tutorials, and best practices for creating the perfect <strong>personal homepage</strong>, 
              managing <strong>bookmarks</strong> effectively, and optimizing your browser <strong>start page</strong> 
              for maximum productivity.
            </p>
            <div className="flex flex-wrap justify-center gap-2">
              <Badge variant="secondary">Personal Homepage</Badge>
              <Badge variant="secondary">Start Page</Badge>
              <Badge variant="secondary">Bookmark Management</Badge>
              <Badge variant="secondary">Productivity</Badge>
            </div>
          </div>
        </div>
      </section>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-12">
        {/* Featured Posts */}
        {featuredPosts.length > 0 && (
          <section className="mb-12">
            <h2 className="text-2xl font-bold mb-6">Featured Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {featuredPosts.map((post) => (
                <Card key={post.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                      <CalendarDays className="h-4 w-4" />
                      <span>{new Date(post.date).toLocaleDateString()}</span>
                      <Clock className="h-4 w-4 ml-2" />
                      <span>{post.readTime}</span>
                    </div>
                    <CardTitle className="hover:text-primary transition-colors">
                      <Link href={`/blog/${post.id}`}>
                        {post.title}
                      </Link>
                    </CardTitle>
                    <CardDescription>{post.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.map((tag) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                      <Link 
                        href={`/blog/${post.id}`}
                        className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                      >
                        Read more <ArrowRight className="h-3 w-3" />
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>
        )}

        {/* All Posts */}
        <section>
          <h2 className="text-2xl font-bold mb-6">All Articles</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post) => (
              <Card key={post.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                    <CalendarDays className="h-4 w-4" />
                    <span>{new Date(post.date).toLocaleDateString()}</span>
                    <Clock className="h-4 w-4 ml-2" />
                    <span>{post.readTime}</span>
                  </div>
                  <CardTitle className="text-lg hover:text-primary transition-colors">
                    <Link href={`/blog/${post.id}`}>
                      {post.title}
                    </Link>
                  </CardTitle>
                  <CardDescription className="text-sm">{post.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-4">{post.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                      {post.tags.length > 2 && (
                        <Badge variant="outline" className="text-xs">
                          +{post.tags.length - 2}
                        </Badge>
                      )}
                    </div>
                    <Link 
                      href={`/blog/${post.id}`}
                      className="text-sm text-primary hover:text-primary/80 transition-colors flex items-center gap-1"
                    >
                      Read <ArrowRight className="h-3 w-3" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* SEO Content */}
        <section className="mt-16 prose prose-gray max-w-none">
          <div className="bg-muted/30 rounded-lg p-6">
            <h2 className="text-xl font-semibold mb-4">About Personal Homepage and Start Page Optimization</h2>
            <p className="text-muted-foreground mb-4">
              A well-designed <strong>personal homepage</strong> serves as more than just a browser <strong>start page</strong> – 
              it's your digital command center. Whether you're looking to improve your <strong>bookmark management</strong>, 
              create a more efficient workflow, or simply want a beautiful and functional homepage, our blog provides 
              practical tips and in-depth tutorials.
            </p>
            <p className="text-muted-foreground">
              From basic <strong>bookmark organization</strong> techniques to advanced <strong>start page customization</strong>, 
              we cover everything you need to know about creating and maintaining the perfect personal homepage. 
              Our guides are designed for both beginners and power users who want to maximize their browsing efficiency.
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t bg-muted/30 mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-sm text-muted-foreground">
            <p>&copy; 2024 My Homepage One. All rights reserved.</p>
            <p className="mt-2">
              Create your perfect <strong>personal homepage</strong> and <strong>start page</strong> with 
              intelligent <strong>bookmark management</strong>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
