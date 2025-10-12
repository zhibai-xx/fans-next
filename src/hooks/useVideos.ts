import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { VideoService, VideoFilters, VideoItem } from '@/services/video.service';
import { useToast } from '@/hooks/use-toast';

// 查询键工厂
const videoKeys = {
  all: ['videos'] as const,
  lists: () => [...videoKeys.all, 'list'] as const,
  list: (filters: VideoFilters) => [...videoKeys.lists(), filters] as const,
  details: () => [...videoKeys.all, 'detail'] as const,
  detail: (id: string) => [...videoKeys.details(), id] as const,
  trending: () => [...videoKeys.all, 'trending'] as const,
  latest: () => [...videoKeys.all, 'latest'] as const,
  recommended: (videoId?: string) => [...videoKeys.all, 'recommended', videoId] as const,
  search: (query: string) => [...videoKeys.all, 'search', query] as const,
  category: (categoryId: string) => [...videoKeys.all, 'category', categoryId] as const,
  tag: (tagId: string) => [...videoKeys.all, 'tag', tagId] as const,
  processing: (mediaId: string) => [...videoKeys.all, 'processing', mediaId] as const,
  interaction: (videoId: string) => [...videoKeys.all, 'interaction', videoId] as const,
};

/**
 * 获取视频列表 - 无限滚动
 */
export function useInfiniteVideos(filters: VideoFilters = {}) {
  return useInfiniteQuery({
    queryKey: videoKeys.list(filters),
    queryFn: async ({ pageParam = 1 }) => {
      return VideoService.getVideos({
        ...filters,
        limit: filters.limit || 24,
        page: pageParam
      });
    },
    getNextPageParam: (lastPage) => {
      // 使用规范的API响应格式：pagination 对象
      if (!lastPage.pagination) {
        return undefined;
      }

      const { page, totalPages } = lastPage.pagination;

      // 如果还有更多页面，返回下一页页码
      return page < totalPages ? page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 5 * 60 * 1000, // 5分钟
    refetchOnWindowFocus: false,
  });
}

/**
 * 获取视频列表 - 分页
 */
export function useVideos(filters: VideoFilters = {}) {
  return useQuery({
    queryKey: videoKeys.list(filters),
    queryFn: () => VideoService.getVideos(filters),
    staleTime: 5 * 60 * 1000, // 5分钟
    refetchOnWindowFocus: false,
  });
}

/**
 * 获取视频详情
 */
export function useVideoDetail(videoId: string) {
  return useQuery({
    queryKey: videoKeys.detail(videoId),
    queryFn: () => VideoService.getVideoById(videoId),
    enabled: !!videoId,
    staleTime: 10 * 60 * 1000, // 10分钟
    refetchOnWindowFocus: false,
  });
}

/**
 * 获取推荐视频
 */
export function useRecommendedVideos(videoId?: string, limit: number = 10) {
  return useQuery({
    queryKey: videoKeys.recommended(videoId),
    queryFn: () => VideoService.getRecommendedVideos(videoId, limit),
    staleTime: 10 * 60 * 1000, // 10分钟
    refetchOnWindowFocus: false,
  });
}

/**
 * 获取热门视频
 */
export function useTrendingVideos(limit: number = 20) {
  return useQuery({
    queryKey: videoKeys.trending(),
    queryFn: () => VideoService.getTrendingVideos(limit),
    staleTime: 15 * 60 * 1000, // 15分钟
    refetchOnWindowFocus: false,
  });
}

/**
 * 获取最新视频
 */
export function useLatestVideos(limit: number = 20) {
  return useQuery({
    queryKey: videoKeys.latest(),
    queryFn: () => VideoService.getLatestVideos(limit),
    staleTime: 5 * 60 * 1000, // 5分钟
    refetchOnWindowFocus: false,
  });
}

/**
 * 按分类获取视频
 */
export function useVideosByCategory(categoryId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: videoKeys.category(categoryId),
    queryFn: () => VideoService.getVideosByCategory(categoryId, page, limit),
    enabled: !!categoryId,
    staleTime: 10 * 60 * 1000, // 10分钟
    refetchOnWindowFocus: false,
  });
}

/**
 * 按标签获取视频
 */
export function useVideosByTag(tagId: string, page: number = 1, limit: number = 20) {
  return useQuery({
    queryKey: videoKeys.tag(tagId),
    queryFn: () => VideoService.getVideosByTag(tagId, page, limit),
    enabled: !!tagId,
    staleTime: 10 * 60 * 1000, // 10分钟
    refetchOnWindowFocus: false,
  });
}

