-- 🔧 简化的关系型设计迁移脚本
-- 分步骤执行，避免复杂的存储过程

-- 第0步：清理现有结构（如果需要重新创建）
-- 注意：这会删除现有的关系型数据，请谨慎执行

-- 删除现有函数
DROP FUNCTION IF EXISTS delete_category_with_bookmarks(UUID, UUID);
DROP FUNCTION IF EXISTS migrate_to_relational_structure();

-- 删除现有索引
DROP INDEX IF EXISTS idx_categories_user_parent;
DROP INDEX IF EXISTS idx_categories_user_name;
DROP INDEX IF EXISTS idx_bookmarks_user_category;
DROP INDEX IF EXISTS idx_bookmarks_user_created;
DROP INDEX IF EXISTS idx_bookmarks_title_search;
DROP INDEX IF EXISTS idx_bookmarks_tags;

-- 删除现有表（注意：会删除数据！）
DROP TABLE IF EXISTS bookmarks CASCADE;
DROP TABLE IF EXISTS categories CASCADE;

-- 第1步：创建分类表
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id),
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, parent_id, name)
);

-- 第2步：创建书签表
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',
  sub_category_id UUID REFERENCES categories(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, url)
);

-- 第3步：创建索引
CREATE INDEX IF NOT EXISTS idx_categories_user_parent ON categories(user_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_name ON categories(user_id, name);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_category ON bookmarks(user_id, sub_category_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_title_search ON bookmarks USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON bookmarks USING gin(tags);

-- 第4步：创建删除分类的函数
CREATE OR REPLACE FUNCTION delete_category_with_bookmarks(
  p_user_id UUID,
  p_category_id UUID
) RETURNS INTEGER AS $$
DECLARE
  deleted_bookmarks_count INTEGER;
  child_categories UUID[];
BEGIN
  -- 获取所有子分类ID
  SELECT ARRAY(
    SELECT id FROM categories 
    WHERE user_id = p_user_id AND parent_id = p_category_id
  ) INTO child_categories;
  
  -- 删除该分类及其子分类下的所有书签
  DELETE FROM bookmarks 
  WHERE user_id = p_user_id 
    AND (sub_category_id = p_category_id OR sub_category_id = ANY(child_categories));
  
  GET DIAGNOSTICS deleted_bookmarks_count = ROW_COUNT;
  
  -- 删除子分类
  DELETE FROM categories 
  WHERE user_id = p_user_id AND parent_id = p_category_id;
  
  -- 删除主分类
  DELETE FROM categories 
  WHERE user_id = p_user_id AND id = p_category_id;
  
  RETURN deleted_bookmarks_count;
END;
$$ LANGUAGE plpgsql;

-- 第5步：验证表创建
-- 运行以下查询验证表是否创建成功：

-- 检查分类表
SELECT 'categories表创建成功' as status, COUNT(*) as record_count FROM categories;

-- 检查书签表  
SELECT 'bookmarks表创建成功' as status, COUNT(*) as record_count FROM bookmarks;

-- 检查索引
SELECT 
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE tablename IN ('categories', 'bookmarks')
ORDER BY tablename, indexname;

-- 第6步：测试函数
-- 测试删除分类函数（不会实际删除数据，因为没有匹配的记录）
SELECT delete_category_with_bookmarks('00000000-0000-0000-0000-000000000000'::UUID, '00000000-0000-0000-0000-000000000000'::UUID) as test_result;

/*
⚠️  重要执行说明：

🔧 安全执行步骤：
1. 【备份数据】先确保您的书签数据已经导出备份
2. 【检查现状】在Supabase控制台检查是否已有categories/bookmarks表
3. 【选择执行】根据情况选择执行方式：

方式A：如果是全新环境（推荐）
- 跳过"第0步"，直接从"第1步"开始执行

方式B：如果需要重新创建表结构
- 从"第0步"开始执行（会删除现有关系型数据）
- ⚠️ 注意：第0步会删除现有的categories和bookmarks表中的数据

🛠️ 执行方法：
1. 在Supabase控制台 → SQL编辑器
2. 根据需要选择从第0步或第1步开始复制粘贴
3. 逐步执行，检查每步是否成功
4. 最后运行验证查询

✅ 验证成功标志：
- 看到"categories表创建成功"
- 看到"bookmarks表创建成功"
- 索引列表显示6个索引
- 函数测试返回0（正常）

🔄 执行后：
1. 刷新应用页面
2. 运行 runCompleteVerification() 验证
3. 重新导入书签文件测试

💾 数据安全：
- user_bookmarks表会保留作为备份
- 可以随时从JSON数据恢复
*/
