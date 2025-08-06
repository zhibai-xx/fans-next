import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { weiboImportService } from '@/services/weibo-import.service';
import { useToast } from '@/hooks/use-toast';

// 微博导入查询键工厂
export const weiboImportQueryKeys = {
  all: ['weibo-import'] as const,
  scan: () => [...weiboImportQueryKeys.all, 'scan'] as const,
  files: (userId?: string, page?: number, limit?: number) =>
    [...weiboImportQueryKeys.all, 'files', userId, page, limit] as const,
  upload: (taskId: string) => [...weiboImportQueryKeys.all, 'upload', taskId] as const,
  progress: (taskId: string) => [...weiboImportQueryKeys.all, 'progress', taskId] as const,
} as const;

// 扫描微博文件
export function useScanWeiboFiles() {
  return useQuery({
    queryKey: weiboImportQueryKeys.scan(),
    queryFn: async () => {
      const response = await weiboImportService.scanFiles();
      return response;
    },
    enabled: false, // 手动触发
    staleTime: 1000 * 60 * 5, // 5分钟内不重新扫描
    gcTime: 1000 * 60 * 10, // 10分钟后清除缓存
  });
}

// 获取用户文件列表
export function useWeiboUserFiles(userId?: string, page: number = 0, limit: number = 20) {
  return useQuery({
    queryKey: weiboImportQueryKeys.files(userId, page, limit),
    queryFn: async () => {
      if (!userId) return { files: [], total: 0 };
      const response = await weiboImportService.getUserFiles(userId, page, limit);
      return response;
    },
    enabled: !!userId,
    staleTime: 1000 * 60 * 2, // 2分钟
    gcTime: 1000 * 60 * 10, // 10分钟
  });
}

// 批量上传文件
export function useBatchUploadMutation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (params: {
      files: Array<{ id: string; path: string; name: string }>;
      onProgress?: (progress: { completed: number; total: number; current?: string }) => void;
    }) => {
      const { files, onProgress } = params;
      return await weiboImportService.batchUpload(files, onProgress);
    },
    onSuccess: (data, variables) => {
      const successCount = data.results.filter(r => r.success).length;
      const totalCount = data.results.length;

      toast({
        title: '批量上传完成',
        description: `成功上传 ${successCount}/${totalCount} 个文件`,
      });

      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: weiboImportQueryKeys.all });
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
    mutationFn: async (params: {
      filePath: string;
      fileName: string;
      metadata?: any;
    }) => {
      return await weiboImportService.uploadSingle(params.filePath, params.fileName, params.metadata);
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

      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: weiboImportQueryKeys.all });
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
      return await weiboImportService.deleteFile(filePath);
    },
    onSuccess: (data, filePath) => {
      toast({
        title: '文件删除成功',
        description: `文件已从服务器删除`,
      });

      // 刷新相关查询
      queryClient.invalidateQueries({ queryKey: weiboImportQueryKeys.all });
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

// 预览文件
export function usePreviewFileMutation() {
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (filePath: string) => {
      return await weiboImportService.previewFile(filePath);
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

// 查询工具函数
export const weiboImportQueryUtils = {
  // 使所有微博导入查询失效
  invalidateAll: (queryClient: any) =>
    queryClient.invalidateQueries({ queryKey: weiboImportQueryKeys.all }),

  // 使扫描结果失效
  invalidateScan: (queryClient: any) =>
    queryClient.invalidateQueries({ queryKey: weiboImportQueryKeys.scan() }),

  // 使用户文件列表失效
  invalidateUserFiles: (queryClient: any, userId?: string) =>
    queryClient.invalidateQueries({
      queryKey: userId ? weiboImportQueryKeys.files(userId) : weiboImportQueryKeys.all
    }),

  // 手动设置扫描结果
  setScanResult: (queryClient: any, data: any) =>
    queryClient.setQueryData(weiboImportQueryKeys.scan(), data),

  // 手动设置用户文件
  setUserFiles: (queryClient: any, userId: string, page: number, limit: number, data: any) =>
    queryClient.setQueryData(weiboImportQueryKeys.files(userId, page, limit), data),
};