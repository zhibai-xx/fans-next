import { apiClient } from '@/lib/api-client';
import type {
  LikeResponse,
  FavoriteResponse,
  LikeStatus,
  FavoriteStatus,
  MediaInteractionStatus,
  BatchLikeStatus,
  BatchFavoriteStatus,
  LikeRequest,
  FavoriteRequest,
  FavoriteListQuery,
  FavoriteListResponse,
  InteractionApiResponse,
  FavoriteItem,
} from '@/types/interaction';

/**
 * 互动服务类 - 处理点赞、收藏等互动功能
 */
export class InteractionService {
  private static readonly BASE_URL = '/media/interaction';

  // ===========================================
  // 点赞相关方法
  // ===========================================

  /**
   * 点赞媒体
   */
  static async likeMedia(mediaId: string): Promise<InteractionApiResponse<LikeResponse>> {
    const response = await apiClient.post(`${this.BASE_URL}/like`, {
      media_id: mediaId,
    });
    return response;
  }

  /**
   * 取消点赞
   */
  static async unlikeMedia(mediaId: string): Promise<InteractionApiResponse> {
    const response = await apiClient.delete(`${this.BASE_URL}/like/${mediaId}`);
    return response;
  }

  /**
   * 获取点赞状态
   */
  static async getLikeStatus(mediaId: string): Promise<InteractionApiResponse<LikeStatus>> {
    const response = await apiClient.get(`${this.BASE_URL}/like/status/${mediaId}`);
    return response;
  }

  /**
   * 切换点赞状态（如果已点赞则取消，否则点赞）
   */
  static async toggleLike(mediaId: string, currentStatus: boolean): Promise<InteractionApiResponse> {
    if (currentStatus) {
      return this.unlikeMedia(mediaId);
    } else {
      return this.likeMedia(mediaId);
    }
  }

  // ===========================================
  // 收藏相关方法
  // ===========================================

  /**
   * 收藏媒体
   */
  static async favoriteMedia(mediaId: string): Promise<InteractionApiResponse<FavoriteResponse>> {
    const response = await apiClient.post(`${this.BASE_URL}/favorite`, {
      media_id: mediaId,
    });
    return response;
  }

  /**
   * 取消收藏
   */
  static async unfavoriteMedia(mediaId: string): Promise<InteractionApiResponse> {
    const response = await apiClient.delete(`${this.BASE_URL}/favorite/${mediaId}`);
    return response;
  }

  /**
   * 获取收藏状态
   */
  static async getFavoriteStatus(mediaId: string): Promise<InteractionApiResponse<FavoriteStatus>> {
    const response = await apiClient.get(`${this.BASE_URL}/favorite/status/${mediaId}`);
    return response;
  }

  /**
   * 切换收藏状态（如果已收藏则取消，否则收藏）
   */
  static async toggleFavorite(mediaId: string, currentStatus: boolean): Promise<InteractionApiResponse> {
    if (currentStatus) {
      return this.unfavoriteMedia(mediaId);
    } else {
      return this.favoriteMedia(mediaId);
    }
  }

  /**
   * 获取我的收藏列表
   */
  static async getMyFavorites(params: FavoriteListQuery = {}): Promise<FavoriteListResponse> {
    const { page = 1, limit = 20 } = params;
    const response = await apiClient.get(`${this.BASE_URL}/favorites/my`, {
      params: { page, limit }
    });
    return response;
  }

  // ===========================================
  // 综合状态方法
  // ===========================================

  /**
   * 获取媒体互动状态（点赞+收藏）
   */
  static async getMediaInteractionStatus(mediaId: string): Promise<InteractionApiResponse<MediaInteractionStatus>> {
    const response = await apiClient.get(`${this.BASE_URL}/status/${mediaId}`);
    return response;
  }

