import { queryOptions } from '@tanstack/react-query';
import {
  AdminDashboardService,
  type DashboardStats,
  type RecentActivity,
  type SystemStatus,
} from '@/services/admin-dashboard.service';
import { queryKeys } from '@/lib/query-client';

const DASHBOARD_STATS_STALE_TIME = 2 * 60 * 1000;
const DASHBOARD_ACTIVITIES_STALE_TIME = 60 * 1000;
const DASHBOARD_SYSTEM_STALE_TIME = 30 * 1000;
const DASHBOARD_LITE_STALE_TIME = 5 * 60 * 1000;

const ensureData = <T>(
  response: { success: boolean; data?: T; message?: string },
  fallbackMessage: string,
): T => {
  if (!response.success || !response.data) {
    throw new Error(response.message || fallbackMessage);
  }

  return response.data;
};

export type DashboardStatsLite = {
  users: {
    total: number;
    new_today: number;
  };
  media: {
    total: number;
    pending: number;
  };
};

export const dashboardQueryOptions = {
  stats: () =>
    queryOptions({
      queryKey: queryKeys.dashboard.stats(),
      queryFn: async () =>
        ensureData(
          await AdminDashboardService.getDashboardStats(),
          '获取统计数据失败',
        ),
      staleTime: DASHBOARD_STATS_STALE_TIME,
      gcTime: 10 * 60 * 1000,
      refetchInterval: 5 * 60 * 1000,
      retry: 2,
    }),
  activities: () =>
    queryOptions({
      queryKey: queryKeys.dashboard.activities(),
      queryFn: async () =>
        ensureData(
          await AdminDashboardService.getRecentActivities(),
          '获取近期活动失败',
        ),
      staleTime: DASHBOARD_ACTIVITIES_STALE_TIME,
      gcTime: 5 * 60 * 1000,
      refetchInterval: 2 * 60 * 1000,
      retry: 1,
    }),
  systemStatus: () =>
    queryOptions({
      queryKey: queryKeys.dashboard.systemStatus(),
      queryFn: async () =>
        ensureData(
          await AdminDashboardService.getSystemStatus(),
          '获取系统状态失败',
        ),
      staleTime: DASHBOARD_SYSTEM_STALE_TIME,
      gcTime: 2 * 60 * 1000,
      refetchInterval: 60 * 1000,
      retry: 3,
    }),
  statsLite: () =>
    queryOptions({
      queryKey: queryKeys.dashboard.stats(),
      queryFn: async (): Promise<DashboardStatsLite> => {
        const data = ensureData(
          await AdminDashboardService.getDashboardStats(),
          '获取统计数据失败',
        );

        return {
          users: {
            total: data.users.total,
            new_today: data.users.new_today,
          },
          media: {
            total: data.media.total,
            pending: data.media.pending,
          },
        };
      },
      staleTime: DASHBOARD_LITE_STALE_TIME,
      gcTime: 15 * 60 * 1000,
    }),
};

export type DashboardStatsQueryData = DashboardStats;
export type RecentActivitiesQueryData = RecentActivity[];
export type SystemStatusQueryData = SystemStatus;
