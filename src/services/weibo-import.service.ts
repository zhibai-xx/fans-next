import { apiClient } from '@/lib/api-client';

export interface WeiboFile {
  id: string;
  name: string;
  path: string;
  size: number;
  type: 'image' | 'video' | 'gif';
  lastModified: string;
  thumbnail?: string;
  dimensions?: {
    width: number;
    height: number;
  };
}

export interface WeiboUser {
  userId: string;
  userName: string;
  totalFiles: number;
  files: WeiboFile[];
}

export interface ScanResult {
  users: WeiboUser[];
  totalFiles: number;
  totalSize: number;
}

export interface UploadResult {
  filePath: string;
  fileName: string;
  uploadId?: string;
  success: boolean;
  needUpload?: boolean;
  mediaId?: string;
  error?: string;
}

export class WeiboImportService {
  /**
   * 扫描weibo文件夹
   */
  static async scanWeiboFiles(customPath?: string): Promise<ScanResult> {
    const response = await apiClient.post<{ success: boolean; data: ScanResult }>('/upload/weibo-scan', {
      customPath
    });
    return response.data;
  }

  /**
   * 批量上传weibo文件
   */
  static async batchUploadFiles(selectedFilePaths: string[]): Promise<UploadResult[]> {
    const response = await apiClient.post<{ success: boolean; data: UploadResult[] }>('/upload/weibo-batch-upload', {
      selectedFiles: selectedFilePaths
    });
    return response.data;
  }
}

export const weiboImportService = WeiboImportService; 