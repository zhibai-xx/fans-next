import { apiClient } from '@/lib/api-client';

export interface SystemIngestFile {
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
  userId?: string;
}

export interface SystemIngestUser {
  userId: string;
  userName: string;
  totalFiles: number;
  files: SystemIngestFile[];
}

export interface SystemIngestScanResult {
  users: SystemIngestUser[];
  totalFiles: number;
  totalSize: number;
}

export interface SystemIngestUploadResult {
  filePath: string;
  fileName: string;
  uploadId?: string;
  success: boolean;
  needUpload?: boolean;
  mediaId?: string;
  error?: string;
}

type BatchUploadFile =
  | string
  | {
      path: string;
      name?: string;
      userId?: string;
    };

export class SystemIngestService {
  /**
   * 扫描系统导入目录
   */
  static async scanDirectory(
    customPath?: string,
  ): Promise<SystemIngestScanResult> {
    const response = await apiClient.post<{
      success: boolean;
      data: SystemIngestScanResult;
    }>('/upload/system-ingest/scan', {
      customPath,
    });
    return response.data;
  }

  /**
   * 批量上传系统导入文件
   */
  static async batchUploadFiles(
    selectedFiles: BatchUploadFile[],
  ): Promise<SystemIngestUploadResult[]> {
    const response = await apiClient.post<{
      success: boolean;
      data: SystemIngestUploadResult[];
    }>('/upload/system-ingest/batch-upload', {
      selectedFiles,
    });
    return response.data;
  }

  /**
   * 提供向后兼容的旧方法
   */
  static async scanFiles(customPath?: string) {
    return this.scanDirectory(customPath);
  }

  static async batchUpload(
    files: Array<{ id?: string; path: string; name: string; userId?: string }>,
    onProgress?: (progress: { completed: number; total: number; current?: string }) => void,
  ): Promise<{ results: SystemIngestUploadResult[] }> {
    const payload = files.map((file) => ({
      path: file.path,
      name: file.name,
      userId: file.userId,
    }));
    const results = await this.batchUploadFiles(payload);
    if (onProgress) {
      onProgress({ completed: results.length, total: results.length });
    }
    return { results };
  }

  static async uploadSingle(
    filePath: string,
    fileName: string,
    metadata?: any,
  ): Promise<SystemIngestUploadResult> {
    const [result] = await this.batchUploadFiles([{ path: filePath, name: fileName }]);
    if (!result) {
      return {
        filePath,
        fileName,
        success: false,
        error: '上传失败',
      };
    }
    return result;
  }

  static async getUserFiles(userId?: string, page?: number, limit?: number) {
    return { files: [], total: 0 };
  }

  static async deleteFile(filePath: string) {
    throw new Error('系统导入文件删除暂未开放');
  }

  static async previewFile(fileId: string) {
    const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
    const response = await fetch(`${baseUrl}/upload/system-ingest/preview/${fileId}`, {
      credentials: 'include',
    });
    if (!response.ok) {
      throw new Error('预览失败');
    }
    return response;
  }
}

export const systemIngestService = SystemIngestService;
