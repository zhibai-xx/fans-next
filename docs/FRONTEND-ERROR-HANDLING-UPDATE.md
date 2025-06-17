# 前端错误处理统一更新

## 概述

为了配合后端错误响应格式的统一，前端的错误处理逻辑也进行了相应的更新，确保能够正确处理后端返回的统一错误格式。

## 后端错误格式（已统一）

```typescript
interface ApiError {
  statusCode: number;    // HTTP状态码
  timestamp: string;     // ISO时间戳
  path: string;         // 请求路径
  message: string;      // 错误信息（统一为字符串）
  error: string;        // 错误类型
}
```

## 前端更新内容

### 1. 更新API错误类型定义

**文件**: `src/types/api.ts`

- 更新了 `ApiError` 接口以匹配后端的统一格式
- 移除了旧的 `issues` 字段，因为现在所有错误都统一为 `message` 字符串

### 2. 创建统一错误处理工具

**文件**: `src/lib/utils/error-handler.ts`

创建了两个核心函数：

- `getErrorMessage(error: unknown): string` - 从各种错误对象中提取错误消息
- `handleApiError(error: unknown, defaultMessage?: string): string` - 处理API错误的通用函数

**特性**:
- 支持多种错误格式（API错误、标准Error对象、字符串等）
- 自动提取最合适的错误消息
- 提供默认错误消息作为后备

### 3. 更新所有组件的错误处理

#### 登录表单 (`src/app/login/login-form.tsx`)
```typescript
// 之前
setError('登录时发生错误，请稍后重试');

// 现在
setError(handleApiError(error, '登录失败，请稍后重试'));
```

#### 注册表单 (`src/app/signup/signup-form.tsx`)
```typescript
// 之前
const apiError = error as ApiError;
if (apiError.issues && apiError.issues.length > 0) {
  setError(apiError.issues[0].message);
} else {
  setError(apiError.error || '注册时发生错误，请稍后重试');
}

// 现在
setError(handleApiError(error, '注册失败，请稍后重试'));
```

#### 个人资料表单 (`src/app/profile/profile-form.tsx`)
```typescript
// 之前
setError(
  error instanceof Error ? error.message : '更新资料时发生错误，请稍后重试'
);

// 现在
setError(handleApiError(error, '更新资料失败，请稍后重试'));
```

#### 密码修改表单 (`src/app/profile/password-form.tsx`)
```typescript
// 之前
setError(
  error instanceof Error ? error.message : '更新密码时发生错误，请稍后重试'
);

// 现在
setError(handleApiError(error, '更新密码失败，请稍后重试'));
```

#### 收藏列表 (`src/app/profile/favorites-list.tsx`)
```typescript
// 之前
setError('获取收藏列表时发生错误，请稍后重试');
setError('取消收藏时发生错误，请稍后重试');

// 现在
setError(handleApiError(error, '获取收藏列表失败，请稍后重试'));
setError(handleApiError(error, '取消收藏失败，请稍后重试'));
```

#### 下载记录列表 (`src/app/profile/downloads-list.tsx`)
```typescript
// 之前
setError('获取下载记录时发生错误，请稍后重试');

// 现在
setError(handleApiError(error, '获取下载记录失败，请稍后重试'));
```

#### 标签测试页面 (`src/app/test-tags/page.tsx`)
```typescript
// 之前
setError(err instanceof Error ? err.message : '获取标签失败');
setError(err instanceof Error ? err.message : '创建标签失败');
setError(err instanceof Error ? err.message : '搜索标签失败');

// 现在
setError(handleApiError(err, '获取标签失败'));
setError(handleApiError(err, '创建标签失败'));
setError(handleApiError(err, '搜索标签失败'));
```

## 更新的优势

### 1. 统一性
- 所有错误处理逻辑统一使用 `handleApiError` 函数
- 消除了不同组件间错误处理的差异

### 2. 智能错误提取
- 自动从不同类型的错误对象中提取最合适的错误消息
- 支持后端返回的统一错误格式
- 兼容各种异常情况

### 3. 用户体验改善
- 用户看到的错误消息更加准确和有意义
- 不再显示技术性的默认错误消息
- 错误消息格式一致

### 4. 开发体验改善
- 减少了重复的错误处理代码
- 更容易维护和更新
- 类型安全的错误处理

## 测试验证

创建了测试脚本 `test-frontend-error-handling.js` 来验证：

1. 后端返回的错误格式是否统一
2. 前端是否能正确处理各种错误类型
3. 错误消息是否正确显示给用户

## 使用指南

在新的组件中处理错误时，请使用以下模式：

```typescript
import { handleApiError } from '@/lib/utils/error-handler';

// 在 catch 块中
catch (error) {
  console.error('操作失败:', error);
  setError(handleApiError(error, '操作失败，请稍后重试'));
}
```

## 注意事项

1. **保留的硬编码错误**: 某些特定的业务逻辑错误（如表单验证）仍然使用硬编码消息，这是合理的
2. **视频播放器错误**: VideoPlayer 组件的错误处理保持不变，因为这些是浏览器API的技术错误
3. **网络错误**: 网络连接错误等底层错误会显示默认消息

## 兼容性

- 向后兼容：旧的错误格式仍然能够被正确处理
- 向前兼容：新的统一错误格式能够被正确解析和显示
- 类型安全：所有错误处理都有完整的TypeScript类型支持 