import { apiClient } from '@/lib/api-client';

// 类型定义
export interface UserProfile {
  id: string;
  username: string;
  nickname?: string;
  email?: string;
  phoneNumber?: string;
  avatar?: string;
  avatar_url?: string;
  // bio?: string;
  created_at: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  email?: string;
  phoneNumber?: string;
  // bio?: string;
  avatar?: string;
}

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export interface Favorite {
  id: string;
  type: 'image' | 'video' | 'post';
  title: string;
  description?: string;
  thumbnail?: string;
  url?: string;
  addedAt: string;
}

export interface Download {
  id: string;
  type: 'image' | 'video' | 'document';
  title: string;
  fileSize: string;
  downloadedAt: string;
  url?: string;
}

/**
 * 用户相关API服务
 */
export const userService = {
  /**
   * 获取用户个人资料
   */
  getProfile: () => {
    return apiClient.get<UserProfile>('/users/profile');
  },

  /**
   * 更新用户个人资料
   */
  updateProfile: (data: UpdateProfileRequest) => {
    return apiClient.put<{ user: UserProfile }>('/users/profile', data);
  },

  /**
   * 修改码密
   */
  changePassword: (data: ChangePasswordRequest) => {
    return apiClient.put<{ message: string }>('/users/change-password', data);
  },

  /**
   * 获取收藏列表
   */
  getFavorites: () => {
    return apiClient.get<{ favorites: Favorite[] }>('/user/favorites');
  },

  /**
   * 添加收藏
   */
  addFavorite: (itemId: string, type: 'image' | 'video' | 'post') => {
    return apiClient.post<{ message: string }>('/user/favorites', { itemId, type });
  },

  /**
   * 删除收藏
   */
  removeFavorite: (id: string) => {
    return apiClient.delete<{ message: string }>(`/user/favorites/${id}`);
  },

  /**
   * 获取下载记录
   */
  getDownloads: () => {
    return apiClient.get<{ downloads: Download[] }>('/user/downloads');
  },
}; 