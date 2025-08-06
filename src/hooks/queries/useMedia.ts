import { useQuery, useMutation, useInfiniteQuery } from '@tanstack/react-query';
import { AdminMediaService, Media, MediaFilters, MediaStats, PaginatedResponse, Tag, Category } from '@/services/admin-media.service';
import { queryKeys, queryUtils } from '@/lib/query-client';
import { useToast } from '@/hooks/use-toast';

// 无限滚动媒体列表
export function useInfiniteMedia(filters: MediaFilters, limit: number = 24) {
  return useInfiniteQuery({
    queryKey: queryKeys.media.list(filters, 1, limit),
    queryFn: async ({ pageParam = 1 }) => {
      const response = await AdminMediaService.getAllMedia(filters, pageParam, limit);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch media');
      }
      return response;
    },
    getNextPageParam: (lastPage) => {
      const { pagination } = lastPage;
      return pagination.page < pagination.totalPages ? pagination.page + 1 : undefined;
    },
    initialPageParam: 1,
    staleTime: 1000 * 60, // 1 minute
  });
}

// 媒体管理 - 分页版本（非无限滚动）
export function useMediaManagement(filters: MediaFilters, page: number, limit: number) {
  const queryKey = queryKeys.media.list(filters, page, limit);

  const { data, isLoading, error, isError, refetch } = useQuery<PaginatedResponse<Media>, Error>({
    queryKey: queryKey,
    queryFn: async () => {
      const response = await AdminMediaService.getAllMedia(filters, page, limit);
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch media');
      }
      return response;
    },
    placeholderData: (previousData) => previousData, // Keep previous data while fetching new
    staleTime: 1000 * 60, // 1 minute
  });

  const media = data?.data || [];
  const pagination = data?.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 };

  return {
    media,
    pagination,
    isLoading,
    error,
    hasError: isError,
    refetchMedia: refetch,
  };
}

// 媒体统计数据
export function useMediaStats() {
  return useQuery<MediaStats, Error>({
    queryKey: queryKeys.media.stats(),
    queryFn: async () => {
      const response = await AdminMediaService.getMediaStats();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch media stats');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    refetchInterval: 1000 * 60 * 5, // Refetch every 5 minutes
  });
}

// 标签使用统计
export function useTagUsageStats() {
  return useQuery<Tag[], Error>({
    queryKey: queryKeys.tags.usage(),
    queryFn: async () => {
      const response = await AdminMediaService.getTagUsageStats();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch tag stats');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// 分类使用统计
export function useCategoryUsageStats() {
  return useQuery<Category[], Error>({
    queryKey: queryKeys.categories.usage(),
    queryFn: async () => {
      const response = await AdminMediaService.getCategoryUsageStats();
      if (!response.success) {
        throw new Error(response.message || 'Failed to fetch category stats');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

// 媒体类型选项
export function useMediaTypeOptions() {
  return [
    { value: 'image', label: '图片' },
    { value: 'video', label: '视频' },
  ];
}

// 媒体状态选项
export function useMediaStatusOptions() {
  return [
    { value: 'PENDING', label: '待审核' },
    { value: 'APPROVED', label: '已通过' },
    { value: 'REJECTED', label: '已拒绝' },
  ];
}

// 媒体可见性选项
export function useMediaVisibilityOptions() {
  return [
    { value: 'VISIBLE', label: '显示' },
    { value: 'HIDDEN', label: '隐藏' },
  ];
}

// 更新媒体可见性 Mutation
export function useUpdateMediaVisibilityMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ mediaId, visibility }: { mediaId: string; visibility: 'VISIBLE' | 'HIDDEN' }) => {
      const response = await AdminMediaService.updateMediaVisibility(mediaId, visibility);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update media visibility');
      }
      return response;
    },
    onSuccess: (data, variables) => {
      toast({
        title: '更新成功',
        description: `媒体已${variables.visibility === 'VISIBLE' ? '显示' : '隐藏'}`,
      });
      queryUtils.invalidateMedia(); // 刷新媒体列表
    },
    onError: (error: Error) => {
      toast({
        title: '更新失败',
        description: error.message || '更新媒体可见性失败',
        variant: 'destructive',
      });
    },
  });
}

// 批量更新媒体可见性 Mutation
export function useBatchUpdateMediaVisibilityMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ mediaIds, visibility }: { mediaIds: string[]; visibility: 'VISIBLE' | 'HIDDEN' }) => {
      const response = await AdminMediaService.batchUpdateMediaVisibility(mediaIds, visibility);
      if (!response.success) {
        throw new Error(response.message || 'Failed to batch update media visibility');
      }
      return response;
    },
    onSuccess: (data, variables) => {
      toast({
        title: '批量更新成功',
        description: `${variables.mediaIds.length} 个媒体已${variables.visibility === 'VISIBLE' ? '显示' : '隐藏'}`,
      });
      queryUtils.invalidateMedia(); // 刷新媒体列表
    },
    onError: (error: Error) => {
      toast({
        title: '批量更新失败',
        description: error.message || '批量更新媒体可见性失败',
        variant: 'destructive',
      });
    },
  });
}

