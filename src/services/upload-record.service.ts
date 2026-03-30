import { apiClient } from '@/lib/api-client';
import { handleApiError } from '@/lib/utils/error-handler';
import {
  UploadRecord,
  UploadStats,
  UploadFilters,
  UploadRecordResponse,
  ResubmitData
} from '@/types/upload-record';

export class UploadRecordService {
  /**
   * 获取用户上传统计
   */
  static async getStats(): Promise<UploadStats> {
    try {
      const response = await apiClient.get('/user-uploads/stats');
      return response as UploadStats;
    } catch (error) {
      throw handleApiError(error, '获取上传统计失败');
    }
  }

  /**
   * 获取用户上传记录列表
   */
  static async getRecords(filters: UploadFilters = {}): Promise<UploadRecordResponse> {
    try {
      const params = new URLSearchParams();

      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null && value !== '') {
          params.append(key, String(value));
        }
      });

      const response = await apiClient.get(`/user-uploads?${params.toString()}`);
      return response as UploadRecordResponse;
    } catch (error) {
      throw handleApiError(error, '获取上传记录失败');
    }
  }

  /**
   * 获取单条上传记录
   * TODO: 后端补充 `GET /user-uploads/:id` 后替换为精确接口
   */
  static async getRecord(recordId: string): Promise<UploadRecord> {
    const response = await this.getRecords({ page: 0, limit: 100 });
    const record = response.records.find((item) => item.id === recordId);

    if (!record) {
      throw new Error('未找到上传记录');
    }

    return record;
  }

  /**
   * 删除媒体记录
   */
  static async deleteRecord(recordId: string): Promise<void> {
    try {
      await apiClient.delete(`/user-uploads/${recordId}`);
    } catch (error) {
      throw handleApiError(error, '删除记录失败');
    }
  }

  /**
   * 批量删除上传记录
   */
  static async batchDeleteRecords(recordIds: string[]): Promise<void> {
    await Promise.all(recordIds.map((recordId) => this.deleteRecord(recordId)));
  }

  /**
   * 重新提交被拒绝的媒体
   */
  static async resubmitRecord(recordId: string, data: ResubmitData): Promise<UploadRecord> {
    try {
      const response = await apiClient.patch(`/user-uploads/${recordId}/resubmit`, data);
      return response as UploadRecord;
    } catch (error) {
      throw handleApiError(error, '重新提交失败');
    }
  }

  /**
   * 更新待审核媒体
   */
  static async updateRecord(recordId: string, data: Partial<UploadRecord>): Promise<UploadRecord> {
    try {
      const response = await apiClient.patch(`/user-uploads/${recordId}`, data);
      return response as UploadRecord;
    } catch (error) {
      throw handleApiError(error, '更新投稿失败');
    }
  }

  /**
   * 撤回待审核投稿
   */
  static async withdrawRecord(recordId: string): Promise<void> {
    try {
      await apiClient.post(`/user-uploads/${recordId}/withdraw`);
    } catch (error) {
      throw handleApiError(error, '撤回投稿失败');
    }
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * 格式化视频时长
   */
  static formatDuration(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes}:${secs.toString().padStart(2, '0')}`;
    }
  }

  /**
   * 格式化审核状态文本
   */
  static getStatusText(status: string): string {
    const statusMap = {
      PENDING_REVIEW: '待审核',
      APPROVED: '已通过',
      REJECTED: '已拒绝',
      USER_DELETED: '已被作者删除',
      ADMIN_DELETED: '管理员删除',
      SYSTEM_HIDDEN: '系统隐藏'
    };
    return statusMap[status as keyof typeof statusMap] || status;
  }

  /**
   * 获取状态颜色
   */
  static getStatusColor(status: string): string {
    const colorMap = {
      PENDING_REVIEW: 'text-yellow-600 bg-yellow-50 border-yellow-200',
      APPROVED: 'text-green-600 bg-green-50 border-green-200',
      REJECTED: 'text-red-600 bg-red-50 border-red-200',
      USER_DELETED: 'text-gray-400 bg-gray-50 border-gray-200',
      ADMIN_DELETED: 'text-gray-500 bg-gray-50 border-gray-200',
      SYSTEM_HIDDEN: 'text-purple-600 bg-purple-50 border-purple-200'
    };
    return colorMap[status as keyof typeof colorMap] || 'text-gray-600 bg-gray-50 border-gray-200';
  }
}
