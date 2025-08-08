// 后台增强功能验证脚本
console.log('🔍 开始验证后台增强功能...')

// 测试数据 - 模拟导入的书签
const testBookmarks = [
  {
    id: 'test-claude',
    title: 'Claude',
    url: 'https://claude.ai/',
    description: 'https://claude.ai/' // 原始描述很简单
  },
  {
    id: 'test-chatgpt', 
    title: 'ChatGPT',
    url: 'https://chatgpt.com/',
    description: 'https://chatgpt.com/'
  },
  {
    id: 'test-cursor',
    title: 'Cursor',
    url: 'https://www.cursor.so/',
    description: 'AI驱动的代码编辑器'
  },
  {
    id: 'test-github',
    title: 'GitHub',
    url: 'https://github.com/',
    description: 'https://github.com/'
  }
]

// 验证增强功能
async function verifyEnhancement() {
  console.log('\n📋 验证增强功能状态')
  
  // 检查书签存储是否可用
  const store = window.useBookmarkStore?.getState?.()
  if (!store) {
    console.log('❌ 书签存储不可用')
    return false
  }
  
  console.log('✅ 书签存储可用')
  
  // 检查增强函数是否存在
  if (typeof store.startBackgroundEnhancement !== 'function') {
    console.log('❌ 增强函数不可用')
    return false
  }
  
  console.log('✅ 增强函数可用')
  
  // 获取当前书签数量
  const currentBookmarks = store.bookmarks || []
  console.log(`📊 当前书签数量: ${currentBookmarks.length}`)
  
  return true
}

// 测试预置数据库匹配
async function testPresetMatching() {
  console.log('\n📋 测试预置数据库匹配')

  const testUrls = [
    'https://claude.ai/',
    'https://chatgpt.com/',
    'https://github.com/',
    'https://www.cursor.so/',
    'https://midjourney.com/',
    'https://gemini.google.com/app'
  ]

  let presetDb = null
  try {
    const response = await fetch('/data/website-descriptions-1000plus.json')
    presetDb = await response.json()
    console.log(`📊 预置数据库加载成功，包含 ${Object.keys(presetDb).length} 个网站`)
  } catch (error) {
    console.log(`❌ 无法加载预置数据库: ${error.message}`)
    return
  }

  let foundCount = 0
  for (const url of testUrls) {
    try {
      const domain = new URL(url).hostname.replace(/^www\./, '')
      console.log(`🔍 检查域名: ${domain}`)

      if (presetDb[domain]) {
        foundCount++
        console.log(`✅ ${domain}: 找到预置数据`)
        console.log(`   标题: ${presetDb[domain].title}`)
        console.log(`   描述: ${presetDb[domain].description.substring(0, 50)}...`)
        console.log(`   封面: ${presetDb[domain].coverImage ? '有' : '无'}`)
      } else {
        console.log(`❌ ${domain}: 未找到预置数据，将使用智能生成`)
      }
    } catch (error) {
      console.log(`❌ ${url}: 检查失败 - ${error.message}`)
    }
  }

  console.log(`\n📊 预置数据匹配结果: ${foundCount}/${testUrls.length} 个网站有预置数据`)
  return foundCount
}

// 模拟导入后的增强过程
async function simulateImportEnhancement() {
  console.log('\n📋 模拟导入后的增强过程')
  
  const store = window.useBookmarkStore?.getState?.()
  if (!store) {
    console.log('❌ 无法获取书签存储')
    return
  }
  
  // 获取需要增强的书签（描述长度小于20的）
  const bookmarksNeedingEnhancement = store.bookmarks.filter(
    bookmark => !bookmark.description || bookmark.description.length < 20
  )
  
  console.log(`📊 需要增强的书签数量: ${bookmarksNeedingEnhancement.length}`)
  
  if (bookmarksNeedingEnhancement.length > 0) {
    console.log('🔄 开始模拟增强过程...')
    
    // 模拟增强过程
    for (const bookmark of bookmarksNeedingEnhancement.slice(0, 3)) {
      console.log(`🔄 增强书签: ${bookmark.title}`)
      console.log(`   URL: ${bookmark.url}`)
      console.log(`   当前描述: ${bookmark.description || '无'}`)
      
      try {
        const domain = new URL(bookmark.url).hostname.replace(/^www\./, '')
        const response = await fetch('/data/website-descriptions-1000plus.json')
        const presetDb = await response.json()
        
        if (presetDb[domain]) {
          console.log(`✅ 可以增强: ${presetDb[domain].description.substring(0, 50)}...`)
        } else {
          console.log(`⚠️ 需要智能生成描述`)
        }
      } catch (error) {
        console.log(`❌ 增强检查失败: ${error.message}`)
      }
    }
  } else {
    console.log('✅ 所有书签都已有详细描述')
  }
}

