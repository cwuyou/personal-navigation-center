-- 修复 user_bookmarks 表重复数据问题
-- 这个脚本需要在 Supabase 数据库中执行

-- 1. 首先备份现有数据
CREATE TABLE user_bookmarks_backup AS SELECT * FROM user_bookmarks;

-- 2. 删除重复数据，只保留每个用户最新的记录
DELETE FROM user_bookmarks 
WHERE id NOT IN (
  SELECT DISTINCT ON (user_id) id 
  FROM user_bookmarks 
  ORDER BY user_id, updated_at DESC
);

-- 3. 添加唯一性约束
ALTER TABLE user_bookmarks 
ADD CONSTRAINT user_bookmarks_user_id_unique UNIQUE (user_id);

-- 4. 验证修复结果
SELECT 
  user_id, 
  COUNT(*) as record_count,
  MAX(updated_at) as latest_update
FROM user_bookmarks 
GROUP BY user_id 
HAVING COUNT(*) > 1;

-- 如果上面的查询返回空结果，说明修复成功
-- 如果仍有重复，可以重复执行步骤2

-- 5. 清理备份表（可选，建议保留一段时间）
-- DROP TABLE user_bookmarks_backup;
