import { getSession } from 'next-auth/react';

type RequestMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

type RequestOptions = {
  headers?: Record<string, string>;
  params?: Record<string, string | number | boolean | undefined>;
  withAuth?: boolean;
  customConfig?: RequestInit;
};

type ErrorResponse = {
  error?: string;
  message?: string;  // 添加 message 字段
  issues?: { message: string }[];
  // 添加嵌套的 response 结构
  response?: {
    message: string;
    error: string;
    statusCode: number;
  };
};

class ApiError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
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
    data?: any,
    options?: RequestOptions
  ): Promise<Record<string, string>> {
    const headers: Record<string, string> = {
      ...options?.headers,
    };

    // 如果不是FormData，则添加Content-Type
    // 注意：FormData会通过data参数传递，不是customConfig.body
    if (!(data instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    // 添加认证信息
    if (options?.withAuth !== false) {
      const session = await getSession();
      // console.log('当前会话:', session); // 添加调试日志

      if (session?.accessToken) {
        headers['Authorization'] = `Bearer ${session.accessToken}`;
        // console.log('已添加认证头:', headers['Authorization']); // 添加调试日志
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

    let data: ErrorResponse;
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
      // const errorData = data as ErrorResponse;
      // const errorMessage =
      //   errorData.issues && errorData.issues.length > 0
      //     ? errorData.issues[0].message
      //     : errorData.error || `请求失败，状态码: ${response.status}`;
      let errorMessage = `请求失败，状态码: ${response.status}`;

      // 处理嵌套响应结构
      if (data.response) {
        errorMessage = data.response.message || data.response.error || errorMessage;
      }
      // 处理常规错误结构
      else {
        const firstIssueMessage = data.issues?.[0]?.message;
        errorMessage = firstIssueMessage || data.message || data.error || errorMessage;
      }

      throw new ApiError(response.status, errorMessage, data);
    }

    return data as T;
  }

  /**
   * 发送请求的通用方法
   */
  async request<T>(
    method: RequestMethod,
    endpoint: string,
    data?: any,
    options?: RequestOptions
  ): Promise<T> {
    try {
      const url = this.buildUrl(endpoint, options?.params);
      const headers = await this.prepareHeaders(data, options);
      console.log('准备发送的 headers:', headers);

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
        body: data instanceof FormData ? data : data ? JSON.stringify(data) : undefined,
      };
      console.log('最终请求配置:', config);

      const response = await fetch(url, config);
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

  async post<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('POST', endpoint, data, options);
  }

  async put<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('PUT', endpoint, data, options);
  }

  async patch<T>(endpoint: string, data?: any, options?: RequestOptions): Promise<T> {
    return this.request<T>('PATCH', endpoint, data, options);
  }

  async delete<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>('DELETE', endpoint, undefined, options);
  }
}

// 创建默认API客户端实例
export const apiClient = new ApiClient(); 