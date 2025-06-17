/**
 * API 错误响应类型（统一格式）
 */
export interface ApiError {
  statusCode: number;    // HTTP状态码
  timestamp: string;     // ISO时间戳
  path: string;         // 请求路径
  message: string;      // 错误信息（统一为字符串）
  error: string;        // 错误类型
}

/**
 * API 成功响应类型
 */
export interface ApiResponse<T = any> {
  data: T;
  message?: string;
} 