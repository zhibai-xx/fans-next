import { apiClient } from '@/lib/api-client';
import {
  ReviewStats,
  ReviewFilters,
  BatchOperationResult,
  BatchUpdateStatusData,
  BatchUpdateTagsData,
  BatchUpdateCategoryData
} from '@/types/review';
import { MediaItem, MediaListResponse } from '@/services/media.service';

export class ReviewService {
  private static readonly BASE_URL = '/media/review';

  /**
   * 获取审核统计信息
   */
  static async getStats(): Promise<ReviewStats> {
    // 添加时间戳参数防止缓存
    const timestamp = Date.now();
    const response = await apiClient.get<ReviewStats>(
      `${this.BASE_URL}/stats`,
      {
        withAuth: true,
        params: { _t: timestamp } // cache-busting参数
      }
    );
    return response;
  }

  /**
   * 获取审核媒体列表
   */
  static async getMediaList(filters: ReviewFilters): Promise<MediaListResponse> {
    // 将ReviewFilters转换为API客户端期望的参数格式
    const params: Record<string, string | number | boolean | undefined> = {};

    if (filters.status !== undefined) params.status = filters.status;
    if (filters.type !== undefined) params.type = filters.type;
    if (filters.categoryId !== undefined) params.categoryId = filters.categoryId;
    if (filters.tagId !== undefined) params.tagId = filters.tagId;
    if (filters.userUuid !== undefined) params.userUuid = filters.userUuid;
    if (filters.search !== undefined) params.search = filters.search;
    if (filters.sortBy !== undefined) params.sortBy = filters.sortBy;
    if (filters.sortOrder !== undefined) params.sortOrder = filters.sortOrder;
    if (filters.skip !== undefined) params.skip = filters.skip;
    if (filters.take !== undefined) params.take = filters.take;

    const response = await apiClient.get<MediaListResponse>(
      `${this.BASE_URL}/list`,
      {
        params,
        withAuth: true
      }
    );

    return response;
  }

  /**
   * 批量更新媒体状态
   */
  static async batchUpdateStatus(data: BatchUpdateStatusData): Promise<BatchOperationResult> {
    const response = await apiClient.post<BatchOperationResult>(
      `${this.BASE_URL}/batch-status`,
      data,
      { withAuth: true }
    );
    return response;
  }

  /**
   * 批量更新媒体标签
   */
  static async batchUpdateTags(data: BatchUpdateTagsData): Promise<BatchOperationResult> {
    const response = await apiClient.post<BatchOperationResult>(
      `${this.BASE_URL}/batch-tags`,
      data,
      { withAuth: true }
    );
    return response;
  }

  /**
   * 批量更新媒体分类
   */
  static async batchUpdateCategory(data: BatchUpdateCategoryData): Promise<BatchOperationResult> {
    const response = await apiClient.post<BatchOperationResult>(
      `${this.BASE_URL}/batch-category`,
      data,
      { withAuth: true }
    );
    return response;
  }

  /**
   * 更新单个媒体状态
   */
  static async updateSingleStatus(mediaId: string, status: 'APPROVED' | 'REJECTED'): Promise<void> {
    await apiClient.post(
      `${this.BASE_URL}/batch-status`,
      {
        mediaIds: [mediaId],
        status
      },
      { withAuth: true }
    );
  }

  /**
   * 更新媒体信息
   */
  static async updateMediaInfo(
    mediaId: string,
    data: {
      title?: string;
      description?: string;
      category_id?: string;
      media_type?: 'IMAGE' | 'VIDEO';
      status?: 'PENDING_REVIEW' | 'APPROVED' | 'REJECTED';
      tag_ids?: string[];
    }
  ): Promise<MediaItem> {
    console.log('📝 ReviewService.updateMediaInfo 发送请求:');
    console.log('   媒体ID:', mediaId);
    console.log('   更新数据:', data);

    const response = await apiClient.patch<MediaItem>(`/media/${mediaId}/info`, data, {
      withAuth: true,
    });

    console.log('📝 ReviewService.updateMediaInfo 收到响应:', response);
    return response;
  }

  /**
   * 获取所有分类列表
   */
  static async getAllCategories(): Promise<Array<{
    id: string;
    name: string;
    description?: string;
    media_count: number;
  }>> {
    console.log('📂 ReviewService.getAllCategories 发送请求');

    const response = await apiClient.get<{
      categories: Array<{
        id: string;
        name: string;
        description?: string;
        media_count: number;
      }>
    }>('/media/categories', {
      withAuth: true,
    });

    console.log('📂 ReviewService.getAllCategories 收到响应:', response);
    return response.categories;
  }