/**
 * 搜索视频
 */
export function useSearchVideos(query: string, filters: Omit<VideoFilters, 'search'> = {}) {
  return useQuery({
    queryKey: videoKeys.search(query),
    queryFn: () => VideoService.searchVideos(query, filters),
    enabled: !!query.trim(),
    staleTime: 5 * 60 * 1000, // 5分钟
    refetchOnWindowFocus: false,
  });
}

/**
 * 获取视频处理状态
 */
export function useVideoProcessingStatus(mediaId: string) {
  return useQuery({
    queryKey: videoKeys.processing(mediaId),
    queryFn: () => VideoService.getProcessingStatus(mediaId),
    enabled: !!mediaId,
    refetchInterval: (data, query) => {
      // 如果状态是处理中，每5秒刷新一次
      if (data?.data?.status === 'processing') {
        return 5000;
      }
      return false;
    },
    staleTime: 0, // 总是获取最新状态
  });
}

/**
 * 获取用户对视频的互动状态
 */
export function useVideoInteractionStatus(videoId: string) {
  return useQuery({
    queryKey: videoKeys.interaction(videoId),
    queryFn: () => VideoService.getInteractionStatus(videoId),
    enabled: !!videoId,
    staleTime: 2 * 60 * 1000, // 2分钟
  });
}

/**
 * 增加观看次数
 */
export function useIncrementViewsMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (videoId: string) => VideoService.incrementViews(videoId),
    onSuccess: (_, videoId) => {
      // 乐观更新视频详情中的观看次数
      queryClient.setQueryData(videoKeys.detail(videoId), (old: any) => {
        if (old?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              views: (old.data.views || 0) + 1
            }
          };
        }
        return old;
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
      // 乐观更新互动状态
      queryClient.setQueryData(videoKeys.interaction(videoId), (old: any) => {
        if (old?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              isLiked
            }
          };
        }
        return old;
      });

      // 乐观更新视频详情中的点赞数
      queryClient.setQueryData(videoKeys.detail(videoId), (old: any) => {
        if (old?.data) {
          const delta = isLiked ? 1 : -1;
          return {
            ...old,
            data: {
              ...old.data,
              likes_count: Math.max(0, (old.data.likes_count || 0) + delta)
            }
          };
        }
        return old;
      });

      toast({
        title: isLiked ? '已点赞' : '已取消点赞',
        description: isLiked ? '感谢您的支持！' : '已取消点赞',
        duration: 2000,
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
    },
    onError: () => {
      toast({
        title: '操作失败',
        description: '请稍后重试',
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
      // 乐观更新互动状态
      queryClient.setQueryData(videoKeys.interaction(videoId), (old: any) => {
        if (old?.data) {
          return {
            ...old,
            data: {
              ...old.data,
              isFavorited
            }
          };
        }
        return old;
      });

      toast({
        title: isFavorited ? '已收藏' : '已取消收藏',
        description: isFavorited ? '已添加到我的收藏' : '已从收藏中移除',
        duration: 2000,
      });
    },
    onError: () => {
      toast({
        title: '操作失败',
        description: '请稍后重试',
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
  invalidateAll: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: videoKeys.all });
  },

  // 使视频列表查询失效
  invalidateLists: (queryClient: ReturnType<typeof useQueryClient>) => {
    queryClient.invalidateQueries({ queryKey: videoKeys.lists() });
  },

  // 使特定视频详情失效
  invalidateDetail: (queryClient: ReturnType<typeof useQueryClient>, videoId: string) => {
    queryClient.invalidateQueries({ queryKey: videoKeys.detail(videoId) });
  },

  // 预取视频详情
  prefetchDetail: (queryClient: ReturnType<typeof useQueryClient>, videoId: string) => {
    queryClient.prefetchQuery({
      queryKey: videoKeys.detail(videoId),
      queryFn: () => VideoService.getVideoById(videoId),
      staleTime: 10 * 60 * 1000,
    });
  },

  // 设置视频详情数据
  setVideoDetail: (queryClient: ReturnType<typeof useQueryClient>, videoId: string, data: VideoItem) => {
    queryClient.setQueryData(videoKeys.detail(videoId), {
      success: true,
      data
    });
  },
};
