-- 🔧 关系型设计数据库迁移脚本
-- 执行此脚本来创建新的关系型表结构

-- 1. 创建分类表
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  name TEXT NOT NULL,
  parent_id UUID REFERENCES categories(id),  -- 一级分类为null，二级分类指向一级分类
  icon TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 约束：同一用户下，同一父分类下的分类名不能重复
  UNIQUE(user_id, parent_id, name)
);

-- 2. 创建书签表
CREATE TABLE IF NOT EXISTS bookmarks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) NOT NULL,
  title TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  favicon TEXT,
  cover_image TEXT,
  tags TEXT[] DEFAULT '{}',  -- PostgreSQL数组类型，默认空数组
  sub_category_id UUID REFERENCES categories(id) NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- 约束：同一用户下URL不能重复
  UNIQUE(user_id, url)
);

-- 3. 创建性能优化索引
CREATE INDEX IF NOT EXISTS idx_categories_user_parent ON categories(user_id, parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_user_name ON categories(user_id, name);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_category ON bookmarks(user_id, sub_category_id);
CREATE INDEX IF NOT EXISTS idx_bookmarks_user_created ON bookmarks(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_bookmarks_title_search ON bookmarks USING gin(to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_bookmarks_tags ON bookmarks USING gin(tags);

-- 4. 创建数据库函数：事务性删除分类及其书签
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

-- 5. 数据迁移：从user_bookmarks迁移到关系型结构
CREATE OR REPLACE FUNCTION migrate_to_relational_structure()
RETURNS TABLE(migrated_user_id UUID, migrated_categories INTEGER, migrated_bookmarks INTEGER) AS $$
DECLARE
  user_record RECORD;
  bookmark_data JSONB;
  category_record RECORD;
  bookmark_record RECORD;
  sub_category_record RECORD;
  migrated_cats INTEGER DEFAULT 0;
  migrated_bms INTEGER DEFAULT 0;
  current_user_id UUID;
BEGIN
  -- 遍历所有有书签数据的用户
  FOR user_record IN
    SELECT DISTINCT ub.user_id
    FROM user_bookmarks ub
    WHERE ub.bookmark_data IS NOT NULL
  LOOP
    current_user_id := user_record.user_id;
    migrated_cats := 0;
    migrated_bms := 0;

    -- 获取用户的书签数据
    SELECT ub.bookmark_data INTO bookmark_data
    FROM user_bookmarks ub
    WHERE ub.user_id = current_user_id;

    -- 迁移分类数据
    IF bookmark_data ? 'categories' THEN
      FOR category_record IN
        SELECT * FROM jsonb_array_elements(bookmark_data->'categories')
      LOOP
        -- 插入一级分类
        INSERT INTO categories (id, user_id, name, parent_id, icon, sort_order)
        VALUES (
          (category_record.value->>'id')::UUID,
          current_user_id,
          category_record.value->>'name',
          NULL,
          category_record.value->>'icon',
          0
        ) ON CONFLICT (user_id, parent_id, name) DO NOTHING;

        migrated_cats := migrated_cats + 1;

        -- 插入二级分类
        IF category_record.value ? 'subCategories' THEN
          FOR sub_category_record IN
            SELECT * FROM jsonb_array_elements(category_record.value->'subCategories')
          LOOP
            INSERT INTO categories (id, user_id, name, parent_id, sort_order)
            VALUES (
              (sub_category_record.value->>'id')::UUID,
              current_user_id,
              sub_category_record.value->>'name',
              (category_record.value->>'id')::UUID,
              0
            ) ON CONFLICT (user_id, parent_id, name) DO NOTHING;

            migrated_cats := migrated_cats + 1;
          END LOOP;
        END IF;
      END LOOP;
    END IF;

    -- 迁移书签数据
    IF bookmark_data ? 'bookmarks' THEN
      FOR bookmark_record IN
        SELECT * FROM jsonb_array_elements(bookmark_data->'bookmarks')
      LOOP
        BEGIN
          INSERT INTO bookmarks (
            id, user_id, title, url, description, favicon, cover_image,
            tags, sub_category_id, created_at, updated_at
          )
          VALUES (
            (bookmark_record.value->>'id')::UUID,
            current_user_id,
            bookmark_record.value->>'title',
            bookmark_record.value->>'url',
            bookmark_record.value->>'description',
            bookmark_record.value->>'favicon',
            bookmark_record.value->>'coverImage',
            COALESCE(
              ARRAY(SELECT jsonb_array_elements_text(bookmark_record.value->'tags')),
              '{}'::TEXT[]
            ),
            (bookmark_record.value->>'subCategoryId')::UUID,
            COALESCE((bookmark_record.value->>'createdAt')::TIMESTAMPTZ, NOW()),
            COALESCE((bookmark_record.value->>'updatedAt')::TIMESTAMPTZ, NOW())
          ) ON CONFLICT (user_id, url) DO UPDATE SET
            title = EXCLUDED.title,
            description = EXCLUDED.description,
            favicon = EXCLUDED.favicon,
            cover_image = EXCLUDED.cover_image,
            tags = EXCLUDED.tags,
            updated_at = NOW();

          migrated_bms := migrated_bms + 1;
        EXCEPTION
          WHEN OTHERS THEN
            -- 跳过有问题的书签记录
            CONTINUE;
        END;
      END LOOP;
    END IF;

    -- 返回迁移结果
    RETURN QUERY SELECT current_user_id, migrated_cats, migrated_bms;

  END LOOP;
END;
$$ LANGUAGE plpgsql;

-- 6. 使用说明
/*
执行步骤：
1. 在Supabase SQL编辑器中执行此脚本
2. 运行数据迁移：SELECT * FROM migrate_to_relational_structure();
3. 验证迁移结果：
   - SELECT COUNT(*) FROM categories;
   - SELECT COUNT(*) FROM bookmarks;
4. 测试导入功能

注意：
- 此脚本是幂等的，可以安全重复执行
- 迁移过程中会保留原有的user_bookmarks表作为备份
- 建议先在测试环境执行
*/
