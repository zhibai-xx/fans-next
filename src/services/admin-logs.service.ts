import { apiClient } from '@/lib/api-client';

// 类型定义
export interface OperationLog {
  id: string;
  operation_type: string;
  module: string;
  action: string;
  target_type: string;
  target_id?: string;
  target_name?: string;
  old_values?: any;
  new_values?: any;
  ip_address?: string;
  user_agent?: string;
  description?: string;
  result: string;
  error_message?: string;
  created_at: string;
  user: {
    id: number;
    username: string;
    nickname?: string;
    avatar_url?: string;
  };
}

export interface LoginLog {
  id: string;
  login_type: string;
  ip_address?: string;
  user_agent?: string;
  location?: string;
  result: string;
  fail_reason?: string;
  created_at: string;
  user?: {
    id: number;
    username: string;
    nickname?: string;
    avatar_url?: string;
  };
}

export interface OperationLogStats {
  totalOperations: number;
  successRate: number;
  operationsByType: Array<{
    type: string;
    count: number;
  }>;
  operationsByModule: Array<{
    module: string;
    count: number;
  }>;
  dailyStats: Array<{
    date: string;
    count: number;
  }>;
}

export interface LoginLogStats {
  totalLogins: number;
  successRate: number;
  loginsByType: Array<{
    type: string;
    count: number;
  }>;
  failureReasons: Array<{
    reason: string;
    count: number;
  }>;
  dailyStats: Array<{
    date: string;
    successful: number;
    failed: number;
  }>;
}

export interface UserActivityStats {
  userId: number;
  username: string;
  nickname?: string;
  totalOperations: number;
  totalLogins: number;
  lastActivity: string;
  operationsByType: Array<{
    type: string;
    count: number;
  }>;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
}

export interface LogFilters {
  operation_type?: string;
  module?: string;
  action?: string;
  result?: string;
  user_id?: number;
  start_date?: string;
  end_date?: string;
}

export interface LoginLogFilters {
  login_type?: string;
  result?: string;
  user_id?: number;
  ip_address?: string;
  start_date?: string;
  end_date?: string;
}

export class AdminLogsService {
  /**
   * 获取操作日志列表
   */
  static async getOperationLogs(
    filters: LogFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<OperationLog>> {
    const params = {
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    };

    const response = await apiClient.get('/admin/logs/operations', { params });
    return response.data;
  }

  /**
   * 获取操作日志统计
   */
  static async getOperationStats(days: number = 30): Promise<ApiResponse<OperationLogStats>> {
    const response = await apiClient.get(`/admin/logs/operations/stats?days=${days}`);
    return response.data;
  }

  /**
   * 获取登录日志列表
   */
  static async getLoginLogs(
    filters: LoginLogFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<LoginLog>> {
    const params = {
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    };

    const response = await apiClient.get('/admin/logs/logins', { params });
    return response.data;
  }

  /**
   * 获取登录日志统计
   */
  static async getLoginStats(days: number = 30): Promise<ApiResponse<LoginLogStats>> {
    const response = await apiClient.get(`/admin/logs/logins/stats?days=${days}`);
    return response.data;
  }

  /**
   * 获取用户活跃度统计
   */
  static async getUserActivityStats(
    page: number = 1,
    limit: number = 20,
    days: number = 7
  ): Promise<PaginatedResponse<UserActivityStats>> {
    const params = {
      page: page.toString(),
      limit: limit.toString(),
      days: days.toString()
    };

    const response = await apiClient.get('/admin/logs/users/activity', { params });
    return response.data;
  }
}