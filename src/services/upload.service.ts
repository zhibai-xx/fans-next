import { apiClient } from '@/lib/api-client';
import {
  InitUploadRequest,
  InitUploadResponse,
  BatchInitUploadRequest,
  BatchInitUploadResponse,
  UploadChunkRequest,
  UploadChunkResponse,
  MergeChunksRequest,
  MergeChunksResponse,
  UploadProgressResponse,
  CreateTagRequest,
  CreateTagResponse,
  GetTagsResponse,
  GetCategoriesResponse,
} from '@/types/upload';

export class UploadService {
  /**
   * 初始化单个文件上传
   */
  static async initUpload(data: InitUploadRequest): Promise<InitUploadResponse> {
    return await apiClient.post<InitUploadResponse>('/upload/init', data);
  }

  /**
   * 批量初始化文件上传
   */
  static async batchInitUpload(data: BatchInitUploadRequest): Promise<BatchInitUploadResponse> {
    return await apiClient.post<BatchInitUploadResponse>('/upload/batch-init', data);
  }

  /**
   * 上传文件分片
   */
  static async uploadChunk(
    data: UploadChunkRequest,
    file: Blob
  ): Promise<UploadChunkResponse> {
    const formData = new FormData();
    formData.append('uploadId', data.uploadId);
    formData.append('chunkIndex', data.chunkIndex.toString());
    formData.append('totalChunks', data.totalChunks.toString());
    formData.append('chunk', file);

    // 注意：不要手动设置 Content-Type，让浏览器自动设置包含boundary的multipart/form-data
    return await apiClient.post<UploadChunkResponse>('/upload/chunk', formData);
  }

  /**
   * 合并文件分片
   */
  static async mergeChunks(data: MergeChunksRequest): Promise<MergeChunksResponse> {
    return await apiClient.post<MergeChunksResponse>('/upload/merge', data);
  }

  /**
   * 获取上传进度
   */
  static async getUploadProgress(uploadId: string): Promise<UploadProgressResponse> {
    return await apiClient.get<UploadProgressResponse>(`/upload/progress/${uploadId}`);
  }

  /**
   * 取消上传
   */
  static async cancelUpload(uploadId: string): Promise<void> {
    await apiClient.delete(`/upload/${uploadId}`);
  }

  /**
   * 获取所有标签
   */
  static async getTags(): Promise<GetTagsResponse> {
    return await apiClient.get<GetTagsResponse>('/media/tags');
  }

  /**
   * 创建新标签
   */
  static async createTag(data: CreateTagRequest): Promise<CreateTagResponse> {
    return await apiClient.post<CreateTagResponse>('/media/tags', data);
  }

  /**
   * 获取所有分类
   */
  static async getCategories(): Promise<GetCategoriesResponse> {
    return await apiClient.get<GetCategoriesResponse>('/media/categories');
  }
}

export const uploadService = UploadService; 