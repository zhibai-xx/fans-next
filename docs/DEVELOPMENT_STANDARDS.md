# 🚀 粉丝社区项目 - 开发规范

## 📋 **核心原则**

1. **一次开发，处处可用** - 避免重复造轮子
2. **样式完全隔离** - 使用CSS Modules防止样式冲突
3. **类型安全优先** - 严格的TypeScript类型定义
4. **组件单一职责** - 每个组件只做一件事
5. **错误处理完善** - 所有组件都要有适当的错误处理

---

## 🎬 **视频播放器规范**

### **✅ 唯一允许的视频播放器**
```typescript
// ✅ 正确 - 唯一允许使用的视频播放器
import RobustVideoPlayer from '@/components/video/RobustVideoPlayer';

// 或者
import { RobustVideoPlayer } from '@/components/video';
```

### **❌ 严禁使用的组件**
```typescript
// ❌ 已删除 - 严禁使用
// import SimpleVideoPlayerBasic from '@/components/SimpleVideoPlayerBasic';
// import CleanVideoPlayer from '@/components/CleanVideoPlayer';
// import UniversalVideoPlayer from '@/components/UniversalVideoPlayer';
// import SimpleVideoPlayer from '@/components/SimpleVideoPlayer';
// import VideoPlayer from '@/components/VideoPlayer';
```

### **标准用法**
```typescript
<RobustVideoPlayer
  src={videoUrl}
  poster={posterUrl}
  aspectRatio="auto" // 'landscape' | 'portrait' | 'square' | 'auto'
  controls={true}
  enableQualitySelector={false}
  onError={(error) => console.error('视频播放错误:', error)}
/>
```

---

## 🎨 **样式规范**

### **CSS Modules 优先**
```typescript
// ✅ 推荐 - 使用CSS Modules
import styles from './Component.module.css';

<div className={styles.container}>
  <div className={styles.content}>内容</div>
</div>
```

### **禁止全局样式污染**
```typescript
// ❌ 严禁 - 全局样式污染
<style jsx global>{`
  .video-js { /* 会影响其他组件 */ }
`}</style>

// ✅ 正确 - 局部样式
<style jsx>{`
  .local-style { /* 只影响当前组件 */ }
`}</style>
```

### **Tailwind CSS 使用规范**
```typescript
// ✅ 推荐 - 基础样式使用Tailwind
<div className="flex items-center justify-between p-4 bg-white rounded-lg">

// ❌ 避免 - 复杂样式用Tailwind会很长
<div className="absolute top-0 left-0 right-0 bottom-0 flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
```

---

## 📦 **组件设计规范**

### **组件结构模板**
```typescript
'use client';

import React, { useState, useEffect, useCallback } from 'react';
import styles from './Component.module.css';

export interface ComponentProps {
  /** 必需属性 */
  title: string;
  /** 可选属性 */
  description?: string;
  /** 回调函数 */
  onAction?: (data: any) => void;
  /** 错误处理 */
  onError?: (error: Error) => void;
}

/**
 * 组件描述
 * 
 * @param props - 组件属性
 * @returns JSX元素
 */
export default function Component({
  title,
  description,
  onAction,
  onError
}: ComponentProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // 错误处理
  const handleError = useCallback((err: Error) => {
    setError(err.message);
    onError?.(err);
  }, [onError]);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>{title}</h1>
      {description && <p className={styles.description}>{description}</p>}
      
      {/* 加载状态 */}
      {loading && <div className={styles.loading}>加载中...</div>}
      
      {/* 错误状态 */}
      {error && (
        <div className={styles.error}>
          <span>❌ {error}</span>
        </div>
      )}
    </div>
  );
}
```

### **必需的组件特性**
1. **TypeScript接口定义** - 所有props都要有类型
2. **错误处理** - 必须有onError回调
3. **加载状态** - 异步操作要有loading状态
4. **JSDoc注释** - 组件和复杂函数要有注释
5. **CSS Modules** - 样式隔离

---

## 🔧 **文件组织规范**

### **目录结构**
```
src/
├── components/
│   ├── ui/                    # shadcn/ui组件
│   ├── video/                 # 视频相关组件
│   │   ├── RobustVideoPlayer.tsx
│   │   ├── RobustVideoPlayer.module.css
│   │   └── index.ts
│   └── common/                # 通用组件
├── app/
│   ├── admin/                 # 管理后台
│   └── (public)/              # 公开页面
├── hooks/                     # 自定义hooks
├── services/                  # API服务
├── lib/                       # 工具函数
├── types/                     # 类型定义
└── styles/                    # 全局样式
```

### **文件命名规范**
- **组件文件**: `PascalCase.tsx` (如: `RobustVideoPlayer.tsx`)
- **CSS Modules**: `Component.module.css`
- **工具函数**: `kebab-case.ts` (如: `api-client.ts`)
- **类型文件**: `types.ts` 或 `Component.types.ts`
- **Hook文件**: `useHookName.ts` (如: `useVideoPlayer.ts`)

