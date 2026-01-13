import { apiClient } from '@/lib/api-client';
import type { ApiResponse } from '@/types/api';

// 标签相关接口
export interface Tag {
  id: string;
  name: string;
  created_at: string;
  source?: 'ADMIN' | 'USER';
  status?: 'ACTIVE' | 'BLOCKED';
  _count?: {
    media_tags: number;
  };
}

export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
  _count?: {
    media: number;
  };
}

export interface TagsCategoriesStats {
  overview: {
    total_tags: number;
    total_categories: number;
    unused_tags: number;
    unused_categories: number;
  };
  top_tags: Array<{
    id: string;
    name: string;
    usage_count: number;
  }>;
  top_categories: Array<{
    id: string;
    name: string;
    description?: string;
    usage_count: number;
  }>;
}

// 标签管理API
export class AdminTagsService {
  // =====================================
  // 标签相关API
  // =====================================

  /**
   * 获取所有标签（包含统计信息）
   */
  static async getAllTags(search?: string): Promise<ApiResponse<Tag[]>> {
    const params = search ? { search } : {};
    return apiClient.get<ApiResponse<Tag[]>>('/admin/tags', { params });
  }

  /**
   * 创建新标签
   */
  static async createTag(data: { name: string }): Promise<ApiResponse<Tag>> {
    return apiClient.post<ApiResponse<Tag>>('/admin/tags', data);
  }

  /**
   * 更新标签
   */
  static async updateTag(id: string, data: { name: string }): Promise<ApiResponse<Tag>> {
    return apiClient.put<ApiResponse<Tag>>(`/admin/tags/${id}`, data);
  }

  /**
   * 更新标签状态
   */
  static async updateTagStatus(id: string, status: 'ACTIVE' | 'BLOCKED'): Promise<ApiResponse<Tag>> {
    return apiClient.patch<ApiResponse<Tag>>(`/admin/tags/${id}/status`, { status });
  }

  /**
   * 删除标签
   */
  static async deleteTag(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>>(`/admin/tags/${id}`);
  }

  /**
   * 批量删除标签
   */
  static async batchDeleteTags(ids: string[]): Promise<ApiResponse<null>> {
    return apiClient.request<ApiResponse<null>>('DELETE', '/admin/tags/batch', { ids });
  }

  // =====================================
  // 分类相关API
  // =====================================

  /**
   * 获取所有分类（包含统计信息）
   */
  static async getAllCategories(search?: string): Promise<ApiResponse<Category[]>> {
    const params = search ? { search } : {};
    return apiClient.get<ApiResponse<Category[]>>('/admin/categories', { params });
  }

  /**
   * 创建新分类
   */
  static async createCategory(data: { name: string; description?: string }): Promise<ApiResponse<Category>> {
    return apiClient.post<ApiResponse<Category>>('/admin/categories', data);
  }

  /**
   * 更新分类
   */
  static async updateCategory(id: string, data: { name: string; description?: string }): Promise<ApiResponse<Category>> {
    return apiClient.put<ApiResponse<Category>>(`/admin/categories/${id}`, data);
  }

  /**
   * 删除分类
   */
  static async deleteCategory(id: string): Promise<ApiResponse<null>> {
    return apiClient.delete<ApiResponse<null>>(`/admin/categories/${id}`);
  }

  /**
   * 批量删除分类
   */
  static async batchDeleteCategories(ids: string[]): Promise<ApiResponse<null>> {
    return apiClient.request<ApiResponse<null>>('DELETE', '/admin/categories/batch', { ids });
  }

  // =====================================
  // 统计信息API
  // =====================================

  /**
   * 获取标签和分类的统计信息
   */
  static async getTagsCategoriesStats(): Promise<ApiResponse<TagsCategoriesStats>> {
    return apiClient.get<ApiResponse<TagsCategoriesStats>>('/admin/tags-categories/stats');
  }
}
