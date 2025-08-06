import { apiClient } from '@/lib/api-client';

export interface DashboardStats {
  users: {
    total: number;
    active: number;
    new_today: number;      // 今日新增用户数
    new_this_week: number;  // 本周新增用户数 
    suspended: number;
    admin_count: number;
  };
  media: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    visible: number;
    hidden: number;
    images: number;
    videos: number;
    total_size: number;
  };
  operations: {
    today: number;
    this_week: number;
    login_attempts_today: number;
    failed_logins_today: number;
    reviews_today: number;
  };
  system: {
    storage_used: number;
    storage_total: number;
    uptime: string;
    last_backup: string;
    cpu_usage: number;
    memory_usage: number;
  };
}

export interface RecentActivity {
  id: string;
  type: 'user_register' | 'media_review' | 'media_upload' | 'system_alert';
  title: string;
  description: string;
  timestamp: string;
  status: 'success' | 'warning' | 'info' | 'error';
}

export interface SystemStatus {
  database: 'healthy' | 'warning' | 'error';
  storage: 'healthy' | 'warning' | 'error';
  memory: 'healthy' | 'warning' | 'error';
  cpu: 'healthy' | 'warning' | 'error';
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export class AdminDashboardService {
  /**
   * 获取管理面板统计数据
   */
  static async getDashboardStats(): Promise<ApiResponse<DashboardStats>> {
    return await apiClient.get('/admin/dashboard/stats');
  }

  /**
   * 获取近期活动日志
   */
  static async getRecentActivities(): Promise<ApiResponse<RecentActivity[]>> {
    return await apiClient.get('/admin/dashboard/recent-activities');
  }

  /**
   * 获取系统状态信息
   */
  static async getSystemStatus(): Promise<ApiResponse<SystemStatus>> {
    return await apiClient.get('/admin/dashboard/system-status');
  }

  /**
   * 格式化文件大小
   */
  static formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
  }

  /**
   * 格式化存储使用率百分比
   */
  static formatStoragePercentage(used: number, total: number): number {
    if (total === 0) return 0;
    return Math.round((used / total) * 100);
  }

  /**
   * 格式化时间差
   */
  static formatTimeAgo(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (seconds < 60) return `${seconds}秒前`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}分钟前`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}小时前`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}天前`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}个月前`;
    const years = Math.floor(months / 12);
    return `${years}年前`;
  }

  /**
   * 获取状态颜色类名
   */
  static getStatusColor(status: RecentActivity['status']): string {
    switch (status) {
      case 'success':
        return 'bg-green-500';
      case 'warning':
        return 'bg-orange-500';
      case 'error':
        return 'bg-red-500';
      case 'info':
      default:
        return 'bg-blue-500';
    }
  }

  /**
   * 获取系统健康状态颜色
   */
  static getHealthStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'healthy':
        return 'text-green-600';
      case 'warning':
        return 'text-orange-600';
      case 'error':
        return 'text-red-600';
      default:
        return 'text-gray-600';
    }
  }

  /**
   * 获取服务状态徽章样式
   */
  static getServiceStatusVariant(status: string): 'default' | 'secondary' | 'destructive' | 'outline' {
    switch (status.toLowerCase()) {
      case 'running':
        return 'default';
      case 'stopped':
        return 'destructive';
      case 'warning':
        return 'secondary';
      default:
        return 'outline';
    }
  }
}

