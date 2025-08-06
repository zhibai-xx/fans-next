import { QueryClient } from '@tanstack/react-query';

// 创建全局的 QueryClient 实例
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // 数据认为是新鲜的时间（5分钟）
      staleTime: 5 * 60 * 1000,
      // 缓存时间（30分钟）
      gcTime: 30 * 60 * 1000,
      // 重试次数
      retry: (failureCount, error: any) => {
        // 4xx 错误不重试
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // 最多重试3次
        return failureCount < 3;
      },
      // 重试延迟
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
      // 窗口焦点时重新获取
      refetchOnWindowFocus: false,
      // 网络重连时重新获取
      refetchOnReconnect: true,
    },
    mutations: {
      // 变更重试次数
      retry: (failureCount, error: any) => {
        // 4xx 错误不重试
        if (error?.status >= 400 && error?.status < 500) {
          return false;
        }
        // 最多重试1次
        return failureCount < 1;
      },
    },
  },
});

// 查询键工厂 - 统一管理查询键
export const queryKeys = {
  // 用户相关
  users: {
    all: ['users'] as const,
    list: (filters?: any) => ['users', 'list', filters] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    stats: () => ['users', 'stats'] as const,
  },
  // 媒体相关  
  media: {
    all: ['media'] as const,
    list: (filters?: any, page?: number, limit?: number) => ['media', 'list', filters, page, limit] as const,
    detail: (id: string) => ['media', 'detail', id] as const,
    stats: () => ['media', 'stats'] as const,
  },
  // 管理面板相关
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => ['dashboard', 'stats'] as const,
    activities: () => ['dashboard', 'activities'] as const,
    systemStatus: () => ['dashboard', 'system-status'] as const,
  },
  // 标签和分类
  tags: {
    all: ['tags'] as const,
    list: () => ['tags', 'list'] as const,
    usage: () => ['tags', 'usage'] as const,
  },
  categories: {
    all: ['categories'] as const,
    list: () => ['categories', 'list'] as const,
    usage: () => ['categories', 'usage'] as const,
  },
  // 上传相关
  uploads: {
    all: ['uploads'] as const,
    records: (filters?: any) => ['uploads', 'records', filters] as const,
    stats: () => ['uploads', 'stats'] as const,
  },
  // 审核相关
  reviews: {
    all: ['reviews'] as const,
    list: (filters?: any) => ['reviews', 'list', filters] as const,
    stats: () => ['reviews', 'stats'] as const,
  },
  // 用户端媒体查询
  userMedia: {
    all: ['user-media'] as const,
    images: (filters?: any) => [...queryKeys.userMedia.all, 'images', filters] as const,
    videos: (filters?: any) => [...queryKeys.userMedia.all, 'videos', filters] as const,
    tags: () => [...queryKeys.userMedia.all, 'tags'] as const,
    categories: () => [...queryKeys.userMedia.all, 'categories'] as const,
  }
} as const;

// 查询客户端工具函数
export const queryUtils = {
  // 使所有查询失效
  invalidateAll: () => queryClient.invalidateQueries(),

  // 通用的查询失效方法
  invalidateQuery: (queryKey: readonly any[]) => queryClient.invalidateQueries({ queryKey }),

  // 使特定类型的查询失效
  invalidateUsers: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  invalidateMedia: () => queryClient.invalidateQueries({ queryKey: queryKeys.media.all }),
  invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  invalidateTags: () => queryClient.invalidateQueries({ queryKey: queryKeys.tags.all }),
  invalidateCategories: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
  invalidateUploads: () => queryClient.invalidateQueries({ queryKey: queryKeys.uploads.all }),
  invalidateReviews: () => queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all }),

  // 预取数据
  prefetchUsers: (filters?: any) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.list(filters),
      queryFn: () => { }, // 这里会在具体的hook中实现
    }),

  // 设置查询数据
  setQueryData: <T>(queryKey: any[], data: T) =>
    queryClient.setQueryData(queryKey, data),

  // 获取查询数据
  getQueryData: <T>(queryKey: any[]) =>
    queryClient.getQueryData<T>(queryKey),

  // 移除查询
  removeQueries: (queryKey: any[]) =>
    queryClient.removeQueries({ queryKey }),
};