import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { AdminUsersService, User, UserFilters, PaginatedResponse } from '@/services/admin-users.service';

// 获取用户列表（分页）
export const useUsers = (filters: UserFilters = {}, page = 1, limit = 24) => {
  return useQuery({
    queryKey: queryKeys.users.list({ ...filters, page, limit }),
    queryFn: async () => {
      const response = await AdminUsersService.getUsers(filters, page, limit);
      if (!response.success) {
        throw new Error(response.message || '获取用户列表失败');
      }
      return response;
    },
    staleTime: 2 * 60 * 1000,  // 2分钟内数据新鲜
    gcTime: 10 * 60 * 1000,    // 10分钟缓存
    placeholderData: (previousData) => previousData, // 保持之前的数据显示
  });
};

// 获取用户详情
export const useUser = (id: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.users.detail(id),
    queryFn: async () => {
      const response = await AdminUsersService.getUserById(id);
      if (!response.success || !response.data) {
        throw new Error(response.message || '获取用户详情失败');
      }
      return response.data;
    },
    enabled: enabled && !!id,
    staleTime: 5 * 60 * 1000,  // 5分钟内数据新鲜
    gcTime: 15 * 60 * 1000,    // 15分钟缓存
  });
};

// 获取用户统计数据
export const useUserStats = () => {
  return useQuery({
    queryKey: queryKeys.users.stats(),
    queryFn: async () => {
      const response = await AdminUsersService.getUserStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || '获取用户统计失败');
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000,     // 5分钟内数据新鲜
    gcTime: 30 * 60 * 1000,       // 30分钟缓存
    refetchInterval: 10 * 60 * 1000, // 每10分钟自动刷新
  });
};

// 无限滚动获取用户列表
export const useInfiniteUsers = (filters: UserFilters = {}, limit = 24) => {
  return useInfiniteQuery({
    queryKey: queryKeys.users.list({ ...filters, infinite: true }),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await AdminUsersService.getUsers(filters, pageParam, limit);
      if (!response.success) {
        throw new Error(response.message || '获取用户列表失败');
      }
      return response;
    },
    getNextPageParam: (lastPage) => {
      if (!lastPage.pagination) return undefined;
      const { page, totalPages } = lastPage.pagination;
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 2 * 60 * 1000,  // 2分钟内数据新鲜
    gcTime: 10 * 60 * 1000,    // 10分钟缓存
  });
};

// 搜索用户（带防抖）
export const useUserSearch = (searchTerm: string, enabled = true) => {
  return useQuery({
    queryKey: queryKeys.users.list({ search: searchTerm }),
    queryFn: async () => {
      if (!searchTerm.trim()) {
        return { success: true, data: [], pagination: null };
      }

      const response = await AdminUsersService.getUsers(
        { search: searchTerm },
        1,
        20 // 搜索结果限制为20条
      );
      if (!response.success) {
        throw new Error(response.message || '搜索用户失败');
      }
      return response;
    },
    enabled: enabled && searchTerm.length >= 2, // 至少2个字符才搜索
    staleTime: 30 * 1000,     // 30秒内数据新鲜
    gcTime: 2 * 60 * 1000,    // 2分钟缓存
  });
};

// 组合 hook - 用户管理页面的完整数据
export const useUserManagement = (filters: UserFilters, page: number, limit: number) => {
  const usersQuery = useUsers(filters, page, limit);
  const statsQuery = useUserStats();

  return {
    // 数据
    users: usersQuery.data?.data || [],
    pagination: usersQuery.data?.pagination || null,
    stats: statsQuery.data,

    // 加载状态
    isLoading: usersQuery.isLoading,
    isStatsLoading: statsQuery.isLoading,
    isInitialLoading: usersQuery.isLoading && usersQuery.isPlaceholderData,

    // 错误状态
    error: usersQuery.error || statsQuery.error,
    hasError: usersQuery.isError || statsQuery.isError,

    // 刷新操作
    refetch: () => Promise.all([usersQuery.refetch(), statsQuery.refetch()]),
    refetchUsers: usersQuery.refetch,
    refetchStats: statsQuery.refetch,

    // 查询状态
    queries: {
      users: usersQuery,
      stats: statsQuery,
    },
  };
};

// 用户状态选项
export const useUserStatusOptions = () => {
  return [
    { value: 'all', label: '全部状态' },
    { value: 'ACTIVE', label: '活跃' },
    { value: 'SUSPENDED', label: '暂停' },
  ];
};

// 用户角色选项
export const useUserRoleOptions = () => {
  return [
    { value: 'all', label: '全部角色' },
    { value: 'USER', label: '普通用户' },
    { value: 'ADMIN', label: '管理员' },
  ];
};