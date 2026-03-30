import { useQuery, useInfiniteQuery } from '@tanstack/react-query';
import type { UserFilters } from '@/services/admin-users.service';
import { userQueryOptions } from '@/hooks/queries/user-query-options';

// 获取用户列表（分页）
export const useUsers = (filters: UserFilters = {}, page = 1, limit = 24) => {
  return useQuery(userQueryOptions.list(filters, page, limit));
};

// 获取用户详情
export const useUser = (id: string, enabled = true) => {
  return useQuery({
    ...userQueryOptions.detail(id),
    enabled: enabled && !!id,
  });
};

// 获取用户统计数据
export const useUserStats = () => {
  return useQuery(userQueryOptions.stats());
};

// 无限滚动获取用户列表
export const useInfiniteUsers = (filters: UserFilters = {}, limit = 24) => {
  return useInfiniteQuery(userQueryOptions.infiniteList(filters, limit));
};

// 搜索用户（带防抖）
export const useUserSearch = (searchTerm: string, enabled = true) => {
  return useQuery({
    ...userQueryOptions.search(searchTerm),
    enabled: enabled && searchTerm.length >= 2, // 至少2个字符才搜索
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