  /**
   * 批量获取点赞状态
   */
  static async getBatchLikeStatus(mediaIds: string[]): Promise<InteractionApiResponse<BatchLikeStatus>> {
    const response = await apiClient.post(`${this.BASE_URL}/batch/like-status`, {
      media_ids: mediaIds,
    });
    return response;
  }

  /**
   * 批量获取收藏状态
   */
  static async getBatchFavoriteStatus(mediaIds: string[]): Promise<InteractionApiResponse<BatchFavoriteStatus>> {
    const response = await apiClient.post(`${this.BASE_URL}/batch/favorite-status`, {
      media_ids: mediaIds,
    });
    return response;
  }

  // ===========================================
  // 便捷方法
  // ===========================================

  /**
   * 批量获取媒体的互动状态
   * 用于列表页面一次性获取多个媒体的点赞和收藏状态
   */
  static async getBatchInteractionStatus(mediaIds: string[]): Promise<{
    likes: Record<string, boolean>;
    favorites: Record<string, boolean>;
  }> {
    try {
      const [likesResponse, favoritesResponse] = await Promise.all([
        this.getBatchLikeStatus(mediaIds),
        this.getBatchFavoriteStatus(mediaIds),
      ]);

      return {
        likes: likesResponse.data?.likes_status || {},
        favorites: favoritesResponse.data?.favorites_status || {},
      };
    } catch (error) {
      console.error('获取批量互动状态失败:', error);
      // 返回空对象，避免页面崩溃
      const emptyStatus = mediaIds.reduce((acc, id) => {
        acc[id] = false;
        return acc;
      }, {} as Record<string, boolean>);

      return {
        likes: emptyStatus,
        favorites: emptyStatus,
      };
    }
  }

  /**
   * 预加载互动状态
   * 用于提前加载即将显示的媒体的互动状态
   */
  static async preloadInteractionStatus(mediaIds: string[]): Promise<void> {
    if (mediaIds.length === 0) return;

    try {
      // 异步预加载，不等待结果
      this.getBatchInteractionStatus(mediaIds);
    } catch (error) {
      // 预加载失败不影响主流程
      console.warn('预加载互动状态失败:', error);
    }
  }

  // ===========================================
  // 本地缓存管理（可选）
  // ===========================================

  private static interactionCache = new Map<string, {
    status: MediaInteractionStatus;
    timestamp: number;
    ttl: number;
  }>();

  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5分钟缓存

  /**
   * 从缓存获取互动状态
   */
  static getCachedInteractionStatus(mediaId: string): MediaInteractionStatus | null {
    const cached = this.interactionCache.get(mediaId);
    if (!cached) return null;

    const now = Date.now();
    if (now > cached.timestamp + cached.ttl) {
      this.interactionCache.delete(mediaId);
      return null;
    }

    return cached.status;
  }

  /**
   * 缓存互动状态
   */
  static setCachedInteractionStatus(mediaId: string, status: MediaInteractionStatus): void {
    this.interactionCache.set(mediaId, {
      status,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL,
    });
  }

  /**
   * 更新缓存中的互动状态
   */
  static updateCachedInteractionStatus(
    mediaId: string,
    updates: Partial<MediaInteractionStatus>
  ): void {
    const cached = this.getCachedInteractionStatus(mediaId);
    if (cached) {
      const newStatus = { ...cached, ...updates };
      this.setCachedInteractionStatus(mediaId, newStatus);
    }
  }

  /**
   * 清除特定媒体的缓存
   */
  static clearInteractionCache(mediaId?: string): void {
    if (mediaId) {
      this.interactionCache.delete(mediaId);
    } else {
      this.interactionCache.clear();
    }
  }

  /**
   * 清除过期缓存
   */
  static cleanExpiredCache(): void {
    const now = Date.now();
    for (const [mediaId, cached] of this.interactionCache.entries()) {
      if (now > cached.timestamp + cached.ttl) {
        this.interactionCache.delete(mediaId);
      }
    }
  }
}

// 默认导出
export default InteractionService;
