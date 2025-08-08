// Firefox书签导入诊断脚本
console.log('🔍 开始诊断Firefox书签导入问题...')

// 模拟Firefox书签HTML结构
const firefoxBookmarkHTML = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file.
     It will be read and overwritten.
     DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<meta http-equiv="Content-Security-Policy"
      content="default-src 'self'; script-src 'none'; img-src data: *; object-src 'none'"></meta>
<TITLE>Bookmarks</TITLE>
<H1>书签菜单</H1>

<DL><p>
    <DT><H3 ADD_DATE="1745150951" LAST_MODIFIED="1745150951">Mozilla Firefox</H3>
    <DL><p>
        <DT><A HREF="https://support.mozilla.org/products/firefox">获取帮助</A>
        <DT><A HREF="https://support.mozilla.org/kb/customize-firefox-controls-buttons-and-toolbars">定制 Firefox</A>
    </DL><p>
    <DT><H3 ADD_DATE="1745150951" LAST_MODIFIED="1754659745" PERSONAL_TOOLBAR_FOLDER="true">书签工具栏</H3>
    <DL><p>
        <DT><H3 ADD_DATE="1754659634" LAST_MODIFIED="1754659745">AI web</H3>
        <DL><p>
            <DT><A HREF="https://math-gpt.org/">MathGPT - AI Math Solver</A>
            <DT><A HREF="https://uplearn.co.uk/">Home | Up Learn</A>
            <DT><A HREF="https://www.wolframalpha.com/">Wolfram|Alpha：计算型智能</A>
            <DT><A HREF="https://www.gauthmath.com/">Gauth - Best AI Homework Helper</A>
        </DL><p>
    </DL><p>
