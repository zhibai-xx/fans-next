import { infiniteQueryOptions, queryOptions } from '@tanstack/react-query';
import {
  AdminMediaService,
  type Category,
  type Media,
  type MediaFilters,
  type MediaStats,
  type PaginatedResponse,
  type Tag,
} from '@/services/admin-media.service';
import { queryKeys } from '@/lib/query-client';

const MEDIA_LIST_STALE_TIME = 60 * 1000;
const MEDIA_STATS_STALE_TIME = 5 * 60 * 1000;

const ensureSuccess = <T extends { success: boolean; message?: string }>(response: T, fallbackMessage: string): T => {
  if (!response.success) {
    throw new Error(response.message || fallbackMessage);
  }

  return response;
};

export const mediaQueryOptions = {
  infiniteList: (filters: MediaFilters, limit: number = 24) =>
    infiniteQueryOptions({
      queryKey: queryKeys.media.list(filters, 1, limit),
      queryFn: async ({ pageParam = 1 }) =>
        ensureSuccess(
          await AdminMediaService.getAllMedia(filters, Number(pageParam), limit),
          'Failed to fetch media',
        ),
      getNextPageParam: (lastPage: PaginatedResponse<Media>) => {
        if (!lastPage.pagination) {
          return undefined;
        }

        return lastPage.pagination.page < lastPage.pagination.totalPages
          ? lastPage.pagination.page + 1
          : undefined;
      },
      initialPageParam: 1,
      staleTime: MEDIA_LIST_STALE_TIME,
    }),
  list: (filters: MediaFilters, page: number, limit: number) =>
    queryOptions({
      queryKey: queryKeys.media.list(filters, page, limit),
      queryFn: async () =>
        ensureSuccess(
          await AdminMediaService.getAllMedia(filters, page, limit),
          'Failed to fetch media',
        ),
      placeholderData: (previousData: PaginatedResponse<Media> | undefined) => previousData,
      staleTime: MEDIA_LIST_STALE_TIME,
    }),
  stats: () =>
    queryOptions({
      queryKey: queryKeys.media.stats(),
      queryFn: async () => {
        const response = ensureSuccess(
          await AdminMediaService.getMediaStats(),
          'Failed to fetch media stats',
        );

        if (!response.data) {
          throw new Error('Failed to fetch media stats');
        }

        return response.data;
      },
      staleTime: MEDIA_STATS_STALE_TIME,
      refetchInterval: MEDIA_STATS_STALE_TIME,
    }),
  tagUsage: () =>
    queryOptions({
      queryKey: queryKeys.tags.usage(),
      queryFn: async () => {
        const response = ensureSuccess(
          await AdminMediaService.getTagUsageStats(),
          'Failed to fetch tag stats',
        );

        if (!response.data) {
          throw new Error('Failed to fetch tag stats');
        }

        return response.data;
      },
      staleTime: MEDIA_STATS_STALE_TIME,
    }),
  categoryUsage: () =>
    queryOptions({
      queryKey: queryKeys.categories.usage(),
      queryFn: async () => {
        const response = ensureSuccess(
          await AdminMediaService.getCategoryUsageStats(),
          'Failed to fetch category stats',
        );

        if (!response.data) {
          throw new Error('Failed to fetch category stats');
        }

        return response.data;
      },
      staleTime: MEDIA_STATS_STALE_TIME,
    }),
};

export type MediaManagementQueryData = PaginatedResponse<Media>;
export type MediaStatsQueryData = MediaStats;
export type TagUsageQueryData = Tag[];
export type CategoryUsageQueryData = Category[];
