const fs = require('fs');
const path = require('path');

// 读取预置数据库
function loadPresetDatabase() {
  try {
    const dbPath = path.join(__dirname, '../data/website-descriptions-1000plus.json');
    const data = JSON.parse(fs.readFileSync(dbPath, 'utf8'));
    return data;
  } catch (error) {
    console.error('❌ 无法读取预置数据库:', error.message);
    return {};
  }
}

// 从URL中提取域名
function extractDomain(url) {
  try {
    const urlObj = new URL(url);
    let hostname = urlObj.hostname.toLowerCase();
    
    // 移除 www. 前缀
    if (hostname.startsWith('www.')) {
      hostname = hostname.substring(4);
    }
    
    return hostname;
  } catch (error) {
    return null;
  }
}

// 解析HTML书签文件
function parseBookmarksHTML(htmlContent) {
  const bookmarks = [];
  
  // 使用正则表达式匹配书签链接
  const linkRegex = /<A[^>]+HREF="([^"]+)"[^>]*>([^<]*)<\/A>/gi;
  let match;
  
  while ((match = linkRegex.exec(htmlContent)) !== null) {
    const url = match[1];
    const title = match[2];
    const domain = extractDomain(url);
    
    if (domain) {
      bookmarks.push({
        url: url,
        title: title.trim(),
        domain: domain
      });
    }
  }
  
  return bookmarks;
}

// 分析书签匹配情况
function analyzeBookmarks(bookmarksFile) {
  console.log('📚 开始分析书签文件...\n');
  
  // 读取书签文件
  let htmlContent;
  try {
    htmlContent = fs.readFileSync(bookmarksFile, 'utf8');
  } catch (error) {
    console.error('❌ 无法读取书签文件:', error.message);
    return;
  }
  
  // 加载预置数据库
  const presetDb = loadPresetDatabase();
  const presetDomains = Object.keys(presetDb);
  
  console.log(`📊 预置数据库包含 ${presetDomains.length} 个网站`);
  
  // 解析书签
  const bookmarks = parseBookmarksHTML(htmlContent);
  console.log(`🔖 书签文件包含 ${bookmarks.length} 个书签\n`);
  
  // 分析匹配情况
  const matched = [];
  const unmatched = [];
  
  bookmarks.forEach(bookmark => {
    if (presetDomains.includes(bookmark.domain)) {
      matched.push({
        ...bookmark,
        presetInfo: presetDb[bookmark.domain]
      });
    } else {
      unmatched.push(bookmark);
    }
  });
  
  // 输出结果
  console.log('🎯 匹配结果统计:');
  console.log(`✅ 已在预置数据库中: ${matched.length} 个 (${(matched.length / bookmarks.length * 100).toFixed(1)}%)`);
  console.log(`❌ 不在预置数据库中: ${unmatched.length} 个 (${(unmatched.length / bookmarks.length * 100).toFixed(1)}%)\n`);
  
  // 显示匹配的网站
  if (matched.length > 0) {
    console.log('✅ 已匹配的网站:');
    matched.forEach((item, index) => {
      console.log(`${index + 1}. ${item.domain} - ${item.presetInfo.title}`);
      console.log(`   分类: ${item.presetInfo.category}`);
      console.log(`   书签标题: ${item.title}`);
      console.log('');
    });
  }
  
  // 显示未匹配的网站（前20个）
  if (unmatched.length > 0) {
    console.log('❌ 未匹配的网站 (前20个):');
    unmatched.slice(0, 20).forEach((item, index) => {
      console.log(`${index + 1}. ${item.domain} - ${item.title}`);
    });
    
    if (unmatched.length > 20) {
      console.log(`... 还有 ${unmatched.length - 20} 个未匹配的网站`);
    }
    console.log('');
  }
  
  // 按分类统计匹配的网站
  if (matched.length > 0) {
    const categoryStats = {};
    matched.forEach(item => {
      const category = item.presetInfo.category;
      categoryStats[category] = (categoryStats[category] || 0) + 1;
    });
    
    console.log('📊 匹配网站的分类统计:');
    Object.entries(categoryStats)
      .sort(([,a], [,b]) => b - a)
      .forEach(([category, count]) => {
        console.log(`  ${category}: ${count} 个`);
      });
  }
  
  // 生成未匹配网站的域名列表（用于后续添加）
  if (unmatched.length > 0) {
    const unmatchedDomains = unmatched.map(item => item.domain);
    const uniqueDomains = [...new Set(unmatchedDomains)].sort();
    
    console.log('\n📝 未匹配的唯一域名列表 (可用于扩展数据库):');
    uniqueDomains.forEach(domain => {
      console.log(`"${domain}": {`);
      console.log(`  "title": "",`);
      console.log(`  "description": "",`);
      console.log(`  "category": "",`);
      console.log(`  "tags": [],`);
      console.log(`  "coverImage": "https://${domain}/favicon.ico"`);
      console.log(`},`);
    });
  }
}

// 主函数
function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.log('使用方法: node analyze-bookmarks.js <书签文件路径>');
    console.log('例如: node analyze-bookmarks.js bookmarks.html');
    return;
  }
  
  const bookmarksFile = args[0];
  
  if (!fs.existsSync(bookmarksFile)) {
    console.error(`❌ 文件不存在: ${bookmarksFile}`);
    return;
  }
  
  analyzeBookmarks(bookmarksFile);
}

main();
