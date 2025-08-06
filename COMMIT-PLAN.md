# Git 提交计划 - 按模块功能组织

## 🎯 提交策略

按照以下顺序进行模块化提交，确保每个commit都是完整的功能模块：

## 📦 提交计划

### 1. 核心状态管理系统 (State Management Core)
```bash
# 状态管理核心文件
git add src/store/
git add src/lib/query-client.ts
git add src/components/providers/query-provider.tsx
git add src/hooks/useAuthSync.ts
```

### 2. TanStack Query集成 (Data Fetching Layer)
```bash
# 数据获取层
git add src/hooks/queries/
git add src/hooks/mutations/
```

### 3. 后台管理服务层 (Admin Services)
```bash
# 管理服务API
git add src/services/admin-*.service.ts
```

### 4. 后台管理系统 (Admin System)
```bash
# 完整的后台管理界面
git add src/app/admin/
```

### 5. UI组件系统 (UI Components)
```bash
# 新增的UI组件
git add src/components/ui/
git add src/components/LoadingSpinner.tsx
```

### 6. 认证和权限系统优化 (Auth & Permissions)
```bash
# 认证相关的更新
git add src/components/providers/auth-provider.tsx
git add src/hooks/useAuth.ts
git add src/middleware.ts
```

### 7. 上传功能增强 (Upload System Enhancement)
```bash
# 上传相关的改进
git add src/components/ImageUploadButton.tsx
git add src/components/VideoUploadButton.tsx
git add src/components/UploadModal.tsx
git add src/components/upload/
```

### 8. 用户界面优化 (User Interface Improvements)
```bash
# 用户相关页面优化
git add src/app/profile/
git add src/app/images/
git add src/app/videos/
git add src/app/weibo-import/
```

### 9. 全局样式和布局 (Global Styles & Layout)
```bash
# 全局样式和布局更新
git add src/app/globals.css
git add src/app/layout.tsx
git add src/app/login/login-form.tsx
git add src/components/auth-nav-buttons.tsx
```

### 10. 开发工具和测试 (Development Tools)
```bash
# 开发和测试相关
git add src/app/test-*
git add src/app/upload-test/
git add tests/
```

### 11. 项目配置更新 (Project Configuration)
```bash
# 包管理和配置
git add package.json
git add package-lock.json
```

### 12. 资源文件 (Assets & Resources)
```bash
# 静态资源
git add public/placeholder-image.svg
git add media-management-error.png
git add src/app/components/
```

### 13. 项目文档 (Project Documentation)
```bash
# 完整的文档系统
git add docs/
```

## 🏷️ Commit 信息模板

每个commit使用以下格式：
```
<type>(<scope>): <description>

<body>

<footer>
```

### Commit Types:
- **feat**: 新功能
- **fix**: Bug修复
- **docs**: 文档更新
- **style**: 代码格式化
- **refactor**: 重构
- **perf**: 性能优化
- **test**: 测试相关
- **build**: 构建相关
- **ci**: CI/CD相关