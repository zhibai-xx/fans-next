import { apiClient } from '@/lib/api-client';

// 类型定义
export interface UserProfile {
  id: number;
  uuid: string;
  username: string;
  nickname?: string;
  email: string;
  phoneNumber?: string;
  avatar_url?: string;
  role: 'USER' | 'ADMIN';
  status: 'ACTIVE' | 'SUSPENDED';
  created_at: string;
  updated_at: string;
}

export interface UpdateProfileRequest {
  nickname?: string;
  email?: string;
  phoneNumber?: string;
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
  media_id: string;
  media_type: 'IMAGE' | 'VIDEO';
  title: string;
  thumbnail_url?: string;
  file_size?: number;
  file_type?: string;
  downloaded_at: string;
  download_path: string;
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
    return apiClient.put<UserProfile>('/users/profile', data);
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
  getDownloads: (params: { page?: number; limit?: number } = {}) => {
    return apiClient.get<{ success: boolean; data: Download[]; pagination: { page: number; limit: number; total: number; totalPages: number } }>(
      '/user/downloads',
      { params }
    );
  },

  /**
   * 上传头像
   */
  uploadAvatar: (formData: FormData) => {
    return apiClient.post<UserProfile>('/users/profile/avatar', formData);
  },
};
