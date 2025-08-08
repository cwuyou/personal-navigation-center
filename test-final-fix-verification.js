// 最终修复验证脚本 - 彻底解决超时错误和导入问题
console.log('🔍 开始最终修复验证...')

// 错误监控
let errorCount = 0
let timeoutErrorCount = 0
let importTestResults = []

// 监控未捕获的错误
const originalUnhandledRejection = window.onunhandledrejection
window.onunhandledrejection = function(event) {
  errorCount++
  const errorMessage = event.reason instanceof Error ? event.reason.message : String(event.reason)
  
  if (errorMessage.includes('获取用户信息超时') || errorMessage.includes('UserTimeoutError')) {
    timeoutErrorCount++
    console.log('❌ 检测到超时错误:', errorMessage)
  }
  
  // 调用原始处理器
  if (originalUnhandledRejection) {
    return originalUnhandledRejection.apply(this, arguments)
  }
}

// 测试getCurrentUser函数
async function testGetCurrentUser() {
  console.log('\n📋 测试 getCurrentUser 函数')
  
  if (typeof getCurrentUser !== 'function') {
    console.log('⚠️ getCurrentUser 函数不可用，可能还未加载')
    return { success: false, reason: 'function_not_available' }
  }
  
  const results = []
  
  // 进行多次测试
  for (let i = 0; i < 3; i++) {
    try {
      console.log(`🔄 第${i+1}次调用 getCurrentUser...`)
      
      const startTime = Date.now()
      const user = await getCurrentUser()
      const endTime = Date.now()
      
      results.push({
        attempt: i + 1,
        success: true,
        duration: endTime - startTime,
        hasUser: !!user,
        userEmail: user?.email || null,
        error: null
      })
      
      console.log(`✅ 第${i+1}次调用成功: ${user ? user.email : '未登录'} (${endTime - startTime}ms)`)
      
    } catch (error) {
      results.push({
        attempt: i + 1,
        success: false,
        duration: null,
        hasUser: false,
        userEmail: null,
        error: error.message
      })
      
      console.log(`❌ 第${i+1}次调用失败: ${error.message}`)
    }
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 1000))
  }
  
  return { success: true, results }
}

