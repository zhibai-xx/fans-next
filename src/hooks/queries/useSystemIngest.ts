import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { systemIngestService } from '@/services/system-ingest.service';
import { useToast } from '@/hooks/use-toast';

// 系统导入查询键
export const systemIngestQueryKeys = {
  all: ['system-ingest'] as const,
  scan: () => [...systemIngestQueryKeys.all, 'scan'] as const,
  files: (userId?: string, page?: number, limit?: number) =>
    [...systemIngestQueryKeys.all, 'files', userId, page, limit] as const,
};

// 扫描系统导入目录
export function useScanSystemIngestFiles() {
  return useQuery({
    queryKey: systemIngestQueryKeys.scan(),
    queryFn: async () => {
      return systemIngestService.scanFiles();
    },
    enabled: false,
    staleTime: 1000 * 60 * 5,
    gcTime: 1000 * 60 * 10,
  });
}

// 获取指定用户的文件（当前返回空列表，仅用于占位）
export function useSystemIngestUserFiles(userId?: string, page = 0, limit = 20) {
  return useQuery({
    queryKey: systemIngestQueryKeys.files(userId, page, limit),
    queryFn: async () => {
      if (!userId) {
        return { files: [], total: 0 };
      }
      return systemIngestService.getUserFiles(userId, page, limit);
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2,
    gcTime: 1000 * 60 * 10,
  });
}

// 批量上传
export function useBatchUploadMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      files: Array<{ id: string; path: string; name: string; userId?: string }>;
      onProgress?: (progress: { completed: number; total: number; current?: string }) => void;
    }) => {
      return systemIngestService.batchUpload(params.files, params.onProgress);
    },
    onSuccess: (data) => {
      const successCount = data.results.filter((item) => item.success).length;
      toast({
        title: '批量上传完成',
        description: `成功上传 ${successCount}/${data.results.length} 个文件`,
      });
      queryClient.invalidateQueries({ queryKey: systemIngestQueryKeys.all });
    },
    onError: (error) => {
      toast({
        title: '批量上传失败',
        description: error instanceof Error ? error.message : '批量上传过程中发生错误',
        variant: 'destructive',
      });
    },
  });
}

// 单个文件上传
export function useUploadSingleFileMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: { filePath: string; fileName: string; metadata?: any }) => {
      return systemIngestService.uploadSingle(params.filePath, params.fileName, params.metadata);
    },
    onSuccess: (data, variables) => {
      if (data.success) {
        toast({
          title: '文件上传成功',
          description: `${variables.fileName} 已成功上传`,
        });
      } else {
        toast({
          title: '文件上传失败',
          description: data.error || '上传过程中发生错误',
          variant: 'destructive',
        });
      }
      queryClient.invalidateQueries({ queryKey: systemIngestQueryKeys.all });
    },
    onError: (error) => {
      toast({
        title: '文件上传失败',
        description: error instanceof Error ? error.message : '上传过程中发生错误',
        variant: 'destructive',
      });
    },
  });
}

// 删除文件
export function useDeleteFileMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (filePath: string) => {
      return systemIngestService.deleteFile(filePath);
    },
    onSuccess: () => {
      toast({
        title: '文件删除成功',
        description: '文件已从服务器删除',
      });
      queryClient.invalidateQueries({ queryKey: systemIngestQueryKeys.all });
    },
    onError: (error) => {
      toast({
        title: '文件删除失败',
        description: error instanceof Error ? error.message : '删除过程中发生错误',
        variant: 'destructive',
      });
    },
  });
}

// 预览
export function usePreviewFileMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (fileId: string) => {
      return systemIngestService.previewFile(fileId);
    },
    onError: (error) => {
      toast({
        title: '预览失败',
        description: error instanceof Error ? error.message : '无法预览该文件',
        variant: 'destructive',
      });
    },
  });
}

// 查询工具
export const systemIngestQueryUtils = {
  invalidateAll: (queryClient: any) =>
    queryClient.invalidateQueries({ queryKey: systemIngestQueryKeys.all }),
  invalidateScan: (queryClient: any) =>
    queryClient.invalidateQueries({ queryKey: systemIngestQueryKeys.scan() }),
  invalidateUserFiles: (queryClient: any, userId?: string) =>
    queryClient.invalidateQueries({
      queryKey: userId ? systemIngestQueryKeys.files(userId) : systemIngestQueryKeys.all,
    }),
  setScanResult: (queryClient: any, data: any) =>
    queryClient.setQueryData(systemIngestQueryKeys.scan(), data),
  setUserFiles: (queryClient: any, userId: string, page: number, limit: number, data: any) =>
    queryClient.setQueryData(systemIngestQueryKeys.files(userId, page, limit), data),
};
