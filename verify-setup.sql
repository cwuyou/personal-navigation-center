-- Supabase 配置验证脚本
-- 在 Supabase SQL 编辑器中执行此脚本来验证配置是否正确

-- =============================================
-- 1. 检查表是否存在
-- =============================================

SELECT 
  'Tables Check' as check_type,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ 所有表已创建'
    ELSE '❌ 缺少表，当前数量: ' || COUNT(*)::text
  END as status
FROM information_schema.tables 
WHERE table_schema = 'public' 
  AND table_name IN ('user_profiles', 'feedback', 'ratings', 'user_bookmarks');

-- =============================================
-- 2. 检查表结构
-- =============================================

-- 检查 user_profiles 表结构
SELECT 
  'user_profiles Structure' as check_type,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ user_profiles 表结构正确'
    ELSE '❌ user_profiles 表结构不完整'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_profiles'
  AND column_name IN ('id', 'email', 'display_name', 'avatar_url', 'preferences', 'created_at');

-- 检查 feedback 表结构
SELECT 
  'feedback Structure' as check_type,
  CASE 
    WHEN COUNT(*) >= 8 THEN '✅ feedback 表结构正确'
    ELSE '❌ feedback 表结构不完整'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'feedback'
  AND column_name IN ('id', 'user_id', 'type', 'content', 'satisfaction', 'contact', 'timestamp', 'created_at');

-- 检查 ratings 表结构
SELECT 
  'ratings Structure' as check_type,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ ratings 表结构正确'
    ELSE '❌ ratings 表结构不完整'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'ratings'
  AND column_name IN ('id', 'user_id', 'rating', 'comment', 'timestamp', 'created_at');

-- 检查 user_bookmarks 表结构
SELECT 
  'user_bookmarks Structure' as check_type,
  CASE 
    WHEN COUNT(*) >= 4 THEN '✅ user_bookmarks 表结构正确'
    ELSE '❌ user_bookmarks 表结构不完整'
  END as status
FROM information_schema.columns 
WHERE table_schema = 'public' 
  AND table_name = 'user_bookmarks'
  AND column_name IN ('id', 'user_id', 'bookmark_data', 'created_at');

-- =============================================
-- 3. 检查 RLS 是否启用
-- =============================================

SELECT 
  'RLS Check' as check_type,
  CASE 
    WHEN COUNT(*) = 4 THEN '✅ 所有表已启用 RLS'
    ELSE '❌ 部分表未启用 RLS，已启用数量: ' || COUNT(*)::text
  END as status
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'feedback', 'ratings', 'user_bookmarks')
  AND rowsecurity = true;

-- =============================================
-- 4. 检查索引是否创建
-- =============================================

SELECT 
  'Indexes Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 6 THEN '✅ 主要索引已创建'
    ELSE '❌ 部分索引缺失，当前数量: ' || COUNT(*)::text
  END as status
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'feedback', 'ratings', 'user_bookmarks')
  AND indexname LIKE 'idx_%';

-- =============================================
-- 5. 检查 RLS 策略
-- =============================================

SELECT 
  'RLS Policies Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 10 THEN '✅ RLS 策略已配置'
    ELSE '❌ 部分 RLS 策略缺失，当前数量: ' || COUNT(*)::text
  END as status
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'feedback', 'ratings', 'user_bookmarks');

-- =============================================
-- 6. 检查触发器
-- =============================================

SELECT 
  'Triggers Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 2 THEN '✅ 自动更新触发器已配置'
    ELSE '❌ 触发器配置不完整，当前数量: ' || COUNT(*)::text
  END as status
FROM information_schema.triggers 
WHERE event_object_schema = 'public' 
  AND event_object_table IN ('user_profiles', 'user_bookmarks')
  AND trigger_name LIKE '%updated_at%';

-- =============================================
-- 7. 检查函数
-- =============================================

SELECT 
  'Functions Check' as check_type,
  CASE 
    WHEN COUNT(*) >= 1 THEN '✅ 更新时间戳函数已创建'
    ELSE '❌ 更新时间戳函数缺失'
  END as status
FROM information_schema.routines 
WHERE routine_schema = 'public' 
  AND routine_name = 'update_updated_at_column';

-- =============================================
-- 8. 详细信息查询（可选）
-- =============================================

-- 显示所有表的详细信息
SELECT 
  '=== 表详细信息 ===' as info_type,
  schemaname,
  tablename,
  tableowner,
  hasindexes,
  hasrules,
  hastriggers,
  rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'feedback', 'ratings', 'user_bookmarks')
ORDER BY tablename;

-- 显示所有策略
SELECT 
  '=== RLS 策略详情 ===' as info_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  cmd as command,
  CASE 
    WHEN qual IS NOT NULL THEN 'Has WHERE clause'
    ELSE 'No WHERE clause'
  END as has_condition
FROM pg_policies 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'feedback', 'ratings', 'user_bookmarks')
ORDER BY tablename, policyname;

-- 显示所有索引
SELECT 
  '=== 索引详情 ===' as info_type,
  schemaname,
  tablename,
  indexname,
  indexdef
FROM pg_indexes 
WHERE schemaname = 'public' 
  AND tablename IN ('user_profiles', 'feedback', 'ratings', 'user_bookmarks')
ORDER BY tablename, indexname;

-- =============================================
-- 9. 测试基本功能（可选）
-- =============================================

-- 测试是否可以查询表（应该返回空结果，不报错）
SELECT 'Basic Query Test' as test_type, 'user_profiles' as table_name, COUNT(*) as record_count FROM user_profiles;
SELECT 'Basic Query Test' as test_type, 'feedback' as table_name, COUNT(*) as record_count FROM feedback;
SELECT 'Basic Query Test' as test_type, 'ratings' as table_name, COUNT(*) as record_count FROM ratings;
SELECT 'Basic Query Test' as test_type, 'user_bookmarks' as table_name, COUNT(*) as record_count FROM user_bookmarks;

-- =============================================
-- 验证完成提示
-- =============================================

SELECT 
  '🎉 验证完成！' as message,
  '如果所有检查都显示 ✅，说明配置正确。' as instruction,
  '如果有 ❌ 项目，请检查对应的配置。' as warning;
