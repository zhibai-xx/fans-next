// 文件类型枚举
export enum FileType {
  IMAGE = 'image',
  VIDEO = 'video',
}

// 上传状态枚举
export enum UploadStatus {
  PENDING = 'PENDING',
  UPLOADING = 'UPLOADING',
  MERGING = 'MERGING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  EXPIRED = 'EXPIRED',
}

// 初始化上传请求
export interface InitUploadRequest {
  filename: string;
  fileSize: number;
  fileType: FileType;
  fileMd5: string;
  chunkSize?: number;
  title: string;
  description?: string;
  tagIds?: string[];
  categoryId?: string;
}

// 初始化上传响应
export interface InitUploadResponse {
  uploadId: string;
  needUpload: boolean;
  uploadedChunks: number[];
  mediaId?: string;
}

// 批量初始化上传请求
export interface BatchInitUploadRequest {
  files: InitUploadRequest[];
}

// 批量初始化上传响应
export interface BatchInitUploadResponse {
  results: InitUploadResponse[];
}

// 上传分片请求
export interface UploadChunkRequest {
  uploadId: string;
  chunkIndex: number;
  totalChunks: number;
}

// 上传分片响应
export interface UploadChunkResponse {
  success: boolean;
  message: string;
}

// 合并分片请求
export interface MergeChunksRequest {
  uploadId: string;
  fileMd5: string;
}

// 合并分片响应
export interface MergeChunksResponse {
  mediaId: string;
}

// 上传进度响应
export interface UploadProgressResponse {
  uploadId: string;
  uploadedChunks: number[];
  progress: number;
  status: 'pending' | 'uploading' | 'completed' | 'failed';
}

// 上传任务状态
export interface UploadTask {
  id: string;
  file: File;
  status: 'pending' | 'calculating' | 'uploading' | 'merging' | 'completed' | 'failed' | 'cancelled' | 'skipped';
  progress: number;
  error?: string;
  uploadId?: string;
  totalChunks?: number;
  uploadedChunks: number[];
  title: string;
  description?: string;
  tags: string[];
  category?: { id: string; name: string };
  mediaId?: string;
}

// 上传选项
export interface UploadOptions {
  file: File;
  title: string;
  description?: string;
  tags: string[];
  category?: { id: string; name: string };
  onProgress?: (progress: number) => void;
  onStatusChange?: (status: UploadTask['status']) => void;
  onError?: (error: string) => void;
  onComplete?: (mediaId: string) => void;
}

// 标签类型
export interface Tag {
  id: string;
  name: string;
  created_at: string;
}

// 分类类型
export interface Category {
  id: string;
  name: string;
  description?: string;
  created_at: string;
}

// 创建标签请求
export interface CreateTagRequest {
  name: string;
}

// 创建标签响应
export interface CreateTagResponse {
  tag: Tag;
}

// 获取标签响应
export interface GetTagsResponse {
  tags: Tag[];
}

// 获取分类响应
export interface GetCategoriesResponse {
  categories: Category[];
} 