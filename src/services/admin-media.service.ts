import { apiClient } from '@/lib/api-client';

// 标签接口
export interface Tag {
  id: string;
  name: string;
  count: number;
}

// 分类接口
export interface Category {
  id: string;
  name: string;
  count: number;
}

// 媒体相关接口
export interface Media {
  id: string;
  title: string;
  description?: string;
  url: string;
  filename?: string;
  thumbnail_url?: string;
  size: number;
  media_type: 'IMAGE' | 'VIDEO';
  duration?: number;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  visibility: 'VISIBLE' | 'HIDDEN';
  created_at: string;
  updated_at: string;
  views: number;
  likes_count: number;
  category_id?: string;
  user: {
    id: number;
    username: string;
    avatar_url?: string;
  };
  category?: {
    id: string;
    name: string;
  };
  media_tags: Array<{
    tag: {
      id: string;
      name: string;
    };
  }>;
}

export interface MediaFilters {
  visibility?: 'VISIBLE' | 'HIDDEN';
  status?: 'PENDING' | 'APPROVED' | 'REJECTED';
  media_type?: string;
  category_id?: string;
  date_range?: string;
  search?: string;
  user_id?: number;
}

export interface MediaStats {
  overview: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    visible: number;
    hidden: number;
  };
  byType: {
    image: number;
    video: number;
  };
  recentActivity: {
    today: number;
    thisWeek: number;
  };
}

// 统一API响应格式
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
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
  message?: string;
}

// 媒体管理API
export class AdminMediaService {
  // =====================================
  // 媒体查询API
  // =====================================

  /**
   * 获取所有媒体内容（管理员专用）
   */
  static async getAllMedia(
    filters: MediaFilters = {},
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<Media>> {
    const params = {
      page,
      limit,
      ...filters,
    };

    const response = await apiClient.get('/admin/media', { params });
    return response as PaginatedResponse<Media>; // 返回完整响应对象
  }

  /**
   * 获取媒体统计信息
   */
  static async getMediaStats(): Promise<ApiResponse<MediaStats>> {
    const response = await apiClient.get('/admin/media/stats');
    return response as ApiResponse<MediaStats>; // 返回完整响应对象
  }

  /**
   * 获取单个媒体详情
   */
  static async getMediaDetail(id: string): Promise<ApiResponse<Media>> {
    const response = await apiClient.get(`/admin/media/${id}`);
    return response as ApiResponse<Media>; // 返回完整响应对象
  }

  // =====================================
  // 媒体状态管理API
  // =====================================

  /**
   * 更新媒体可见状态（单个）
   */
  static async updateMediaVisibility(
    id: string,
    visibility: 'VISIBLE' | 'HIDDEN'
  ): Promise<ApiResponse<Media>> {
    const response = await apiClient.put(`/admin/media/${id}/visibility`, {
      visibility,
    });
    return response as ApiResponse<Media>; // 返回完整响应对象
  }

  /**
   * 批量更新媒体可见状态
   */
  static async batchUpdateMediaVisibility(
    mediaIds: string[],
    visibility: 'VISIBLE' | 'HIDDEN'
  ): Promise<ApiResponse<any>> {
    const response = await apiClient.post('/admin/media/batch/visibility', {
      mediaIds,
      visibility,
    });
    return response as ApiResponse<any>; // 返回完整响应对象
  }

  // =====================================
  // 媒体删除API
  // =====================================

  /**
   * 删除单个媒体
   */
  static async deleteMedia(id: string): Promise<ApiResponse<any>> {
    const response = await apiClient.delete(`/admin/media/${id}`);
    return response as ApiResponse<any>; // 返回完整响应对象
  }

  /**
   * 批量删除媒体
   */
  static async batchDeleteMedia(
    mediaIds: string[]
  ): Promise<ApiResponse<any>> {
    // 使用POST方法发送删除请求，因为需要传递请求体数据
    const response = await apiClient.post('/admin/media/batch/delete', { mediaIds });
    return response as ApiResponse<any>; // 返回完整响应对象
  }

  // =====================================
  // 媒体信息管理API
  // =====================================

  /**
   * 更新媒体信息（标题、描述、分类、标签等）
   */
  static async updateMediaInfo(
    id: string,
    updateData: {
      title?: string;
      description?: string;
      category_id?: string;
      tag_ids?: string[];
    }
  ) {
    const response = await apiClient.put(`/admin/media/${id}`, updateData);
    return response as any; // 返回完整响应对象
  }

  // =====================================
  // 统计API
  // =====================================

  /**
   * 获取用户上传统计
   */
  static async getUserUploadStats(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedResponse<{
    id: number;
    username: string;
    email: string;
    avatar_url?: string;
    created_at: string;
    upload_count: number;
    role: string;
    status: string;
  }>> {
    const response = await apiClient.get('/admin/media/users/stats', {
      params: { page, limit },
    }) as any;
    return {
      success: true,
      data: response.data?.data || [],
      pagination: response.data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 },
    };
  }

  /**
   * 获取分类使用统计
   */
  static async getCategoryUsageStats(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get('/admin/media/categories/usage') as any;

    // 转换数据格式：将 _count.media 转换为 count
    if (response.success && response.data) {
      const transformedData = response.data.map((category: any) => ({
        id: category.id,
        name: category.name,
        count: category._count?.media || 0
      }));
      return {
        success: response.success,
        data: transformedData,
        message: response.message
      } as ApiResponse<Category[]>;
    }

    return response as ApiResponse<Category[]>;
  }

  /**
   * 获取标签使用统计
   */
  static async getTagUsageStats(): Promise<ApiResponse<Tag[]>> {
    const response = await apiClient.get('/admin/media/tags/usage') as any;

    // 转换数据格式：将 _count.media_tags 转换为 count
    if (response.success && response.data) {
      const transformedData = response.data.map((tag: any) => ({
        id: tag.id,
        name: tag.name,
        count: tag._count?.media_tags || 0
      }));
      return {
        success: response.success,
        data: transformedData,
        message: response.message
      } as ApiResponse<Tag[]>;
    }

    return response as ApiResponse<Tag[]>;
  }
}