import { useQuery, useMutation, useQueryClient, QueryClient } from '@tanstack/react-query';
import { AdminTagsService, Tag, Category, TagsCategoriesStats } from '@/services/admin-tags.service';
import { useToast } from '@/hooks/use-toast';
import { handleApiError } from '@/lib/utils/error-handler';
import type { ApiResponse } from '@/types/api';

// 标签和分类相关查询键
export const tagsQueryKeys = {
  all: ['tags'] as const,
  list: (search?: string) => [...tagsQueryKeys.all, 'list', search] as const,
  stats: () => [...tagsQueryKeys.all, 'stats'] as const,
} as const;

export const categoriesQueryKeys = {
  all: ['categories'] as const,
  list: (search?: string) => [...categoriesQueryKeys.all, 'list', search] as const,
} as const;

const getErrorDescription = (error: unknown, fallback: string): string => {
  return handleApiError(error, fallback);
};

// ========================================
// 标签相关 Queries
// ========================================

// 获取所有标签
export const useTags = (search?: string) => {
  return useQuery<Tag[], Error>({
    queryKey: tagsQueryKeys.list(search),
    queryFn: async () => {
      const response = await AdminTagsService.getAllTags(search);
      if (!response.success) {
        throw new Error(response.message || '获取标签列表失败');
      }
      return response.data ?? [];
    },
    staleTime: 1000 * 60 * 5, // 5分钟
    gcTime: 1000 * 60 * 10, // 10分钟
  });
};

// 获取标签和分类统计
export const useTagsCategoriesStats = () => {
  return useQuery<TagsCategoriesStats, Error>({
    queryKey: tagsQueryKeys.stats(),
    queryFn: async () => {
      const response = await AdminTagsService.getTagsCategoriesStats();
      if (!response.success || !response.data) {
        throw new Error(response.message || '获取标签统计失败');
      }
      return response.data;
    },
    staleTime: 1000 * 60 * 5, // 5分钟
    gcTime: 1000 * 60 * 10, // 10分钟
  });
};

// ========================================
// 分类相关 Queries
// ========================================

// 获取所有分类
export const useCategories = (search?: string) => {
  return useQuery<Category[], Error>({
    queryKey: categoriesQueryKeys.list(search),
    queryFn: async () => {
      const response = await AdminTagsService.getAllCategories(search);
      if (!response.success) {
        throw new Error(response.message || '获取分类列表失败');
      }
      return response.data ?? [];
    },
    staleTime: 1000 * 60 * 5, // 5分钟
    gcTime: 1000 * 60 * 10, // 10分钟
  });
};

// ========================================
// 标签相关 Mutations
// ========================================

// 创建标签
export const useCreateTagMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ApiResponse<Tag>, unknown, string>({
    mutationFn: async (name: string) => {
      return AdminTagsService.createTag({ name });
    },
    onSuccess: () => {
      toast({
        title: '创建成功',
        description: '标签已成功创建',
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.stats() });
    },
    onError: (error) => {
      toast({
        title: '创建失败',
        description: getErrorDescription(error, '创建标签时发生错误，请稍后重试'),
        variant: 'destructive',
      });
    },
  });
};

// 更新标签
export const useUpdateTagMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ApiResponse<Tag>, unknown, { id: string; name: string }>({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return AdminTagsService.updateTag(id, { name });
    },
    onSuccess: () => {
      toast({
        title: '更新成功',
        description: '标签已成功更新',
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
    },
    onError: (error) => {
      toast({
        title: '更新失败',
        description: getErrorDescription(error, '更新标签时发生错误，请稍后重试'),
        variant: 'destructive',
      });
    },
  });
};

// 删除标签
export const useDeleteTagMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ApiResponse<null>, unknown, string>({
    mutationFn: async (id: string) => {
      return AdminTagsService.deleteTag(id);
    },
    onSuccess: () => {
      toast({
        title: '删除成功',
        description: '标签已成功删除',
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.stats() });
    },
    onError: (error) => {
      toast({
        title: '删除失败',
        description: getErrorDescription(error, '删除时发生错误，请稍后重试'),
        variant: 'destructive',
      });
    },
  });
};

// 批量删除标签
export const useBatchDeleteTagsMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ApiResponse<null>, unknown, string[]>({
    mutationFn: async (ids: string[]) => {
      return AdminTagsService.batchDeleteTags(ids);
    },
    onSuccess: (_, ids) => {
      toast({
        title: '批量删除成功',
        description: `已成功删除 ${ids.length} 个标签`,
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.stats() });
    },
    onError: (error) => {
      toast({
        title: '批量删除失败',
        description: getErrorDescription(error, '批量删除时发生错误，请稍后重试'),
        variant: 'destructive',
      });
    },
  });
};

// ========================================
// 分类相关 Mutations
// ========================================

// 创建分类
export const useCreateCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ApiResponse<Category>, unknown, { name: string; description?: string }>({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      return AdminTagsService.createCategory({ name, description });
    },
    onSuccess: () => {
      toast({
        title: '创建成功',
        description: '分类已成功创建',
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.stats() });
    },
    onError: (error) => {
      toast({
        title: '创建失败',
        description: getErrorDescription(error, '创建分类时发生错误，请稍后重试'),
        variant: 'destructive',
      });
    },
  });
};

// 更新分类
export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ApiResponse<Category>, unknown, { id: string; name: string; description?: string }>({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      return AdminTagsService.updateCategory(id, { name, description });
    },
    onSuccess: () => {
      toast({
        title: '更新成功',
        description: '分类已成功更新',
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all });
    },
    onError: (error) => {
      toast({
        title: '更新失败',
        description: getErrorDescription(error, '更新分类时发生错误，请稍后重试'),
        variant: 'destructive',
      });
    },
  });
};

// 删除分类
export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ApiResponse<null>, unknown, string>({
    mutationFn: async (id: string) => {
      return AdminTagsService.deleteCategory(id);
    },
    onSuccess: () => {
      toast({
        title: '删除成功',
        description: '分类已成功删除',
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.stats() });
    },
    onError: (error) => {
      toast({
        title: '删除失败',
        description: getErrorDescription(error, '删除分类时发生错误，请稍后重试'),
        variant: 'destructive',
      });
    },
  });
};

// 批量删除分类
export const useBatchDeleteCategoriesMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation<ApiResponse<null>, unknown, string[]>({
    mutationFn: async (ids: string[]) => {
      return AdminTagsService.batchDeleteCategories(ids);
    },
    onSuccess: (_, ids) => {
      toast({
        title: '批量删除成功',
        description: `已成功删除 ${ids.length} 个分类`,
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all });
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.stats() });
    },
    onError: (error) => {
      toast({
        title: '批量删除失败',
        description: getErrorDescription(error, '批量删除分类时发生错误，请稍后重试'),
        variant: 'destructive',
      });
    },
  });
};

// ========================================
// 查询工具函数
// ========================================

export const tagsQueryUtils = {
  invalidateAll: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
  },
  invalidateList: (queryClient: QueryClient, search?: string) => {
    queryClient.invalidateQueries({ queryKey: tagsQueryKeys.list(search) });
  },
  invalidateStats: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: tagsQueryKeys.stats() });
  },
};

export const categoriesQueryUtils = {
  invalidateAll: (queryClient: QueryClient) => {
    queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all });
  },
  invalidateList: (queryClient: QueryClient, search?: string) => {
    queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.list(search) });
  },
};
