#!/usr/bin/env node

/**
 * 合并原始网站数据库和扩展数据库
 * 生成包含1000+网站的完整数据库
 */

const fs = require('fs');
const path = require('path');

// 读取原始数据库
const originalPath = path.join(__dirname, '../data/website-descriptions.json');
const extendedPath = path.join(__dirname, '../data/website-descriptions-extended.json');
const outputPath = path.join(__dirname, '../data/website-descriptions-merged.json');

try {
  console.log('🔄 开始合并网站数据库...');
  
  // 读取文件
  const originalData = JSON.parse(fs.readFileSync(originalPath, 'utf8'));
  const extendedData = JSON.parse(fs.readFileSync(extendedPath, 'utf8'));
  
  console.log(`📊 原始数据库: ${Object.keys(originalData).length} 个网站`);
  console.log(`📊 扩展数据库: ${Object.keys(extendedData).length} 个网站`);
  
  // 合并数据，扩展数据优先（覆盖重复项）
  const mergedData = {
    ...originalData,
    ...extendedData
  };
  
  // 检查重复项
  const originalKeys = Object.keys(originalData);
  const extendedKeys = Object.keys(extendedData);
  const duplicates = originalKeys.filter(key => extendedKeys.includes(key));
  
  if (duplicates.length > 0) {
    console.log(`⚠️  发现 ${duplicates.length} 个重复项，将使用扩展数据库的版本:`);
    duplicates.forEach(key => {
      console.log(`   - ${key}: ${extendedData[key].title}`);
    });
  }
  
  // 统计分类
  const categories = {};
  Object.values(mergedData).forEach(site => {
    const category = site.category || '未分类';
    categories[category] = (categories[category] || 0) + 1;
  });
  
  console.log('\n📈 分类统计:');
  Object.entries(categories)
    .sort(([,a], [,b]) => b - a)
    .forEach(([category, count]) => {
      console.log(`   ${category}: ${count} 个网站`);
    });
  
  // 写入合并后的数据
  fs.writeFileSync(outputPath, JSON.stringify(mergedData, null, 2), 'utf8');
  
  console.log(`\n✅ 合并完成！`);
  console.log(`📁 输出文件: ${outputPath}`);
  console.log(`🎉 总计: ${Object.keys(mergedData).length} 个网站`);
  
  // 生成统计报告
  const report = {
    totalSites: Object.keys(mergedData).length,
    categories: categories,
    duplicatesResolved: duplicates.length,
    generatedAt: new Date().toISOString()
  };
  
  const reportPath = path.join(__dirname, '../data/merge-report.json');
  fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
  console.log(`📊 统计报告: ${reportPath}`);
  
} catch (error) {
  console.error('❌ 合并失败:', error.message);
  process.exit(1);
}
