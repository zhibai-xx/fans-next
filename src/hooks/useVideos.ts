import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { QueryClient } from '@tanstack/react-query';
import {
  VideoService,
  VideoFilters,
  VideoItem,
  IncrementViewPayload,
  VideoDetailResponse,
} from '@/services/video.service';
import {
  videoKeys,
  videoQueryOptions,
  type VideoDetailQueryData,
  type VideoInteractionQueryData,
} from '@/hooks/queries/video-query-options';
import { useToast } from '@/hooks/use-toast';
import {
  AUTH_REQUIRED_TITLE,
  handleApiError,
  isAuthRequiredMessage,
} from '@/lib/utils/error-handler';
import { useAuth } from '@/hooks/useAuth';

/**
 * 获取视频列表 - 无限滚动
 */
export function useInfiniteVideos(filters: VideoFilters = {}) {
  return useInfiniteQuery(videoQueryOptions.infiniteList(filters));
}

/**
 * 获取视频列表 - 分页
 */
export function useVideos(filters: VideoFilters = {}) {
  return useQuery(videoQueryOptions.list(filters));
}

/**
 * 获取视频详情
 */
export function useVideoDetail(videoId: string) {
  return useQuery({
    ...videoQueryOptions.detail(videoId),
    enabled: !!videoId,
  });
}

/**
 * 获取推荐视频
 */
export function useRecommendedVideos(videoId?: string, limit: number = 10) {
  return useQuery(videoQueryOptions.recommended(videoId, limit));
}

/**
 * 获取热门视频
 */
export function useTrendingVideos(limit: number = 20) {
  return useQuery(videoQueryOptions.trending(limit));
}

/**
 * 获取最新视频
 */
export function useLatestVideos(limit: number = 20) {
  return useQuery(videoQueryOptions.latest(limit));
}

/**
 * 按分类获取视频
 */
export function useVideosByCategory(categoryId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    ...videoQueryOptions.category(categoryId, page, limit),
    enabled: !!categoryId,
  });
}

/**
 * 按标签获取视频
 */
export function useVideosByTag(tagId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    ...videoQueryOptions.tag(tagId, page, limit),
    enabled: !!tagId,
  });
}

/**
 * 搜索视频
 */
export function useSearchVideos(query: string, filters: Omit<VideoFilters, 'search'> = {}) {
  return useQuery({
    ...videoQueryOptions.search(query, filters),
    enabled: !!query.trim(),
  });
}

/**
 * 获取视频处理状态
 */
export function useVideoProcessingStatus(mediaId: string) {
  return useQuery({
    ...videoQueryOptions.processing(mediaId),
    enabled: !!mediaId,
    refetchInterval: (query) => {
      // 如果状态是处理中，每5秒刷新一次
      if (query.state.data?.data?.status === 'processing') {
        return 5000;
      }
      return false;
    },
  });
}

/**
 * 获取用户对视频的互动状态
 */
export function useVideoInteractionStatus(videoId: string) {
  const { isAuthenticated } = useAuth();
  return useQuery({
    ...videoQueryOptions.interaction(videoId),
    enabled: !!videoId && isAuthenticated,
  });
}

/**
 * 增加观看次数
 */
export function useIncrementViewsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: IncrementViewPayload) =>
      VideoService.incrementViews(payload.mediaId, payload),
    onSuccess: (_, payload) => {
      // 乐观更新视频详情中的观看次数
      const mediaId = payload.mediaId;
      queryClient.setQueryData<VideoDetailQueryData>(videoKeys.detail(mediaId), (old) => {
        if (!old?.data) {
          return old;
        }
        return {
          ...old,
          data: {
            ...old.data,
            views: (old.data.views ?? 0) + 1,
          },
        };
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
  });
}

/**
 * 点赞视频
 */
