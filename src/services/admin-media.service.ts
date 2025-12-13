import { apiClient } from '@/lib/api-client';
import type { ApiResponse, ApiResponseWithPagination, PaginatedResponse } from '@/types/api';

export type { PaginatedResponse } from '@/types/api';

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
  original_file_url?: string;
  size: number;
  media_type: 'IMAGE' | 'VIDEO';
  duration?: number;
  width?: number;
  height?: number;
  status:
    | 'PENDING_REVIEW'
    | 'APPROVED'
    | 'REJECTED'
    | 'USER_DELETED'
    | 'ADMIN_DELETED'
    | 'SYSTEM_HIDDEN';
  visibility: 'VISIBLE' | 'HIDDEN';
  created_at: string;
  updated_at: string;
  views: number;
  likes_count: number;
  favorites_count: number;
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
  status?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
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

interface BatchRestoreResult {
  id: string;
  success: boolean;
  message?: string;
}

export interface DeleteMediaResult {
  successCount?: number;
  failedCount?: number;
  failedDetails?: Array<{
    mediaId?: string;
    message?: string;
    error?: string;
  }>;
}

type CategoryUsageApi = {
  id: string;
  name: string;
  count?: number;
  _count?: {
    media: number;
  };
};

type TagUsageApi = {
  id: string;
  name: string;
  count?: number;
  _count?: {
    media_tags: number;
  };
};

export interface RecycleMediaItem extends Media {
  deleted_at: string;
  deleted_reason?: string | null;
  deleted_by_id?: number | null;
  deleted_by_type?: 'USER' | 'ADMIN' | null;
  cleanup_scheduled_at?: string | null;
}

export interface PendingCleanupItem {
  id: string;
  cleanup_scheduled_at: string | null;
}

export interface DeletionSummary {
  totalRequested: number;
  successfulDeletions: number;
  failedDeletions: number;
  filesCleanedUp: number;
  spaceFree: number;
  results: Array<{
    success: boolean;
    mediaId: string;
    message: string;
    filesDeleted: {
      mainFile: boolean;
      thumbnail: boolean;
      processedFiles: boolean;
      qualityFiles: number;
      originalFile: boolean;
      extraFiles: number;
    };
    spaceFreed: number;
    backupCreated?: boolean;
    error?: string;
  }>;
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

