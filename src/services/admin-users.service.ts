import { apiClient } from '@/lib/api-client';

export interface User {
  id: number;
  uuid: string;
  username: string;
  email: string;
  nickname?: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  phoneNumber?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
  _count?: {
    uploaded_media: number;
    comments: number;
    favorites: number;
    operation_logs?: number;
    login_logs?: number;
  };
}

export interface UserFilters {
  search?: string;
  role?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: string;
}

export interface PaginatedResponse<T> {
  success: boolean;
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
  data?: T;
  message?: string;
}

export interface UserStats {
  totalUsers: number;
  activeUsers: number;
  suspendedUsers: number;
  adminUsers: number;
  regularUsers: number;
  recentUsers: number;
  statusDistribution: {
    active: number;
    suspended: number;
  };
  roleDistribution: {
    admin: number;
    user: number;
  };
}

export class AdminUsersService {
  /**
   * 获取用户列表
   */
  static async getUsers(
    filters: UserFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<User>> {
    const params = {
      page: page.toString(),
      limit: limit.toString(),
      ...Object.fromEntries(
        Object.entries(filters).filter(([_, value]) => value !== undefined && value !== '')
      )
    };

    const response = await apiClient.get('/admin/users', { params });
    return response;
  }

  /**
   * 获取用户详情
   */
  static async getUserById(id: number): Promise<ApiResponse<User>> {
    const response = await apiClient.get(`/admin/users/${id}`);
    return response;
  }

  /**
   * 更新用户状态
   */
  static async updateUserStatus(
    id: number,
    status: 'ACTIVE' | 'SUSPENDED'
  ): Promise<ApiResponse<User>> {
    const response = await apiClient.put(`/admin/users/${id}/status`, { status });
    return response;
  }

  /**
   * 更新用户角色
   */
  static async updateUserRole(
    id: number,
    role: 'USER' | 'ADMIN'
  ): Promise<ApiResponse<User>> {
    const response = await apiClient.put(`/admin/users/${id}/role`, { role });
    return response;
  }

  /**
   * 更新用户基本信息
   */
  static async updateUser(
    id: number,
    updateData: {
      username?: string;
      email?: string;
      nickname?: string;
      phoneNumber?: string;
    }
  ): Promise<ApiResponse<User>> {
    const response = await apiClient.put(`/admin/users/${id}`, updateData);
    return response;
  }

  /**
   * 获取用户统计概览
   */
  static async getUserStats(): Promise<ApiResponse<UserStats>> {
    const response = await apiClient.get('/admin/users/stats/overview');
    return response;
  }
}