---

## 🎯 **API调用规范**

### **统一的API服务层**
```typescript
// services/media.service.ts
export class MediaService {
  static async getMedia(id: string): Promise<MediaResponse> {
    try {
      const response = await apiClient.get(`/media/${id}`);
      return response;
    } catch (error) {
      throw new Error(`获取媒体失败: ${error.message}`);
    }
  }
}
```

### **错误处理规范**
```typescript
// ✅ 推荐 - 统一错误处理
try {
  const data = await MediaService.getMedia(id);
  setData(data);
} catch (error) {
  handleError(error as Error);
}

// ❌ 避免 - 忽略错误
MediaService.getMedia(id).then(setData); // 没有错误处理
```

---

## 🧪 **测试规范**

### **组件测试模板**
```typescript
// Component.test.tsx
import { render, screen } from '@testing-library/react';
import Component from './Component';

describe('Component', () => {
  it('应该正确渲染', () => {
    render(<Component title="测试标题" />);
    expect(screen.getByText('测试标题')).toBeInTheDocument();
  });

  it('应该处理错误状态', () => {
    const onError = jest.fn();
    render(<Component title="测试" onError={onError} />);
    // 触发错误...
    expect(onError).toHaveBeenCalled();
  });
});
```

---

## 📝 **代码质量规范**

### **ESLint规则**
- **严格模式**: 启用所有推荐规则
- **TypeScript严格**: 禁止any类型（除非必要）
- **React Hooks**: 正确的依赖数组
- **导入顺序**: React > 第三方 > 本地

### **代码审查清单**
- [ ] TypeScript类型定义完整
- [ ] 错误处理完善
- [ ] 样式隔离（CSS Modules）
- [ ] 组件单一职责
- [ ] 性能优化（memo、useMemo、useCallback）
- [ ] 无console.log（生产环境）
- [ ] 测试覆盖率 > 80%

---

## 🚫 **严禁事项**

### **架构层面**
1. **禁止创建新的视频播放器组件**
2. **禁止使用全局样式修复组件问题**
3. **禁止绕过类型检查 (any类型)**
4. **禁止在根目录创建测试/文档文件**

### **代码层面**
1. **禁止使用var声明变量**
2. **禁止使用==进行比较**
3. **禁止忽略Promise错误**
4. **禁止直接修改props**

### **样式层面**
1. **禁止使用!important（除非必要）**
2. **禁止内联样式（除非动态）**
3. **禁止全局CSS选择器污染**

---

## ⚡ **性能优化规范**

### **React性能优化**
```typescript
// ✅ 使用React.memo避免不必要渲染
export default React.memo(Component, (prevProps, nextProps) => {
  return prevProps.id === nextProps.id;
});

// ✅ 使用useMemo缓存计算结果
const expensiveValue = useMemo(() => {
  return computeExpensiveValue(data);
}, [data]);

// ✅ 使用useCallback缓存函数
const handleClick = useCallback((id: string) => {
  onAction(id);
}, [onAction]);
```

### **图片和媒体优化**
```typescript
// ✅ 使用Next.js Image组件
import Image from 'next/image';

<Image
  src={imageUrl}
  alt="描述"
  width={800}
  height={600}
  placeholder="blur"
  loading="lazy"
/>
```

---

## 📊 **监控和调试规范**

### **错误监控**
```typescript
// 错误边界组件
class ErrorBoundary extends React.Component {
  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('组件错误:', error, errorInfo);
    // 上报到监控系统
  }
}
```

### **开发调试**
```typescript
// ✅ 开发环境调试
if (process.env.NODE_ENV === 'development') {
  console.log('调试信息:', data);
}

// ❌ 生产环境不要有console
console.log('这会出现在生产环境'); // 禁止
```

---

## 🔄 **版本控制规范**

### **提交信息格式**
```
type(scope): description

feat(video): 添加RobustVideoPlayer组件
fix(admin): 修复媒体管理页面样式问题
refactor(components): 删除旧的视频播放器组件
docs(readme): 更新开发规范文档
```

### **分支管理**
- `main` - 生产分支
- `develop` - 开发分支  
- `feature/xxx` - 功能分支
- `hotfix/xxx` - 紧急修复分支

---

## ✅ **代码审查清单**

### **提交前检查**
- [ ] TypeScript编译通过
- [ ] ESLint检查通过
- [ ] 测试用例通过
- [ ] 组件有适当的错误处理
- [ ] 样式使用CSS Modules隔离
- [ ] 没有使用已禁用的组件
- [ ] 性能优化合理
- [ ] 文档和注释完整

---

**记住：代码质量比开发速度更重要！宁可慢一点，也要写出健壮、可维护的代码。**
