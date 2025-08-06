import { useQuery, useMutation, useInfiniteQuery, useQueryClient } from '@tanstack/react-query';
import { UploadRecordService } from '@/services/upload-record.service';
import { UploadFilters, UploadRecord } from '@/types/upload-record';
import { useToast } from '@/hooks/use-toast';

// 上传记录查询键工厂
export const uploadRecordQueryKeys = {
  all: ['upload-records'] as const,
  lists: () => [...uploadRecordQueryKeys.all, 'list'] as const,
  list: (filters: UploadFilters) => [...uploadRecordQueryKeys.lists(), filters] as const,
  infinite: (filters: UploadFilters) => [...uploadRecordQueryKeys.all, 'infinite', filters] as const,
  stats: () => [...uploadRecordQueryKeys.all, 'stats'] as const,
  detail: (id: string) => [...uploadRecordQueryKeys.all, 'detail', id] as const,
} as const;

// 无限滚动获取上传记录
export function useInfiniteUploadRecords(filters: UploadFilters, pageSize: number = 20) {
  return useInfiniteQuery({
    queryKey: uploadRecordQueryKeys.infinite(filters),
    queryFn: async ({ pageParam = 0 }) => {
      const response = await UploadRecordService.getRecords({
        ...filters,
        page: pageParam,
        limit: pageSize,
      });
      return response;
    },
    getNextPageParam: (lastPage, pages) => {
      return lastPage.hasMore ? pages.length : undefined;
    },
    initialPageParam: 0,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// 获取上传统计数据
export function useUploadStats() {
  return useQuery({
    queryKey: uploadRecordQueryKeys.stats(),
    queryFn: async () => {
      const response = await UploadRecordService.getStats();
      return response;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
    gcTime: 1000 * 60 * 15, // 15 minutes
  });
}

// 获取单个上传记录详情
export function useUploadRecord(id: string) {
  return useQuery({
    queryKey: uploadRecordQueryKeys.detail(id),
    queryFn: async () => {
      const response = await UploadRecordService.getRecord(id);
      return response;
    },
    enabled: !!id,
    staleTime: 1000 * 60 * 2, // 2 minutes
    gcTime: 1000 * 60 * 10, // 10 minutes
  });
}

// 删除上传记录
export function useDeleteUploadRecordMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordId: string) => {
      return await UploadRecordService.deleteRecord(recordId);
    },
    onSuccess: (data, recordId) => {
      toast({
        title: '删除成功',
        description: '上传记录已删除',
      });

      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: uploadRecordQueryKeys.all });
    },
    onError: (error) => {
      toast({
        title: '删除失败',
        description: error instanceof Error ? error.message : '删除上传记录失败',
        variant: 'destructive',
      });
    },
  });
}

// 批量删除上传记录
export function useBatchDeleteUploadRecordsMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (recordIds: string[]) => {
      return await UploadRecordService.batchDeleteRecords(recordIds);
    },
    onSuccess: (data, recordIds) => {
      toast({
        title: '批量删除成功',
        description: `已删除 ${recordIds.length} 条上传记录`,
      });

      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: uploadRecordQueryKeys.all });
    },
    onError: (error) => {
      toast({
        title: '批量删除失败',
        description: error instanceof Error ? error.message : '批量删除上传记录失败',
        variant: 'destructive',
      });
    },
  });
}

// 重新提交上传记录
export function useResubmitUploadRecordMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { recordId: string; metadata?: any }) => {
      return await UploadRecordService.resubmitRecord(params.recordId, params.metadata);
    },
    onSuccess: (data, variables) => {
      toast({
        title: '重新提交成功',
        description: '文件已重新提交审核',
      });

      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: uploadRecordQueryKeys.all });
    },
    onError: (error) => {
      toast({
        title: '重新提交失败',
        description: error instanceof Error ? error.message : '重新提交失败',
        variant: 'destructive',
      });
    },
  });
}

// 更新上传记录元数据
export function useUpdateUploadRecordMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { recordId: string; updates: Partial<UploadRecord> }) => {
      return await UploadRecordService.updateRecord(params.recordId, params.updates);
    },
    onSuccess: (data, variables) => {
      toast({
        title: '更新成功',
        description: '上传记录已更新',
      });

      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: uploadRecordQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: uploadRecordQueryKeys.detail(variables.recordId) });
    },
    onError: (error) => {
      toast({
        title: '更新失败',
        description: error instanceof Error ? error.message : '更新上传记录失败',
        variant: 'destructive',
      });
    },
  });
}

// 查询工具函数
export const uploadRecordQueryUtils = {
  // 使所有上传记录查询失效
  invalidateAll: (queryClient: any) =>
    queryClient.invalidateQueries({ queryKey: uploadRecordQueryKeys.all }),

  // 使上传记录列表失效
  invalidateLists: (queryClient: any) =>
    queryClient.invalidateQueries({ queryKey: uploadRecordQueryKeys.lists() }),

  // 使统计数据失效
  invalidateStats: (queryClient: any) =>
    queryClient.invalidateQueries({ queryKey: uploadRecordQueryKeys.stats() }),

  // 使特定记录详情失效
  invalidateRecord: (queryClient: any, recordId: string) =>
    queryClient.invalidateQueries({ queryKey: uploadRecordQueryKeys.detail(recordId) }),

  // 手动设置统计数据
  setStats: (queryClient: any, data: any) =>
    queryClient.setQueryData(uploadRecordQueryKeys.stats(), data),

  // 手动更新记录
  updateRecord: (queryClient: any, recordId: string, updates: Partial<UploadRecord>) => {
    queryClient.setQueryData(
      uploadRecordQueryKeys.detail(recordId),
      (oldData: any) => oldData ? { ...oldData, ...updates } : oldData
    );
  },
};