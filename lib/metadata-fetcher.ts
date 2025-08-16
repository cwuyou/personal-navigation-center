/**
 * 网页元数据获取工具
 * 用于自动获取网页的标题、描述、图标等信息
 */

export interface WebsiteMetadata {
  title?: string
  description?: string
  favicon?: string
  image?: string
  coverImage?: string  // 封面图片
  siteName?: string
}

/**
 * 从URL获取网站的favicon
 */
export function getFaviconUrl(url: string): string | undefined {
  try {
    const domain = new URL(url).hostname
    // 优先使用 DuckDuckGo ip3（对部分站点更稳）；前端 onError 中再回退到 Google S2
    return `https://icons.duckduckgo.com/ip3/${domain}.ico`
  } catch {
    return undefined
  }
}

/**
 * 从域名提取网站名称
 */
export function extractSiteName(url: string): string {
  try {
    const domain = new URL(url).hostname
    return domain.replace(/^www\./, '').split('.')[0]
  } catch {
    return ''
  }
}

/**
 * 使用多种方法获取网页元数据
 * 优先使用快速的本地生成，必要时才使用API
 */
export async function fetchWebsiteMetadata(url: string): Promise<WebsiteMetadata> {
  try {
    // 首先尝试本地智能生成（速度快）
    const localMetadata = generateLocalMetadata(url)

    // 如果本地生成的描述足够详细，直接返回
    if (localMetadata.description && localMetadata.description.length > 15) {
      return localMetadata
    }

    // 🔧 修复：移除外部API调用，直接使用本地生成的元数据
    console.log('ℹ️ 使用本地生成的元数据，跳过外部API调用')

    // 直接返回本地生成的元数据，不再调用外部API

    return localMetadata
  } catch (error) {
    console.warn('Failed to generate metadata:', error)

    // 最后的备用方案
    return {
      title: extractSiteName(url),
      description: '网站链接',
      favicon: getFaviconUrl(url),
      siteName: extractSiteName(url),
    }
  }
}

/**
 * 生成本地元数据（快速，不需要网络请求）
 */
function generateLocalMetadata(url: string): WebsiteMetadata {
  const siteName = extractSiteName(url)
  const description = generateSmartDescription(url, { siteName })

  return {
    title: siteName,
    description,
    favicon: getFaviconUrl(url),
    siteName,
  }
}





/**
 * 批量获取多个URL的元数据
 * 优化版本：更快的处理速度和更智能的策略
 */
