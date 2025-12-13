/**
 * 统一的分页信息
 */
export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * API 错误响应类型（统一格式）
 */
export interface ApiErrorPayload {
  statusCode?: number;    // HTTP状态码
  timestamp?: string;     // ISO时间戳
  path?: string;         // 请求路径
  message?: string;      // 错误信息
  error?: string;        // 错误类型
  issues?: { message: string }[];
  response?: {
    message?: string;
    error?: string;
    statusCode?: number;
  };
  [key: string]: unknown;
}

/**
 * API 成功响应类型
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
}

/**
 * 带分页数据的响应
 */
export interface ApiResponseWithPagination<T = unknown> extends ApiResponse<T> {
  pagination?: PaginationMeta;
}

/**
 * 统一的分页列表响应（data 通常为数组）
 */
export type PaginatedResponse<T> = ApiResponseWithPagination<T[]> & {
  data?: T[];
};
