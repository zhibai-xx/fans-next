import { queryOptions } from '@tanstack/react-query';
import {
  AdminLogsService,
  type ApiResponse,
  type LoginLog,
  type LoginLogFilters,
  type LoginLogStats,
  type LogFilters,
  type OperationLog,
  type OperationLogStats,
  type PaginatedResponse,
} from '@/services/admin-logs.service';
import { queryKeys } from '@/lib/query-client';

const LOG_LIST_STALE_TIME = 60 * 1000;
const LOG_STATS_STALE_TIME = 5 * 60 * 1000;

const normalizePaginatedResponse = <T>(
  response: PaginatedResponse<T> | T[],
  page: number,
  limit: number,
): PaginatedResponse<T> => {
  if (Array.isArray(response)) {
    return {
      data: response,
      pagination: {
        page,
        limit,
        total: response.length,
        totalPages: 1,
      },
    };
  }

  return response;
};

const ensureSuccessData = <T>(response: ApiResponse<T>, fallbackMessage: string): T => {
  if (!response.success || !response.data) {
    throw new Error(response.message || fallbackMessage);
  }

  return response.data;
};

export const logQueryOptions = {
  operationLogs: (filters: LogFilters = {}, page: number = 1, limit: number = 20) =>
    queryOptions({
      queryKey: queryKeys.logs.operations(filters, page, limit),
      queryFn: async () =>
        normalizePaginatedResponse(
          await AdminLogsService.getOperationLogs(filters, page, limit),
          page,
          limit,
        ),
      staleTime: LOG_LIST_STALE_TIME,
      placeholderData: (previousData: PaginatedResponse<OperationLog> | undefined) => previousData,
    }),
  operationStats: (days: number = 30) =>
    queryOptions({
      queryKey: queryKeys.logs.operationStats(days),
      queryFn: async () =>
        ensureSuccessData(
          await AdminLogsService.getOperationStats(days),
          '获取操作日志统计失败',
        ),
      staleTime: LOG_STATS_STALE_TIME,
    }),
  loginLogs: (filters: LoginLogFilters = {}, page: number = 1, limit: number = 20) =>
    queryOptions({
      queryKey: queryKeys.logs.logins(filters, page, limit),
      queryFn: async () =>
        normalizePaginatedResponse(
          await AdminLogsService.getLoginLogs(filters, page, limit),
          page,
          limit,
        ),
      staleTime: LOG_LIST_STALE_TIME,
      placeholderData: (previousData: PaginatedResponse<LoginLog> | undefined) => previousData,
    }),
  loginStats: (days: number = 30) =>
    queryOptions({
      queryKey: queryKeys.logs.loginStats(days),
      queryFn: async () =>
        ensureSuccessData(
          await AdminLogsService.getLoginStats(days),
          '获取登录日志统计失败',
        ),
      staleTime: LOG_STATS_STALE_TIME,
    }),
};

export type OperationLogsQueryData = PaginatedResponse<OperationLog>;
export type OperationLogStatsQueryData = OperationLogStats;
export type LoginLogsQueryData = PaginatedResponse<LoginLog>;
export type LoginLogStatsQueryData = LoginLogStats;
