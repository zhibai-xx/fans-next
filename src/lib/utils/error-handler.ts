import type { ApiError } from '@/types/api';

/**
 * 处理特定的错误消息，转换为用户友好的格式
 * @param message 原始错误消息
 * @returns 处理后的错误消息
 */
function processErrorMessage(message: string): string {
  // 处理文件已存在的错误
  if (message.includes('Unique constraint failed') && message.includes('media_id')) {
    return '文件已存在，系统已为您跳过重复上传';
  }

  // 处理Prisma约束错误
  if (message.includes('P2002') || message.includes('constraint')) {
    return '数据冲突，该文件可能已被上传';
  }

  // 处理授权错误
  if (message.includes('未授权') || message.includes('Unauthorized')) {
    return '登录已过期，请重新登录';
  }

  // 处理网络错误
  if (message.includes('网络') || message.includes('Network')) {
    return '网络连接异常，请检查网络设置';
  }

  // 处理文件上传相关错误
  if (message.includes('文件已存在')) {
    return '文件已存在，无需重复上传';
  }

  if (message.includes('文件大小超出限制')) {
    return '文件大小超出限制，请选择较小的文件';
  }

  if (message.includes('不支持的文件格式')) {
    return '不支持的文件格式，请选择图片或视频文件';
  }

  // 返回原始消息
  return message;
}

/**
 * 从错误对象中提取错误消息
 * @param error 错误对象
 * @returns 错误消息字符串
 */
export function getErrorMessage(error: unknown): string {
  // 如果是我们的API错误格式
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = (error as any).response?.data as ApiError;
    if (apiError?.message) {
      return apiError.message;
    }
  }

  // 如果直接是API错误对象
  if (error && typeof error === 'object' && 'message' in error) {
    const apiError = error as ApiError;
    if (typeof apiError.message === 'string') {
      return apiError.message;
    }
  }

  // 如果是标准Error对象
  if (error instanceof Error) {
    return processErrorMessage(error.message);
  }

  // 如果是字符串
  if (typeof error === 'string') {
    return processErrorMessage(error);
  }

  // 默认错误消息
  return '操作失败，请稍后重试';
}

/**
 * 处理API错误的通用函数
 * @param error 错误对象
 * @param defaultMessage 默认错误消息
 * @returns 错误消息字符串
 */
export function handleApiError(error: unknown, defaultMessage?: string): string {
  const message = getErrorMessage(error);

  // 如果获取到了具体的错误消息，就使用它
  if (message !== '操作失败，请稍后重试') {
    return message;
  }

  // 否则使用提供的默认消息或通用消息
  return defaultMessage || '操作失败，请稍后重试';
} 