import { apiClient } from '@/lib/api-client';

export interface MediaUser {
  uuid: string;
  username: string;
  avatar_url?: string;
}

export interface MediaTag {
  id: string;
  name: string;
}

export interface MediaCategory {
  id: string;
  name: string;
  description?: string;
}

export interface MediaItem {
  id: string;
  title: string;
  description?: string;
  url: string;
  thumbnail_url?: string;
  size: number;
  media_type: 'IMAGE' | 'VIDEO';
  duration?: number;
  width?: number;
  height?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PRIVATE';
  views: number;
  likes_count: number;
  favorites_count: number;
  source: string;
  original_created_at?: string;
  source_metadata?: any;
  created_at: string;
  updated_at: string;
  user: MediaUser;
  category?: MediaCategory;
  tags: MediaTag[];
}

export interface MediaListResponse {
  data: MediaItem[];
  meta: {
    total: number;
    skip: number;
    take: number;
    hasMore: boolean;
  };
}

export interface MediaFilters {
  type?: 'IMAGE' | 'VIDEO';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PRIVATE';
  userUuid?: string;
  categoryId?: string;
  tagId?: string;
  search?: string;
  sortBy?: 'created_at' | 'views' | 'likes_count';
  sortOrder?: 'asc' | 'desc';
}

export class MediaService {
  /**
   * 获取媒体列表
   */
  static async getMediaList(params: {
    skip?: number;
    take?: number;
    filters?: MediaFilters;
  } = {}): Promise<MediaListResponse> {
    const { skip = 0, take = 24, filters = {} } = params;

    try {
      const queryParams = new URLSearchParams();
      queryParams.set('skip', skip.toString());
      queryParams.set('take', take.toString());

      // 添加筛选参数
      if (filters.type) queryParams.set('type', filters.type);
      if (filters.status) queryParams.set('status', filters.status);
      if (filters.userUuid) queryParams.set('userUuid', filters.userUuid);
      if (filters.categoryId) queryParams.set('categoryId', filters.categoryId);
      if (filters.tagId) queryParams.set('tagId', filters.tagId);
      if (filters.search) queryParams.set('search', filters.search);
      if (filters.sortBy) queryParams.set('sortBy', filters.sortBy);
      if (filters.sortOrder) queryParams.set('sortOrder', filters.sortOrder);

      console.log('正在获取媒体列表:', queryParams.toString());

      const response = await apiClient.get<MediaListResponse>(`/media?${queryParams.toString()}`, {
        withAuth: false // 媒体列表可以不需要认证
      });

      console.log('获取媒体列表成功:', response);
      return response;
    } catch (error) {
      console.error('获取媒体列表失败:', error);
      throw new Error('获取媒体列表失败');
    }
  }

  /**
   * 获取媒体详情
   */
  static async getMediaById(id: string): Promise<MediaItem> {
    try {
      const response = await apiClient.get<MediaItem>(`/media/${id}`, {
        withAuth: false
      });
      return response;
    } catch (error) {
      console.error('获取媒体详情失败:', error);
      throw new Error('获取媒体详情失败');
    }
  }

  /**
   * 获取所有标签
   */
  static async getAllTags(): Promise<{ tags: MediaTag[] }> {
    try {
      const response = await apiClient.get<{ tags: MediaTag[] }>('/media/tags', {
        withAuth: false
      });
      console.log('获取标签成功:', response);
      return response;
    } catch (error) {
      console.error('获取标签失败:', error);
      // 返回空标签数组而不是抛出错误
      return { tags: [] };
    }
  }

  /**
   * 获取所有分类
   */
  static async getAllCategories(): Promise<{ categories: MediaCategory[] }> {
    try {
      const response = await apiClient.get<{ categories: MediaCategory[] }>('/media/categories', {
        withAuth: false
      });
      console.log('获取分类成功:', response);
      return response;
    } catch (error) {
      console.error('获取分类失败:', error);
      // 返回空分类数组而不是抛出错误
      return { categories: [] };
    }
  }

