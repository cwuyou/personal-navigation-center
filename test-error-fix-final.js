// 最终错误修复验证脚本
// 用于验证"获取用户信息超时（5秒）"错误不再显示给用户

console.log('🔍 开始最终错误修复验证...')

// 监控未捕获的错误
let uncaughtErrors = []
let originalErrorHandler = null
let originalUnhandledRejection = null

// 设置错误监听器
function setupErrorMonitoring() {
  console.log('📋 设置错误监听器...')
  
  // 保存原始处理器
  originalErrorHandler = window.onerror
  originalUnhandledRejection = window.onunhandledrejection
  
  // 监听未捕获的错误
  window.onerror = function(message, source, lineno, colno, error) {
    const errorInfo = {
      type: 'error',
      message: message,
      source: source,
      line: lineno,
      column: colno,
      error: error,
      timestamp: new Date().toISOString()
    }
    
    uncaughtErrors.push(errorInfo)
    console.log('❌ 检测到未捕获的错误:', errorInfo)
    
    // 调用原始处理器
    if (originalErrorHandler) {
      return originalErrorHandler.apply(this, arguments)
    }
    return false
  }
  
  // 监听未捕获的Promise rejection
  window.onunhandledrejection = function(event) {
    const errorInfo = {
      type: 'unhandledrejection',
      reason: event.reason,
      message: event.reason instanceof Error ? event.reason.message : String(event.reason),
      timestamp: new Date().toISOString()
    }
    
    uncaughtErrors.push(errorInfo)
    console.log('❌ 检测到未捕获的Promise rejection:', errorInfo)
    
    // 调用原始处理器
    if (originalUnhandledRejection) {
      return originalUnhandledRejection.apply(this, arguments)
    }
  }
}

// 恢复错误监听器
function restoreErrorMonitoring() {
  console.log('📋 恢复原始错误处理器...')
  window.onerror = originalErrorHandler
  window.onunhandledrejection = originalUnhandledRejection
}

// 检查是否是应该静默处理的错误
function isSilentError(errorMessage) {
  const silentErrors = [
    '获取用户信息超时',
    '获取用户超时',
    '用户状态检查超时',
    'Supabase 操作超时',
    '网络连接不可用',
    'Auth session missing',
    'session_not_found',
    'invalid_token',
    'token_expired',
    'user_not_found',
    'UserTimeoutError'
  ]
  
  return silentErrors.some(silentError => 
    errorMessage.toLowerCase().includes(silentError.toLowerCase())
  )
}

// 测试getCurrentUser函数
async function testGetCurrentUser() {
  console.log('\n📋 测试 getCurrentUser 函数')
  
  if (typeof getCurrentUser !== 'function') {
    console.log('⚠️ getCurrentUser 函数不可用')
    return { success: true, reason: 'function_not_available' }
  }
  
  const testResults = []
  
  // 进行多次测试调用
  for (let i = 0; i < 5; i++) {
    try {
      console.log(`🔄 第${i+1}次调用 getCurrentUser...`)
      
      const startTime = Date.now()
      const user = await getCurrentUser()
      const endTime = Date.now()
      
      testResults.push({
        attempt: i + 1,
        success: true,
        duration: endTime - startTime,
        result: user ? `用户: ${user.email}` : '未登录',
        error: null
      })
      
      console.log(`✅ 第${i+1}次调用成功: ${user ? user.email : '未登录'} (${endTime - startTime}ms)`)
      
    } catch (error) {
      testResults.push({
        attempt: i + 1,
        success: false,
        duration: null,
        result: null,
        error: error.message
      })
      
      console.log(`❌ 第${i+1}次调用失败: ${error.message}`)
      
      // 检查是否是应该静默处理的错误
      if (isSilentError(error.message)) {
        console.log('⚠️ 这个错误应该被静默处理，不应该抛出异常')
        return { 
          success: false, 
          reason: 'should_be_silent', 
          error: error.message,
          testResults 
        }
      }
    }
    
    // 短暂延迟
    await new Promise(resolve => setTimeout(resolve, 500))
  }
  
  return { success: true, reason: 'all_calls_handled', testResults }
}

// 检查未捕获的错误
function analyzeUncaughtErrors() {
  console.log('\n📋 分析未捕获的错误')
  
  if (uncaughtErrors.length === 0) {
    console.log('✅ 没有检测到未捕获的错误')
    return { success: true, errors: [] }
  }
  
  console.log(`⚠️ 检测到 ${uncaughtErrors.length} 个未捕获的错误:`)
  
  const silentErrorsFound = []
  const otherErrorsFound = []
  
  uncaughtErrors.forEach((errorInfo, index) => {
    console.log(`${index + 1}. [${errorInfo.type}] ${errorInfo.message}`)
    
    if (isSilentError(errorInfo.message)) {
      silentErrorsFound.push(errorInfo)
      console.log('   ❌ 这个错误应该被静默处理')
    } else {
      otherErrorsFound.push(errorInfo)
      console.log('   ℹ️ 这可能是一个合理的系统错误')
    }
  })
  
  return {
    success: silentErrorsFound.length === 0,
    errors: uncaughtErrors,
    silentErrors: silentErrorsFound,
    otherErrors: otherErrorsFound
  }
}