export function useLikeVideoMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ videoId, isLiked }: { videoId: string; isLiked: boolean }) =>
      VideoService.likeVideo(videoId, isLiked),
    onSuccess: (_, { videoId, isLiked }) => {
      const delta = isLiked ? 1 : -1;

      // 乐观更新互动状态
      queryClient.setQueryData<VideoInteractionQueryData>(videoKeys.interaction(videoId), (old) => {
        if (!old?.data) {
          return old;
        }
        return {
          ...old,
          data: {
            ...old.data,
            isLiked,
            likesCount: Math.max(0, (old.data.likesCount || 0) + delta),
          },
        };
      });

      // 乐观更新视频详情中的点赞数
      queryClient.setQueryData<VideoDetailQueryData>(videoKeys.detail(videoId), (old) => {
        if (!old?.data) {
          return old;
        }
        return {
          ...old,
          data: {
            ...old.data,
            likes_count: Math.max(0, (old.data.likes_count || 0) + delta),
          },
        };
      });

      toast({
        title: isLiked ? '已点赞' : '已取消点赞',
        description: isLiked ? '感谢您的支持！' : '已取消点赞',
        duration: 2000,
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
    onError: (error: unknown) => {
      const message = handleApiError(error, '操作失败，请稍后重试');
      toast({
        title: isAuthRequiredMessage(message) ? AUTH_REQUIRED_TITLE : '操作失败',
        description: message,
        variant: 'destructive',
        duration: 3000,
      });
    },
  });
}

/**
 * 收藏视频
 */
export function useFavoriteVideoMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: ({ videoId, isFavorited }: { videoId: string; isFavorited: boolean }) =>
      VideoService.favoriteVideo(videoId, isFavorited),
    onSuccess: (_, { videoId, isFavorited }) => {
      const delta = isFavorited ? 1 : -1;

      // 乐观更新互动状态
      queryClient.setQueryData<VideoInteractionQueryData>(videoKeys.interaction(videoId), (old) => {
        if (!old?.data) {
          return old;
        }
        return {
          ...old,
          data: {
            ...old.data,
            isFavorited,
            favoritesCount: Math.max(0, (old.data.favoritesCount || 0) + delta),
          },
        };
      });

      // 乐观更新视频详情中的收藏数
      queryClient.setQueryData<VideoDetailQueryData>(videoKeys.detail(videoId), (old) => {
        if (!old?.data) {
          return old;
        }
        return {
          ...old,
          data: {
            ...old.data,
            favorites_count: Math.max(0, (old.data.favorites_count || 0) + delta),
          },
        };
      });

      toast({
        title: isFavorited ? '已收藏' : '已取消收藏',
        description: isFavorited ? '已添加到我的收藏' : '已从收藏中移除',
        duration: 2000,
      });
    },
    onError: (error: unknown) => {
      const message = handleApiError(error, '操作失败，请稍后重试');
      toast({
        title: isAuthRequiredMessage(message) ? AUTH_REQUIRED_TITLE : '操作失败',
        description: message,
        variant: 'destructive',
        duration: 3000,
      });
    },
  });
}

/**
 * 重新处理视频 (管理员功能)
 */
export function useReprocessVideoMutation() {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: (mediaId: string) => VideoService.reprocessVideo(mediaId),
    onSuccess: (_, mediaId) => {
      toast({
        title: '重新处理已开始',
        description: '视频正在重新处理中...',
        duration: 3000,
      });

      // 使处理状态查询失效
      queryClient.invalidateQueries({
        queryKey: videoKeys.processing(mediaId)
      });
    },
    onError: () => {
      toast({
        title: '操作失败',
        description: '无法启动重新处理，请稍后重试',
        variant: 'destructive',
        duration: 3000,
      });
    },
  });
}

/**
 * 查询工具函数
 */
export const videoQueryUtils = {
  // 使所有视频查询失效
  invalidateAll: (client: QueryClient) => {
    client.invalidateQueries({ queryKey: videoKeys.all });
  },

  // 使视频列表查询失效
  invalidateLists: (client: QueryClient) => {
    client.invalidateQueries({ queryKey: videoKeys.lists() });
  },

  // 使特定视频详情失效
  invalidateDetail: (client: QueryClient, videoId: string) => {
    client.invalidateQueries({ queryKey: videoKeys.detail(videoId) });
  },

  // 预取视频详情
  prefetchDetail: (client: QueryClient, videoId: string) => {
    client.prefetchQuery({
      ...videoQueryOptions.detail(videoId),
    });
  },

  // 设置视频详情数据
  setVideoDetail: (client: QueryClient, videoId: string, data: VideoItem) => {
    const response: VideoDetailResponse = {
      success: true,
      data,
    };
    client.setQueryData(videoKeys.detail(videoId), response);
  },
};
