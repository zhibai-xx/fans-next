import { useQuery } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-client';
import { AdminDashboardService, DashboardStats, RecentActivity, SystemStatus } from '@/services/admin-dashboard.service';

// 获取管理面板统计数据
export const useDashboardStats = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      const response = await AdminDashboardService.getDashboardStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || '获取统计数据失败');
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2分钟内数据新鲜
    gcTime: 10 * 60 * 1000,   // 10分钟缓存
    refetchInterval: 5 * 60 * 1000, // 每5分钟自动刷新
    retry: 2,
  });
};

// 获取近期活动
export const useRecentActivities = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.activities(),
    queryFn: async () => {
      const response = await AdminDashboardService.getRecentActivities();
      if (!response.success || !response.data) {
        throw new Error(response.message || '获取近期活动失败');
      }
      return response.data;
    },
    staleTime: 1 * 60 * 1000,   // 1分钟内数据新鲜
    gcTime: 5 * 60 * 1000,     // 5分钟缓存
    refetchInterval: 2 * 60 * 1000, // 每2分钟自动刷新
    retry: 1,
  });
};

// 获取系统状态
export const useSystemStatus = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.systemStatus(),
    queryFn: async () => {
      const response = await AdminDashboardService.getSystemStatus();
      if (!response.success || !response.data) {
        throw new Error(response.message || '获取系统状态失败');
      }
      return response.data;
    },
    staleTime: 30 * 1000,      // 30秒内数据新鲜
    gcTime: 2 * 60 * 1000,     // 2分钟缓存
    refetchInterval: 60 * 1000, // 每分钟自动刷新
    retry: 3,
  });
};

// 组合 hook - 获取完整的管理面板数据
export const useDashboardData = () => {
  const statsQuery = useDashboardStats();
  const activitiesQuery = useRecentActivities();
  const systemStatusQuery = useSystemStatus();

  return {
    // 数据
    stats: statsQuery.data,
    activities: activitiesQuery.data,
    systemStatus: systemStatusQuery.data,

    // 加载状态
    isLoading: statsQuery.isLoading || activitiesQuery.isLoading,
    isInitialLoading: statsQuery.isLoading && activitiesQuery.isLoading,

    // 错误状态
    error: statsQuery.error || activitiesQuery.error || systemStatusQuery.error,
    hasError: statsQuery.isError || activitiesQuery.isError || systemStatusQuery.isError,

    // 刷新操作
    refetch: () => Promise.all([
      statsQuery.refetch(),
      activitiesQuery.refetch(),
      systemStatusQuery.refetch(),
    ]),

    // 各个查询的独立状态
    queries: {
      stats: statsQuery,
      activities: activitiesQuery,
      systemStatus: systemStatusQuery,
    },
  };
};

// 轻量版 hook - 只获取基础统计数据（用于导航栏等场景）
export const useDashboardStatsLite = () => {
  return useQuery({
    queryKey: queryKeys.dashboard.stats(),
    queryFn: async () => {
      const response = await AdminDashboardService.getDashboardStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || '获取统计数据失败');
      }
      // 只返回关键指标
      return {
        users: {
          total: response.data.users.total,
          new_today: response.data.users.new_today,
        },
        media: {
          total: response.data.media.total,
          pending: response.data.media.pending,
        },
      };
    },
    staleTime: 5 * 60 * 1000,   // 5分钟内数据新鲜
    gcTime: 15 * 60 * 1000,     // 15分钟缓存
    select: (data) => data,      // 可以进一步筛选数据
  });
};