import { apiClient } from '@/lib/api-client';

// 视频相关的类型定义 - 基于实际的media API响应格式
export interface VideoItem {
  id: string;
  title: string;
  description?: string;
  url: string; // 原始视频URL
  thumbnail_url?: string;
  size: number; // 文件大小(字节)
  media_type: 'VIDEO'; // 媒体类型
  duration?: number | null; // 秒
  width?: number | null;
  height?: number | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PRIVATE';
  views: number; // 观看次数
  likes_count: number;
  favorites_count: number;
  source: string;
  original_created_at?: string | null;
  source_metadata?: any;
  created_at: string;
  updated_at: string;
  user: {
    uuid: string;
    username: string;
    avatar_url?: string;
  };
  category?: {
    id: string;
    name: string;
    description?: string;
  };
  tags: Array<{
    id: string;
    name: string;
  }>;
  // 扩展字段 - 可能在处理后添加
  hls_url?: string; // HLS流媒体URL
  video_qualities?: Array<{
    quality: string; // '1080p', '720p', '480p', '360p'
    url: string;
    size: number;
    width: number;
    height: number;
    bitrate: number;
  }>;
  thumbnails?: {
    cover?: string;
    previews?: string[];
    sprite?: string;
    spriteVtt?: string;
  };
  original_file_url?: string | null;
}

export interface VideoFilters {
  search?: string;
  category?: string;
  tag?: string;
  sortBy?: 'created_at' | 'views' | 'likes_count' | 'title';
  sortOrder?: 'asc' | 'desc';
  status?: 'APPROVED' | 'PENDING' | 'PROCESSING' | 'REJECTED';
  limit?: number;
  page?: number;
}