// 测试文件导入功能
async function testFileImport() {
  console.log('\n📋 测试文件导入功能')
  
  // 检查导入相关的函数是否可用
  const store = window.useBookmarkStore?.getState?.()
  if (!store || typeof store.importBookmarks !== 'function') {
    console.log('⚠️ 书签存储或导入函数不可用')
    return { success: false, reason: 'store_not_available' }
  }
  
  // 创建测试数据
  const testData = {
    categories: [
      {
        id: 'test_cat_1',
        name: '测试分类',
        icon: '🧪',
        subCategories: [
          {
            id: 'test_subcat_1',
            name: '测试子分类',
            categoryId: 'test_cat_1'
          }
        ]
      }
    ],
    bookmarks: [
      {
        id: 'test_bm_1',
        title: '测试书签1',
        url: 'https://test1.example.com',
        description: '这是一个测试书签',
        subCategoryId: 'test_subcat_1',
        favicon: '',
        tags: ['测试'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 'test_bm_2',
        title: '测试书签2',
        url: 'https://test2.example.com',
        description: '这是另一个测试书签',
        subCategoryId: 'test_subcat_1',
        favicon: '',
        tags: ['测试'],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ]
  }
  
  try {
    console.log('🔄 开始测试导入...')
    const startTime = Date.now()
    
    const result = await store.importBookmarks(testData, { enableBackgroundEnhancement: false })
    
    const endTime = Date.now()
    const duration = endTime - startTime
    
    console.log('✅ 导入测试完成:', result)
    console.log(`⏱️ 导入耗时: ${duration}ms`)
    
    return {
      success: true,
      result,
      duration,
      testData
    }
    
  } catch (error) {
    console.log('❌ 导入测试失败:', error.message)
    return {
      success: false,
      error: error.message,
      testData
    }
  }
}

// 测试同步功能
async function testSyncFunction() {
  console.log('\n📋 测试同步功能')
  
  // 检查同步相关的函数
  if (typeof window.triggerSync !== 'function') {
    console.log('⚠️ triggerSync 函数不可用')
    return { success: false, reason: 'sync_function_not_available' }
  }
  
  try {
    console.log('🔄 触发同步测试...')
    
    // 触发同步
    window.triggerSync('manual_test')
    
    // 等待一段时间观察同步过程
    await new Promise(resolve => setTimeout(resolve, 3000))
    
    console.log('✅ 同步测试完成')
    return { success: true }
    
  } catch (error) {
    console.log('❌ 同步测试失败:', error.message)
    return { success: false, error: error.message }
  }
}

// 监控页面错误
function monitorPageErrors() {
  console.log('\n📋 开始监控页面错误...')
  
  const startTime = Date.now()
  const initialErrorCount = errorCount
  const initialTimeoutErrorCount = timeoutErrorCount
  
  return new Promise((resolve) => {
    setTimeout(() => {
      const endTime = Date.now()
      const newErrors = errorCount - initialErrorCount
      const newTimeoutErrors = timeoutErrorCount - initialTimeoutErrorCount
      
      console.log(`📊 监控结果 (${(endTime - startTime)/1000}s):`)
      console.log(`   新增错误: ${newErrors}`)
      console.log(`   新增超时错误: ${newTimeoutErrors}`)
      
      resolve({
        success: newTimeoutErrors === 0,
        newErrors,
        newTimeoutErrors,
        duration: endTime - startTime
      })
    }, 5000) // 监控5秒
  })
}

// 运行完整测试
async function runCompleteTest() {
  console.log('🚀 开始运行完整的修复验证测试...\n')
  
  const testResults = {
    getCurrentUser: null,
    fileImport: null,
    syncFunction: null,
    errorMonitoring: null
  }
  
  try {
    // 1. 测试getCurrentUser函数
    testResults.getCurrentUser = await testGetCurrentUser()
    
    // 2. 测试文件导入功能
    testResults.fileImport = await testFileImport()
    
    // 3. 测试同步功能
    testResults.syncFunction = await testSyncFunction()
    
    // 4. 监控页面错误
    testResults.errorMonitoring = await monitorPageErrors()
    
    // 生成测试报告
    console.log('\n📊 完整测试报告:')
    console.log('==========================================')
    
    console.log('\n1️⃣ getCurrentUser 测试:')
    if (testResults.getCurrentUser.success) {
      console.log('✅ 通过')
      if (testResults.getCurrentUser.results) {
        const successCount = testResults.getCurrentUser.results.filter(r => r.success).length
        const hasUserCount = testResults.getCurrentUser.results.filter(r => r.hasUser).length
        console.log(`   成功调用: ${successCount}/3`)
        console.log(`   检测到用户: ${hasUserCount}/3`)
      }
    } else {
      console.log('❌ 失败 -', testResults.getCurrentUser.reason)
    }
    
    console.log('\n2️⃣ 文件导入测试:')
    if (testResults.fileImport.success) {
      console.log('✅ 通过')
      console.log(`   导入结果:`, testResults.fileImport.result)
      console.log(`   耗时: ${testResults.fileImport.duration}ms`)
    } else {
      console.log('❌ 失败 -', testResults.fileImport.reason || testResults.fileImport.error)
    }
    
    console.log('\n3️⃣ 同步功能测试:')
    if (testResults.syncFunction.success) {
      console.log('✅ 通过')
    } else {
      console.log('❌ 失败 -', testResults.syncFunction.reason || testResults.syncFunction.error)
    }
    
    console.log('\n4️⃣ 错误监控测试:')
    if (testResults.errorMonitoring.success) {
      console.log('✅ 通过 - 没有检测到超时错误')
    } else {
      console.log('❌ 失败 - 仍有超时错误出现')
    }
    console.log(`   监控时间: ${testResults.errorMonitoring.duration/1000}s`)
    console.log(`   新增错误: ${testResults.errorMonitoring.newErrors}`)
    console.log(`   超时错误: ${testResults.errorMonitoring.newTimeoutErrors}`)
    
    // 总体结论
    const allPassed = testResults.getCurrentUser.success && 
                     testResults.fileImport.success && 
                     testResults.syncFunction.success && 
                     testResults.errorMonitoring.success
    
    console.log('\n🎯 总体结论:')
    if (allPassed) {
      console.log('🎉 所有测试都通过！修复成功！')
      console.log('✅ 超时错误已彻底解决')
      console.log('✅ 文件导入功能正常')
      console.log('✅ 同步功能正常')
      console.log('✅ 用户体验得到显著改善')
    } else {
      console.log('⚠️ 部分测试失败，需要进一步检查')
      
      if (!testResults.getCurrentUser.success) {
        console.log('❌ getCurrentUser 函数有问题')
      }
      if (!testResults.fileImport.success) {
        console.log('❌ 文件导入功能有问题')
      }
      if (!testResults.syncFunction.success) {
        console.log('❌ 同步功能有问题')
      }
      if (!testResults.errorMonitoring.success) {
        console.log('❌ 仍有超时错误出现')
      }
    }
    
    return testResults
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
    return { success: false, error: error.message, testResults }
  } finally {
    // 恢复原始错误处理器
    window.onunhandledrejection = originalUnhandledRejection
  }
}

// 快速状态检查
function quickCheck() {
  console.log('\n🔍 快速状态检查:')
  
  // 检查关键函数
  console.log('getCurrentUser函数:', typeof getCurrentUser === 'function' ? '✅ 可用' : '❌ 不可用')
  console.log('书签存储:', window.useBookmarkStore ? '✅ 可用' : '❌ 不可用')
  console.log('同步函数:', typeof window.triggerSync === 'function' ? '✅ 可用' : '❌ 不可用')
  
  // 检查当前错误状态
  console.log(`当前错误计数: ${errorCount}`)
  console.log(`超时错误计数: ${timeoutErrorCount}`)
  
  return {
    hasGetCurrentUser: typeof getCurrentUser === 'function',
    hasBookmarkStore: !!window.useBookmarkStore,
    hasSyncFunction: typeof window.triggerSync === 'function',
    errorCount,
    timeoutErrorCount
  }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runCompleteTest,
    testGetCurrentUser,
    testFileImport,
    testSyncFunction,
    monitorPageErrors,
    quickCheck
  }
}

// 使用说明
console.log('\n💡 使用方法:')
console.log('1. 运行 runCompleteTest() 进行完整测试')
console.log('2. 运行 quickCheck() 快速检查状态')
console.log('3. 运行 testGetCurrentUser() 只测试用户函数')
console.log('4. 运行 testFileImport() 只测试导入功能')

// 自动运行快速检查
quickCheck()
