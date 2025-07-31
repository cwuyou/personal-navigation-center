const data = require('../data/website-descriptions-1000plus.json');

console.log('🎉 网站数据库统计');
console.log('==================');
console.log(`📊 网站总数: ${Object.keys(data).length}`);

const categories = {};
Object.values(data).forEach(site => {
  const cat = site.category || '未分类';
  categories[cat] = (categories[cat] || 0) + 1;
});

console.log('\n📈 分类统计:');
Object.entries(categories)
  .sort(([,a], [,b]) => b - a)
  .forEach(([cat, count]) => {
    console.log(`   ${cat}: ${count} 个网站`);
  });

console.log('\n🎯 目标: 1000+ 网站');
const remaining = 1000 - Object.keys(data).length;
if (remaining > 0) {
  console.log(`📝 还需添加: ${remaining} 个网站`);
} else {
  console.log('✅ 已达到目标！');
}
