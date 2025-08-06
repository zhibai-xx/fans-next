import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AdminTagsService, Tag, Category, TagsCategoriesStats } from '@/services/admin-tags.service';
import { useToast } from '@/hooks/use-toast';

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

// ========================================
// 标签相关 Queries
// ========================================

// 获取所有标签
export const useTags = (search?: string) => {
  return useQuery<Tag[], Error>({
    queryKey: tagsQueryKeys.list(search),
    queryFn: async () => {
      return await AdminTagsService.getAllTags(search);
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
      return await AdminTagsService.getTagsCategoriesStats();
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
      return await AdminTagsService.getAllCategories(search);
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

  return useMutation({
    mutationFn: async (name: string) => {
      return await AdminTagsService.createTag({ name });
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
    onError: (error: any) => {
      toast({
        title: '创建失败',
        description: error.response?.data?.message || '创建标签时发生错误，请稍后重试',
        variant: 'destructive',
      });
    },
  });
};

// 更新标签
export const useUpdateTagMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, name }: { id: string; name: string }) => {
      return await AdminTagsService.updateTag(id, { name });
    },
    onSuccess: () => {
      toast({
        title: '更新成功',
        description: '标签已成功更新',
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
    },
    onError: (error: any) => {
      toast({
        title: '更新失败',
        description: error.response?.data?.message || '更新标签时发生错误，请稍后重试',
        variant: 'destructive',
      });
    },
  });
};

// 删除标签
export const useDeleteTagMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      return await AdminTagsService.deleteTag(id);
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
    onError: (error: any) => {
      toast({
        title: '删除失败',
        description: error.response?.data?.message || '删除时发生错误，请稍后重试',
        variant: 'destructive',
      });
    },
  });
};

// 批量删除标签
export const useBatchDeleteTagsMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      return await AdminTagsService.batchDeleteTags(ids);
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
    onError: (error: any) => {
      toast({
        title: '批量删除失败',
        description: error.response?.data?.message || '批量删除时发生错误，请稍后重试',
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

  return useMutation({
    mutationFn: async ({ name, description }: { name: string; description?: string }) => {
      return await AdminTagsService.createCategory({ name, description });
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
    onError: (error: any) => {
      toast({
        title: '创建失败',
        description: error.response?.data?.message || '创建分类时发生错误，请稍后重试',
        variant: 'destructive',
      });
    },
  });
};

// 更新分类
export const useUpdateCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async ({ id, name, description }: { id: string; name: string; description?: string }) => {
      return await AdminTagsService.updateCategory(id, { name, description });
    },
    onSuccess: () => {
      toast({
        title: '更新成功',
        description: '分类已成功更新',
      });

      // 使相关查询失效
      queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all });
    },
    onError: (error: any) => {
      toast({
        title: '更新失败',
        description: error.response?.data?.message || '更新分类时发生错误，请稍后重试',
        variant: 'destructive',
      });
    },
  });
};

// 删除分类
export const useDeleteCategoryMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (id: string) => {
      return await AdminTagsService.deleteCategory(id);
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
    onError: (error: any) => {
      toast({
        title: '删除失败',
        description: error.response?.data?.message || '删除分类时发生错误，请稍后重试',
        variant: 'destructive',
      });
    },
  });
};

// 批量删除分类
export const useBatchDeleteCategoriesMutation = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  return useMutation({
    mutationFn: async (ids: string[]) => {
      return await AdminTagsService.batchDeleteCategories(ids);
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
    onError: (error: any) => {
      toast({
        title: '批量删除失败',
        description: error.response?.data?.message || '批量删除分类时发生错误，请稍后重试',
        variant: 'destructive',
      });
    },
  });
};

// ========================================
// 查询工具函数
// ========================================

export const tagsQueryUtils = {
  invalidateAll: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: tagsQueryKeys.all });
  },
  invalidateList: (queryClient: any, search?: string) => {
    queryClient.invalidateQueries({ queryKey: tagsQueryKeys.list(search) });
  },
  invalidateStats: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: tagsQueryKeys.stats() });
  },
};

export const categoriesQueryUtils = {
  invalidateAll: (queryClient: any) => {
    queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.all });
  },
  invalidateList: (queryClient: any, search?: string) => {
    queryClient.invalidateQueries({ queryKey: categoriesQueryKeys.list(search) });
  },
};