  /**
   * 搜索媒体（通过标题和标签）
   */
  static async searchMedia(params: {
    query: string;
    skip?: number;
    take?: number;
    filters?: Omit<MediaFilters, 'search'>;
  }): Promise<MediaListResponse> {
    const { query, skip = 0, take = 24, filters = {} } = params;

    try {
      // 获取所有数据，然后在前端进行搜索过滤
      // 注意：这里假设数据量不会很大，如果数据量大，应该在后端实现搜索API
      const allMedia = await this.getMediaList({ skip: 0, take: 1000, filters });

      // 搜索逻辑：匹配标题、描述、标签名称
      const filteredData = allMedia.data.filter(item => {
        const searchLower = query.toLowerCase();
        const titleMatch = item.title.toLowerCase().includes(searchLower);
        const descMatch = item.description?.toLowerCase().includes(searchLower);
        const tagMatch = item.tags.some(tag => tag.name.toLowerCase().includes(searchLower));

        return titleMatch || descMatch || tagMatch;
      });

      // 分页处理
      const paginatedData = filteredData.slice(skip, skip + take);

      return {
        data: paginatedData,
        meta: {
          total: filteredData.length,
          skip,
          take,
          hasMore: skip + take < filteredData.length
        }
      };
    } catch (error) {
      console.error('搜索媒体失败:', error);
      throw new Error('搜索失败');
    }
  }

  /**
   * 按分类获取媒体
   */
  static async getMediaByCategory(categoryId: string, params: {
    skip?: number;
    take?: number;
  } = {}): Promise<MediaListResponse> {
    const { skip = 0, take = 24 } = params;

    try {
      // 直接通过API获取该分类下的媒体
      return await this.getMediaList({
        skip,
        take,
        filters: { categoryId }
      });
    } catch (error) {
      console.error('按分类获取媒体失败:', error);
      throw new Error('获取分类媒体失败');
    }
  }

  /**
   * 按标签获取媒体
   */
  static async getMediaByTag(tagId: string, params: {
    skip?: number;
    take?: number;
  } = {}): Promise<MediaListResponse> {
    const { skip = 0, take = 24 } = params;

    try {
      // 由于后端API不直接支持按标签查询，我们需要获取所有媒体然后过滤
      const allMedia = await this.getMediaList({ skip: 0, take: 1000 });

      // 过滤包含指定标签的媒体
      const filteredData = allMedia.data.filter(item =>
        item.tags.some(tag => tag.id === tagId)
      );

      // 分页处理
      const paginatedData = filteredData.slice(skip, skip + take);

      return {
        data: paginatedData,
        meta: {
          total: filteredData.length,
          skip,
          take,
          hasMore: skip + take < filteredData.length
        }
      };
    } catch (error) {
      console.error('按标签获取媒体失败:', error);
      throw new Error('获取标签媒体失败');
    }
  }

  /**
   * 创建媒体（上传后）
   */
  static async createMedia(data: {
    title: string;
    description?: string;
    categoryId?: string;
    tagIds?: string[];
  }): Promise<MediaItem> {
    try {
      const response = await apiClient.post<MediaItem>('/media', data, {
        withAuth: true
      });
      return response;
    } catch (error) {
      console.error('创建媒体失败:', error);
      throw new Error('创建媒体失败');
    }
  }

  /**
   * 更新媒体
   */
  static async updateMedia(id: string, data: {
    title?: string;
    description?: string;
    categoryId?: string;
    tagIds?: string[];
  }): Promise<MediaItem> {
    try {
      const response = await apiClient.patch<MediaItem>(`/media/${id}`, data, {
        withAuth: true
      });
      return response;
    } catch (error) {
      console.error('更新媒体失败:', error);
      throw new Error('更新媒体失败');
    }
  }

  /**
   * 删除媒体
   */
  static async deleteMedia(id: string): Promise<void> {
    try {
      await apiClient.delete(`/media/${id}`, {
        withAuth: true
      });
    } catch (error) {
      console.error('删除媒体失败:', error);
      throw new Error('删除媒体失败');
    }
  }
}

export const mediaService = MediaService; 