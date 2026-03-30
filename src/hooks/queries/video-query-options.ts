import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import {
  VideoService,
  type VideoFilters,
  type VideoListResponse,
} from '@/services/video.service';

const VIDEO_LIST_STALE_TIME = 5 * 60 * 1000;
const VIDEO_DETAIL_STALE_TIME = 10 * 60 * 1000;
const VIDEO_TRENDING_STALE_TIME = 15 * 60 * 1000;
const VIDEO_INTERACTION_STALE_TIME = 2 * 60 * 1000;

export const videoKeys = {
  all: ['videos'] as const,
  lists: () => [...videoKeys.all, 'list'] as const,
  list: (filters: VideoFilters = {}) => [...videoKeys.lists(), filters] as const,
  details: () => [...videoKeys.all, 'detail'] as const,
  detail: (id: string) => [...videoKeys.details(), id] as const,
  trending: (limit: number = 20) => [...videoKeys.all, 'trending', limit] as const,
  latest: (limit: number = 20) => [...videoKeys.all, 'latest', limit] as const,
  recommended: (videoId?: string, limit: number = 10) =>
    [...videoKeys.all, 'recommended', videoId ?? null, limit] as const,
  search: (query: string, filters: Omit<VideoFilters, 'search'> = {}) =>
    [...videoKeys.all, 'search', query, filters] as const,
  category: (categoryId: string, page: number = 1, limit: number = 20) =>
    [...videoKeys.all, 'category', categoryId, page, limit] as const,
  tag: (tagId: string, page: number = 1, limit: number = 20) =>
    [...videoKeys.all, 'tag', tagId, page, limit] as const,
  processing: (mediaId: string) => [...videoKeys.all, 'processing', mediaId] as const,
  interaction: (videoId: string) => [...videoKeys.all, 'interaction', videoId] as const,
};

export type VideoDetailQueryData = Awaited<ReturnType<typeof VideoService.getVideoById>>;
export type VideoInteractionQueryData = Awaited<ReturnType<typeof VideoService.getInteractionStatus>>;
export type VideoProcessingQueryData = Awaited<ReturnType<typeof VideoService.getProcessingStatus>>;

export const videoQueryOptions = {
  infiniteList: (filters: VideoFilters = {}) =>
    infiniteQueryOptions({
      queryKey: videoKeys.list(filters),
      queryFn: ({ pageParam = 1 }) =>
        VideoService.getVideos({
          ...filters,
          limit: filters.limit || 24,
          page: Number(pageParam),
        }),
      getNextPageParam: (lastPage: VideoListResponse) => {
        if (!lastPage.pagination) {
          return undefined;
        }

        const { page, totalPages } = lastPage.pagination;
        return page < totalPages ? page + 1 : undefined;
      },
      initialPageParam: 1,
      staleTime: VIDEO_LIST_STALE_TIME,
      refetchOnWindowFocus: false,
    }),
  list: (filters: VideoFilters = {}) =>
    queryOptions({
      queryKey: videoKeys.list(filters),
      queryFn: () => VideoService.getVideos(filters),
      staleTime: VIDEO_LIST_STALE_TIME,
      refetchOnWindowFocus: false,
    }),
  detail: (videoId: string) =>
    queryOptions({
      queryKey: videoKeys.detail(videoId),
      queryFn: () => VideoService.getVideoById(videoId),
      staleTime: VIDEO_DETAIL_STALE_TIME,
      refetchOnWindowFocus: false,
    }),
  recommended: (videoId?: string, limit: number = 10) =>
    queryOptions({
      queryKey: videoKeys.recommended(videoId, limit),
      queryFn: () => VideoService.getRecommendedVideos(videoId, limit),
      staleTime: VIDEO_DETAIL_STALE_TIME,
      refetchOnWindowFocus: false,
    }),
  trending: (limit: number = 20) =>
    queryOptions({
      queryKey: videoKeys.trending(limit),
      queryFn: () => VideoService.getTrendingVideos(limit),
      staleTime: VIDEO_TRENDING_STALE_TIME,
      refetchOnWindowFocus: false,
    }),
  latest: (limit: number = 20) =>
    queryOptions({
      queryKey: videoKeys.latest(limit),
      queryFn: () => VideoService.getLatestVideos(limit),
      staleTime: VIDEO_LIST_STALE_TIME,
      refetchOnWindowFocus: false,
    }),
  category: (categoryId: string, page: number = 1, limit: number = 20) =>
    queryOptions({
      queryKey: videoKeys.category(categoryId, page, limit),
      queryFn: () => VideoService.getVideosByCategory(categoryId, page, limit),
      staleTime: VIDEO_DETAIL_STALE_TIME,
      refetchOnWindowFocus: false,
    }),
  tag: (tagId: string, page: number = 1, limit: number = 20) =>
    queryOptions({
      queryKey: videoKeys.tag(tagId, page, limit),
      queryFn: () => VideoService.getVideosByTag(tagId, page, limit),
      staleTime: VIDEO_DETAIL_STALE_TIME,
      refetchOnWindowFocus: false,
    }),
  search: (query: string, filters: Omit<VideoFilters, 'search'> = {}) =>
    queryOptions({
      queryKey: videoKeys.search(query, filters),
      queryFn: () => VideoService.searchVideos(query, filters),
      staleTime: VIDEO_LIST_STALE_TIME,
      refetchOnWindowFocus: false,
    }),
  processing: (mediaId: string) =>
    queryOptions({
      queryKey: videoKeys.processing(mediaId),
      queryFn: () => VideoService.getProcessingStatus(mediaId),
      staleTime: 0,
    }),
  interaction: (videoId: string) =>
    queryOptions({
      queryKey: videoKeys.interaction(videoId),
      queryFn: () => VideoService.getInteractionStatus(videoId),
      staleTime: VIDEO_INTERACTION_STALE_TIME,
    }),
};