// 更新媒体信息 Mutation
export function useUpdateMediaInfoMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({
      mediaId,
      updates
    }: {
      mediaId: string;
      updates: {
        title?: string;
        description?: string;
        tags?: string[];
        categoryId?: string | null;
      }
    }) => {
      // 转换参数格式以匹配后端API
      const backendUpdates = {
        title: updates.title,
        description: updates.description,
        tag_ids: updates.tags,
        category_id: updates.categoryId,
      };

      const response = await AdminMediaService.updateMediaInfo(mediaId, backendUpdates);
      if (!response.success) {
        throw new Error(response.message || 'Failed to update media info');
      }
      return response;
    },
    onSuccess: (data, variables) => {
      toast({
        title: '更新成功',
        description: '媒体信息已更新',
      });
      // 更精确地刷新相关查询
      queryUtils.invalidateMedia();
      // 同时刷新标签和分类统计
      queryUtils.invalidateTags();
      queryUtils.invalidateCategories();
    },
    onError: (error: Error) => {
      toast({
        title: '更新失败',
        description: error.message || '更新媒体信息失败',
        variant: 'destructive',
      });
    },
  });
}

// 删除媒体 Mutation
export function useDeleteMediaMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mediaId: string) => {
      const response = await AdminMediaService.deleteMedia(mediaId);
      if (!response.success) {
        throw new Error(response.message || 'Failed to delete media');
      }
      return response;
    },
    onSuccess: (data) => {
      const response = data as any;
      const successCount = response.data?.successCount || 1;
      const failedCount = response.data?.failedCount || 0;
      const failedDetails = response.data?.failedDetails || [];

      if (failedCount > 0) {
        console.error('删除失败的媒体详情:', failedDetails);
        toast({
          title: '删除失败',
          description: failedDetails.length > 0
            ? `删除失败: ${failedDetails[0].error}`
            : '该媒体文件删除失败，可能由于数据库约束或其他原因',
          variant: 'destructive',
        });
      } else {
        toast({
          title: '删除成功',
          description: '媒体已删除',
        });
      }
      queryUtils.invalidateMedia(); // 刷新媒体列表
    },
    onError: (error: Error) => {
      toast({
        title: '删除失败',
        description: error.message || '删除媒体失败',
        variant: 'destructive',
      });
    },
  });
}

// 批量删除媒体 Mutation
export function useBatchDeleteMediaMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mediaIds: string[]) => {
      const response = await AdminMediaService.batchDeleteMedia(mediaIds);
      if (!response.success) {
        throw new Error(response.message || 'Failed to batch delete media');
      }
      return response;
    },
    onSuccess: (data, mediaIds) => {
      const response = data as any;
      const successCount = response.data?.successCount || 0;
      const failedCount = response.data?.failedCount || 0;
      const failedDetails = response.data?.failedDetails || [];

      if (failedCount > 0) {
        console.error('删除失败的媒体详情:', failedDetails);
        toast({
          title: '部分删除成功',
          description: `成功删除 ${successCount} 个媒体，${failedCount} 个删除失败。请检查控制台了解详情。`,
          variant: 'default',
        });
      } else {
        toast({
          title: '批量删除成功',
          description: `${successCount} 个媒体已删除`,
        });
      }
      queryUtils.invalidateMedia(); // 刷新媒体列表
    },
    onError: (error: Error) => {
      toast({
        title: '批量删除失败',
        description: error.message || '批量删除媒体失败',
        variant: 'destructive',
      });
    },
  });
}