export async function fetchMultipleMetadata(
  urls: string[],
  options: {
    concurrency?: number
    delay?: number
    onProgress?: (completed: number, total: number) => void
  } = {}
): Promise<Map<string, WebsiteMetadata>> {
  const { concurrency = 8, delay = 100, onProgress } = options // 提高并发数，减少延迟
  const results = new Map<string, WebsiteMetadata>()

  // 按处理策略分组URL
  const { fastUrls, slowUrls } = categorizeUrls(urls)

  // 第一阶段：快速处理知名网站（本地生成，无网络请求）
  let completed = 0
  for (const url of fastUrls) {
    try {
      const metadata = generateLocalMetadata(url)
      results.set(url, metadata)
      completed++

      if (onProgress && completed % 10 === 0) {
        onProgress(completed, urls.length)
      }
    } catch (error) {
      console.warn(`Failed to generate local metadata for ${url}:`, error)
      results.set(url, createFallbackMetadata(url))
      completed++
    }
  }

  // 第二阶段：处理需要网络请求的URL（如果有的话）
  if (slowUrls.length > 0) {
    console.log(`快速处理完成 ${fastUrls.length} 个网站，开始处理 ${slowUrls.length} 个需要详细信息的网站...`)

    // 分批处理需要网络请求的URL
    for (let i = 0; i < slowUrls.length; i += concurrency) {
      const batch = slowUrls.slice(i, i + concurrency)

      const promises = batch.map(async (url) => {
        try {
          const metadata = await fetchWebsiteMetadata(url)
          results.set(url, metadata)
        } catch (error) {
          console.warn(`Failed to fetch metadata for ${url}:`, error)
          results.set(url, createFallbackMetadata(url))
        }
        completed++
      })

      await Promise.all(promises)

      if (onProgress) {
        onProgress(completed, urls.length)
      }

      // 只在网络请求之间添加短暂延迟
      if (i + concurrency < slowUrls.length && delay > 0) {
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }

  if (onProgress) {
    onProgress(urls.length, urls.length)
  }

  return results
}

/**
 * 将URL按处理策略分类
 */
function categorizeUrls(urls: string[]): { fastUrls: string[], slowUrls: string[] } {
  const fastUrls: string[] = []
  const slowUrls: string[] = []

  // 🔧 修复：移除外部API调用，所有URL都使用快速本地生成
  for (const url of urls) {
    fastUrls.push(url) // 所有URL都使用本地生成，不再调用外部API
  }

  return { fastUrls, slowUrls }
}

/**
 * 创建备用元数据
 */
function createFallbackMetadata(url: string): WebsiteMetadata {
  return {
    title: extractSiteName(url),
    description: generateSmartDescription(url, { siteName: extractSiteName(url) }),
    favicon: getFaviconUrl(url),
    siteName: extractSiteName(url),
  }
}

/**
 * 智能生成书签描述
 * 基于网站类型和URL特征生成合适的描述
 */
export function generateSmartDescription(url: string, metadata: WebsiteMetadata): string {
  const domain = extractSiteName(url).toLowerCase()
  
  // 如果已有描述，直接使用
  if (metadata.description && metadata.description.length > 10) {
    return metadata.description
  }
  
  // 根据常见网站类型生成详细描述
  const siteDescriptions: Record<string, string> = {
    // 开发工具和平台
    'github': '全球最大的代码托管平台，提供Git版本控制、项目管理、团队协作等功能',
    'gitlab': '基于Git的代码托管和DevOps平台，支持CI/CD、项目管理等功能',
    'bitbucket': 'Atlassian旗下的Git代码托管服务，与Jira等工具深度集成',
    'stackoverflow': '全球最大的程序员问答社区，解决编程问题的首选平台',
    'stackexchange': 'Stack Overflow母公司旗下的问答网络，涵盖各个专业领域',

    // 文档和学习资源
    'mdn': 'Mozilla开发者网络，Web开发技术的权威文档和学习资源',
    'w3schools': '全球知名的Web技术在线教程平台，提供HTML、CSS、JavaScript等教程',
    'w3': '万维网联盟(W3C)官网，Web标准制定组织',
    'developer.mozilla': 'Mozilla开发者文档，Web技术参考和教程的权威来源',
    'docs.microsoft': '微软官方技术文档，涵盖Azure、.NET、Office等产品',
    'developer.apple': '苹果开发者文档，iOS、macOS等平台开发指南',
    'developer.android': 'Android开发者官方文档，移动应用开发必备资源',

    // 视频和媒体平台
    'youtube': '全球最大的视频分享平台，涵盖教育、娱乐、技术等各类内容',
    'bilibili': '中国领先的年轻人文化社区，以动画、游戏、科技内容为特色',
    'vimeo': '高质量视频分享平台，专注于创意和专业视频内容',
    'twitch': '全球最大的游戏直播平台，电竞和游戏内容的聚集地',

    // 中文技术社区
    'zhihu': '中文知识问答社区，汇聚各领域专业人士分享知识和经验',
    'juejin': '面向开发者的技术分享社区，提供优质的技术文章和资源',
    'csdn': '中国最大的IT技术社区，程序员学习交流的重要平台',
    'segmentfault': '中文技术问答社区，专注于解决编程和开发问题',
    'oschina': '开源中国社区，国内领先的开源技术交流平台',
    'cnblogs': '博客园，程序员技术博客和知识分享平台',
    'infoq': '企业级软件开发资讯平台，关注技术趋势和最佳实践',

    // 包管理和工具
    'npmjs': 'Node.js官方包管理器，JavaScript生态系统的核心组件库',
    'pypi': 'Python包索引，Python第三方库的官方仓库',
    'packagist': 'PHP包管理器Composer的官方仓库',
    'rubygems': 'Ruby语言的包管理系统和gem库',
    'nuget': '.NET生态系统的包管理器，微软官方包仓库',
    'maven': 'Java项目管理和构建工具，中央仓库托管Java库',
    'crates': 'Rust语言的包管理器Cargo的官方包仓库',

    // 云服务和基础设施
    'aws': '亚马逊云服务，全球领先的云计算平台，提供计算、存储、数据库等服务',
    'azure': '微软云服务平台，企业级云计算解决方案',
    'cloud.google': '谷歌云平台，提供机器学习、大数据、容器等先进云服务',
    'digitalocean': '面向开发者的简单云服务平台，以易用性著称',
    'heroku': '云应用平台，支持多种编程语言的快速部署',
    'vercel': '前端部署平台，专注于静态网站和Serverless应用',
    'netlify': '现代Web开发平台，提供持续部署和边缘计算服务',

    // 容器和DevOps
    'docker': '容器化平台，简化应用程序的打包、分发和运行',
    'kubernetes': '容器编排平台，自动化容器应用的部署、扩展和管理',
    'jenkins': '开源自动化服务器，支持持续集成和持续部署',
    'travis-ci': '持续集成服务，与GitHub深度集成的CI/CD平台',
    'circleci': '云端持续集成和部署平台，提供快速可靠的CI/CD服务',

    // 设计和创意工具
    'figma': '基于浏览器的协作设计工具，UI/UX设计师的首选平台',
    'sketch': 'macOS上的矢量图形设计工具，专注于界面设计',
    'adobe': 'Adobe创意软件套件，包括Photoshop、Illustrator等专业工具',
    'canva': '在线图形设计平台，提供丰富的模板和设计元素',
    'dribbble': '设计师作品展示和灵感分享社区',
    'behance': 'Adobe旗下的创意作品展示平台',

    // 素材和资源
    'unsplash': '高质量免费图片素材库，摄影师作品分享平台',
    'pexels': '免费图片和视频素材平台，商用友好的媒体资源',
    'pixabay': '免费图片、视频和音乐素材库',
    'freepik': '矢量图、图标和PSD文件的素材平台',
    'iconfinder': '图标搜索引擎，提供数百万个高质量图标',
    'fontawesome': '最受欢迎的图标字体库，Web开发必备资源',

    // 社交和通讯
    'twitter': '全球实时信息分享平台，新闻、观点和趋势的传播中心',
    'facebook': '全球最大的社交网络平台，连接朋友和家人',
    'linkedin': '职业社交网络，商务人士建立职业关系的平台',
    'instagram': '图片和视频分享社交平台，视觉内容的聚集地',
    'discord': '面向游戏玩家和社区的语音、视频和文字聊天平台',
    'slack': '团队协作和沟通工具，现代工作场所的数字总部',
    'telegram': '注重隐私和安全的即时通讯应用',
    'whatsapp': 'Meta旗下的即时通讯应用，全球用户数最多',

    // 内容和媒体
    'medium': '在线发布平台，作家和思想家分享深度内容的地方',
    'substack': '独立写作和订阅新闻平台，支持付费订阅模式',
    'reddit': '社交新闻聚合网站，各种话题讨论的大型社区',
    'hackernews': '黑客新闻，技术人员关注的新闻和讨论平台',
    'producthunt': '新产品发现平台，创业者和产品爱好者的聚集地',

    // 开发工具和编辑器
    'vscode': 'Visual Studio Code，微软开发的免费代码编辑器',
    'jetbrains': 'JetBrains开发工具套件，包括IntelliJ IDEA、PyCharm等IDE',
    'sublime': 'Sublime Text，轻量级但功能强大的代码编辑器',
    'atom': 'GitHub开发的开源文本编辑器（已停止维护）',
    'vim': 'Vim编辑器官网，经典的命令行文本编辑器',
    'emacs': 'GNU Emacs，功能强大的可扩展文本编辑器',

    // 项目管理和协作
    'notion': '全能工作空间，集笔记、数据库、项目管理于一体',
    'trello': '基于看板的项目管理工具，简单直观的任务管理',
    'asana': '团队项目管理和协作平台，提升团队工作效率',
    'jira': 'Atlassian的项目跟踪和管理工具，软件开发团队首选',
    'confluence': 'Atlassian的团队协作和知识管理平台',
    'monday': '工作操作系统，可视化的项目和团队管理平台',

    // 搜索和浏览器
    'google': '全球最大的搜索引擎，信息检索的首选工具',
    'bing': '微软搜索引擎，集成AI功能的智能搜索',
    'duckduckgo': '注重隐私保护的搜索引擎，不跟踪用户',
    'chrome': 'Google Chrome浏览器，全球使用最广泛的网页浏览器',
    'firefox': 'Mozilla Firefox浏览器，开源且注重隐私的浏览器',
    'safari': '苹果Safari浏览器，macOS和iOS的默认浏览器',
    'edge': '微软Edge浏览器，Windows的默认浏览器',

    // 在线工具和服务
    'codepen': '前端代码在线编辑器，HTML、CSS、JavaScript实验平台',
    'jsfiddle': 'JavaScript在线代码编辑器，快速测试和分享代码片段',
    'replit': '在线编程环境，支持多种编程语言的云端IDE',
    'codesandbox': '在线代码编辑器，专注于Web应用开发',
    'glitch': '友好的在线编程社区，快速构建和部署Web应用',

    // 学习和教育
    'coursera': '在线课程平台，与顶尖大学和公司合作提供高质量课程',
    'udemy': '在线学习平台，涵盖技术、商业、个人发展等各类课程',
    'edx': '非营利在线教育平台，提供大学级别的免费课程',
    'khan': '可汗学院，免费的世界级教育平台',
    'codecademy': '交互式编程学习平台，从零开始学习编程',
    'freecodecamp': '免费编程学习平台，提供全栈Web开发课程',

    // 电商和市场
    'amazon': '全球最大的电商平台，在线购物和云服务提供商',
    'alibaba': '阿里巴巴集团，中国最大的电商和云计算公司',
    'shopify': '电商建站平台，帮助商家快速搭建在线商店',
    'stripe': '在线支付处理平台，为互联网商务提供支付解决方案',
    'paypal': '全球领先的在线支付平台',

    // 数据和分析
    'analytics.google': 'Google Analytics，网站流量分析的行业标准工具',
    'tableau': '数据可视化和商业智能平台',
    'powerbi': '微软Power BI，商业分析和数据可视化工具',
    'kaggle': '数据科学竞赛平台，机器学习和数据分析社区',
  }
  
  // 检查是否匹配已知网站
  for (const [key, description] of Object.entries(siteDescriptions)) {
    if (domain.includes(key)) {
      return description
    }
  }
  
  // 根据URL路径特征生成描述
  const path = new URL(url).pathname.toLowerCase()
  if (path.includes('/docs') || path.includes('/documentation')) {
    return '技术文档和指南'
  }
  if (path.includes('/blog')) {
    return '博客文章和见解'
  }
  if (path.includes('/api')) {
    return 'API文档和接口'
  }
  if (path.includes('/tutorial')) {
    return '教程和学习资源'
  }
  if (path.includes('/tool')) {
    return '在线工具和服务'
  }
  
  // 默认描述
  return metadata.siteName ? `${metadata.siteName}官方网站` : '网站链接'
}
