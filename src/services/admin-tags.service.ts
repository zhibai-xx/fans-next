import { apiClient } from '@/lib/api-client';

// 标签相关接口
export interface Tag {
  id: string;
  name: string;
  created_at: string;
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
  static async getAllTags(search?: string): Promise<Tag[]> {
    const params = search ? { search } : {};
    const response = await apiClient.get('/admin/tags', { params }) as any;
    return response.data;
  }

  /**
   * 创建新标签
   */
  static async createTag(data: { name: string }): Promise<Tag> {
    const response = await apiClient.post('/admin/tags', data) as any;
    return response.data;
  }

  /**
   * 更新标签
   */
  static async updateTag(id: string, data: { name: string }): Promise<Tag> {
    const response = await apiClient.put(`/admin/tags/${id}`, data) as any;
    return response.data;
  }

  /**
   * 删除标签
   */
  static async deleteTag(id: string): Promise<void> {
    await apiClient.delete(`/admin/tags/${id}`);
  }

  /**
   * 批量删除标签
   */
  static async batchDeleteTags(ids: string[]): Promise<void> {
    await apiClient.request('DELETE', '/admin/tags/batch', { ids });
  }

  // =====================================
  // 分类相关API
  // =====================================

  /**
   * 获取所有分类（包含统计信息）
   */
  static async getAllCategories(search?: string): Promise<Category[]> {
    const params = search ? { search } : {};
    const response = await apiClient.get('/admin/categories', { params }) as any;
    return response.data;
  }

  /**
   * 创建新分类
   */
  static async createCategory(data: { name: string; description?: string }): Promise<Category> {
    const response = await apiClient.post('/admin/categories', data) as any;
    return response.data;
  }

  /**
   * 更新分类
   */
  static async updateCategory(id: string, data: { name: string; description?: string }): Promise<Category> {
    const response = await apiClient.put(`/admin/categories/${id}`, data) as any;
    return response.data;
  }

  /**
   * 删除分类
   */
  static async deleteCategory(id: string): Promise<void> {
    await apiClient.delete(`/admin/categories/${id}`);
  }

  /**
   * 批量删除分类
   */
  static async batchDeleteCategories(ids: string[]): Promise<void> {
    await apiClient.request('DELETE', '/admin/categories/batch', { ids });
  }

  // =====================================
  // 统计信息API
  // =====================================

  /**
   * 获取标签和分类的统计信息
   */
  static async getTagsCategoriesStats(): Promise<TagsCategoriesStats> {
    const response = await apiClient.get('/admin/tags-categories/stats') as any;
    return response.data;
  }
}