import { useQuery } from '@tanstack/react-query';
import { dashboardQueryOptions } from '@/hooks/queries/dashboard-query-options';

// 获取管理面板统计数据
export const useDashboardStats = () => {
  return useQuery(dashboardQueryOptions.stats());
};

// 获取近期活动
export const useRecentActivities = () => {
  return useQuery(dashboardQueryOptions.activities());
};

// 获取系统状态
export const useSystemStatus = () => {
  return useQuery(dashboardQueryOptions.systemStatus());
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
  return useQuery(dashboardQueryOptions.statsLite());
};