</DL>`

// 测试HTML解析
function testFirefoxHTMLParsing() {
  console.log('\n📋 测试Firefox HTML解析')
  
  try {
    // 创建DOM解析器
    const parser = new DOMParser()
    const doc = parser.parseFromString(firefoxBookmarkHTML, "text/html")
    
    console.log('✅ HTML解析成功')
    
    // 检查基本结构
    const h1 = doc.querySelector('h1')
    console.log(`📍 H1标题: ${h1?.textContent || '未找到'}`)
    
    const dl = doc.querySelector('dl')
    console.log(`📍 找到DL元素: ${dl ? '是' : '否'}`)
    
    if (dl) {
      const topLevelDts = dl.querySelectorAll(":scope > dt")
      console.log(`📍 顶级DT元素数量: ${topLevelDts.length}`)
      
      topLevelDts.forEach((dt, index) => {
        const h3 = dt.querySelector(":scope > h3")
        const a = dt.querySelector(":scope > a")
        
        if (h3) {
          console.log(`  📁 文件夹 ${index + 1}: ${h3.textContent}`)
          console.log(`     是否为书签栏: ${h3.hasAttribute("PERSONAL_TOOLBAR_FOLDER")}`)
          
          // 检查子元素
          const childDl = dt.querySelector(":scope > dl")
          if (childDl) {
            const childDts = childDl.querySelectorAll(":scope > dt")
            console.log(`     子元素数量: ${childDts.length}`)
            
            childDts.forEach((childDt, childIndex) => {
              const childH3 = childDt.querySelector(":scope > h3")
              const childA = childDt.querySelector(":scope > a")
              
              if (childH3) {
                console.log(`       📁 子文件夹: ${childH3.textContent}`)
              } else if (childA) {
                console.log(`       🔗 书签: ${childA.textContent} -> ${childA.getAttribute('href')}`)
              }
            })
          }
        } else if (a) {
          console.log(`  🔗 直接书签: ${a.textContent} -> ${a.getAttribute('href')}`)
        }
      })
    }
    
    return true
  } catch (error) {
    console.error('❌ HTML解析失败:', error)
    return false
  }
}

// 测试实际的导入功能
async function testActualFirefoxImport() {
  console.log('\n📋 测试实际的Firefox导入功能')

  const store = window.useBookmarkStore?.getState?.()
  if (!store) {
    console.log('❌ 无法获取书签存储')
    return false
  }

  try {
    // 创建模拟的HTML文件内容
    const parser = new DOMParser()
    const doc = parser.parseFromString(firefoxBookmarkHTML, "text/html")

    console.log('🔄 使用应用的实际解析逻辑...')

    // 模拟实际的导入过程
    const importFromHTML = async (html) => {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")

      // 调用实际的解析函数（从应用代码复制）
      const parseBookmarkHTML = (doc) => {
        const categories = []
        const bookmarks = []

        // 递归解析书签文件夹结构
        const parseFolder = (element, parentCategoryId, level = 0, isBookmarkBar = false) => {
          const h3 = element.querySelector(":scope > h3")
          const dl = element.querySelector(":scope > dl")

          if (h3) {
            const folderName = h3.textContent?.trim() || "Unnamed Folder"
            console.log(`🔄 解析文件夹: ${folderName} (level: ${level}, 书签栏: ${isBookmarkBar})`)

            if (isBookmarkBar) {
              // 处理书签栏：其子文件夹成为一级分类
              if (dl) {
                const childDts = dl.querySelectorAll(":scope > dt")
                console.log(`   找到 ${childDts.length} 个子元素`)

                childDts.forEach((childDt, index) => {
                  const childH3 = childDt.querySelector(":scope > h3")
                  const childA = childDt.querySelector(":scope > a")

                  if (childH3) {
                    // 子文件夹，创建为一级分类
                    const categoryId = \`cat_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`
                    const category = {
                      id: categoryId,
                      name: childH3.textContent?.trim() || "Unnamed Category",
                      subCategories: [],
                    }
                    categories.push(category)
                    console.log(`   ✅ 创建分类: \${category.name}`)

                    // 递归处理这个文件夹
                    parseFolder(childDt, categoryId, 1)
                  }
                })
              }
            } else if (level === 1 && parentCategoryId) {
              // 一级分类下的处理
              const parentCategory = categories.find(cat => cat.id === parentCategoryId)
              if (!parentCategory) return

              if (dl) {
                const childDts = dl.querySelectorAll(":scope > dt")
                console.log(`   处理一级分类下的 ${childDts.length} 个子元素`)

                // 检查是否有直接书签
                let hasDirectBookmarks = false
                childDts.forEach((childDt) => {
                  const childA = childDt.querySelector(":scope > a")
                  if (childA) {
                    hasDirectBookmarks = true
                  }
                })

                // 如果有直接书签，创建默认子分类
                if (hasDirectBookmarks) {
                  const defaultSubId = \`sub_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`
                  parentCategory.subCategories.push({
                    id: defaultSubId,
                    name: "默认",
                    parentId: parentCategoryId,
                  })
                  console.log(`   ✅ 创建默认子分类`)

                  // 处理直接书签
                  childDts.forEach((childDt) => {
                    const childA = childDt.querySelector(":scope > a")
                    if (childA) {
                      bookmarks.push({
                        id: \`bm_\${Date.now()}_\${Math.random().toString(36).substr(2, 9)}\`,
                        title: childA.textContent?.trim() || "Unnamed Bookmark",
                        url: childA.getAttribute("href") || "",
                        subCategoryId: defaultSubId,
                        createdAt: new Date()
                      })
                      console.log(`   ✅ 添加书签: \${childA.textContent?.trim()}`)
                    }
                  })
                }
              }
            }
          }
        }

        // 查找书签栏并特殊处理
        const rootDl = doc.querySelector('dl')
        if (rootDl) {
          const topLevelDts = rootDl.querySelectorAll(":scope > dt")
          console.log(`🔍 找到 ${topLevelDts.length} 个顶级文件夹`)

          // 遍历所有顶级DT，查找书签栏
          for (let i = 0; i < topLevelDts.length; i++) {
            const dt = topLevelDts[i]
            const h3 = dt.querySelector(":scope > h3")

            if (h3) {
              const folderName = h3.textContent?.trim()
              const isBookmarkBar = h3.hasAttribute("PERSONAL_TOOLBAR_FOLDER")
              console.log(`📁 检查文件夹: ${folderName} (书签栏: ${isBookmarkBar})`)

              if (isBookmarkBar) {
                // 找到书签栏，特殊处理
                parseFolder(dt, undefined, 0, true)
              } else {
                // 其他文件夹按普通方式处理
                parseFolder(dt, undefined, 0, false)
              }
            }
          }
        }

        return { categories, bookmarks }
      }

      return parseBookmarkHTML(doc)
    }

    const result = await importFromHTML(firefoxBookmarkHTML)
    console.log(`✅ 实际解析结果: ${result.categories.length} 个分类, ${result.bookmarks.length} 个书签`)

    result.categories.forEach((cat, index) => {
      console.log(`  分类 ${index + 1}: ${cat.name} (${cat.subCategories.length} 个子分类)`)
      cat.subCategories.forEach((sub, subIndex) => {
        console.log(`    子分类 ${subIndex + 1}: ${sub.name}`)
      })
    })

    result.bookmarks.forEach((bookmark, index) => {
      console.log(`  书签 ${index + 1}: ${bookmark.title} -> ${bookmark.url}`)
    })

    return result.categories.length > 0 && result.bookmarks.length > 0

  } catch (error) {
    console.error('❌ 实际导入测试失败:', error)
    return false
  }
}

// 检查当前导入状态
function checkCurrentImportState() {
  console.log('\n📋 检查当前导入状态')
  
  const store = window.useBookmarkStore?.getState?.()
  if (!store) {
    console.log('❌ 无法获取书签存储')
    return
  }
  
  console.log(`📊 当前书签数量: ${store.bookmarks?.length || 0}`)
  console.log(`📊 当前分类数量: ${store.categories?.length || 0}`)
  
  if (store.categories && store.categories.length > 0) {
    console.log('📁 现有分类:')
    store.categories.forEach((cat, index) => {
      console.log(`  ${index + 1}. ${cat.name} (${cat.subCategories?.length || 0} 个子分类)`)
    })
  }
}

// 主诊断函数
async function runFirefoxDiagnosis() {
  console.log('🚀 开始Firefox书签导入诊断\n')
  
  try {
    // 1. 检查当前状态
    checkCurrentImportState()
    
    // 2. 测试HTML解析
    const htmlParseSuccess = testFirefoxHTMLParsing()
    
    // 3. 测试导入功能
    const importSuccess = await testFirefoxImport()
    
    console.log('\n✅ 诊断完成！')
    console.log('\n📋 诊断结果总结:')
    console.log(`   - HTML解析: ${htmlParseSuccess ? '✅ 正常' : '❌ 有问题'}`)
    console.log(`   - 导入功能: ${importSuccess ? '✅ 正常' : '❌ 有问题'}`)
    
    if (htmlParseSuccess && importSuccess) {
      console.log('\n🎉 Firefox书签导入功能正常！')
      console.log('   如果实际导入失败，可能的原因:')
      console.log('   1. 文件编码问题（确保是UTF-8）')
      console.log('   2. 文件损坏或格式异常')
      console.log('   3. 浏览器安全限制')
      console.log('   4. 文件过大导致解析超时')
    } else {
      console.log('\n⚠️ 发现问题，需要进一步调试')
    }
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error)
  }
}

// 等待页面加载完成后运行诊断
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', runFirefoxDiagnosis)
} else {
  runFirefoxDiagnosis()
}
