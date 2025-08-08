-- Supabase Storage 诊断脚本
-- 在 Supabase SQL 编辑器中执行此脚本来诊断头像存储问题

-- =============================================
-- 1. 检查存储桶配置
-- =============================================

SELECT '=== 存储桶配置检查 ===' as diagnosis_step;

SELECT 
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types,
  created_at,
  CASE 
    WHEN public = true THEN '✅ 公开访问已启用'
    ELSE '❌ 存储桶未设置为公开'
  END as public_status
FROM storage.buckets
WHERE id = 'avatars';

-- 如果上面查询没有返回结果，说明存储桶不存在
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') 
    THEN '✅ avatars 存储桶存在'
    ELSE '❌ avatars 存储桶不存在，需要创建'
  END as bucket_existence;

-- =============================================
-- 2. 检查 RLS 策略
-- =============================================

SELECT '=== RLS 策略检查 ===' as diagnosis_step;

SELECT 
  policyname,
  cmd,
  permissive,
  roles,
  CASE 
    WHEN cmd = 'SELECT' THEN '✅ 读取权限策略'
    WHEN cmd = 'INSERT' THEN '✅ 上传权限策略'
    WHEN cmd = 'UPDATE' THEN '✅ 更新权限策略'
    WHEN cmd = 'DELETE' THEN '✅ 删除权限策略'
    ELSE '❓ 未知策略类型'
  END as policy_type
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%'
ORDER BY cmd;

-- 检查策略数量
SELECT 
  COUNT(*) as policy_count,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ 策略数量正常 (应该有4个)'
    WHEN COUNT(*) > 0 THEN '⚠️ 策略数量不足，可能缺少某些权限'
    ELSE '❌ 没有找到头像相关策略'
  END as policy_status
FROM pg_policies
WHERE schemaname = 'storage'
  AND tablename = 'objects'
  AND policyname LIKE '%avatar%';

-- =============================================
-- 3. 检查存储对象
-- =============================================

SELECT '=== 存储对象检查 ===' as diagnosis_step;

-- 检查是否有任何文件在 avatars 存储桶中
SELECT 
  COUNT(*) as total_files,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ 存储桶中有文件'
    ELSE '❌ 存储桶为空，可能上传失败'
  END as files_status
FROM storage.objects
WHERE bucket_id = 'avatars';

-- 显示最近的文件（如果有的话）
SELECT 
  name,
  created_at,
  metadata,
  CASE 
    WHEN name ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}-[0-9]+\.' 
    THEN '✅ 文件名格式正确'
    ELSE '⚠️ 文件名格式可能有问题'
  END as filename_status
FROM storage.objects
WHERE bucket_id = 'avatars'
ORDER BY created_at DESC
LIMIT 5;

-- =============================================
-- 4. 检查用户表
-- =============================================

SELECT '=== 用户表检查 ===' as diagnosis_step;

-- 检查 user_profiles 表是否存在
SELECT 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.tables 
      WHERE table_name = 'user_profiles' AND table_schema = 'public'
    ) 
    THEN '✅ user_profiles 表存在'
    ELSE '❌ user_profiles 表不存在'
  END as user_profiles_status;

-- 检查是否有用户数据
SELECT 
  COUNT(*) as user_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ 有用户数据'
    ELSE '❌ 没有用户数据'
  END as users_status
FROM user_profiles;

-- =============================================
-- 5. 检查认证用户
-- =============================================

SELECT '=== 认证系统检查 ===' as diagnosis_step;

-- 检查是否有认证用户
SELECT 
  COUNT(*) as auth_user_count,
  CASE 
    WHEN COUNT(*) > 0 THEN '✅ 有认证用户'
    ELSE '❌ 没有认证用户'
  END as auth_status
FROM auth.users;

-- =============================================
-- 6. 权限测试
-- =============================================

SELECT '=== 权限测试 ===' as diagnosis_step;

-- 测试当前用户是否可以查看存储桶
SELECT 
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') 
    THEN '✅ 可以访问存储桶信息'
    ELSE '❌ 无法访问存储桶信息'
  END as bucket_access_test;

-- =============================================
-- 7. 诊断建议
-- =============================================

SELECT '=== 诊断建议 ===' as diagnosis_step;

-- 根据检查结果提供建议
WITH diagnosis AS (
  SELECT 
    EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars') as bucket_exists,
    EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'avatars' AND public = true) as bucket_public,
    (SELECT COUNT(*) FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname LIKE '%avatar%') as policy_count,
    EXISTS (SELECT 1 FROM user_profiles) as has_users
)
SELECT 
  CASE 
    WHEN NOT bucket_exists THEN '🔧 需要创建 avatars 存储桶'
    WHEN NOT bucket_public THEN '🔧 需要将存储桶设置为公开'
    WHEN policy_count < 4 THEN '🔧 需要创建或修复 RLS 策略'
    WHEN NOT has_users THEN '🔧 需要创建用户配置表'
    ELSE '✅ 基础配置看起来正常，可能是应用层问题'
  END as recommendation
FROM diagnosis;

-- =============================================
-- 8. 快速修复脚本
-- =============================================

SELECT '=== 快速修复建议 ===' as diagnosis_step;

SELECT '如果上述检查发现问题，可以执行以下修复：

1. 如果存储桶不存在或不是公开的：
   - 在 Supabase Dashboard > Storage 中创建 avatars 存储桶
   - 确保勾选 "Public bucket"

2. 如果策略不完整，执行以下 SQL：

CREATE POLICY "Public Avatar Access" ON storage.objects
FOR SELECT USING (bucket_id = ''avatars'');

CREATE POLICY "User Avatar Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = ''avatars'' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "User Avatar Update" ON storage.objects
FOR UPDATE USING (
  bucket_id = ''avatars'' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "User Avatar Delete" ON storage.objects
FOR DELETE USING (
  bucket_id = ''avatars'' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

3. 如果仍然有问题，检查浏览器控制台的错误信息。
' as fix_instructions;