    return apiClient.get<PaginatedResponse<Media>>('/admin/media', { params });
  }

  /**
   * 获取回收站媒体列表
   */
  static async getRecycleBin(params: {
    page?: number;
    limit?: number;
    search?: string;
  } = {}): Promise<PaginatedResponse<RecycleMediaItem>> {
    return apiClient.get<PaginatedResponse<RecycleMediaItem>>('/admin/media/recycle/bin', {
      params: {
        page: params.page ?? 1,
        limit: params.limit ?? 20,
        search: params.search?.trim() || undefined,
      },
    });
  }

  /**
   * 恢复回收站媒体
   */
  static async restoreMedia(
    mediaIds: string[],
  ): Promise<ApiResponse<BatchRestoreResult[]>> {
    return apiClient.post<ApiResponse<BatchRestoreResult[]>>('/admin/media/recycle/restore', {
      mediaIds,
    });
  }

  /**
   * 彻底删除回收站媒体
   */
  static async hardDeleteMedia(
    mediaIds: string[],
    options: {
      reason?: string;
      forceDelete?: boolean;
      createBackup?: boolean;
    } = {},
  ): Promise<ApiResponse<DeletionSummary>> {
    return apiClient.post<ApiResponse<DeletionSummary>>('/admin/media/recycle/hard-delete', {
      mediaIds,
      reason: options.reason,
      forceDelete: options.forceDelete ?? true,
      createBackup: options.createBackup ?? false,
    });
  }

  /**
   * 手动触发回收站清理
   */
  static async cleanupRecycleBin(
    options: {
      limit?: number;
      reason?: string;
      createBackup?: boolean;
    } = {},
  ): Promise<ApiResponse<DeletionSummary>> {
    return apiClient.post<ApiResponse<DeletionSummary>>('/admin/media/recycle/cleanup', {
      limit: options.limit,
      reason: options.reason,
      createBackup: options.createBackup ?? false,
    });
  }

  /**
   * 获取待硬删媒体列表
   */
  static async getPendingCleanup(
    limit: number = 50
  ): Promise<ApiResponseWithPagination<PendingCleanupItem[]>> {
    return apiClient.get<ApiResponseWithPagination<PendingCleanupItem[]>>('/admin/media/recycle/pending', {
      params: { limit },
    });
  }

  /**
   * 获取媒体统计信息
   */
  static async getMediaStats(): Promise<ApiResponse<MediaStats>> {
    return apiClient.get<ApiResponse<MediaStats>>('/admin/media/stats');
  }

  /**
   * 获取单个媒体详情
   */
  static async getMediaDetail(id: string): Promise<ApiResponse<Media>> {
    return apiClient.get<ApiResponse<Media>>(`/admin/media/${id}`);
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
    return apiClient.put<ApiResponse<Media>>(`/admin/media/${id}/visibility`, {
      visibility,
    });
  }

  /**
   * 批量更新媒体可见状态
   */
  static async batchUpdateMediaVisibility(
    mediaIds: string[],
    visibility: 'VISIBLE' | 'HIDDEN'
  ): Promise<ApiResponse<Record<string, unknown>>> {
    return apiClient.post<ApiResponse<Record<string, unknown>>>('/admin/media/batch/visibility', {
      mediaIds,
      visibility,
    });
  }

  // =====================================
  // 媒体删除API
  // =====================================

  /**
   * 删除单个媒体
   */
  static async deleteMedia(id: string): Promise<ApiResponse<DeleteMediaResult>> {
    return apiClient.delete<ApiResponse<DeleteMediaResult>>(`/admin/media/${id}`);
  }

  /**
   * 批量删除媒体
   */
  static async batchDeleteMedia(
    mediaIds: string[]
  ): Promise<ApiResponse<DeleteMediaResult>> {
    // 使用POST方法发送删除请求，因为需要传递请求体数据
    return apiClient.post<ApiResponse<DeleteMediaResult>>('/admin/media/batch/delete', { mediaIds });
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
  ): Promise<ApiResponse<Media>> {
    return apiClient.put<ApiResponse<Media>>(`/admin/media/${id}`, updateData);
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
    const response = await apiClient.get<ApiResponseWithPagination<Array<{
      id: number;
      username: string;
      email: string;
      avatar_url?: string;
      created_at: string;
      upload_count: number;
      role: string;
      status: string;
    }>>>('/admin/media/users/stats', {
      params: { page, limit },
    });
    return {
      success: response.success,
      data: response.data ?? [],
      pagination: response.pagination ?? { page, limit, total: 0, totalPages: 0 },
      message: response.message,
    };
  }

  /**
   * 获取分类使用统计
   */
  static async getCategoryUsageStats(): Promise<ApiResponse<Category[]>> {
    const response = await apiClient.get<ApiResponse<CategoryUsageApi[]>>('/admin/media/categories/usage');

    if (response.success && response.data) {
      const transformedData: Category[] = response.data.map((category) => ({
        id: category.id,
        name: category.name,
        count: category.count ?? category._count?.media ?? 0,
      }));
      return {
        success: response.success,
        data: transformedData,
        message: response.message,
      };
    }

    return {
      success: response.success,
      message: response.message,
      data: [],
    };
  }

  /**
   * 获取标签使用统计
   */
  static async getTagUsageStats(): Promise<ApiResponse<Tag[]>> {
    const response = await apiClient.get<ApiResponse<TagUsageApi[]>>('/admin/media/tags/usage');

    if (response.success && response.data) {
      const transformedData: Tag[] = response.data.map((tag) => ({
        id: tag.id,
        name: tag.name,
        count: tag.count ?? tag._count?.media_tags ?? 0,
      }));
      return {
        success: response.success,
        data: transformedData,
        message: response.message,
      };
    }

    return {
      success: response.success,
      message: response.message,
      data: [],
    };
  }
}
