import { useQuery } from '@tanstack/react-query';
import type { LoginLogFilters, LogFilters } from '@/services/admin-logs.service';
import { logQueryOptions } from '@/hooks/queries/log-query-options';

export const useOperationLogs = (filters: LogFilters = {}, page: number = 1, limit: number = 20) => {
  return useQuery(logQueryOptions.operationLogs(filters, page, limit));
};

export const useOperationLogStats = (days: number = 30) => {
  return useQuery(logQueryOptions.operationStats(days));
};

export const useLoginLogs = (filters: LoginLogFilters = {}, page: number = 1, limit: number = 20) => {
  return useQuery(logQueryOptions.loginLogs(filters, page, limit));
};

export const useLoginLogStats = (days: number = 30) => {
  return useQuery(logQueryOptions.loginStats(days));
};
