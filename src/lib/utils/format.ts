/**
 * 格式化文件大小
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * 格式化上传速度
 */
export function formatUploadSpeed(bytesPerSecond: number): string {
  return formatFileSize(bytesPerSecond) + '/s';
}

/**
 * 格式化剩余时间
 */
export function formatRemainingTime(seconds: number): string {
  if (seconds < 60) {
    return `${Math.round(seconds)}秒`;
  } else if (seconds < 3600) {
    const minutes = Math.floor(seconds / 60);
    return `${minutes}分钟`;
  } else {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}小时${minutes}分钟`;
  }
}

/**
 * 格式化日期时间，确保正确显示中国时区时间
 * @param dateString ISO时间字符串或Date对象
 * @param options 格式化选项
 */
export function formatDateTime(
  dateString: string | Date,
  options: {
    dateStyle?: 'full' | 'long' | 'medium' | 'short';
    timeStyle?: 'full' | 'long' | 'medium' | 'short';
    showTime?: boolean;
  } = {}
): string {
  const { dateStyle = 'medium', timeStyle = 'short', showTime = true } = options;

  try {
    const date = new Date(dateString);

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '无效日期';
    }

    // 使用中国时区格式化
    const formatOptions: Intl.DateTimeFormatOptions = {
      timeZone: 'Asia/Shanghai',
    };

    if (showTime) {
      formatOptions.dateStyle = dateStyle;
      formatOptions.timeStyle = timeStyle;
    } else {
      formatOptions.dateStyle = dateStyle;
    }

    return date.toLocaleString('zh-CN', formatOptions);
  } catch (error) {
    console.error('格式化日期时间失败:', error);
    return '格式化失败';
  }
}

/**
 * 格式化相对时间（多久前）
 * @param dateString ISO时间字符串或Date对象
 */
export function formatRelativeTime(dateString: string | Date): string {
  try {
    const date = new Date(dateString);
    const now = new Date();

    // 检查日期是否有效
    if (isNaN(date.getTime())) {
      return '无效日期';
    }

    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diffInSeconds < 60) {
      return '刚刚';
    } else if (diffInSeconds < 3600) {
      const minutes = Math.floor(diffInSeconds / 60);
      return `${minutes}分钟前`;
    } else if (diffInSeconds < 86400) {
      const hours = Math.floor(diffInSeconds / 3600);
      return `${hours}小时前`;
    } else if (diffInSeconds < 2592000) {
      const days = Math.floor(diffInSeconds / 86400);
      return `${days}天前`;
    } else if (diffInSeconds < 31536000) {
      const months = Math.floor(diffInSeconds / 2592000);
      return `${months}个月前`;
    } else {
      const years = Math.floor(diffInSeconds / 31536000);
      return `${years}年前`;
    }
  } catch (error) {
    console.error('格式化相对时间失败:', error);
    return '格式化失败';
  }
}

/**
 * 获取文件扩展名
 */
export function getFileExtension(filename: string): string {
  return filename.slice((filename.lastIndexOf('.') - 1 >>> 0) + 2);
}

/**
 * 检查是否为图片文件
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 检查是否为视频文件
 */
export function isVideoFile(file: File): boolean {
  return file.type.startsWith('video/');
}

/**
 * 生成唯一ID
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
} 