import { useMutation, useQuery } from '@tanstack/react-query';
import { uploadService } from '@/services/upload.service';
import { useToast } from '@/hooks/use-toast';
import { useUploadStore } from '@/store/upload.store';
import { queryUtils } from '@/lib/query-client';
import type { Tag, Category } from '@/types/upload';

// Upload-related query keys
export const uploadQueryKeys = {
  tags: ['upload', 'tags'] as const,
  categories: ['upload', 'categories'] as const,
  uploadRecords: (userId?: string) => ['upload', 'records', userId] as const,
};

// Get available tags
export const useUploadTags = () => {
  const setTags = useUploadStore(state => state.setTags);

  return useQuery<Tag[], Error>({
    queryKey: uploadQueryKeys.tags,
    queryFn: async () => {
      const response = await uploadService.getTags();
      if (response.tags) {
        setTags(response.tags);
        return response.tags;
      }
      return [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Get available categories
export const useUploadCategories = () => {
  const setCategories = useUploadStore(state => state.setCategories);

  return useQuery<Category[], Error>({
    queryKey: uploadQueryKeys.categories,
    queryFn: async () => {
      const response = await uploadService.getCategories();
      if (response.categories) {
        setCategories(response.categories);
        return response.categories;
      }
      return [];
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
};

// Create new tag mutation
export const useCreateTagMutation = () => {
  const { toast } = useToast();
  const setTags = useUploadStore(state => state.setTags);

  return useMutation({
    mutationFn: async (tagName: string) => {
      const response = await uploadService.createTag(tagName);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create tag');
      }
      return response.tag;
    },
    onSuccess: (newTag) => {
      toast({
        title: '标签创建成功',
        description: `标签 "${newTag.name}" 已创建`,
      });

      // Update local tags state
      const currentTags = useUploadStore.getState().tags;
      setTags([...currentTags, newTag]);

      // Invalidate tags query
      queryUtils.invalidateQuery(uploadQueryKeys.tags);
    },
    onError: (error: Error) => {
      toast({
        title: '标签创建失败',
        description: error.message || '创建标签时发生错误',
        variant: 'destructive',
      });
    },
  });
};

// Create new category mutation  
export const useCreateCategoryMutation = () => {
  const { toast } = useToast();
  const setCategories = useUploadStore(state => state.setCategories);

  return useMutation({
    mutationFn: async (categoryName: string) => {
      const response = await uploadService.createCategory(categoryName);
      if (!response.success) {
        throw new Error(response.message || 'Failed to create category');
      }
      return response.category;
    },
    onSuccess: (newCategory) => {
      toast({
        title: '分类创建成功',
        description: `分类 "${newCategory.name}" 已创建`,
      });

      // Update local categories state
      const currentCategories = useUploadStore.getState().categories;
      setCategories([...currentCategories, newCategory]);

      // Invalidate categories query
      queryUtils.invalidateQuery(uploadQueryKeys.categories);
    },
    onError: (error: Error) => {
      toast({
        title: '分类创建失败',
        description: error.message || '创建分类时发生错误',
        variant: 'destructive',
      });
    },
  });
};

// Batch upload mutation
export const useBatchUploadMutation = () => {
  const { toast } = useToast();
  const {
    setIsUploading,
    setUploadResults,
    setUploadTasks,
    clearAllData
  } = useUploadStore(state => ({
    setIsUploading: state.setIsUploading,
    setUploadResults: state.setUploadResults,
    setUploadTasks: state.setUploadTasks,
    clearAllData: state.clearAllData,
  }));

  return useMutation({
    mutationFn: async (files: Array<{
      file: File;
      title: string;
      description: string;
      tags: string[];
      category?: Category;
    }>) => {
      setIsUploading(true);

      // This would typically integrate with the fileUploader
      // For now, we'll simulate the process
      const results = await Promise.allSettled(
        files.map(async (fileData) => {
          // Simulate upload logic here
          // In practice, this would use fileUploader.uploadFile()
          return { mediaId: `media-${Date.now()}`, ...fileData };
        })
      );

      const successful = results.filter(r => r.status === 'fulfilled').length;
      const failed = results.filter(r => r.status === 'rejected').length;

      return {
        successful,
        failed,
        total: files.length,
        mediaIds: results
          .filter(r => r.status === 'fulfilled')
          .map(r => (r as PromiseFulfilledResult<any>).value.mediaId)
      };
    },
    onSuccess: (result) => {
      setUploadResults({
        completed: result.successful,
        failed: result.failed,
        total: result.total,
      });

      toast({
        title: '上传完成',
        description: `成功上传 ${result.successful} 个文件${result.failed > 0 ? `，失败 ${result.failed} 个` : ''}`,
        variant: result.failed > 0 ? 'destructive' : 'default',
      });

      // Invalidate related queries
      queryUtils.invalidateMedia();
    },
    onError: (error: Error) => {
      toast({
        title: '上传失败',
        description: error.message || '批量上传时发生错误',
        variant: 'destructive',
      });
    },
    onSettled: () => {
      setIsUploading(false);
    },
  });
};

// Upload progress tracking hook
export const useUploadProgress = () => {
  const uploadTasks = useUploadStore(state => state.uploadTasks);
  const isUploading = useUploadStore(state => state.isUploading);

  const totalProgress = uploadTasks.length > 0
    ? uploadTasks.reduce((sum, task) => sum + task.progress, 0) / uploadTasks.length
    : 0;

  const activeUploads = uploadTasks.filter(task =>
    ['calculating', 'uploading', 'merging'].includes(task.status)
  ).length;

  const completedUploads = uploadTasks.filter(task =>
    task.status === 'completed'
  ).length;

  const failedUploads = uploadTasks.filter(task =>
    task.status === 'failed'
  ).length;

  return {
    totalProgress: Math.round(totalProgress),
    activeUploads,
    completedUploads,
    failedUploads,
    isUploading,
    hasActiveUploads: activeUploads > 0,
    hasFailedUploads: failedUploads > 0,
  };
};

// Cleanup upload state hook
export const useUploadCleanup = () => {
  const clearAllData = useUploadStore(state => state.clearAllData);

  return {
    clearUploadData: clearAllData,
    resetUploadState: () => {
      clearAllData();
      // Also clear any ongoing file uploader tasks
      if (typeof window !== 'undefined') {
        // Clear any browser-stored upload state if needed
        localStorage.removeItem('upload-temp-data');
      }
    },
  };
};

// Upload statistics hook
export const useUploadStatistics = () => {
  const getUploadStatistics = useUploadStore(state => state.getUploadStatistics);

  return getUploadStatistics();
};