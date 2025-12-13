import { getSession } from 'next-auth/react';
import type { ApiErrorPayload } from '@/types/api';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  withAuth?: boolean;
  customConfig?: RequestInit;
};

export class ApiError extends Error {
  status: number;
  data: unknown;

  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.data = data;
  }
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';

export class ApiClient {
  private baseUrl: string;

  constructor(baseUrl = API_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * 构建完整的请求URL，包含查询参数
   */
  private buildUrl(endpoint: string, params?: Record<string, string | number | boolean | undefined>): string {
    const url = endpoint.startsWith('http') ? endpoint : `${this.baseUrl}${endpoint}`;

    if (!params) return url;

    const query = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        query.append(key, String(value));
      }
    });

    return `${url}${url.includes('?') ? '&' : '?'}${query.toString()}`;
  }

  /**
   * 准备请求头，自动处理认证信息
   */
  private async prepareHeaders(
    data?: unknown,
    options?: RequestOptions
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      ...options?.headers,
    };

    // 如果不是FormData，则添加Content-Type
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // 添加认证信息
    if (options?.withAuth !== false) {
      const session = await getSession();

      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
      } else {
        throw new Error('未授权访问');
      }
    }

    return headers;
  }

  /**
   * 处理请求响应
   */
  private async handleResponse<T>(response: Response): Promise<T> {
    // 204状态码表示无内容
    if (response.status === 204) {
      return {} as T;
    }

    let data: unknown;
    try {
      data = await response.json();
    } catch (error) {
      throw new ApiError(
        response.status,
        '无法解析响应数据',
        { originalError: error }
      );
    }

    if (!response.ok) {
      let errorMessage = `请求失败，状态码: ${response.status}`;

      // 处理嵌套响应结构
      const errorPayload = data as ApiErrorPayload;
      if (errorPayload.response) {
        errorMessage =
          errorPayload.response.message ||
          errorPayload.response.error ||
          errorMessage;
      }
      // 处理常规错误结构
      else {
        const firstIssueMessage = errorPayload.issues?.[0]?.message;
        errorMessage =
          firstIssueMessage ||
          errorPayload.message ||
          errorPayload.error ||
          errorMessage;
      }

      throw new ApiError(response.status, errorMessage, errorPayload);
    }

    return data as T;
  }

  /**
   * 延迟函数 - 用于限流重试
   */
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * 发送请求的通用方法，支持限流重试
   */
  async request<T>(
    method: RequestMethod,
    endpoint: string,
    data?: unknown,
    options?: RequestOptions & { retryCount?: number }
  ): Promise<T> {
    const maxRetries = 3;
    const retryCount = options?.retryCount || 0;

    try {
      const url = this.buildUrl(endpoint, options?.params);
      const headers = await this.prepareHeaders(data, options);

      const config: RequestInit = {
        method,
        credentials: 'include', // 允许携带 Cookie 和认证头
        ...options?.customConfig,
        // 确保 headers 不被 customConfig 覆盖
        headers: {
          ...headers,
          ...(options?.customConfig?.headers || {}),
        },
        // 如果是 FormData，直接使用 data
        body:
          data instanceof FormData
            ? data
            : typeof data === 'string'
            ? data
            : data !== undefined
            ? JSON.stringify(data)
            : undefined,
      };

      const response = await fetch(url, config);

      // 处理429限流错误
      if (response.status === 429 && retryCount < maxRetries) {
        const retryDelay = Math.pow(2, retryCount) * 1000; // 指数退避：1s, 2s, 4s
        
        console.warn(`⚠️ 触发限流 (429)，${retryDelay}ms后重试 (${retryCount + 1}/${maxRetries})`);
        
        await this.delay(retryDelay);
        
        return this.request<T>(method, endpoint, data, {
          ...options,
          retryCount: retryCount + 1
        });
      }

      return await this.handleResponse<T>(response);
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }

      throw new ApiError(
        0,
        error instanceof Error ? error.message : '请求失败',
        { originalError: error }
      );
    }
  }

  // 便捷的HTTP方法
  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('GET', endpoint, undefined, options);
  }

  async post<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

// 创建默认API客户端实例
export const apiClient = new ApiClient(); 
