import { apiClient } from '@/lib/api-client';

// 请求/响应类型定义
export interface LoginRequest {
  username: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
  nickname?: string;
}

export interface AuthResponse {
  user: {
    uuid: string;
    username: string;
    email: string;
    nickname?: string;
    avatar_url?: string;
    phoneNumber?: string;
    role: string;
    status: string;
    created_at: string;
    updated_at: string;
  };
  access_token: string;
}

/**
 * 身份验证相关API服务
 */
export const authService = {
  /**
   * 用户登录
   */
  login: (data: LoginRequest) => {
    return apiClient.post<AuthResponse>('/users/login', data, { withAuth: false });
  },

  /**
   * 用户注册
   */
  register: (data: RegisterRequest) => {
    return apiClient.post<AuthResponse>('/users/register', data, { withAuth: false });
  },

  /**
   * 刷新令牌
   */
  refreshToken: () => {
    return apiClient.post<{ access_token: string }>('/users/refresh-token');
  },

  /**
   * 请求密码重置
   */
  forgotPassword: (email: string) => {
    return apiClient.post<{ message: string }>('/users/forgot-password', { email }, { withAuth: false });
  },

  /**
   * 重置密码
   */
  resetPassword: (token: string, password: string) => {
    return apiClient.post<{ message: string }>(
      '/users/reset-password',
      { token, password },
      { withAuth: false }
    );
  }
}; 