-- 修复现有用户的 user_profiles 记录
-- 在 Supabase SQL 编辑器中执行此脚本

-- =============================================
-- 1. 查看当前认证用户（不包含配置记录的）
-- =============================================

SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  p.id as profile_exists
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- =============================================
-- 2. 为所有缺少配置的用户创建 user_profiles 记录
-- =============================================

INSERT INTO user_profiles (id, email, display_name, created_at, updated_at)
SELECT 
  u.id,
  u.email,
  COALESCE(
    u.raw_user_meta_data->>'display_name',
    split_part(u.email, '@', 1),
    '用户'
  ) as display_name,
  NOW() as created_at,
  NOW() as updated_at
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
WHERE p.id IS NULL;

-- =============================================
-- 3. 创建触发器自动处理新用户
-- =============================================

-- 创建函数：当新用户注册时自动创建 user_profiles 记录
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, display_name, created_at, updated_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'display_name',
      split_part(NEW.email, '@', 1),
      '用户'
    ),
    NOW(),
    NOW()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 删除可能存在的旧触发器
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- 创建新触发器：在 auth.users 表插入新记录时触发
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- 4. 验证修复结果
-- =============================================

-- 查看所有用户及其配置记录
SELECT 
  u.id,
  u.email,
  u.created_at as user_created_at,
  p.display_name,
  p.created_at as profile_created_at,
  CASE 
    WHEN p.id IS NOT NULL THEN '✅ 已有配置'
    ELSE '❌ 缺少配置'
  END as status
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id
ORDER BY u.created_at DESC;

-- 统计信息
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as users_without_profiles
FROM auth.users u
LEFT JOIN user_profiles p ON u.id = p.id;

-- =============================================
-- 5. 测试触发器（可选）
-- =============================================

-- 注意：以下是测试代码，实际使用时请注释掉
/*
-- 测试创建用户时是否自动创建配置
-- 这会创建一个测试用户，请在生产环境中谨慎使用

INSERT INTO auth.users (
  instance_id,
  id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  raw_app_meta_data,
  raw_user_meta_data,
  is_super_admin,
  confirmation_token,
  email_change,
  email_change_token_new,
  recovery_token
) VALUES (
  '00000000-0000-0000-0000-000000000000',
  gen_random_uuid(),
  'authenticated',
  'authenticated',
  'test@example.com',
  crypt('password123', gen_salt('bf')),
  NOW(),
  NOW(),
  NOW(),
  '{"provider": "email", "providers": ["email"]}',
  '{"display_name": "测试用户"}',
  false,
  '',
  '',
  '',
  ''
);

-- 检查是否自动创建了 user_profiles 记录
SELECT * FROM user_profiles WHERE email = 'test@example.com';

-- 清理测试数据
DELETE FROM user_profiles WHERE email = 'test@example.com';
DELETE FROM auth.users WHERE email = 'test@example.com';
*/

-- =============================================
-- 完成提示
-- =============================================

SELECT '🎉 用户配置修复完成！' as message;
SELECT '现在所有用户都应该有对应的 user_profiles 记录了。' as instruction;
SELECT '新注册的用户也会自动创建配置记录。' as note;
