# 现代化缓存策略指南

## 🎯 核心原则

**用户不应该知道缓存的存在** - 缓存管理完全自动化，用户只需关心业务功能。

## 🏗️ 主流解决方案

### 1. **Mutation后自动失效 (TanStack Query标准)**

```typescript
// ✅ 正确做法：每个mutation后自动invalidate相关查询
export function useDeleteMediaMutation() {
  return useMutation({
    mutationFn: deleteMedia,
    onSuccess: () => {
      // 自动使相关缓存失效
      queryClient.invalidateQueries({ queryKey: ['media'] });
      queryClient.invalidateQueries({ queryKey: ['images'] }); 
      queryClient.invalidateQueries({ queryKey: ['videos'] });
    }
  });
}
```

### 2. **乐观更新 (Optimistic Updates)**

```typescript
// 立即更新UI，失败时回滚
export function useLikeMediaMutation() {
  return useMutation({
    mutationFn: likeMedia,
    onMutate: async (mediaId) => {
      // 立即更新UI
      queryClient.setQueryData(['media', mediaId], old => ({
        ...old,
        likes_count: old.likes_count + 1,
        is_liked: true
      }));
    },
    onError: (err, mediaId, context) => {
      // 失败时回滚
      queryClient.setQueryData(['media', mediaId], context.previousData);
    }
  });
}
```

### 3. **实时数据同步**

#### Option A: WebSocket (实时性要求高)
```typescript
// WebSocket连接，监听数据变更
useEffect(() => {
  const ws = new WebSocket('ws://localhost:3001/ws');
  ws.onmessage = (event) => {
    const { type, data } = JSON.parse(event.data);
    if (type === 'media_updated') {
      queryClient.invalidateQueries({ queryKey: ['media'] });
    }
  };
}, []);
```

#### Option B: Server-Sent Events (轻量级)
```typescript
// SSE监听服务器推送
useEffect(() => {
  const eventSource = new EventSource('/api/events');
  eventSource.addEventListener('media_change', () => {
    queryClient.invalidateQueries({ queryKey: ['media'] });
  });
}, []);
```

#### Option C: 智能轮询 (简单有效)
```typescript
// 对重要数据进行定期轮询
export const useMediaWithPolling = () => {
  return useQuery({
    queryKey: ['media'],
    queryFn: fetchMedia,
    refetchInterval: 30000, // 30秒轮询
    refetchIntervalInBackground: false, // 页面不可见时停止轮询
  });
};
```

### 4. **基于活动的缓存策略**

```typescript
// 不同类型数据使用不同的缓存策略
const getCacheConfig = (dataType: string) => {
  const configs = {
    // 用户数据：缓存时间长，变化不频繁
    user: { staleTime: 10 * 60 * 1000, gcTime: 60 * 60 * 1000 },
    
    // 媒体数据：中等缓存，需要一定实时性
    media: { staleTime: 2 * 60 * 1000, gcTime: 10 * 60 * 1000 },
    
    // 互动数据：短缓存，高实时性要求
    interactions: { staleTime: 30 * 1000, gcTime: 5 * 60 * 1000 },
    
    // 统计数据：可以接受一定延迟
    stats: { staleTime: 5 * 60 * 1000, gcTime: 30 * 60 * 1000 }
  };
  
  return configs[dataType] || configs.media;
};
```

## 🔧 实施建议

### 立即实施 (Phase 1)
1. ✅ **完善Mutation失效机制** - 确保所有CUD操作后自动invalidate
2. ✅ **优化缓存时间** - 根据数据特性设置合理的staleTime
3. ✅ **添加乐观更新** - 对用户交互频繁的操作(点赞、收藏)

### 中期实施 (Phase 2) 
4. 🔄 **添加轮询机制** - 对关键页面数据进行智能轮询
5. 🔄 **实现SSE** - 服务器主动推送数据变更通知

### 长期实施 (Phase 3)
6. 🚀 **WebSocket实时同步** - 实现真正的实时数据同步
7. 🚀 **离线支持** - PWA + 离线数据同步

## ❌ 避免的反模式

- ❌ 让用户手动刷新/清缓存
- ❌ 在UI中暴露"缓存"概念  
- ❌ 长期缓存频繁变化的数据
- ❌ 不区分数据类型使用统一缓存策略
- ❌ 忘记在mutation后invalidate相关查询

## 🎯 目标效果

用户体验：
- 操作立即响应（乐观更新）
- 数据自动保持最新（智能失效）
- 无需手动刷新页面
- 完全不感知缓存存在
