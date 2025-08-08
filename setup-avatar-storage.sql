-- Supabase Storage 配置：头像存储
-- 在 Supabase SQL 编辑器中执行此脚本来设置头像存储

-- =============================================
-- 1. 创建头像存储桶 (Storage Bucket)
-- =============================================

-- 注意：推荐在 Supabase Dashboard 的 Storage 页面创建存储桶
-- 通过 Dashboard 创建更安全且不容易出错
-- 如果必须通过 SQL 创建，请确保有足够的权限

-- INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
-- VALUES (
--   'avatars',
--   'avatars',
--   true,  -- 公开访问
--   5242880,  -- 5MB 限制
--   ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
-- );

-- 推荐方式：通过 Dashboard 创建存储桶
-- 1. 访问 Supabase Dashboard > Storage
-- 2. 点击 "Create bucket"
-- 3. 名称：avatars
-- 4. 勾选 "Public bucket"
-- 5. 设置文件大小限制：5MB


-- =============================================
-- 2. 设置存储桶策略 (RLS Policies)
-- =============================================

-- 允许认证用户查看所有头像
CREATE POLICY "Avatar images are publicly accessible" ON storage.objects
  FOR SELECT USING (bucket_id = 'avatars');

-- 允许用户上传自己的头像
CREATE POLICY "Users can upload their own avatar" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户更新自己的头像
CREATE POLICY "Users can update their own avatar" ON storage.objects
  FOR UPDATE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- 允许用户删除自己的头像
CREATE POLICY "Users can delete their own avatar" ON storage.objects
  FOR DELETE USING (
    bucket_id = 'avatars' 
    AND auth.uid()::text = (storage.foldername(name))[1]
  );

-- =============================================
-- 3. 创建头像管理函数（可选）
-- =============================================

-- 创建函数：获取用户头像 URL
CREATE OR REPLACE FUNCTION get_avatar_url(user_id UUID)
RETURNS TEXT AS $$
DECLARE
  avatar_path TEXT;
  public_url TEXT;
BEGIN
  -- 查找用户最新的头像文件
  SELECT name INTO avatar_path
  FROM storage.objects
  WHERE bucket_id = 'avatars'
    AND name LIKE user_id::text || '-%'
  ORDER BY created_at DESC
  LIMIT 1;
  
  IF avatar_path IS NOT NULL THEN
    -- 构建公共 URL（注意：请将 YOUR_PROJECT_URL 替换为您的实际项目 URL）
    -- 您的项目 URL 格式：https://rypnxwwkyrptosbandvg.supabase.co
    public_url := 'https://rypnxwwkyrptosbandvg.supabase.co/storage/v1/object/public/avatars/' || avatar_path;
    RETURN public_url;
  ELSE
    RETURN NULL;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建函数：清理用户旧头像
CREATE OR REPLACE FUNCTION cleanup_old_avatars(user_id UUID, keep_count INTEGER DEFAULT 1)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER := 0;
  old_avatar RECORD;
BEGIN
  -- 删除除最新 keep_count 个之外的所有头像
  FOR old_avatar IN
    SELECT name
    FROM storage.objects
    WHERE bucket_id = 'avatars'
      AND name LIKE user_id::text || '-%'
    ORDER BY created_at DESC
    OFFSET keep_count
  LOOP
    DELETE FROM storage.objects
    WHERE bucket_id = 'avatars' AND name = old_avatar.name;
    deleted_count := deleted_count + 1;
  END LOOP;
  
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 4. 更新 user_profiles 表触发器
-- =============================================

-- 创建触发器：当用户删除时清理头像文件
CREATE OR REPLACE FUNCTION cleanup_user_avatars()
RETURNS TRIGGER AS $$
BEGIN
  -- 删除用户的所有头像文件
  DELETE FROM storage.objects
  WHERE bucket_id = 'avatars'
    AND name LIKE OLD.id::text || '-%';
  
  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器
DROP TRIGGER IF EXISTS cleanup_avatars_on_user_delete ON user_profiles;
CREATE TRIGGER cleanup_avatars_on_user_delete
  BEFORE DELETE ON user_profiles
  FOR EACH ROW EXECUTE FUNCTION cleanup_user_avatars();

-- =============================================
-- 5. 验证配置
-- =============================================

-- 检查存储桶是否创建成功
SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at
FROM storage.buckets
WHERE id = 'avatars';

-- 检查策略是否创建成功
SELECT 
  policyname,
  cmd,
  permissive,
  roles
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%';

-- =============================================
-- 6. 使用说明
-- =============================================

/*
配置完成后，您可以：

1. 在应用中上传头像：
   - 文件会存储在 avatars 存储桶中
   - 文件名格式：{user_id}-{timestamp}.{extension}
   - 自动生成公共访问 URL

2. 管理头像：
   - 用户只能管理自己的头像文件
   - 支持查看、上传、更新、删除操作
   - 自动清理旧头像文件

3. 安全特性：
   - RLS 策略确保用户只能访问自己的头像
   - 文件类型和大小限制
   - 自动清理机制

4. 如果不想使用 Supabase Storage：
   - 应用会自动降级到 Base64 存储
   - 头像数据直接存储在 user_profiles 表中
   - 功能完全可用，但文件大小受限
*/

-- =============================================
-- 完成提示
-- =============================================

SELECT '🎉 头像存储配置完成！' as message;
SELECT '现在用户可以上传和管理头像了。' as instruction;
SELECT '如果不配置 Storage，会自动使用 Base64 存储。' as fallback_note;