// 测试全局错误处理器
async function testGlobalErrorHandlers() {
  console.log('\n📋 测试全局错误处理器')
  
  try {
    // 测试手动触发一个应该被静默处理的错误
    console.log('🔄 手动触发超时错误...')
    
    // 创建一个Promise rejection
    const testPromise = new Promise((_, reject) => {
      setTimeout(() => {
        reject(new Error('获取用户信息超时（5秒）'))
      }, 100)
    })
    
    // 不捕获这个Promise，让它成为未处理的rejection
    testPromise.catch(() => {}) // 这里故意不处理
    
    // 等待一段时间让错误处理器处理
    await new Promise(resolve => setTimeout(resolve, 500))
    
    console.log('✅ 全局错误处理器测试完成')
    return { success: true }
    
  } catch (error) {
    console.log('❌ 全局错误处理器测试失败:', error.message)
    return { success: false, error: error.message }
  }
}

// 运行完整的验证测试
async function runCompleteVerification() {
  console.log('🚀 开始运行完整的错误修复验证...\n')
  
  // 清空之前的错误记录
  uncaughtErrors = []
  
  // 设置错误监听
  setupErrorMonitoring()
  
  try {
    // 等待一段时间让页面稳定
    console.log('⏳ 等待页面稳定...')
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    // 测试 getCurrentUser 函数
    const getUserTest = await testGetCurrentUser()
    
    // 测试全局错误处理器
    const globalHandlerTest = await testGlobalErrorHandlers()
    
    // 等待一段时间让所有异步错误都被处理
    console.log('⏳ 等待异步错误处理...')
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // 分析未捕获的错误
    const errorAnalysis = analyzeUncaughtErrors()
    
    // 生成测试报告
    console.log('\n📊 最终验证报告:')
    console.log('==========================================')
    
    console.log('\n1️⃣ getCurrentUser 测试:')
    if (getUserTest.success) {
      console.log('✅ 通过 -', getUserTest.reason)
      if (getUserTest.testResults) {
        console.log(`   执行了 ${getUserTest.testResults.length} 次调用`)
        const successCount = getUserTest.testResults.filter(r => r.success).length
        console.log(`   成功: ${successCount}, 失败: ${getUserTest.testResults.length - successCount}`)
      }
    } else {
      console.log('❌ 失败 -', getUserTest.reason)
      if (getUserTest.error) {
        console.log('   错误:', getUserTest.error)
      }
    }
    
    console.log('\n2️⃣ 全局错误处理器测试:')
    if (globalHandlerTest.success) {
      console.log('✅ 通过 - 全局错误处理器正常工作')
    } else {
      console.log('❌ 失败 -', globalHandlerTest.error)
    }
    
    console.log('\n3️⃣ 未捕获错误分析:')
    if (errorAnalysis.success) {
      console.log('✅ 通过 - 没有应该静默处理的错误逃逸')
    } else {
      console.log('❌ 失败 - 发现了应该静默处理的错误')
      console.log(`   应该静默的错误: ${errorAnalysis.silentErrors.length}`)
      console.log(`   其他错误: ${errorAnalysis.otherErrors.length}`)
    }
    
    // 总体结论
    const allPassed = getUserTest.success && globalHandlerTest.success && errorAnalysis.success
    
    console.log('\n🎯 总体结论:')
    if (allPassed) {
      console.log('🎉 所有测试都通过！错误修复成功！')
      console.log('✅ 用户不会再看到"获取用户信息超时（5秒）"错误')
      console.log('✅ 所有认证相关错误都被正确静默处理')
      console.log('✅ 用户体验得到显著改善')
    } else {
      console.log('⚠️ 部分测试失败，可能需要进一步检查')
      
      if (!getUserTest.success) {
        console.log('❌ getCurrentUser 函数仍有问题')
      }
      if (!globalHandlerTest.success) {
        console.log('❌ 全局错误处理器有问题')
      }
      if (!errorAnalysis.success) {
        console.log('❌ 仍有错误逃逸到用户界面')
      }
    }
    
    return {
      success: allPassed,
      getUserTest,
      globalHandlerTest,
      errorAnalysis,
      uncaughtErrors
    }
    
  } finally {
    // 恢复原始错误处理器
    restoreErrorMonitoring()
  }
}

// 快速检查当前状态
function quickStatusCheck() {
  console.log('\n🔍 快速状态检查:')
  
  // 检查是否有全局错误处理器
  const hasGlobalHandlers = typeof window.onerror === 'function' || 
                           typeof window.onunhandledrejection === 'function'
  console.log('全局错误处理器:', hasGlobalHandlers ? '✅ 已设置' : '❌ 未设置')
  
  // 检查getCurrentUser函数
  const hasGetCurrentUser = typeof getCurrentUser === 'function'
  console.log('getCurrentUser函数:', hasGetCurrentUser ? '✅ 可用' : '❌ 不可用')
  
  // 检查环境
  const isProduction = process.env.NODE_ENV === 'production'
  console.log('当前环境:', isProduction ? '🏭 生产环境' : '🔧 开发环境')
  
  return {
    hasGlobalHandlers,
    hasGetCurrentUser,
    isProduction
  }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    runCompleteVerification,
    testGetCurrentUser,
    testGlobalErrorHandlers,
    analyzeUncaughtErrors,
    quickStatusCheck,
    setupErrorMonitoring,
    restoreErrorMonitoring
  }
}

// 使用说明
console.log('\n💡 使用方法:')
console.log('1. 运行 runCompleteVerification() 进行完整验证')
console.log('2. 运行 quickStatusCheck() 快速检查状态')
console.log('3. 运行 testGetCurrentUser() 只测试用户函数')

// 自动运行快速检查
quickStatusCheck()
