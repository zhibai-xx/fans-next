import { QueryClient, type DefaultOptions, type QueryKey } from '@tanstack/react-query';

type QueryFilters = object;
type RecycleListParams = {
  page?: number;
  limit?: number;
  search?: string;
};

const STALE_TIME_MAP: Record<string, number> = {
  user: 10 * 60 * 1000,
  media: 2 * 60 * 1000,
  interactions: 30 * 1000,
  stats: 5 * 60 * 1000,
};

const getPrimaryKey = (queryKey: QueryKey): string => {
  const first = queryKey?.[0];
  return typeof first === 'string' ? first : 'default';
};

const resolveCacheTime = (queryKey: QueryKey, map: Record<string, number>, fallback: number): number => {
  const key = getPrimaryKey(queryKey);
  return map[key] ?? fallback;
};

const isClientError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'status' in error) {
    const status = (error as { status?: number }).status;
    return typeof status === 'number' && status >= 400 && status < 500;
  }
  return false;
};

const defaultOptions: DefaultOptions = {
  queries: {
    staleTime: ({ queryKey }) => resolveCacheTime(queryKey, STALE_TIME_MAP, 60 * 1000),
    gcTime: 10 * 60 * 1000,
    retry: (failureCount, error) => {
      if (isClientError(error)) {
        return false;
      }
      return failureCount < 3;
    },
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    refetchOnWindowFocus: false,
    refetchOnReconnect: true,
  },
  mutations: {
    retry: (failureCount, error) => {
      if (isClientError(error)) {
        return false;
      }
      return failureCount < 1;
    },
  },
};

// 创建全局的 QueryClient 实例
export const queryClient = new QueryClient({
  defaultOptions,
});

// 查询键工厂 - 统一管理查询键
export const queryKeys = {
  // 用户相关
  users: {
    all: ['users'] as const,
    list: (filters?: QueryFilters) => ['users', 'list', filters ?? null] as const,
    detail: (id: string) => ['users', 'detail', id] as const,
    stats: () => ['users', 'stats'] as const,
  },
  // 媒体相关
  media: {
    all: ['media'] as const,
    list: (filters?: QueryFilters, page?: number, limit?: number) => ['media', 'list', filters ?? null, page ?? null, limit ?? null] as const,
    detail: (id: string) => ['media', 'detail', id] as const,
    stats: () => ['media', 'stats'] as const,
  },
  recycle: {
    all: ['recycle'] as const,
    list: (params?: RecycleListParams) => ['recycle', 'list', params ?? null] as const,
    pending: (limit?: number) => ['recycle', 'pending', limit ?? null] as const,
  },
  // 管理面板相关
  dashboard: {
    all: ['dashboard'] as const,
    stats: () => ['dashboard', 'stats'] as const,
    activities: () => ['dashboard', 'activities'] as const,
    systemStatus: () => ['dashboard', 'system-status'] as const,
  },
  logs: {
    all: ['logs'] as const,
    operations: (filters?: QueryFilters, page?: number, limit?: number) =>
      ['logs', 'operations', filters ?? null, page ?? null, limit ?? null] as const,
    operationStats: (days: number = 30) => ['logs', 'operations', 'stats', days] as const,
    logins: (filters?: QueryFilters, page?: number, limit?: number) =>
      ['logs', 'logins', filters ?? null, page ?? null, limit ?? null] as const,
    loginStats: (days: number = 30) => ['logs', 'logins', 'stats', days] as const,
    userActivity: (page?: number, limit?: number, days?: number) =>
      ['logs', 'user-activity', page ?? null, limit ?? null, days ?? null] as const,
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
    records: (filters?: QueryFilters) => ['uploads', 'records', filters ?? null] as const,
    stats: () => ['uploads', 'stats'] as const,
  },
  // 审核相关
  reviews: {
    all: ['reviews'] as const,
    list: (filters?: QueryFilters) => ['reviews', 'list', filters ?? null] as const,
    stats: () => ['reviews', 'stats'] as const,
  },
  // 用户端媒体查询
  userMedia: {
    all: ['user-media'] as const,
    images: (filters?: QueryFilters) => [...queryKeys.userMedia.all, 'images', filters ?? null] as const,
    videos: (filters?: QueryFilters) => [...queryKeys.userMedia.all, 'videos', filters ?? null] as const,
    tags: () => [...queryKeys.userMedia.all, 'tags'] as const,
    categories: () => [...queryKeys.userMedia.all, 'categories'] as const,
  }
} as const;

// 查询客户端工具函数
export const queryUtils = {
  // 使所有查询失效
  invalidateAll: () => queryClient.invalidateQueries(),

  // 通用的查询失效方法
  invalidateQuery: (queryKey: QueryKey) => queryClient.invalidateQueries({ queryKey }),

  // 使特定类型的查询失效
  invalidateUsers: () => queryClient.invalidateQueries({ queryKey: queryKeys.users.all }),
  invalidateMedia: () => queryClient.invalidateQueries({ queryKey: queryKeys.media.all }),
  invalidateRecycle: () => queryClient.invalidateQueries({ queryKey: queryKeys.recycle.all }),
  invalidateDashboard: () => queryClient.invalidateQueries({ queryKey: queryKeys.dashboard.all }),
  invalidateLogs: () => queryClient.invalidateQueries({ queryKey: queryKeys.logs.all }),
  invalidateTags: () => queryClient.invalidateQueries({ queryKey: queryKeys.tags.all }),
  invalidateCategories: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories.all }),
  invalidateUploads: () => queryClient.invalidateQueries({ queryKey: queryKeys.uploads.all }),
  invalidateReviews: () => queryClient.invalidateQueries({ queryKey: queryKeys.reviews.all }),

  // 预取数据
  prefetchUsers: (filters?: QueryFilters) =>
    queryClient.prefetchQuery({
      queryKey: queryKeys.users.list(filters),
      queryFn: async () => undefined, // 这里会在具体的hook中实现
    }),

  // 设置查询数据
  setQueryData: <T>(queryKey: QueryKey, data: T) =>
    queryClient.setQueryData(queryKey, data),

  // 获取查询数据
  getQueryData: <T>(queryKey: QueryKey) =>
    queryClient.getQueryData<T>(queryKey),

  // 移除查询
  removeQueries: (queryKey: QueryKey) =>
    queryClient.removeQueries({ queryKey }),
};
