// 🔧 测试UUID修复的脚本
console.log('🔧 测试UUID格式修复...')

// 测试UUID验证函数
function testUUIDValidation() {
  console.log('\n📋 测试UUID验证:')
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  
  const testCases = [
    { id: 'vscode', isValid: false, description: '字符串ID' },
    { id: 'bm_1754492991854_el2x1k27d', isValid: false, description: '自定义格式ID' },
    { id: '123e4567-e89b-12d3-a456-426614174000', isValid: true, description: '标准UUID' },
    { id: 'dev-tools', isValid: false, description: '分类ID' },
    { id: crypto.randomUUID(), isValid: true, description: '生成的UUID' }
  ]
  
  testCases.forEach(testCase => {
    const actualValid = uuidRegex.test(testCase.id)
    const passed = actualValid === testCase.isValid
    
    console.log(`${passed ? '✅' : '❌'} ${testCase.description}:`)
    console.log(`   ID: ${testCase.id}`)
    console.log(`   预期: ${testCase.isValid ? '有效' : '无效'}`)
    console.log(`   实际: ${actualValid ? '有效' : '无效'}`)
    
    if (!actualValid && testCase.isValid === false) {
      const newUUID = crypto.randomUUID()
      console.log(`   转换为: ${newUUID}`)
    }
  })
}

// 模拟数据转换
function simulateDataConversion() {
  console.log('\n📋 模拟数据转换:')
  
  // 模拟您的实际数据结构
  const mockData = {
    categories: [
      { id: 'dev-tools', name: '开发工具', icon: '💻' },
      { id: 'learning', name: '学习资源', icon: '📚' }
    ],
    bookmarks: [
      { id: 'vscode', title: 'VS Code', url: 'https://code.visualstudio.com', subCategoryId: 'dev-tools' },
      { id: 'bm_1754492991854_el2x1k27d', title: 'GitHub', url: 'https://github.com', subCategoryId: 'dev-tools' }
    ]
  }
  
  const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i
  const categoryIdMapping = new Map()
  
  console.log('🔧 转换分类ID:')
  mockData.categories.forEach(category => {
    let newId = category.id
    if (!uuidRegex.test(category.id)) {
      newId = crypto.randomUUID()
      console.log(`   ${category.name}: ${category.id} → ${newId}`)
    }
    categoryIdMapping.set(category.id, newId)
  })
  
  console.log('\n🔧 转换书签ID:')
  const convertedBookmarks = mockData.bookmarks.map(bookmark => {
    let newId = bookmark.id
    if (!uuidRegex.test(bookmark.id)) {
      newId = crypto.randomUUID()
      console.log(`   ${bookmark.title}: ${bookmark.id} → ${newId}`)
    }
    
    return {
      id: newId,
      title: bookmark.title,
      url: bookmark.url,
      sub_category_id: categoryIdMapping.get(bookmark.subCategoryId)
    }
  })
  
  console.log('\n✅ 转换完成，所有ID都是有效的UUID格式')
  return { categoryIdMapping, convertedBookmarks }
}

// 检查实际的关系型导入函数
function checkRelationalFunction() {
  console.log('\n📋 检查关系型导入函数:')
  
  if (typeof window.saveBookmarksToCloudRelational === 'function') {
    console.log('✅ saveBookmarksToCloudRelational 函数可用')
    
    // 检查函数源码是否包含UUID修复逻辑
    const funcStr = window.saveBookmarksToCloudRelational.toString()
    const hasUUIDFix = funcStr.includes('uuidRegex') || funcStr.includes('crypto.randomUUID')
    
    console.log(`${hasUUIDFix ? '✅' : '❌'} UUID修复逻辑: ${hasUUIDFix ? '已包含' : '未包含'}`)
    
    if (!hasUUIDFix) {
      console.log('⚠️ 函数可能还是旧版本，需要刷新页面')
    }
    
    return hasUUIDFix
  } else {
    console.log('❌ saveBookmarksToCloudRelational 函数不可用')
    return false
  }
}

// 提供解决方案
function provideSolution() {
  console.log('\n💡 解决方案:')
  console.log('🔧 UUID格式问题已修复，现在需要:')
  console.log('1. 刷新浏览器页面（Ctrl+F5 强制刷新）')
  console.log('2. 重新导入书签文件')
  console.log('3. 观察控制台日志，应该看到:')
  console.log('   "🔧 转换非UUID格式ID: vscode → xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"')
  console.log('   "✅ 第 1/2 批导入成功: 30 个书签"')
  console.log('   "✅ 第 2/2 批导入成功: 7 个书签"')
  
  console.log('\n🎯 预期效果:')
  console.log('✅ 分类数据写入 categories 表')
  console.log('✅ 书签数据写入 bookmarks 表')
  console.log('✅ 所有ID都转换为标准UUID格式')
  console.log('✅ 不再出现UUID格式错误')
}

// 运行所有测试
function runAllTests() {
  console.log('🚀 开始UUID修复测试...\n')
  
  try {
    // 1. 测试UUID验证
    testUUIDValidation()
    
    // 2. 模拟数据转换
    simulateDataConversion()
    
    // 3. 检查关系型函数
    const functionReady = checkRelationalFunction()
    
    // 4. 提供解决方案
    provideSolution()
    
    console.log('\n🎉 测试完成！')
    
    if (functionReady) {
      console.log('✅ UUID修复已就绪，可以重新导入书签了')
    } else {
      console.log('⚠️ 需要刷新页面加载最新的修复代码')
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error)
  }
}

// 导出函数
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testUUIDValidation,
    simulateDataConversion,
    checkRelationalFunction,
    runAllTests,
    provideSolution
  }
}

// 使用说明
console.log('💡 使用方法:')
console.log('1. 运行 runAllTests() 进行完整测试')
console.log('2. 根据测试结果刷新页面')
console.log('3. 重新导入书签文件')

// 自动运行测试
runAllTests()
