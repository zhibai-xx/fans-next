import { useQuery, useMutation } from '@tanstack/react-query';
import {
  AdminMediaService,
  RecycleMediaItem,
  DeletionSummary,
  PendingCleanupItem,
  PaginatedResponse,
} from '@/services/admin-media.service';
import { queryKeys, queryUtils } from '@/lib/query-client';
import { useToast } from '@/hooks/use-toast';

interface RecycleBinParams {
  page: number;
  limit: number;
  search?: string;
}

export function useRecycleBinQuery(params: RecycleBinParams) {
  return useQuery<PaginatedResponse<RecycleMediaItem>, Error>({
    queryKey: queryKeys.recycle.list(params),
    queryFn: async () => {
      const response = await AdminMediaService.getRecycleBin(params);
      if (!response.success) {
        throw new Error(response.message || '获取回收站数据失败');
      }
      return response;
    },
    staleTime: 60 * 1000,
  });
}

export function usePendingCleanupQuery(limit: number = 50) {
  return useQuery<
    {
      items: PendingCleanupItem[];
      pagination: { limit: number; total: number };
    },
    Error
  >({
    queryKey: queryKeys.recycle.pending(limit),
    queryFn: async () => {
      const response = await AdminMediaService.getPendingCleanup(limit);
      if (!response.success) {
        throw new Error(response.message || '获取待硬删媒体失败');
      }
      return {
        items: response.data ?? [],
        pagination: {
          limit: response.pagination?.limit ?? limit,
          total: response.pagination?.total ?? 0,
        },
      };
    },
    staleTime: 5 * 60 * 1000,
  });
}

export function useRestoreRecycleMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (mediaIds: string[]) => {
      const response = await AdminMediaService.restoreMedia(mediaIds);
      if (!response.success) {
        throw new Error(response.message || '恢复失败');
      }
      return response;
    },
    onSuccess: (_, mediaIds) => {
      toast({
        title: '恢复成功',
        description: `已从回收站恢复 ${mediaIds.length} 个媒体`,
      });
      queryUtils.invalidateRecycle();
      queryUtils.invalidateMedia();
    },
    onError: (error: Error) => {
      toast({
        title: '恢复失败',
        description: error.message || '无法恢复所选媒体',
        variant: 'destructive',
      });
    },
  });
}

export function useHardDeleteRecycleMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (params: {
      mediaIds: string[];
      reason?: string;
      createBackup?: boolean;
    }) => {
      const response = await AdminMediaService.hardDeleteMedia(
        params.mediaIds,
        {
          reason: params.reason,
          createBackup: params.createBackup,
        },
      );
      if (!response.success) {
        throw new Error(response.message || '彻底删除失败');
      }
      return response.data as DeletionSummary;
    },
    onSuccess: (summary, variables) => {
      toast({
        title: '彻底删除完成',
        description: `请求 ${variables.mediaIds.length} 个，成功 ${summary?.successfulDeletions ?? 0} 个`,
      });
      queryUtils.invalidateRecycle();
      queryUtils.invalidateMedia();
    },
    onError: (error: Error) => {
      toast({
        title: '彻底删除失败',
        description: error.message || '无法彻底删除所选媒体',
        variant: 'destructive',
      });
    },
  });
}

export function useCleanupRecycleMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (options: {
      limit?: number;
      reason?: string;
      createBackup?: boolean;
    }) => {
      const response = await AdminMediaService.cleanupRecycleBin(options);
      if (!response.success) {
        throw new Error(response.message || '执行清理任务失败');
      }
      return response.data as DeletionSummary;
    },
    onSuccess: (summary) => {
      toast({
        title: '清理任务完成',
        description: `成功硬删 ${summary?.successfulDeletions ?? 0} 个媒体`,
      });
      queryUtils.invalidateRecycle();
      queryUtils.invalidateMedia();
    },
    onError: (error: Error) => {
      toast({
        title: '清理任务失败',
        description: error.message || '无法执行回收站清理',
        variant: 'destructive',
      });
    },
  });
}
