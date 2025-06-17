import { apiClient } from '@/lib/api-client';

// 类型定义
export interface Media {
  id: string;
  title: string;
  description: string;
  url: string;
  type: 'image' | 'video';
  userId: string;
  createdAt: string;
  updatedAt: string;
  tags: { id: string; name: string }[];
  category?: { id: string; name: string };
}

export interface MediaCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  imageUrl?: string;
}

export interface MediaQueryParams {
  page?: number;
  limit?: number;
  type?: 'image' | 'video';
  userId?: string;
  categoryId?: string;
  tagId?: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Tag {
  id: string;
  name: string;
  created_at?: string;
  usage_count?: number;
}

/**
 * 媒体相关API服务
 */
export const mediaService = {
  /**
   * 上传图片
   */
  async uploadMedia(data: FormData) {
    return apiClient.post<{ file: Media }>('/media/upload', data, {
      customConfig: {
        headers: {
          Accept: 'application/json',
        },
      },
      withAuth: true,
    });
  },

  /**
   * 获取图片列表
   */
  async getImages(params?: MediaQueryParams) {
    return apiClient.get<{ images: Media[]; total: number; page: number; totalPages: number }>(
      '/media/images',
      { params }
    );
  },

  /**
   * 获取单个图片详情
   */
  async getMediaById(id: string) {
    return apiClient.get<{ media: Media }>(`/media/${id}`);
  },

  /**
   * 获取视频列表
   */
  async getVideos(params?: MediaQueryParams) {
    return apiClient.get<{ videos: Media[]; total: number; page: number; totalPages: number }>(
      '/media/videos',
      { params }
    );
  },

  /**
   * 获取媒体分类
   */
  getCategories: (type?: 'image' | 'video') => {
    const params: Record<string, string | number | boolean> | undefined =
      type ? { type } : undefined;

    return apiClient.get<{ categories: MediaCategory[] }>(
      '/media/categories',
      { params }
    );
  },

  /**
   * 获取热门标签
   */
  async getTags() {
    return apiClient.get<{ tags: Tag[] }>('/media/tags');
  },

  /**
   * 创建标签
   */
  async createTag(name: string) {
    return apiClient.post<{ tag: Tag }>('/media/tags', { name }, { withAuth: true });
  },

  /**
   * 搜索标签
   */
  async searchTags(query: string) {
    return apiClient.get<Tag[]>(`/media/tags/search/${encodeURIComponent(query)}`);
  },

  /**
   * 增加媒体的查看次数
   */
  async incrementViews(id: string, type: 'image' | 'video') {
    return apiClient.post<{ message: string }>(`/media/${id}/views`, { type });
  },

  /**
   * 删除媒体
   */
  async deleteMedia(id: string) {
    return apiClient.delete<{ message: string }>(`/media/${id}`);
  },
}; 