  /**
   * 获取所有标签列表
   */
  static async getAllTags(): Promise<Array<{
    id: string;
    name: string;
    created_at: string;
    usage_count: number;
  }>> {
    console.log('🏷️ ReviewService.getAllTags 发送请求');

    const response = await apiClient.get<{
      tags: Array<{
        id: string;
        name: string;
        created_at: string;
        usage_count: number;
      }>
    }>('/media/tags', {
      withAuth: true,
    });

    console.log('🏷️ ReviewService.getAllTags 收到响应:', response);
    return response.tags;
  }

  /**
   * 删除单个媒体
   */
  static async deleteMedia(mediaId: string): Promise<void> {
    console.log('🗑️ ReviewService.deleteMedia 发送请求:', mediaId);

    await apiClient.delete(`/admin/media/${mediaId}`, {
      withAuth: true,
    });

    console.log('🗑️ ReviewService.deleteMedia 删除成功');
  }

  /**
   * 批量删除媒体
   */
  static async batchDeleteMedia(mediaIds: string[]): Promise<BatchOperationResult> {
    console.log('🗑️ ReviewService.batchDeleteMedia 发送请求:', mediaIds);

    const response = await apiClient.post<BatchOperationResult>(
      '/admin/media/batch/delete',
      { mediaIds },
      { withAuth: true }
    );

    console.log('🗑️ ReviewService.batchDeleteMedia 删除成功:', response);
    return response;
  }
}

// 审核快捷键服务
export class ReviewShortcutService {
  private static shortcuts: Map<string, () => void> = new Map();

  /**
   * 注册快捷键
   */
  static register(key: string, callback: () => void): void {
    this.shortcuts.set(key, callback);
  }

  /**
   * 注销快捷键
   */
  static unregister(key: string): void {
    this.shortcuts.delete(key);
  }

  /**
   * 处理键盘事件
   */
  static handleKeyDown(event: KeyboardEvent): boolean {
    const key = this.getKeyFromEvent(event);
    const callback = this.shortcuts.get(key);

    if (callback) {
      event.preventDefault();
      callback();
      return true;
    }

    return false;
  }

  /**
   * 从事件中获取按键字符串
   */
  private static getKeyFromEvent(event: KeyboardEvent): string {
    const modifiers = [];
    if (event.ctrlKey) modifiers.push('Ctrl');
    if (event.altKey) modifiers.push('Alt');
    if (event.shiftKey) modifiers.push('Shift');
    if (event.metaKey) modifiers.push('Meta');

    return [...modifiers, event.key].join('+');
  }

  /**
   * 获取默认快捷键配置
   */
  static getDefaultShortcuts() {
    return {
      approve: 'a',
      reject: 'r',
      next: 'ArrowRight',
      previous: 'ArrowLeft',
      toggleSelect: ' ', // 空格键
      batchApprove: 'Ctrl+a',
      batchReject: 'Ctrl+r',
      quickTags: 't',
      fullscreen: 'f',
      escape: 'Escape'
    };
  }
}

// 审核状态管理Hook
export interface UseReviewResult {
  // 数据状态
  stats: ReviewStats | null;
  mediaList: MediaItem[];
  isLoading: boolean;
  error: string | null;
  selectedItems: Set<string>;
  currentFilters: ReviewFilters;
  hasMore: boolean;
  total: number;
  selectionState: {
    selectedCount: number;
    totalCount: number;
    isAllSelected: boolean;
    isPartialSelected: boolean;
    hasSelection: boolean;
  };

  // 操作方法
  refreshStats: () => Promise<void>;
  refreshMediaList: (append?: boolean) => Promise<void>;
  loadMore: () => Promise<void>;
  updateFilters: (filters: Partial<ReviewFilters>) => void;
  toggleSelection: (mediaId: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  batchApprove: () => Promise<void>;
  batchReject: () => Promise<void>;
  approveItem: (mediaId: string) => Promise<void>;
  rejectItem: (mediaId: string) => Promise<void>;
  deleteItem: (mediaId: string) => Promise<void>; // 新增：删除单个媒体
  batchDelete: () => Promise<void>; // 新增：批量删除媒体
  batchSetTags: (tagIds: string[], action?: 'add' | 'replace') => Promise<void>;
  batchSetCategory: (categoryId?: string) => Promise<void>;
  isSelected: (mediaId: string) => boolean; // 新增：高性能选择状态查询
} 
