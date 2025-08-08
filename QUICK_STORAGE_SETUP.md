# 快速解决"云端存储不可用"问题

## 🎯 问题说明

当您看到"已保存到本地（云端存储不可用）"提示时，说明：
- ✅ Supabase 数据库连接正常
- ❌ Supabase Storage 存储桶未配置

## 🚀 快速解决方案

### **方案一：5分钟配置云端存储（推荐）**

#### 1. 创建存储桶
1. 打开 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择您的项目
3. 点击左侧 **"Storage"**
4. 点击 **"Create bucket"**
5. 输入：
   - Name: `avatars`
   - ✅ 勾选 "Public bucket"
6. 点击 **"Create bucket"**

#### 2. 配置权限（重要！）
在 Supabase SQL 编辑器中粘贴并执行：

```sql
-- 允许公开访问头像
CREATE POLICY "Public Avatar Access" ON storage.objects
FOR SELECT USING (bucket_id = 'avatars');

-- 允许用户上传自己的头像
CREATE POLICY "User Avatar Upload" ON storage.objects
FOR INSERT WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

#### 3. 测试
- 刷新页面
- 重新上传头像
- 应该显示"头像已保存到云端"

### **方案二：继续使用本地存储（简单）**

如果您不想配置云端存储：

1. **勾选"始终使用本地存储"选项**
   - 在个人设置的头像上传区域
   - 勾选"始终使用本地存储（不尝试云端）"
   - 以后不会再尝试云端存储

2. **优点**：
   - ✅ 无需额外配置
   - ✅ 完全离线可用
   - ✅ 数据完全本地化

3. **注意事项**：
   - 建议图片不超过 1MB
   - 头像数据存储在数据库中

## 🔍 验证配置是否成功

### 检查存储桶
```sql
SELECT id, name, public FROM storage.buckets WHERE id = 'avatars';
```
应该返回一行数据，`public` 为 `true`

### 检查权限策略
```sql
SELECT policyname FROM pg_policies 
WHERE schemaname = 'storage' AND tablename = 'objects' 
AND policyname LIKE '%Avatar%';
```
应该返回两个策略

## 🛠️ 常见问题

### Q: 创建存储桶时提示权限不足
**A**: 确保您是项目的 Owner 或有 Storage 权限

### Q: 执行 SQL 时报错
**A**: 确保在正确的项目中执行，检查语法是否完整

### Q: 配置后仍然提示不可用
**A**: 
1. 刷新页面重试
2. 检查存储桶名称是否为 `avatars`
3. 确认存储桶设置为 Public

### Q: 想要切换存储方式
**A**: 在个人设置中勾选/取消勾选"始终使用本地存储"选项

## 💡 推荐配置

### 生产环境
- ✅ 配置 Supabase Storage
- ✅ 设置 CDN 加速
- ✅ 定期备份

### 开发/测试环境
- ✅ 使用本地存储
- ✅ 快速迭代测试
- ✅ 无需额外配置

## 🎉 配置完成后的效果

### 云端存储
- 头像 URL: `https://xxx.supabase.co/storage/v1/object/public/avatars/xxx.jpg`
- 提示: "头像已保存到云端"
- 加载速度快，支持 CDN

### 本地存储
- 头像 URL: `data:image/jpeg;base64,/9j/4AAQ...`
- 提示: "头像已更新"
- 完全离线，数据本地化

---

**选择建议**：
- 🏢 **团队/生产使用** → 配置云端存储
- 👤 **个人/测试使用** → 本地存储即可

两种方式都完全可用，根据您的需求选择即可！