export interface VideoListResponse {
  success: boolean;
  data: VideoItem[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface VideoDetailResponse {
  success: boolean;
  data: VideoItem;
}

export interface VideoInteractionStatusResponse {
  success: boolean;
  data: {
    isLiked: boolean;
    isFavorited: boolean;
    likesCount: number;
    favoritesCount: number;
  } | null;
}

export interface VideoProcessingStatus {
  mediaId: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  error?: string;
  result?: {
    qualities: Array<{
      quality: string;
      url: string;
      size: number;
    }>;
    hls?: {
      masterPlaylist: string;
      variants: Array<{
        quality: string;
        playlist: string;
        segmentCount: number;
      }>;
    };
    thumbnails?: {
      cover: string;
      previews: string[];
      sprite?: string;
      spriteVtt?: string;
    };
  };
}

export interface IncrementViewPayload {
  mediaId: string;
  sessionId?: string | null;
  mediaType?: 'IMAGE' | 'VIDEO';
  event?: 'play' | 'detail' | 'preview' | 'open';
}

/**
 * 现代化视频服务
 * 连接到我们升级后的视频处理后端
 */
export class VideoService {
  /**
 * 获取视频列表
 */
  static async getVideos(filters: VideoFilters = {}): Promise<VideoListResponse> {
    const params = new URLSearchParams();

    // 强制设置为VIDEO类型
    params.append('type', 'VIDEO');

    // 构建查询参数
    if (filters.search) params.append('search', filters.search);
    if (filters.category) params.append('categoryId', filters.category);
    if (filters.tag) params.append('tagId', filters.tag);
    if (filters.sortBy) params.append('sortBy', filters.sortBy);
    if (filters.sortOrder) params.append('sortOrder', filters.sortOrder);
    if (filters.status) params.append('status', filters.status);

    // 处理分页参数
    const limit = filters.limit || 24;
    const page = filters.page || 1;
    const skip = (page - 1) * limit;

    params.append('take', limit.toString());
    params.append('skip', skip.toString());

    // 默认只显示已发布的视频
    if (!filters.status) params.append('status', 'APPROVED');
    // 默认按创建时间倒序
    if (!filters.sortBy) params.append('sortBy', 'created_at');
    if (!filters.sortOrder) params.append('sortOrder', 'desc');

    const queryString = params.toString();
    const url = `/media?${queryString}`;

    return apiClient.get(url, { withAuth: false });
  }

  /**
   * 获取视频详情
   */
  static async getVideoById(videoId: string): Promise<VideoDetailResponse> {
    const response = await apiClient.get<any>(
      `/media/${videoId}`,
      { withAuth: false }
    );

    if (response && typeof response === 'object' && 'success' in response && 'data' in response) {
      return response as VideoDetailResponse;
    }

    return {
      success: true,
      data: response as unknown as VideoItem,
    };
  }

  /**
   * 增加视频观看次数
   */
  static async incrementViews(
    videoId: string,
    payload?: Omit<IncrementViewPayload, 'mediaId'>,
  ): Promise<{ success: boolean; data?: any }> {
    return apiClient.post(`/media/${videoId}/view`, {
      sessionId: payload?.sessionId,
      mediaType: payload?.mediaType ?? 'VIDEO',
      event: payload?.event ?? 'play',
    });
  }

  /**
   * 点赞视频
   */
  static async likeVideo(videoId: string, isLiked: boolean): Promise<{ success: boolean }> {
    if (isLiked) {
      return apiClient.post(`/media/interaction/like`, { media_id: videoId });
    }

    return apiClient.delete(`/media/interaction/like/${videoId}`);
  }

  /**
   * 收藏视频
   */
  static async favoriteVideo(videoId: string, isFavorited: boolean): Promise<{ success: boolean }> {
    if (isFavorited) {
      return apiClient.post(`/media/interaction/favorite`, { media_id: videoId });
    }

    return apiClient.delete(`/media/interaction/favorite/${videoId}`);
  }

  /**
   * 获取用户的视频互动状态
   */
  static async getInteractionStatus(videoId: string): Promise<VideoInteractionStatusResponse> {
    try {
      const response = await apiClient.get<{
        success: boolean;
        data: {
          is_liked: boolean;
          is_favorited: boolean;
          likes_count: number;
          favorites_count: number;
        };
      }>(`/media/interaction/status/${videoId}`, {
        withAuth: true,
      });

      return {
        success: response.success,
        data: {
          isLiked: response.data.is_liked,
          isFavorited: response.data.is_favorited,
          likesCount: response.data.likes_count,
          favoritesCount: response.data.favorites_count,
        },
      };
    } catch (error) {
      console.warn('获取视频互动状态失败，使用默认值:', error);
      return {
        success: false,
        data: null,
      };
    }
  }

  /**
   * 获取视频处理状态
   */
  static async getProcessingStatus(mediaId: string): Promise<{
    success: boolean;
    data: VideoProcessingStatus;
  }> {
    return apiClient.get(`/video-processing/status/${mediaId}`);
  }

  /**
   * 手动触发视频重新处理 (管理员功能)
   */
  static async reprocessVideo(mediaId: string): Promise<{ success: boolean; jobId: string }> {
    return apiClient.post(`/video-processing/reprocess`, { mediaId });
  }

  /**
 * 获取推荐视频
 */
  static async getRecommendedVideos(videoId?: string, limit: number = 10): Promise<VideoListResponse> {
    const params = new URLSearchParams();
    params.append('type', 'VIDEO');
    params.append('take', limit.toString());
    params.append('skip', '0');
    params.append('status', 'APPROVED');
    params.append('sortBy', 'views');
    params.append('sortOrder', 'desc');

    return apiClient.get(`/media?${params.toString()}`, { withAuth: false });
  }

  /**
   * 搜索视频
   */
  static async searchVideos(query: string, filters: Omit<VideoFilters, 'search'> = {}): Promise<VideoListResponse> {
    return this.getVideos({ ...filters, search: query });
  }

  /**
   * 获取热门视频
   */
  static async getTrendingVideos(limit: number = 20): Promise<VideoListResponse> {
    return this.getVideos({
      sortBy: 'views',
      sortOrder: 'desc',
      limit,
      status: 'APPROVED'
    });
  }

  /**
   * 获取最新视频
   */
  static async getLatestVideos(limit: number = 20): Promise<VideoListResponse> {
    return this.getVideos({
      sortBy: 'created_at',
      sortOrder: 'desc',
      limit,
      status: 'APPROVED'
    });
  }

  /**
   * 按分类获取视频
   */
  static async getVideosByCategory(categoryId: string, page: number = 1, limit: number = 20): Promise<VideoListResponse> {
    return this.getVideos({
      category: categoryId,
      page,
      limit,
      status: 'APPROVED'
    });
  }

  /**
   * 按标签获取视频
   */
  static async getVideosByTag(tagId: string, page: number = 1, limit: number = 20): Promise<VideoListResponse> {
    return this.getVideos({
      tag: tagId,
      page,
      limit,
      status: 'APPROVED'
    });
  }

  /**
   * 格式化视频时长 (秒转为 MM:SS 格式)
   */
  static formatDuration(seconds: number): string {
    if (!seconds || seconds < 0) return '00:00';

    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = Math.floor(seconds % 60);

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }

    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  }

  /**
   * 格式化观看次数
   */
  static formatViews(views: number): string {
    if (views < 1000) return views.toString();
    if (views < 1000000) return `${(views / 1000).toFixed(1)}K`;
    return `${(views / 1000000).toFixed(1)}M`;
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
   * 获取视频质量标签的显示文本
   */
  static getQualityLabel(quality: string): string {
    const qualityMap: Record<string, string> = {
      '2160p': '4K',
      '1440p': '2K',
      '1080p': '高清',
      '720p': '标清',
      '480p': '流畅',
      '360p': '极速'
    };
    return qualityMap[quality] || quality;
  }

  /**
   * 检查视频是否支持HLS流播放
   */
  static supportsHLS(video: VideoItem): boolean {
    return !!(video.hls_url || video.video_qualities?.length > 0);
  }

  /**
   * 获取最佳播放质量
   */
  static getBestQuality(video: VideoItem): { url: string; quality: string } {
    if (!video.video_qualities?.length) {
      return { url: video.url, quality: 'original' };
    }

    // 按分辨率排序，选择最高质量
    const sorted = [...video.video_qualities].sort((a, b) => b.height - a.height);
    const best = sorted[0];

    return {
      url: best.url,
      quality: best.quality
    };
  }
}