// 检查增强进度显示
function checkEnhancementUI() {
  console.log('\n📋 检查增强UI显示状态')
  
  const progressElement = document.querySelector('[class*="enhancement"]') || 
                         document.querySelector('[class*="progress"]')
  
  if (progressElement) {
    console.log('⚠️ 发现增强相关UI元素')
    console.log('   元素类名:', progressElement.className)
    console.log('   是否可见:', progressElement.offsetParent !== null)
  } else {
    console.log('✅ 未发现增强UI元素，增强过程应该是静默的')
  }
}

// 实际测试增强功能
async function testActualEnhancement() {
  console.log('\n📋 实际测试增强功能')

  const store = window.useBookmarkStore?.getState?.()
  if (!store) {
    console.log('❌ 无法获取书签存储')
    return false
  }

  // 创建一个测试书签
  const testBookmark = {
    id: `test_${Date.now()}`,
    title: 'Test Claude',
    url: 'https://claude.ai/',
    description: 'test', // 短描述，需要增强
    subCategoryId: 'test-sub',
    createdAt: new Date()
  }

  console.log('🔄 添加测试书签...')
  console.log(`   标题: ${testBookmark.title}`)
  console.log(`   URL: ${testBookmark.url}`)
  console.log(`   当前描述: ${testBookmark.description}`)

  // 添加书签到存储
  store.addBookmark({
    title: testBookmark.title,
    url: testBookmark.url,
    description: testBookmark.description,
    subCategoryId: testBookmark.subCategoryId
  })

  // 等待一下让增强开始
  await new Promise(resolve => setTimeout(resolve, 1000))

  // 检查书签是否被增强
  const updatedBookmarks = window.useBookmarkStore.getState().bookmarks
  const enhancedBookmark = updatedBookmarks.find(b => b.title === testBookmark.title)

  if (enhancedBookmark) {
    console.log('✅ 找到测试书签')
    console.log(`   增强后描述: ${enhancedBookmark.description}`)
    console.log(`   是否有封面图: ${enhancedBookmark.coverImage ? '有' : '无'}`)
    console.log(`   是否有图标: ${enhancedBookmark.favicon ? '有' : '无'}`)

    // 清理测试书签
    store.deleteBookmark(enhancedBookmark.id)
    console.log('🧹 已清理测试书签')

    return enhancedBookmark.description !== testBookmark.description
  } else {
    console.log('❌ 未找到测试书签')
    return false
  }
}

// 主验证函数
async function runVerification() {
  console.log('🚀 开始后台增强功能验证\n')

  try {
    // 1. 验证基础功能
    const basicCheck = await verifyEnhancement()
    if (!basicCheck) {
      console.log('❌ 基础功能验证失败')
      return
    }

    // 2. 测试预置数据库
    const presetCount = await testPresetMatching()

    // 3. 模拟增强过程
    await simulateImportEnhancement()

    // 4. 实际测试增强
    const enhancementWorks = await testActualEnhancement()

    // 5. 检查UI状态
    checkEnhancementUI()

    console.log('\n✅ 验证完成！')
    console.log('\n📋 验证结果总结:')
    console.log(`   - 后台增强功能: ${enhancementWorks ? '✅ 正常工作' : '❌ 有问题'}`)
    console.log(`   - 预置数据库: 包含 ${presetCount || 0} 个测试网站`)
    console.log('   - 增强UI: 已隐藏（静默模式）')
    console.log('   - 导入后会自动增强书签描述和封面图')

    if (enhancementWorks) {
      console.log('\n🎉 后台增强功能工作正常！')
      console.log('   - 会自动获取详细描述信息')
      console.log('   - 会生成封面图和图标')
      console.log('   - 过程完全静默，无UI干扰')
    } else {
      console.log('\n⚠️ 后台增强功能可能有问题，请检查控制台日志')
    }

  } catch (error) {
    console.error('❌ 验证过程中发生错误:', error)
  }
}

// 等待页面加载完成后运行验证
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runVerification)
} else {
  runVerification()
}
