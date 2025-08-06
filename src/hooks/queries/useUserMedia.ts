import { useQuery, useInfiniteQuery, useMutation } from '@tanstack/react-query';
import { MediaService, MediaItem, MediaTag, MediaCategory, MediaFilters } from '@/services/media.service';
import { useToast } from '@/hooks/use-toast';

// 查询键工厂
export const userMediaQueryKeys = {
  // 图片相关
  images: {
    all: ['user-images'] as const,
    list: (filters?: MediaFilters) => [...userMediaQueryKeys.images.all, 'list', filters] as const,
    infinite: (filters?: MediaFilters) => [...userMediaQueryKeys.images.all, 'infinite', filters] as const,
  },
  // 视频相关
  videos: {
    all: ['user-videos'] as const,
    list: (filters?: MediaFilters) => [...userMediaQueryKeys.videos.all, 'list', filters] as const,
    infinite: (filters?: MediaFilters) => [...userMediaQueryKeys.videos.all, 'infinite', filters] as const,
  },
  // 标签和分类
  tags: {
    all: ['user-tags'] as const,
    list: () => [...userMediaQueryKeys.tags.all, 'list'] as const,
  },
  categories: {
    all: ['user-categories'] as const,
    list: () => [...userMediaQueryKeys.categories.all, 'list'] as const,
  },
} as const;

// 无限滚动图片列表
export function useInfiniteImages(filters?: MediaFilters, pageSize: number = 24) {
  return useInfiniteQuery({
    queryKey: userMediaQueryKeys.images.infinite(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await MediaService.getMediaList({
        skip: pageParam * pageSize,
        take: pageSize,
        filters: {
          ...filters,
          type: 'IMAGE',
          status: 'APPROVED',
        },
      });
      return response;
    },
    getNextPageParam: (lastPage, pages) => {
      const { meta } = lastPage;
      return meta.hasMore ? pages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// 无限滚动视频列表
export function useInfiniteVideos(filters?: MediaFilters, pageSize: number = 24) {
  return useInfiniteQuery({
    queryKey: userMediaQueryKeys.videos.infinite(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await MediaService.getMediaList({
        skip: pageParam * pageSize,
        take: pageSize,
        filters: {
          ...filters,
          type: 'VIDEO',
          status: 'APPROVED',
        },
      });
      return response;
    },
    getNextPageParam: (lastPage, pages) => {
      const { meta } = lastPage;
      return meta.hasMore ? pages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// 获取标签列表
export function useUserTags() {
  return useQuery<MediaTag[], Error>({
    queryKey: userMediaQueryKeys.tags.list(),
    queryFn: async () => {
      const response = await MediaService.getAllTags();
      return response.tags || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

// 获取分类列表
export function useUserCategories() {
  return useQuery<MediaCategory[], Error>({
    queryKey: userMediaQueryKeys.categories.list(),
    queryFn: async () => {
      const response = await MediaService.getAllCategories();
      return response.categories || [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

// TODO: 图片点赞变更 - 待实现
export function useLikeImageMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ mediaId, isLiked }: { mediaId: string; isLiked: boolean }) => {
      // TODO: 实现点赞功能
      console.log('点赞功能待实现:', { mediaId, isLiked });
      return Promise.resolve();
    },
    onSuccess: (data, variables) => {
      toast({
        title: variables.isLiked ? '取消点赞' : '点赞成功',
        description: variables.isLiked ? '已取消点赞' : '感谢你的喜欢！',
      });
    },
    onError: (error) => {
      toast({
        title: '操作失败',
        description: error instanceof Error ? error.message : '点赞操作失败，请重试',
        variant: 'destructive',
      });
    },
  });
}

// TODO: 增加媒体查看次数 - 待实现
export function useIncrementViewsMutation() {
  return useMutation({
    mutationFn: async (mediaId: string) => {
      // TODO: 实现查看次数功能
      console.log('查看次数功能待实现:', mediaId);
      return Promise.resolve();
    },
    // 静默操作，不显示toast
  });
}

// 查询工具函数
export const userMediaQueryUtils = {
  // 使图片查询失效
  invalidateImages: (queryClient: any) =>
    queryClient.invalidateQueries({ queryKey: userMediaQueryKeys.images.all }),

  // 使视频查询失效
  invalidateVideos: (queryClient: any) =>
    queryClient.invalidateQueries({ queryKey: userMediaQueryKeys.videos.all }),

  // 使标签查询失效
  invalidateTags: (queryClient: any) =>
    queryClient.invalidateQueries({ queryKey: userMediaQueryKeys.tags.all }),

  // 使分类查询失效
  invalidateCategories: (queryClient: any) =>
    queryClient.invalidateQueries({ queryKey: userMediaQueryKeys.categories.all }),

  // 预取下一页
  prefetchNextImages: (queryClient: any, filters?: MediaFilters) => {
    queryClient.prefetchInfiniteQuery({
      queryKey: userMediaQueryKeys.images.infinite(filters),
      // queryFn 会在需要时自动调用
    });
  },
};