// 媒体互动相关类型定义

/**
 * 点赞响应类型
 */
export interface LikeResponse {
  id: string;
  media_id: string;
  user_uuid: string;
  created_at: string;
}

/**
 * 收藏响应类型
 */
export interface FavoriteResponse {
  id: string;
  media_id: string;
  user_uuid: string;
  created_at: string;
}

/**
 * 点赞状态类型
 */
export interface LikeStatus {
  is_liked: boolean;
  likes_count: number;
}

/**
 * 收藏状态类型
 */
export interface FavoriteStatus {
  is_favorited: boolean;
  favorites_count: number;
}

/**
 * 媒体互动状态类型（点赞+收藏）
 */
export interface MediaInteractionStatus {
  is_liked: boolean;
  is_favorited: boolean;
  likes_count: number;
  favorites_count: number;
}

/**
 * 批量点赞状态类型
 */
export interface BatchLikeStatus {
  likes_status: Record<string, boolean>;
}

/**
 * 批量收藏状态类型
 */
export interface BatchFavoriteStatus {
  favorites_status: Record<string, boolean>;
}

/**
 * 点赞操作请求参数
 */
export interface LikeRequest {
  media_id: string;
}

/**
 * 收藏操作请求参数
 */
export interface FavoriteRequest {
  media_id: string;
}

/**
 * 收藏列表查询参数
 */
export interface FavoriteListQuery {
  page?: number;
  limit?: number;
}

/**
 * 分页信息类型
 */
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

/**
 * 收藏列表响应类型
 */
export interface FavoriteListResponse {
  success: boolean;
  data: FavoriteItem[];
  pagination: Pagination;
}

/**
 * 媒体统计信息类型
 */
export interface MediaStats {
  media_id: string;
  title: string;
  views: number;
  likes_count: number;
  favorites_count: number;
  comments_count: number;
  engagement_rate: number; // 互动率（%）
}

/**
 * 全站统计信息类型
 */
export interface GlobalStats {
  total_media: number;
  total_views: number;
  total_likes: number;
  total_favorites: number;
  total_comments: number;
  active_users: number;
  avg_engagement_rate: number; // 平均互动率（%）
}

/**
 * 用户统计信息类型
 */
export interface UserStats {
  user_uuid: string;
  username: string;
  uploaded_media: number;
  received_likes: number;    // 获得的点赞数
  received_favorites: number; // 获得的收藏数
  given_likes: number;       // 发出的点赞数
  given_favorites: number;   // 发出的收藏数
  comments_count: number;
}

/**
 * 时间段统计类型
 */
export interface PeriodStats {
  date: string;
  new_media: number;
  new_likes: number;
  new_favorites: number;
  new_comments: number;
  views: number;
}

/**
 * 统计查询参数类型
 */
export interface StatsQuery {
  start_date?: string;  // YYYY-MM-DD
  end_date?: string;    // YYYY-MM-DD
  period?: 'daily' | 'weekly' | 'monthly';
  limit?: number;
}

/**
 * API响应包装类型
 */
export interface InteractionApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  pagination?: Pagination;
}

/**
 * 互动按钮组件Props
 */
export interface InteractionButtonsProps {
  mediaId: string;
  initialLikeStatus?: LikeStatus;
  initialFavoriteStatus?: FavoriteStatus;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showCounts?: boolean;
  onInteractionChange?: (status: MediaInteractionStatus) => void;
}

/**
 * 互动统计显示组件Props
 */
export interface InteractionStatsProps {
  mediaId: string;
  views?: number;
  likesCount: number;
  favoritesCount: number;
  commentsCount?: number;
  className?: string;
  showEngagementRate?: boolean;
}

/**
 * 我的收藏页面Props
 */
export interface MyFavoritesProps {
  className?: string;
  initialPage?: number;
  itemsPerPage?: number;
}

/**
 * 收藏项目类型（前端展示用）
 */
export interface FavoriteItem {
  id: string;
  media: {
    id: string;
    title: string;
    description?: string;
    url: string;
    thumbnail_url?: string;
    size: number; // 🎯 添加：文件大小
    media_type: 'IMAGE' | 'VIDEO';
    duration?: number; // 🎯 添加：视频时长
    width?: number; // 🎯 添加：图片宽度
    height?: number; // 🎯 添加：图片高度
    status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PRIVATE'; // 🎯 添加：状态
    views: number;
    likes_count: number;
    favorites_count: number;
    source: string; // 🎯 添加：来源
    original_created_at?: string; // 🎯 添加：原创建时间
    source_metadata?: any; // 🎯 添加：来源元数据
    created_at: string;
    updated_at: string; // 🎯 添加：更新时间
    user: {
      id: number; // 🎯 添加：用户ID
      uuid: string;
      username: string;
      avatar_url?: string;
    };
    category?: {
      id: string;
      name: string;
    };
    tags: Array<{
      id: string;
      name: string;
    }>;
    video_qualities?: Array<{
      id: string;
      quality: string;
      url: string;
      width?: number;
      height?: number;
    }>;
  };
  created_at: string; // 收藏时间
}

/**
 * 互动历史记录类型
 */
export interface InteractionHistory {
  type: 'like' | 'favorite' | 'comment';
  media_id: string;
  media_title: string;
  media_url: string;
  media_type: 'IMAGE' | 'VIDEO';
  created_at: string;
  user: {
    uuid: string;
    username: string;
    avatar_url?: string;
  };
}

/**
 * 热门内容类型
 */
export interface TrendingContent {
  media_id: string;
  title: string;
  url: string;
  thumbnail_url?: string;
  media_type: 'IMAGE' | 'VIDEO';
  views: number;
  likes_count: number;
  favorites_count: number;
  engagement_rate: number;
  rank: number;
  change: number; // 排名变化 (+1, -2, 0)
}
